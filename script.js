// script.js (ATUALIZADO: moeda, readonly para preenchidos, dashboard robusto, logo integrado)
// ajuste API_URL conforme seu Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwCXn68asRZR12jilIx05Oj3JhZxI0-bavVbBo95beQ8Mm0Zjgs_6TpLCWsoLXuvtPm/exec";

function qs(sel){ return document.querySelector(sel); }

// registra service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err=>console.warn('SW registration failed',err));
}

// blocos de campos
const BLOCO_DADOS_PNEU = ['ID Pneu','Placa','Posição','Profundidade Sulco (mm)','Status','Marca','Vida'];
const BLOCO_PNEU_ORIGINAL = ['Data Instalação','Custo de Compra','KM Inicial','KM Final','KM Rodado','CPK'];
const BLOCO_RECAP_1 = ['Data Instalação 1','Custo Recapagem 1','KM Inicial_2','KM Final_2','KM Rodado_2','CPK_2'];
const BLOCO_RECAP_2 = ['Data Instalação 2','Custo Recapagem 2','KM Inicial_3','KM Final_3','KM Rodado_3','CPK_3'];

// utilitarios moeda
function formatCurrencyDisplay(v){
  if(v===null||v===undefined||v==='') return '';
  const n = Number(String(v).replace(/\D/g,'') || 0)/100;
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}
function parseCurrencyForSave(text){
  if(text===null||text===undefined||text==='') return '';
  // remove tudo exceto dígitos e vírgula/point, transformar em number (centavos)
  const cleaned = String(text).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) ? '' : num;
}

// identifica campos de moeda por nome
function isMoneyField(key){
  const lower = String(key).toLowerCase();
  return lower.includes('custo') || lower.includes('cpk');
}

// remove sufixos visuais
function cleanLabel(key){
  return String(key).replace(/_2$|_3$/,'').replace(/([A-Za-z])_/g,'$1 ').trim();
}

// monta bloco com tratamento de readonly e formatação
function montarBlocoHtml(titulo, keys, js, dd){
  let bloco = `<div class="card"><h3>${titulo}</h3><div class="fields">`;
  keys.forEach(k=>{
    // localizar valor no objeto js (case-insensitive)
    let val = undefined;
    const foundKey = Object.keys(js || {}).find(x => x.toLowerCase() === k.toLowerCase());
    if(foundKey) val = js[foundKey];
    // trata exibição (formatar moeda se necessário)
    const displayVal = isMoneyField(k) ? formatCurrencyDisplay(val) : (val ?? '');
    // se valor presente, campo deve ficar readonly/disabled
    const isReadonly = displayVal !== '' && displayVal !== null && displayVal !== undefined;
    // decide tipo
    const tipo = String(k).toLowerCase().includes('data') ? 'date' : (isMoneyField(k) || String(k).toLowerCase().includes('km') || String(k).toLowerCase().includes('profundidade') ? 'text' : 'text');

    // Dropdowns específicos: Placa, Posição, Status, Marca (buscar no dd com várias possibilidades)
    const lower = k.toLowerCase();
    if(lower.includes('placa')){
      const options = dd['Placa'] || dd['Placas'] || dd.placas || dd.placa || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">` +
               (options.length ? options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`).join('') : `<option value="${val||''}">${val||'—'}</option>`)
               + `</select></div>`;
      return;
    }
    if(lower.includes('posição') || lower.includes('posicao')){
      const options = dd['Posição'] || dd.posicoes || dd.Posicao || dd.Posições || dd.posição || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">` +
               (options.length ? options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`).join('') : `<option value="${val||''}">${val||'—'}</option>`)
               + `</select></div>`;
      return;
    }
    if(lower.includes('status')){
      const options = dd['Status'] || dd.status || dd.Status || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">` +
               (options.length ? options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`).join('') : `<option value="${val||''}">${val||'—'}</option>`)
               + `</select></div>`;
      return;
    }
    if(lower.includes('marca')){
      const options = dd['Marca'] || dd.marcas || dd.Marca || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">` +
               (options.length ? options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`).join('') : `<option value="${val||''}">${val||'—'}</option>`)
               + `</select></div>`;
      return;
    }

    // input normal
    const readAttr = isReadonly ? 'readonly' : '';
    const readClass = isReadonly ? 'readonly' : '';
    const valueAttr = `value="${(displayVal!==null && displayVal!==undefined) ? String(displayVal) : ''}"`;
    bloco += `<div><label>${cleanLabel(k)}</label><input type="${tipo}" ${readAttr} class="${readClass}" data-key="${k}" ${valueAttr} /></div>`;
  });
  bloco += `</div></div>`;
  return bloco;
}

// BUSCAR PNEU
async function buscarPneu(){
  const id = qs('#idPneu').value.trim();
  if(!id) return alert('Digite o ID do pneu');
  const container = qs('#dadosPneu');
  container.innerHTML = '<div class="card">Carregando...</div>';

  try {
    const [ddRes, pneuRes] = await Promise.all([
      fetch(API_URL + '?action=getDropdowns'),
      fetch(API_URL + '?action=getPneuById&idPneu=' + encodeURIComponent(id))
    ]);
    const dd = await ddRes.json();
    console.log('Dropdowns:', dd);
    const js = await pneuRes.json();
    if(js.error){ container.innerHTML = `<div class="card" style="color:#b00">${js.error}</div>`; return; }

    // montar blocos
    let html = '';
    html += montarBlocoHtml('Dados do Pneu', BLOCO_DADOS_PNEU, js, dd);
    html += montarBlocoHtml('Pneu Original', BLOCO_PNEU_ORIGINAL, js, dd);
    html += montarBlocoHtml('1ª Recapagem', BLOCO_RECAP_1, js, dd);
    html += montarBlocoHtml('2ª Recapagem', BLOCO_RECAP_2, js, dd);

    // CPK total (procura chaves possíveis)
    const cpkKey = Object.keys(js).find(k=>k.toLowerCase().includes('cpk total')) ||
                   Object.keys(js).find(k=>k.toLowerCase()==='cpk total') ||
                   Object.keys(js).find(k=>k.toLowerCase()==='cpk');
    const cpkValue = cpkKey ? formatCurrencyDisplay(js[cpkKey]) : '';

    html += `<div class="card"><h3>CPK Total</h3>
      <div class="cpk-box">
        <div class="cpk-value">${cpkValue || '<span style="color:#999">—</span>'}</div>
        <div style="flex:1"></div>
      </div>
      <div class="small-muted">CPK total (apenas leitura).</div>
    </div>`;

    html += `<div class="card"><h3>Ações</h3>
      <div class="actions">
        <button class="save-btn" onclick="salvarPneu()">💾 Salvar dados na planilha</button>
        <button onclick="window.location.href='dashboard.html'">📊 Ver Dashboard</button>
      </div>
      <div class="small-muted">Campos preenchidos são apenas leitura. Somente campos vazios podem ser editados.</div>
    </div>`;

    container.innerHTML = html;

    // adicionar evento para formatar inputs de moeda ao digitar apenas nos campos editáveis
    const allInputs = container.querySelectorAll('[data-key]');
    allInputs.forEach(el=>{
      const key = el.getAttribute('data-key');
      if(isMoneyField(key) && !el.hasAttribute('readonly') && el.tagName.toLowerCase()==='input'){
        el.addEventListener('input', e=>{
          // manter apenas números e formatar como moeda ao blur
          const v = e.target.value.replace(/[^\d]/g,'');
          if(v==='') { e.target.value=''; return; }
          const asNum = Number(v)/100;
          e.target.value = asNum.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
        });
        el.addEventListener('blur', e=>{
          // reforçar formatação
          const raw = e.target.value;
          const parsed = parseCurrencyForSave(raw);
          e.target.value = parsed === '' ? '' : formatCurrencyDisplay(parsed);
        });
      }
    });

  } catch (err) {
    console.error('Erro buscarPneu:', err);
    container.innerHTML = `<div class="card" style="color:#b00">Erro ao carregar: ${err.message}</div>`;
  }
}

// SALVAR DADOS
async function salvarPneu(){
  const container = qs('#dadosPneu');
  if(!container) return alert('Nenhum dado para salvar. Busque um pneu primeiro.');
  const elems = container.querySelectorAll('[data-key]');
  const params = new URLSearchParams();
  params.append('action','saveData');

  elems.forEach(el=>{
    const key = el.getAttribute('data-key');
    let val = '';
    if(el.tagName.toLowerCase() === 'select') {
      // se select está disabled e tem valor, queremos enviar mesmo assim? Como UI exige: campos preenchidos não editáveis — mas podemos enviar o valor atual.
      val = el.value;
    } else {
      val = el.value;
    }
    // se for campo de moeda, converter para número "1234.56"
    if(isMoneyField(key)){
      const parsed = parseCurrencyForSave(val);
      if(parsed !== '') params.append(key, parsed);
      else params.append(key, '');
    } else {
      params.append(key, val);
    }
  });

  // garantir ID
  let hasId = false;
  elems.forEach(el=>{ if(el.getAttribute('data-key').toLowerCase().includes('id')) hasId = true; });
  if(!hasId) return alert('Não foi possível identificar o ID do pneu. Certifique-se que o bloco "Dados do Pneu" contém "ID Pneu".');

  try {
    const res = await fetch(API_URL + '?' + params.toString());
    const js = await res.json();
    if(js.error) return alert('Erro ao salvar: ' + js.error);
    alert('Dados salvos com sucesso!');
    // recarrega para garantir que campos preenchidos fiquem readonly
    const idVal = qs('#idPneu').value.trim();
    if(idVal) buscarPneu();
  } catch (err) {
    console.error('Erro salvarPneu:', err);
    alert('Erro ao salvar: ' + err.message);
  }
}

// LIMPAR CACHE
function limparCache(){
  if(!('caches' in window)) { alert('API de Cache não disponível neste navegador'); return; }
  caches.keys().then(keys=>{ keys.forEach(k=>caches.delete(k)); alert('Cache limpo!'); location.reload(); });
}

// ---------------- Dashboard ----------------
async function carregarDashboard(){
  const summary = qs('#summary');
  summary.innerHTML = 'Carregando resumo...';
  try {
    const res = await fetch(API_URL + '?action=getDashboard');
    const js = await res.json();
    console.log('Dashboard data:', js);

    // validação básica das chaves esperadas
    if(!js || (!js.cpkPorMarca && !js.quantidadePorMarca && !js.contagemPorFase)) {
      summary.innerHTML = '<div class="error">Dados do dashboard inválidos ou incompletos.</div>';
      console.warn('getDashboard retornou estrutura diferente do esperado:', js);
      return;
    }

    // resumo CPK médio (calcula média das marcas)
    const marcas = js.cpkPorMarca || {};
    const vals = Object.values(marcas).map(v=>Number(v||0));
    const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    summary.innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> ${formatCurrencyDisplay(avg)}</p>`;

    // gráfico CPK por marca
    const labels = Object.keys(marcas);
    const data = labels.map(l=>Number(marcas[l]||0));
    const ctx = document.getElementById('chartCPK').getContext('2d');
    if(window._chart) window._chart.destroy();
    window._chart = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[{ label:'CPK', data, backgroundColor:'rgba(28,140,58,0.85)', borderRadius:6 }] },
      options:{
        indexAxis:'y',
        plugins:{ datalabels:{ anchor:'end', align:'right', formatter:v=>formatCurrencyDisplay(v) }, legend:{display:false} },
        scales:{ x:{ beginAtZero:true, ticks:{ callback: v => formatCurrencyDisplay(v) } } },
        responsive:true, maintainAspectRatio:false
      },
      plugins:[ChartDataLabels]
    });

    // tabela quantidade por marca
    let htmlMarca = '<table><thead><tr><th>Marca</th><th>Qtd</th></tr></thead><tbody>';
    const quantidade = js.quantidadePorMarca || {};
    for(const m in quantidade) htmlMarca += `<tr><td>${m}</td><td>${quantidade[m]}</td></tr>`;
    htmlMarca += '</tbody></table>';
    qs('#countByMarca').innerHTML = htmlMarca;

    // tabela contagem por fase
    let htmlFase = '<table><thead><tr><th>Vida</th><th>Qtd</th></tr></thead><tbody>';
    const fases = js.contagemPorFase || {};
    for(const f in fases) htmlFase += `<tr><td>${f}</td><td>${fases[f]}</td></tr>`;
    htmlFase += '</tbody></table>';
    qs('#countsByPhase').innerHTML = htmlFase;

  } catch (err) {
    console.error('Erro carregarDashboard:', err);
    qs('#summary').innerHTML = `<div class="error">Erro ao carregar dashboard: ${err.message}</div>`;
  }
}
