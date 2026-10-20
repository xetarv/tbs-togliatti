const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const dir=__dirname,p=path.join(dir,'manifest.json'),m=JSON.parse(fs.readFileSync(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const a of m.archives){const b=fs.readFileSync(path.join(dir,a.name));if(b.length>=95*1024*1024)throw Error('Archive too large for ordinary GitHub blob');a.bytes=b.length;a.sha256=sha(b);}
fs.writeFileSync(p,JSON.stringify(m,null,2));
const names=fs.readdirSync(dir).filter(n=>n!=='SHA256SUMS.txt'&&fs.statSync(path.join(dir,n)).isFile());
fs.writeFileSync(path.join(dir,'SHA256SUMS.txt'),names.sort().map(n=>sha(fs.readFileSync(path.join(dir,n)))+'  '+n).join('\n')+'\n',{flag:'wx'});
console.log(JSON.stringify({archives:m.archives.length,compressedMB:Math.round(m.archives.reduce((n,a)=>n+a.bytes,0)/1048576),files:m.files.length}));
