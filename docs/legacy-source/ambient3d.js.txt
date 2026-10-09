/* Procedural ambience: fixed audio-node pool, no downloads or autoplay. */
window.createTBSAmbience=function(context,output){
  const buffer=context.createBuffer(1,context.sampleRate*8,context.sampleRate),samples=buffer.getChannelData(0);
  let smooth=0;for(let i=0;i<samples.length;i++){smooth=.96*smooth+.04*(Math.random()*2-1);samples[i]=smooth*2+(Math.random()*2-1)*.16;}
  function noise(type,frequency,offset){
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),pan=context.createStereoPanner();
    source.buffer=buffer;source.loop=true;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.6;gain.gain.value=0;
    source.connect(filter).connect(gain).connect(pan).connect(output);source.start(0,offset);
    return {source,filter,gain,pan};
  }
  const water=noise('lowpass',900,0),foam=noise('bandpass',1900,2.3),city=noise('lowpass',320,4.7);
  const voices=Array.from({length:4},(_,i)=>{
    const road=noise('lowpass',1100,.9+i*1.5),motor=context.createOscillator(),gain=context.createGain();
    motor.type='sine';motor.frequency.value=80;gain.gain.value=0;motor.connect(gain).connect(road.pan);motor.start();
    return {road,motor,gain,vehicle:null};
  });
  function spatial(player,x,z,radius){
    const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz);
    return {level:d>radius*4?0:1/(1+(d/radius)**2),pan:Math.max(-1,Math.min(1,(dx*Math.cos(player.a)+dz*Math.sin(player.a))/Math.max(d,1)))};
  }
  let lastSelection=-1;
  const levels={water:0,city:0,traffic:0};
  function update(player,traffic,time){
    const now=context.currentTime,shore=spatial(player,player.x,18,26);
    const swell=.7+.2*Math.sin(time*.65)+.1*Math.sin(time*1.17);
    levels.water=shore.level*.075*swell;
    water.gain.gain.setTargetAtTime(levels.water,now,.2);water.pan.pan.setTargetAtTime(shore.pan*.7,now,.15);
    foam.gain.gain.setTargetAtTime(shore.level*.025*(.5+.5*Math.sin(time*.65+.8)**2),now,.25);foam.pan.pan.setTargetAtTime(shore.pan*.8,now,.15);
    const downtown=spatial(player,194,150,105);levels.city=downtown.level*.035;
    city.gain.gain.setTargetAtTime(levels.city,now,.4);city.pan.pan.setTargetAtTime(downtown.pan*.35,now,.3);
    if(now-lastSelection>.2||lastSelection<0){
      lastSelection=now;
      const nearest=traffic.map(vehicle=>({vehicle,d:Math.hypot(vehicle.mesh.position.x-player.x,vehicle.mesh.position.z-player.z)})).sort((a,b)=>a.d-b.d).slice(0,4).map(entry=>entry.vehicle);
      // Retain assignments while cars remain nearby, avoiding audible channel swaps.
      for(const voice of voices)if(!nearest.includes(voice.vehicle))voice.vehicle=null;
      for(const vehicle of nearest)if(!voices.some(voice=>voice.vehicle===vehicle)){const free=voices.find(voice=>!voice.vehicle);if(free)free.vehicle=vehicle;}
    }
    levels.traffic=0;
    for(const voice of voices){
      const vehicle=voice.vehicle;
      const location=vehicle?spatial(player,vehicle.mesh.position.x,vehicle.mesh.position.z,11):{level:0,pan:0};
      const speed=vehicle?Math.abs(vehicle.speed):0,amount=location.level*(.004+Math.min(speed/9,1)*.029);
      voice.road.gain.gain.setTargetAtTime(amount,now,.12);voice.road.filter.frequency.setTargetAtTime(350+speed*90,now,.15);
      voice.road.pan.pan.setTargetAtTime(location.pan,now,.1);voice.gain.gain.setTargetAtTime(location.level*(.004+speed*.0012),now,.12);
      voice.motor.frequency.setTargetAtTime(65+speed*11,now,.15);levels.traffic+=amount;
    }
  }
  return {update,levels,voiceCount:voices.length,spatial};
};
