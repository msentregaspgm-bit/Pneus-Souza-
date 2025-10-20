const API_URL = "https://script.google.com/macros/s/AKfycbwCXn68asRZR12jilIx05Oj3JhZxI0-bavVbBo95beQ8Mm0Zjgs_6TpLCWsoLXuvtPm/exec";

function qs(sel){return document.querySelector(sel);}

// register service worker (for PWA / offline)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err=>console.warn('SW registration failed',err));
}

// === Buscar Pneu ===
async function buscarPneu(){
  const id = qs('#idPneu').value.trim();
  if(!id) return alert('Digite o ID do pneu');
  qs('#dadosPneu').innerHTML = 'Carregando...';

  try {
    // fetch dropdowns first
    const ddRes = await fetch(API_URL + '?action=getDropdowns');
    const dd = await ddRes.json();

    const res = await fetch(API_URL + '?action=getPneuById&idPneu=' + encodeURIComponent(id));
    const js = await res.json();
    if(js.error){qs('#dadosPneu').innerHTML = '<div style="color:#b00">'+js.error+'</div>';return;}

    let html = '<h3>Dados do Pneu</h3>';
    Object.keys(js).forEach(k=>{
      const val = js[k] ?? '';
      const bloqueado = k.toUpperCase().includes('CPK') ? 'readonly' : '';
      const tipo = k.toLowerCase().includes('data') ? 'date' : 'text';

      // Campos que devem virar dropdowns: Placa, Marca, Status, Posição (aceita variações de maiúsculas)
      const chave = k.toLowerCase();
      if (chave.includes('placa')) {
        html += `<label>${k}</label><select data-key="${k}">${(dd.placas||[]).map(o=>\`<option value="\${o}" \${String(o)===String(val)?'selected':''}>\${o}</option>\`).join('')}</select>`;
      } else if (chave.includes('marca')) {
        html += `<label>${k}</label><select data-key="${k}">${(dd.marcas||[]).map(o=>\`<option value="\${o}" \${String(o)===String(val)?'selected':''}>\${o}</option>\`).join('')}</select>`;
      } else if (chave.includes('status')) {
        html += `<label>${k}</label><select data-key="${k}">${(dd.status||[]).map(o=>\`<option value="\${o}" \${String(o)===String(val)?'selected':''}>\${o}</option>\`).join('')}</select>`;
      } else if (chave.includes('posição') || chave.includes('posicao') || chave.includes('posição') || chave.includes('posição')) {
        html += `<label>${k}</label><select data-key="${k}">${(dd.posicoes||[]).map(o=>\`<option value="\${o}" \${String(o)===String(val)?'selected':''}>\${o}</option>\`).join('')}</select>`;
      } else {
        html += `<label>${k}</label><input ${bloqueado} type="${tipo}" value="${val||''}" data-key="${k}" />`;
      }
    });

    // add save button
    html += '<div style="margin-top:12px"><button onclick="salvarPneu()">💾 Salvar alterações</button></div>';
    qs('#dadosPneu').innerHTML = html;

  } catch (err) {
    qs('#dadosPneu').innerHTML = '<div style="color:#b00">Erro: '+err.message+'</div>';
  }
}

// === Salvar dados (chama saveData no Apps Script) ===
async function salvarPneu(){
  const container = qs('#dadosPneu');
  if(!container) return;
  // gather all inputs/selects with data-key
  const elems = container.querySelectorAll('[data-key]');
  const params = new URLSearchParams();
  params.append('action','saveData');

  elems.forEach(el=>{
    const key = el.getAttribute('data-key');
    const val = el.tagName.toLowerCase()==='select' ? el.value : el.value;
    params.append(key, val);
  });

  // ensure idPneu present: try to find id from first column-like key
  // If there's an input/select whose key contains 'id' use it
  let hasId = false;
  elems.forEach(el=>{ if(el.getAttribute('data-key').toLowerCase().includes('id')) hasId=true; });
  if(!hasId){
    alert('Não foi possível identificar o ID do pneu para salvar. Certifique-se que a tabela contém a coluna de ID.');
    return;
  }

  try {
    const res = await fetch(API_URL + '?' + params.toString());
    const js = await res.json();
    if(js.error) return alert('Erro ao salvar: '+js.error);
    alert('Salvo com sucesso!');
  } catch (err) {
    alert('Erro ao salvar: '+err.message);
  }
}

// === Limpeza Cache ===
function limparCache(){
  if(!('caches' in window)) { alert('API de Cache não disponível neste navegador'); return; }
  caches.keys().then(n=>{n.forEach(c=>caches.delete(c));alert('Cache limpo!');location.reload();});
}

// === Dashboard ===
async function carregarDashboard(){
  try {
    const res = await fetch(API_URL + '?action=getDashboard');
    const js = await res.json();
    qs('#summary').innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> R$ ${(
      Number(Object.values(js.cpkPorMarca||{}).reduce((a,b)=>a+Number(b||0),0)) /
      (Object.keys(js.cpkPorMarca||{}).length||1)
    ).toFixed(0)}</p>`;

    // gráfico de barras horizontais
    const labels = Object.keys(js.cpkPorMarca||{});
    const data = labels.map(l=>Number(js.cpkPorMarca[l]||0));
    const ctx = document.getElementById('chartCPK').getContext('2d');
    if(window._chart) window._chart.destroy();
    window._chart = new Chart(ctx, {
      type:'bar',
      data:{labels,datasets:[{label:'CPK',data,backgroundColor:'rgba(28,140,58,0.8)',borderRadius:6}]},
      options:{
        indexAxis:'y',
        plugins:{datalabels:{anchor:'end',align:'right',color:'#173a18',formatter:v=>'R$ '+Number(v).toFixed(0)},legend:{display:false}},
        scales:{x:{beginAtZero:true,ticks:{callback:v=>'R$ '+v}}},
        responsive:true,maintainAspectRatio:false
      },
      plugins:[ChartDataLabels]
    });

    // contagem por marca
    let htmlMarca='<table><thead><tr><th>Marca</th><th>Qtd</th></tr></thead><tbody>';
    for(let m in js.quantidadePorMarca) htmlMarca+=`<tr><td>${m}</td><td>${js.quantidadePorMarca[m]}</td></tr>`;
    htmlMarca+='</tbody></table>'; qs('#countByMarca').innerHTML=htmlMarca;

    // contagem por fase
    let htmlFase='<table><thead><tr><th>Vida</th><th>Qtd</th></tr></thead><tbody>';
    for(let f in js.contagemPorFase) htmlFase+=`<tr><td>${f}</td><td>${js.contagemPorFase[f]}</td></tr>`;
    htmlFase+='</tbody></table>'; qs('#countsByPhase').innerHTML=htmlFase;
  } catch (err) {
    qs('#summary').innerHTML = 'Erro ao carregar dashboard: '+err.message;
  }
}
