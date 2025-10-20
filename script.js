const API_URL = "https://script.google.com/macros/s/AKfycbxQSSpXvehSOH5ugGQI0QVgsQkvfAlv3VRRYl24inztAxF-gUXIXfnXaEGp4Bzu3jRg/exec";

const HEADERS = ["ID Pneu","Placa","Posição","Profundidade Sulco (mm)","Status","Marca","Data Instalação","Custo de Compra","KM Inicial","KM Final","KM Rodado","CPK","Data Instalação 1","Custo Recapagem 1","KM Inicial_2","KM Final_2","KM Rodado_2","CPK_2","Data Instalação 2","Custo Recapagem 2","KM Inicial_3","KM Final_3","KM Rodado_3","CPK_3","CPK Total"];

function qs(sel){return document.querySelector(sel);}
function qsa(sel){return Array.from(document.querySelectorAll(sel));}

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
    const res = await fetch(`${API_URL}?action=getDropdowns`);
    const json = await res.json();
    window._dropdowns = (json && json.dropdowns) ? json.dropdowns : {};
  }catch(e){
    console.error('Erro carregar dropdowns',e);
    window._dropdowns = {};
  }
}

async function buscarPneu(){
  const id = qs('#idBusca').value.trim();
  if(!id) return alert('Digite o ID Pneu');
  qs('#msg')?.remove();
  try{
    const res = await fetch(`${API_URL}?action=getData&idPneu=${encodeURIComponent(id)}`);
    const json = await res.json();
    if(json && json.error){ showMessage(json.error,'error'); buildForm(null); return; }
    const data = json.pneu || null;
    buildForm(data);
  }catch(e){
    console.error(e); showMessage('Erro ao buscar dados.','error'); buildForm(null);
  }
}

function showMessage(txt, type){
  let el = qs('#msg');
  if(!el){ el = document.createElement('div'); el.id='msg'; el.className='small'; qs('#formCard').appendChild(el); }
  el.textContent = txt;
  el.style.color = type==='error'?'#b00020':'#355d2a';
}

function buildForm(data){
  const form = qs('#formPneu');
  form.innerHTML='';
  const dd = window._dropdowns || {};
  HEADERS.forEach((h, i)=>{
    const label = document.createElement('label'); label.textContent = h;
    let input;
    if(['Marca','Placa','Posição','Status'].includes(h)){
      input = document.createElement('select');
      const opts = dd[h] || [];
      const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='--';
      input.appendChild(emptyOpt);
      opts.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; input.appendChild(op); });
      input.value = data ? (data[h] || '') : '';
    } else {
      input = document.createElement('input'); input.type='text'; input.value = data ? (data[h] || '') : '';
    }
    input.id = 'f_'+i; input.dataset.key = h;
    if(h.toUpperCase().includes('CPK')){ input.readOnly = true; input.style.background='#f3f7f3'; }
    form.appendChild(label); form.appendChild(input);
  });
  qs('#formCard').style.display = 'block';
}

async function salvarPneu(){
  const inputs = qsa('#formPneu [data-key]');
  const obj = {};
  inputs.forEach(inp=>{ obj[inp.dataset.key]=inp.value; });
  const id = obj['ID Pneu'] || '';
  if(!id) return alert('ID Pneu é obrigatório');
  try{
    const body = `action=saveData&id=${encodeURIComponent(id)}&data=${encodeURIComponent(JSON.stringify(obj))}`;
    const res = await fetch(API_URL + '?' + body);
    const json = await res.json();
    if(json && json.success){ showMessage('Salvo com sucesso'); } else { showMessage('Erro ao salvar','error'); }
  }catch(e){ console.error(e); showMessage('Erro ao salvar','error'); }
}

async function carregarDashboard(){
  try{
    const res = await fetch(`${API_URL}?action=getDashboard`);
    const js = await res.json();
    const summary = qs('#summary'); const byMarca = qs('#byMarca');
    summary.innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> R$ ${js.mediaGeral || 0}</p>`;
    let html = '<table><thead><tr><th>Marca</th><th>CPK Médio</th></tr></thead><tbody>';
    (js.porMarca||[]).forEach(m=>{ html += `<tr><td>${m.marca}</td><td>R$ ${Number(m.media||0).toFixed(2)}</td></tr>`; });
    html += '</tbody></table>';
    byMarca.innerHTML = html;
  }catch(e){ console.error(e); qs('#summary').innerHTML='Erro ao carregar dashboard'; }
}

document.addEventListener('DOMContentLoaded', ()=>{
  qs('#btnBuscar')?.addEventListener('click', buscarPneu);
  qs('#btnSalvar')?.addEventListener('click', salvarPneu);
  qs('#btnNovo')?.addEventListener('click', ()=>{ buildForm(null); showMessage('Novo formulário limpo'); });
  qs('#btnDashboard')?.addEventListener('click', ()=>{ window.location.href='dashboard.html'; });
  qs('#cacheClear')?.addEventListener('click', clearAppCache);
  loadDropdowns();
  if(window.location.pathname.endsWith('dashboard.html')){ carregarDashboard(); }
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
});