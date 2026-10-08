/* TBS Fastback 063. Original local body mesh plus articulated wheels and cabin. */
window.createTBSFastback=function({T,scene,logo,makeTexture,shadowTexture}){
  const car=new T.Group();car.name='TBS Fastback 063';
  const body=new T.Group();body.name='sprung-body';car.add(body);
  const paint=new T.MeshPhysicalMaterial({color:0x87b5bf,metalness:.4,roughness:.27,clearcoat:.9,clearcoatRoughness:.18,envMapIntensity:.85,side:T.DoubleSide});
  const roof=new T.MeshPhysicalMaterial({color:0x17272d,metalness:.24,roughness:.3,clearcoat:.6,clearcoatRoughness:.22,envMapIntensity:.55,side:T.DoubleSide});
  const glass=new T.MeshPhysicalMaterial({color:0x829ba0,metalness:0,roughness:.16,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide,envMapIntensity:.4});
  const rubber=new T.MeshStandardMaterial({color:0x141919,roughness:.97});
  const leather=new T.MeshStandardMaterial({color:0x303d40,roughness:.88});
  const fabric=new T.MeshStandardMaterial({color:0x63706a,roughness:1});
  const alloy=new T.MeshStandardMaterial({color:0x9da7a5,metalness:.88,roughness:.25});
  const graphite=new T.MeshStandardMaterial({color:0x283134,metalness:.48,roughness:.46});
  const rotorSteel=new T.MeshStandardMaterial({color:0x505b5b,metalness:.7,roughness:.57});
  const orange=new T.MeshStandardMaterial({color:0xff5b16,metalness:.16,roughness:.44});
  const led=new T.MeshBasicMaterial({color:0xd0edf3,toneMapped:false});
  const brake=new T.MeshBasicMaterial({color:0x8c160d,toneMapped:false});
  const reverse=new T.MeshBasicMaterial({color:0x29313b,toneMapped:false});
  const stitch=new T.MeshStandardMaterial({color:0xa3aaa0,roughness:.95});
  const optics=new T.MeshPhysicalMaterial({color:0xd2e0e4,roughness:.07,transparent:true,opacity:.18,depthWrite:false,clearcoat:1});
  const materials={paint,roof,glass};
  function bodyWidth(z,k=1){const rows=window.TBS_FASTBACK_MESH.stations;let i=0;while(i<rows.length-2&&z>rows[i+1][0])i++;const t=(z-rows[i][0])/(rows[i+1][0]-rows[i][0]),a=rows[Math.max(0,i-1)][k],b=rows[i][k],c=rows[i+1][k],d=rows[Math.min(rows.length-1,i+2)][k];return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
  function skinX(y,z){const q=Math.min(Math.abs(z-1.75),Math.abs(z+1.75)),arch=Math.sqrt(Math.max(0,1-(q/.635)**2)),low=q<.635?Math.max(.45,.52+.635*arch):.45,u=(y-low)/(bodyWidth(z,2)-low);return bodyWidth(z)-(.11-.085*arch)*(1-u)**2+.017*Math.sin(u*Math.PI);}
  for(const panel of window.TBS_FASTBACK_MESH.panels){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(panel.position,3));g.setAttribute('uv',new T.Float32BufferAttribute(panel.uv,2));g.setIndex(panel.index);g.computeVertexNormals();
    const mesh=new T.Mesh(g,materials[panel.material]);mesh.name=panel.name;mesh.castShadow=panel.material!=='glass';mesh.receiveShadow=panel.material!=='glass';body.add(mesh);
  }
  const boxGeometry=new T.BoxGeometry(1,1,1),roundedCache=new Map();
  function box(parent,x,y,z,w,h,d,mat){const m=new T.Mesh(boxGeometry,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function rounded(parent,x,y,z,w,h,d,r,mat){
    const key=[w,h,d,r].join(':');let g=roundedCache.get(key);
    if(!g){
      g=new T.BoxGeometry(w,h,d,8,8,8);const p=g.attributes.position,n=g.attributes.normal,v=new T.Vector3(),core=new T.Vector3(),delta=new T.Vector3();
      for(let i=0;i<p.count;i++){
        v.fromBufferAttribute(p,i);core.set(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));
        delta.copy(v).sub(core).normalize();v.copy(core).addScaledVector(delta,r);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,delta.x,delta.y,delta.z);
      }roundedCache.set(key,g);
    }
    const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function line(parent,points,r,mat){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),m=new T.Mesh(new T.TubeGeometry(curve,Math.max(18,points.length*5),r,6,false),mat);parent.add(m);m.castShadow=true;return m;}
  function lens(parent,x,y,z,sx,sy,sz,mat){const m=new T.Mesh(new T.SphereGeometry(1,24,14),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  // Closed lower valances and an inset grille, instead of a single rectangular bumper.
  rounded(body,0,.59,-2.73,2.35,.28,.4,.12,paint);
  rounded(body,0,.59,2.73,2.43,.3,.4,.12,paint);
  rounded(body,0,.79,-2.885,1.8,.23,.13,.06,rubber);
  rounded(body,0,.435,-2.8,2.38,.07,.28,.033,graphite);
  rounded(body,0,.455,2.78,2.22,.12,.35,.05,graphite);
  box(body,0,.52,0,2.36,.14,4.7,rubber);
  for(let n=-7;n<=7;n++)box(body,n*.105,.79,-2.961,.018,.15,.022,graphite);
  for(const side of [-1,1]){
    rounded(body,side*1.03,.84,-2.76,.34,.31,.3,.09,paint);
    rounded(body,side*.99,.80,2.78,.34,.32,.27,.08,paint);
    rounded(body,side*1.27,.48,0,.18,.12,2.2,.05,graphite);
    line(body,[[side*1.28,.64,-1.02],[side*1.285,.61,0],[side*1.30,.66,1.04]],.025,orange);
    // Flush door joints follow the changing width of the sculpted flanks.
    line(body,[[side*1.40,1.385,-1.42],[side*1.32,1.15,-.95],[side*1.24,.58,-.98],[side*1.23,.53,.12],[side*1.32,1.35,.14]],.009,rubber);
    line(body,[[side*1.32,1.37,.14],[side*1.25,.57,.15],[side*1.32,.56,1.02],[side*1.40,1.36,1.37]],.009,rubber);
    rounded(body,side*(skinX(1.265,-.02)+.012),1.265,-.02,.026,.045,.24,.011,alloy);
    rounded(body,side*(skinX(1.275,1.02)+.012),1.275,1.02,.026,.045,.22,.011,alloy);
    // The window frame is a slim continuous seal; pillars sit over the glass.
    line(body,[[side*1.115,1.43,-1.45],[side*.945,2.04,-.68],[side*.963,2.07,0],[side*.945,2.04,.70],[side*1.115,1.43,1.60],[side*1.13,1.425,.05],[side*1.115,1.43,-1.45]],.022,rubber);
    line(body,[[side*1.13,1.43,.15],[side*.963,2.07,.07]],.034,roof);
    line(body,[[side*1.115,1.43,-1.43],[side*1.137,1.42,0],[side*1.115,1.43,1.58]],.012,alloy);
    line(body,[[side*1.13,1.44,-1.17],[side*1.45,1.50,-1.13]],.035,graphite);
    rounded(body,side*1.51,1.51,-1.12,.31,.14,.36,.065,paint);
    rounded(body,side*1.51,1.51,-.934,.25,.092,.016,.007,alloy);
    line(body,[[side*1.39,1.52,-1.28],[side*1.61,1.51,-1.27]],.011,led);
    // Slim three-projector headlights with recessed optical elements.
    rounded(body,side*.78,1.07,-2.91,.66,.17,.11,.05,rubber);
    for(let n=0;n<3;n++){
      const x=side*(.58+n*.19);
      const ring=new T.Mesh(new T.TorusGeometry(.049,.008,10,24),alloy);ring.position.set(x,1.07,-2.972);body.add(ring);
      lens(body,x,1.07,-2.976,.037,.036,.023,led);
      lens(body,x,1.07,-2.990,.049,.048,.019,optics);
    }
    rounded(body,side*.78,1.07,-2.997,.65,.165,.035,.017,optics);
    line(body,[[side*.46,1.18,-2.88],[side*.83,1.20,-2.82],[side*1.17,1.22,-2.64]],.019,led);
    line(body,[[side*.52,1.15,-2.68],[side*.68,1.31,-2.08],[side*.81,1.405,-1.54]],.008,rubber);
    line(body,[[side*.30,1.425,-1.5],[side*.7,1.48,-1.44],[side*.98,1.50,-1.39]],.015,rubber);
    rounded(body,side*.75,1.17,2.923,.70,.13,.09,.045,rubber);
    line(body,[[side*.43,1.17,2.974],[side*.82,1.18,2.974],[side*1.08,1.21,2.895]],.024,brake);
    rounded(body,side*.70,.76,2.94,.27,.07,.035,.016,reverse);
    for(const axle of [-1.75,1.75]){
      const points=[];for(let n=0;n<=32;n++){const a=n*Math.PI/32,z= axle+Math.cos(a)*.635;points.push([side*(bodyWidth(z)-.101+.085*Math.sin(a)),.52+Math.sin(a)*.635,z]);}
      line(body,points,.019,graphite);
    }
  }
  line(body,[[-1.1,1.44,-1.51],[0,1.435,-1.56],[1.1,1.44,-1.51]],.018,rubber);
  line(body,[[-.94,2.05,-.72],[0,2.115,-.72],[.94,2.05,-.72]],.022,roof);
  line(body,[[-.94,2.05,.73],[0,2.115,.73],[.94,2.05,.73]],.022,roof);
  line(body,[[-1.1,1.435,1.65],[0,1.435,1.69],[1.1,1.435,1.65]],.013,rubber);
  line(body,[[-1.08,1.29,2.56],[0,1.32,2.62],[1.08,1.29,2.56]],.01,rubber);
  line(body,[[-.44,1.17,2.98],[0,1.17,2.99],[.44,1.17,2.98]],.014,brake);
  for(let n=-2;n<=2;n++)box(body,n*.29,.43,2.77,.035,.18,.38,graphite);
  // Upholstered cabin. Its floor lies below the glazing so seats are fully visible.
  rounded(body,0,1.13,.05,2.12,.14,2.68,.055,leather);
  rounded(body,0,1.40,-1.15,2.05,.20,.45,.09,leather);
  for(const side of [-1,1]){
    for(const z of [-.32,.82]){
      rounded(body,side*.55,1.245,z,.72,.18,.66,.08,leather);
      rounded(body,side*.55,1.32,z-.02,.48,.045,.47,.02,fabric);
      const back=rounded(body,side*.55,1.54,z+.26,.68,.52,.17,.075,leather);back.rotation.x=-.17;
      const insert=rounded(body,side*.55,1.54,z+.162,.43,.36,.025,.012,fabric);insert.rotation.x=-.17;
      rounded(body,side*.55,1.855,z+.31,.36,.20,.15,.065,leather);
      for(const edge of [-1,1]){
        line(body,[[side*.55+edge*.12,1.78,z+.29],[side*.55+edge*.12,1.87,z+.31]],.012,alloy);
        line(body,[[side*.55+edge*.25,1.342,z-.24],[side*.55+edge*.25,1.342,z+.19],[side*.55+edge*.25,1.73,z+.13]],.004,stitch);
      }
    }
    rounded(body,side*1.04,1.35,.05,.1,.22,1.68,.04,leather);
    rounded(body,side*.97,1.42,-.2,.10,.055,.29,.024,alloy);
    for(let n=0;n<5;n++)box(body,side*.81+n*.032,1.43,-.915,.018,.06,.02,graphite);
  }
  rounded(body,0,1.28,-.15,.25,.20,.87,.08,leather);
  rounded(body,0,1.42,-.43,.08,.08,.13,.03,alloy);
  for(const z of [-.14,.07]){const cup=new T.Mesh(new T.TorusGeometry(.06,.01,8,24),rubber);cup.rotation.x=Math.PI/2;cup.position.set(0,1.39,z);body.add(cup);}
  const steering=new T.Group();steering.position.set(-.55,1.52,-.78);steering.rotation.x=-.2;body.add(steering);
  steering.add(new T.Mesh(new T.TorusGeometry(.19,.023,12,40),rubber));rounded(steering,0,0,0,.15,.10,.05,.02,leather);
  for(const side of [-1,1])line(steering,[[side*.065,-.01,0],[side*.17,.04,0]],.012,alloy);
  line(steering,[[0,-.04,0],[0,-.17,0]],.017,graphite);
  const dashboard=makeTexture((c,w,h)=>{c.fillStyle='#0b1820';c.fillRect(0,0,w,h);c.fillStyle='#88d8d8';c.font='bold 42px Segoe UI';c.fillText('ТБС',24,61);c.font='20px Segoe UI';c.fillText('063 / READY',130,58);c.fillStyle='#ff641a';c.fillRect(24,86,204,4);},256,128);
  const screen=new T.Mesh(new T.PlaneGeometry(.62,.31),new T.MeshBasicMaterial({map:dashboard,toneMapped:false}));screen.position.set(0,1.53,-.914);screen.rotation.x=-.09;body.add(screen);
  rounded(body,0,1.95,-.84,.32,.11,.09,.04,graphite);box(body,0,1.95,-.79,.27,.075,.008,alloy);
  // Branded livery and plates are separate, undistorted decals.
  const label=makeTexture((c,w,h)=>{c.fillStyle='#eff4ed';c.font='bold 42px Segoe UI';c.textAlign='center';c.fillText('ТРАНСПОРТ БУДУЩЕГО',w/2,52);c.fillStyle='#ff681f';c.font='bold 30px Segoe UI';c.fillText('САМАРА · 063',w/2,99);},640,128);
  const plateMap=makeTexture((c,w,h)=>{c.fillStyle='#e8e9df';c.fillRect(0,0,w,h);c.fillStyle='#182729';c.font='bold 44px Segoe UI';c.textAlign='center';c.fillText('ТБС 063',w/2,56);},256,80);
  function decal(texture,w,h,y,z,side){
    const positions=[],uv=[],indices=[],nx=20,ny=4;
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const py=y+(j/ny-.5)*h,pz=z+(.5-i/nx)*w*side;
      positions.push(side*(skinX(py,pz)+.008),py,pz);uv.push(i/nx,j/ny);
      if(i<nx&&j<ny){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    body.add(new T.Mesh(geometry,new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false})));
  }
  for(const side of [-1,1]){
    decal(logo,.36,.36,1.06,-.48,side);
    decal(label,.99,.198,1.07,.46,side);
    rounded(body,0,.79,side*2.947,.82,.28,.05,.022,graphite);
    const plate=new T.Mesh(new T.PlaneGeometry(.72,.225),new T.MeshBasicMaterial({map:plateMap,toneMapped:false}));plate.rotation.y=side<0?Math.PI:0;plate.position.set(0,.79,side*2.981);body.add(plate);
  }
  const roofMark=new T.Mesh(new T.PlaneGeometry(1.02,1.02),new T.MeshBasicMaterial({map:logo,transparent:true,depthWrite:false,toneMapped:false}));roofMark.rotation.x=-Math.PI/2;roofMark.position.set(0,2.16,0);body.add(roofMark);
  // Four independent wheel assemblies: tire, rim barrel, swept spokes and brakes.
  const wheels=[];
  const tireProfile=[[.345,-.175],[.45,-.18],[.505,-.13],[.52,-.08],[.52,.08],[.505,.13],[.45,.18],[.345,.175]].map(([r,y])=>new T.Vector2(r,y));
  const tireGeometry=new T.LatheGeometry(tireProfile,64),treadGeometry=new T.BoxGeometry(.13,.013,.032);
  for(const side of [-1,1])for(const z of [-1.75,1.75]){
    const steering=new T.Group(),rolling=new T.Group();steering.name=(z<0?'front':'rear')+(side<0?'-left':'-right');steering.position.set(side*1.38,.52,z);car.add(steering);steering.add(rolling);wheels.push({steering,rolling,front:z<0});
    const tire=new T.Mesh(tireGeometry,rubber);tire.rotation.z=Math.PI/2;tire.castShadow=true;rolling.add(tire);
    const barrel=new T.Mesh(new T.CylinderGeometry(.36,.36,.29,48,1,true),graphite);barrel.rotation.z=Math.PI/2;rolling.add(barrel);
    const rotor=new T.Mesh(new T.CylinderGeometry(.31,.31,.025,48),rotorSteel);rotor.rotation.z=Math.PI/2;rotor.position.x=side*.12;rolling.add(rotor);
    rounded(steering,side*.16,.09,.25,.10,.24,.12,.045,orange);
    const rim=new T.Mesh(new T.TorusGeometry(.362,.017,10,64),alloy);rim.rotation.y=Math.PI/2;rim.position.x=side*.188;rolling.add(rim);
    for(let n=0;n<10;n++){
      const a=n*Math.PI/5,points=[[.11,a-.10],[.34,a+.08],[.34,a+.19],[.12,a+.13]],positions=[];
      for(const [r,t] of points)positions.push(side*.197,Math.cos(t)*r,Math.sin(t)*r);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(side>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]);g.computeVertexNormals();rolling.add(new T.Mesh(g,alloy));
    }
    const cap=new T.Mesh(new T.CylinderGeometry(.105,.105,.045,32),graphite);cap.rotation.z=Math.PI/2;cap.position.x=side*.205;rolling.add(cap);
    for(let n=0;n<5;n++){const a=n*Math.PI*2/5;lens(rolling,side*.232,Math.cos(a)*.071,Math.sin(a)*.071,.014,.014,.014,alloy);}
    const treads=new T.InstancedMesh(treadGeometry,graphite,128),pose=new T.Object3D();
    for(let n=0;n<64;n++)for(let band=0;band<2;band++){const a=n*Math.PI/32;pose.position.set((band-.5)*.17,Math.cos(a)*.518,Math.sin(a)*.518);pose.rotation.set(a,band?.22:-.22,0);pose.updateMatrix();treads.setMatrixAt(n*2+band,pose.matrix);}rolling.add(treads);
    for(const dx of [-.075,.075]){const groove=new T.Mesh(new T.TorusGeometry(.519,.006,4,64),rubber);groove.rotation.y=Math.PI/2;groove.position.x=dx;rolling.add(groove);}
  }
  const shadow=new T.Mesh(new T.PlaneGeometry(4.2,7),new T.MeshBasicMaterial({map:shadowTexture,color:0x020708,transparent:true,opacity:.5,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;car.add(shadow);
  const headlights=[];
  for(const side of [-1,1]){const lamp=new T.SpotLight(0xd7edff,2.6,28,.43,.6,1.3);lamp.position.set(side*.8,1.1,-2.92);lamp.target.position.set(side*1.5,.05,-17);body.add(lamp,lamp.target);headlights.push(lamp);}
  // Batch repeated cabin fittings without merging articulated parts.
  const batches=new Map();for(const m of [...body.children])if(m.isMesh&&m.geometry===boxGeometry){const list=batches.get(m.material)||[];list.push(m);batches.set(m.material,list);}
  for(const [material,list] of batches)if(list.length>2){const batch=new T.InstancedMesh(boxGeometry,material,list.length);list.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);body.remove(m);});batch.castShadow=true;batch.receiveShadow=true;body.add(batch);}
  Object.assign(car.userData,{paint,body,wheels,wheelRadius:.52,headlights,brakeMaterial:brake,reverseMaterial:reverse,steeringWheel:steering,variant:'fastback',detailedBody:true});
  scene.add(car);return car;
};
