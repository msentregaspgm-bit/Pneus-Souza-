const API_URL = "https://script.google.com/macros/s/AKfycbyv1vKWdeHgXRSrLppRCt_cxaslM_p8pNNkLcoOos7qXuVnEwwqWCp7YZHj5H7fdUA-/exec";

const HEADERS = ["ID Pneu","Placa","Posição","Profundidade Sulco (mm)","Status","Marca","Data Instalação","Custo de Compra","KM Inicial","KM Final","KM Rodado","CPK","Data Instalação 1","Custo Recapagem 1","KM Inicial_2","KM Final_2","KM Rodado_2","CPK_2","Data Instalação 2","Custo Recapagem 2","KM Inicial_3","KM Final_3","KM Rodado_3","CPK_3","CPK Total"];

// ----------------- HELPERS -----------------
function qs(sel){return document.querySelector(sel);}
function qsa(sel){return Array.from(document.querySelectorAll(sel));}

// limpar cache: unregister SW and clear caches, then reload
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

// ----------------- DROPDOWNS -----------------
async function loadDropdowns(){
  try{
    const res = await fetch(`${API_URL}?action=getDropdowns`);
    const lists = await res.json();
    // marca, placa, posicao, status
    window._dropdowns = lists || {};
  }catch(e){
    console.error('Erro carregar dropdowns',e);
    window._dropdowns = {};
  }
}

// ----------------- BUSCAR -----------------
async function buscarPneu(){
  const id = qs('#idBusca').value.trim();
  if(!id) return alert('Digite o ID Pneu');
  qs('#msg')?.remove();
  try{
    const res = await fetch(`${API_URL}?action=getById&id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if(data.error){ showMessage(data.error,'error'); buildForm(null); return; }
    buildForm(data);
  }catch(e){
    console.error(e); showMessage('Erro ao buscar dados.','error'); buildForm(null);
  }
}

// show message
function showMessage(txt, type){
  let el = qs('#msg');
  if(!el){ el = document.createElement('div'); el.id='msg'; el.className='small'; qs('#formCard').appendChild(el); }
  el.textContent = txt;
  el.style.color = type==='error'?'#b00020':'#355d2a';
}

// ----------------- BUILD FORM -----------------
function buildForm(data){
  const form = qs('#formPneu');
  form.innerHTML='';
  // ensure dropdowns loaded
  const dd = window._dropdowns || {};
  HEADERS.forEach((h, i)=>{
    const label = document.createElement('label'); label.textContent = h;
    let input;
    // if field is Marca/Placa/Posição/Status -> select
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

// ----------------- SALVAR -----------------
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

// ----------------- DASHBOARD -----------------
async function carregarDashboard(){
  try{
    const res = await fetch(`${API_URL}?action=getDashboard`);
    const js = await res.json();
    const summary = qs('#summary'); const byMarca = qs('#byMarca');
    summary.innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> R$ ${js.mediaGeral}</p>`;
    let html = '<table><thead><tr><th>Marca</th><th>CPK Médio</th></tr></thead><tbody>';
    js.marcas.forEach(m=>{ html += `<tr><td>${m.marca}</td><td>R$ ${m.media}</td></tr>`; });
    html += '</tbody></table>';
    byMarca.innerHTML = html;
  }catch(e){ console.error(e); qs('#summary').innerHTML='Erro ao carregar dashboard'; }
}

// ----------------- INIT -----------------
document.addEventListener('DOMContentLoaded', ()=>{
  // bindings
  qs('#btnBuscar')?.addEventListener('click', buscarPneu);
  qs('#btnSalvar')?.addEventListener('click', salvarPneu);
  qs('#btnNovo')?.addEventListener('click', ()=>{ buildForm(null); showMessage('Novo formulário limpo'); });
  qs('#btnDashboard')?.addEventListener('click', ()=>{ window.location.href='dashboard.html'; });
  qs('#cacheClear')?.addEventListener('click', clearAppCache);
  loadDropdowns();
});