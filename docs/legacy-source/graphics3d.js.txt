/* Local graphics pipeline for the bundled Three.js r149. No external assets. */
window.createTBSGraphics=function({T,renderer,scene,camera,sky,car,water,buildings,facades,reflectObjects=[],initialQuality}){
  const presets={low:{ratio:1,shadow:0,ao:0,bloom:0,reflection:0,distance:85},medium:{ratio:1.3,shadow:1024,ao:.35,bloom:.09,reflection:0,distance:110},high:{ratio:1.75,shadow:2048,ao:.55,bloom:.15,reflection:1,distance:135}};
  let quality=initialQuality,settings=presets[quality],clock=0,cubeDue=-10,waterDue=-10;
  renderer.info.autoReset=false;
  const depthSupported=renderer.capabilities.isWebGL2||renderer.extensions.has('WEBGL_depth_texture');
  const sceneTarget=new T.WebGLRenderTarget(1,1,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  sceneTarget.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const uniforms={image:{value:sceneTarget.texture},depth:{value:sceneTarget.depthTexture},pixel:{value:new T.Vector2(1,1)},inverseProjection:{value:camera.projectionMatrixInverse},ao:{value:0},glow:{value:0}};
  const postMaterial=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,extensions:{derivatives:true},uniforms,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D image;uniform sampler2D depth;uniform vec2 pixel;uniform mat4 inverseProjection;uniform float ao;uniform float glow;
      vec3 viewPosition(vec2 uv){float d=texture2D(depth,uv).x;vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
      vec3 antialiased(vec2 uv){
        vec3 middle=texture2D(image,uv).rgb,nw=texture2D(image,uv+vec2(-1.,-1.)*pixel).rgb,ne=texture2D(image,uv+vec2(1.,-1.)*pixel).rgb,sw=texture2D(image,uv+vec2(-1.,1.)*pixel).rgb,se=texture2D(image,uv+pixel).rgb;
        vec3 luma=vec3(.299,.587,.114);float m=dot(middle,luma),a=dot(nw,luma),b=dot(ne,luma),c=dot(sw,luma),d=dot(se,luma),lo=min(m,min(min(a,b),min(c,d))),hi=max(m,max(max(a,b),max(c,d)));
        if(hi-lo<max(.025,hi*.125))return middle;
        vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));float reduce=max((a+b+c+d)*.03125,.0078125);direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-6.),vec2(6.))*pixel;
        vec3 small=.5*(texture2D(image,uv-direction/6.).rgb+texture2D(image,uv+direction/6.).rgb);
        vec3 wide=small*.5+.25*(texture2D(image,uv-direction*.5).rgb+texture2D(image,uv+direction*.5).rgb);float l=dot(wide,luma);return l<lo||l>hi?small:wide;
      }
      void main(){
        vec3 color=antialiased(vUv);float d=texture2D(depth,vUv).x;float obstruction=0.;
        if(d<.99995&&ao>0.){
          vec3 p=viewPosition(vUv);vec3 normal=normalize(cross(dFdx(p),dFdy(p)));float radius=clamp(110./max(-p.z,1.),2.,15.);
          for(int i=0;i<8;i++){float a=float(i)*2.399963;vec2 offset=vec2(cos(a),sin(a))*pixel*radius*(.45+.55*float(i+1)/8.);vec3 delta=viewPosition(clamp(vUv+offset,pixel,1.-pixel))-p;float distance=length(delta);
            obstruction+=max(0.,dot(normal,delta/max(distance,.001))-.12)*(1.-smoothstep(.15,2.2,distance));}
          color*=1.-min(.3,obstruction*ao/4.);
        }
        if(glow>0.){
          vec3 bloom=vec3(0.);
          for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 offset=vec2(cos(a),sin(a))*pixel*4.;vec3 sampleColor=texture2D(image,clamp(vUv+offset,vec2(0.),vec2(1.))).rgb;bloom+=sampleColor*smoothstep(.72,1.,max(max(sampleColor.r,sampleColor.g),sampleColor.b));}
          color+=bloom*(glow/8.);
        }
        gl_FragColor=vec4(color,1.);
        #include <encodings_fragment>
      }`});
  postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),postMaterial));

  // A small reflection scene reproduces nearby building volumes and facades.
  const reflectionScene=new T.Scene();reflectionScene.environment=scene.environment;
  const reflectionSky=sky.clone();reflectionScene.add(reflectionSky);
  const ambient=new T.HemisphereLight(0xc4d8ef,0x596459,2);reflectionScene.add(ambient);
  const reflectionSun=new T.DirectionalLight(0xffdfbe,2);reflectionSun.position.set(-35,62,40);reflectionScene.add(reflectionSun);
  const proxies=[],proxyGeometry=new T.BoxGeometry(1,1,1),proxyMaterials=new Map();
  const reflectionObjects=reflectObjects.map(source=>{const mesh=source.clone(true);reflectionScene.add(mesh);return {source,mesh};});
  for(const b of buildings){
    const key=b.color+':'+b.seed%facades.length;
    if(!proxyMaterials.has(key))proxyMaterials.set(key,new T.MeshStandardMaterial({color:b.color,map:facades[b.seed%facades.length],roughness:.65}));
    const proxy=new T.Mesh(proxyGeometry,proxyMaterials.get(key));proxy.position.set(b.x,b.h/2,b.z);proxy.scale.set(b.w,b.h,b.d);reflectionScene.add(proxy);proxies.push(proxy);
  }
  const cubeTarget=new T.WebGLCubeRenderTarget(128,{generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
  const cubeCamera=new T.CubeCamera(.3,120,cubeTarget);
  const quarter=scene.userData.quarterLighting;
  const quarterTarget=quarter?new T.WebGLCubeRenderTarget(128,{generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter}):null;
  const quarterCamera=quarter?new T.CubeCamera(.3,120,quarterTarget):null;
  let quarterDaylight=-1,quarterDue=-10;
  const waterTarget=new T.WebGLRenderTarget(512,256,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  const mirrorCamera=new T.PerspectiveCamera(),mirrorDirection=new T.Vector3(),reflectionMatrix=new T.Matrix4();
  let cubeReady=false,waterReady=false;
  const originalCompile=water.onBeforeCompile;
  water.onBeforeCompile=shader=>{
    originalCompile(shader);
    shader.uniforms.waterReflection={value:waterTarget.texture};shader.uniforms.waterReflectionMatrix={value:reflectionMatrix};shader.uniforms.reflectionStrength={value:0};
    shader.vertexShader='uniform mat4 waterReflectionMatrix;varying vec4 vWaterReflection;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','vWaterReflection=waterReflectionMatrix*modelMatrix*vec4(transformed,1.0);\n#include <project_vertex>');
    shader.fragmentShader='uniform sampler2D waterReflection;uniform float reflectionStrength;varying vec4 vWaterReflection;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',`
      vec2 reflectionUv=vWaterReflection.xy/max(vWaterReflection.w,.001)*.5+.5;
      reflectionUv+=normal.xy*.009;
      float inFrame=step(0.,reflectionUv.x)*step(reflectionUv.x,1.)*step(0.,reflectionUv.y)*step(reflectionUv.y,1.)*step(0.,vWaterReflection.w);
      vec3 reflected=texture2D(waterReflection,clamp(reflectionUv,vec2(.001),vec2(.999))).rgb*vec3(.6,.8,.92);
      float fresnel=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.);
      outgoingLight=mix(outgoingLight,reflected,inFrame*reflectionStrength*(.1+.38*fresnel));
      #include <output_fragment>`);
  };
  water.needsUpdate=true;
  function resize(){
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,settings.ratio));renderer.setSize(innerWidth,innerHeight,false);
    const size=renderer.getDrawingBufferSize(new T.Vector2());sceneTarget.setSize(quality==='low'?1:size.x,quality==='low'?1:size.y);uniforms.pixel.value.set(1/size.x,1/size.y);
    waterTarget.setSize(Math.min(768,Math.max(256,Math.round(innerWidth*.5))),Math.min(512,Math.max(128,Math.round(innerHeight*.5))));
    waterReady=false;waterDue=-10;
  }
  function setQuality(value){
    quality=presets[value]?value:'medium';settings=presets[quality];
    renderer.shadowMap.enabled=settings.shadow>0;
    scene.traverse(o=>{if(o.isDirectionalLight&&o.castShadow){o.shadow.mapSize.set(settings.shadow||512,settings.shadow||512);if(o.shadow.map){o.shadow.map.dispose();o.shadow.map=null;}o.shadow.needsUpdate=true;}});
    if(!settings.reflection){car.userData.paint.envMap=null;car.userData.paint.needsUpdate=true;}
    if(quarter)for(const material of quarter.reflective){material.envMap=settings.reflection&&quarterDaylight>=0?quarterTarget.texture:null;material.needsUpdate=true;}
    cubeDue=-10;waterDue=-10;resize();
    try{localStorage.setItem('tbs.graphicsQuality',quality);}catch{}
    return quality;
  }
  function updateReflections(dt,daylight){
    clock+=dt;
    if(!settings.reflection){if(water.userData.shader)water.userData.shader.uniforms.reflectionStrength.value=0;return;}
    const refreshCube=clock-cubeDue>.85,refreshWater=camera.position.z<90&&clock-waterDue>.12;
    const refreshQuarter=quarter&&Math.hypot(camera.position.x-quarter.x,camera.position.z-quarter.z)<90&&Math.abs(daylight-quarterDaylight)>.12&&clock-quarterDue>1;
    if(refreshCube||refreshWater||refreshQuarter){
      ambient.intensity=.55+1.45*daylight;reflectionSun.intensity=.1+1.9*daylight;
      for(const {source,mesh} of reflectionObjects){mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.visible=source.position.distanceToSquared(car.position)<120*120;}
      for(const proxy of proxies)proxy.visible=Math.abs(proxy.position.x-car.position.x)<110&&Math.abs(proxy.position.z-car.position.z)<110;
    }
    const previousToneMapping=renderer.toneMapping;
    if(refreshCube||refreshWater||refreshQuarter)renderer.toneMapping=T.NoToneMapping;
    if(refreshQuarter){
      quarterDue=clock;quarterDaylight=daylight;
      for(const proxy of proxies)proxy.visible=Math.abs(proxy.position.x-quarter.x)<110&&Math.abs(proxy.position.z-quarter.z)<110;
      quarterCamera.position.set(quarter.x+12.5,4,quarter.z-5.8);reflectionSky.position.copy(quarterCamera.position);
      quarterCamera.update(renderer,reflectionScene);quarterTarget.texture.needsPMREMUpdate=true;
      for(const material of quarter.reflective){material.envMap=quarterTarget.texture;material.needsUpdate=true;}
      for(const proxy of proxies)proxy.visible=Math.abs(proxy.position.x-car.position.x)<110&&Math.abs(proxy.position.z-car.position.z)<110;
    }
    if(refreshCube){
      cubeDue=clock;cubeCamera.position.copy(car.position);cubeCamera.position.y=2;reflectionSky.position.copy(cubeCamera.position);
      cubeCamera.update(renderer,reflectionScene);cubeTarget.texture.needsPMREMUpdate=true;
      if(!cubeReady){car.userData.paint.envMap=cubeTarget.texture;car.userData.paint.needsUpdate=true;cubeReady=true;}
      // Switching back from a cheaper preset restores the same reusable target.
      if(car.userData.paint.envMap!==cubeTarget.texture){car.userData.paint.envMap=cubeTarget.texture;car.userData.paint.needsUpdate=true;}
    }
    if(refreshWater){
      waterDue=clock;mirrorCamera.copy(camera);mirrorCamera.position.y=.04-camera.position.y;mirrorCamera.up.set(0,-1,0);
      camera.getWorldDirection(mirrorDirection);mirrorDirection.y=-mirrorDirection.y;mirrorCamera.lookAt(mirrorDirection.add(mirrorCamera.position));mirrorCamera.updateMatrixWorld();
      reflectionMatrix.multiplyMatrices(mirrorCamera.projectionMatrix,mirrorCamera.matrixWorldInverse);reflectionSky.position.copy(mirrorCamera.position);
      renderer.setRenderTarget(waterTarget);renderer.render(reflectionScene,mirrorCamera);renderer.setRenderTarget(null);waterReady=true;
    }
    if(water.userData.shader)water.userData.shader.uniforms.reflectionStrength.value=waterReady&&camera.position.z<90?1:0;
    renderer.toneMapping=previousToneMapping;
  }
  function render(dt,daylight){
    renderer.info.reset();
    updateReflections(dt,daylight);
    if(quality==='low'||!depthSupported){renderer.setRenderTarget(null);renderer.render(scene,camera);return;}
    uniforms.ao.value=settings.ao;uniforms.glow.value=settings.bloom*(1-daylight);uniforms.inverseProjection.value=camera.projectionMatrixInverse;
    renderer.setRenderTarget(sceneTarget);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
  }
  setQuality(quality);
  return {render,resize,setQuality,get quality(){return quality;},get distance(){return settings.distance;},get depthSupported(){return depthSupported;}};
};
