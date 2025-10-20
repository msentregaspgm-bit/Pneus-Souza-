const API_URL = "https://script.google.com/macros/s/AKfycbyQ2R_kpmA4otZeycEQTbE6OEazlJgTGUawVQ0xG3qk51B8bil0Ln4mBrmgEqvX6isA/exec";

// UTIL: headers expected (match exactly the spreadsheet columns)
const HEADERS = ["ID Pneu","Placa","Posição","Profundidade Sulco (mm)","Status","Marca","Data Instalação","Custo de Compra","KM Inicial","KM Final","KM Rodado","CPK","Data Instalação 1","Custo Recapagem 1","KM Inicial_2","KM Final_2","KM Rodado_2","CPK_2","Data Instalação 2","Custo Recapagem 2","KM Inicial_3","KM Final_3","KM Rodado_3","CPK_3","CPK Total"];

// Busca por ID e monta o formulário
async function buscarPneu(){
  const id = document.getElementById('idBusca').value.trim();
  if(!id) return alert('Digite o ID do pneu');
  const res = await fetch(`${API_URL}?action=getById&id=${encodeURIComponent(id)}`);
  const row = await res.json();
  const formCard = document.getElementById('formCard');
  const form = document.getElementById('formPneu');
  form.innerHTML = '';
  if(!row){
    // montamos campos vazios (novo registro)
    HEADERS.forEach((h,i)=>{
      appendField(form,h,'',i);
    });
    formCard.style.display = 'block';
    document.getElementById('msg').textContent = 'Registro não encontrado — preenchendo campos em branco para novo cadastro.';
    return;
  }
  // row is an array of values (same order as headers)
  HEADERS.forEach((h,i)=>{
    appendField(form,h,row[i]||'',i);
  });
  formCard.style.display = 'block';
  document.getElementById('msg').textContent = '';
}

// adiciona label+input ao form; bloqueia campos que comecem com CPK
function appendField(form,label,valor,index){
  const lbl = document.createElement('label'); lbl.textContent = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = valor || '';
  input.dataset.idx = index;
  input.id = 'f_'+index;
  if(label.toUpperCase().startsWith('CPK')){ input.readOnly = true; input.style.background = '#f3f7f3'; }
  form.appendChild(lbl); form.appendChild(input);
}

// salvar (addOrUpdate)
async function salvarPneu(){
  const inputs = Array.from(document.querySelectorAll('#formPneu input'));
  const values = inputs.map(i=>i.value);
  const id = values[0];
  if(!id) return alert('ID Pneu é obrigatório');
  const url = `${API_URL}?action=addOrUpdate&id=${encodeURIComponent(id)}&values=${encodeURIComponent(JSON.stringify(values))}`;
  const res = await fetch(url);
  const txt = await res.text();
  if(txt==='OK'){ alert('Salvo com sucesso'); } else { alert('Resposta: '+txt); }
}

// DASHBOARD: carregar resumo e por marca (uses CPK Total column or sums CPKs)
async function carregarDashboard(){
  const res = await fetch(`${API_URL}?action=getAll`);
  const data = await res.json();
  const summary = document.getElementById('summary');
  const byMarcaDiv = document.getElementById('byMarca');
  if(!Array.isArray(data) || data.length<2){
    summary.innerHTML = '<p>Nenhum dado disponível.</p>'; byMarcaDiv.innerHTML='-'; return;
  }
  const headers = data[0];
  const rows = data.slice(1);
  const idxMarca = headers.indexOf('Marca');
  let idxCpkTotal = headers.indexOf('CPK Total');
  let totalCpk = 0, countCpk = 0;
  const marcaMap = {};
  rows.forEach(r=>{
    let cpk = null;
    if(idxCpkTotal>=0) cpk = parseFloat(r[idxCpkTotal]);
    if((cpk===null || isNaN(cpk))){
      const idxs = ['CPK','CPK_2','CPK_3'].map(k=>headers.indexOf(k)).filter(i=>i>=0);
      let sum=0, found=false;
      idxs.forEach(i=>{ const v=parseFloat(r[i]); if(!isNaN(v)){ sum+=v; found=true; }});
      if(found) cpk = sum;
    }
    if(cpk!==null && !isNaN(cpk)){ totalCpk += cpk; countCpk++; }
    const marca = (idxMarca>=0? r[idxMarca] : '') || 'Desconhecida';
    if(!marcaMap[marca]) marcaMap[marca] = { total:0, count:0 };
    if(cpk!==null && !isNaN(cpk)){ marcaMap[marca].total += cpk; marcaMap[marca].count++; }
  });
  const media = countCpk? (totalCpk/countCpk).toFixed(2) : '0.00';
  summary.innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> R$ ${media}</p><p><b>Registros com CPK:</b> ${countCpk}</p>`;
  let html = '<table><thead><tr><th>Marca</th><th>CPK Médio</th><th>Registros</th></tr></thead><tbody>';
  for(const m in marcaMap){
    const obj = marcaMap[m];
    const med = obj.count? (obj.total/obj.count).toFixed(2) : '0.00';
    html += `<tr><td>${m}</td><td>R$ ${med}</td><td>${obj.count}</td></tr>`;
  }
  html += '</tbody></table>';
  byMarcaDiv.innerHTML = html;
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  const b = document.getElementById('btnBuscar'); if(b) b.addEventListener('click', buscarPneu);
  const bs = document.getElementById('btnSalvar'); if(bs) bs.addEventListener('click', salvarPneu);
  if(window.location.pathname.endsWith('dashboard.html')){ carregarDashboard(); }
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
});
