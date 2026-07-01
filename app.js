const KEY='gug_inventory_final_v1';
let items=JSON.parse(localStorage.getItem(KEY)||'[]');
const $=id=>document.getElementById(id); const euro=n=>(Number(n)||0).toLocaleString('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2});
function save(){localStorage.setItem(KEY,JSON.stringify(items));render()}
function cats(){return [...new Set(items.map(i=>i.category).filter(Boolean))].sort()}
function render(){
 const q=$('search').value.toLowerCase(), cf=$('categoryFilter').value;
 $('statProducts').textContent=items.length; $('statQty').textContent=items.reduce((a,i)=>a+(+i.qty||0),0); $('statValue').textContent=euro(items.reduce((a,i)=>a+(+i.qty||0)*(+i.price||0),0));
 const old=cf; $('categoryFilter').innerHTML='<option value="">Tutte le categorie</option>'+cats().map(c=>`<option>${esc(c)}</option>`).join(''); $('categoryFilter').value=old;
 let rows=items.filter(i=>(!cf||i.category===cf)&&[i.name,i.category,i.place,i.supplier,i.notes].join(' ').toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
 $('list').innerHTML= rows.length? rows.map(i=>`<article class="card"><div class="cardTop"><div><h3>${esc(i.name)}</h3><div class="meta"><span>${esc(i.category||'Senza categoria')}</span>${i.place?`<span>· ${esc(i.place)}</span>`:''}${i.supplier?`<span>· ${esc(i.supplier)}</span>`:''}</div></div><span class="pill">${euro((+i.qty||0)*(+i.price||0))}</span></div><div class="qtyRow"><div><div class="qty">${+i.qty||0}</div><div class="meta">${euro(i.price)} cad.</div></div><button class="round" onclick="move('${i.id}',-1)">−</button><button class="round" onclick="move('${i.id}',1)">+</button></div>${i.notes?`<div class="meta">${esc(i.notes)}</div>`:''}<button class="edit" onclick="openEdit('${i.id}')">Modifica</button></article>`).join('') : '<div class="empty">Nessun prodotto. Premi “+ Prodotto”.</div>';
}
function esc(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function move(id,d){const i=items.find(x=>x.id===id); if(!i)return; i.qty=Math.max(0,(+i.qty||0)+d); save()}
function openEdit(id){const i=items.find(x=>x.id===id)||{id:'',name:'',category:'',qty:0,price:0,place:'',supplier:'',notes:''}; $('editId').value=i.id;$('name').value=i.name;$('category').value=i.category;$('qty').value=i.qty;$('price').value=i.price;$('place').value=i.place;$('supplier').value=i.supplier;$('notes').value=i.notes;$('modalTitle').textContent=i.id?'Modifica prodotto':'Nuovo prodotto';$('deleteBtn').style.visibility=i.id?'visible':'hidden';$('modal').showModal()}
$('addBtn').onclick=()=>openEdit(); $('search').oninput=render; $('categoryFilter').onchange=render;
$('saveBtn').onclick=e=>{e.preventDefault(); const id=$('editId').value||crypto.randomUUID(); const obj={id,name:$('name').value.trim()||'Senza nome',category:$('category').value.trim(),qty:+$('qty').value||0,price:+$('price').value||0,place:$('place').value.trim(),supplier:$('supplier').value.trim(),notes:$('notes').value.trim()}; const n=items.findIndex(x=>x.id===id); n>=0?items[n]=obj:items.push(obj); $('modal').close(); save()};
$('deleteBtn').onclick=()=>{const id=$('editId').value;if(confirm('Eliminare questo prodotto?')){items=items.filter(i=>i.id!==id);$('modal').close();save()}};
$('resetBtn').onclick=()=>{if(confirm('Cancellare tutto l’inventario da questo dispositivo?')){items=[];save()}};
$('backupBtn').onclick=()=>download('backup-inventario-gug.json',JSON.stringify(items,null,2),'application/json');
$('exportBtn').onclick=()=>{const head=['nome','categoria','quantita','costo_unitario','posizione','fornitore','note']; const csv=[head.join(';'),...items.map(i=>head.map(k=>'"'+String(({nome:i.name,categoria:i.category,quantita:i.qty,costo_unitario:i.price,posizione:i.place,fornitore:i.supplier,note:i.notes}[k])??'').replaceAll('"','""')+'"').join(';'))].join('\n');download('inventario-gug.csv',csv,'text/csv')};
$('importBtn').onclick=()=>$('importFile').click(); $('importFile').onchange=async e=>{const txt=await e.target.files[0].text(); const lines=txt.split(/\r?\n/).filter(Boolean).slice(1); items=lines.map(l=>{const p=l.split(';').map(x=>x.replace(/^"|"$/g,'').replaceAll('""','"'));return{id:crypto.randomUUID(),name:p[0]||'',category:p[1]||'',qty:+p[2]||0,price:+p[3]||0,place:p[4]||'',supplier:p[5]||'',notes:p[6]||''}});save()};
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
if('serviceWorker'in navigator) navigator.serviceWorker.register('./sw.js'); render();
