// Rebase NEW executable copies only. Original extracted source/evidence remains byte-identical.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');const dir=__dirname,root=path.resolve(dir,'../../..'),m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
const oldRoot=['C:','Users','s.nikushkin','Documents','tbs-togliatti'].join('\\');
const files=[...new Set(m.files.map(f=>f.path))];
const oldManifest=JSON.parse(fs.readFileSync(path.join(root,'docs/diagnostics/r149-async-principle-20261019/archive-manifest.json'),'utf8').replace(/^\uFEFF/,''));files.push(...oldManifest.map(r=>r.path));
const codeFiles=[...new Set(files)].filter(p=>/\.(?:html|js|cjs)$/.test(p)&&!p.includes('/saved-local-changes/')&&!p.includes('/shaderChecks/'));
const portable=p=>p.replace(/\.(html|js|cjs)$/,'.portable.$1'),htmlNames=[...new Set(codeFiles.filter(p=>p.endsWith('.html')).map(p=>path.basename(p)))];
function rebase(s){
 const pairs=[[pathToFileURL(oldRoot.replaceAll('\\','/')+'/').href,pathToFileURL(root+'/').href],[JSON.stringify(oldRoot).slice(1,-1),JSON.stringify(root).slice(1,-1)],[oldRoot.replaceAll('\\','/'),root.replaceAll('\\','/')],[oldRoot,root]];
 for(const [a,b]of pairs)s=s.split(a).join(b);
 // Relocate all known artifact runtime code references, leaving production index/dist unchanged.
 s=s.replace(/(artifacts\/[^\s"'<>\\]+?)\.(html|js)(?=["'<>?\s]|$)/g,(all,p,ext)=>codeFiles.includes(p+'.'+ext)?p+'.portable.'+ext:all);
 s=s.replace(/(artifacts\\\\[^"']+?)\.(html|js)(?=["']|$)/g,(all,p,ext)=>codeFiles.includes(p.replaceAll('\\\\','/')+'.'+ext)?p+'.portable.'+ext:all);
 for(const name of htmlNames)s=s.split("'"+name+"'").join("'"+portable(name)+"'").split('"'+name+'"').join('"'+portable(name)+'"');
 return s;
}
function writeNew(relative,content){const p=path.join(root,relative);if(fs.existsSync(p)){if(fs.readFileSync(p,'utf8')!==content)throw Error('Preserving different existing portable file '+p);return;}fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content,{flag:'wx'});}
for(const p of codeFiles)if(fs.existsSync(path.join(root,p)))writeNew(portable(p),rebase(fs.readFileSync(path.join(root,p),'utf8')));
// Fresh output directories keep every historical JSON/profile untouched.
const fresh='artifacts/r149-home-continuation-20261020',fixedIndex=path.join(root,portable(m.variants.SafeLinkStatus)),originalIndex=path.join(root,portable(m.variants.SafeBefore));
for(const [label,url]of [['fixed',fixedIndex],['original',originalIndex]]){
 let runner=fs.readFileSync(path.join(root,'artifacts/r149-minimal-cancel-20261020/check-fixed.cjs'),'utf8');runner=rebase(runner);
 runner=runner.split(JSON.stringify(fixedIndex).slice(1,-1)).join(JSON.stringify(url).slice(1,-1));
 writeNew(fresh+'/'+label+'/check.cjs',runner);
 writeNew(fresh+'/'+label+'/observe.js',fs.readFileSync(path.join(root,'artifacts/r149-minimal-cancel-20261020/observe.js'),'utf8'));
}
for(const n of ['minimal.html','minimal.js','run-minimal.cjs'])writeNew(fresh+'/minimal/'+n,fs.readFileSync(path.join(root,'artifacts/r149-minimal-cancel-20261020',n),'utf8'));
const paths={A:pathToFileURL(path.join(root,'index.html')).href,SafeLinkStatus:pathToFileURL(fixedIndex).href,SafeBefore:pathToFileURL(originalIndex).href,Bplusplus:pathToFileURL(path.join(root,portable(m.variants.Bplusplus))).href,continuation:path.join(root,fresh)};
writeNew(fresh+'/prepared-paths.json',JSON.stringify(paths,null,2));
// Validate script/base links of the actual last Safe without opening a browser.
for(const [name,relative]of Object.entries(m.variants)){
 const target=path.join(root,name==='A'?relative:portable(relative));
 if(!fs.existsSync(target))throw Error('Missing variant '+name+': '+target);
 const html=fs.readFileSync(target,'utf8'),base=/<base\s+href="([^"]+)"/.exec(html)?.[1]||pathToFileURL(target).href;
 for(const match of html.matchAll(/<script\s+src="([^"]+)"/g)){const u=new URL(match[1],base);if(u.protocol==='file:'&&!fs.existsSync(require('node:url').fileURLToPath(u)))throw Error('Missing script '+name+' '+u.href);}
}
console.log(JSON.stringify(paths,null,2));
