const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(process.argv[2]),target=__dirname,worktree=path.resolve(target,'../../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),records=[],omitted=[],excludedDirectories=[];
const oldBase='docs/diagnostics/r149-async-principle-20261019';
const oldManifest=JSON.parse(fs.readFileSync(path.join(source,oldBase,'archive-manifest.json'),'utf8').replace(/^\uFEFF/,''));
const oldPaths=new Set(oldManifest.map(r=>r.path));
const traceKeep=new Set([
 ...['A','B','C'].flatMap(v=>['fresh','warm'].map(p=>`artifacts/r149-async-abc-timing-20261020/abc-1-${v}-${p}.trace.json.gz`)),
 ...['final-1-A-fresh','final-1-B-fresh','final-1-Safe-fresh','final-2-Safe-fresh','final-1-Safe-warm','final-2-Safe-warm'].map(n=>`artifacts/r149-diagnostic-timing-20261020/${n}.trace.json.gz`)
]);
const rgbaKeep=p=>p.startsWith('artifacts/r149-minimal-cancel-20261020/')||/^artifacts\/r149-async-rng-20261020\/visual-1-A[12]-moving\.rgba$/.test(p);
function add(relative,destination=relative){
 const absolute=path.join(source,relative),data=fs.readFileSync(absolute);
 if(/\.(cjs|js|html|md|txt|json|csv)$/.test(relative)&&data.length<10*1024*1024&&/(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|AIza[0-9A-Za-z_-]{30,}|Bearer [A-Za-z0-9._-]{30,})/.test(data.toString('utf8')))throw Error('Potential credential; inspect before publication: '+relative);
 records.push({source:absolute,path:destination,bytes:data.length,sha256:sha(data),purpose:destination.includes('/shaderChecks/')?'Exact historical local shaderChecks bytes':'Experimental source/evidence; '+relative.split('/')[1]});
}
function walk(relative){
 for(const e of fs.readdirSync(path.join(source,relative),{withFileTypes:true})){
  const p=relative+'/'+e.name;
  if(e.isDirectory()){if(/profile|cache|node_modules|\.git$|^tmp/i.test(e.name)){excludedDirectories.push(p);continue;}walk(p);continue;}
  if(!e.isFile())throw Error('Unexpected non-file '+p);
  let why;
  if(oldPaths.has(p))why='Already published in base commit archives';
  else if(p.endsWith('.rgba')&&!rgbaKeep(p))why='Duplicate lossless PNG retained; raw RGBA omitted';
  else if(p.endsWith('.trace.json.gz')&&!traceKeep.has(p))why='Redundant full trace omitted; individual raw JSON retained';
  else if(/-frame-\d+\.png$/.test(p)&&!p.startsWith('artifacts/r149-diagnostic-timing-20261020/')&&!p.startsWith('artifacts/r149-async-abc-timing-20261020/abc-1-'))why='Redundant performance screenshot; raw event/optical metadata retained';
  else if(/\.(zip|log)$/.test(p))why='Nested archive/transient log; source reports retained';
  if(why)omitted.push({path:p,reason:why,bytes:fs.statSync(path.join(source,p)).size});else add(p);
 }
}
for(const d of fs.readdirSync(path.join(source,'artifacts'),{withFileTypes:true}))if(d.isDirectory()&&/^r149-.*20261020$/.test(d.name))walk('artifacts/'+d.name);
const shaderFiles=['src/adapters/rendering/scene.ts','dist/adapters/rendering/scene.js','types/rendering-contracts.d.ts','tests/shader-checks.test.cjs'];
for(const p of shaderFiles)add(p,'artifacts/r149-handoff-inputs-20261020/shaderChecks/'+p);
let number=1,bytes=0;const archives=[];
for(const r of records){if(bytes&&bytes+r.bytes>60*1024*1024){number++;bytes=0;}r.archive=`today-part-${String(number).padStart(2,'0')}.zip`;bytes+=r.bytes;}
for(const name of [...new Set(records.map(r=>r.archive))])archives.push({name,entries:records.filter(r=>r.archive===name).length,uncompressedBytes:records.filter(r=>r.archive===name).reduce((n,r)=>n+r.bytes,0)});
const publishedArchives=[...new Set(oldManifest.map(r=>r.archive))].map(n=>{const p=oldBase+'/'+n,b=fs.readFileSync(path.join(source,p));return{path:p,commit:'5cbd6f741415bf10d44b2a6088b9bc26e1916d50',bytes:b.length,sha256:sha(b)};});
const manifest={format:1,baseCommit:'5cbd6f741415bf10d44b2a6088b9bc26e1916d50',branch:'checkpoint/r149-async-safe-20261020',created:new Date().toISOString(),archivePathBase:'repository root',archives,publishedArchives,files:records.map(({source,...r})=>r),excludedDirectories,omitted,shaderChecks:shaderFiles,variants:{A:'index.html',B:'artifacts/r149-async-principle-20261019/index-B.html',Bplus:'artifacts/r149-async-rng-20261020/index-P.html',Bplusplus:'artifacts/r149-context-boundary-20261020/index-before.html',SafeBefore:'artifacts/r149-context-boundary-20261020/index-safe.html',SafeLinkStatus:'artifacts/r149-minimal-cancel-20261020/index-fixed.html'},notes:['No browser profiles, accounts, cookies, environment secrets or node_modules.','Historical paths in exact original source/evidence are provenance only; prepare-portable.cjs rebases new executable copies.','Old five ZIPs are referenced from the already published base commit, not duplicated.','Selected historical RGBA and all latest correction RGBA retained; other duplicate RGBA can be reconstructed from retained PNG.']};
fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
fs.mkdirSync(path.join(worktree,'artifacts'),{recursive:true});fs.writeFileSync(path.join(worktree,'artifacts/handoff-pack-plan.json'),JSON.stringify(records),{flag:'wx'});
console.log(JSON.stringify({files:records.length,archives:archives.length,uncompressedMB:Math.round(records.reduce((n,r)=>n+r.bytes,0)/1048576),excludedProfileDirectories:excludedDirectories.length,omitted:omitted.length}));
