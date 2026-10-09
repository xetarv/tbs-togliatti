(() => {
  'use strict';
  try {

  const $ = id => document.getElementById(id);
  const canvas = $('game');
  const mini = $('minimap');
  const mctx = mini.getContext('2d');
  addEventListener('error',e=>{const el=$('toast');el.textContent='Ошибка 3D: '+e.message;el.classList.add('show');});
  if (!window.THREE) {
    $('overlayCopy').textContent = 'Не удалось загрузить локальную библиотеку 3D. Проверьте, что папка assets находится рядом с index.html.';
    $('startBtn').disabled = true;
    return;
  }

  const T = window.THREE;
  T.ColorManagement.legacyMode=false;
  const WORLD_W = 386, WORLD_H = 300, ROAD = 12.4;
  const roadsX = [26, 68, 110, 152, 194, 236, 278, 320, 362];
  const roadsZ = [30, 70, 110, 150, 190, 230, 270];
  function isParkBlock(i,j){return (i===3&&j===3)||(j===4&&i%2===0)||(i===5&&j===0)||(i>=6&&(i+j)%3===0)||(j===5&&i%3===1);}
  const missions = [
    {title:'Контур будущего', description:'Заберите модуль связи в центре ТБС и отвезите его инженерам Жигулёвской долины.', from:{x:26,z:30,name:'Центр ТБС'}, to:{x:110,z:110,name:'Жигулёвская долина'}, reward:1200},
    {title:'Письмо над Волгой', description:'Получите дрон К-50 на площадке НПЦ БАС и отправьте груз к набережной Волги.', from:{x:194,z:30,name:'НПЦ БАС • ТБС'}, to:{x:68,z:30,name:'Набережная Волги'}, reward:1800},
    {title:'Город на связи', description:'Заберите батарею у АВТОВАЗа и доставьте её обратно в центр ТБС.', from:{x:194,z:150,name:'АВТОВАЗ'}, to:{x:26,z:30,name:'Центр ТБС'}, reward:2400}
  ];
  const keys = Object.create(null);
  const player = {x:68,z:30,a:-Math.PI/2,speed:0,battery:100,slip:0};
  let mode='intro', missionIndex=0, stage=0, deliveries=0, credits=0, elapsed=0, last=0, toastTimer=0, launchEffect=0;

  const renderer = new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  const lowPower=matchMedia('(pointer:coarse)').matches || innerWidth<700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower?1.15:1.75));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.physicallyCorrectLights=true;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color(0x091827);
  scene.fog = new T.FogExp2(0x91abb9,0.0022);
  const camera = new T.PerspectiveCamera(66,innerWidth/innerHeight,.1,550);
  camera.position.set(84,12,30);
  const ambientLight=new T.HemisphereLight(0xd7eaff,0x788078,1.9);scene.add(ambientLight);
  const sun = new T.DirectionalLight(0xffd4a6,2.2);
  sun.position.set(-35,62,40);
  sun.castShadow=true;
  sun.shadow.mapSize.set(lowPower?1024:2048,lowPower?1024:2048);
  sun.shadow.normalBias=.035;
  sun.shadow.camera.left=-52;sun.shadow.camera.right=52;
  sun.shadow.camera.top=52;sun.shadow.camera.bottom=-52;
  sun.shadow.camera.near=1;sun.shadow.camera.far=150;
  sun.shadow.bias=-.0004;
  scene.add(sun);
  scene.add(sun.target);
  const blueLight = new T.DirectionalLight(0x43c9e6,.24);
  blueLight.position.set(70,32,-50);
  scene.add(blueLight);

  const sky = new T.Mesh(new T.SphereGeometry(430,32,16),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,fog:false,
    uniforms:{skyTime:{value:0},daylight:{value:1}},
    vertexShader:'varying vec3 vDir; void main(){vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`
      varying vec3 vDir;uniform float skyTime;uniform float daylight;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float cloud(vec2 p){float n=0.,a=.55;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.03+13.7;a*=.5;}return n;}
      void main(){vec3 d=normalize(vDir);float h=d.y;
        vec3 color=mix(vec3(.72,.65,.56),vec3(.32,.53,.72),smoothstep(-.05,.32,h));
        color=mix(color,vec3(.07,.22,.43),smoothstep(.25,.95,h));
        float glow=pow(max(dot(d,normalize(vec3(-35.,62.,40.))),0.),24.);color+=vec3(.6,.32,.12)*glow;
        vec2 p=d.xz/max(h,.09)*1.4+vec2(skyTime*.009,skyTime*.004);
        float n=cloud(p),coverage=smoothstep(.48,.74,n)*smoothstep(.06,.2,h);
        vec3 clouds=mix(vec3(.60,.66,.71),vec3(.95,.93,.86),smoothstep(.53,.78,n));
        color=mix(color,clouds,coverage*.88);
        vec3 night=mix(vec3(.035,.065,.12),vec3(.005,.012,.04),smoothstep(0.,.6,h));
        night=mix(night,vec3(.07,.09,.14),coverage*.7);
        vec2 starCell=d.xz/max(h,.07)*110.;float star=step(.995,hash(floor(starCell)))*(1.-smoothstep(.04,.19,length(fract(starCell)-.5)));
        night+=vec3(.6,.72,.9)*star*smoothstep(.08,.3,h)*(1.-coverage);
        float evening=1.-abs(daylight*2.-1.);color+=vec3(.32,.07,0.)*evening*(1.-smoothstep(.05,.48,h));
        color=mix(night,color,daylight);gl_FragColor=vec4(color,1.0);
      }`
  }));
  scene.add(sky);
  const duskSun=new T.Mesh(new T.SphereGeometry(8,20,12),new T.MeshBasicMaterial({color:0xffa676,fog:false,depthWrite:false}));
  duskSun.position.set(-160,283,183);scene.add(duskSun);
  // A prefiltered sky lights glass and paint without network resources.
  const environmentScene=new T.Scene();environmentScene.add(sky.clone());
  const pmrem=new T.PMREMGenerator(renderer);
  const environmentMap=pmrem.fromScene(environmentScene,.05,.1,500);
  scene.environment=environmentMap.texture;pmrem.dispose();

  const mat = (color,metalness=0,roughness=.8,emissive=0x000000) => new T.MeshStandardMaterial({color,metalness,roughness,emissive,envMapIntensity:.45});
  const dark=mat(0x142733,.22,.72), roadMat=mat(0x192b34,.08,.93), curbMat=mat(0x31505a,.08,.83),
        cyanMat=mat(0x47e6e0,.12,.27,0x148c8b), orangeMat=mat(0xff4808,.2,.34,0xa32c0c),
        whiteMat=mat(0xdcebf0,.24,.42), glassMat=mat(0x16445d,.68,.18,0x071a28),
        tireMat=mat(0x101820,.08,.95), laneMat=new T.MeshBasicMaterial({color:0xaabac0}),
        grassMat=mat(0x173730), roofMat=mat(0x203945,.12,.76);
  const trimMat=mat(0x5d7e87,.48,.35);
  const unitBox = new T.BoxGeometry(1,1,1);
  const unitPlane = new T.PlaneGeometry(1,1);
  function box(parent,x,y,z,w,h,d,material){const o=new T.Mesh(unitBox,material);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o}
  function flat(parent,x,y,z,w,d,material){if(material.userData.paving)material=pavingSurface(w,d);const o=new T.Mesh(unitPlane,material);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.scale.set(w,d,1);o.receiveShadow=true;parent.add(o);return o}

  function makeTexture(draw,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
  const visualAssets=window.createTBSVisualAssets(T,renderer);
  const asphaltTexture=makeTexture((p,w,h)=>{
    let seed=637;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    p.fillStyle='#abb1b2';p.fillRect(0,0,w,h);
    for(let i=0;i<90;i++){p.fillStyle=i%2?'#37404708':'#d7d9cf09';p.beginPath();p.ellipse(random()*w,random()*h,8+random()*45,8+random()*35,random()*3,0,Math.PI*2);p.fill();}
    for(let i=0;i<18000;i++){
      const x=random()*w,y=random()*h;p.fillStyle=i%3===0?'#606c7060':i%3===1?'#ecf1ed45':'#202c3540';
      p.fillRect(x,y,.5+random()*1.7,.5+random()*1.7);
    }
  },512,512);
  function roadSurface(w,d){return visualAssets.material('asphalt',w,d)}
  const waterTexture=makeTexture((p,w,h)=>{
    p.fillStyle='#7595a1';p.fillRect(0,0,w,h);
    for(let i=0;i<95;i++){
      const y=i*1.37;p.strokeStyle=i%3===0?'#c2d9dc28':'#405e6e25';p.lineWidth=1;
      p.beginPath();for(let x=0;x<=w;x+=6){const wave=y+Math.sin(x*.07+i*.55)*.8;x?p.lineTo(x,wave):p.moveTo(x,wave)}p.stroke();
    }
  },512,128);
  waterTexture.repeat.set(7,1);
  function imageTexture(file){const source=window.TBS_EMBEDDED?.[file] || 'assets/'+file;const tex=new T.TextureLoader().load(source,t=>{for(const callback of t.userData.onReady||[])callback();t.userData.onReady=[];});tex.userData.onReady=[];tex.encoding=T.sRGBEncoding;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex}
  const markTexture=imageTexture('cropped-fav-tb_drone-192x192.png');
  const droneTexture=imageTexture('home-sec3-img__1-768x597.webp');
  const factoryTexture=imageTexture('tb-samara-hero-vid-poster.webp');
  const hangarTexture=imageTexture('tb-samara-mission-big-img.webp');

  const pavingTexture=makeTexture((p,w,h)=>{
    p.fillStyle='#b8b9b2';p.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=32)for(let x=-64;x<w;x+=64){
      const offset=(y/32)%2*32,shade=166+((x/64*7+y/32*3+99)%7)*5;
      p.fillStyle='rgb('+shade+','+(shade+3)+','+(shade-2)+')';p.fillRect(x+offset+2,y+2,60,28);
      p.fillStyle='#ffffff30';p.fillRect(x+offset+2,y+2,60,1);
    }
  });pavingTexture.repeat.set(4,4);
  const pavingMat=new T.MeshStandardMaterial({map:pavingTexture,color:0xb7bec0,roughness:.92});
  pavingMat.userData.paving=true;
  const pavingSurfaces=new Map();
  function pavingSurface(w,d){
    const key=w.toFixed(2)+':'+d.toFixed(2);if(pavingSurfaces.has(key))return pavingSurfaces.get(key);
    const texture=pavingTexture.clone();texture.repeat.set(w/8,d/8);texture.needsUpdate=true;
    const material=new T.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.025,color:0xb7bec0,roughness:.92});pavingSurfaces.set(key,material);return material;
  }
  const facadeMaterials=Array.from({length:6},(_,seed)=>{
    const texture=makeTexture((p,w,h)=>{
      p.fillStyle=['#73818a','#495967','#a5aaa6','#596b75','#879798','#647485'][seed];p.fillRect(0,0,w,h);
      for(let y=0;y<h;y+=128)for(let x=0;x<w;x+=128){
        p.fillStyle='#182d3c';p.fillRect(x+15,y+17,98,89);
        const n=(x/128*17+y/128*31+seed*13)%11;
        const g=p.createLinearGradient(x,y,x+98,y+89);
        g.addColorStop(0,n<2?'#c7ab78':'#708f9d');g.addColorStop(.5,n<2?'#a78758':'#3d606f');g.addColorStop(1,'#1d394b');
        p.fillStyle=g;p.fillRect(x+19,y+21,90,81);
        p.fillStyle='#b8c9cc80';p.fillRect(x+19,y+21,90,2);
        p.fillStyle='#243d48';p.fillRect(x+61,y+21,3,81);
        p.fillStyle='#192a3470';p.fillRect(x+19,y+67,90,2);
        p.fillStyle='#142b3b55';p.fillRect(x+19,y+21,90,10+n*2);
        p.fillStyle='#192a3440';p.fillRect(x,y+122,128,6);
        p.fillStyle='#ffffff20';p.fillRect(x,y+120,128,2);
      }
    },512,512);
    return texture;
  });
  const nightWindows=[];
  const windowGlow=makeTexture((p,w,h)=>{
    p.fillStyle='#000000';p.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=128)for(let x=0;x<w;x+=128)if((x/128+y/128*3)%3!==0){
      p.fillStyle=(x+y)%256===0?'#ffe0a6':'#a6d9ff';p.fillRect(x+19,y+31,90,71);
      p.fillStyle='#000000';p.fillRect(x+61,y+31,3,71);p.fillRect(x+19,y+67,90,3);
    }
  },512,512);
  const districtFacadeTextures=new Map();
  const facadeRelief=makeTexture((c,w,h)=>{c.fillStyle='#c8c8c8';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=128)for(let x=0;x<w;x+=128){c.fillStyle='#747474';c.fillRect(x+14,y+16,100,92);c.fillStyle='#555555';c.fillRect(x+19,y+21,90,81);c.fillStyle='#aaaaaa';c.fillRect(x+61,y+21,3,81);c.fillRect(x+19,y+67,90,2);}},512,512);facadeRelief.encoding=T.LinearEncoding;
  const facadeRoughness=makeTexture((c,w,h)=>{c.fillStyle='#eeeeee';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=128)for(let x=0;x<w;x+=128){c.fillStyle='#484848';c.fillRect(x+19,y+21,90,81);c.fillStyle='#bbbbbb';c.fillRect(x+61,y+21,3,81);c.fillRect(x+19,y+67,90,2);}},512,512);facadeRoughness.encoding=T.LinearEncoding;
  function facade(parent,x,y,z,width,height,angle,seed,style='office'){
    const upgraded=x<240&&z<200&&scene.userData.quarterMaterials;
    let source=facadeMaterials[seed%6];
    if(upgraded){
      const key=style+':'+seed%6;
      if(!districtFacadeTextures.has(key))districtFacadeTextures.set(key,makeTexture((c,w,h)=>{
        const surface=style==='residential'?masonryTextures[seed%3]:scene.userData.quarterMaterials.stone.map;
        c.drawImage(surface.image,0,0,w,h);
        for(let y=0;y<h;y+=128)for(let x=0;x<w;x+=128){c.drawImage(source.image,x+15,y+17,98,89,x+15,y+17,98,89);c.fillStyle='#403b3024';c.fillRect(x+13,y+107,104,5);c.fillStyle='#e8e3cd60';c.fillRect(x+12,y+104,106,2);}
      },512,512));
      source=districtFacadeTextures.get(key);
    }
    const tex=source.clone();tex.repeat.set(Math.max(1,Math.round(width/2.8))/4,Math.max(1,Math.round(height/2.8))/4);tex.needsUpdate=true;
    const glow=windowGlow.clone();glow.repeat.copy(tex.repeat);glow.needsUpdate=true;
    const material=new T.MeshStandardMaterial({map:tex,metalness:.32,roughness:.38,envMapIntensity:.7,emissive:0xffffff,emissiveMap:glow,emissiveIntensity:0});nightWindows.push(material);
    if(upgraded){
      material.bumpMap=facadeRelief.clone();material.roughnessMap=facadeRoughness.clone();for(const map of [material.bumpMap,material.roughnessMap]){map.repeat.copy(tex.repeat);map.needsUpdate=true;}
      material.bumpScale=.045;material.roughness=.9;material.metalness=.08;material.envMapIntensity=.65;
      scene.userData.upgradedFacades=(scene.userData.upgradedFacades||0)+1;
    }
    const surface=new T.Mesh(new T.PlaneGeometry(width,height),material);
    surface.position.set(x,y,z);surface.rotation.y=angle;surface.receiveShadow=true;parent.add(surface);
  }
  // The original bitmap is mapped directly onto a plane of the same aspect ratio.
  // Text and branding live on separate plaques; photographs are never recomposed.
  const photoPanels=[];
  function architecturalPanel(parent,x,y,z,width,height,angle,photo,title,subtitle){
    const panel=new T.Group();panel.position.set(x,y,z);panel.rotation.y=angle;parent.add(panel);
    const frame=box(panel,0,0,0,1,1,.24,dark);
    const rim=box(panel,0,0,.13,1,1,.06,trimMat);
    const face=new T.Mesh(unitPlane,new T.MeshBasicMaterial({map:photo,toneMapped:false}));
    face.position.z=.17;panel.add(face);
    const hood=box(panel,0,0,.22,1,.1,.65,roofMat);hood.castShadow=true;
    function fit(){
      const img=photo.image;if(!img?.naturalWidth)return;
      const ratio=img.naturalWidth/img.naturalHeight;
      const pw=Math.min(width,height*ratio),ph=pw/ratio;
      face.scale.set(pw,ph,1);frame.scale.set(pw+.32,ph+.32,.24);rim.scale.set(pw+.10,ph+.10,.06);
      hood.position.y=ph/2+.23;hood.scale.x=pw+.65;
      panel.userData={sourceAspect:ratio,displayAspect:pw/ph};
    }
    if(photo.image?.complete)fit();else photo.userData.onReady.push(fit);
    photoPanels.push(panel);
    return panel;
  }
  const glowTexture=makeTexture((p,w,h)=>{
    const g=p.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(126,255,237,.85)');g.addColorStop(.24,'rgba(80,220,231,.38)');g.addColorStop(1,'rgba(80,220,231,0)');
    p.fillStyle=g;p.fillRect(0,0,w,h);
  },128,128);
  glowTexture.wrapS=glowTexture.wrapT=T.ClampToEdgeWrapping;
  const crosswalkMat=new T.MeshBasicMaterial({color:0x9bb9bc,transparent:true,opacity:.58,depthWrite:false});
  const leafMats=[mat(0x47784c),mat(0x567e50),mat(0x6b884c)];
  const cityLeafTexture=makeTexture((p,w,h)=>{
    for(let n=0;n<9;n++){
      p.save();p.translate(w*.5+Math.sin(n*2.4)*w*.28,h*.16+n*h*.083);p.rotate(n*1.7);
      const g=p.createLinearGradient(-18,-8,18,8);g.addColorStop(0,'#a1b36b');g.addColorStop(1,'#3f662e');p.fillStyle=g;
      p.beginPath();p.ellipse(0,0,19,7,0,0,Math.PI*2);p.fill();p.strokeStyle='#c1c48a';p.lineWidth=.8;p.beginPath();p.moveTo(-16,0);p.lineTo(16,0);p.stroke();p.restore();
    }
  },128,128);
  const cityLeafMaterials=[0x94ae69,0xb0ba86,0x648961].map(color=>new T.MeshStandardMaterial({map:cityLeafTexture,color,alphaTest:.42,side:T.DoubleSide,roughness:.92}));
  const barkMaterials=[mat(0x77604a),mat(0xb3afa0),mat(0x5e5943)];
  const branchGeometry=new T.CylinderGeometry(.75,1,1,7);
  const flags=[];
  const flagTexture=makeTexture((p,w,h)=>{p.fillStyle='#e5e9e4';p.fillRect(0,0,w,h);p.fillStyle='#ff4b09';p.fillRect(0,h-12,w,12);},512,300);
  function paintFlag(){const p=flagTexture.image.getContext('2d');p.drawImage(markTexture.image,160,40,190,190);flagTexture.needsUpdate=true;}
  if(markTexture.image?.complete)paintFlag();else markTexture.userData.onReady.push(paintFlag);
  let maglevTrain;
  const mooredBoats=[],waterfrontTerraces=[];
  const streetFixtures=[];
  function streetLight(x,z){
    const metal=mat(0x3b5965,.62,.32);
    const pole=new T.Mesh(new T.CylinderGeometry(.07,.11,5.5,8),metal);pole.position.set(x,2.9,z);scene.add(pole);
    box(scene,x-.65,5.57,z,1.45,.11,.1,metal);
    box(scene,x-1.25,5.48,z,.45,.11,.3,new T.MeshBasicMaterial({color:0xa5ffec}));
    const halo=sprite(scene,glowTexture,x-1.25,5.48,z,3.3,3.3,.1);
    const pool=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false}));
    pool.rotation.x=-Math.PI/2;pool.position.set(x-1.25,.19,z);scene.add(pool);
    streetFixtures.push({x:x-1.25,z,halo,pool});
  }
  function tree(x,z,seed,planterBox=true,natural=false){
    if(x>0&&x<WORLD_W&&z>19&&(z<24||(x<160&&z<112))){
      visualAssets.plant(scene,x,z,seed,.88);
      if(planterBox){box(scene,x,.3,z,2.5,.35,2.5,visualAssets.material('stone',2.5,.35));flat(scene,x,.485,z,2.26,2.26,grassMat);}
      return;
    }
    const type=seed%3,slender=type===1,height=slender?5.2:4.25,radius=slender?.95:1.65;
    const branches=new T.InstancedMesh(branchGeometry,barkMaterials[type],6),pose=new T.Object3D(),up=new T.Vector3(0,1,0);
    for(let n=0;n<6;n++){
      const a=n*2.399+seed,start=new T.Vector3(x,n?1.6+n*.22:.25,z),end=new T.Vector3(x+(n?Math.cos(a)*radius*.7:0),n?height-.6:height-.4,z+(n?Math.sin(a)*radius*.7:0)),delta=end.clone().sub(start);
      pose.position.copy(start.add(end).multiplyScalar(.5));pose.quaternion.setFromUnitVectors(up,delta.clone().normalize());pose.scale.set(n?.055:.15,delta.length(),n?.055:.15);pose.updateMatrix();branches.setMatrixAt(n,pose.matrix);
    }
    branches.castShadow=true;scene.add(branches);
    const count=natural?900:(lowPower?48:80),canopy=new T.InstancedMesh(natural?parkLeafGeometry:unitPlane,natural?parkLeafMaterial:cityLeafMaterials[type],count);
    for(let n=0;n<count;n++){
      const a=n*2.399+seed,r=Math.sqrt((n+.5)/count)*radius;
      pose.position.set(x+Math.cos(a)*r,height-.8+Math.sin(n*1.73)*(slender?1.2:.7),z+Math.sin(a)*r);
      pose.rotation.set(n*.73,n*1.17,n*.43);pose.scale.setScalar(natural?1.1+(n%5)*.12:.85+(n%5)*.09);pose.updateMatrix();canopy.setMatrixAt(n,pose.matrix);if(natural)canopy.setColorAt(n,new T.Color().setHSL(.22+(n%4)*.012,.42,.28+(n%9)*.018));
    }
    canopy.castShadow=true;canopy.receiveShadow=true;scene.add(canopy);
    if(planterBox){
      const planter=box(scene,x,.3,z,2.5,.35,2.5,curbMat);planter.receiveShadow=true;
      flat(scene,x,.485,z,2.26,2.26,grassMat);
    }
  }

  const parkLeafGeometry=new T.BufferGeometry();parkLeafGeometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.13,.18,0,0,.22,.045,.13,.18,0,0,.43,0],3));parkLeafGeometry.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]);parkLeafGeometry.computeVertexNormals();
  const parkLeafMaterial=new T.MeshStandardMaterial({color:0x5b793e,roughness:.9,side:T.DoubleSide});
  const parkWoodTexture=makeTexture((c,w,h)=>{c.fillStyle='#a67d51';c.fillRect(0,0,w,h);for(let n=0;n<110;n++){c.strokeStyle=n%2?'#f3d6a330':'#33231838';c.lineWidth=1;c.beginPath();for(let x=0;x<=w;x+=8){const y=n*13%h+Math.sin(x*.04+n)*1.4;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}},256,128);
  const parkWood=new T.MeshStandardMaterial({map:parkWoodTexture,roughness:.85,color:0xd4bd9b});
  const parkStoneTexture=makeTexture((c,w,h)=>{c.fillStyle='#686e68';c.fillRect(0,0,w,h);for(let row=0;row<8;row++)for(let col=-1;col<5;col++){const v=153+(row*19+col*11+110)%26,px=col*64+row%2*32,py=row*32;c.fillStyle=row%4===0?`rgb(${v-22},${v-16},${v-10})`:`rgb(${v+10},${v+7},${v})`;c.fillRect(px+1,py+1,62,30);c.fillStyle='#eee9d630';c.fillRect(px+2,py+2,60,1);}},256,256);
  const parkStoneHeight=makeTexture((c,w,h)=>{c.fillStyle='#4c4c4c';c.fillRect(0,0,w,h);c.fillStyle='#cccccc';for(let row=0;row<8;row++)for(let col=-1;col<5;col++)c.fillRect(col*64+row%2*32+1,row*32+1,62,30);},256,256);parkStoneHeight.encoding=T.LinearEncoding;
  const parkPavingCache=new Map();
  function parkPaving(w,d){const key=w+':'+d;if(parkPavingCache.has(key))return parkPavingCache.get(key);const map=parkStoneTexture.clone(),bump=parkStoneHeight.clone();for(const t of [map,bump]){t.repeat.set(w/4,d/4);t.needsUpdate=true;}const material=new T.MeshStandardMaterial({map,bumpMap:bump,bumpScale:.028,roughness:.9});parkPavingCache.set(key,material);return material;}
  function shrubBed(x,y,z,w,d,seed){
    const detailed=x<160&&z<160,count=detailed?1400:360;
    const leaves=new T.InstancedMesh(detailed?visualAssets.leaf:parkLeafGeometry,detailed?visualAssets.foliage:parkLeafMaterial,count),pose=new T.Object3D();
    for(let n=0;n<count;n++){const u=(n*.618034+seed*.13)%1,v=(n*.414214+seed*.17)%1;pose.position.set(x+(u-.5)*w,y+.1+Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.55,z+(v-.5)*d);pose.rotation.set(n*.73,n*1.21,n*.37);pose.scale.setScalar(detailed?.42+(n%5)*.06:.65+(n%5)*.13);pose.updateMatrix();leaves.setMatrixAt(n,pose.matrix);leaves.setColorAt(n,new T.Color().setHSL(.21+(n%7)*.009,.4,.3+(n%8)*.015));}
    leaves.castShadow=true;leaves.receiveShadow=true;scene.add(leaves);
    scene.userData.newShrubBeds=(scene.userData.newShrubBeds||0)+1;
  }
  function parkBench(x,y,z,width=2.7){
    for(let slat=0;slat<5;slat++)box(scene,x,y,z+slat*.145,width,.1,.115,parkWood).castShadow=true;
    for(let slat=0;slat<3;slat++)box(scene,x,y+.28+slat*.17,z+.64,width,.13,.11,parkWood).castShadow=true;
    for(const side of [-1,1]){box(scene,x+side*(width/2-.3),y-.24,z+.27,.12,.5,.75,trimMat);box(scene,x+side*(width/2-.12),y+.26,z+.25,.085,.55,.085,trimMat);box(scene,x+side*(width/2-.12),y+.52,z+.28,.1,.08,.68,trimMat);}
  }
  function gardenBed(x,z,w,d,seed){
    flat(scene,x,.41,z,w,d,grassMat);
    const count=lowPower?35:65,tufts=new T.InstancedMesh(unitPlane,cityLeafMaterials[seed%3],count),pose=new T.Object3D();
    for(let n=0;n<count;n++){
      const px=((n*.618033+seed*.13)%1-.5)*(w-.5),pz=((n*.414213+seed*.19)%1-.5)*(d-.5);
      pose.position.set(x+px,.65+(n%4)*.035,z+pz);pose.rotation.set(0,n*2.4,.15*Math.sin(n));pose.scale.set(.45,.5+(n%4)*.07,1);pose.updateMatrix();tufts.setMatrixAt(n,pose.matrix);
    }
    tufts.receiveShadow=true;scene.add(tufts);
    for(const side of [-1,1])box(scene,x+side*w/2,.51,z,.14,.25,d,curbMat);
  }

  function sprite(parent,texture,x,y,z,w,h,opacity=1){
    const o=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,opacity,depthWrite:false}));
    o.position.set(x,y,z);o.scale.set(w,h,1);parent.add(o);return o;
  }
  function signTexture(title,sub){
    const c=document.createElement('canvas');c.width=1024;c.height=256;
    const p=c.getContext('2d');
    p.fillStyle='#071826';p.fillRect(0,0,1024,256);
    p.strokeStyle='#ff4808';p.lineWidth=12;p.strokeRect(7,7,1010,242);
    p.fillStyle='#ff4808';p.fillRect(35,35,14,186);
    let fontSize=82;do{p.font='900 '+fontSize+'px Segoe UI, Arial';fontSize-=2;}while(p.measureText(title).width>910&&fontSize>30);
    p.fillStyle='#ffffff';p.textAlign='center';p.fillText(title,535,112);
    p.fillStyle='#b9e6ee';p.font='700 35px Segoe UI, Arial';p.fillText(sub,535,185,900);
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t;
  }
  function streetNameplate(x,z,width,angle,title){
    const texture=makeTexture((p,w,h)=>{
      p.fillStyle='#09202a';p.fillRect(0,0,w,h);p.fillStyle='#ff4b09';p.fillRect(0,h-8,w,8);
      let size=88;do{p.font='900 '+size+'px Segoe UI,Arial';size-=2;}while(p.measureText(title).width>w-64&&size>28);
      p.fillStyle='#ffffff';p.textAlign='center';p.textBaseline='middle';p.fillText(title,w/2,h*.48);
    },1024,128);
    const sign=new T.Mesh(new T.PlaneGeometry(width,width/8),new T.MeshBasicMaterial({map:texture,toneMapped:false,fog:false}));
    sign.position.set(x,2.4,z);sign.rotation.y=angle;scene.add(sign);
  }
  function city(){
    flat(scene,WORLD_W/2,-.16,WORLD_H/2,WORLD_W+650,WORLD_H+650,grassMat);
    // Distant architecture and the opposite bank give the city a horizon.
    const distantMat=mat(0x586777,.12,.8);
    for(let i=0;i<34;i++){
      const bx=-30+(i%17)*24,bz=i<17?WORLD_H+45:-110,height=12+(i*19%34);
      box(scene,bx,height/2,bz,10+(i%3)*3,height,11,distantMat);
      box(scene,bx,height+1,bz,5,2,6,roofMat);
      const width=10+(i%3)*3;
      box(scene,bx+width*.17,height+2.3,bz+1,width*.58,3.2,7,distantMat);
      for(let floor=1;floor<height/3;floor++){
        for(const side of [-1,1]){
          box(scene,bx,floor*3,bz+side*5.54,width-.8,1.2,.045,glassMat);
          box(scene,bx+side*(width/2+.025),floor*3,bz,.045,1.2,10,glassMat);
        }
      }
      for(let rib=0;rib<4;rib++)box(scene,bx-width*.4+rib*width*.267,height/2,bz+5.59,.19,height,.08,distantMat);
    }
    const hillsGeometry=new T.PlaneGeometry(WORLD_W+1100,240,140,32),hp=hillsGeometry.attributes.position,hc=[];
    for(let i=0;i<hp.count;i++){
      const px=hp.getX(i),depth=(hp.getY(i)+120)/240,rolling=13+8*Math.sin(px*.014)+5*Math.sin(px*.039+1.7)+2*Math.sin(px*.091);
      hp.setZ(i,Math.sin(Math.min(1,depth*1.5)*Math.PI/2)*rolling);
      const c=new T.Color().setHSL(.27,.12,.3+depth*.07+Math.sin(px*.049)*.025);hc.push(c.r,c.g,c.b);
    }
    hillsGeometry.setAttribute('color',new T.Float32BufferAttribute(hc,3));hillsGeometry.computeVertexNormals();
    const hills=new T.Mesh(hillsGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));hills.rotation.x=-Math.PI/2;hills.position.set(WORLD_W/2,0,-232);scene.add(hills);
    // Share the irregular bank contour between the terrain and water shader.
    const bankZ=x=>-62.5+2.2*Math.sin(x*.036)+1.1*Math.sin(x*.113);
    const waterFunctions=`
      float bankEdge(float x){return -62.5+2.2*sin(x*.036)+1.1*sin(x*.113);}
      float riverHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float riverNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(riverHash(i),riverHash(i+vec2(1,0)),f.x),mix(riverHash(i+vec2(0,1)),riverHash(i+vec2(1,1)),f.x),f.y);}
      float riverHeight(vec2 p,float t){
        float swell=sin(dot(p,vec2(.29,.17))-t*1.1)*.085+sin(dot(p,vec2(-.19,.42))+t*.83)*.055;
        float chop=sin(dot(p,vec2(1.7,-.83))+t*1.6+riverNoise(p*.28)*3.)*.018;
        return (swell+chop)*smoothstep(0.,3.,min(18.5-p.y,p.y-bankEdge(p.x)));}
    `;
    const waterMaterial=new T.MeshStandardMaterial({color:0x245861,metalness:.05,roughness:.17,envMapIntensity:1.25});
    waterMaterial.onBeforeCompile=shader=>{
      shader.uniforms.waveTime={value:0};waterMaterial.userData.shader=shader;
      shader.vertexShader='uniform float waveTime;varying vec3 vRiverWorld;\n'+waterFunctions+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 riverBase=(modelMatrix*vec4(position,1.)).xyz;
        transformed.z+=riverHeight(riverBase.xz,waveTime);
        vRiverWorld=(modelMatrix*vec4(transformed,1.)).xyz;`);
      shader.fragmentShader='uniform float waveTime;varying vec3 vRiverWorld;\n'+waterFunctions+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec2 p=vRiverWorld.xz;
        float h=riverHeight(p,waveTime);
        vec2 slope=vec2(riverHeight(p+vec2(.09,0),waveTime)-h,riverHeight(p+vec2(0,.09),waveTime)-h)/.09;
        float ripple=riverNoise(p*2.+vec2(waveTime*.3,-waveTime*.2));
        slope+=vec2(sin(p.x*7.+p.y*3.+waveTime*2.),cos(p.y*6.-p.x*4.+waveTime))*ripple*.016;
        normal=normalize(mat3(viewMatrix)*vec3(-slope.x,1.,-slope.y));`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float bankDistance=vRiverWorld.z-bankEdge(vRiverWorld.x);
        float shoreDistance=min(18.5-vRiverWorld.z,bankDistance);
        float shallow=1.-smoothstep(0.,8.,shoreDistance);
        float patches=riverNoise(vRiverWorld.xz*.36);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.14,.29,.22),shallow*.75);
        diffuseColor.rgb*=.9+patches*.18;
        float wash=.3+.22*sin(waveTime*1.25+vRiverWorld.x*.3);
        float foam=(1.-smoothstep(.08,.65,abs(shoreDistance-wash)))*smoothstep(.38,.72,riverNoise(vRiverWorld.xz*3.+waveTime*.16));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.8,.72),foam*.68);`);
    };
    const river=new T.Mesh(new T.PlaneGeometry(WORLD_W+1100,86,640,72),waterMaterial);
    river.rotation.x=-Math.PI/2;river.position.set(WORLD_W/2,.02,-24);scene.add(river);scene.userData.waterMaterial=waterMaterial;
    // Sloped gravel, damp sand and planted soil replace the flat bank strips.
    const bankGeometry=new T.BufferGeometry(),vertices=[],colors=[],indices=[];
    const bankColors=[0x555c4d,0x89866b,0xa59b78,0x76805a,0x526c46].map(c=>new T.Color(c));
    for(let i=0;i<=300;i++){
      const x=-550+i*(WORLD_W+1100)/300,z=bankZ(x);
      for(let j=0;j<5;j++){
        vertices.push(x,[-.24,.13,.55,1.1,.08][j],z-[0,1.2,3.8,8,24][j]);
        const c=bankColors[j].clone().multiplyScalar(.91+.12*Math.sin(i*3.71+j));colors.push(c.r,c.g,c.b);
        if(i<300&&j<4){const n=i*5+j;indices.push(n,n+1,n+5,n+1,n+6,n+5);}
      }
    }
    bankGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));bankGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));bankGeometry.setIndex(indices);bankGeometry.computeVertexNormals();
    const bank=new T.Mesh(bankGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));bank.receiveShadow=true;scene.add(bank);
    const shoreRock=new T.IcosahedronGeometry(1,1),rockMat=new T.MeshStandardMaterial({color:0x85867c,roughness:.92,flatShading:true});
    const rocks=new T.InstancedMesh(shoreRock,rockMat,420),rockTransform=new T.Object3D();
    for(let i=0;i<420;i++){
      const near=i>=300,x=near?(i-300)*WORLD_W/120:-70+i*(WORLD_W+140)/300;
      const sheltered=near&&[47,173,299].some(center=>Math.abs(x-center)<13);
      const size=sheltered?0:.3+(Math.sin(i*73.13)*.5+.5)*1.1;
      rockTransform.position.set(x,.02+size*.16,near?17.65-Math.sin(i*2.17)*.4:bankZ(x)-.3-Math.sin(i*2.17)*1.5);
      rockTransform.scale.set(size*1.35,size*.65,size);rockTransform.rotation.set(i*.23,i*.8,i*.15);rockTransform.updateMatrix();rocks.setMatrixAt(i,rockTransform.matrix);
      rocks.setColorAt(i,new T.Color().setHSL(.12,.07,.48+(i%7)*.025));
    }
    rocks.receiveShadow=true;rocks.castShadow=true;scene.add(rocks);
    // Reeds are narrow curved blades, clustered along the natural bank.
    const reedGeometry=new T.PlaneGeometry(.09,1.4,1,4),rp=reedGeometry.attributes.position;
    for(let i=0;i<rp.count;i++){const h=(rp.getY(i)+.7)/1.4;rp.setXYZ(i,rp.getX(i)+h*h*.24,rp.getY(i)+.7,Math.sin(h*2.)*.08);}
    reedGeometry.computeVertexNormals();
    const reeds=new T.InstancedMesh(reedGeometry,new T.MeshStandardMaterial({color:0x718048,roughness:1,side:T.DoubleSide}),1500);
    for(let i=0;i<1500;i++){
      const cluster=Math.floor(i/25),x=-45+cluster*8.1+Math.sin(i*12.7)*1.9;
      rockTransform.position.set(x,.12,bankZ(x)-1.2-Math.cos(i*4.1)*.65);rockTransform.rotation.set(0,i*2.4,Math.sin(i)*.12);rockTransform.scale.setScalar(.55+(i%11)*.075);rockTransform.updateMatrix();reeds.setMatrixAt(i,rockTransform.matrix);
    }
    scene.add(reeds);
    for(let i=0;i<30;i++)tree(-35+i*16,bankZ(-35+i*16)-12-(i%3)*2,i,false,true);
    // Granite quay blocks and a dark wet line at the water level.
    const quayMat=mat(0x727a79,0,.92),wetQuayMat=mat(0x3f514d,0,.62);
    for(let x=0;x<WORLD_W;x+=3){
      box(scene,x+1.48,-.18,18.9,2.94,1.05,.75,quayMat);
      box(scene,x+1.48,.08,18.49,2.94,.18,.06,wetQuayMat);
    }
    box(scene,WORLD_W/2,.21,19,WORLD_W,.38,1.3,curbMat);
    box(scene,WORLD_W/2,.36,19.6,WORLD_W,.08,.12,cyanMat);
    flat(scene,WORLD_W/2,.06,21.5,WORLD_W,4.4,pavingMat);
    for(let x=1;x<WORLD_W;x+=3)if(![47,173,299].some(center=>Math.abs(x-center)<12)){
      box(scene,x,.9,18.6,.07,1.35,.07,trimMat);box(scene,x+1.5,1.55,18.6,3,.08,.08,trimMat);
    }
    buildWaterfront();
    for(let x=8,i=0;x<WORLD_W-5;x+=8.2,i++){
      if(roadsX.some(v=>Math.abs(x-v)<5))continue;
      tree(x,21.5,i);
      if(i%3===0){box(scene,x+2,.49,20.4,2.4,.3,.5,mat(0x526368));box(scene,x+2,.8,20.4,2.2,.12,.5,roofMat)}
    }
    for(const x of roadsX){
      flat(scene,x,.08,(WORLD_H+20)/2,ROAD,WORLD_H-20,roadSurface(ROAD,WORLD_H-20));


      for(let z=21;z<WORLD_H;z+=8)box(scene,x,.12,z,.16,.04,3.1,laneMat);
    }
    for(const z of roadsZ){
      flat(scene,WORLD_W/2,.09,z,WORLD_W,ROAD,roadSurface(WORLD_W,ROAD));


      for(let x=0;x<WORLD_W;x+=8)box(scene,x,.13,z,3.1,.04,.16,laneMat);
    }
    for(const x of roadsX)for(const z of roadsZ){
      flat(scene,x,.15,z,ROAD,ROAD,roadSurface(ROAD,ROAD));
      for(const s of [-1,1]){
        box(scene,x+s*(ROAD/2-1.1),.16,z-ROAD/2+1.6,.12,.04,1.1,cyanMat);
        box(scene,x+s*(ROAD/2-1.1),.16,z+ROAD/2-1.6,.12,.04,1.1,cyanMat);
        for(let k=-2;k<=2;k++){
          box(scene,x+k*1.35,.164,z+s*4.6,.77,.015,1.15,crosswalkMat);
          box(scene,x+s*4.6,.164,z+k*1.35,1.15,.015,.77,crosswalkMat);
        }
      }
      if((roadsX.indexOf(x)+roadsZ.indexOf(z))%2===0)streetLight(x+ROAD/2+1.1,z+ROAD/2+1.1);
    }
    // The elevated TBS line runs beside the Volga.
    box(scene,WORLD_W/2,15.4,17,WORLD_W,.35,1.15,roofMat);
    box(scene,WORLD_W/2,15.67,16.58,WORLD_W,.08,.12,cyanMat);
    box(scene,WORLD_W/2,15.67,17.42,WORLD_W,.08,.12,orangeMat);
    for(const x of roadsX){box(scene,x,7.6,17,.42,15.2,.45,curbMat);box(scene,x,14.5,17,3.3,.16,.62,roofMat)}
    maglevTrain=new T.Group();
    box(maglevTrain,0,0,0,10.5,1.6,2.2,whiteMat);
    box(maglevTrain,0,.47,0,7.9,.8,2.23,glassMat);
    box(maglevTrain,0,-.27,1.17,9.4,.12,.08,orangeMat);
    box(maglevTrain,0,-.27,-1.17,9.4,.12,.08,cyanMat);
    sprite(maglevTrain,markTexture,0,1.1,1.23,1.8,1.8);
    maglevTrain.position.set(55,17.2,17);scene.add(maglevTrain);
  }
  function buildWaterfront(){
    const wood=parkWood,ropeMat=mat(0xa49878),deckMat=mat(0x97a29e),lifeMat=mat(0xf46e22);
    const plankTexture=makeTexture((p,w,h)=>{p.fillStyle='#96795a';p.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){p.fillStyle='#4e4439';p.fillRect(0,y,w,2);for(let n=0;n<25;n++){p.strokeStyle=n%2?'#d7b48725':'#392d2328';p.beginPath();p.moveTo(0,y+4+n);p.bezierCurveTo(w*.3,y+2+n,w*.6,y+7+n,w,y+4+n);p.stroke();}}},256,256);
    plankTexture.repeat.set(1,6);
    const plank=new T.MeshStandardMaterial({map:plankTexture,bumpMap:plankTexture,bumpScale:.025,roughness:.85});
    for(const x of [47,173,299]){
      waterfrontTerraces.push({x,z:12});
      box(scene,x,.38,12,24,.5,14,deckMat).receiveShadow=true;
      flat(scene,x,.64,12,23.8,13.8,parkPaving(23.8,13.8));
      box(scene,x,.46,-3,4.6,.3,22,wood).receiveShadow=true;
      flat(scene,x,.62,-3,4.4,22,plank);
      for(const side of [-1,1]){
        for(let z=-13;z<7;z+=4){box(scene,x+side*2.15,.35,z,.18,1.6,.18,trimMat);box(scene,x+side*2.15,1.14,z,.3,.12,.3,whiteMat);}
        for(let z=6;z<=18;z+=3)box(scene,x+side*11.7,1.2,z,.09,1.25,.09,trimMat);
        box(scene,x+side*11.7,1.85,12,.08,.08,12,trimMat);
        for(const height of [1.05,1.4])box(scene,x+side*11.7,height,12,.035,.035,12,trimMat);
        box(scene,x+side*7,1.85,5.2,9.2,.08,.08,trimMat);
        for(const height of [1.05,1.4])box(scene,x+side*7,height,5.2,9.2,.035,.035,trimMat);
        for(let n=0;n<4;n++)box(scene,x+side*(3+n*2.8),1.2,5.2,.08,1.25,.08,trimMat);
        // Slatted shade structures and seating face the river.
        const px=x+side*7;
        for(const dx of [-2,2])for(const dz of [-2,2])box(scene,px+dx,2.05,12+dz,.16,2.8,.16,wood).castShadow=true;
        for(let slat=0;slat<12;slat++)box(scene,px-2.2+slat*.4,3.48,12,.17,.17,4.6,wood).castShadow=true;
        parkBench(px,1.08,13.4,3.35);
        box(scene,px,.95,16.7,3.4,.6,1.15,curbMat);
        shrubBed(px,1.25,16.7,3.1,.9,Math.round(px));
        const ring=new T.Mesh(new T.TorusGeometry(.36,.09,8,28),lifeMat);ring.position.set(x+side*2.18,1.16,-5);ring.rotation.y=Math.PI/2;scene.add(ring);
        for(const z of [6,17]){box(scene,px,.99,z,.16,.75,.16,dark);box(scene,px,1.39,z,.25,.1,.25,cyanMat);sprite(scene,glowTexture,px,1.43,z,1.3,1.3,.18);}
        const boat=new T.Group();boat.position.set(x+side*6.1,0,-5);scene.add(boat);
        const shape=new T.Shape();shape.moveTo(-1.35,-2.7);shape.lineTo(1.35,-2.7);shape.quadraticCurveTo(1.65,.8,0,3.65);shape.quadraticCurveTo(-1.65,.8,-1.35,-2.7);
        const hull=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.55,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:2,steps:1}),whiteMat);hull.rotation.x=-Math.PI/2;hull.position.y=.12;hull.castShadow=true;boat.add(hull);
        const deck=new T.Mesh(new T.ShapeGeometry(shape),wood);deck.rotation.x=-Math.PI/2;deck.position.y=.77;boat.add(deck);
        box(boat,0,1.14,.35,1.85,.72,2.3,glassMat);box(boat,0,1.58,.35,2.05,.15,2.55,whiteMat);
        box(boat,0,.84,-1.1,1.75,.14,.16,orangeMat);
        for(const s of [-1,1]){box(boat,s*.91,1.14,.35,.09,.78,2.3,whiteMat);box(boat,s*1.25,.64,1,.07,.13,2.4,orangeMat);}
        const logo=new T.Mesh(new T.PlaneGeometry(.95,.95),new T.MeshBasicMaterial({map:markTexture,transparent:true,toneMapped:false}));logo.rotation.x=-Math.PI/2;logo.position.set(0,1.67,.3);boat.add(logo);
        const mooring=new T.CatmullRomCurve3([new T.Vector3(x+side*2.15,1.1,-5),new T.Vector3(x+side*3.5,.55,-5),new T.Vector3(x+side*4.8,.7,-5)]);
        scene.add(new T.Mesh(new T.TubeGeometry(mooring,12,.035,5,false),ropeMat));
        mooredBoats.push({mesh:boat,phase:x*.1+side});
      }
      const sign=new T.Mesh(new T.PlaneGeometry(8,2),new T.MeshBasicMaterial({map:signTexture('ВОЛГА · ТБС','ПРИЧАЛ · НАБЕРЕЖНАЯ'),toneMapped:false}));sign.position.set(x,3.25,17.8);scene.add(sign);
      for(const side of [-1,1])box(scene,x+side*3.9,2,17.6,.1,2.9,.1,trimMat);
    }
  }
  city();

  const wornPaint=makeTexture((c,w,h)=>{c.fillStyle='#d9ded3';c.fillRect(0,0,w,h);let seed=914;for(let i=0;i<1800;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%w;seed=(Math.imul(seed,1664525)+1013904223)>>>0;c.fillStyle=i%3?'#8c9992':'#45535a';c.fillRect(x,seed%h,1+(i%3),1+(i%2));}},128,128);
  laneMat.map=wornPaint;laneMat.needsUpdate=true;crosswalkMat.map=wornPaint;crosswalkMat.needsUpdate=true;

  // Repeated road details share geometry and materials in three draw calls.
  const arrowTexture=makeTexture((c,w,h)=>{c.fillStyle='rgba(221,229,221,.72)';c.beginPath();c.moveTo(w*.5,h*.12);c.lineTo(w*.82,h*.43);c.lineTo(w*.6,h*.43);c.lineTo(w*.6,h*.9);c.lineTo(w*.4,h*.9);c.lineTo(w*.4,h*.43);c.lineTo(w*.18,h*.43);c.closePath();c.fill();},128,256);
  const coverTexture=makeTexture((c,w,h)=>{c.fillStyle='#37464b';c.fillRect(0,0,w,h);c.strokeStyle='#708087';c.lineWidth=6;c.beginPath();c.arc(w/2,h/2,w*.44,0,Math.PI*2);c.stroke();c.lineWidth=3;for(let i=24;i<w-20;i+=14){c.beginPath();c.moveTo(i,26);c.lineTo(i,h-26);c.stroke();}c.fillStyle='#263239';c.fillRect(47,55,34,18);},128,128);
  const repairTexture=makeTexture((c,w,h)=>{c.fillStyle='rgba(15,25,30,.24)';c.beginPath();c.moveTo(10,18);c.lineTo(w-20,7);c.lineTo(w-7,h-20);c.lineTo(18,h-8);c.closePath();c.fill();c.strokeStyle='rgba(9,17,20,.38)';c.lineWidth=2;c.beginPath();c.moveTo(0,h*.4);c.lineTo(w*.3,h*.48);c.lineTo(w*.47,h*.35);c.lineTo(w*.61,h*.63);c.lineTo(w,h*.7);c.stroke();},128,128);
  const arrows=[],covers=[],repairs=[];
  for(const x of roadsX)for(let j=0;j<roadsZ.length-1;j++){
    const z=(roadsZ[j]+roadsZ[j+1])/2;
    arrows.push([x+2.7,z,0],[x-2.7,z,Math.PI]);covers.push([x+4.5,z+9,0]);
    if(j%2===0)repairs.push([x-2.9,z-8,.2]);
  }
  for(const z of roadsZ)for(let i=0;i<roadsX.length-1;i++){
    const x=(roadsX[i]+roadsX[i+1])/2;
    arrows.push([x,z+2.7,-Math.PI/2],[x,z-2.7,Math.PI/2]);
    if(i%2===0)repairs.push([x+7,z+3,1.8]);
    // Recessed drainage slots sit along the gutter, outside wheel tracks.
    for(let slot=0;slot<5;slot++)box(scene,x+slot*.18,.155,z-5.7,.08,.02,.7,dark);
  }
  function roadInstances(points,geometry,texture,w,d){
    const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:.95,polygonOffset:true,polygonOffsetFactor:-1}),points.length),transform=new T.Object3D();
    points.forEach(([x,z,angle],i)=>{transform.position.set(x,.18,z);transform.rotation.set(-Math.PI/2,0,angle);transform.scale.set(w,d,1);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
    mesh.receiveShadow=true;scene.add(mesh);
  }
  roadInstances(arrows,unitPlane,arrowTexture,1.2,3.3);
  roadInstances(covers,new T.CircleGeometry(.5,20),coverTexture,1.1,1.1);
  roadInstances(repairs.filter((_,i)=>i%3!==0),unitPlane,repairTexture,2.5,4.6);

  // Flush road margins stop before each rounded intersection corner.
  const shoulderTexture=makeTexture((c,w,h)=>{c.fillStyle='#6b7472';c.fillRect(0,0,w,h);let seed=73;for(let i=0;i<5000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%w;seed=(Math.imul(seed,1664525)+1013904223)>>>0;c.fillStyle=i%2?'#c1bbae40':'#26333760';c.fillRect(x,seed%h,1,1);}c.fillStyle='#26323888';c.fillRect(0,0,4,h);},128,256);
  const shoulderV=[],shoulderH=[],seamsV=[],seamsH=[];
  for(const x of roadsX)for(let j=0;j<roadsZ.length-1;j++){const z=(roadsZ[j]+roadsZ[j+1])/2;for(const s of [-1,1])shoulderV.push([x+s*(ROAD/2-.3),z,0]);if(j%2===0)seamsV.push([x,z+5,0]);}
  for(const z of roadsZ)for(let i=0;i<roadsX.length-1;i++){const x=(roadsX[i]+roadsX[i+1])/2;for(const s of [-1,1])shoulderH.push([x,z+s*(ROAD/2-.3),Math.PI/2]);if(i%2===0)seamsH.push([x-5,z,Math.PI/2]);}
  roadInstances(shoulderV,unitPlane,shoulderTexture,.48,roadsZ[1]-roadsZ[0]-ROAD-8);
  roadInstances(shoulderH,unitPlane,shoulderTexture,.48,roadsX[1]-roadsX[0]-ROAD-8);
  const seamTexture=makeTexture((c,w,h)=>{c.strokeStyle='#111e26a0';c.lineWidth=5;c.beginPath();for(let x=0;x<=w;x+=8){const y=h/2+Math.sin(x*.13)*2+Math.sin(x*.47);x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.strokeStyle='#96948855';c.lineWidth=1;c.stroke();},256,32);
  roadInstances(seamsV,unitPlane,seamTexture,ROAD-1.2,.25);
  roadInstances(seamsH,unitPlane,seamTexture,ROAD-1.2,.25);
  const patchTexture=makeTexture((c,w,h)=>{
    c.beginPath();c.moveTo(12,18);c.lineTo(w-25,10);c.lineTo(w-12,56);c.lineTo(w-17,h-18);c.lineTo(20,h-10);c.closePath();c.fillStyle='#29363bf0';c.fill();c.save();c.clip();let seed=791;for(let i=0;i<13000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%w;seed=(Math.imul(seed,1664525)+1013904223)>>>0;c.fillStyle=i%2?'#a2aaa632':'#111c2840';c.fillRect(x,seed%h,1,1);}c.restore();c.strokeStyle='#14232bb0';c.lineWidth=3;c.stroke();
  },256,256);
  roadInstances(repairs.filter((_,i)=>i%3===0).map(([x,z,a])=>[x+.4,z+1,a+.12]),unitPlane,patchTexture,2.2,3.1);
  const roadSignTextures=['crossing','speed'].map(kind=>makeTexture((c,w,h)=>{
    c.fillStyle='#ecefe5';c.fillRect(0,0,w,h);
    if(kind==='speed'){c.strokeStyle='#c32e27';c.lineWidth=16;c.beginPath();c.arc(w/2,h/2,w*.4,0,Math.PI*2);c.stroke();c.fillStyle='#182a32';c.font='bold 65px Segoe UI';c.textAlign='center';c.fillText('40',w/2,h*.68);}
    else{c.fillStyle='#176aa0';c.fillRect(0,0,w,h);c.fillStyle='#f2f1e7';c.beginPath();c.moveTo(w/2,12);c.lineTo(w-10,h-12);c.lineTo(10,h-12);c.fill();c.strokeStyle='#172d36';c.lineWidth=7;c.beginPath();c.moveTo(65,52);c.lineTo(58,78);c.lineTo(44,97);c.moveTo(58,78);c.lineTo(78,98);c.moveTo(61,60);c.lineTo(79,73);c.stroke();c.beginPath();c.arc(67,41,7,0,Math.PI*2);c.fillStyle='#172d36';c.fill();}
  },128,128));
  for(let j=0;j<roadsZ.length-1;j++)for(let i=0;i<roadsX.length-1;i++){
    if((i+j)%2)continue;
    const x=roadsX[i]+ROAD/2+1.8,z=roadsZ[j]+ROAD/2+5.5,kind=(i+j)%4===0?0:1;
    box(scene,x,1.9,z,.07,3.4,.07,trimMat);
    const sign=new T.Mesh(kind===1?new T.CircleGeometry(.5,32):new T.PlaneGeometry(1,1),new T.MeshStandardMaterial({map:roadSignTextures[kind],roughness:.65,side:T.DoubleSide}));sign.position.set(x,3.25,z);sign.rotation.y=-Math.PI/2;scene.add(sign);
  }

  const landmarks=[
    {i:0,j:0,name:'ЦЕНТР ТБС',sub:'ТРАНСПОРТ БУДУЩЕГО САМАРА',photo:droneTexture,h:10},
    {i:3,j:0,name:'НПЦ БАС',sub:'САМАРА · ТОЛЬЯТТИ',photo:factoryTexture,h:12},
    {i:1,j:1,name:'ЖИГУЛЁВСКАЯ ДОЛИНА',sub:'ТЕХНОПАРК · ТБС',photo:hangarTexture,h:9},
    {i:3,j:2,name:'АВТОВАЗ',sub:'ЭЛЕКТРОМОБИЛЬНОСТЬ',photo:null,h:11},
    {i:4,j:0,name:'ЗАВОД ТБС',sub:'БЕСПИЛОТНЫЕ СИСТЕМЫ',photo:droneTexture,h:13},
    {i:0,j:2,name:'ТБС · ЭНЕРГИЯ',sub:'ЗАРЯДКА',photo:null,h:8},
    {i:2,j:3,name:'ТБС · ЛОГИСТИКА',sub:'К-25  /  К-50',photo:factoryTexture,h:9},
    {i:5,j:2,name:'ТБС · АЭРОПОРТ',sub:'ВОЗДУШНАЯ МОБИЛЬНОСТЬ',photo:droneTexture,h:11},
    {i:3,j:4,name:'ТБС · АКАДЕМИЯ',sub:'ИНЖЕНЕРНЫЙ КАМПУС',photo:hangarTexture,h:10},
    {i:6,j:1,name:'ТБС · ТЕХНОПАРК',sub:'ВОСТОЧНЫЙ РАЙОН',photo:factoryTexture,h:13},
    {i:7,j:3,name:'ТБС · КОНСТРУКТОРСКОЕ БЮРО',sub:'БЕСПИЛОТНЫЕ СИСТЕМЫ',photo:droneTexture,h:11},
    {i:5,j:5,name:'ТБС · ИСПЫТАТЕЛЬНЫЙ ЦЕНТР',sub:'ЮЖНЫЙ РАЙОН',photo:hangarTexture,h:10}
  ];
  const special=new Map(landmarks.map(l=>[l.i+','+l.j,l]));
  landmarks.forEach(l=>l.h+=4);
  const districtLabels=[];
  const parkingLots=[],parkedCars=[];
  const residentialCourts=[];
  let centralSquare=null;
  const buildingColors=[0x213b4a,0x294253,0x1a3545,0x344754,0x1d414b];
  const windowLit=new T.MeshBasicMaterial({color:0x74b9c3});
  const windowWarm=new T.MeshBasicMaterial({color:0xe9aa76});
  const windowDark=new T.MeshStandardMaterial({color:0x143647,metalness:.7,roughness:.2});
  const landingMat=new T.MeshBasicMaterial({color:0x7ce5db,transparent:true,opacity:.74,depthWrite:false});
  const fountainJets=[];
  function park(x,z,w,d,seed){
    flat(scene,x,.4,z,w-1,d-1,mat(0x567749));
    flat(scene,x,.42,z,3,d-1,parkPaving(3,d-1));flat(scene,x,.43,z,w-1,3,parkPaving(w-1,3));
    const bowl=new T.Mesh(new T.CylinderGeometry(3.6,3.8,.6,40),trimMat);bowl.position.set(x,.7,z);bowl.receiveShadow=true;scene.add(bowl);
    const pool=new T.Mesh(new T.CylinderGeometry(3.28,3.28,.08,40),mat(0x46a7b7,.45,.16));pool.position.set(x,1.03,z);scene.add(pool);
    const jetMaterial=new T.MeshPhysicalMaterial({color:0xb9f1ff,transparent:true,opacity:.58,roughness:.12,metalness:.1});
    for(let n=0;n<7;n++){
      const jet=new T.Mesh(new T.CylinderGeometry(.045,.12,n===0?2.6:1.6,8),jetMaterial);
      jet.position.set(x+(n?Math.cos(n)*1.8:0),n===0?2.3:1.85,z+(n?Math.sin(n)*1.8:0));scene.add(jet);fountainJets.push(jet);
    }
    for(const sx of [-1,1])for(const sz of [-1,1]){
      tree(x+sx*w*.32,z+sz*d*.32,seed+(sx+sz+2),true,true);
      gardenBed(x+sx*w*.29,z+sz*d*.29,w*.27,d*.25,seed+(sx+sz+2));
      const bx=x+sx*5,bz=z+sz*5;
      parkBench(bx,.9,bz);
      shrubBed(x+sx*w*.29,.48,z+sz*d*.29,w*.2,d*.16,seed+sx+sz);
    }
  }
  const tactileMaterial=mat(0xa99c61);
  const sidewalkMaterials=['slabs','brick','stone'].map(kind=>{
    const texture=makeTexture((c,w,h)=>{
      c.fillStyle=kind==='brick'?'#655e53':'#777c79';c.fillRect(0,0,w,h);
      let seed=281;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const bw=kind==='slabs'?128:kind==='brick'?64:32,bh=kind==='slabs'?128:32;
      for(let row=0;row<h/bh;row++)for(let col=-1;col<w/bw;col++){
        const x=col*bw+(kind==='slabs'?0:row%2*bw/2),y=row*bh,n=Math.floor(random()*22);
        c.fillStyle=kind==='brick'?`rgb(${154+n},${118+n},${83+n})`:`rgb(${158+n},${164+n},${160+n})`;
        c.fillRect(x+2,y+2,bw-4,bh-4);c.fillStyle='#ffffff30';c.fillRect(x+3,y+3,bw-6,1);
      }
      for(let i=0;i<8000;i++){c.fillStyle=i%2?'#ffffff0c':'#18262712';c.fillRect(random()*w,random()*h,1,1);}
    },256,256);texture.repeat.set(4,4);
    return new T.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:kind==='stone'?.065:.035,roughness:.94});
  });
  const kerbTexture=makeTexture((c,w,h)=>{
    c.fillStyle='#aaa99f';c.fillRect(0,0,w,h);let seed=724;
    const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<14000;i++){c.fillStyle=i%3?'#494a4322':'#fff9eb33';c.fillRect(rand()*w,rand()*h,1+rand()*2,1+rand()*2)}
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#ede5d522');g.addColorStop(1,'#333a3440');c.fillStyle=g;c.fillRect(0,0,w,h);
  },256,256);
  const detailedKerb=new T.MeshStandardMaterial({map:kerbTexture,bumpMap:kerbTexture,bumpScale:.009,roughness:.94,color:0xd6d4c8});
  function kerbPiece(shape,x,z){
    const geo=new T.ExtrudeGeometry(shape,{depth:.19,steps:1,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2,curveSegments:5});
    const mesh=new T.Mesh(geo,detailedKerb);mesh.name='Chamfered concrete kerbstone';mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.18,z);mesh.receiveShadow=true;scene.add(mesh);
  }
  function roundedSidewalk(x,z,w,d,r){
    const detailed=x<70&&z<71;
    const shape=new T.Shape(),a=-w/2,b=-d/2;
    shape.moveTo(a+r,b);shape.lineTo(-1.2,b);shape.lineTo(-1.2,b+1.6);shape.lineTo(1.2,b+1.6);shape.lineTo(1.2,b);shape.lineTo(a+w-r,b);shape.absarc(a+w-r,b+r,r,-Math.PI/2,0,false);
    shape.lineTo(a+w,b+d-r);shape.absarc(a+w-r,b+d-r,r,0,Math.PI/2,false);
    shape.lineTo(1.2,b+d);shape.lineTo(1.2,b+d-1.6);shape.lineTo(-1.2,b+d-1.6);shape.lineTo(-1.2,b+d);shape.lineTo(a+r,b+d);shape.absarc(a+r,b+d-r,r,Math.PI/2,Math.PI,false);
    shape.lineTo(a,b+r);shape.absarc(a+r,b+r,r,Math.PI,Math.PI*1.5,false);
    const geometry=new T.ExtrudeGeometry(shape,{depth:.23,bevelEnabled:false,curveSegments:10});
    const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/8,uv.getY(i)/8);
    if(detailed){for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2,uv.getY(i)*2)}
    const slab=new T.Mesh(geometry,[detailed?visualAssets.material('paving',4,4):sidewalkMaterials[Math.abs(Math.round(x+z))%3],detailed?detailedKerb:curbMat]);slab.rotation.x=-Math.PI/2;slab.position.set(x,.15,z);slab.receiveShadow=true;scene.add(slab);
    function straightKerb(cx,cz,sw,sd){
      if(!detailed){box(scene,cx,.36,cz,sw,.07,sd,trimMat);return}
      const s=new T.Shape();s.moveTo(-sw/2,-sd/2);s.lineTo(sw/2,-sd/2);s.lineTo(sw/2,sd/2);s.lineTo(-sw/2,sd/2);s.closePath();kerbPiece(s,cx,cz);
    }
    // Segmented kerbstones leave rounded corners clear and sit flush with the paving.
    for(const side of [-1,1]){
      for(let v=-w/2+r;v<w/2-r;v+=1.5){const len=Math.min(1.44,w/2-r-v);if(len<.06||v<1.2&&v+len>-1.2)continue;straightKerb(x+v+len/2,z+side*(d/2-.16),len,.28);}
      for(let v=-d/2+r;v<d/2-r;v+=1.5){const len=Math.min(1.44,d/2-r-v);if(len>.06)straightKerb(x+side*(w/2-.16),z+v+len/2,.28,len);}
      const rampGeometry=new T.BufferGeometry();rampGeometry.setAttribute('position',new T.Float32BufferAttribute([-1.2,.16,side*d/2,1.2,.16,side*d/2,1.2,.38,side*(d/2-1.6),-1.2,.38,side*(d/2-1.6)],3));rampGeometry.setIndex(side===1?[0,1,2,0,2,3]:[2,1,0,3,2,0]);rampGeometry.computeVertexNormals();const ramp=new T.Mesh(rampGeometry,trimMat);ramp.position.set(x,0,z);ramp.receiveShadow=true;scene.add(ramp);
      if(detailed){
        rampGeometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));ramp.material=detailedKerb;
        box(scene,x,.395,z+side*(d/2-2.02),2.2,.03,.65,tactileMaterial);
        const dots=new T.InstancedMesh(new T.CylinderGeometry(.033,.043,.025,6),tactileMaterial,60),matrix=new T.Matrix4();let n=0;
        for(let row=0;row<3;row++)for(let col=0;col<20;col++)dots.setMatrixAt(n++,matrix.makeTranslation(x-1.02+col*.107,.425,z+side*(d/2-2.02)+(row-1)*.18));scene.add(dots);
      }
    }
    if(detailed)for(const sx of [-1,1])for(const sz of [-1,1]){
      const cx=x+sx*(w/2-r),cz=z+sz*(d/2-r),start=sx===1?(sz===1?-Math.PI/2:0):(sz===1?Math.PI:Math.PI/2);
      for(let n=0;n<6;n++){
        const a=start+n*Math.PI/12+.007,b=start+(n+1)*Math.PI/12-.007,s=new T.Shape();
        s.absarc(0,0,r-.035,a,b,false);s.absarc(0,0,r-.285,b,a,true);s.closePath();kerbPiece(s,cx,cz);
      }
    }
    // Small tactile landing pads mark the approaches to pedestrian crossings.
    for(const sx of [-1,1])for(const sz of [-1,1]){
      for(let n=0;n<5;n++)box(scene,x+sx*(w/2-r-1)+n*.17,.397,z+sz*(d/2-.8),.08,.025,.9,tactileMaterial);
    }
  }
  const stopSignTexture=makeTexture((c,w,h)=>{
    c.fillStyle='#126a94';c.fillRect(0,0,w,h);c.fillStyle='#f3f5ee';c.fillRect(12,12,w-24,h-24);c.fillStyle='#163e51';c.fillRect(36,40,56,65);c.fillRect(30,101,68,12);c.fillStyle='#c3e2e5';c.fillRect(42,48,44,28);c.fillStyle='#163e51';c.fillRect(39,111,12,13);c.fillRect(77,111,12,13);c.font='bold 18px Segoe UI';c.textAlign='center';c.fillText('ТБС',64,146);
  },128,160);
  const shelterGlass=new T.MeshStandardMaterial({color:0x9bc6cf,transparent:true,opacity:.28,depthWrite:false,roughness:.18,metalness:.08});
  function busStop(x,z){
    const shelter=new T.Group();shelter.position.set(x,0,z);scene.add(shelter);
    box(shelter,0,.45,0,6,.18,2.5,trimMat);
    box(shelter,0,3.65,0,6.6,.24,2.9,whiteMat).castShadow=true;
    for(const side of [-1,1]){for(const depth of [-1,1])box(shelter,side*2.8,2,depth,.12,3.2,.12,trimMat);box(shelter,side*2.7,2,0,.04,2.8,2.15,shelterGlass);}
    box(shelter,0,2,1.1,5.5,2.8,.05,shelterGlass);
    box(shelter,0,1,0,4.3,.2,.65,whiteMat);
    box(shelter,0,3.45,-1.35,6,.08,.06,orangeMat);
    const sign=new T.Mesh(new T.PlaneGeometry(5.6,1.4),new T.MeshBasicMaterial({map:signTexture('ТБС · ЭКСПРЕСС','ГОРОДСКОЙ ЭЛЕКТРОТРАНСПОРТ'),toneMapped:false}));
    sign.rotation.y=Math.PI;sign.position.set(0,4.45,-.2);shelter.add(sign);
    for(const side of [-1,1])box(shelter,side*1.6,.72,0,.13,.65,.55,trimMat);
    box(shelter,0,1.42,.3,4.3,.65,.12,mat(0x987149));
    const route=makeTexture((c,w,h)=>{
      c.fillStyle='#eef0e5';c.fillRect(0,0,w,h);c.fillStyle='#152d37';c.font='bold 25px Segoe UI';c.fillText('ТБС · МАРШРУТ 01',16,38);
      c.strokeStyle='#ff5b1c';c.lineWidth=7;c.beginPath();c.moveTo(30,85);c.lineTo(30,330);c.stroke();
      ['Центр ТБС','Набережная','Площадь ТБС','Академия','Технопарк'].forEach((name,i)=>{const y=85+i*60;c.fillStyle='#ff5b1c';c.beginPath();c.arc(30,y,9,0,Math.PI*2);c.fill();c.fillStyle='#152d37';c.font='19px Segoe UI';c.fillText(name,50,y+6);});
      c.font='16px Segoe UI';c.fillText('ТРАНСПОРТ БУДУЩЕГО',16,375);
    },256,400);
    const panel=new T.Mesh(new T.PlaneGeometry(1.15,1.8),new T.MeshBasicMaterial({map:route,side:T.DoubleSide,toneMapped:false}));panel.position.set(1.95,2.25,1.04);panel.rotation.y=Math.PI;shelter.add(panel);
    box(shelter,-3.65,.9,.3,.65,1,.65,dark);box(shelter,-3.65,1.43,.3,.75,.09,.75,trimMat);
    box(shelter,0,3.48,.5,4.6,.04,.12,cyanMat);
    box(shelter,3.7,1.9,-.65,.09,3.2,.09,trimMat);
    const stopSign=new T.Mesh(new T.PlaneGeometry(.9,1.125),new T.MeshBasicMaterial({map:stopSignTexture,side:T.DoubleSide,toneMapped:false}));stopSign.position.set(3.7,3.25,-.65);stopSign.rotation.y=Math.PI;shelter.add(stopSign);
    for(const side of [-1,1]){
      for(const offset of [0,2.8])box(shelter,side*(4.7+offset),.95,1.2,.08,1.1,.08,trimMat);
      for(const height of [.72,1.42])box(shelter,side*6.1,height,1.2,2.8,.07,.07,trimMat);
    }
  }
  const shopSigns=['КАФЕ','МАРКЕТ','СЕРВИС ТБС'].map(title=>makeTexture((p,w,h)=>{
    p.fillStyle='#102c35';p.fillRect(0,0,w,h);p.fillStyle='#ff5719';p.fillRect(0,h-7,w,7);
    p.fillStyle='#ffffff';p.font='800 61px Segoe UI,Arial';p.textAlign='center';p.textBaseline='middle';p.fillText(title,w/2,h/2,w-35);
  },512,96));
  const solarMat=mat(0x193b61,.65,.21);
  const reflectionBuildings=[];
  const masonryTextures=['#baaa90','#a06e57','#9ba7a7'].map(base=>makeTexture((p,w,h)=>{
    p.fillStyle='#535b58';p.fillRect(0,0,w,h);
    for(let row=0;row<16;row++)for(let col=-1;col<9;col++){
      const x=col*64+(row%2)*32,y=row*32;p.fillStyle=base;p.fillRect(x+1,y+1,62,30);
      p.fillStyle='rgba(255,245,220,'+((row*7+col*3+40)%7)*.012+')';p.fillRect(x+2,y+2,60,28);
      p.fillStyle='#ffffff18';p.fillRect(x+2,y+2,60,1);
    }
  },512,512));
  const cityFacadeLights=[];
  const facadeLampMaterial=new T.MeshStandardMaterial({color:0xffe0ad,emissive:0xffc482,emissiveIntensity:0,roughness:.5});nightWindows.push(facadeLampMaterial);
  function addFacadeLighting(x,z,w,d,h){
    const front=z-d/2-.32;
    for(const side of [-1,1]){
      const px=x+side*Math.min(w*.32,7.5);
      box(scene,px,2.8,front,.22,.5,.24,dark);box(scene,px,2.76,front-.14,.17,.25,.035,facadeLampMaterial);
      const poolMaterial=new T.MeshBasicMaterial({map:glowTexture,color:0xffd09c,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});
      flat(scene,px,.398,front-.55,3.2,2,poolMaterial);
      cityFacadeLights.push({x:px,y:2.3,z:front-.5,poolMaterial});
    }
    box(scene,x,Math.min(h-.5,3.6),front-.04,Math.min(w*.6,8),.055,.08,facadeLampMaterial);
  }
  function building(parent,x,z,w,d,h,seed,kind){
    const style=kind||(w<12?(seed%3===0?'office':'residential'):'campus');
    const color=style==='residential'?[0xa09a86,0xb8ad94,0x87989a][seed%3]:style==='factory'?0x70818b:buildingColors[seed%buildingColors.length];
    reflectionBuildings.push({x,z,w,d,h,seed,color});
    const body=mat(color,style==='residential'?.06:.25,.58);
    if(style==='residential'){
      const masonry=masonryTextures[seed%3].clone();masonry.repeat.set(Math.max(1,w/5),Math.max(1,h/5));masonry.needsUpdate=true;
      body.map=masonry;body.bumpMap=masonry;body.bumpScale=.035;body.roughness=.87;
    }
    const main=box(parent,x,h/2,z,w,h,d,body);main.castShadow=true;main.receiveShadow=true;
    const regionalMaterials=x<240&&z<200?scene.userData.quarterMaterials:null;
    box(parent,x,.47,z,w+.6,.68,d+.6,regionalMaterials?regionalMaterials.brick:roofMat);
    box(parent,x,h+.16,z,w+.32,.32,d+.32,trimMat);
    box(parent,x,h+.42,z,Math.max(2,w*.24),.54,Math.max(2,d*.28),dark);
    // Roof machinery and a visible rim give the blocks different silhouettes.
    box(parent,x-w*.24,h+.6,z+d*.17,Math.max(1.3,w*.19),.85,Math.max(1.3,d*.21),roofMat);
    box(parent,x+w*.24,h+.47,z-d*.12,Math.max(1.2,w*.17),.42,Math.max(1.2,d*.18),dark);
    for(const sx of [-1,1])for(const sz of [-1,1])box(parent,x+sx*(w/2-.24),h/2,z+sz*(d/2-.24),.24,h,.24,trimMat);
    if(seed%3===0&&style!=='factory'){
      const crown=box(parent,x,h+1.15,z,w*.56,1.5,d*.5,body);crown.castShadow=true;
      box(parent,x,h+1.96,z,w*.6,.17,d*.54,trimMat);
    }
    facade(parent,x,h/2+.3,z+d/2+.025,w-.55,h-1.1,0,seed,style);
    facade(parent,x,h/2+.3,z-d/2-.025,w-.55,h-1.1,Math.PI,seed,style);
    facade(parent,x+w/2+.025,h/2+.3,z,d-.55,h-1.1,Math.PI/2,seed,style);
    facade(parent,x-w/2-.025,h/2+.3,z,d-.55,h-1.1,-Math.PI/2,seed,style);
    if(style==='residential'||style==='office'){
      // Modelled reveals and projecting sills add depth on both street-facing walls.
      const columns=Math.max(1,Math.round((w-.55)/2.8)),floors=Math.max(1,Math.round((h-1.1)/2.8));
      const cellW=(w-.55)/columns,cellH=(h-1.1)/floors;
      for(const side of [-1,1])for(let level=0;level<floors;level++)for(let column=0;column<columns;column++){
        const wx=x-(w-.55)/2+(column+.5)*cellW,wy=.85+(level+.5)*cellH,front=z+side*(d/2+.13);
        box(parent,wx,wy-cellH*.36,front,cellW*.82,.12,.3,whiteMat).castShadow=true;
        for(const edge of [-1,1])box(parent,wx+edge*cellW*.38,wy,front,.075,cellH*.72,.23,style==='office'?trimMat:whiteMat);
      }
    }
    if(style==='office'){
      const officeGlass=new T.MeshPhysicalMaterial({color:seed%2?0x7fa5b6:0x8ba9a0,roughness:.16,metalness:.15,transparent:true,opacity:.38,depthWrite:false,clearcoat:1});
      for(const side of [-1,1]){
        box(parent,x,h/2+.6,z+side*(d/2+.065),w-.5,h-1.9,.035,officeGlass);
        for(let column=-w/2+.6;column<w/2;column+=1.4)box(parent,x+column,h/2+.6,z+side*(d/2+.105),.055,h-1.9,.09,trimMat);
        for(let floor=3;floor<h-.3;floor+=1.65)box(parent,x,floor,z+side*(d/2+.12),w-.45,.055,.13,whiteMat);
      }
      box(parent,x,h+2.4,z,w*.62,4.4,d*.56,glassMat).castShadow=true;
      box(parent,x,h+4.66,z,w*.68,.18,d*.62,whiteMat);
      for(const side of [-1,1])box(parent,x+side*w*.3,h+2.4,z-d*.29,.13,4.5,.13,trimMat);
      for(let rib=-w/2+.8;rib<w/2;rib+=2.8)box(parent,x+rib,h/2,z-d/2-.35,.18,h-.8,.65,seed%2?whiteMat:trimMat).castShadow=true;
      const canopyW=Math.min(w-1,7),entrance=z-d/2-.5;
      box(parent,x,3.1,entrance,canopyW,.2,2,seed%2?trimMat:parkWood).castShadow=true;
      for(const side of [-1,1])detailBar(parent,[x+side*(canopyW/2-.2),.5,entrance-.8],[x+side*canopyW*.28,3,entrance-.8],.06,trimMat);
      if(seed%2===0){box(parent,x-w*.22,h+1.65,z+d*.15,w*.32,2.8,d*.36,officeGlass).castShadow=true;box(parent,x-w*.22,h+3.12,z+d*.15,w*.36,.18,d*.4,whiteMat);}
    }
    if(style==='factory'){
      const monitors=new T.Group();monitors.position.set(x+w*.27,h+.25,z);parent.add(monitors);
      for(let section=0;section<3;section++){
        const front=-d*.4+section*d*.27,back=front+d*.23;
        wedge(monitors,w*.36,front,back,0,.16,1.7,roofMat);
        box(monitors,0,.95,back+.015,w*.32,1.25,.06,glassMat);
      }
      for(let n=0;n<3;n++){
        const vent=new T.Mesh(new T.CylinderGeometry(.48,.58,1.4,12),trimMat);vent.position.set(x-w*.29,h+.85,z-d*.25+n*2.5);parent.add(vent);
        box(parent,x-w*.29,h+1.61,z-d*.25+n*2.5,1.4,.13,1.4,whiteMat);
      }
      for(const side of [-1,1])for(let rib=-d/2+.6;rib<d/2;rib+=1.2)box(parent,x+side*(w/2+.09),h/2,rib+z,.12,h-.3,.065,trimMat);
    }else{
      for(let row=0;row<3;row++){
        const panel=box(parent,x+w*.2,h+.8,z+d*.15+row*1.35,w*.42,.08,1.12,solarMat);panel.rotation.x=-.22;
        box(parent,x+w*.2,h+.64,z+d*.15+row*1.35,.12,.36,1.05,trimMat);
      }
    }
    for(let floor=3.2;floor<h-.7;floor+=3.2){
      box(parent,x,floor,z,w+.18,.12,d+.18,seed%2?trimMat:roofMat);
    }
    if(seed%2===0){
      for(const side of [-1,1])box(parent,x+side*w*.3,h/2,z-d/2-.14,.22,h,.36,trimMat).castShadow=true;
    }
    if(style!=='residential'){
      box(parent,x,1.25,z-d/2-.28,2.1,2.3,.18,glassMat);
      box(parent,x,2.56,z-d/2-.5,4.1,.13,1.15,seed%3===0?orangeMat:cyanMat);
    }
    if(style==='residential'){
      // Actual projecting balconies, with slabs, glass balustrades and frames.
      for(let floor=4;floor<h-1;floor+=3.2){
        const variant=seed%3,balconyW=Math.min(w-1.2,variant===0?3.2:variant===1?4.2:5),bx=x+(variant===0?(Math.round(floor/3.2)%2?1:-1)*Math.min(.7,w*.12):0);
        box(parent,bx,floor,z-d/2-.7,balconyW,.19,1.5,trimMat).castShadow=true;
        box(parent,bx,floor+.6,z-d/2-1.38,balconyW,.95,.075,variant===2?parkWood:glassMat);
        box(parent,bx,floor+1.1,z-d/2-1.4,balconyW,.065,.08,whiteMat);
        for(const side of [-1,1])box(parent,bx+side*balconyW/2,floor+.6,z-d/2-.7,.08,1.05,1.5,trimMat);
        if(variant===0)for(let rail=-balconyW/2+.2;rail<balconyW/2;rail+=.35)box(parent,bx+rail,floor+.65,z-d/2-1.43,.035,.85,.045,trimMat);
        if((Math.round(floor)+seed)%3===0){
          box(parent,bx,floor+.27,z-d/2-1.05,balconyW*.7,.22,.38,roofMat);
          for(let plant=0;plant<4;plant++)box(parent,bx-balconyW*.25+plant*balconyW/6,floor+.47,z-d/2-1.05,.35,.24,.3,leafMats[(plant+seed)%3]);
        }
      }
      const entranceZ=z-d/2-.38;
      if(seed%3===0){box(parent,x-w*.18,h+1.4,z+d*.15,w*.52,2.6,d*.45,body).castShadow=true;box(parent,x-w*.18,h+2.79,z+d*.15,w*.58,.18,d*.5,whiteMat);}
      if(seed%3===2){for(const side of [-1,1])box(parent,x+side*w*.3,h+1.25,z,.1,2.1,.1,trimMat);for(let slat=0;slat<7;slat++)box(parent,x-w*.32+slat*w*.105,h+2.35,z,.12,.12,d*.45,parkWood).castShadow=true;}
      box(parent,x,1.55,entranceZ,2.15,2.55,.32,trimMat);
      box(parent,x,1.52,entranceZ-.18,1.75,2.3,.045,glassMat);
      box(parent,x,2.98,entranceZ-.55,3.2,.14,1.4,seed%2?whiteMat:trimMat).castShadow=true;
      for(const step of [0,1])box(parent,x,.47+step*.1,entranceZ-.45+step*.2,2.8-step*.25,.16,.8-step*.2,curbMat);
      const address=makeTexture((p,w,h)=>{p.fillStyle='#123841';p.fillRect(0,0,w,h);p.fillStyle='#f3f1df';p.font='bold 52px Segoe UI,Arial';p.textAlign='center';p.fillText(String(seed%90+1),w/2,61);p.font='16px Segoe UI,Arial';p.fillText('КВАРТАЛ ТБС',w/2,91);},128,112);
      const plate=new T.Mesh(new T.PlaneGeometry(.9,.7875),new T.MeshBasicMaterial({map:address,toneMapped:false}));plate.rotation.y=Math.PI;plate.position.set(x+1.55,2.3,entranceZ-.19);parent.add(plate);
      if(seed%2===0){
        const roofGarden=box(parent,x,h+.44,z-d*.23,w*.65,.35,d*.22,curbMat);roofGarden.castShadow=true;
        flat(parent,x,h+.63,z-d*.23,w*.62,d*.2,grassMat);
      }
      if(seed%3===1){
        const upper=box(parent,x,h+2,z,w*.7,4,d*.64,body);upper.castShadow=true;
        facade(parent,x,h+2,z-d*.32-.025,w*.7-.2,3.6,Math.PI,seed+1);
        box(parent,x,h+4.12,z,w*.76,.24,d*.7,trimMat);
      }
    }else if(w>=12){
      // A glazed lobby sits proud of the main facade, under a structural canopy.
      box(parent,x,1.7,z-d/2-.6,6,3.1,1.1,glassMat);
      box(parent,x,3.35,z-d/2-1.1,8,.23,2.5,trimMat).castShadow=true;
      for(const side of [-1,1])box(parent,x+side*3.5,1.7,z-d/2-1.9,.15,3.3,.15,whiteMat);
      for(let n=-2;n<=2;n++)box(parent,x+n*1.1,1.7,z-d/2-1.2,.06,3,.07,trimMat);
      for(const side of [-1,1]){
        box(parent,x+side*(w/2-.7),h/2,z-d/2-.22,.32,h,.48,whiteMat).castShadow=true;
        box(parent,x+side*(w/2-.7),h/2,z-d/2-.49,.09,h-.6,.025,orangeMat);
      }
    }
    if(w<12&&style!=='residential'){
      for(const side of [-1,1]){
        const front=z+side*(d/2+.22);
        box(parent,x,1.65,front,w-.45,2.25,.06,glassMat);
        for(const mullion of [-1,0,1])box(parent,x+mullion*(w-.6)/3,1.65,front+side*.05,.06,2.3,.08,whiteMat);
        const sign=new T.Mesh(new T.PlaneGeometry(w-.55,(w-.55)*96/512),new T.MeshBasicMaterial({map:shopSigns[seed%3],toneMapped:false}));
        sign.rotation.y=side<0?Math.PI:0;sign.position.set(x,3.12,front+side*.1);parent.add(sign);
        box(parent,x,3.8,front+side*.32,w+.1,.13,.9,style==='office'?trimMat:orangeMat).castShadow=true;
      }
    }
  }
  function showcasePavilion(x,z,w,d){
    reflectionBuildings.push({x,z,w,d,h:7.7,seed:2,color:0xd1cbb6});
    const stoneTexture=makeTexture((c,tw,th)=>{
      c.fillStyle='#bcb9aa';c.fillRect(0,0,tw,th);
      for(let n=0;n<5000;n++){const q=(Math.sin(n*71.37)*43758.54)%1;c.fillStyle=n%2?'rgba(45,39,31,.08)':'rgba(255,255,240,.12)';c.fillRect(Math.abs(q)*tw,((n*73)%th),1+n%3,1);}
      c.fillStyle='#777c75';c.fillRect(0,0,tw,2);c.fillRect(0,0,2,th);
    },256,128);stoneTexture.repeat.set(4,3);
    const stone=visualAssets.material('stone',10,7);
    const timber=mat(0x78593c,0,.82),interior=mat(0xb7b4a1,0,.88);
    const glazing=new T.MeshPhysicalMaterial({color:0xb4c6c6,metalness:0,roughness:.18,transparent:true,opacity:.23,depthWrite:false,side:T.DoubleSide,envMapIntensity:.6});
    const glow=new T.MeshStandardMaterial({color:0xdad0ad,roughness:.8,emissive:0xffd898,emissiveIntensity:0});nightWindows.push(glow);
    const front=z-d/2;
    box(scene,x,.4,z,w+.3,.6,d+.3,stone).receiveShadow=true;
    box(scene,x,3.8,z,w,.3,d,stone).castShadow=true;
    box(scene,x,7.5,z,w+.65,.4,d+.65,stone).castShadow=true;
    box(scene,x,3.95,z+d/2-.18,w,7.1,.35,stone).castShadow=true;
    for(const side of [-1,1])box(scene,x+side*(w/2-.24),3.9,z,.48,7.1,d,stone).castShadow=true;
    for(const level of [0,1]){
      const y=level*3.55;
      box(scene,x,y+1.65,z+d/2-.39,w-1,2.3,.035,glow);
      for(let column=-w/2+1.6;column<w/2-1;column+=3){
        box(scene,x+column,y+1.02,z+.45,1.9,.1,1,interior);
        for(const side of [-1,1])box(scene,x+column+side*.65,y+.58,z+.45,.07,.85,.6,trimMat);
        box(scene,x+column,y+1.38,z+.5,.6,.46,.06,dark);
        box(scene,x+column,y+.66,z-.55,.57,.5,.57,timber);
        box(scene,x+column,y+1.1,z-.3,.57,.55,.08,timber);
      }
      // Deep window reveals and external fins cast real facade shadows.
      for(let column=-w/2+.5;column<w/2;column+=1.5){
        box(scene,x+column,y+2,front-.05,.07,3.25,.12,trimMat);
        if(Math.abs(column)>3)box(scene,x+column,y+2,front-.31,.14,3.25,.66,timber).castShadow=true;
      }
      const window=new T.Mesh(new T.PlaneGeometry(w-.9,3.05),glazing);window.rotation.y=Math.PI;window.position.set(x,y+2,front-.12);scene.add(window);
    }
    for(const side of [-1,1]){
      box(scene,x+side*2,1.65,front-.26,.08,2.8,.14,trimMat);
      box(scene,x+side*.24,1.52,front-.29,.035,.6,.065,whiteMat);
    }
    box(scene,x,3.5,front-.7,5.5,.16,1.8,trimMat).castShadow=true;
    for(let rib=0;rib<9;rib++)box(scene,x-2.4+rib*.6,3.38,front-.7,.045,.08,1.7,timber);
    const name=new T.Mesh(new T.PlaneGeometry(12,3),new T.MeshBasicMaterial({map:signTexture('ИНЖЕНЕРНЫЙ ЦЕНТР','ТРАНСПОРТ БУДУЩЕГО САМАРА'),toneMapped:false}));name.rotation.y=Math.PI;name.position.set(x,9.2,front+.25);scene.add(name);
    box(scene,x,9.2,front+.4,12.4,3.3,.28,dark).castShadow=true;
    for(const side of [-1,1]){
      box(scene,x+side*(w/2-2),7.94,z,2.8,.5,d-1.1,stone);
      flat(scene,x+side*(w/2-2),8.2,z,2.5,d-1.4,grassMat);
      for(let n=0;n<9;n++){
        const bush=new T.Mesh(new T.IcosahedronGeometry(.38,1),leafMats[n%3]);bush.position.set(x+side*(w/2-2)+Math.sin(n*2.4)*.8,8.35,z+Math.cos(n*2.4)*1.5);bush.scale.y=.7;scene.add(bush);
      }
      showcaseTree(x+side*(w/2-2),front-1.45);
    }
    scene.userData.showcasePavilion=true;
  }
  function showcaseTree(x,z){
    visualAssets.plant(scene,x,z,Math.round(x)%3,.85);
    box(scene,x,.36,z,2.6,.5,1.6,visualAssets.material('stone',2.6,.5));flat(scene,x,.62,z,2.35,1.35,grassMat);
    return;
  }
  const flowerGeometry=new T.IcosahedronGeometry(.1,0),flowerMaterial=new T.MeshStandardMaterial({roughness:.85});
  function flowerBed(x,z,w,d,seed){
    box(scene,x,.63,z,w,.4,d,curbMat);flat(scene,x,.84,z,w-.2,d-.2,grassMat);
    const buds=new T.InstancedMesh(flowerGeometry,flowerMaterial,48),pose=new T.Object3D(),colors=[0xf7bf55,0xee786a,0xe8e4cb,0xa58bce];
    for(let n=0;n<48;n++){
      pose.position.set(x+((n*.618+seed*.13)%1-.5)*(w-.4),.97+(n%3)*.04,z+((n*.414+seed*.17)%1-.5)*(d-.35));pose.scale.set(1,1.1,1);pose.updateMatrix();buds.setMatrixAt(n,pose.matrix);buds.setColorAt(n,new T.Color(colors[(seed+n)%4]));
    }
    scene.add(buds);
  }
  function gazebo(x,z){
    const timber=mat(0x987a52,0,.84);
    box(scene,x,.55,z,4.7,.26,4.7,curbMat);
    for(const sx of [-1,1])for(const sz of [-1,1])box(scene,x+sx*1.85,1.95,z+sz*1.85,.15,2.65,.15,timber).castShadow=true;
    const roof=new T.Mesh(new T.ConeGeometry(3.15,.95,4),roofMat);roof.rotation.y=Math.PI/4;roof.position.set(x,3.68,z);roof.castShadow=true;scene.add(roof);
    for(const side of [-1,1]){box(scene,x+side*1.5,1,z,.65,.17,3.3,timber);box(scene,x+side*1.84,1.36,z,.1,.68,3.3,timber);}
    box(scene,x,1.2,z,1.1,.12,1.1,timber);box(scene,x,.85,z,.2,.7,.2,trimMat);
  }
  function playground(x,z){
    const play=new T.Group();play.position.set(x,.4,z);scene.add(play);
    box(play,0,.06,0,7,.12,5,mat(0x648e89));
    for(const side of [-1,1])box(play,side*1.65,1.18,-.8,.14,2.25,.14,orangeMat);
    box(play,-1,1.5,-.8,1.65,.18,1.65,whiteMat);
    for(const side of [-1,1])box(play,-1+side*.72,2,-.8,.07,.85,1.6,trimMat);
    const canopy=new T.Mesh(new T.ConeGeometry(1.45,.65,4),orangeMat);canopy.rotation.y=Math.PI/4;canopy.position.set(-1,2.8,-.8);play.add(canopy);
    const slide=box(play,-1,.92,1.02,1,.09,2.5,cyanMat);slide.rotation.x=.55;
    for(const side of [-1,1]){const edge=box(play,-1+side*.53,1.04,1.02,.09,.19,2.5,whiteMat);edge.rotation.x=.55;}
    for(let step=0;step<5;step++)box(play,-1,.25+step*.28,-1.8,.7,.07,.16,trimMat);
    for(const side of [-1,1]){
      for(const end of [-1,1])detailBar(play,[2+side*.8,.1,end*1.1],[2+side*.8,2.1,0],.06,trimMat);
      detailBar(play,[2+side*.35,.9,0],[2+side*.35,2.05,0],.025,whiteMat);
      detailBar(play,[-1+side*.42,.12,-1.8],[-1+side*.42,1.65,-1.8],.035,trimMat);
    }
    box(play,2,2.13,0,1.9,.12,.12,trimMat);box(play,2,.86,0,1,.12,.5,orangeMat);
  }
  function square(x,z,w,d){
    centralSquare={x,z};park(x,z,w,d,12);flat(scene,x,.415,z,w-1,d-1,pavingMat);
    const inlay=new T.Mesh(new T.RingGeometry(4.25,4.48,64),orangeMat);inlay.rotation.x=-Math.PI/2;inlay.position.set(x,.45,z);scene.add(inlay);
    box(scene,x,.88,z-7.1,3.8,.9,2.5,whiteMat);box(scene,x,5.12,z-7.1,1.55,7.6,.85,dark).castShadow=true;
    const light=new T.MeshStandardMaterial({color:0xdbebd9,emissive:0xffce8b,emissiveIntensity:0});nightWindows.push(light);
    for(const side of [-1,1]){
      box(scene,x+side*.83,5.12,z-7.1,.06,7.4,.94,orangeMat);
      const logo=new T.Mesh(new T.PlaneGeometry(1.25,1.25),new T.MeshBasicMaterial({map:markTexture,transparent:true,toneMapped:false}));logo.position.set(x,7.6,z-7.1+side*.44);logo.rotation.y=side<0?Math.PI:0;scene.add(logo);
      addFlag(x+side*3.1,z-7.1);
      for(const sz of [-1,1]){box(scene,x+side*10.5,1.04,z+sz*5,.18,1.1,.18,trimMat);box(scene,x+side*10.5,1.64,z+sz*5,.3,.15,.3,light);}
      flowerBed(x+side*6,z-9.9,3.5,1.1,side+2);
    }
    gazebo(x-8,z+.2);
    box(scene,x+8,.9,z,4.5,.95,4.5,whiteMat);flat(scene,x+8,1.39,z,4.3,4.3,roofMat);
    const display=createDrone();display.group.scale.setScalar(.64);display.group.position.set(x+8,2.05,z);display.group.rotation.y=.4;
    const plaque=new T.Mesh(new T.PlaneGeometry(3.7,.925),new T.MeshBasicMaterial({map:signTexture('ТБС · К-50','ТЕХНОЛОГИИ БУДУЩЕГО'),toneMapped:false}));plaque.rotation.y=Math.PI;plaque.position.set(x+8,1.02,z-2.28);scene.add(plaque);
    const sign=new T.Mesh(new T.PlaneGeometry(9,2.25),new T.MeshBasicMaterial({map:signTexture('ПЛОЩАДЬ ТБС','ЦЕНТР ГОРОДА · ТОЛЬЯТТИ'),toneMapped:false}));sign.rotation.y=Math.PI;sign.position.set(x,1.7,z-10.65);scene.add(sign);
  }
  const industrialSites=[];
  function industrialYard(x,z,w,d,logistics){
    industrialSites.push({x,z,logistics});
    const steel=mat(logistics?0x577985:0x8a9595,.45,.52),hazard=mat(0xe1a23c),rubber=mat(0x202a2e),wood=mat(0x9e8056);
    const front=z+d/2-9.7,rear=z+d/2-1.2,buildingZ=(front+rear)/2;
    reflectionBuildings.push({x,z:buildingZ,w:w-3,d:rear-front,h:8,seed:3,color:0x748a91});
    box(scene,x,3.9,buildingZ,w-3,7,8.5,steel).castShadow=true;
    const arch=new T.CylinderGeometry((w-3)/2,(w-3)/2,8.8,28,1,true,-Math.PI/2,Math.PI);arch.rotateX(-Math.PI/2);arch.scale(1,.25,1);
    const roof=new T.Mesh(arch,new T.MeshStandardMaterial({color:0x83949a,metalness:.55,roughness:.4,side:T.DoubleSide}));roof.position.set(x,7.4,buildingZ);roof.castShadow=true;scene.add(roof);
    const radius=(w-3)/2,gableShape=new T.Shape();gableShape.moveTo(-radius,0);
    for(let n=0;n<=24;n++){const angle=Math.PI-n*Math.PI/24;gableShape.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius*.25);}gableShape.closePath();
    for(const side of [-1,1]){const gable=new T.Mesh(new T.ShapeGeometry(gableShape),steel);gable.position.set(x,7.4,buildingZ+side*4.26);gable.rotation.y=side<0?Math.PI:0;scene.add(gable);}
    for(let rib=-w/2+1.7;rib<w/2-1;rib+=1.2)box(scene,x+rib,4.1,front-.06,.08,6.5,.13,trimMat);
    const lampMat=new T.MeshStandardMaterial({color:0xc9d7c9,emissive:0xffdf9b,emissiveIntensity:0});nightWindows.push(lampMat);
    for(const side of [-1,1]){
      const doorX=x+side*5.1;
      box(scene,doorX,2.8,front-.15,6.2,4.7,.13,dark);
      for(let row=0;row<10;row++)box(scene,doorX,1+row*.39,front-.24,5.9,.35,.08,steel);
      for(const edge of [-1,1])box(scene,doorX+edge*3.15,2.7,front-.27,.16,4.9,.27,whiteMat);
      box(scene,doorX,5.35,front-.32,6.6,.18,.8,trimMat).castShadow=true;
      box(scene,doorX,5.21,front-.62,3.7,.08,.16,lampMat);
      box(scene,doorX,6.32,front-.13,6,.86,.07,glassMat);
      for(let bar=0;bar<6;bar++)box(scene,doorX-2.5+bar,6.32,front-.19,.045,.9,.08,whiteMat);
      for(const edge of [-1,1]){box(scene,doorX+edge*3.3,.97,front-1,.2,1.1,.2,hazard);box(scene,doorX+edge*3.3,1.02,front-1,.21,.2,.21,rubber);}
    }
    const name=new T.Mesh(new T.PlaneGeometry(14,3.5),new T.MeshBasicMaterial({map:signTexture(logistics?'ТБС · ЛОГИСТИКА':'ТБС · СБОРОЧНЫЙ ЦЕХ','ПРОМЫШЛЕННЫЙ КВАРТАЛ'),toneMapped:false}));name.rotation.y=Math.PI;name.position.set(x,8.5,front-.3);scene.add(name);
    // Service equipment stays inside the fenced site and above the roof line.
    for(const side of [-1,1]){
      const equipmentY=7.4+Math.sqrt(Math.max(0,radius*radius-49))*.25+.7;
      box(scene,x+side*7,equipmentY,buildingZ,2.4,1.1,2,steel).castShadow=true;
      for(let grille=0;grille<8;grille++)box(scene,x+side*7-.9+grille*.26,equipmentY,buildingZ-1.02,.1,.8,.035,dark);
      detailBar(scene,[x+side*7,equipmentY,buildingZ+1],[x+side*7,equipmentY,rear-.1],.16,trimMat);
      box(scene,x+side*5.1,.62,front-1.45,5.8,.4,2.5,trimMat).receiveShadow=true;
      for(let stripe=0;stripe<9;stripe++)box(scene,x+side*5.1-2.6+stripe*.62,.64,front-2.73,.3,.35,.035,stripe%2?rubber:hazard);
      for(const edge of [-1,1])box(scene,x+side*5.1+edge*2.4,1.04,front-.42,.22,1.2,.18,rubber);
    }
    for(let rung=0;rung<15;rung++)box(scene,x-w/2+2,1+rung*.46,front-.28,.7,.055,.14,trimMat);
    for(const side of [-1,1])box(scene,x-w/2+2+side*.38,4.25,front-.23,.06,7.4,.09,trimMat);
    const yardFront=z-d/2;
    addFacadeLighting(x,buildingZ,w-3,rear-front,7);
    flat(scene,x,.405,(yardFront+front)/2,w-1,front-yardFront,roadSurface(w,front-yardFront));
    for(const side of [-1,1]){
      for(let pz=yardFront+.5;pz<rear;pz+=2.5){box(scene,x+side*(w/2-.4),1.65,pz,.08,2.6,.08,trimMat);}
      for(const y of [.8,1.6,2.6])box(scene,x+side*(w/2-.4),y,z,.055,.055,d-.8,trimMat);
      box(scene,x+side*(w/4+2),1.1,yardFront+.4,w/2-4,1.5,.14,trimMat);
    }
    // A staffed-looking checkpoint and a striped vehicle barrier.
    box(scene,x-5,1.65,yardFront+2.2,2.4,2.5,2.5,steel);box(scene,x-5,2,yardFront+.91,1.85,1,.035,glassMat);
    box(scene,x-5,3,yardFront+2.2,2.75,.2,2.8,whiteMat);
    box(scene,x+3.5,1.05,yardFront+1,.35,1.5,.45,orangeMat);
    for(let stripe=0;stripe<12;stripe++)box(scene,x-3+stripe*.55,1.58,yardFront+1,.55,.13,.13,stripe%2?whiteMat:orangeMat);
    for(let n=0;n<(logistics?3:2);n++){
      const cx=x+w/2-4,cz=yardFront+5+n%2*4.1,cy=.45+(n===2?2.65:0);
      box(scene,cx,cy+1.25,cz,5.2,2.5,3,steel).castShadow=true;
      for(let rib=0;rib<12;rib++)box(scene,cx-2.4+rib*.43,cy+1.25,cz-1.55,.08,2.3,.12,trimMat);
      for(const edge of [-1,1])box(scene,cx+edge*2.6,cy+1.25,cz-1.57,.11,2.55,.13,hazard);
      const badge=new T.Mesh(new T.PlaneGeometry(.85,.85),new T.MeshBasicMaterial({map:markTexture,transparent:true,toneMapped:false}));badge.rotation.y=Math.PI;badge.position.set(cx,cy+1.4,cz-1.64);scene.add(badge);
    }
    if(!logistics)for(let n=0;n<2;n++){
      const px=x-w/2+4,pz=yardFront+6+n*5.7;
      box(scene,px,.69,pz,4.2,.55,4.2,whiteMat);flat(scene,px,.98,pz,4,4,roofMat);
      const drone=createDrone();drone.group.scale.setScalar(n?.55:.42);drone.group.position.set(px,1.5,pz);drone.group.rotation.y=n*.5;
      const plaque=new T.Mesh(new T.PlaneGeometry(2.9,.725),new T.MeshBasicMaterial({map:signTexture(n?'ТБС · К-50':'ТБС · К-25','ВЫСТАВКА БЕСПИЛОТНИКОВ'),toneMapped:false}));plaque.rotation.y=Math.PI;plaque.position.set(px,1.05,pz-2.2);scene.add(plaque);
    }
    else{
      const vehicle=new T.Group();vehicle.position.set(x-7,.5,yardFront+8);scene.add(vehicle);
      box(vehicle,0,.65,0,1.7,1,2.7,hazard);box(vehicle,0,1.5,.35,1.4,.15,1.3,dark);
      for(const side of [-1,1]){
        box(vehicle,side*.8,2,.5,.1,2.6,.1,dark);box(vehicle,side*.65,1.6,-1.5,.09,2.6,.12,trimMat);box(vehicle,side*.65,.25,-2.25,.14,.12,1.7,trimMat);
        for(const pz of [-.8,.9]){const wheel=new T.Mesh(new T.CylinderGeometry(.4,.4,.25,14),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(side*.95,.4,pz);vehicle.add(wheel);}
      }
      box(vehicle,0,3.3,.45,1.9,.13,1.7,hazard);
      for(let n=0;n<3;n++)box(scene,x-7,.66+n*.24,front-2,2,.17,1.5,wood);
    }
    box(scene,x+w/2-1.4,3.2,yardFront+1,1.5,5.5,.7,dark);
    const stela=new T.Mesh(new T.PlaneGeometry(1.1,1.1),new T.MeshBasicMaterial({map:markTexture,transparent:true,toneMapped:false}));stela.rotation.y=Math.PI;stela.position.set(x+w/2-1.4,5,yardFront+.6);scene.add(stela);
    addFlag(x-w/2+1.2,yardFront+1);
  }
  function showcaseQuarter(x,z){
    // A single authored block provides a visual benchmark without rebuilding the city.
    const stoneTexture=makeTexture((c,w,h)=>{
      c.fillStyle='#b4afa3';c.fillRect(0,0,w,h);let seed=149;
      for(let i=0;i<24000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const px=seed%w;seed=(Math.imul(seed,1664525)+1013904223)>>>0;c.fillStyle=i%2?'#eee8d21c':'#514d421b';c.fillRect(px,seed%h,1+(i%2),1);}
      c.strokeStyle='#716f6255';c.lineWidth=2;for(let y=0;y<h;y+=128){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();for(let px=(y/128)%2*128;px<w;px+=256){c.beginPath();c.moveTo(px,y);c.lineTo(px,y+128);c.stroke();}}
    },512,512);stoneTexture.repeat.set(3,2);
    const stone=visualAssets.material('stone',12,8).clone();
    const bronze=mat(0x705338,.66,.32),frame=mat(0x263b3f,.65,.35),plaster=mat(0xd3cfc0,0,.9),wood=mat(0x95633e,0,.87);
    const glazing=new T.MeshPhysicalMaterial({color:0xa8c9cf,metalness:.14,roughness:.16,clearcoat:1,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
    // Surface colour and physical data use separate textures; relief/roughness stay linear.
    function dataMap(draw,size=256,rx=1,ry=1){const map=makeTexture(draw,size,size);map.encoding=T.LinearEncoding;map.repeat.set(rx,ry);return map;}
    function grain(base,spread,seed){return(c,w,h)=>{c.fillStyle=`rgb(${base},${base},${base})`;c.fillRect(0,0,w,h);for(let n=0;n<w*h*.4;n++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const px=seed%w;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=base+(seed%spread)-spread/2;c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(px,seed%h,1,1);}};}
    const stoneRelief=dataMap((c,w,h)=>{grain(210,28,421)(c,w,h);c.fillStyle='#505050';for(let y=0;y<h;y+=128){c.fillRect(0,y,w,3);for(let px=(y/128)%2*128;px<w;px+=256)c.fillRect(px,y,3,128);}},512,3,2);
    stone.bumpMap=stoneRelief;stone.bumpScale=.065;stone.roughnessMap=dataMap(grain(220,32,917),256,3,2);stone.roughness=.98;
    plaster.bumpMap=dataMap(grain(160,70,238),256,4,2);plaster.bumpScale=.018;plaster.roughnessMap=dataMap(grain(235,24,842));
    const brushed=dataMap((c,w,h)=>{grain(170,45,93)(c,w,h);for(let y=0;y<h;y+=3){c.fillStyle=y%2?'#999999':'#cccccc';c.fillRect(0,y,w,1);}},256);
    bronze.roughnessMap=brushed;bronze.roughness=.55;bronze.bumpMap=brushed;bronze.bumpScale=.002;bronze.envMapIntensity=.8;
    frame.roughnessMap=dataMap(grain(200,55,106));frame.roughness=.62;
    glazing.metalness=0;glazing.ior=1.5;glazing.roughness=.18;glazing.envMapIntensity=.55;glazing.opacity=.19;glazing.color.setHex(0xb4c8c5);
    glazing.roughnessMap=dataMap((c,w,h)=>{c.fillStyle='#999999';c.fillRect(0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#ffffff70');g.addColorStop(.25,'#ffffff00');g.addColorStop(.85,'#ffffff00');g.addColorStop(1,'#ffffff90');c.fillStyle=g;c.fillRect(0,0,w,h);});
    const timber=makeTexture((c,w,h)=>{c.fillStyle='#9d7956';c.fillRect(0,0,w,h);for(let n=0;n<150;n++){c.strokeStyle=n%3?'#3c291e25':'#eed4a738';c.lineWidth=1+(n%3)*.4;c.beginPath();for(let py=0;py<=h;py+=8){const px=n*11%w+Math.sin(py*.035+n)*1.4;py?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();}},256,256);
    wood.map=timber;wood.color.setHex(0xc7a984);wood.bumpMap=dataMap(grain(150,35,873));wood.bumpScale=.012;
    const brickColour=makeTexture((c,w,h)=>{c.fillStyle='#7c786d';c.fillRect(0,0,w,h);for(let row=0;row<8;row++)for(let col=-1;col<5;col++){const shade=(row*13+col*7+91)%24;c.fillStyle=`rgb(${91+shade},${79+shade},${65+shade})`;c.fillRect(col*64+(row%2)*32+2,row*32+2,60,28);}},256,256);brickColour.repeat.set(5,1);
    const brickHeight=dataMap((c,w,h)=>{c.fillStyle='#333333';c.fillRect(0,0,w,h);c.fillStyle='#bcbcbc';for(let row=0;row<8;row++)for(let col=-1;col<5;col++)c.fillRect(col*64+(row%2)*32+2,row*32+2,60,28);},256,5,1);
    const brick=visualAssets.material('brick',20,2);
    box(scene,x,.76,z+4,23.15,.78,12.15,brick);
    const pavingColour=makeTexture((c,w,h)=>{c.fillStyle='#74786f';c.fillRect(0,0,w,h);for(let row=0;row<4;row++)for(let col=0;col<4;col++){const v=159+(row*17+col*13)%29;c.fillStyle=`rgb(${v+8},${v+4},${v-5})`;c.fillRect(col*64+2,row*64+2,60,60);c.fillStyle='#ebe3cd40';c.fillRect(col*64+3,row*64+3,58,1);}},256,256);pavingColour.repeat.set(5,4);
    const pavingHeight=dataMap((c,w,h)=>{c.fillStyle='#454545';c.fillRect(0,0,w,h);c.fillStyle='#c8c8c8';for(let row=0;row<4;row++)for(let col=0;col<4;col++)c.fillRect(col*64+2,row*64+2,60,60);},256,5,4);
    const plazaPaving=visualAssets.material('paving',10,8);
    const roadRelief=dataMap(grain(130,125,321)),roadRoughness=dataMap(grain(225,42,532));
    for(const [px,pz,w,d] of [[x,30,22,ROAD],[68,z,ROAD,20]]){
      const asphalt=roadSurface(w,d);asphalt.bumpMap=roadRelief.clone();asphalt.roughnessMap=roadRoughness.clone();for(const map of [asphalt.bumpMap,asphalt.roughnessMap]){map.repeat.set(w/3,d/3);map.needsUpdate=true;}asphalt.bumpScale=.006;asphalt.roughness=.96;asphalt.metalness=0;flat(scene,px,.105,pz,w,d,asphalt);
    }
    const wearTexture=makeTexture((c,w,h)=>{for(const cx of [w*.27,w*.73]){const g=c.createLinearGradient(cx-15,0,cx+15,0);g.addColorStop(0,'#121d2600');g.addColorStop(.5,'#121d2626');g.addColorStop(1,'#121d2600');c.fillStyle=g;c.fillRect(cx-15,0,30,h);}},128,256);
    roadInstances([[x,30,Math.PI/2],[68,z,0]],unitPlane,wearTexture,8,18);
    scene.userData.quarterMaterials={stone,plaster,bronze,glazing,brick,plazaPaving};
    const room=mat(0x66574a,0,.95),warm=new T.MeshStandardMaterial({color:0xf1d6a6,emissive:0xffd09b,emissiveIntensity:0,roughness:.7});nightWindows.push(warm);
    const shadowTex=makeTexture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,5,w/2,h/2,w/2);g.addColorStop(0,'#10201965');g.addColorStop(.65,'#10201930');g.addColorStop(1,'#10201900');c.fillStyle=g;c.fillRect(0,0,w,h);},128,128);
    const contact=new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
    // Build actual openings: floor belts and piers surround each glazed room.
    const claddingPanels=[];
    function wall(px,py,pz,w,h,d,material=stone){
      const m=box(scene,px,py,pz,w,h,d,material);m.castShadow=true;m.receiveShadow=true;
      const front=material===stone&&Math.abs(pz-(z-1.85))<.01&&d===.4;
      const side=material===stone&&Math.abs(px-(x+11.3))<.01&&w===.4;
      if(front||side){
        const span=front?w:d,cols=Math.ceil(span/1.45),rows=Math.ceil(h/.78),pw=span/cols,ph=h/rows;
        for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)claddingPanels.push({x:front?px-span/2+(col+.5)*pw:px+.225,y:py-h/2+(row+.5)*ph,z:front?pz-.225:pz-span/2+(col+.5)*pw,w:pw-.025,h:ph-.025,side});
      }
      return m;
    }
    wall(x,5.8,z+9.8,23,10.9,.4);wall(x-11.3,5.8,z+4,.4,10.9,12);
    for(const [bottom,top] of [[.35,1.225],[3.575,4.325],[6.675,7.425],[9.775,11.25]]){
      wall(x,(bottom+top)/2,z-1.85,23,top-bottom,.4);
      wall(x+11.3,(bottom+top)/2,z+4,.4,top-bottom,12);
    }
    let edge=-11.5;
    for(let col=0;col<=6;col++){
      const next=col<6?-9.5+col*3.8-1.325:11.5;
      if(next>edge)wall(x+(edge+next)/2,5.8,z-1.85,next-edge,10.9,.4);
      edge=next+2.65;
    }
    edge=-2;
    for(let col=0;col<=3;col++){
      const next=col<3?.3+col*3.7-1.25:10;
      if(next>edge)wall(x+11.3,5.8,z+(edge+next)/2,.4,10.9,next-edge);
      edge=next+2.5;
    }
    for(let floor=0;floor<4;floor++)wall(x,.8+floor*3.1,z+4,22.7,.18,11.6,plaster);
    reflectionBuildings.push({x,z:z+4,w:23,d:12,h:11.25,seed:0,color:0xb6b0a0});
    // Recessed window bays have an interior back wall, a frame and a separate glass face.
    function bay(px,py,pz,angle,w=2.65,h=2.35){
      const g=new T.Group();g.position.set(px,py,pz);g.rotation.y=angle;scene.add(g);
      box(g,0,0,-1.15,w,h,.08,room);
      box(g,0,-h/2,-.38,w,.08,1.55,wood);
      box(g,0,h/2,-.38,w,.08,1.55,plaster);
      for(const side of [-1,1])box(g,side*w/2,0,-.38,.07,h,1.55,plaster);
      box(g,w*.18,-h*.29,-.54,w*.42,.08,.5,wood);
      box(g,w*.18,-h*.09,-.69,w*.22,h*.23,.045,frame);
      box(g,-w*.19,-h*.3,-.48,.4,.4,.4,frame);
      for(const side of [-1,1]){box(g,side*(w/2+.06),0,.04,.12,h+.26,.5,plaster);box(g,0,side*(h/2+.07),.04,w+.24,.14,.5,plaster);}
      box(g,0,0,.39,.055,h,.04,bronze);
      box(g,0,h*.18,.39,w,.045,.05,bronze);
      for(const side of [-1,1]){
        box(g,side*(w/2-.035),0,.39,.065,h,.07,frame);
        box(g,0,side*(h/2-.035),.39,w,.065,.07,frame);
        // Fine vertical folds give the curtains depth behind the glazing.
        for(let fold=0;fold<4;fold++)box(g,side*(w*.36+fold*.055),0,.13,.028,h-.12,.08,plaster);
      }
      box(g,w*.19,-h*.22,.18,w*.32,.07,.2,wood);
      box(g,w*.19,-h*.34,.1,.07,h*.24,.12,frame);
      const pane=new T.Mesh(new T.PlaneGeometry(w,h),glazing);pane.position.z=.42;g.add(pane);
      box(g,-w*.23,0,.055,w*.18,h,.035,warm);
      box(g,0,-h/2-.15,.32,w+.45,.12,.7,stone);
      // Separate rubber seals, an opening sash and a folded metal sill.
      const seal=dark;
      for(const side of [-1,1]){
        box(g,side*(w/2-.085),0,.426,.018,h-.12,.022,seal);
        box(g,0,side*(h/2-.085),.426,w-.15,.018,.022,seal);
      }
      box(g,.046,-h*.15,.437,.024,h*.65,.035,frame);
      box(g,w*.25,-h*.48,.437,w*.47,.027,.035,frame);
      box(g,w*.075,-h*.12,.465,.025,.19,.035,bronze);
      for(const sy of [-.3,.25])box(g,w/2-.095,h*sy,.45,.035,.105,.055,bronze);
      const sill=box(g,0,-h/2-.074,.45,w+.24,.035,.47,bronze);sill.rotation.x=.075;
      box(g,0,-h/2-.11,.69,w+.24,.065,.025,bronze);
    }
    for(let floor=0;floor<3;floor++){
      const y=2.4+floor*3.1;
      for(let col=0;col<6;col++)bay(x-9.5+col*3.8,y,z-2.08,Math.PI);
      for(let col=0;col<3;col++)bay(x+11.58,y,z+.3+col*3.7,Math.PI/2,2.5);
      box(scene,x,y+1.57,z+4,23.5,.16,12.5,plaster);
    }
    // Setback roof terrace and equipment are visible from the follow camera.
    box(scene,x,11.37,z+4,23.5,.23,12.5,plaster);
    for(const side of [-1,1]){
      box(scene,x+side*11.5,11.9,z+4,.15,.95,12.3,stone);
      box(scene,x,11.9,z+4+side*6.1,23,.95,.15,stone);
    }
    box(scene,x-6,12.25,z+6,6,1.5,4,frame);for(let n=0;n<6;n++)box(scene,x-8.5+n,13.03,z+6,.65,.1,3.2,solarMat);
    for(let n=0;n<8;n++)box(scene,x+3+n*.65,11.75,z+7,.15,.5,3.4,wood);
    // A stepped rooftop studio breaks the rectangular outline of the office.
    const roofGlass=glazing.clone();roofGlass.opacity=.34;roofGlass.roughness=.24;
    wall(x+2.2,12.85,z+4.8,9,2.6,.16,room);
    wall(x-2.3,12.85,z+2.1,.16,2.6,5.6,stone);
    wall(x+6.7,12.85,z+2.1,.16,2.6,5.6,stone);
    const studioPane=new T.Mesh(new T.PlaneGeometry(8.9,2.45),roofGlass);studioPane.rotation.y=Math.PI;studioPane.position.set(x+2.2,12.85,z-.73);scene.add(studioPane);
    for(let rib=0;rib<7;rib++)wall(x-2.25+rib*1.49,12.85,z-.78,.055,2.5,.08,bronze);
    const studioRoof=wall(x+2.2,14.27,z+2.1,9.8,.22,6.6,frame);studioRoof.rotation.x=-.06;
    for(let rib=0;rib<13;rib++)wall(x-2.4+rib*.75,14.39,z+2.1,.035,.04,6.5,bronze).rotation.x=-.06;
    for(let n=0;n<15;n++){wall(x-10.5+n*1.5,11.95,z-2.18,.035,.85,.035,bronze);}
    wall(x,12.36,z-2.18,22,.045,.055,bronze);
    // A glazed corner pavilion gives the block a different silhouette from the old box buildings.
    box(scene,x+6,.8,z-5.8,9,.18,5.9,room);
    box(scene,x+6,2.25,z-2.95,9,3.75,.2,plaster);
    box(scene,x+1.55,2.25,z-5.8,.18,3.75,5.9,stone);
    box(scene,x+6,1.35,z-4.2,5.6,1.1,1.1,wood);
    box(scene,x+6,1.94,z-4.2,5.8,.13,1.3,plaster);
    for(const sx of [3.2,8.7]){box(scene,x+sx,1.25,z-6.6,1.1,.3,1.1,room);box(scene,x+sx,1.65,z-6.1,1.1,.65,.12,wood);}
    box(scene,x+6,.58,z-5.8,9.6,.3,6.5,stone);
    box(scene,x+6,4.28,z-5.8,10.3,.4,6.8,plaster).castShadow=true;
    // Angled brackets support a projecting glass canopy above the entrance.
    const canopy=new T.Mesh(new T.BoxGeometry(4.8,.075,2.1),roofGlass);canopy.position.set(x+6,3.83,z-9.65);scene.add(canopy);
    for(const dx of [4,8]){
      detailBar(scene,[x+dx,3.25,z-8.8],[x+dx,3.8,z-10.65],.035,bronze);
      detailBar(scene,[x+dx,3.85,z-8.8],[x+dx,3.85,z-10.65],.035,bronze);
    }
    // A readable entrance and furnished display bays at street level.
    for(const dx of [5.15,6.85]){
      box(scene,x+dx,2.2,z-9.015,.075,3.3,.1,frame);
      detailBar(scene,[x+dx+(dx<6?.67:-.67),1.7,z-9.06],[x+dx+(dx<6?.67:-.67),2.3,z-9.06],.025,bronze);
    }
    box(scene,x+6,3.87,z-9.01,1.8,.09,.15,frame);
    box(scene,x+6,.76,z-9.25,2.1,.12,.75,stone);
    box(scene,x+6,.62,z-9.65,2.5,.12,.55,stone);
    for(const dx of [3,9]){
      box(scene,x+dx,1.16,z-7.55,1.25,.56,.8,wood);
      box(scene,x+dx,1.46,z-7.55,1.34,.08,.88,plaster);
      const exhibit=new T.Mesh(new T.TorusGeometry(.3,.055,10,32),bronze);exhibit.position.set(x+dx,1.95,z-7.55);scene.add(exhibit);
      box(scene,x+dx,1.65,z-7.55,.065,.4,.065,frame);
      box(scene,x+dx,3.97,z-7.6,1.5,.055,.13,warm);
    }
    for(const [left,right] of [[1.61,3.38],[3.38,5.15],[5.15,6],[6,6.85],[6.85,8.64],[8.64,10.44]]){
      const door=left>=5.15&&right<=6.85,cx=x+(left+right)/2,w=right-left;
      const pane=new T.Mesh(new T.PlaneGeometry(w-.065,door?2.75:3.2),glazing);pane.rotation.y=Math.PI;pane.position.set(cx,door?2.155:2.25,z-9.04);scene.add(pane);
      for(const edge of [left,right])box(scene,x+edge,door?2.155:2.25,z-9.06,.045,door?2.83:3.3,.065,frame);
      if(door){
        for(const py of [.75,3.56])box(scene,cx,py,z-9.06,w,.055,.07,frame);
        box(scene,cx,.91,z-9.08,w-.07,.23,.035,bronze);
        box(scene,cx,2.05,z-9.085,w-.08,.04,.014,plaster);
        box(scene,cx,3.47,z-9.12,.25,.065,.075,bronze);
      }
    }
    box(scene,x+6,3.68,z-9.08,1.86,.16,.21,frame);
    box(scene,x+6,3.66,z-9.21,.14,.06,.045,dark);
    for(const dx of [-2.4,2.4])box(scene,x+6+dx,3.82,z-9.65,.045,.09,2.1,bronze);
    box(scene,x+6,3.8,z-10.7,4.84,.11,.055,bronze);
    box(scene,x+6,.832,z-9.24,1.7,.025,.35,bronze);
    for(let fin=0;fin<11;fin++)box(scene,x+11.05,2.4,z-8.4+fin*.51,.5,3.5,.065,wood);
    const sidePane=new T.Mesh(new T.PlaneGeometry(5.7,3.2),glazing);sidePane.rotation.y=Math.PI/2;sidePane.position.set(x+10.57,2.3,z-5.8);scene.add(sidePane);
    const title=new T.Mesh(new T.PlaneGeometry(8.8,2.2),new T.MeshBasicMaterial({map:signTexture('ЦЕНТР ТБС','ТРАНСПОРТ БУДУЩЕГО · САМАРА'),toneMapped:false}));title.rotation.y=Math.PI;title.position.set(x+5.8,5.35,z-8.9);scene.add(title);
    box(scene,x+5.8,5.35,z-8.8,9,2.35,.2,frame);
    const sideTitle=new T.Mesh(new T.PlaneGeometry(6.2,1.55),new T.MeshBasicMaterial({map:signTexture('ЦЕНТР ТБС','САМАРА · ТЕХНОЛОГИИ'),toneMapped:false}));sideTitle.rotation.y=Math.PI/2;sideTitle.position.set(x+11.4,5.25,z-5.65);scene.add(sideTitle);
    architecturalPanel(scene,x+11.86,6.1,z+5,8,5,Math.PI/2,factoryTexture,'ТБС','САМАРА');
    architecturalPanel(scene,x-5.9,2.1,z-2.6,6,3.2,Math.PI,droneTexture,'ТБС','ТЕХНОЛОГИИ');
    for(let fin=0;fin<11;fin++)box(scene,x-11.6+fin*.32,5.85,z-2.65,.08,10.4,.55,bronze);
    flat(scene,x-6,.405,z-7.4,10,8,plazaPaving);
    // Fine paving scale, perimeter drainage and street fittings around the entrance.
    flat(scene,x+5.8,.415,z-10.55,10.8,2.45,visualAssets.material('paving',10.8,2.45));
    for(let n=0;n<42;n++)box(scene,x-11.4+n*.55,.437,z-11.72,.36,.018,.035,frame);
    for(const dx of [-10,-6,2,10]){
      const bollard=new T.Mesh(new T.CylinderGeometry(.065,.085,.9,12),frame);bollard.position.set(x+dx,.87,z-12.05);bollard.castShadow=true;scene.add(bollard);
      box(scene,x+dx,1.16,z-12.05,.14,.05,.14,plaster);
    }
    const grate=new T.Mesh(new T.CylinderGeometry(.4,.4,.028,40),frame);grate.position.set(x+13.65,.127,z-5);scene.add(grate);
    for(let rib=-3;rib<=3;rib++)box(scene,x+13.65+rib*.085,.145,z-5,.025,.015,.5,bronze);
    for(const dx of [-10,10]){
      const bin=box(scene,x+dx,.99,z-10.7,.55,1.1,.55,frame);bin.castShadow=true;
      for(let slat=0;slat<5;slat++)box(scene,x+dx-.22+slat*.11,1,z-11,.055,.86,.06,wood);
      box(scene,x+dx,1.57,z-10.7,.62,.065,.62,bronze);
    }
    for(const bz of [z-10,z-4.1]){
      flat(scene,x-6,.421,bz,8.8,1.5,contact);
      for(let slat=0;slat<6;slat++)box(scene,x-6,.91,bz-.42+slat*.16,4.2,.11,.12,wood);
      for(const side of [-1,1])box(scene,x-6+side*1.7,.64,bz,.12,.5,.85,frame);
    }
    addFlag(x-11,z-9);addFlag(x+11,z+10.4);
    const leafGeometry=new T.BufferGeometry();
    leafGeometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.13,.19,0,0,.22,.045,.13,.19,0,0,.48,0],3));leafGeometry.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]);leafGeometry.computeVertexNormals();
    const foliage=new T.MeshStandardMaterial({color:0x526b3b,roughness:.88,side:T.DoubleSide});
    const barkTexture=makeTexture((c,w,h)=>{c.fillStyle='#63584a';c.fillRect(0,0,w,h);for(let n=0;n<180;n++){c.strokeStyle=n%2?'#312f2860':'#b3a48655';c.lineWidth=1+n%3;c.beginPath();for(let y=0;y<=h;y+=12){const px=(n*29)%w+Math.sin(y*.07+n)*2;y?c.lineTo(px,y):c.moveTo(px,y);}c.stroke();}},128,256);
    const bark=new T.MeshStandardMaterial({map:barkTexture,bumpMap:barkTexture,bumpScale:.055,roughness:1});
    // Individual bent leaves are grouped around branch tips, with a cheaper distant crown.
    function specimenTree(tx,tz,seed){
      flat(scene,tx,.43,tz,4.7,4.7,contact);
      const trunkPath=new T.CatmullRomCurve3([new T.Vector3(tx,.65,tz),new T.Vector3(tx+.08,2.2,tz-.08),new T.Vector3(tx-.12,3.7,tz+.12),new T.Vector3(tx+.08,5.1,tz)]);
      const trunk=new T.Mesh(new T.TubeGeometry(trunkPath,12,.15,9,false),bark);trunk.castShadow=true;scene.add(trunk);
      const tips=[];for(let n=0;n<9;n++){const a=n*2.399+seed,end=[tx+Math.cos(a)*1.35,4.7+(n%3)*.65,tz+Math.sin(a)*1.35];tips.push(new T.Vector3(end[0]-tx,end[1],end[2]-tz));detailBar(scene,[tx,2.7+n*.14,tz],end,.055,bark);for(const s of [-1,1])detailBar(scene,end,[end[0]+Math.cos(a+s*.7)*.65,end[1]+.45,end[2]+Math.sin(a+s*.7)*.65],.021,bark);}
      const lod=new T.LOD();lod.position.set(tx,0,tz);scene.add(lod);
      for(const [count,distance] of [[1800,0],[160,65]]){
        const leaves=new T.InstancedMesh(distance?unitPlane:leafGeometry,distance?cityLeafMaterials[2]:foliage,count),pose=new T.Object3D();
        for(let n=0;n<count;n++){const a=n*2.399+seed,v=((n*.618034)%1)*2-1,r=Math.sqrt(1-v*v)*(.4+((n*.754877)%1)*.65),tip=tips[n%tips.length];pose.position.set(tip.x+Math.cos(a)*r,tip.y+.15+v*.95,tip.z+Math.sin(a)*r);pose.rotation.set(n*.71,n*1.31,n*.43);pose.scale.setScalar(distance?1.4:.8+(n%5)*.09);pose.updateMatrix();leaves.setMatrixAt(n,pose.matrix);if(!distance)leaves.setColorAt(n,new T.Color().setHSL(.22+(n%7)*.007,.36,.22+(n%11)*.014));}
        leaves.castShadow=true;leaves.receiveShadow=true;lod.addLevel(leaves,distance);
      }
      box(scene,tx,.56,tz,2.8,.25,2.8,stone);flat(scene,tx,.7,tz,2.55,2.55,grassMat);
    }
    visualAssets.plant(scene,x-9.3,z-6.6,0);visualAssets.plant(scene,x-2.3,z-9.5,1,.87);visualAssets.plant(scene,x+11.5,z+9.5,2,1.05);
    const lightStripMaterial=new T.MeshStandardMaterial({color:0xffe0b6,emissive:0xffc887,emissiveIntensity:.1,roughness:.5});
    const entranceLight=new T.PointLight(0xffd2a0,0,15,2);entranceLight.position.set(x+6,3.7,z-7);scene.add(entranceLight);
    const windowLight=new T.PointLight(0xffddb2,0,12,2);windowLight.position.set(x+5.5,2.9,z-4.8);scene.add(windowLight);
    const bounce=new T.PointLight(0xe8d6b3,0,20,2);bounce.position.set(x+10,2.6,z-10.8);scene.add(bounce);
    box(scene,x+6,4.045,z-8.15,8.5,.045,.13,lightStripMaterial);
    for(const px of [x-7.8,x-4.4]){box(scene,px,.94,z-10.8,.2,1.05,.2,frame);box(scene,px,1.34,z-10.8,.23,.11,.23,lightStripMaterial);}
    const shade=contact.clone();shade.opacity=.45;flat(scene,x+6,.415,z-7.6,10.3,3.1,shade);
    const poolMaterial=new T.MeshBasicMaterial({map:glowTexture,color:0xffc58f,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});
    const pool=flat(scene,x+6,.427,z-8.4,10,4.5,poolMaterial);
    scene.userData.quarterLighting={x,z,entranceLight,windowLight,bounce,lightStripMaterial,poolMaterial,reflective:[glazing,bronze,frame]};
    const planting=new T.InstancedMesh(visualAssets.leaf,visualAssets.foliage,1100),plantPose=new T.Object3D();
    for(let n=0;n<1100;n++){const bed=n%2,bx=x-9.3+bed*7,bz=z-6.5-bed*3,a=n*2.399,r=Math.sqrt((n*.618034)%1)*1.05;plantPose.position.set(bx+Math.cos(a)*r,.75+((n*.41421)%1)*.6,bz+Math.sin(a)*r);plantPose.rotation.set(n*.4,n*.73,n*.13);plantPose.scale.setScalar(.6+(n%4)*.12);plantPose.updateMatrix();planting.setMatrixAt(n,plantPose.matrix);planting.setColorAt(n,new T.Color().setHSL(.24,.36,.22+(n%9)*.015));}planting.castShadow=true;planting.receiveShadow=true;scene.add(planting);
    const grassGeometry=new T.BufferGeometry();grassGeometry.setAttribute('position',new T.Float32BufferAttribute([-.018,0,0,.018,0,0,.045,.32,.035,.06,.58,.085],3));grassGeometry.setIndex([0,1,2,0,2,3]);grassGeometry.computeVertexNormals();
    const grass=new T.InstancedMesh(grassGeometry,foliage,480);
    for(let n=0;n<480;n++){const bed=n%2;plantPose.position.set(x-9.3+bed*7+Math.sin(n*2.4)*1.15,.73,z-6.5-bed*3+Math.cos(n*1.3)*1.15);plantPose.rotation.set(0,n*2.4,0);plantPose.scale.setScalar(.6+(n%8)*.09);plantPose.updateMatrix();grass.setMatrixAt(n,plantPose.matrix);grass.setColorAt(n,new T.Color().setHSL(.2,.32,.3+(n%6)*.025));}scene.add(grass);
    // Bevelled facing slabs share one geometry and one instanced draw call.
    const panelShape=new T.Shape();panelShape.moveTo(-.48,-.48);panelShape.lineTo(.48,-.48);panelShape.lineTo(.48,.48);panelShape.lineTo(-.48,.48);panelShape.closePath();
    const panelGeometry=new T.ExtrudeGeometry(panelShape,{depth:.96,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:1,steps:1});panelGeometry.translate(0,0,-.48);
    const facing=plaster.clone();facing.color.setHex(0xc9c3b3);facing.bumpScale=.008;
    const panels=new T.InstancedMesh(panelGeometry,facing,claddingPanels.length),panelPose=new T.Object3D();
    panels.name='Start quarter bevelled facade panels';
    claddingPanels.forEach((p,i)=>{panelPose.position.set(p.x,p.y,p.z);panelPose.rotation.set(0,p.side?Math.PI/2:0,0);panelPose.scale.set(p.w,p.h,.065);panelPose.updateMatrix();panels.setMatrixAt(i,panelPose.matrix);panels.setColorAt(i,new T.Color().setScalar(.94+(i*17%11)*.006))});
    panels.receiveShadow=true;panels.castShadow=true;scene.add(panels);
    scene.userData.showcaseQuarter={x,z,trees:3,windowBays:27,claddingPanels:claddingPanels.length};
  }
  for(let j=0;j<roadsZ.length-1;j++)for(let i=0;i<roadsX.length-1;i++){
    const left=roadsX[i]+ROAD/2+1.2,right=roadsX[i+1]-ROAD/2-1.2;
    const top=roadsZ[j]+ROAD/2+1.2,bottom=roadsZ[j+1]-ROAD/2-1.2;
    const cx=(left+right)/2,cz=(top+bottom)/2,w=right-left,d=bottom-top;
    flat(scene,cx,.1,cz,w+2.4,d+2.4,roadSurface(w+2.4,d+2.4));
    const landmark=special.get(i+','+j);
    const isPark=isParkBlock(i,j);
    const isIndustrial=j===1&&(i===4||i===5);
    const isParking=!landmark&&!isPark&&!isIndustrial&&(i+j)%4===1;
    if(!isParking){
      roundedSidewalk(cx,cz,w+2.4,d+2.4,4);
    }
    if(i===0&&j===0){
      showcaseQuarter(cx,cz);
    }else if(landmark){
      building(scene,cx,cz,w-3,d-3,landmark.h,17+i*3+j,/ЗАВОД|НПЦ|АВТОВАЗ/.test(landmark.name)?'factory':'campus');
      const pad=new T.Mesh(new T.RingGeometry(3.35,3.57,36),landingMat);
      pad.rotation.x=-Math.PI/2;pad.position.set(cx-3,landmark.h+.37,cz+2);scene.add(pad);
      box(scene,cx-3,landmark.h+.39,cz+2,2.9,.04,.11,landingMat);
      box(scene,cx-3,landmark.h+.39,cz+2,.11,.04,2.9,landingMat);
      const faceZ=cz-(d-3)/2-.25;
      const photoHeight=landmark.h-4.6,photoY=3.8+photoHeight/2;
      architecturalPanel(scene,cx,photoY,faceZ-.14,w-5,photoHeight,Math.PI,landmark.photo||factoryTexture,landmark.name,landmark.sub);
      architecturalPanel(scene,cx+(w-3)/2+.38,photoY,cz,d-5,photoHeight,Math.PI/2,landmark.photo||droneTexture,landmark.name,landmark.sub);
      architecturalPanel(scene,cx,photoY,cz+(d-3)/2+.38,w-5,photoHeight,0,landmark.photo||factoryTexture,landmark.name,landmark.sub);
      architecturalPanel(scene,cx-(w-3)/2-.38,photoY,cz,d-5,photoHeight,-Math.PI/2,landmark.photo||droneTexture,landmark.name,landmark.sub);
      streetNameplate(cx,faceZ-.45,w-5,Math.PI,landmark.name);
      streetNameplate(cx,cz+(d-3)/2+.7,w-5,0,landmark.name);
      streetNameplate(cx+(w-3)/2+.7,cz,d-5,Math.PI/2,landmark.name);
      streetNameplate(cx-(w-3)/2-.7,cz,d-5,-Math.PI/2,landmark.name);
      // Roof lettering is a physical sign, fixed to the architecture.
      box(scene,cx,landmark.h+2.2,faceZ+.3,20.4,5.4,.5,dark);
      const lettering=signTexture(landmark.name,landmark.sub);
      const signWidth=Math.min(w-4,20);
      const nameplate=new T.Mesh(new T.PlaneGeometry(signWidth,signWidth/4),new T.MeshBasicMaterial({map:lettering,toneMapped:false}));
      nameplate.rotation.y=Math.PI;nameplate.position.set(cx,landmark.h+2.2,faceZ);scene.add(nameplate);
      const label=sprite(scene,lettering,cx,landmark.h+5.6,cz,18,4.5);
      label.material.toneMapped=false;label.material.fog=false;
      districtLabels.push(label);
      addFacadeLighting(cx,cz,w-3,d-3,landmark.h);
      addFlag(cx-w/3,cz+d/2+1);
      addFlag(cx+w/3,cz+d/2+1);
      addFlag(cx-w/3,cz-d/2-1);
      addFlag(cx+w/3,cz-d/2-1);
    }else if(i===3&&j===3){
      square(cx,cz,w,d);
    }else if(isIndustrial){
      industrialYard(cx,cz,w,d,i===5);
    }else if(isPark){
      park(cx,cz,w,d,i+j);busStop(cx,top+1.7);
    }else if(isParking){
      const back=bottom-11;
      parkingLots.push({left,right,top,bottom:back,cx,road:roadsZ[j]});
      flat(scene,cx,.15,(top+back)/2,w,back-top,roadSurface(w,back-top));
      flat(scene,cx,.16,(roadsZ[j]+top)/2,8,top-roadsZ[j],roadMat);
      if(i===1&&j===0)showcasePavilion(cx,bottom-4.5,w-3,7);
      else building(scene,cx,bottom-4.5,w-3,7,7,i+j,'office');
      for(let bay=0;bay<5;bay++){
        const x=left+3+bay*5;
        flat(scene,x-2.3,.18,back-3.8,.1,6.4,laneMat);
        flat(scene,x,.18,back-.65,4.6,.1,laneMat);
        box(scene,x,.28,back-1,2.25,.22,.28,curbMat);
        if(bay===0||bay===2||bay===4)parkedCars.push({x,z:back-4.3,a:Math.PI,seed:i*5+j+bay});
      }
      // Charging terminals and a readable sign identify the company parking.
      for(const x of [left+3,left+13]){
        box(scene,x,1.2,back-.1,.7,2,.48,dark);
        box(scene,x,1.55,back-.36,.5,.55,.04,cyanMat);
        box(scene,x,2.26,back-.1,.85,.15,.6,orangeMat);
      }
      box(scene,cx-5,1.8,top,.1,3.6,.1,trimMat);
      const parkingSign=new T.Mesh(new T.PlaneGeometry(5,1.25),new T.MeshBasicMaterial({map:signTexture('P · ТБС','ПАРКОВКА · ЭЛЕКТРО'),toneMapped:false,side:T.DoubleSide}));
      parkingSign.position.set(cx-5,3.2,top);parkingSign.rotation.y=Math.PI;scene.add(parkingSign);
      addFlag(right-1,bottom-1);
    }else if((i+j)%3===0){
      // Two residential wings leave a planted courtyard and a clear central footpath.
      const hasParking=(i+j)%2===0;
      residentialCourts.push({x:cx,z:cz,parking:hasParking});
      for(const side of [-1,1])building(scene,cx+side*w*.26,cz+3,w*.35,d*.43,12+((i*3+j)%4)*3.2,i*17+j+(side+1),'residential');
      flat(scene,cx,.4,cz,3.2,d-1,pavingMat);
      gazebo(cx+7,cz-6.2);
      if(hasParking){
        const lot={left:cx-12,right:cx-2.5,top,bottom:cz-3,cx:cx-5.2,road:roadsZ[j]};parkingLots.push(lot);
        flat(scene,cx-7.25,.42,(top+cz-3)/2,9.5,cz-3-top,roadMat);
        flat(scene,lot.cx,.43,(roadsZ[j]+top)/2,5.8,top-roadsZ[j],roadMat);
        for(const px of [cx-11.5,cx-7.2,cx-2.9])flat(scene,px,.44,cz-6.2,.09,5.8,laneMat);
        parkedCars.push({x:cx-9.3,z:cz-6.2,a:Math.PI,seed:i*9+j});
      }else playground(cx-7,cz-6.5);
      for(const side of [-1,1]){
        if(side===-1&&hasParking)continue;
        gardenBed(cx+side*w*.27,top+1.6,w*.34,2.2,i+j+(side+1));
        tree(cx+side*w*.27,top+1.6,i+j+(side+1),false);
        box(scene,cx+side*3.1,.87,cz,1.1,.17,2.6,roofMat);
        for(const leg of [-1,1])box(scene,cx+side*3.1,.58,cz+leg*.9,.75,.5,.12,trimMat);
      }
      flowerBed(cx,cz+d/2-1.4,3.2,1.3,i+j);
    }else if((i+j)%3===1){
      building(scene,cx+1,cz+2,w*.67,d*.66,19+(i+j)%4*3.2,i*19+j,'office');
      gardenBed(cx,top+1.55,w*.7,2.1,i+j);
      for(const side of [-1,1])tree(cx+side*w*.32,top+1.6,i+j+(side+1),false);
    }else{
      for(let n=0;n<3;n++){
        const bx=left+5+n*(w-10)/2;
        const height=7+((i*7+j*3+n*5)%13)+(j>1&&n===1?8:0);
        building(scene,bx,cz,Math.max(4,w/3-2),d-3,height,i*17+j*11+n);
      }
    }
  }

  // Batch stationary architecture; moving vehicles and image panels remain separate.
  // Pilot intersection: photogrammetric asphalt, shared world-aligned UVs.
  if(window.TBS_ASPHALT031){
    const maps={},loader=new T.TextureLoader();
    for(const key of ['map','normalMap','roughnessMap']){
      const texture=loader.load(window.TBS_ASPHALT031[key]);
      texture.encoding=key==='map'?T.sRGBEncoding:T.LinearEncoding;
      texture.wrapS=texture.wrapT=T.RepeatWrapping;
      texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      maps[key]=texture;
    }
    const asphalt=new T.MeshStandardMaterial({...maps,color:0xc4c8cc,roughness:.96,metalness:0,normalScale:new T.Vector2(.38,.38)});
    asphalt.name='Asphalt031-photogrammetry';
    for(const [x,z,w,d] of [[68,30,64,ROAD],[68,21.9,ROAD,3.8],[68,48.1,ROAD,23.8]]){
      const geometry=new T.PlaneGeometry(w,d),p=geometry.attributes.position,uv=geometry.attributes.uv;
      for(let i=0;i<p.count;i++)uv.setXY(i,(x+p.getX(i))/4,(p.getY(i)-z)/4);
      const surface=new T.Mesh(geometry,asphalt);
      surface.name='Start intersection photographic asphalt';
      surface.rotation.x=-Math.PI/2;surface.position.set(x,.153,z);surface.receiveShadow=true;scene.add(surface);
    }
    const paint=makeTexture((c,w,h)=>{
      c.fillStyle='#eee9d9';c.fillRect(0,0,w,h);
      let seed=31031;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
      c.globalCompositeOperation='destination-out';
      for(let i=0;i<750;i++){c.globalAlpha=.25+rand()*.65;c.fillRect(rand()*w,rand()*h,1+rand()*2,1+rand()*3)}
      for(let i=0;i<100;i++){const y=rand()*h,s=1+rand()*4;c.globalAlpha=.75;c.fillRect(i%2?0:w-s,y,s,1+rand()*5)}
      c.globalAlpha=1;c.globalCompositeOperation='source-over';
    },256,256);
    const paintMat=new T.MeshStandardMaterial({map:paint,transparent:true,alphaTest:.2,roughness:.95,metalness:0});
    paintMat.name='Local worn road paint';
    for(const mesh of scene.children){
      if(mesh.material!==laneMat&&mesh.material!==crosswalkMat)continue;
      const {x,z}=mesh.position;
      if(!((x>=36&&x<=100&&Math.abs(z-30)<=ROAD/2)||(Math.abs(x-68)<=ROAD/2&&z>=20&&z<=60)))continue;
      if(mesh.material===laneMat)mesh.position.y=.174;
      mesh.material=paintMat;
    }
  }
  const staticBatches=new Map();
  for(const child of [...scene.children])if(child.isMesh&&child.geometry===unitBox){
    if(Math.max(child.scale.x,child.scale.z)>84)continue;
    const key=child.material.uuid+':'+Math.floor(child.position.x/84)+':'+Math.floor(child.position.z/80);
    if(!staticBatches.has(key))staticBatches.set(key,[]);
    staticBatches.get(key).push(child);
  }
  for(const meshes of staticBatches.values()){
    if(meshes.length<3)continue;
    const batch=new T.InstancedMesh(unitBox,meshes[0].material,meshes.length);
    meshes.forEach((mesh,i)=>{mesh.updateMatrix();batch.setMatrixAt(i,mesh.matrix);scene.remove(mesh);});
    batch.castShadow=meshes.some(m=>m.castShadow);batch.receiveShadow=true;scene.add(batch);
  }

  function addFlag(x,z){
    const pole=new T.Mesh(new T.CylinderGeometry(.055,.065,4.6,8),whiteMat);
    pole.position.set(x,2.5,z);scene.add(pole);
    const fabric=new T.Mesh(new T.PlaneGeometry(2.8,1.65,14,5),new T.MeshStandardMaterial({map:flagTexture,color:0xffffff,side:T.DoubleSide,roughness:.95}));
    fabric.position.set(x+1.4,4.7,z);fabric.castShadow=true;scene.add(fabric);
    flags.push(fabric);
    box(scene,x,5.7,z,.19,.2,.19,orangeMat);
  }

  function wedge(parent,width,zFront,zBack,bottom,frontHeight,backHeight,material){
    const a=-width/2,b=width/2;
    const vertices=new Float32Array([
      a,bottom,zFront, b,bottom,zFront, b,bottom,zBack, a,bottom,zBack,
      a,frontHeight,zFront, b,frontHeight,zFront, b,backHeight,zBack, a,backHeight,zBack
    ]);
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(vertices,3));
    geometry.setIndex([0,5,1,0,4,5, 3,2,6,3,6,7, 0,3,7,0,7,4, 1,5,6,1,6,2, 4,7,6,4,6,5, 0,1,2,0,2,3]);
    geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;parent.add(mesh);return mesh;
  }

  function coachwork(parent,w,length,height,y,material){
    const r=Math.min(.24,w*.42,length*.42),x=-w/2,z=-length/2,shape=new T.Shape();
    shape.moveTo(x+r,z);shape.lineTo(x+w-r,z);shape.quadraticCurveTo(x+w,z,x+w,z+r);
    shape.lineTo(x+w,z+length-r);shape.quadraticCurveTo(x+w,z+length,x+w-r,z+length);
    shape.lineTo(x+r,z+length);shape.quadraticCurveTo(x,z+length,x,z+length-r);
    shape.lineTo(x,z+r);shape.quadraticCurveTo(x,z,x+r,z);
    const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.075,bevelThickness:.075,curveSegments:6}),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function detailBar(parent,a,b,r,material){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
    const mesh=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),material);
    mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function glazedQuad(parent,points,material){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,material);parent.add(mesh);return mesh;
  }
  function createHeroShell(group,paint,variant='sedan',premium=false){
    const compact=variant==='compact',roofRear=compact?1.03:.73;
    // Continuous cross sections give the hood, shoulders and wheel arches a shaped silhouette.
    const stations=[[-2.84,1.06,1.04],[-2.58,1.27,1.16],[-2.1,1.36,1.27],[-1.5,1.35,1.35],[-.8,1.3,1.35],[.2,1.29,1.34],[1.2,1.34,1.32],[1.85,1.37,1.3],[2.45,1.28,1.2],[2.81,1.08,1.1]];
    const positions=[],indices=[],samples=premium?180:100,sectionWidth=premium?21:7;
    const profile=(i,t,k)=>{const a=stations[Math.max(0,i-1)][k],b=stations[i][k],c=stations[i+1][k],d=stations[Math.min(stations.length-1,i+2)][k];return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);};
    for(let n=0;n<=samples;n++){
      const z=-2.84+n*5.65/samples;let i=0;while(i<stations.length-2&&z>stations[i+1][0])i++;
      const a=stations[i],b=stations[i+1],t=(z-a[0])/(b[0]-a[0]),smooth=t*t*(3-2*t),w=premium?profile(i,t,1):a[1]+(b[1]-a[1])*smooth,h=premium?profile(i,t,2):a[2]+(b[2]-a[2])*smooth;
      const wheelDistance=Math.min(Math.abs(z-1.75),Math.abs(z+1.75));
      const low=wheelDistance<.63?Math.max(.6,.52+Math.sqrt(.63*.63-wheelDistance*wheelDistance)):.6;
      const section=premium?[[-w,low],[-w,h-.14],[-w*.97,h-.07],[-w*.9,h-.018],[-w*.65,h+.02],[0,h+.045],[w*.65,h+.02],[w*.9,h-.018],[w*.97,h-.07],[w,h-.14],[w,low]]:[[-w,low],[-w,h-.1],[-w*.82,h],[0,h+.045],[w*.82,h],[w,h-.1],[w,low]];
      if(premium){
        // Rounded shoulders connect the bonnet and flanks without hard strips.
        const curve=new T.CatmullRomCurve3(section.map(([x,y])=>new T.Vector3(x,y,z)));
        for(const point of curve.getPoints(sectionWidth-1))positions.push(point.x,point.y,point.z);
      }else for(const [x,y] of section)positions.push(x,y,z);
      if(n<samples)for(let side=0;side<sectionWidth-1;side++){const v=n*sectionWidth+side;indices.push(v,v+sectionWidth,v+1,v+1,v+sectionWidth,v+sectionWidth+1);}
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const shell=new T.Mesh(geometry,paint);shell.castShadow=true;shell.receiveShadow=true;group.add(shell);
    for(const z of [-2.81,2.78])box(group,0,.84,z,2.1,.43,.12,paint);
    box(group,0,.57,0,2.25,.18,4.6,dark);
    const interior=mat(0x182127,0,.93),seatMat=mat(0x4a5758,0,.86),alloy=mat(0xa4b3b5,.85,.22);
    const glazing=new T.MeshPhysicalMaterial({color:0x88b9c5,metalness:.12,roughness:.13,clearcoat:1,transparent:true,opacity:.38,depthWrite:false,side:T.DoubleSide,envMapIntensity:1.1});
    // An open cabin with separate glass surfaces reveals the seats and dashboard.
    box(group,0,1.3,-.05,2.2,.12,2.4,interior);
    box(group,0,1.48,-1.04,2.03,.23,.38,interior);
    for(const side of [-1,1])for(const z of [-.5,.62]){
      const seat=coachwork(group,.72,.7,.12,1.36,seatMat);seat.position.set(side*.57,1.36,z);
      const back=box(group,side*.57,1.64,z+.26,.67,.62,.15,seatMat);back.rotation.x=-.13;
      box(group,side*.57,1.99,z+.28,.38,.23,.13,interior);
    }
    const steeringWheel=new T.Mesh(new T.TorusGeometry(.23,.034,8,24),interior);steeringWheel.position.set(-.57,1.71,-.88);steeringWheel.rotation.x=-.3;group.add(steeringWheel);group.userData.steeringWheel=steeringWheel;
    box(group,0,1.6,-1.06,.39,.23,.04,cyanMat);
    if(premium){
      const vertices=[],faces=[],nx=16,nz=16;
      for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){const u=ix/nx*2-1,v=iz/nz*2-1;vertices.push(u*(.965-.035*Math.pow(Math.abs(v),6)),2.1+.085*(1-u*u)+.025*(1-v*v),-.1+v*.86);}
      for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){const a=iz*(nx+1)+ix;faces.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
      const roofGeometry=new T.BufferGeometry();roofGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));roofGeometry.setIndex(faces);roofGeometry.computeVertexNormals();const roof=new T.Mesh(roofGeometry,paint);roof.castShadow=true;group.add(roof);
    }else{const roof=coachwork(group,1.93,compact?1.98:1.68,.045,2.12,paint);roof.position.z=compact?.05:-.1;}
    glazedQuad(group,[[-1.04,1.4,-1.48],[1.04,1.4,-1.48],[.91,2.1,-.93],[-.91,2.1,-.93]],glazing);
    glazedQuad(group,[[-.91,2.1,roofRear],[.91,2.1,roofRear],[1.08,1.4,1.39],[-1.08,1.4,1.39]],glazing);
    for(const side of [-1,1]){
      const bottomFront=[side*1.12,1.39,-1.45],topFront=[side*.94,2.1,-.9],topBack=[side*.94,2.1,roofRear-.02],bottomBack=[side*1.13,1.39,1.38];
      glazedQuad(group,[bottomFront,topFront,topBack,bottomBack],glazing);
      detailBar(group,bottomFront,topFront,.055,paint);detailBar(group,topFront,topBack,.05,paint);detailBar(group,topBack,bottomBack,.08,paint);detailBar(group,bottomBack,bottomFront,.025,alloy);
      detailBar(group,[side*1.13,1.4,.05],[side*.95,2.1,.05],.045,interior);
      detailBar(group,[side*1.31,.74,-.95],[side*1.31,1.31,-.97],.012,dark);
      detailBar(group,[side*1.31,.72,.16],[side*1.31,1.32,.16],.012,dark);
      box(group,side*1.32,1.25,-.05,.035,.055,.28,alloy);
      box(group,side*1.32,1.25,.99,.035,.055,.25,alloy);
      box(group,side*1.31,.62,.05,.07,.12,1.98,dark);
      box(group,side*1.345,.77,.04,.025,.055,1.85,orangeMat);
      const mirror=coachwork(group,.29,.39,.12,1.55,paint);mirror.position.x=side*1.5;mirror.position.z=-1.04;
      box(group,side*1.5,1.62,-.84,.25,.1,.025,alloy);
      // Recessed lamp housings, individual lenses and a daytime-running light strip.
      box(group,side*.89,1.06,-2.79,.69,.28,.13,interior);
      for(let lamp=0;lamp<(premium?0:3);lamp++){
        const lens=new T.Mesh(new T.SphereGeometry(.072,12,8),new T.MeshBasicMaterial({color:0xe5faff,toneMapped:false}));lens.scale.z=.4;lens.position.set(side*(.66+lamp*.18),1.07,-2.875);group.add(lens);
      }
      detailBar(group,[side*.56,1.22,-2.76],[side*1.21,1.2,-2.58],.022,whiteMat);
      box(group,side*.88,.73,-2.76,.4,.12,.09,dark);
      const badge=new T.Mesh(new T.PlaneGeometry(.45,.45),new T.MeshBasicMaterial({map:markTexture,transparent:true,toneMapped:false}));badge.rotation.y=side*Math.PI/2;badge.position.set(side*1.345,1.01,-.48);group.add(badge);
    }
    for(let fin=0;fin<5;fin++)box(group,(fin-2)*.25,.68,2.72,.065,.2,.38,dark);
    const plateTexture=makeTexture((c,w,h)=>{c.fillStyle='#e0e7e3';c.fillRect(0,0,w,h);c.fillStyle='#15242c';c.font='bold 45px sans-serif';c.textAlign='center';c.fillText('ТБС 063',w/2,55);},256,80);
    const plate=new T.Mesh(new T.PlaneGeometry(.87,.27),new T.MeshBasicMaterial({map:plateTexture,toneMapped:false}));plate.position.set(0,.89,2.88);group.add(plate);
    group.userData.detailedBody=true;
  }
  function createCommercialBody(group,paint,variant){
    const shuttle=variant==='shuttle',top=shuttle?3.08:2.78;
    const cabinGlass=new T.MeshPhysicalMaterial({color:0x86b5c3,metalness:.1,roughness:.17,transparent:true,opacity:.4,depthWrite:false,side:T.DoubleSide});
    const seats=mat(shuttle?0x467a82:0x424d53,0,.87);
    box(group,0,1.3,.05,2.35,.15,4.3,dark);
    const roof=coachwork(group,2.47,4.35,.1,top,paint);roof.position.z=.1;
    glazedQuad(group,[[-1.12,1.47,-2.2],[1.12,1.47,-2.2],[1.06,top-.08,-1.85],[-1.06,top-.08,-1.85]],cabinGlass);
    box(group,0,1.58,-1.8,2.12,.22,.42,dark);
    for(const side of [-1,1]){
      detailBar(group,[side*1.14,1.4,-2.18],[side*1.09,top,-1.84],.06,paint);
      box(group,side*1.22,1.46,.25,.14,.44,3.9,paint);
      box(group,side*1.25,1.61,.14,.045,.08,3.9,orangeMat);
      box(group,side*1.48,2.05,-1.8,.28,.23,.3,paint);
      for(let row=0;row<(shuttle?3:1);row++){
        const z=-1.1+row*1.2;
        box(group,side*.6,1.56,z,.65,.16,.62,seats);box(group,side*.6,1.96,z+.26,.64,.75,.13,seats);
        box(group,side*.6,2.39,z+.26,.35,.18,.13,dark);
      }
      if(shuttle){
        glazedQuad(group,[[side*1.245,1.75,-1.72],[side*1.245,top-.12,-1.72],[side*1.245,top-.12,2.08],[side*1.245,1.75,2.08]],cabinGlass);
        for(let rib=0;rib<4;rib++)box(group,side*1.26,(top+1.7)/2,-1.73+rib*1.28,.07,top-1.7,.055,paint);
        for(const z of [-.83,.12])box(group,side*1.28,1.9,z,.045,2.12,.045,trimMat);
        box(group,side*1.3,.61,-.36,.3,.13,1.15,trimMat);
      }else{
        box(group,side*1.19,2.13,.96,.18,1.28,2.25,paint);
        glazedQuad(group,[[side*1.25,1.75,-1.74],[side*1.25,top-.16,-1.74],[side*1.25,top-.16,-.23],[side*1.25,1.75,-.23]],cabinGlass);
        box(group,side*1.28,2.18,-.17,.08,1.22,.1,paint);
        for(let rib=0;rib<4;rib++)box(group,side*1.295,2.05,.15+rib*.49,.035,.7,.035,trimMat);
      }
      const logo=new T.Mesh(new T.PlaneGeometry(.56,.56),new T.MeshBasicMaterial({map:markTexture,transparent:true,toneMapped:false}));logo.rotation.y=side*Math.PI/2;logo.position.set(side*1.3,shuttle?1.28:2.26,shuttle?1.3:1);group.add(logo);
    }
    box(group,0,1.67,2.25,2.36,.4,.12,paint);
    if(shuttle){
      glazedQuad(group,[[-1.11,1.88,2.28],[1.11,1.88,2.28],[1.11,top-.1,2.28],[-1.11,top-.1,2.28]],cabinGlass);
      const sign=new T.Mesh(new T.PlaneGeometry(1.95,.4875),new T.MeshBasicMaterial({map:signTexture('ТБС · 01','ЭЛЕКТРОШАТТЛ'),toneMapped:false}));sign.rotation.y=Math.PI;sign.position.set(0,top+.02,-2.105);group.add(sign);
      box(group,0,top+.02,-2.02,2.07,.56,.15,dark);
      box(group,0,top+.25,.9,1.55,.32,1.3,trimMat);
    }else{
      box(group,0,2.15,2.25,2.33,1.18,.12,paint);
      box(group,0,2.15,2.32,.035,1.2,.025,dark);
      for(const side of [-1,1])box(group,side*.21,2.05,2.34,.18,.05,.04,trimMat);
      for(const z of [-.1,1.6])box(group,0,top+.22,z,2.12,.07,.08,trimMat);
    }
    group.userData.detailedBody=true;
  }
  const vehicleShadowTexture=makeTexture((c,w,h)=>{
    const gradient=c.createRadialGradient(w/2,h/2,w*.12,w/2,h/2,w*.5);gradient.addColorStop(0,'rgba(0,0,0,.75)');gradient.addColorStop(.55,'rgba(0,0,0,.48)');gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(0,0,w,h);
  },128,128);
  function addHeroDetails(group,paint,brake,reverse){
    const alloy=mat(0xb6c4c9,.82,.2),leather=mat(0x202a30,0,.86);
    for(const side of [-1,1]){
      const bumper=coachwork(group,2.35,.3,.15,.67,paint);bumper.position.z=side*2.72;
      detailBar(group,[side*.46,1.33,-2.53],[side*.57,1.39,-1.51],.012,dark);
      detailBar(group,[side*1.32,.71,.2],[side*1.32,.73,1.08],.012,dark);
      detailBar(group,[side*1.32,.73,1.08],[side*1.32,1.27,1.08],.012,dark);
      box(group,side*.85,1.03,2.83,.82,.26,.14,dark);
      for(let segment=0;segment<5;segment++)box(group,side*(.53+segment*.14),1.05,2.914,.095,.095,.035,brake);
      box(group,side*.47,.87,2.915,.19,.09,.04,reverse);
      const optics=new T.MeshPhysicalMaterial({color:0xcce8f2,metalness:0,transparent:true,opacity:.25,roughness:.045,clearcoat:1,depthWrite:false});
      for(let lamp=0;lamp<3;lamp++){
        const x=side*(.66+lamp*.18);
        const reflector=new T.Mesh(new T.TorusGeometry(.066,.014,10,24),alloy);reflector.position.set(x,1.07,-2.88);group.add(reflector);
        const core=new T.Mesh(new T.SphereGeometry(.047,20,12),new T.MeshBasicMaterial({color:0xc6e7ef,toneMapped:false}));core.scale.z=.38;core.position.set(x,1.07,-2.896);group.add(core);
        const lens=new T.Mesh(new T.SphereGeometry(.064,20,12),optics);lens.scale.z=.5;lens.position.set(x,1.07,-2.907);group.add(lens);
        box(group,x,1.16,-2.89,.085,.018,.025,alloy);
      }
      const cover=new T.Mesh(new T.SphereGeometry(1,32,16),optics);cover.scale.set(.365,.145,.052);cover.position.set(side*.89,1.07,-2.925);group.add(cover);
      for(let seam=0;seam<4;seam++)box(group,side*.57,1.405,-.7+seam*.14,.5,.012,.012,alloy);
    }
    const rubber=mat(0x10171b,0,.92),stitch=mat(0x8e9b98,0,.9);
    function seam(points,r=.012,material=rubber){
      const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
      const mesh=new T.Mesh(new T.TubeGeometry(path,Math.max(16,points.length*8),r,6,false),material);group.add(mesh);return mesh;
    }
    // Continuous rubber seals, wipers and inset door trim.
    seam([[-1.04,1.405,-1.49],[-.98,1.77,-1.215],[-.91,2.105,-.94],[0,2.12,-.94],[.91,2.105,-.94],[.98,1.77,-1.215],[1.04,1.405,-1.49],[0,1.405,-1.49],[-1.04,1.405,-1.49]],.022);
    seam([[-1.08,1.405,1.4],[-.91,2.105,.735],[0,2.12,.735],[.91,2.105,.735],[1.08,1.405,1.4],[0,1.405,1.4],[-1.08,1.405,1.4]],.023);
    for(const side of [-1,1]){
      seam([[side*1.125,1.4,-1.45],[side*.945,2.105,-.9],[side*.945,2.105,.71],[side*1.135,1.4,1.38]],.022);
      detailBar(group,[side*.25,1.435,-1.49],[side*.77,1.55,-1.39],.014,rubber);
      detailBar(group,[side*.43,1.505,-1.415],[side*.94,1.54,-1.39],.021,rubber);
      // Sculpted seat bolsters and headrest posts, visible through the glass.
      for(const z of [-.5,.62]){
        for(const edge of [-1,1]){
          const bolster=coachwork(group,.095,.56,.08,1.46,leather);bolster.position.set(side*.57+edge*.28,1.46,z);
          detailBar(group,[side*.57+edge*.12,1.87,z+.28],[side*.57+edge*.12,1.98,z+.28],.018,alloy);
          seam([[side*.57+edge*.23,1.47,z-.24],[side*.57+edge*.23,1.47,z+.2],[side*.57+edge*.23,1.84,z+.3]],.006,stitch);
        }
      }
      box(group,side*1.035,1.53,-.2,.08,.21,.85,leather);
      box(group,side*.98,1.62,-.35,.06,.035,.21,alloy);
      for(let vent=0;vent<4;vent++)box(group,side*.69+vent*.045,1.62,-.823,.018,.055,.025,rubber);
      // Body-coloured lower sill and a fine chrome window belt.
      seam([[side*1.14,1.405,-1.43],[side*1.17,1.405,-.2],[side*1.15,1.405,1.36]],.012,alloy);
    }
    for(const z of [-.23,.02]){
      const cup=new T.Mesh(new T.TorusGeometry(.065,.012,8,20),rubber);cup.rotation.x=Math.PI/2;cup.position.set(0,1.58,z);group.add(cup);
    }
    box(group,0,1.63,-.41,.085,.09,.12,alloy);
    const mirror=coachwork(group,.36,.09,.12,1.97,rubber);mirror.position.z=-.85;
    box(group,0,2.02,-.795,.3,.09,.015,alloy);
    seam([[-.86,1.24,2.46],[0,1.29,2.49],[.86,1.24,2.46]],.012);
    for(let slat=0;slat<7;slat++)box(group,(slat-3)*.16,.78,-2.91,.025,.11,.025,alloy);
    box(group,0,1.09,2.92,.64,.045,.035,brake);
    box(group,0,1.45,-.1,.24,.25,.75,leather);
    const dashTexture=makeTexture((c,w,h)=>{c.fillStyle='#061b27';c.fillRect(0,0,w,h);c.strokeStyle='#42d8cb';c.lineWidth=4;c.beginPath();c.arc(75,65,40,Math.PI*.8,Math.PI*2.2);c.stroke();c.fillStyle='#ecffff';c.font='bold 24px Segoe UI';c.fillText('ТБС',150,42);c.font='16px Segoe UI';c.fillText('ЭЛЕКТРОМОБИЛЬ',130,72);c.fillStyle='#ff681e';c.fillRect(142,89,77,5);},256,128);
    const display=new T.Mesh(new T.PlaneGeometry(.62,.31),new T.MeshBasicMaterial({map:dashTexture,toneMapped:false}));display.position.set(0,1.69,-.84);group.add(display);
    const lettering=makeTexture((c,w,h)=>{c.fillStyle='#ecf5f2';c.font='bold 42px Segoe UI';c.textAlign='center';c.fillText('ТРАНСПОРТ БУДУЩЕГО',w/2,52);c.fillStyle='#ff651e';c.font='bold 30px Segoe UI';c.fillText('САМАРА  ·  063',w/2,98);},640,128);
    for(const side of [-1,1]){const label=new T.Mesh(new T.PlaneGeometry(1.05,.21),new T.MeshBasicMaterial({map:lettering,transparent:true,depthWrite:false,toneMapped:false}));label.rotation.y=side*Math.PI/2;label.position.set(side*1.355,1.03,.57);group.add(label);}
  }
  function createCar(color,hero=false,variant='sedan'){
    if(hero)return window.createTBSFastback({T,scene,logo:markTexture,makeTexture,shadowTexture:vehicleShadowTexture});
    const group=new T.Group();
    const body=new T.MeshPhysicalMaterial({color,metalness:.65,roughness:.24,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.3});
    if(hero){body.metalness=.42;body.roughness=.29;body.envMapIntensity=.8;}
    const passenger=variant!=='van'&&variant!=='shuttle';
    if(passenger)createHeroShell(group,body,variant,hero);
    else {
    coachwork(group,2.65,5.15,.63,.65,body);
    wedge(group,2.76,-2.82,-1.1,.67,1.02,1.61,body);
    wedge(group,2.76,1.05,2.78,.67,1.63,1.04,body);
    box(group,0,.55,0,2.33,.22,4.98,dark);
    }
    if(!passenger)createCommercialBody(group,body,variant);
    if(!passenger){box(group,0,1.11,-2.82,2.38,.22,.1,dark);box(group,0,1.01,2.81,2.35,.22,.1,dark);}
    else box(group,0,.78,-2.875,1.3,.13,.045,dark);
    const wheels=[];
    for(const side of [-1,1])for(const z of [-1.75,1.75]){
      const steering=new T.Group(),rolling=new T.Group();
      steering.position.set(side*1.45,.52,z);group.add(steering);steering.add(rolling);
      const mount=(mesh)=>{mesh.position.sub(steering.position);rolling.add(mesh);};
      const tireProfile=[[.29,-.18],[.4,-.18],[.47,-.14],[.5,-.08],[.5,.08],[.47,.14],[.4,.18],[.29,.18]].map(([r,y])=>new T.Vector2(r,y));
      const wheel=new T.Mesh(hero?new T.LatheGeometry(tireProfile,48):new T.CylinderGeometry(.5,.5,.34,18),tireMat);
      wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.45,.52,z);wheel.castShadow=true;mount(wheel);wheels.push({steering,rolling,front:z<0});
      const hub=new T.Mesh(new T.CylinderGeometry(hero?.14:.27,hero?.14:.27,.36,16),trimMat);hub.rotation.z=Math.PI/2;hub.position.set(side*1.46,.52,z);group.add(hub);
      mount(hub);
      const fender=new T.Mesh(new T.TorusGeometry(.58,.085,8,24,Math.PI),body);fender.rotation.y=Math.PI/2;fender.position.set(side*1.43,.52,z);group.add(fender);
      const rim=new T.Mesh(new T.TorusGeometry(.34,.04,8,24),trimMat);rim.rotation.y=Math.PI/2;rim.position.set(side*1.65,.52,z);group.add(rim);
      mount(rim);
      if(hero){
        const rotor=new T.Mesh(new T.CylinderGeometry(.32,.32,.04,32),trimMat);rotor.rotation.z=Math.PI/2;rotor.position.set(side*1.6,.52,z);mount(rotor);
        const caliper=box(steering,side*.12,.14,.22,.12,.28,.13,orangeMat);
        for(let groove=0;groove<3;groove++){
          const tread=new T.Mesh(new T.TorusGeometry(.493,.012,4,40),tireMat);tread.rotation.y=Math.PI/2;tread.position.set(side*(1.36+groove*.09),.52,z);mount(tread);
        }
        const treadBlocks=new T.InstancedMesh(unitBox,tireMat,96),treadPose=new T.Object3D();
        for(let n=0;n<48;n++)for(let band=0;band<2;band++){
          const angle=n*Math.PI/24;treadPose.position.set((band-.5)*.18,Math.cos(angle)*.499,Math.sin(angle)*.499);treadPose.rotation.set(angle,band?-.22:.22,0);treadPose.scale.set(.14,.016,.037);treadPose.updateMatrix();treadBlocks.setMatrixAt(n*2+band,treadPose.matrix);
        }rolling.add(treadBlocks);
        for(let bolt=0;bolt<5;bolt++){const angle=bolt*Math.PI*2/5;const screw=new T.Mesh(new T.SphereGeometry(.025,6,4),dark);screw.position.set(side*.215,Math.cos(angle)*.105,Math.sin(angle)*.105);rolling.add(screw);}
      }
      for(let spoke=0;spoke<5;spoke++){
        const spokeMesh=box(group,side*1.65,.52,z,.035,hero?.035:.065,.6,hero?trimMat:whiteMat);spokeMesh.rotation.x=spoke*Math.PI/5;
        mount(spokeMesh);
      }
    }
    const brakeMaterial=new T.MeshBasicMaterial({color:0x8c160d,toneMapped:false});
    const reverseMaterial=new T.MeshBasicMaterial({color:0x29313b,toneMapped:false});
    for(const side of [-1,1]){
      if(!passenger)box(group,side*.96,1.18,-2.87,.72,.14,.08,new T.MeshBasicMaterial({color:0xbffff1}));
      box(group,side*(passenger?.73:.94),passenger?1:1.17,2.86,passenger?.6:.72,.12,.08,brakeMaterial);
      box(group,side*.47,passenger?.88:1.17,2.86,.19,.12,.08,reverseMaterial);
      if(!passenger)box(group,side*1.32,1.22,-.35,.14,.11,2.4,cyanMat);
    }
    if(!passenger)box(group,0,1.15,-2.88,.55,.09,.08,orangeMat);
    const shadow=new T.Mesh(new T.CircleGeometry(2.35,24),new T.MeshBasicMaterial({map:vehicleShadowTexture,color:0x02090d,transparent:true,opacity:.48,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.scale.set(1,1.52,1);shadow.position.y=.12;group.add(shadow);
    if(hero){
      addHeroDetails(group,body,brakeMaterial,reverseMaterial);
      group.userData.headlights=[];
      const roofLogo=new T.Mesh(new T.PlaneGeometry(1.62,1.62),new T.MeshBasicMaterial({map:markTexture,transparent:true,depthWrite:false}));
      roofLogo.rotation.x=-Math.PI/2;roofLogo.scale.setScalar(.8);roofLogo.position.set(0,2.255,-.1);group.add(roofLogo);
      box(group,0,.24,0,2.37,.06,4.55,new T.MeshBasicMaterial({color:0x16eee0,transparent:true,opacity:.53}));
      for(const side of [-1,1]){
        const frontLight=new T.SpotLight(0xccefff,2.6,28,.43,.6,1.3);frontLight.position.set(side*.96,1.2,-2.8);frontLight.target.position.set(side*1.5,.05,-17);group.add(frontLight,frontLight.target);group.userData.headlights.push(frontLight);
      }
    }
    group.userData.wheels=wheels;
    group.userData.brakeMaterial=brakeMaterial;group.userData.reverseMaterial=reverseMaterial;
    const suspension=new T.Group();
    for(const part of [...group.children])if(part!==shadow&&!wheels.some(w=>w.steering===part))suspension.add(part);
    // Body fittings share a draw call per material; steering and suspension remain independent.
    const fittings=new Map();
    for(const part of suspension.children)if(part.isMesh&&part.geometry===unitBox){
      if(!fittings.has(part.material))fittings.set(part.material,[]);fittings.get(part.material).push(part);
    }
    for(const [material,parts] of fittings)if(parts.length>=3){
      const batch=new T.InstancedMesh(unitBox,material,parts.length);
      parts.forEach((part,i)=>{part.updateMatrix();batch.setMatrixAt(i,part.matrix);suspension.remove(part);});
      batch.castShadow=parts.some(part=>part.castShadow);batch.receiveShadow=true;suspension.add(batch);
    }
    group.add(suspension);group.userData.body=suspension;
    group.userData.variant=variant;group.userData.paint=body;
    const scale=variant==='compact'?.9:1;group.scale.setScalar(scale);if(variant==='compact'){group.scale.z*=.87;group.scale.y*=1.06;}group.userData.wheelRadius=.5*scale;
    scene.add(group);return group;
  }
  const car=createCar(0x164252,true);
  for(const parked of parkedCars){
    parked.mesh=createCar([0xcbd7da,0x427d91,0xdda15f,0x63716a][parked.seed%4],false,parked.seed%3===0?'van':'sedan');
    parked.mesh.position.set(parked.x,.12,parked.z);parked.mesh.rotation.y=-parked.a;
  }
  // A bounded ring buffer keeps tire trails at a fixed memory and draw-call cost.
  const skidCapacity=320,skidTransform=new T.Object3D();
  const skidMarks=new T.InstancedMesh(unitPlane,new T.MeshBasicMaterial({color:0x11191c,transparent:true,opacity:.33,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),skidCapacity);
  skidMarks.instanceMatrix.setUsage(T.DynamicDrawUsage);skidMarks.frustumCulled=false;skidMarks.count=0;scene.add(skidMarks);
  let skidCursor=0,previousSkid=null;
  function updateSkidMarks(active,braking,steer){
    if(!active)return;
    const speed=Math.abs(player.speed);
    if(speed<5||(!braking&&!(Math.abs(steer)>.5&&speed>12))){previousSkid=null;return;}
    const rear={x:player.x-Math.sin(player.a)*1.75,z:player.z+Math.cos(player.a)*1.75,a:player.a};
    if(previousSkid){
      const distance=Math.hypot(rear.x-previousSkid.x,rear.z-previousSkid.z);
      if(distance<.16)return;
      if(distance<2)for(const side of [-1,1]){
        const ax=previousSkid.x+Math.cos(previousSkid.a)*side*1.42,az=previousSkid.z+Math.sin(previousSkid.a)*side*1.42;
        const bx=rear.x+Math.cos(rear.a)*side*1.42,bz=rear.z+Math.sin(rear.a)*side*1.42;
        skidTransform.position.set((ax+bx)/2,.185,(az+bz)/2);skidTransform.rotation.set(-Math.PI/2,0,Math.atan2(bx-ax,bz-az));skidTransform.scale.set(.24,Math.hypot(bx-ax,bz-az)+.06,1);skidTransform.updateMatrix();
        skidMarks.setMatrixAt(skidCursor,skidTransform.matrix);skidCursor=(skidCursor+1)%skidCapacity;skidMarks.count=Math.min(skidCapacity,skidMarks.count+1);
      }
      skidMarks.instanceMatrix.needsUpdate=true;
    }
    previousSkid=rear;
  }
  function animateVehicle(mesh,speed,steer,braking,dt){
    if(mesh.userData.steeringWheel)mesh.userData.steeringWheel.rotation.z=-steer*.65;
    for(const wheel of mesh.userData.wheels){
      wheel.rolling.rotation.x=(wheel.rolling.rotation.x-speed*dt/mesh.userData.wheelRadius)%(Math.PI*2);
      const angle=wheel.front?-steer*.38:0;
      wheel.steering.rotation.y+=(angle-wheel.steering.rotation.y)*(1-Math.exp(-dt*12));
    }
    mesh.userData.brakeMaterial.color.setHex(braking?0xff3822:0x8c160d);
    mesh.userData.reverseMaterial.color.setHex(speed<-.2?0xe8f5ff:0x29313b);
  }
  let trafficTime=0;
  const signalHeads=[];
  const signalMaterials=[0xff4030,0xffbd35,0x55ff98].map(color=>new T.MeshBasicMaterial({color,toneMapped:false}));
  const signalOff=new T.MeshBasicMaterial({color:0x17212b});
  function signalPhase(x,z,horizontal,time=trafficTime){
    const phase=((time+roadsX.indexOf(x)*2+roadsZ.indexOf(z)*3)%24+24)%24;
    const local=(phase+(horizontal?0:12))%24;
    return local<8?'green':local<10?'amber':'red';
  }
  for(const x of roadsX)for(const z of roadsZ)for(const horizontal of [true,false])for(const dir of [-1,1]){
    const head=new T.Group(),edge=ROAD/2+.8;
    head.position.set(x-dir*edge,0,horizontal?z+dir*edge:z-dir*edge);
    head.rotation.y=horizontal?-dir*Math.PI/2:dir>0?Math.PI:0;
    box(head,0,2,0,.12,4,.12,trimMat);
    box(head,0,4.05,.03,.65,1.85,.36,dark);
    const lamps=[];
    for(let i=0;i<3;i++){
      const lamp=new T.Mesh(new T.CircleGeometry(.22,16),signalOff);lamp.position.set(0,4.62-i*.55,.22);head.add(lamp);lamps.push(lamp);
      box(head,0,4.89-i*.55,.27,.62,.07,.6,dark);
    }
    scene.add(head);signalHeads.push({x,z,horizontal,lamps});
    const lane=(horizontal?dir:-dir)*ROAD/4,stop=dir*(ROAD/2+.65);
    box(scene,horizontal?x-stop:x+lane,.18,horizontal?z+lane:z-stop,horizontal?.3:ROAD/2-.8,.02,horizontal?ROAD/2-.8:.3,laneMat);
  }
  function updateSignals(){
    for(const head of signalHeads){const phase=signalPhase(head.x,head.z,head.horizontal),active=phase==='red'?0:phase==='amber'?1:2;
      if(head.active===active)continue;head.active=active;
      head.lamps.forEach((lamp,i)=>{lamp.material=i===active?signalMaterials[i]:signalOff;});}
  }
  const traffic=Array.from({length:36},(_,i)=>{
    const horizontal=i%2===0,dir=i%4<2?1:-1;
    const road=horizontal?roadsZ[Math.floor(i/2)%roadsZ.length]:roadsX[Math.floor(i/2)%roadsX.length];
    const crosses=horizontal?roadsX:roadsZ,block=(Math.floor(i/4)*2+i%4)%(crosses.length-1);
    const variant=['compact','van','sedan','shuttle'][i%4];
    return {horizontal,dir,road,lane:(horizontal?dir:-dir)*2.7,pos:(crosses[block]+crosses[block+1])/2,speed:0,cruise:(variant==='shuttle'?6.5:7)+(i*1.37)%3,mesh:createCar([0xf4a063,0xe2e7e8,0x88bbcf,0xd8eee8][i%4],false,variant)};
  });
  function placeTraffic(t){
    t.mesh.position.set(t.horizontal?t.pos:t.road+t.lane,.08,t.horizontal?t.road+t.lane:t.pos);
    t.heading=t.horizontal?t.dir*Math.PI/2:t.dir>0?Math.PI:0;t.mesh.rotation.y=-t.heading;
  }
  traffic.forEach(placeTraffic);updateSignals();
  function trafficLimit(t,vehicles=traffic,time=trafficTime){
    let clearance=Infinity;
    for(const cross of t.horizontal?roadsX:roadsZ){
      const gap=(cross-t.pos)*t.dir-(ROAD/2+3.5);
      if(gap>=-.001&&signalPhase(t.horizontal?cross:t.road,t.horizontal?t.road:cross,t.horizontal,time)!=='green')clearance=Math.min(clearance,Math.max(0,gap));
      if(gap>=0&&gap<25&&vehicles.some(other=>other.horizontal!==t.horizontal&&Math.abs(other.road-cross)<.1&&Math.abs(other.pos-t.road)<ROAD/2+3.1))clearance=Math.min(clearance,gap);
    }
    for(const other of vehicles){
      if(other===t||other.horizontal!==t.horizontal||other.road!==t.road||other.dir!==t.dir)continue;
      const gap=(other.pos-t.pos)*t.dir;
      if(gap>0)clearance=Math.min(clearance,Math.max(0,gap-7.6));
    }
    const playerAlong=t.horizontal?player.x:player.z,playerAcross=t.horizontal?player.z:player.x;
    const playerGap=(playerAlong-t.pos)*t.dir;
    if(Math.abs(playerAcross-t.road-t.lane)<3.25&&playerGap>0)clearance=Math.min(clearance,Math.max(0,playerGap-8));
    return {speed:Math.min(t.cruise,Math.sqrt(2*5*clearance)),clearance};
  }
  function advanceTraffic(dt){
    const limits=traffic.map(t=>trafficLimit(t));
    traffic.forEach((t,i)=>{
      const oldSpeed=t.speed,limit=limits[i];
      t.speed+=Math.max(-5*dt,Math.min(2.6*dt,limit.speed-t.speed));
      const movement=Math.min(t.speed*dt,limit.clearance);if(movement<t.speed*dt||limit.clearance<.015)t.speed=0;
      t.pos+=t.dir*movement;
      const end=t.horizontal?WORLD_W:WORLD_H,start=t.horizontal?-8:19;
      if(t.pos>end+8)t.pos=start;if(t.pos<start)t.pos=end+8;
      placeTraffic(t);t.mesh.visible=camera.position.distanceToSquared(t.mesh.position)<graphics.distance*graphics.distance;
      if(t.mesh.visible)animateVehicle(t.mesh,t.speed,0,t.speed<oldSpeed-.005||t.speed<.1,dt);
    });
  }

  // Sidewalk routes stay inside their block, clear of vehicle lanes.
  const pedestrianJackets=[0xe88736,0x367e9c,0xac5464,0xd3ccad,0x435463,0x5b8766].map(c=>mat(c,0,.9));
  const pedestrianSkin=[0xe2b390,0xb77c56,0x805340].map(c=>mat(c,0,.95));
  const pedestrianHair=[0x30251e,0x765137,0xc0a078].map(c=>mat(c,0,.95));
  const trousers=mat(0x273848),shoeMaterial=mat(0x182126);
  const headGeometry=new T.SphereGeometry(.22,10,8);
  const personShadow=new T.MeshBasicMaterial({color:0x14201a,transparent:true,opacity:.2,depthWrite:false});
  function createPedestrian(seed){
    const root=new T.Group(),body=new T.Group();root.add(body);
    const jacket=pedestrianJackets[seed%pedestrianJackets.length],skin=pedestrianSkin[seed%3];
    box(body,0,1.17,0,.47,.6,.29,jacket);
    box(body,0,.84,0,.38,.19,.25,trousers);
    const head=new T.Mesh(headGeometry,skin);head.position.set(0,1.69,0);body.add(head);
    box(body,0,1.84,.015,.36,.13,.31,pedestrianHair[seed%3]);
    box(body,0,1.67,-.217,.075,.075,.08,skin);
    const limbs=[];
    for(const side of [-1,1]){
      const leg=new T.Group();leg.position.set(side*.13,.83,0);body.add(leg);
      box(leg,0,-.31,0,.17,.6,.2,trousers);box(leg,0,-.71,-.055,.21,.14,.34,shoeMaterial);
      const arm=new T.Group();arm.position.set(side*.3,1.4,0);body.add(arm);
      box(arm,0,-.22,0,.15,.46,.19,jacket);box(arm,0,-.49,0,.12,.13,.14,skin);
      limbs.push({leg,arm,side});
    }
    if(seed%4===0){
      box(body,0,1.17,-.151,.46,.07,.018,whiteMat);
      box(body,0,1.5,0,.5,.055,.36,orangeMat);
      const badge=new T.Mesh(new T.PlaneGeometry(.18,.18),new T.MeshBasicMaterial({map:markTexture,transparent:true,toneMapped:false}));
      badge.rotation.y=Math.PI;badge.position.set(-.11,1.32,-.16);body.add(badge);
    }else if(seed%3===0)box(body,0,1.15,.23,.34,.46,.21,pedestrianJackets[(seed+2)%6]);
    const shadow=new T.Mesh(new T.CircleGeometry(.35,16),personShadow);shadow.rotation.x=-Math.PI/2;shadow.position.y=.01;root.add(shadow);
    const scale=1+(seed%4)*.045;root.scale.setScalar(scale);root.userData={body,limbs};
    root.traverse(mesh=>{if(mesh.isMesh&&mesh!==shadow)mesh.castShadow=!lowPower;});
    scene.add(root);return root;
  }
  const pedestrians=[];
  for(let j=0;j<roadsZ.length-1;j++)for(let i=0;i<roadsX.length-1;i++){
    const seed=j*(roadsX.length-1)+i,left=roadsX[i]+ROAD/2+1.05,right=roadsX[i+1]-ROAD/2-1.05;
    const top=roadsZ[j]+ROAD/2+1.05,bottom=roadsZ[j+1]-ROAD/2-1.05;
    const isPark=isParkBlock(i,j)&&!special.has(i+','+j),cx=(left+right)/2,cz=(top+bottom)/2;
    const routes=[ [{x:left,z:top},{x:right,z:top},{x:right,z:bottom},{x:left,z:bottom}] ];
    // Strollers in parks follow a path toward the fountain and back.
    if(i===3&&j===3)routes.push([{x:cx-11,z:cz-9},{x:cx+11,z:cz-9},{x:cx+11,z:cz+10.5},{x:cx-11,z:cz+10.5}]);
    else if(isPark)routes.push([{x:cx,z:top+4},{x:cx,z:cz-4.5}]);
    for(let n=0;n<routes.length;n++){
      const route=routes[n];if(seed%2)route.reverse();
      const leg=seed%route.length,start=route[leg],end=route[(leg+1)%route.length],fraction=.18+(seed%5)*.13;
      const mesh=createPedestrian(seed+n*31);
      mesh.position.set(start.x+(end.x-start.x)*fraction,.39,start.z+(end.z-start.z)*fraction);
      mesh.rotation.y=Math.atan2(-(end.x-start.x),-(end.z-start.z));
      pedestrians.push({mesh,route,target:(leg+1)%route.length,speed:.85+(seed%5)*.12,wait:0,arrivals:0,phase:seed,seed});
    }
  }
  function updatePedestrians(dt){
    for(const person of pedestrians){
      const mesh=person.mesh;
      mesh.visible=camera.position.distanceToSquared(mesh.position)<110*110;
      if(mode!=='playing')continue;
      let walking=false;
      if(person.wait>0)person.wait=Math.max(0,person.wait-dt);
      else{
        const goal=person.route[person.target],dx=goal.x-mesh.position.x,dz=goal.z-mesh.position.z,remaining=Math.hypot(dx,dz);
        const step=Math.min(remaining,person.speed*dt);
        if(remaining>.001){
          mesh.position.x+=dx/remaining*step;mesh.position.z+=dz/remaining*step;walking=true;
          const angle=Math.atan2(-dx,-dz),difference=Math.atan2(Math.sin(angle-mesh.rotation.y),Math.cos(angle-mesh.rotation.y));
          mesh.rotation.y+=difference*(1-Math.exp(-dt*10));
          person.phase+=step*7;
        }
        if(remaining<=step+.001){person.target=(person.target+1)%person.route.length;person.arrivals++;if(person.arrivals%3===0)person.wait=.8+(person.seed%4)*.45;}
      }
      const swing=walking?Math.sin(person.phase)*.44:0;
      for(const limb of mesh.userData.limbs){limb.leg.rotation.x+=(swing*limb.side-limb.leg.rotation.x)*(1-Math.exp(-dt*16));limb.arm.rotation.x+=(-swing*limb.side*.8-limb.arm.rotation.x)*(1-Math.exp(-dt*16));}
      mesh.userData.body.position.y=walking?Math.abs(Math.sin(person.phase))*.028:0;
    }
  }

  function createDrone(){
    const group=new T.Group(),rotors=[];
    box(group,0,0,0,2.2,.48,1.7,whiteMat);
    box(group,0,-.4,0,1.3,.38,1,orangeMat);
    for(const sx of [-1,1])for(const sz of [-1,1]){
      box(group,sx*1.45,0,sz*1.22,2.2,.13,.14,dark).rotation.y=sx*sz*.35;
      const hub=new T.Mesh(new T.CylinderGeometry(.34,.34,.12,12),dark);hub.position.set(sx*2.4,.08,sz*1.8);group.add(hub);
      const rotor=box(group,sx*2.4,.18,sz*1.8,1.6,.035,.13,cyanMat);rotors.push(rotor);
    }
    scene.add(group);return {group,rotors};
  }
  const escortDrone=createDrone();
  const ambientDrones=Array.from({length:5},(_,i)=>({model:createDrone(),baseX:35+i*42,baseZ:21+(i%2)*80,phase:i*1.7}));

  const beacon=new T.Group();
  const beaconColumn=new T.Mesh(new T.CylinderGeometry(1.25,2.2,9,24,1,true),new T.MeshBasicMaterial({color:0xff680b,transparent:true,opacity:.15,side:T.DoubleSide,depthWrite:false}));
  beaconColumn.position.y=4.5;beacon.add(beaconColumn);
  const ring=new T.Mesh(new T.TorusGeometry(3.7,.16,8,40),new T.MeshBasicMaterial({color:0xffb45f,transparent:true,opacity:.94}));
  ring.rotation.x=Math.PI/2;ring.position.y=.22;beacon.add(ring);
  const gem=new T.Mesh(new T.OctahedronGeometry(1.35),new T.MeshBasicMaterial({color:0xff681c}));gem.position.y=8.9;beacon.add(gem);
  const beaconLabel=sprite(beacon,signTexture('ТБС','ТОЧКА МАРШРУТА'),0,12,0,8.5,2.1);
  const beaconLight=new T.PointLight(0xff7529,1.45,15,2);beaconLight.position.y=3.4;beacon.add(beaconLight);
  scene.add(beacon);
  const pickupRing=new T.Mesh(new T.TorusGeometry(2.2,.12,8,40),new T.MeshBasicMaterial({color:0x5dfff1,transparent:true,opacity:0}));
  pickupRing.rotation.x=Math.PI/2;scene.add(pickupRing);

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let lightMode=0,lightValue=1,lightingClock=0;
  const lightModes=['День','Вечер','Ночь','Авто'];
  const fogDay=new T.Color(0x91abb9),fogNight=new T.Color(0x142638);
  const sunlightDay=new T.Color(0xffd4a6),sunlightDusk=new T.Color(0xff9561);
  const reflectionMaterials=new Map();
  scene.traverse(object=>{if(object.material&&!Array.isArray(object.material)&&'envMapIntensity' in object.material)reflectionMaterials.set(object.material,object.material.envMapIntensity);});
  const nearbyStreetLights=Array.from({length:lowPower?1:3},()=>{const lamp=new T.PointLight(0xffe1b3,0,18,2);scene.add(lamp);return lamp;});
  const nearestFacadeLights=Array.from({length:3},()=>{const lamp=new T.PointLight(0xffd09c,0,13,2);scene.add(lamp);return lamp;});
  const moon=new T.Mesh(new T.SphereGeometry(5,16,12),new T.MeshBasicMaterial({color:0xd7e8ff,fog:false,toneMapped:false}));scene.add(moon);
  let appliedLight=-1,lampSelectionX=Infinity,lampSelectionZ=Infinity;
  const skyDirection=new T.Vector3(),moonOffset=new T.Vector3(180,170,-220);
  function toggleDaylight(){lightMode=(lightMode+1)%lightModes.length;const button=$('daylightBtn');button.textContent=['☀','◒','☾','↻'][lightMode];button.title='Время суток: '+lightModes[lightMode]+' (N)';button.setAttribute('aria-label',button.title);showToast('Время суток: '+lightModes[lightMode]);}
  $('daylightBtn').addEventListener('click',toggleDaylight);
  function updateLighting(dt){
    if(mode==='playing')lightingClock+=dt;
    const desired=lightMode===3?(Math.cos(lightingClock*Math.PI*2/300)+1)/2:[1,.45,0][lightMode];
    if(mode==='playing')lightValue+=(desired-lightValue)*(1-Math.exp(-dt*1.5));
    const night=1-lightValue;
    const nearbyFacades=cityFacadeLights.filter(p=>(p.x-camera.position.x)**2+(p.z-camera.position.z)**2<85*85).sort((a,b)=>(a.x-camera.position.x)**2+(a.z-camera.position.z)**2-((b.x-camera.position.x)**2+(b.z-camera.position.z)**2));
    nearestFacadeLights.forEach((lamp,i)=>{const fixture=nearbyFacades[i];lamp.intensity=fixture?night*28:0;if(fixture)lamp.position.set(fixture.x,fixture.y,fixture.z);});
    for(const fixture of cityFacadeLights)fixture.poolMaterial.opacity=night*.12;
    const quarter=scene.userData.quarterLighting;
    if(quarter){
      const near=Math.hypot(camera.position.x-quarter.x,camera.position.z-quarter.z)<90;
      const level=graphics.quality==='low'?.55:1;
      quarter.entranceLight.intensity=near?night*42*level:0;
      quarter.windowLight.intensity=near&&graphics.quality!=='low'?night*16:0;
      quarter.bounce.intensity=near&&graphics.quality!=='low'?lightValue*9:0;
      quarter.lightStripMaterial.emissiveIntensity=.12+night*2.2;
      quarter.poolMaterial.opacity=night*.16;
    }
    for(const lamp of car.userData.headlights)lamp.intensity=2.6+night*48;
    if(Math.abs(appliedLight-lightValue)>.0001){
    appliedLight=lightValue;
    sky.material.uniforms.daylight.value=lightValue;
    scene.fog.color.copy(fogNight).lerp(fogDay,lightValue);
    ambientLight.intensity=.65+.95*lightValue;sun.intensity=.12+2.48*lightValue;
    sun.color.copy(sunlightDusk).lerp(sunlightDay,lightValue);blueLight.intensity=.8-.56*lightValue;
    for(const material of nightWindows)material.emissiveIntensity=night*.9;
    for(const [material,base] of reflectionMaterials)material.envMapIntensity=base*(.2+.8*lightValue);
    for(const fixture of streetFixtures){fixture.halo.material.opacity=.08+night*.65;fixture.pool.material.opacity=.04+night*.42;}
    nearbyStreetLights.forEach(lamp=>{lamp.intensity=night*32;});
    }
    if((player.x-lampSelectionX)**2+(player.z-lampSelectionZ)**2>4){
    lampSelectionX=player.x;lampSelectionZ=player.z;
    const nearest=[...streetFixtures].sort((a,b)=>(a.x-player.x)**2+(a.z-player.z)**2-((b.x-player.x)**2+(b.z-player.z)**2));
    nearbyStreetLights.forEach((lamp,i)=>{const fixture=nearest[i];if(fixture)lamp.position.set(fixture.x,5.2,fixture.z);});
    }
    duskSun.visible=lightValue>.07;duskSun.material.color.copy(sun.color);
    duskSun.position.copy(camera.position).add(skyDirection.set(-35,26+36*lightValue,40).normalize().multiplyScalar(380));
    moon.visible=lightValue<.3;moon.position.copy(camera.position).add(moonOffset);
  }
  let sound=null,soundMuted=false,impactAmount=0,impactCooldown=0;
  function beginSound(){
    try{
      if(!sound){
        const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
        const context=new AudioContext(),master=context.createGain();master.gain.value=0;master.connect(context.destination);
        const motor=context.createOscillator(),motorGain=context.createGain();motor.type='sine';motorGain.gain.value=.035;motor.connect(motorGain).connect(master);motor.start();
        const buffer=context.createBuffer(1,context.sampleRate,context.sampleRate),samples=buffer.getChannelData(0);
        for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
        const noise=context.createBufferSource(),filter=context.createBiquadFilter(),tires=context.createGain();
        noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=750;tires.gain.value=0;noise.connect(filter).connect(tires).connect(master);noise.start();
        const ambient=window.createTBSAmbience(context,master);
        sound={context,master,motor,motorGain,tires,buffer,ambient};
      }
      sound.context.resume().catch(()=>{});
    }catch{sound=null;}
  }
  function updateSound(braking){
    if(!sound)return;
    const t=sound.context.currentTime,speed=Math.abs(player.speed);
    sound.master.gain.setTargetAtTime(mode==='playing'&&!soundMuted ? .65 : 0,t,.035);
    sound.motor.frequency.setTargetAtTime(65+speed*13,t,.08);
    sound.motorGain.gain.setTargetAtTime(.012+Math.min(speed/22,1)*.05,t,.06);
    sound.tires.gain.setTargetAtTime(speed/22*(braking?.075:.018),t,.04);
    sound.ambient.update(player,traffic,elapsed);
  }
  function impact(speed){
    if(impactCooldown>0||speed<1)return;
    impactCooldown=.3;impactAmount=Math.min(speed/22,1);
    if(!sound||soundMuted||mode!=='playing')return;
    const t=sound.context.currentTime,source=sound.context.createBufferSource(),gain=sound.context.createGain(),filter=sound.context.createBiquadFilter();
    source.buffer=sound.buffer;filter.type='lowpass';filter.frequency.value=300;
    gain.gain.setValueAtTime(.05+impactAmount*.12,t);gain.gain.exponentialRampToValueAtTime(.001,t+.16);
    source.connect(filter).connect(gain).connect(sound.master);source.start(t);source.stop(t+.18);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  function toggleSound(){soundMuted=!soundMuted;beginSound();updateSound(false);$('soundBtn').textContent=soundMuted?'♪×':'♪';$('soundBtn').setAttribute('aria-pressed',String(soundMuted));}
  $('soundBtn').addEventListener('click',toggleSound);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const currentMission=()=>missions[missionIndex];
  const target=()=>stage===0?currentMission().from:currentMission().to;
  const hudCache=new Map();
  function hudValue(id,value,property='textContent'){
    const key=id+':'+property;if(hudCache.get(key)===value)return;
    hudCache.set(key,value);$(id)[property]=value;
  }
  function updateHud(){
    const m=currentMission();
    hudValue('missionNumber',String(missionIndex+1).padStart(2,'0'));
    hudValue('missionTitle',m.title);hudValue('missionDescription',m.description);
    hudValue('objective',(stage===0?'Забрать груз: ':'Доставить груз: ')+target().name);
    hudValue('distance','ДО МАЯКА: '+Math.round(distance(player,target())*10)+' м');
    hudValue('delivered',deliveries);
    hudValue('credits',credits.toLocaleString('ru-RU')+' <em>₽</em>','innerHTML');
    hudValue('speed',String(Math.round(Math.abs(player.speed)*3.6)).padStart(2,'0')+' <small>км/ч</small>','innerHTML');
    const width=Number(player.battery.toFixed(1))+'%';if($('batteryFill').style.width!==width)$('batteryFill').style.width=width;
    hudValue('batteryText','ЗАРЯД '+Math.round(player.battery)+'%');
  }
  function showToast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
  function start(){mode='playing';beginSound();$('overlay').classList.add('hidden');last=performance.now();showToast('Смена ТБС началась · W — вперёд, S — назад')}
  function togglePause(){
    if(mode==='playing'){

      for(const k in keys)keys[k]=false;
      mode='paused';$('overlayChapter').textContent='ТБС · Пауза';$('overlayTitle').innerHTML='ПАУЗА<br><span>НА МАРШРУТЕ</span>';
      updateSound(false);
      $('overlaySub').textContent='Тольятти ждёт вашего возвращения';
      $('overlayCopy').textContent='Вы на задании «'+currentMission().title+'». Продолжайте движение к оранжевому маяку.';
      $('startBtn').textContent='Продолжить →';$('overlay').classList.remove('hidden');
    }else if(mode==='paused')start();
  }
  $('startBtn').addEventListener('click',start);$('pauseBtn').addEventListener('click',togglePause);
  function interact(){
    if(mode!=='playing')return;
    if(distance(player,target())>8.5){showToast('Подъедьте ближе к маяку ТБС');return}
    if(Math.abs(player.speed)>5.8){showToast('Снизьте скорость перед запуском дрона');return}
    launchEffect=1.3;pickupRing.position.set(target().x,.45,target().z);
    if(stage===0){stage=1;showToast('Груз принят · дрон ТБС сопровождает машину')}
    else {credits+=currentMission().reward;deliveries++;player.battery=100;showToast('Доставка выполнена · +'+currentMission().reward+' ₽');missionIndex=(missionIndex+1)%missions.length;stage=0}
    updateHud();
  }
  const controlsByCode={Space:'handbrake',KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  const controlsByKey={w:'up','ц':'up',s:'down','ы':'down',a:'left','ф':'left',d:'right','в':'right'};
  function movementKey(e){return controlsByCode[e.code] || controlsByKey[String(e.key).toLowerCase()]}
  addEventListener('keydown',e=>{
    if(e.target instanceof HTMLElement&&e.target.closest('select,input,textarea'))return;
    if(e.code==='KeyC'){e.preventDefault();if(!e.repeat)toggleMouseCamera();return;}
    if(e.code==='KeyN'){e.preventDefault();if(!e.repeat)toggleDaylight();return;}
    if(e.code==='KeyM'){e.preventDefault();if(!e.repeat)toggleSound();return;}
    if(mode==='playing'&&(!sound||sound.context.state==='suspended'))beginSound();
    const action=e.code==='KeyE';
    const pause=e.code==='KeyP'||e.code==='Escape';
    const control=movementKey(e);
    if(control||action||pause)e.preventDefault();
    if(pause){if(!e.repeat)togglePause();return}
    if(action){if(!e.repeat)interact();return}
    if(control)keys[control]=true;
  });
  addEventListener('keyup',e=>{const control=movementKey(e);if(control)keys[control]=false});
  addEventListener('blur',()=>{for(const k in keys)keys[k]=false;if(mode==='playing')togglePause()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();last=performance.now();});
  document.querySelectorAll('.touch button').forEach(btn=>{
    const k=btn.dataset.key;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);btn.classList.add('active');if(k==='action')interact();else keys[k]=true});
    const release=()=>{btn.classList.remove('active');keys[k]=false};
    btn.addEventListener('pointerup',release);btn.addEventListener('pointercancel',release);btn.addEventListener('lostpointercapture',release);
  });

  let mouseCamera=false,cameraYaw=0,cameraPitch=.42,cameraDrag=null,cameraZoom=1;
  const cameraButton=document.getElementById('cameraBtn'),viewCanvas=renderer.domElement;
  function toggleMouseCamera(){
    mouseCamera=!mouseCamera;cameraDrag=null;cameraYaw=-player.a;cameraPitch=.42;
    cameraButton.setAttribute('aria-pressed',String(mouseCamera));
    cameraButton.textContent=mouseCamera?'Камера: мышь':'Камера: авто';
    showToast(mouseCamera?'Камера: зажмите левую кнопку мыши и двигайте мышь · C — авто':'Автоматическая камера включена');
  }
  cameraButton.addEventListener('click',toggleMouseCamera);
  viewCanvas.addEventListener('wheel',e=>{
    if(mode!=='playing')return;
    e.preventDefault();
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
    cameraZoom=clamp(cameraZoom*Math.exp(clamp(delta,-200,200)*.0015),.5,2.2);
  },{passive:false});
  viewCanvas.addEventListener('pointerdown',e=>{
    if(!mouseCamera||mode!=='playing'||e.button!==0)return;
    cameraDrag={id:e.pointerId,x:e.clientX,y:e.clientY};viewCanvas.setPointerCapture(e.pointerId);
  });
  viewCanvas.addEventListener('pointermove',e=>{
    if(!cameraDrag||cameraDrag.id!==e.pointerId||mode!=='playing')return;
    // Mouse right turns the view right; mouse down looks down.
    cameraYaw-=(e.clientX-cameraDrag.x)*.005;
    cameraPitch=clamp(cameraPitch+(e.clientY-cameraDrag.y)*.004,.12,1.15);
    cameraDrag.x=e.clientX;cameraDrag.y=e.clientY;
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])viewCanvas.addEventListener(event,()=>{cameraDrag=null;});
  addEventListener('blur',()=>{cameraDrag=null;});

  function onRoad(x,z){
    const dx=Math.min(...roadsX.map(v=>Math.abs(v-x))),dz=Math.min(...roadsZ.map(v=>Math.abs(v-z))),edge=ROAD/2,radius=4,clearance=1.2;
    const roundedCorner=dx<edge+radius&&dz<edge+radius&&Math.hypot(edge+radius-dx,edge+radius-dz)>radius+clearance;
    return dx<edge-clearance||dz<edge-clearance||roundedCorner||parkingLots.some(p=>(x>p.left+1.8&&x<p.right-1.8&&z>p.top+1.8&&z<p.bottom-3)||(Math.abs(x-p.cx)<2.2&&z>=p.road&&z<p.top+5));
  }
  function vehicleContact(ax,az,angleA,bx,bz,angleB){
    const forwardA={x:Math.sin(angleA),z:-Math.cos(angleA)},sideA={x:Math.cos(angleA),z:Math.sin(angleA)};
    const forwardB={x:Math.sin(angleB),z:-Math.cos(angleB)},sideB={x:Math.cos(angleB),z:Math.sin(angleB)};
    const dot=(a,b)=>a.x*b.x+a.z*b.z;let contact=null;
    for(const axis of [forwardA,sideA,forwardB,sideB]){
      const radiusA=2.95*Math.abs(dot(axis,forwardA))+1.65*Math.abs(dot(axis,sideA));
      const radiusB=2.95*Math.abs(dot(axis,forwardB))+1.65*Math.abs(dot(axis,sideB));
      const separation=(ax-bx)*axis.x+(az-bz)*axis.z,depth=radiusA+radiusB-Math.abs(separation);
      if(depth<=0)return null;
      if(!contact||depth<contact.depth){const sign=separation<0?-1:1;contact={x:axis.x*sign,z:axis.z*sign,depth};}
    }
    return contact;
  }
  function updatePhysics(dt){
    impactCooldown=Math.max(0,impactCooldown-dt);
    trafficTime+=dt;updateSignals();advanceTraffic(dt);
    const up=keys.up,down=keys.down;
    const left=keys.left,right=keys.right;
    const handbrake=keys.handbrake;
    if(up&&player.battery>0&&!handbrake)player.speed+=23*dt;
    if(down)player.speed-=27*dt;
    if(!up&&!down)player.speed*=Math.pow(.13,dt);
    if(handbrake)player.speed=Math.sign(player.speed)*Math.max(0,Math.abs(player.speed)-10*dt);
    player.speed=clamp(player.speed,-9,22);
    if(Math.abs(player.speed)<.1)player.speed=0;
    const steer=(right?1:0)-(left?1:0);
    if(steer&&Math.abs(player.speed)>.3){
      const speed=Math.abs(player.speed);
      const turnRate=1.7*Math.min(speed/6,1)/(1+Math.max(speed-9,0)*.06);
      const turn=steer*turnRate*dt*Math.sign(player.speed)*(handbrake?1.3:1);
      player.a+=turn;
      if(handbrake&&speed>5)player.slip=clamp(player.slip-turn*.85,-.48,.48);
    }
    player.slip*=Math.exp(-dt*(handbrake?1.2:5));
    if(Math.abs(player.speed)<1)player.slip=0;
    const travelAngle=player.a+player.slip;
    const oldX=player.x,oldZ=player.z;
    player.x=clamp(player.x+Math.sin(travelAngle)*player.speed*dt,2,WORLD_W-2);
    player.z=clamp(player.z-Math.cos(travelAngle)*player.speed*dt,20,WORLD_H-2);
    if(!onRoad(player.x,player.z)){impact(Math.abs(player.speed));player.x=oldX;player.z=oldZ;player.speed=0;}
    for(const t of traffic){
      const x=t.horizontal?t.pos:t.road+t.lane,z=t.horizontal?t.road+t.lane:t.pos;
      const contact=vehicleContact(player.x,player.z,player.a,x,z,t.heading);
      if(contact){
        impact(Math.abs(player.speed)+t.speed*.25);
        const px=player.x+contact.x*(contact.depth+.03),pz=player.z+contact.z*(contact.depth+.03);
        if(onRoad(px,pz)){player.x=clamp(px,2,WORLD_W-2);player.z=clamp(pz,20,WORLD_H-2);}else{player.x=oldX;player.z=oldZ;}
        player.speed=0;
      }
    }
    for(const parked of parkedCars){
      const contact=vehicleContact(player.x,player.z,player.a,parked.x,parked.z,parked.a);
      if(contact){
        impact(Math.abs(player.speed));
        const px=player.x+contact.x*(contact.depth+.03),pz=player.z+contact.z*(contact.depth+.03);
        if(onRoad(px,pz)){player.x=px;player.z=pz;}else{player.x=oldX;player.z=oldZ;}
        player.speed=0;
      }
    }
    player.battery=Math.max(0,player.battery-Math.abs(player.speed)*dt*.004);
    if(player.battery===0){player.battery=100;player.speed=0;showToast('ТБС: экспресс-зарядка завершена')}
  }
  const cameraForward=new T.Vector3(),cameraWanted=new T.Vector3();
  let hudTime=0;
  function updateScene(dt){
    const animationDt=mode==='paused'?0:dt;
    elapsed+=animationDt;visualAssets.wind.value=elapsed;
    for(const boat of mooredBoats){boat.mesh.position.y=Math.sin(elapsed*1.15+boat.phase)*.055;boat.mesh.rotation.z=Math.sin(elapsed*.8+boat.phase)*.018;boat.mesh.rotation.x=Math.cos(elapsed*.65+boat.phase)*.012;}
    const previousSpeed=player.speed;
    if(mode==='playing')updatePhysics(dt);
    updatePedestrians(dt);
    car.position.set(player.x,.12,player.z);car.rotation.y=-player.a;
    const active=mode==='playing';
    const braking=active&&(keys.handbrake||(keys.down&&player.speed>=0)||(keys.up&&player.speed<0));
    updateSkidMarks(active,braking,(keys.right?1:0)-(keys.left?1:0));
    for(const parked of parkedCars)parked.mesh.visible=Math.hypot(parked.x-player.x,parked.z-player.z)<graphics.distance;
    animateVehicle(car,active?player.speed:0,active?((keys.right?1:0)-(keys.left?1:0)):0,braking,active?dt:0);
    if(active){
      const body=car.userData.body,steer=(keys.right?1:0)-(keys.left?1:0),smoothing=1-Math.exp(-dt*8);
      const pitch=clamp((player.speed-previousSpeed)/Math.max(dt,.001)*.0016,-.045,.045);
      body.rotation.x+=(pitch-body.rotation.x)*smoothing;
      body.rotation.z+=(steer*player.speed*.002-body.rotation.z)*smoothing;
      body.position.y=Math.sin(elapsed*15)*Math.min(Math.abs(player.speed)*.0008,.018)+Math.sin(elapsed*40)*impactAmount*.05;
      impactAmount*=Math.exp(-dt*10);
    }
    updateSound(braking);
    waterTexture.offset.x=(elapsed*.012)%1;
    const waterShader=scene.userData.waterMaterial.userData.shader;if(waterShader)waterShader.uniforms.waveTime.value=elapsed;
    for(const flag of flags){
      if(animationDt===0||camera.position.distanceToSquared(flag.position)>110*110)continue;
      const pos=flag.geometry.attributes.position;
      for(let i=0;i<pos.count;i++){const u=(pos.getX(i)+1.4)/2.8;pos.setZ(i,Math.sin(u*7-elapsed*3.2+flag.position.x)*.19*u+Math.sin(u*13-elapsed*4)*.04*u);}
      pos.needsUpdate=true;flag.geometry.computeVertexNormals();
    }
    fountainJets.forEach((jet,i)=>{jet.scale.y=1+Math.sin(elapsed*3+i)*.08;});
    districtLabels.forEach(label=>{const range=camera.position.distanceTo(label.position);label.visible=range>42&&range<105;});
    maglevTrain.position.x=8+(elapsed*9)%(WORLD_W-16);
    sun.position.set(player.x-35,26+36*lightValue,player.z+40);
    sun.target.position.set(player.x,0,player.z);sun.target.updateMatrixWorld();
    beacon.position.set(target().x,.1,target().z);
    ring.scale.setScalar(1+Math.sin(elapsed*3)*.1);gem.rotation.y=elapsed*1.5;gem.position.y=8.9+Math.sin(elapsed*3)*.45;
    beaconColumn.material.opacity=.12+Math.sin(elapsed*3)*.035;
    beaconLabel.position.y=12+Math.sin(elapsed*2)*.25;
    escortDrone.group.visible=stage===1;
    if(stage===1){
      escortDrone.group.position.set(player.x+Math.cos(elapsed*2)*3.8,5.5+Math.sin(elapsed*3)*.25,player.z+Math.sin(elapsed*2)*3.8);
      escortDrone.rotors.forEach((r,i)=>r.rotation.y=elapsed*22*(i%2?1:-1));
    }
    for(const d of ambientDrones){
      d.model.group.position.set(d.baseX+Math.sin(elapsed*.38+d.phase)*6,11+Math.sin(elapsed*2+d.phase)*.5,d.baseZ+Math.cos(elapsed*.32+d.phase)*4);
      d.model.rotors.forEach((r,i)=>r.rotation.y=elapsed*23*(i%2?1:-1));
    }
    if(launchEffect>0){launchEffect=Math.max(0,launchEffect-animationDt);pickupRing.material.opacity=launchEffect/1.3;pickupRing.scale.setScalar(1+(1.3-launchEffect)*3);pickupRing.visible=true}
    else pickupRing.visible=false;
    const forward=cameraForward.set(Math.sin(player.a),0,-Math.cos(player.a));
    const wanted=cameraWanted.set(player.x-forward.x*16*cameraZoom,2.5+(8+Math.abs(player.speed)*.025)*cameraZoom,player.z-forward.z*16*cameraZoom);
    if(mouseCamera){
      wanted.set(player.x+Math.sin(cameraYaw)*19*cameraZoom*Math.cos(cameraPitch),2.5+19*cameraZoom*Math.sin(cameraPitch),player.z+Math.cos(cameraYaw)*19*cameraZoom*Math.cos(cameraPitch));
    }
    camera.position.lerp(wanted,1-Math.exp(-dt*5));
    if(mouseCamera)camera.lookAt(player.x,2.5,player.z);
    else camera.lookAt(player.x+forward.x*8,2.5,player.z+forward.z*8);
    sky.position.copy(camera.position);
    sky.material.uniforms.skyTime.value=elapsed;
    updateLighting(dt);
    hudTime+=dt;if(hudTime>=.1){hudTime=0;updateHud();}
  }
  function drawMini(){
    const w=mini.width,h=mini.height,sx=w/WORLD_W,sz=h/WORLD_H;
    mctx.fillStyle='#0c242d';mctx.fillRect(0,0,w,h);
    mctx.fillStyle='#0b526a';mctx.fillRect(0,0,w,18*sz);
    mctx.fillStyle='#506675';for(const x of roadsX)mctx.fillRect((x-ROAD/2)*sx,0,ROAD*sx,h);for(const z of roadsZ)mctx.fillRect(0,(z-ROAD/2)*sz,w,ROAD*sz);
    mctx.fillStyle='#1c4b49';for(let j=0;j<roadsZ.length-1;j++)for(let i=0;i<roadsX.length-1;i++)mctx.fillRect((roadsX[i]+ROAD/2+1)*sx,(roadsZ[j]+ROAD/2+1)*sz,(roadsX[i+1]-roadsX[i]-ROAD-2)*sx,(roadsZ[j+1]-roadsZ[j]-ROAD-2)*sz);
    mctx.fillStyle='#9acbd5';mctx.font='bold 9px sans-serif';mctx.textAlign='center';for(const p of parkingLots)mctx.fillText('P',p.cx*sx,(p.top+5)*sz);
    if(centralSquare){mctx.fillStyle='#ff741f';mctx.font='bold 14px sans-serif';mctx.fillText('★',centralSquare.x*sx,centralSquare.z*sz+4);}mctx.textAlign='start';
    const t=target();mctx.fillStyle='#ffb45f';mctx.beginPath();mctx.arc(t.x*sx,t.z*sz,7,0,Math.PI*2);mctx.fill();
    mctx.save();mctx.translate(player.x*sx,player.z*sz);mctx.rotate(player.a);mctx.fillStyle='#78fff0';mctx.beginPath();mctx.moveTo(0,-9);mctx.lineTo(6,6);mctx.lineTo(-6,6);mctx.closePath();mctx.fill();mctx.restore();
  }
  let savedQuality=lowPower?'low':'high';
  try{const saved=localStorage.getItem('tbs.graphicsQuality');if(['low','medium','high'].includes(saved))savedQuality=saved;}catch{}
  const graphics=window.createTBSGraphics({T,renderer,scene,camera,sky,car,water:scene.userData.waterMaterial,buildings:reflectionBuildings,facades:facadeMaterials,reflectObjects:mooredBoats.map(boat=>boat.mesh),initialQuality:savedQuality});
  $('qualitySelect').value=graphics.quality;
  $('qualitySelect').addEventListener('focus',()=>{for(const k in keys)keys[k]=false;});
  $('qualitySelect').addEventListener('change',e=>{graphics.setQuality(e.target.value);showToast('Качество графики: '+e.target.options[e.target.selectedIndex].text);});
  function resize(){
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    graphics.resize();
  }
  addEventListener('resize',resize);
  let miniTime=0;
  function frame(now){
    const dt=Math.max(0,Math.min((now-last)/1000||0,.05));last=now;
    if(!document.hidden){updateScene(dt);graphics.render(mode==='paused'?0:dt,lightValue);miniTime+=dt;if(miniTime>=.1){miniTime=0;drawMini();}}
    requestAnimationFrame(frame);
  }
  updateHud();requestAnimationFrame(frame);
  if(new URLSearchParams(location.search).has('play'))start();
  } catch(error) {
    console.error(error);
    const toast=document.getElementById('toast');toast.textContent='Ошибка запуска 3D: '+error.message;toast.classList.add('show');
  }
})();
