'use strict';

window.TBS.createSound = function ({ player, state, traffic, getElement, createAmbience }) {
  let sound = null,
    soundMuted = false;

  function beginSound() {
    try {
      if (!sound) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const context = new AudioContext(),
          master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        const motor = context.createOscillator(),
          motorGain = context.createGain();
        motor.type = 'sine';
        motorGain.gain.value = 0.035;
        motor.connect(motorGain).connect(master);
        motor.start();
        const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate),
          samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const noise = context.createBufferSource(),
          filter = context.createBiquadFilter(),
          tires = context.createGain();
        noise.buffer = buffer;
        noise.loop = true;
        filter.type = 'lowpass';
        filter.frequency.value = 750;
        tires.gain.value = 0;
        noise.connect(filter).connect(tires).connect(master);
        noise.start();
        const ambient = createAmbience(context, master);
        sound = { context, master, motor, motorGain, tires, buffer, ambient };
      }
      sound.context.resume().catch(() => {});
    } catch {
      sound = null;
    }
  }

  function updateSound(braking) {
    if (!sound) return;
    const t = sound.context.currentTime,
      speed = Math.abs(player.speed);
    sound.master.gain.setTargetAtTime(state.mode === 'playing' && !soundMuted ? 0.65 : 0, t, 0.035);
    sound.motor.frequency.setTargetAtTime(65 + speed * 13, t, 0.08);
    sound.motorGain.gain.setTargetAtTime(0.012 + Math.min(speed / 22, 1) * 0.05, t, 0.06);
    sound.tires.gain.setTargetAtTime((speed / 22) * (braking ? 0.075 : 0.018), t, 0.04);
    sound.ambient.update(player, traffic, state.elapsed);
  }

  function impact(speed) {
    if (state.impactCooldown > 0 || speed < 1) return;
    state.impactCooldown = 0.3;
    state.impactAmount = Math.min(speed / 22, 1);
    if (!sound || soundMuted || state.mode !== 'playing') return;
    const t = sound.context.currentTime,
      source = sound.context.createBufferSource(),
      gain = sound.context.createGain(),
      filter = sound.context.createBiquadFilter();
    source.buffer = sound.buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    gain.gain.setValueAtTime(0.05 + state.impactAmount * 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    source.connect(filter).connect(gain).connect(sound.master);
    source.start(t);
    source.stop(t + 0.18);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  function toggleSound() {
    soundMuted = !soundMuted;
    beginSound();
    updateSound(false);
    getElement('soundBtn').textContent = soundMuted ? '♪×' : '♪';
    getElement('soundBtn').setAttribute('aria-pressed', String(soundMuted));
  }

  getElement('soundBtn').addEventListener('click', toggleSound);
  function advance(dt) {
    state.impactCooldown = Math.max(0, state.impactCooldown - dt);
  }

  return {
    advance,
    beginSound,
    updateSound,
    toggleSound,
    impact,
    get sound() {
      return sound;
    },
  };
};
