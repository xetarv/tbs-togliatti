'use strict';
// Classic scripts keep the game usable from file:// without a build step.
// Assignment targets use the existing TbsRegistry declaration; methods are registered later.
globalThis.TBS = Object.create(null);
globalThis.TBS.domain = Object.create(null);
globalThis.TBS.application = Object.create(null);
