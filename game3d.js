(() => {
  'use strict';

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
  const WORLD_W = 260, WORLD_H = 220, ROAD = 12.4;
  const roadsX = [26, 68, 110, 152, 194, 236];
  const roadsZ = [30, 70, 110, 150, 190];
  const missions = [
    {title:'Контур будущего', description:'Заберите модуль связи в центре ТБС и отвезите его инженерам Жигулёвской долины.', from:{x:26,z:30,name:'Центр ТБС'}, to:{x:110,z:110,name:'Жигулёвская долина'}, reward:1200},
    {title:'Письмо над Волгой', description:'Получите дрон К-50 на площадке НПЦ БАС и отправьте груз к набережной Волги.', from:{x:194,z:30,name:'НПЦ БАС • ТБС'}, to:{x:68,z:30,name:'Набережная Волги'}, reward:1800},
    {title:'Город на связи', description:'Заберите батарею у АВТОВАЗа и доставьте её обратно в центр ТБС.', from:{x:194,z:150,name:'АВТОВАЗ'}, to:{x:26,z:30,name:'Центр ТБС'}, reward:2400}
  ];
  const keys = Object.create(null);
  const player = {x:68,z:30,a:-Math.PI/2,speed:0,battery:100};
  let mode='intro', missionIndex=0, stage=0, deliveries=0, credits=0, elapsed=0, last=0, toastTimer=0, launchEffect=0;

  const renderer = new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  const lowPower=matchMedia('(pointer:coarse)').matches || innerWidth<700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower?1.15:1.5));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .84;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color(0x091827);
  scene.fog = new T.FogExp2(0x12283a,0.0042);
  const camera = new T.PerspectiveCamera(66,innerWidth/innerHeight,.1,550);
  camera.position.set(84,12,30);
  scene.add(new T.HemisphereLight(0x98cce8,0x101d2c,.62));
  const sun = new T.DirectionalLight(0xffc3a5,1.2);
  sun.position.set(-35,62,40);
  sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
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
    vertexShader:'varying vec3 vDir; void main(){vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec3 vDir; void main(){float h=normalize(vDir).y; vec3 low=vec3(0.26,0.34,0.44); vec3 middle=vec3(0.10,0.23,0.36); vec3 high=vec3(0.025,0.075,0.16); vec3 color=mix(low,middle,smoothstep(-0.06,0.18,h)); color=mix(color,high,smoothstep(0.18,0.80,h)); gl_FragColor=vec4(color,1.0);}'
  }));
  scene.add(sky);
  const duskSun=new T.Mesh(new T.SphereGeometry(8,20,12),new T.MeshBasicMaterial({color:0xffa676,fog:false,depthWrite:false}));
  duskSun.position.set(-190,58,-115);scene.add(duskSun);

  const mat = (color,metalness=0,roughness=.8,emissive=0x000000) => new T.MeshStandardMaterial({color,metalness,roughness,emissive});
  const dark=mat(0x142733,.22,.72), roadMat=mat(0x192b34,.08,.93), curbMat=mat(0x31505a,.08,.83),
        cyanMat=mat(0x47e6e0,.12,.27,0x148c8b), orangeMat=mat(0xff4808,.2,.34,0xa32c0c),
        whiteMat=mat(0xdcebf0,.24,.42), glassMat=mat(0x16445d,.68,.18,0x071a28),
        tireMat=mat(0x101820,.08,.95), laneMat=new T.MeshBasicMaterial({color:0xaabac0}),
        grassMat=mat(0x173730), roofMat=mat(0x203945,.12,.76);
  const unitBox = new T.BoxGeometry(1,1,1);
  const unitPlane = new T.PlaneGeometry(1,1);
  function box(parent,x,y,z,w,h,d,material){const o=new T.Mesh(unitBox,material);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o}
  function flat(parent,x,y,z,w,d,material){const o=new T.Mesh(unitPlane,material);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.scale.set(w,d,1);o.receiveShadow=true;parent.add(o);return o}

  function makeTexture(draw,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;return t}
  const asphaltTexture=makeTexture((p,w,h)=>{
    p.fillStyle='#afb7ba';p.fillRect(0,0,w,h);
    for(let i=0;i<5400;i++){
      const x=(i*73.117)%w,y=(i*151.319)%h,v=(i*47)%3;
      p.fillStyle=v===0?'#82909455':v===1?'#ecf1ed37':'#202c3530';
      p.fillRect(x,y,1+(i%3),1+(i%2));
    }
  });
  function roadSurface(w,d){const texture=asphaltTexture.clone();texture.repeat.set(w/8,d/8);texture.needsUpdate=true;return new T.MeshStandardMaterial({color:0x35434a,map:texture,roughness:.96,metalness:.02})}
  const waterTexture=makeTexture((p,w,h)=>{
    p.fillStyle='#0b354c';p.fillRect(0,0,w,h);
    for(let i=0;i<24;i++){
      const y=5+i*5.2;p.strokeStyle=i%3===0?'#3787a199':'#1b5b7990';p.lineWidth=i%3===0?2:1;
      p.beginPath();for(let x=0;x<=w;x+=6){const wave=y+Math.sin(x*.07+i*.55)*2.2;x?p.lineTo(x,wave):p.moveTo(x,wave)}p.stroke();
    }
  },512,128);
  waterTexture.repeat.set(7,1);
  function imageTexture(file){const source=window.TBS_EMBEDDED?.[file] || 'assets/'+file;const tex=new T.TextureLoader().load(source);tex.encoding=T.sRGBEncoding;return tex}
  const markTexture=imageTexture('cropped-fav-tb_drone-192x192.png');
  const droneTexture=imageTexture('home-sec3-img__1-768x597.webp');
  const factoryTexture=imageTexture('tb-samara-hero-vid-poster.webp');
  const hangarTexture=imageTexture('tb-samara-mission-big-img.webp');

  const glowTexture=makeTexture((p,w,h)=>{
    const g=p.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(126,255,237,.85)');g.addColorStop(.24,'rgba(80,220,231,.38)');g.addColorStop(1,'rgba(80,220,231,0)');
    p.fillStyle=g;p.fillRect(0,0,w,h);
  },128,128);
  glowTexture.wrapS=glowTexture.wrapT=T.ClampToEdgeWrapping;
  const crosswalkMat=new T.MeshBasicMaterial({color:0x9bb9bc,transparent:true,opacity:.58,depthWrite:false});
  const leafMats=[mat(0x285b58),mat(0x286567),mat(0x346358)];
  let maglevTrain;
  function streetLight(x,z){
    const metal=mat(0x3b5965,.62,.32);
    const pole=new T.Mesh(new T.CylinderGeometry(.07,.11,5.5,8),metal);pole.position.set(x,2.9,z);scene.add(pole);
    box(scene,x-.65,5.57,z,1.45,.11,.1,metal);
    box(scene,x-1.25,5.48,z,.45,.11,.3,new T.MeshBasicMaterial({color:0xa5ffec}));
    sprite(scene,glowTexture,x-1.25,5.48,z,3.3,3.3,.6);
    const pool=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false}));
    pool.rotation.x=-Math.PI/2;pool.position.set(x-1.25,.19,z);scene.add(pool);
  }
  function tree(x,z,seed){
    const trunk=new T.Mesh(new T.CylinderGeometry(.12,.18,2.3,7),mat(0x665449));trunk.position.set(x,1.22,z);scene.add(trunk);
    const crown=new T.Mesh(new T.IcosahedronGeometry(1.35+(seed%3)*.19,1),leafMats[seed%leafMats.length]);
    crown.position.set(x,3.03,z);crown.scale.set(1,1.26,1);crown.castShadow=true;scene.add(crown);
    const crownTop=new T.Mesh(new T.IcosahedronGeometry(.84,1),leafMats[(seed+1)%leafMats.length]);
    crownTop.position.set(x+.35,4.16,z-.2);scene.add(crownTop);
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
    p.fillStyle='#f2ffff';p.font='900 73px Segoe UI, Arial';p.textAlign='center';p.fillText(title,545,112);
    p.fillStyle='#82bdc4';p.font='700 38px Segoe UI, Arial';p.fillText(sub,545,182);
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t;
  }
  function city(){
    flat(scene,WORLD_W/2,-.16,WORLD_H/2,WORLD_W+150,WORLD_H+150,grassMat);
    flat(scene,WORLD_W/2,.02,9,WORLD_W,18,new T.MeshBasicMaterial({map:waterTexture}));
    box(scene,WORLD_W/2,.21,19,WORLD_W,.38,1.3,curbMat);
    box(scene,WORLD_W/2,.36,19.6,WORLD_W,.08,.12,cyanMat);
    flat(scene,WORLD_W/2,.06,21.5,WORLD_W,4.4,mat(0x31484c,.1,.85));
    for(let x=8,i=0;x<WORLD_W-5;x+=8.2,i++){
      if(roadsX.some(v=>Math.abs(x-v)<5))continue;
      tree(x,21.5,i);
      if(i%3===0){box(scene,x+2,.49,20.4,2.4,.3,.5,mat(0x526368));box(scene,x+2,.8,20.4,2.2,.12,.5,roofMat)}
    }
    for(const x of roadsX){
      flat(scene,x,.08,WORLD_H/2,ROAD,WORLD_H,roadSurface(ROAD,WORLD_H));
      box(scene,x-ROAD/2,.16,WORLD_H/2,.18,.28,WORLD_H,curbMat);
      box(scene,x+ROAD/2,.16,WORLD_H/2,.18,.28,WORLD_H,curbMat);
      for(let z=21;z<WORLD_H;z+=8)box(scene,x,.12,z,.16,.04,3.1,laneMat);
    }
    for(const z of roadsZ){
      flat(scene,WORLD_W/2,.09,z,WORLD_W,ROAD,roadSurface(WORLD_W,ROAD));
      box(scene,WORLD_W/2,.17,z-ROAD/2,WORLD_W,.28,.18,curbMat);
      box(scene,WORLD_W/2,.17,z+ROAD/2,WORLD_W,.28,.18,curbMat);
      for(let x=0;x<WORLD_W;x+=8)box(scene,x,.13,z,3.1,.04,.16,laneMat);
    }
    for(const x of roadsX)for(const z of roadsZ){
      flat(scene,x,.15,z,ROAD,ROAD,roadMat);
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
  city();

  const landmarks=[
    {i:0,j:0,name:'ЦЕНТР ТБС',sub:'ТРАНСПОРТ БУДУЩЕГО САМАРА',photo:droneTexture,h:10},
    {i:3,j:0,name:'НПЦ БАС',sub:'САМАРА · ТОЛЬЯТТИ',photo:factoryTexture,h:12},
    {i:1,j:1,name:'ЖИГУЛЁВСКАЯ ДОЛИНА',sub:'ТЕХНОПАРК · ТБС',photo:hangarTexture,h:9},
    {i:3,j:2,name:'АВТОВАЗ',sub:'ЭЛЕКТРОМОБИЛЬНОСТЬ',photo:null,h:11},
    {i:4,j:0,name:'ЗАВОД ТБС',sub:'БЕСПИЛОТНЫЕ СИСТЕМЫ',photo:droneTexture,h:13},
    {i:0,j:2,name:'ТБС · ЭНЕРГИЯ',sub:'ЗАРЯДКА',photo:null,h:8},
    {i:2,j:3,name:'ТБС · ЛОГИСТИКА',sub:'К-25  /  К-50',photo:factoryTexture,h:9}
  ];
  const special=new Map(landmarks.map(l=>[l.i+','+l.j,l]));
  const buildingColors=[0x213b4a,0x294253,0x1a3545,0x344754,0x1d414b];
  const windowLit=new T.MeshBasicMaterial({color:0x74b9c3});
  const windowWarm=new T.MeshBasicMaterial({color:0xe9aa76});
  const windowDark=new T.MeshStandardMaterial({color:0x143647,metalness:.7,roughness:.2});
  const trimMat=mat(0x5d7e87,.48,.35);
  const landingMat=new T.MeshBasicMaterial({color:0x7ce5db,transparent:true,opacity:.74,depthWrite:false});
  function building(parent,x,z,w,d,h,seed){
    const body=mat(buildingColors[seed%buildingColors.length],.25,.58);
    const main=box(parent,x,h/2,z,w,h,d,body);main.castShadow=true;main.receiveShadow=true;
    box(parent,x,.47,z,w+.6,.68,d+.6,roofMat);
    box(parent,x,h+.16,z,w+.32,.32,d+.32,trimMat);
    box(parent,x,h+.42,z,Math.max(2,w*.24),.54,Math.max(2,d*.28),dark);
    // Roof machinery and a visible rim give the blocks different silhouettes.
    box(parent,x-w*.24,h+.6,z+d*.17,Math.max(1.3,w*.19),.85,Math.max(1.3,d*.21),roofMat);
    box(parent,x+w*.24,h+.47,z-d*.12,Math.max(1.2,w*.17),.42,Math.max(1.2,d*.18),dark);
    for(const sx of [-1,1])for(const sz of [-1,1])box(parent,x+sx*(w/2-.24),h/2,z+sz*(d/2-.24),.24,h,.24,trimMat);
    if(seed%3===0){
      const crown=box(parent,x,h+1.15,z,w*.56,1.5,d*.5,body);crown.castShadow=true;
      box(parent,x,h+1.96,z,w*.6,.17,d*.54,trimMat);
    }
    for(let y=2;y<h-1;y+=2.1){
      for(let bx=x-w/2+1.3;bx<x+w/2-.5;bx+=2.5){
        const lit=(Math.round(bx*3+y*7+seed)%5)!==0;
        const pane=lit?((Math.round(bx+y+seed)%9)===0?windowWarm:windowLit):windowDark;
        box(parent,bx,y,z+d/2+.023,1,.74,.04,pane);
        box(parent,bx,y,z-d/2-.023,1,.74,.04,pane);
      }
    }
    for(let y=2;y<h-1;y+=2.1)for(let bz=z-d/2+1.2;bz<z+d/2-.5;bz+=2.5){
      const pane=(Math.round(bz+y+seed)%5)===0?windowDark:windowLit;
      box(parent,x+w/2+.023,y,bz,.04,.74,1,pane);
      box(parent,x-w/2-.023,y,bz,.04,.74,1,pane);
    }
    box(parent,x,1.25,z-d/2-.28,2.1,2.3,.18,glassMat);
    box(parent,x,2.56,z-d/2-.5,4.1,.13,1.15,seed%3===0?orangeMat:cyanMat);
  }
  for(let j=0;j<roadsZ.length-1;j++)for(let i=0;i<roadsX.length-1;i++){
    const left=roadsX[i]+ROAD/2+1.2,right=roadsX[i+1]-ROAD/2-1.2;
    const top=roadsZ[j]+ROAD/2+1.2,bottom=roadsZ[j+1]-ROAD/2-1.2;
    const cx=(left+right)/2,cz=(top+bottom)/2,w=right-left,d=bottom-top;
    flat(scene,cx,.13,cz,w+1,d+1,mat(0x193a36));
    box(scene,cx,.33,cz,w+.8,.34,d+.8,mat(0x254840));
    const landmark=special.get(i+','+j);
    if(landmark){
      building(scene,cx,cz,w-3,d-3,landmark.h,17+i*3+j);
      const pad=new T.Mesh(new T.RingGeometry(3.35,3.57,36),landingMat);
      pad.rotation.x=-Math.PI/2;pad.position.set(cx-3,landmark.h+.37,cz+2);scene.add(pad);
      box(scene,cx-3,landmark.h+.39,cz+2,2.9,.04,.11,landingMat);
      box(scene,cx-3,landmark.h+.39,cz+2,.11,.04,2.9,landingMat);
      for(const side of [-1,1])box(scene,cx+side*7,landmark.h+2.4,cz,.14,4.8,.14,trimMat);
      sprite(scene,signTexture(landmark.name,landmark.sub),cx,landmark.h+5.6,cz,17,4.2);
      sprite(scene,markTexture,cx-w/2+3,landmark.h+5.6,cz,3.5,3.5);
      if(landmark.photo)sprite(scene,landmark.photo,cx,landmark.h+10.1,cz,14.5,8.2);
      if(landmark.photo){
        const front=cz-(d-3)/2-.14;
        box(scene,cx+2,landmark.h*.51,front,13.3,6.8,.21,orangeMat);
        box(scene,cx+2,landmark.h*.51,front-.1,12.8,6.3,.16,dark);
        const image=new T.Mesh(new T.PlaneGeometry(12.2,5.8),new T.MeshBasicMaterial({map:landmark.photo,side:T.DoubleSide}));
        image.rotation.y=Math.PI;image.position.set(cx+2,landmark.h*.51,front-.2);scene.add(image);
      }
      const wallLogo=new T.Mesh(new T.PlaneGeometry(3.4,3.4),new T.MeshBasicMaterial({map:markTexture,transparent:true,side:T.DoubleSide}));
      wallLogo.rotation.y=Math.PI;wallLogo.position.set(cx-w/2+4,landmark.h*.52,cz-(d-3)/2-.28);scene.add(wallLogo);
      addFlag(cx-w/3,cz+d/2+1);
      addFlag(cx+w/3,cz+d/2+1);
      addFlag(cx-w/3,cz-d/2-1);
      addFlag(cx+w/3,cz-d/2-1);
    }else{
      for(let n=0;n<3;n++){
        const bx=left+5+n*(w-10)/2;
        const height=5+((i*7+j*3+n*5)%8);
        building(scene,bx,cz,Math.max(4,w/3-2),d-3,height,i*17+j*11+n);
      }
    }
  }

  function addFlag(x,z){
    const pole=new T.Mesh(new T.CylinderGeometry(.055,.065,4.6,8),whiteMat);
    pole.position.set(x,2.5,z);scene.add(pole);
    box(scene,x,4.8,z,3.1,1.8,.12,whiteMat).position.x=x+1.5;
    sprite(scene,markTexture,x+1.65,4.8,z+.09,2.2,1.9);
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

  function createCar(color,hero=false){
    const group=new T.Group();
    const body=mat(color,.38,.3);
    const chassis=box(group,0,.96,0,2.8,.82,5.35,body);chassis.castShadow=true;
    wedge(group,2.76,-2.82,-1.1,.67,1.02,1.61,body);
    wedge(group,2.76,1.05,2.78,.67,1.63,1.04,body);
    box(group,0,.55,0,2.33,.22,4.98,dark);
    box(group,0,1.79,-.2,2.13,.67,2.5,glassMat);
    box(group,0,2.2,-.2,2.18,.13,2.5,hero?dark:body);
    for(const side of [-1,1]){
      box(group,side*1.34,1.08,-.01,.11,.22,4.9,hero?orangeMat:cyanMat);
      box(group,side*1.12,1.83,-.28,.05,.49,2.1,glassMat);
      box(group,side*1.04,2.2,-.2,.12,.13,2.55,body);
    }
    const frontGlass=box(group,0,1.73,-1.46,1.99,.1,.96,glassMat);frontGlass.rotation.x=-.72;
    const rearGlass=box(group,0,1.77,1.04,1.99,.1,.83,glassMat);rearGlass.rotation.x=.63;
    box(group,0,1.11,-2.82,2.38,.22,.1,dark);
    box(group,0,1.01,2.81,2.35,.22,.1,dark);
    const wheels=[];
    for(const side of [-1,1])for(const z of [-1.75,1.75]){
      const wheel=new T.Mesh(new T.CylinderGeometry(.5,.5,.34,18),tireMat);
      wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.45,.52,z);wheel.castShadow=true;group.add(wheel);wheels.push(wheel);
      const hub=new T.Mesh(new T.CylinderGeometry(.27,.27,.36,12),trimMat);hub.rotation.z=Math.PI/2;hub.position.set(side*1.46,.52,z);group.add(hub);
    }
    for(const side of [-1,1]){
      box(group,side*.96,1.18,-2.87,.72,.14,.08,new T.MeshBasicMaterial({color:0xbffff1}));
      box(group,side*.94,1.17,2.86,.72,.12,.08,new T.MeshBasicMaterial({color:0xff5530}));
      box(group,side*1.32,1.22,-.35,.14,.11,2.4,hero?orangeMat:cyanMat);
    }
    box(group,0,1.15,-2.88,.55,.09,.08,orangeMat);
    const shadow=new T.Mesh(new T.CircleGeometry(2.35,24),new T.MeshBasicMaterial({color:0x02090d,transparent:true,opacity:.34,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.scale.set(1,1.52,1);shadow.position.y=.12;group.add(shadow);
    if(hero){
      const roofLogo=new T.Mesh(new T.PlaneGeometry(1.62,1.62),new T.MeshBasicMaterial({map:markTexture,transparent:true,depthWrite:false}));
      roofLogo.rotation.x=-Math.PI/2;roofLogo.position.set(0,2.28,-.24);group.add(roofLogo);
      box(group,0,.24,0,2.37,.06,4.55,new T.MeshBasicMaterial({color:0x16eee0,transparent:true,opacity:.53}));
      const frontLight=new T.PointLight(0x8affed,1.3,10,2);frontLight.position.set(0,1.14,-2.75);group.add(frontLight);
    }
    group.userData.wheels=wheels;
    scene.add(group);return group;
  }
  const car=createCar(0x164252,true);
  const traffic=Array.from({length:12},(_,i)=>{
    const horizontal=i%2===0,road=horizontal?roadsZ[(i*3+1)%roadsZ.length]:roadsX[(i*2+1)%roadsX.length];
    return {horizontal,road,lane:i%4<2?2.3:-2.3,pos:horizontal?(i*34)%WORLD_W:(i*27)%WORLD_H,speed:5.5+(i*1.37)%4.5,mesh:createCar([0xf4a063,0x88bbcf,0xb598d9][i%3])};
  });

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
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const currentMission=()=>missions[missionIndex];
  const target=()=>stage===0?currentMission().from:currentMission().to;
  function updateHud(){
    const m=currentMission();
    $('missionNumber').textContent=String(missionIndex+1).padStart(2,'0');
    $('missionTitle').textContent=m.title;$('missionDescription').textContent=m.description;
    $('objective').textContent=(stage===0?'Забрать груз: ':'Доставить груз: ')+target().name;
    $('distance').textContent='ДО МАЯКА: '+Math.round(distance(player,target())*10)+' м';
    $('delivered').textContent=deliveries;
    $('credits').innerHTML=credits.toLocaleString('ru-RU')+' <em>₽</em>';
    $('speed').innerHTML=String(Math.round(Math.abs(player.speed)*3.6)).padStart(2,'0')+' <small>км/ч</small>';
    $('batteryFill').style.width=player.battery+'%';
    $('batteryText').textContent='ЗАРЯД '+Math.round(player.battery)+'%';
  }
  function showToast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
  function start(){mode='playing';$('overlay').classList.add('hidden');last=performance.now();showToast('Смена ТБС началась · W — вперёд, S — назад')}
  function togglePause(){
    if(mode==='playing'){
      mode='paused';$('overlayChapter').textContent='ТБС · Пауза';$('overlayTitle').innerHTML='ПАУЗА<br><span>НА МАРШРУТЕ</span>';
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
  const controlsByCode={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  const controlsByKey={w:'up','ц':'up',s:'down','ы':'down',a:'left','ф':'left',d:'right','в':'right'};
  function movementKey(e){return controlsByCode[e.code] || controlsByKey[String(e.key).toLowerCase()]}
  addEventListener('keydown',e=>{
    const action=e.code==='KeyE'||e.code==='Space'||e.key===' ';
    const pause=e.code==='KeyP'||e.code==='Escape';
    const control=movementKey(e);
    if(control||action||pause)e.preventDefault();
    if(pause){if(!e.repeat)togglePause();return}
    if(action){if(!e.repeat)interact();return}
    if(control)keys[control]=true;
  });
  addEventListener('keyup',e=>{const control=movementKey(e);if(control)keys[control]=false});
  addEventListener('blur',()=>{for(const k in keys)keys[k]=false;if(mode==='playing')togglePause()});
  document.querySelectorAll('.touch button').forEach(btn=>{
    const k=btn.dataset.key;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);btn.classList.add('active');if(k==='action')interact();else keys[k]=true});
    const release=()=>{btn.classList.remove('active');keys[k]=false};
    btn.addEventListener('pointerup',release);btn.addEventListener('pointercancel',release);btn.addEventListener('lostpointercapture',release);
  });

  function onRoad(x,z){return roadsX.some(v=>Math.abs(v-x)<ROAD/2-1.2)||roadsZ.some(v=>Math.abs(v-z)<ROAD/2-1.2)}
  function updatePhysics(dt){
    const up=keys.up,down=keys.down;
    const left=keys.left,right=keys.right;
    if(up&&player.battery>0)player.speed+=23*dt;
    if(down)player.speed-=27*dt;
    if(!up&&!down)player.speed*=Math.pow(.13,dt);
    player.speed=clamp(player.speed,-9,22);
    if(Math.abs(player.speed)<.1)player.speed=0;
    const steer=(right?1:0)-(left?1:0);
    if(steer&&Math.abs(player.speed)>.3){
      const speed=Math.abs(player.speed);
      const turnRate=1.7*Math.min(speed/6,1)/(1+Math.max(speed-9,0)*.06);
      player.a+=steer*turnRate*dt*Math.sign(player.speed);
    }
    const oldX=player.x,oldZ=player.z;
    player.x=clamp(player.x+Math.sin(player.a)*player.speed*dt,2,WORLD_W-2);
    player.z=clamp(player.z-Math.cos(player.a)*player.speed*dt,20,WORLD_H-2);
    if(!onRoad(player.x,player.z)){player.x=oldX;player.z=oldZ;player.speed*=-.18}
    for(const t of traffic){
      t.pos+=t.speed*dt;if(t.pos>(t.horizontal?WORLD_W:WORLD_H)+6)t.pos=-6;
      const x=t.horizontal?t.pos:t.road+t.lane,z=t.horizontal?t.road+t.lane:t.pos;
      t.mesh.position.set(x,.08,z);t.mesh.rotation.y=t.horizontal?-Math.PI/2:Math.PI;
      if(Math.hypot(x-player.x,z-player.z)<2.7){player.x=oldX;player.z=oldZ;player.speed*=-.18}
    }
    player.battery=Math.max(0,player.battery-Math.abs(player.speed)*dt*.004);
    if(player.battery===0){player.battery=100;player.speed=0;showToast('ТБС: экспресс-зарядка завершена')}
  }
  function updateScene(dt){
    elapsed+=dt;
    if(mode==='playing')updatePhysics(dt);
    car.position.set(player.x,.12,player.z);car.rotation.y=-player.a;
    for(const wheel of car.userData.wheels)wheel.rotation.x+=player.speed*dt*1.35;
    waterTexture.offset.x=(elapsed*.012)%1;
    maglevTrain.position.x=8+(elapsed*9)%(WORLD_W-16);
    sun.position.set(player.x-35,62,player.z+40);
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
    if(launchEffect>0){launchEffect=Math.max(0,launchEffect-dt);pickupRing.material.opacity=launchEffect/1.3;pickupRing.scale.setScalar(1+(1.3-launchEffect)*3);pickupRing.visible=true}
    else pickupRing.visible=false;
    const forward=new T.Vector3(Math.sin(player.a),0,-Math.cos(player.a));
    const wanted=new T.Vector3(player.x-forward.x*16,10.5+Math.abs(player.speed)*.025,player.z-forward.z*16);
    const smoothing=1-Math.exp(-dt*5);
    camera.position.lerp(wanted,smoothing);
    camera.lookAt(player.x+forward.x*8,2.5,player.z+forward.z*8);
    sky.position.copy(camera.position);
    updateHud();
  }
  function drawMini(){
    const w=mini.width,h=mini.height,sx=w/WORLD_W,sz=h/WORLD_H;
    mctx.fillStyle='#0c242d';mctx.fillRect(0,0,w,h);
    mctx.fillStyle='#0b526a';mctx.fillRect(0,0,w,18*sz);
    mctx.fillStyle='#506675';for(const x of roadsX)mctx.fillRect((x-ROAD/2)*sx,0,ROAD*sx,h);for(const z of roadsZ)mctx.fillRect(0,(z-ROAD/2)*sz,w,ROAD*sz);
    mctx.fillStyle='#1c4b49';for(let j=0;j<roadsZ.length-1;j++)for(let i=0;i<roadsX.length-1;i++)mctx.fillRect((roadsX[i]+ROAD/2+1)*sx,(roadsZ[j]+ROAD/2+1)*sz,(roadsX[i+1]-roadsX[i]-ROAD-2)*sx,(roadsZ[j+1]-roadsZ[j]-ROAD-2)*sz);
    const t=target();mctx.fillStyle='#ffb45f';mctx.beginPath();mctx.arc(t.x*sx,t.z*sz,7,0,Math.PI*2);mctx.fill();
    mctx.save();mctx.translate(player.x*sx,player.z*sz);mctx.rotate(player.a);mctx.fillStyle='#78fff0';mctx.beginPath();mctx.moveTo(0,-9);mctx.lineTo(6,6);mctx.lineTo(-6,6);mctx.closePath();mctx.fill();mctx.restore();
  }
  function resize(){
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,lowPower?1.15:1.5));renderer.setSize(innerWidth,innerHeight,false);
  }
  addEventListener('resize',resize);
  function frame(now){
    const dt=Math.min((now-last)/1000||0,.05);last=now;
    updateScene(dt);renderer.render(scene,camera);drawMini();requestAnimationFrame(frame);
  }
  updateHud();requestAnimationFrame(frame);
  if(new URLSearchParams(location.search).has('play'))start();
})();
