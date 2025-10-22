// script.js (ATUALIZADO: preserva exatamente os valores vindos da planilha para campos preenchidos;
// formata apenas quando usuário digita em campos vazios; salva mantendo original para campos readonly)
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

// util: determina se campo é de moeda/CPK
function isMoneyField(key){
  const lower = String(key).toLowerCase();
  return lower.includes('custo') || lower.includes('cpk');
}

// limpa e converte texto de moeda para número (padroniza ponto decimal)
// retorna string numérica (ex: "1234.56") ou '' se inválido/vazio
function parseCurrencyForSave(text){
  if(text===null||text===undefined) return '';
  const s = String(text).trim();
  if(s==='') return '';
  // se o texto já for um número puro (ex "1234.56"), aceitar
  if(/^-?\d+(\.\d+)?$/.test(s)) return s;
  // remover símbolo R$, espaços e pontos de milhar; permitir vírgula decimal
  let cleaned = s.replace(/\s/g,'').replace(/R\$\s?/i,'').replace(/\./g,'').replace(/,/g,'.');
  // remover qualquer caractere que não seja dígito, sinal ou ponto
  cleaned = cleaned.replace(/[^0-9\.\-]/g,'');
  const n = Number(cleaned);
  return isNaN(n) ? '' : String(n);
}

// formata um número (ou string numérica) para "R$ 1.234,56" — usado apenas para campos que o usuário editou
function formatToBRLString(val){
  if(val===null||val===undefined||val==='') return '';
  const num = Number(String(val));
  if(isNaN(num)) return String(val);
  return num.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

// remove sufixos visuais nos labels
function cleanLabel(key){
  return String(key).replace(/_2$|_3$/,'').replace(/([A-Za-z])_/g,'$1 ').trim();
}

// monta bloco, preservando texto original dos campos preenchidos (não altera string)
function montarBlocoHtml(titulo, keys, js, dd){
  let bloco = `<div class="card"><h3>${titulo}</h3><div class="fields">`;
  keys.forEach(k=>{
    // localizar valor no objeto js (case-insensitive)
    const foundKey = Object.keys(js || {}).find(x => x.toLowerCase() === k.toLowerCase());
    const originalVal = foundKey ? js[foundKey] : undefined;

    // se existir valor original (não undefined/null/empty-string) -> mostrar **exatamente** como veio (string)
    const hasOriginal = originalVal !== undefined && originalVal !== null && String(originalVal).trim() !== '';

    // decide se campo é readonly (se veio preenchido, deve ser readonly)
    const isReadonly = hasOriginal;

    // Dropdowns específicos: Placa, Posição, Status, Marca
    const lower = k.toLowerCase();
    if(lower.includes('placa')){
      const options = dd['Placa'] || dd['Placas'] || dd.placas || dd.placa || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      const displayVal = hasOriginal ? String(originalVal) : '';
      // se veio preenchido e não existe na lista de options, colocamos esse valor como option selecionado (preserva exato)
      let optsHtml = '';
      if(options && options.length){
        optsHtml = options.map(o=>`<option value="${o}" ${String(o)===String(originalVal)?'selected':''}>${o}</option>`).join('');
        if(hasOriginal && !options.includes(originalVal)) {
          optsHtml = `<option value="${displayVal}" selected>${displayVal}</option>` + optsHtml;
        }
      } else {
        optsHtml = `<option value="${displayVal}">${displayVal||''}</option>`;
      }
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">${optsHtml}</select></div>`;
      return;
    }

    if(lower.includes('posição') || lower.includes('posicao')){
      const options = dd['Posição'] || dd.posicoes || dd.Posicao || dd.Posicoes || dd.posição || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      const displayVal = hasOriginal ? String(originalVal) : '';
      let optsHtml = '';
      if(options && options.length){
        optsHtml = options.map(o=>`<option value="${o}" ${String(o)===String(originalVal)?'selected':''}>${o}</option>`).join('');
        if(hasOriginal && !options.includes(originalVal)) {
          optsHtml = `<option value="${displayVal}" selected>${displayVal}</option>` + optsHtml;
        }
      } else {
        optsHtml = `<option value="${displayVal}">${displayVal||''}</option>`;
      }
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">${optsHtml}</select></div>`;
      return;
    }

    if(lower.includes('status')){
      const options = dd['Status'] || dd.status || dd.Status || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      const displayVal = hasOriginal ? String(originalVal) : '';
      let optsHtml = '';
      if(options && options.length){
        optsHtml = options.map(o=>`<option value="${o}" ${String(o)===String(originalVal)?'selected':''}>${o}</option>`).join('');
        if(hasOriginal && !options.includes(originalVal)) {
          optsHtml = `<option value="${displayVal}" selected>${displayVal}</option>` + optsHtml;
        }
      } else {
        optsHtml = `<option value="${displayVal}">${displayVal||''}</option>`;
      }
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">${optsHtml}</select></div>`;
      return;
    }

    if(lower.includes('marca')){
      const options = dd['Marca'] || dd.marcas || dd.Marca || [];
      const selDisabled = isReadonly ? 'disabled' : '';
      const displayVal = hasOriginal ? String(originalVal) : '';
      let optsHtml = '';
      if(options && options.length){
        optsHtml = options.map(o=>`<option value="${o}" ${String(o)===String(originalVal)?'selected':''}>${o}</option>`).join('');
        if(hasOriginal && !options.includes(originalVal)) {
          optsHtml = `<option value="${displayVal}" selected>${displayVal}</option>` + optsHtml;
        }
      } else {
        optsHtml = `<option value="${displayVal}">${displayVal||''}</option>`;
      }
      bloco += `<div><label>${cleanLabel(k)}</label><select data-key="${k}" ${selDisabled} class="${isReadonly?'readonly':''}">${optsHtml}</select></div>`;
      return;
    }

    // inputs normais: se veio valor original, exibir exatamente como string e readonly
    let displayVal = hasOriginal ? String(originalVal) : '';
    const readAttr = isReadonly ? 'readonly' : '';
    const readClass = isReadonly ? 'readonly' : '';
    // para campos de moeda: NÃO reformatar — mostrar exatamente como veio
    bloco += `<div><label>${cleanLabel(k)}</label><input type="text" ${readAttr} class="${readClass}" data-key="${k}" value="${displayVal.replace(/"/g,'&quot;')}" /></div>`;
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

    // CPK total (procura chaves possíveis) — exibir exatamente como veio
    const cpkKey = Object.keys(js).find(k=>k.toLowerCase().includes('cpk total')) ||
                   Object.keys(js).find(k=>k.toLowerCase()==='cpk total') ||
                   Object.keys(js).find(k=>k.toLowerCase()==='cpk');
    const cpkValue = cpkKey ? String(js[cpkKey]) : '';

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

    // adicionar comportamento para inputs editáveis que sejam de moeda:
    const allInputs = container.querySelectorAll('[data-key]');
    allInputs.forEach(el=>{
      const key = el.getAttribute('data-key');
      // se campo é readonly, não adicionar listeners
      if(el.hasAttribute('readonly') || el.disabled) return;

      // se for campo de moeda, adicionar formatação ao blur
      if(isMoneyField(key) && el.tagName.toLowerCase()==='input'){
        el.addEventListener('input', e=>{
          // permitir que o usuário digite livremente; não forçamos formatação aqui além de bloquear caracteres inválidos
          // manter apenas dígitos, vírgula, ponto e sinal
          const raw = e.target.value;
          const cleaned = raw.replace(/[^0-9\-,\.]/g,'');
          e.target.value = cleaned;
        });
        el.addEventListener('blur', e=>{
          const parsed = parseCurrencyForSave(e.target.value);
          if(parsed !== '') e.target.value = formatToBRLString(parsed);
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
      // mesmo se disabled, pegamos o valor atual do select
      val = el.value;
    } else {
      val = el.value;
    }

    // se campo é moeda:
    if(isMoneyField(key)){
      // se veio readonly (preenchido originalmente) devemos enviar o texto exatamente como veio
      const wasReadonly = el.hasAttribute('readonly') || el.disabled;
      if(wasReadonly){
        // enviar exatamente como exibido (preserva formatação/original)
        params.append(key, val);
      } else {
        // campo foi editado pelo usuário: converter para número padrão "1234.56" antes de enviar
        const parsed = parseCurrencyForSave(val);
        params.append(key, parsed);
      }
    } else {
      // campos normais: enviar como texto
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

// ---------------- Dashboard (inalterado) ----------------
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
    summary.innerHTML = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> ${formatToBRLString(avg)}</p>`;

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
        plugins:{ datalabels:{ anchor:'end', align:'right', formatter:v=>formatToBRLString(v) }, legend:{display:false} },
        scales:{ x:{ beginAtZero:true, ticks:{ callback: v => formatToBRLString(v) } } },
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
