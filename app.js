const KEY='gug_inventory_v1';
let items=JSON.parse(localStorage.getItem(KEY)||'[]');
const $=id=>document.getElementById(id);
const fmtEUR=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
function save(){localStorage.setItem(KEY,JSON.stringify(items));render()}
function cats(){return [...new Set(items.map(i=>i.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b))}
function render(){
  $('statProducts').textContent=items.length;
  $('statPieces').textContent=items.reduce((s,i)=>s+(+i.qty||0),0);
  $('statLow').textContent=items.filter(i=>(+i.qty||0)<= (+i.minQty||0) && (+i.minQty||0)>0).length;
  $('statValue').textContent=fmtEUR(items.reduce((s,i)=>s+(+i.qty||0)*(+i.cost||0),0));
  const cf=$('categoryFilter'), old=cf.value; cf.innerHTML='<option value="">Tutte le categorie</option>'+cats().map(c=>`<option>${esc(c)}</option>`).join(''); cf.value=old;
  const q=$('search').value.toLowerCase(), cat=cf.value, sort=$('sortBy').value;
  let data=items.filter(i=>[i.name,i.category,i.location,i.code,i.notes].join(' ').toLowerCase().includes(q)).filter(i=>!cat||i.category===cat);
  data.sort((a,b)=> sort==='qty-asc'?a.qty-b.qty:sort==='qty-desc'?b.qty-a.qty:sort==='low'?((a.qty<=a.minQty?0:1)-(b.qty<=b.minQty?0:1)):a.name.localeCompare(b.name));
  $('empty').style.display=data.length?'none':'block';
  $('list').innerHTML=data.map(card).join('');
}
function card(i){const low=(+i.minQty>0&&+i.qty<=+i.minQty);return `<article class="card">
  <div class="card-top"><div><h3>${esc(i.name)}</h3><div class="meta">${esc(i.category||'Senza categoria')} · ${esc(i.location||'Nessuna posizione')}</div></div><div class="qty ${low?'low':''}">${i.qty}</div></div>
  <div>${i.code?`<span class="pill">Codice: ${esc(i.code)}</span>`:''}<span class="pill">Min: ${i.minQty||0}</span><span class="pill">Costo: ${fmtEUR(i.cost)}</span></div>
  ${i.notes?`<p class="meta" style="margin-top:12px">${esc(i.notes)}</p>`:''}
  <div class="actions"><button onclick="move('${i.id}',1)">+1</button><button onclick="move('${i.id}',-1)">-1</button><button onclick="editItem('${i.id}')">Modifica</button><button class="danger" onclick="delItem('${i.id}')">Elimina</button></div>
</article>`}
function esc(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function openForm(item={}){ $('productId').value=item.id||''; $('name').value=item.name||''; $('category').value=item.category||''; $('location').value=item.location||''; $('qty').value=item.qty??0; $('minQty').value=item.minQty??0; $('cost').value=item.cost??0; $('code').value=item.code||''; $('notes').value=item.notes||''; $('dialogTitle').textContent=item.id?'Modifica prodotto':'Nuovo prodotto'; $('productDialog').showModal()}
function editItem(id){openForm(items.find(i=>i.id===id))}
function delItem(id){if(confirm('Eliminare questo prodotto?')){items=items.filter(i=>i.id!==id);save()}}
function move(id,delta){const i=items.find(x=>x.id===id); if(!i)return; i.qty=Math.max(0,(+i.qty||0)+delta); i.updatedAt=new Date().toISOString(); save()}
$('addBtn').onclick=()=>openForm(); $('cancelBtn').onclick=()=>$('productDialog').close();
$('productForm').onsubmit=e=>{e.preventDefault(); const id=$('productId').value || crypto.randomUUID(); const item={id,name:$('name').value.trim(),category:$('category').value.trim(),location:$('location').value.trim(),qty:+$('qty').value||0,minQty:+$('minQty').value||0,cost:+$('cost').value||0,code:$('code').value.trim(),notes:$('notes').value.trim(),updatedAt:new Date().toISOString()}; const idx=items.findIndex(i=>i.id===id); if(idx>=0)items[idx]=item;else items.push(item); $('productDialog').close(); save()};
['search','categoryFilter','sortBy'].forEach(id=>$(id).addEventListener('input',render));
$('resetBtn').onclick=()=>{if(confirm('Cancellare tutto l’inventario da questo dispositivo?')){items=[];save()}};
$('exportBtn').onclick=()=>{const headers=['name','category','location','qty','minQty','cost','code','notes']; const csv=[headers.join(',')].concat(items.map(i=>headers.map(h=>'"'+String(i[h]??'').replaceAll('"','""')+'"').join(','))).join('\n'); download(csv,'inventario-gug.csv','text/csv')};
$('backupBtn').onclick=()=>download(JSON.stringify(items,null,2),'backup-inventario-gug.json','application/json');
function download(data,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('importInput').onchange=async e=>{const file=e.target.files[0]; if(!file)return; const text=await file.text(); const lines=text.split(/\r?\n/).filter(Boolean); const headers=lines.shift().split(',').map(h=>h.replaceAll('"','').trim()); const imported=lines.map(line=>{const vals=line.match(/("([^"]|"")*"|[^,]+)/g)||[]; const o={id:crypto.randomUUID()}; headers.forEach((h,idx)=>o[h]=(vals[idx]||'').replace(/^"|"$/g,'').replaceAll('""','"')); o.qty=+o.qty||0;o.minQty=+o.minQty||0;o.cost=+o.cost||0;return o}); items=imported; save(); e.target.value=''};
let deferredPrompt; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false}); $('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').hidden=true}};
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
render();
