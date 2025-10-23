// === script.js — versão final com gráfico aprimorado ===
const API_URL = "https://script.google.com/macros/s/AKfycbwCXn68asRZR12jilIx05Oj3JhZxI0-bavVbBo95beQ8Mm0Zjgs_6TpLCWsoLXuvtPm/exec";

function qs(sel){ return document.querySelector(sel); }

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err=>console.warn('SW registration failed',err));
}

// ======================== BLOCO DE CONFIGURAÇÕES ========================
const BLOCO_DADOS_PNEU = ['ID Pneu','Placa','Posição','Profundidade Sulco (mm)','Status','Marca','Vida'];
const BLOCO_PNEU_ORIGINAL = ['Data Instalação','Custo de Compra','KM Inicial','KM Final','KM Rodado','CPK'];
const BLOCO_RECAP_1 = ['Data Instalação 1','Custo Recapagem 1','KM Inicial_2','KM Final_2','KM Rodado_2','CPK_2'];
const BLOCO_RECAP_2 = ['Data Instalação 2','Custo Recapagem 2','KM Inicial_3','KM Final_3','KM Rodado_3','CPK_3'];

function cleanLabel(k){return String(k).replace(/_2$|_3$/,'').trim();}

// ======================== CONSTRUÇÃO DOS BLOCOS ========================
function montarBloco(titulo, keys, js, dd, permitirEdicao){
  let html = `<div class="card"><h3>${titulo}</h3><div class="fields">`;
  keys.forEach(k=>{
    const found = Object.keys(js).find(x=>x.toLowerCase()===k.toLowerCase());
    const val = found ? js[found] : '';
    const temValor = val !== null && val !== undefined && String(val).trim() !== '';
    const readonly = (!permitirEdicao && temValor) || (permitirEdicao && k.toLowerCase().includes('id pneu'));
    const disableClass = readonly ? 'readonly' : '';

    // Dropdowns
    const lower = k.toLowerCase();
    let opts = [];
    if(lower.includes('placa')) opts = dd['Placa']||dd.placas||[];
    if(lower.includes('posição')||lower.includes('posicao')) opts = dd['Posição']||dd.posicoes||[];
    if(lower.includes('status')) opts = dd['Status']||dd.status||[];
    if(lower.includes('marca')) opts = dd['Marca']||dd.marcas||[];

    if(opts.length>0){
      html += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${readonly?'disabled':''} class="${disableClass}">`;
      let opcoes = opts.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`).join('');
      if(temValor && !opts.includes(val)) opcoes = `<option selected value="${val}">${val}</option>` + opcoes;
      html += opcoes + `</select></div>`;
    } else {
      html += `<div><label>${cleanLabel(k)}</label><input type="text" data-key="${k}" value="${val||''}" ${readonly?'readonly':''} class="${disableClass}"/></div>`;
    }
  });
  html += `</div></div>`;
  return html;
}

// ======================== BUSCAR PNEU ========================
async function buscarPneu(){
  const id = qs('#idPneu').value.trim();
  if(!id) return alert('Digite o ID do pneu');
  qs('#dadosPneu').innerHTML = '<div class="card">Carregando...</div>';
  try{
    const [ddRes, pneuRes] = await Promise.all([
      fetch(API_URL + '?action=getDropdowns'),
      fetch(API_URL + '?action=getPneuById&idPneu=' + encodeURIComponent(id))
    ]);
    const dd = await ddRes.json();
    const js = await pneuRes.json();
    if(js.error){ qs('#dadosPneu').innerHTML=`<div class="card" style="color:#b00">${js.error}</div>`;return; }

    let html = '';
    html += montarBloco('Dados do Pneu', BLOCO_DADOS_PNEU, js, dd, true);
    html += montarBloco('Pneu Original', BLOCO_PNEU_ORIGINAL, js, dd, false);
    html += montarBloco('1ª Recapagem', BLOCO_RECAP_1, js, dd, false);
    html += montarBloco('2ª Recapagem', BLOCO_RECAP_2, js, dd, false);

    const cpkKey = Object.keys(js).find(k=>k.toLowerCase().includes('cpk total'));
    const cpkVal = cpkKey ? js[cpkKey] : '';
    html += `<div class="card"><h3>CPK Total</h3><div class="cpk-box"><div class="cpk-value">${cpkVal||'—'}</div></div></div>`;

    html += `<div class="card"><h3>Ações</h3>
      <div class="actions">
        <button class="save-btn" onclick="salvarPneu()">💾 Salvar dados na planilha</button>
        <button onclick="window.location.href='dashboard.html'">📊 Ver Dashboard</button>
      </div>
      <div class="small-muted">Somente campos vazios estão habilitados para edição.</div>
    </div>`;

    qs('#dadosPneu').innerHTML = html;
  }catch(err){
    qs('#dadosPneu').innerHTML = `<div class="card" style="color:#b00">Erro: ${err.message}</div>`;
  }
}

// ======================== SALVAR DADOS ========================
async function salvarPneu(){
  const container = qs('#dadosPneu');
  const elems = container.querySelectorAll('[data-key]');
  const params = new URLSearchParams();
  params.append('action','saveData');
  elems.forEach(el=>{
    const key = el.getAttribute('data-key');
    params.append(key, el.value);
  });
  if(!Array.from(elems).some(el=>el.getAttribute('data-key').toLowerCase().includes('id')))
    return alert('ID Pneu não encontrado.');
  try{
    const res = await fetch(API_URL + '?' + params.toString());
    const js = await res.json();
    if(js.error) return alert('Erro: '+js.error);
    alert('Salvo com sucesso!');
    buscarPneu();
  }catch(err){ alert('Erro ao salvar: '+err.message); }
}

// ======================== LIMPAR CACHE ========================
function limparCache(){
  if(!('caches' in window)){alert('API de Cache indisponível');return;}
  caches.keys().then(k=>{k.forEach(c=>caches.delete(c));alert('Cache limpo!');location.reload();});
}

// ======================== DASHBOARD ========================
async function carregarDashboard() {
  const summary = document.getElementById('summary');
  summary.innerHTML = 'Carregando resumo...';

  try {
    const res = await fetch(API_URL + '?action=getDashboard');
    const js = await res.json();
    if (js.error) {
      summary.innerHTML = `<div class='error'>${js.error}</div>`;
      return;
    }

    // Ordena CPKs do menor para o maior
    const marcas = js.cpkPorMarca || {};
    const entries = Object.entries(marcas)
      .map(([marca, valor]) => [marca, Number(valor) || 0])
      .sort((a, b) => a[1] - b[1]);

    const labels = entries.map(e => e[0]);
    const data = entries.map(e => e[1]);

    // Média
    const avg = data.reduce((a, b) => a + b, 0) / (data.length || 1);
    summary.innerHTML = `<h3>Resumo Geral</h3>
      <p><b>CPK Médio:</b> R$ ${avg.toFixed(2)}</p>`;

    // Cores dinâmicas
    const colors = labels.map((_, i) => {
      const hue = (i * 45) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    });

    // Destroi gráfico anterior
    const ctx = document.getElementById('chartCPK').getContext('2d');
    if (window._chart) window._chart.destroy();

    // Atualiza título acima do gráfico
    const chartContainer = document.getElementById('chartCPK').parentElement;
    chartContainer.querySelector('h3').textContent = '🏆 Ranking de CPK por Marca (menor para maior)';

    // Cria o gráfico
    window._chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'CPK (R$)',
          data,
          backgroundColor: colors,
          borderRadius: 8,
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `R$ ${ctx.raw.toFixed(2)}`
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'right',
            color: '#111',
            font: { weight: 'bold', size: 13 },
            formatter: v => `R$ ${v.toFixed(2)}`
          },
          title: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: 'CPK (R$)' },
            ticks: {
              callback: v => `R$ ${v}`,
              font: { size: 12 }
            },
            suggestedMax: Math.max(...data) * 1.15
          },
          y: {
            ticks: { color: '#333', font: { weight: 'bold', size: 12 } }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      },
      plugins: [ChartDataLabels]
    });

    // Tabela quantidade por marca
    let htmlMarca = '<table><thead><tr><th>Marca</th><th>Qtd</th></tr></thead><tbody>';
    for (const m in js.quantidadePorMarca)
      htmlMarca += `<tr><td>${m}</td><td>${js.quantidadePorMarca[m]}</td></tr>`;
    htmlMarca += '</tbody></table>';
    document.getElementById('countByMarca').innerHTML = htmlMarca;

    // Tabela contagem por fase
    let htmlFase = '<table><thead><tr><th>Vida</th><th>Qtd</th></tr></thead><tbody>';
    for (const f in js.contagemPorFase)
      htmlFase += `<tr><td>${f}</td><td>${js.contagemPorFase[f]}</td></tr>`;
    htmlFase += '</tbody></table>';
    document.getElementById('countsByPhase').innerHTML = htmlFase;

  } catch (e) {
    summary.innerHTML = `<div class='error'>Erro: ${e.message}</div>`;
  }
}
