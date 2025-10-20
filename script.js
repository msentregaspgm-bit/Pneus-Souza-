const API_URL = "https://script.google.com/macros/s/AKfycbwCXn68asRZR12jilIx05Oj3JhZxI0-bavVbBo95beQ8Mm0Zjgs_6TpLCWsoLXuvtPm/exec";

function qs(sel){return document.querySelector(sel);}

let dropdownData = {};

window.addEventListener('load', async () => {
  try {
    const res = await fetch(API_URL + '?action=getDropdowns');
    dropdownData = await res.json();
  } catch {
    console.warn('Não foi possível carregar as listas de filtros.');
  }
});

// === Buscar Pneu ===
async function buscarPneu() {
  const id = qs('#idPneu').value.trim();
  if (!id) return alert('Digite o ID do pneu');
  qs('#dadosPneu').innerHTML = 'Carregando...';

  const res = await fetch(API_URL + '?action=getPneuById&idPneu=' + encodeURIComponent(id));
  const js = await res.json();
  if (js.error) { qs('#dadosPneu').innerHTML = js.error; return; }

  let html = '<h3>Dados do Pneu</h3>';

  Object.keys(js).forEach(k => {
    let val = js[k];
    let tipo = 'text';
    let input = '';
    const lower = k.toLowerCase();
    let bloqueado = val ? 'readonly' : ''; // bloqueia tudo que já tiver valor

    // === Campos CPK: sempre bloqueados e formatados em R$ ===
    if (lower.includes('cpk')) {
      val = val ? Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
      bloqueado = 'readonly';
    }

    // === Campos de custo: bloqueados só se já tiverem valor ===
    else if (lower.includes('custo')) {
      if (val) bloqueado = 'readonly';
      val = val ? Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
    }

    // === Campos dropdown (mapeados conforme a aba Filtro) ===
    if (lower.includes('marca')) {
      input = criarSelect(dropdownData.marcas, val, bloqueado);
    } else if (lower.includes('status')) {
      input = criarSelect(dropdownData.status, val, bloqueado);
    } else if (lower.includes('placa')) {
      input = criarSelect(dropdownData.placas, val, bloqueado);
    } else if (lower.includes('posicao') || lower.includes('posição')) {
      input = criarSelect(dropdownData.posicoes, val, bloqueado);
    }

    // === Campos comuns (texto ou data) ===
    else if (!input) {
      tipo = lower.includes('data') ? 'date' : 'text';
      input = `<input ${bloqueado} type="${tipo}" value="${val || ''}" />`;
    }

    html += `<label>${k}</label>${input}`;
  });

  qs('#dadosPneu').innerHTML = html;
}

// Função auxiliar para criar selects
function criarSelect(lista = [], valor = '', bloqueado = '') {
  return `<select ${bloqueado}>
    ${lista.map(opt => `<option value="${opt}" ${opt == valor ? 'selected' : ''}>${opt}</option>`).join('')}
  </select>`;
}

// === Limpeza Cache ===
function limparCache(){
  caches.keys().then(n=>{n.forEach(c=>caches.delete(c));alert('Cache limpo!');location.reload();});
}

// === Dashboard ===
async function carregarDashboard(){
  const res = await fetch(API_URL + '?action=getDashboard');
  const js = await res.json();
  qs('#summary').innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> R$ ${(
    Number(Object.values(js.cpkPorMarca||{}).reduce((a,b)=>a+Number(b||0),0)) /
    (Object.keys(js.cpkPorMarca||{}).length||1)
  ).toFixed(0)}</p>`;

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

  let htmlMarca='<table><thead><tr><th>Marca</th><th>Qtd</th></tr></thead><tbody>';
  for(let m in js.quantidadePorMarca) htmlMarca+=`<tr><td>${m}</td><td>${js.quantidadePorMarca[m]}</td></tr>`;
  htmlMarca+='</tbody></table>'; qs('#countByMarca').innerHTML=htmlMarca;

  let htmlFase='<table><thead><tr><th>Vida</th><th>Qtd</th></tr></thead><tbody>';
  for(let f in js.contagemPorFase) htmlFase+=`<tr><td>${f}</td><td>${js.contagemPorFase[f]}</td></tr>`;
  htmlFase+='</tbody></table>'; qs('#countsByPhase').innerHTML=htmlFase;
}