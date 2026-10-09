'use strict';

window.TBS.createScene = function ({ canvas, T }) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });

  const lowPower = matchMedia('(pointer:coarse)').matches || innerWidth < 700;

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.15 : 1.75));

  renderer.setSize(innerWidth, innerHeight, false);

  renderer.outputEncoding = T.sRGBEncoding;

  renderer.physicallyCorrectLights = true;

  renderer.toneMapping = T.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.1;

  renderer.shadowMap.enabled = !lowPower;

  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();

  scene.background = new T.Color(0x091827);

  scene.fog = new T.FogExp2(0x91abb9, 0.0022);

  const camera = new T.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 550);

  camera.position.set(84, 12, 30);

  const ambientLight = new T.HemisphereLight(0xd7eaff, 0x788078, 1.9);

  scene.add(ambientLight);

  const sun = new T.DirectionalLight(0xffd4a6, 2.2);

  sun.position.set(-35, 62, 40);

  sun.castShadow = true;

  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);

  sun.shadow.normalBias = 0.035;

  sun.shadow.camera.left = -52;

  sun.shadow.camera.right = 52;

  sun.shadow.camera.top = 52;

  sun.shadow.camera.bottom = -52;

  sun.shadow.camera.near = 1;

  sun.shadow.camera.far = 150;

  sun.shadow.bias = -0.0004;

  scene.add(sun);

  scene.add(sun.target);

  const blueLight = new T.DirectionalLight(0x43c9e6, 0.24);

  blueLight.position.set(70, 32, -50);

  scene.add(blueLight);

  const sky = new T.Mesh(
    new T.SphereGeometry(430, 32, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { skyTime: { value: 0 }, daylight: { value: 1 } },
      vertexShader:
        'varying vec3 vDir; void main(){vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `
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
      }`,
    }),
  );

  scene.add(sky);

  const duskSun = new T.Mesh(
    new T.SphereGeometry(8, 20, 12),
    new T.MeshBasicMaterial({ color: 0xffa676, fog: false, depthWrite: false }),
  );

  duskSun.position.set(-160, 283, 183);

  scene.add(duskSun);

  const environmentScene = new T.Scene();

  environmentScene.add(sky.clone());

  const pmrem = new T.PMREMGenerator(renderer);

  const environmentMap = pmrem.fromScene(environmentScene, 0.05, 0.1, 500);

  scene.environment = environmentMap.texture;

  pmrem.dispose();
  return { renderer, scene, lowPower, camera, ambientLight, sun, blueLight, sky, duskSun };
};
