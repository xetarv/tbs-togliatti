# Audio adapters TypeScript migration

Stage 20 migrates only `ambience.ts` followed by `sound.ts`. Ambience passed the strict build
before sound migration. The existing build emits classic scripts in `dist/adapters/audio/`.
Only their two script paths change in `index.html`, retaining the original order.
There are now 26 production TypeScript modules, plus the technical build-smoke fixture.

## Real contracts

Both adapters use native Web Audio types: AudioContext, AudioNode, AudioBuffer, GainNode,
OscillatorNode, AudioBufferSourceNode, BiquadFilterNode, StereoPannerNode and AudioParam.
Node creation infers their exact types; filter type and numeric parameters are checked.
Ambience uses PlayerState and readonly TrafficVehicle inputs. Voice assignments explicitly
allow null. The nearest-array type permits nullable membership queries without changing
traffic data, sorting, selection of four cars or voice retention. It adds no cast or runtime guard.

AmbiencePort now describes all actual outputs: update, levels, voiceCount and spatial.
SoundGraph describes the existing context/master/motor/motorGain/tires/buffer/ambient object.
SoundPort retains the bootstrap audio API with its more precise nullable sound getter.
SoundOptions reuses PresentationState, PlayerState, TrafficVehicle and the DOM getter;
braking retains boolean/undefined semantics. Window's optional webkitAudioContext constructor
preserves the existing fallback. Remaining JS adapter bodies are not checked internally.

## Focused equivalence

Both emitted executable ASTs match the originals. Test-only seeded randomness and controlled
AudioContext time produce identical noise-buffer bytes and ordered node creation, connection,
start/stop/disconnect and AudioParam traces. Production Math.random and clocks are untouched.

Five scenarios cover normal initialization/reuse, WebKit fallback, unavailable Web Audio,
constructor failure and rejected resume. A synchronous resume error and subsequent recreation
are also covered. Assertions check nearest four cars, the selection interval, retained voice
assignments, empty traffic, spatial cutoff/pan, braking, mute/pause, collision cooldown,
impact envelopes and onended cleanup. Original files, fixtures and detailed results are saved
outside the repository in the local `tbs-audio-stage20-20261013` verification folder.

## Validation and limits

Run `npm run build`, `npm run check`, `npm run build` and the existing Edge
`npm run test:browser` through `file://`. The existing 49 tests are unchanged.
The smoke exercises game startup, driving, pause/resume and sound button states while checking
browser errors. This is not a listening test or proof of physical audio output; deterministic
audio-graph comparisons establish unchanged synthesized parameters and noise samples.

A separate short native Edge check confirms a running AudioContext, real nodes and buffer,
mute/unmute, braking, pause attenuation, collision and source cleanup without page errors.
It waits for scheduled AudioParam automation before comparing volume values; immediate reads
do not represent the target passed to setTargetAtTime. No audio-device listening check is claimed.

No sound settings, gameplay, graphics, dependencies, other adapters or security settings change.
Previous changes, originals and diagnostic screenshots are preserved. No commit or push is made.
