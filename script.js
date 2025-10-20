
const API_URL = "https://script.google.com/macros/s/AKfycbxQSSpXvehSOH5ugGQI0QVgsQkvfAlv3VRRYl24inztAxF-gUXIXfnXaEGp4Bzu3jRg/exec";

const HEADERS = ["ID Pneu","Placa","Posição","Profundidade Sulco (mm)","Status","Marca","Data Instalação","Custo de Compra","KM Inicial","KM Final","KM Rodado","CPK","Data Instalação 1","Custo Recapagem 1","KM Inicial_2","KM Final_2","KM Rodado_2","CPK_2","Data Instalação 2","Custo Recapagem 2","KM Inicial_3","KM Final_3","KM Rodado_3","CPK_3","CPK Total"];

function qs(s){return document.querySelector(s);}
function qsa(s){return Array.from(document.querySelectorAll(s));}

function formatCurrencyBR(value){
  const n = Number(String(value).replace(/\D+/g,'')) || 0;
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0}).format(n);
}

async function clearAppCache(){
  if('serviceWorker' in navigator){
    const regs = await navigator.serviceWorker.getRegistrations();
    for(const r of regs) await r.unregister();
  }
  if(window.caches){
    const keys = await caches.keys();
    await Promise.all(keys.map(k=>caches.delete(k)));
  }
  location.reload(true);
}

async function loadDropdowns(){
  try{
    const res = await fetch(API_URL + '?action=getDropdowns');
    const json = await res.json();
    window._dropdowns = json.dropdowns || {};
  }catch(e){
    console.error('Erro dropdowns',e);
    window._dropdowns = {};
  }
}

function formatDateForInput(v){
  if(!v) return '';
  const d = new Date(v);
  if(!isNaN(d.getTime())){ const yyyy=d.getFullYear(); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}`; }
  const parts = String(v).split('/'); if(parts.length===3){ return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`; } return '';
}

function buildForm(data){
  const form = qs('#formPneu'); form.innerHTML='';
  const dd = window._dropdowns || {};
  HEADERS.forEach((h,i)=>{
    const label = document.createElement('label'); label.textContent = h;
    let input;
    if(['Marca','Placa','Posição','Status'].includes(h)){
      input = document.createElement('select');
      const opts = dd[h] || [];
      const empty = document.createElement('option'); empty.value=''; empty.textContent='--'; input.appendChild(empty);
      opts.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; input.appendChild(op); });
      input.value = data ? (data[h] || '') : '';
    } else if(h.toLowerCase().includes('data')){ 
      input = document.createElement('input'); input.type='date'; input.value = data && data[h] ? formatDateForInput(data[h]) : '';
    } else if(h.toLowerCase().includes('custo') || h.toLowerCase().includes('recapagem')){
      input = document.createElement('input'); input.type='text'; input.value = data ? (data[h] || '') : '';
      input.onblur = function(){ this.value = formatCurrencyBR(this.value); };
    } else { input = document.createElement('input'); input.type='text'; input.value = data ? (data[h] || '') : ''; }
    input.id = 'f_'+i; input.dataset.key = h;
    if(h.toUpperCase().includes('CPK')){ input.readOnly = true; input.classList.add('readonly'); input.value = data ? formatCurrencyBR(data[h]||0) : ''; }
    form.appendChild(label); form.appendChild(input);
  });
  qs('#formCard').style.display = 'block';
}

async function buscarPneu(){
  const id = qs('#idBusca').value.trim(); if(!id) return alert('Digite o ID Pneu');
  qs('#msg')?.remove();
  try{
    const res = await fetch(API_URL + '?action=getData&idPneu=' + encodeURIComponent(id));
    const json = await res.json();
    if(json.error){ showMessage(json.error,'error'); buildForm(null); return; }
    buildForm(json.pneu);
  }catch(e){ console.error(e); showMessage('Erro ao buscar dados','error'); buildForm(null); }
}

function showMessage(txt,type){
  let el = qs('#msg'); if(!el){ el = document.createElement('div'); el.id='msg'; el.className='small'; qs('#formCard').appendChild(el); }
  el.textContent = txt; el.style.color = type==='error' ? '#b00020' : '#355d2a';
}

async function salvarPneu(){
  const inputs = qsa('#formPneu [data-key]'); const obj = {};
  inputs.forEach(inp=>{ let v = inp.value || ''; const key = inp.dataset.key; if(inp.type==='date' && v){ obj[key]=v; } else if(inp.type==='text' && (key.toLowerCase().includes('custo')|| key.toLowerCase().includes('recapagem')) ){ v = String(v).replace(/\D+/g,''); obj[key] = v ? Number(v) : ''; } else { obj[key]=v; } });
  const id = obj['ID Pneu'] || ''; if(!id) return alert('ID Pneu é obrigatório');
  try{
    const url = API_URL + '?action=saveData&id=' + encodeURIComponent(id) + '&data=' + encodeURIComponent(JSON.stringify(obj));
    const res = await fetch(url); const json = await res.json();
    if(json && json.success){ showMessage('Salvo com sucesso'); } else { showMessage('Erro ao salvar','error'); }
  }catch(e){ console.error(e); showMessage('Erro ao salvar','error'); }
}

async function carregarDashboard(){
  try{
    const res = await fetch(API_URL + '?action=getDashboard');
    const js = await res.json();
    qs('#summary').innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> R$ ${Number(js.mediaGeral||0).toFixed(0)}</p>`;
    const labels = (js.porMarca||[]).map(x=>x.marca);
    const data = (js.porMarca||[]).map(x=>Number(x.media||0).toFixed(0));
    const ctx = document.getElementById('chartCPK').getContext('2d');
    new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'CPK Médio', data: data, backgroundColor: 'rgba(28,140,58,0.9)' }] }, options: { indexAxis: 'y', scales: { x: { ticks: { callback: function(val){ return 'R$ ' + Number(val).toFixed(0); } } } }, responsive: true } });
    const res2 = await fetch(API_URL + '?action=getAll');
    const all = await res2.json();
    if(Array.isArray(all) && all.length>1){
      const headers = all[0]; const rows = all.slice(1);
      const counts = {};
      rows.forEach(r=>{ const marca = r[headers.indexOf('Marca')] || 'Indefinida'; counts[marca] = (counts[marca]||0)+1; });
      let html = '<table style="width:100%;border-collapse:collapse"><thead><tr><th>Marca</th><th>Quantidade</th></tr></thead><tbody>';
      for(const m in counts){ html += `<tr><td>${m}</td><td>${counts[m]}</td></tr>`; }
      html += '</tbody></table>'; document.getElementById('countByMarca').innerHTML = html;
      const idxOriginal = headers.indexOf('Data Instalação'); const idx1 = headers.indexOf('Data Instalação 1'); const idx2 = headers.indexOf('Data Instalação 2');
      let cOriginal=0,c1=0,c2=0;
      rows.forEach(r=>{ if(r[idxOriginal]) cOriginal++; if(r[idx1]) c1++; if(r[idx2]) c2++; });
      document.getElementById('countsByPhase').innerHTML = `<p>Pneu Original: ${cOriginal}</p><p>1° Recapagem: ${c1}</p><p>2° Recapagem: ${c2}</p>`;
    } else { document.getElementById('countByMarca').innerHTML = 'Sem dados'; document.getElementById('countsByPhase').innerHTML='Sem dados'; }
  }catch(e){ console.error(e); document.getElementById('summary').innerHTML='Erro ao carregar dashboard'; }
}

document.addEventListener('DOMContentLoaded', ()=>{ qs('#btnBuscar')?.addEventListener('click', buscarPneu); qs('#btnSalvar')?.addEventListener('click', salvarPneu); qs('#btnLimpar')?.addEventListener('click', ()=>{ buildForm(null); showMessage('Formulário limpo'); }); qs('#btnDashboard')?.addEventListener('click', ()=>{ window.location.href='dashboard.html'; }); qs('#cacheClear')?.addEventListener('click', clearAppCache); loadDropdowns(); if(window.location.pathname.endsWith('dashboard.html')) carregarDashboard(); if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{}); });
