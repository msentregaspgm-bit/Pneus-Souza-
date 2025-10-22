// script.js (ATUALIZADO com blocos e correções dropdown)
// troque a URL API_URL pela sua URL do Apps Script se necessário
const API_URL = "https://script.google.com/macros/s/AKfycbwCXn68asRZR12jilIx05Oj3JhZxI0-bavVbBo95beQ8Mm0Zjgs_6TpLCWsoLXuvtPm/exec";

function qs(sel){ return document.querySelector(sel); }

// register service worker (faça o registro se existir sw.js)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err=>console.warn('SW registration failed',err));
}

// ordem e agrupamento de campos por bloco (nomes esperados vindos da planilha)
const BLOCO_DADOS_PNEU = ['ID Pneu','Placa','Posição','Profundidade Sulco (mm)','Status','Marca','Vida'];
const BLOCO_PNEU_ORIGINAL = ['Data Instalação','Custo de Compra','KM Inicial','KM Final','KM Rodado','CPK'];
const BLOCO_RECAP_1 = ['Data Instalação 1','Custo Recapagem 1','KM Inicial_2','KM Final_2','KM Rodado_2','CPK_2'];
const BLOCO_RECAP_2 = ['Data Instalação 2','Custo Recapagem 2','KM Inicial_3','KM Final_3','KM Rodado_3','CPK_3'];

// util: cria um rótulo legível a partir da chave (remove sufixos _2/_3 quando exibir)
function cleanLabel(key){
  return String(key).replace(/_2$|_3$/,'').replace(/([A-Za-z])_/g,'$1 ').trim();
}

async function buscarPneu(){
  const id = qs('#idPneu').value.trim();
  if(!id) return alert('Digite o ID do pneu');
  const container = qs('#dadosPneu');
  container.innerHTML = '<div class="card">Carregando...</div>';

  try {
    // buscar dropdowns e dados do pneu em paralelo
    const ddRes = await fetch(API_URL + '?action=getDropdowns');
    const dd = await ddRes.json();
    console.log('Dropdowns recebidos: ', dd);

    const res = await fetch(API_URL + '?action=getPneuById&idPneu=' + encodeURIComponent(id));
    const js = await res.json();
    if(js.error){ container.innerHTML = `<div class="card" style="color:#b00">${js.error}</div>`; return; }

    // gerar layout dividido em blocos
    let html = '';

    // helper para montar campos (se campo estiver no objeto js, usa valor; senão vazio)
    function fieldHTML(key, value){
      const chave = key;
      const val = value ?? '';
      const low = chave.toLowerCase();

      // readonly se for CPK
      const isCPK = chave.toLowerCase().includes('cpk');
      const readonly = isCPK ? 'readonly class="readonly"' : '';

      // tipo data quando o nome contém 'data'
      const tipo = low.includes('data') ? 'date' : (low.includes('custo') || low.includes('km') || low.includes('profundidade') ? 'number' : 'text');

      // Dropdowns por nomes da aba Filtro: Placa, Posição, Status, Marca
      if (chave.toLowerCase().includes('placa')) {
        const options = (dd.Placa || dd.Placas || dd.placas || dd.placa || dd.placas_list || []);
        return `<label>${cleanLabel(chave)}</label><select data-key="${chave}">${options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`)}</select>`;
      }
      if (chave.toLowerCase().includes('posição') || chave.toLowerCase().includes('posicao') || chave.toLowerCase().includes('posição')) {
        const options = (dd['Posição'] || dd.posicao || dd.posicoes || dd.Posicoes || dd.Posicao || dd.posições || dd.posicoes_list || []);
        return `<label>${cleanLabel(chave)}</label><select data-key="${chave}">${options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`)}</select>`;
      }
      if (chave.toLowerCase().includes('status')) {
        const options = (dd['Status'] || dd.status || dd.Status || dd.status_list || []);
        return `<label>${cleanLabel(chave)}</label><select data-key="${chave}">${options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`)}</select>`;
      }
      if (chave.toLowerCase().includes('marca')) {
        const options = (dd['Marca'] || dd.marca || dd.marcas || dd.Marca || dd.marcas_list || []);
        return `<label>${cleanLabel(chave)}</label><select data-key="${chave}">${options.map(o=>`<option value="${o}" ${String(o)===String(val)?'selected':''}>${o}</option>`)}</select>`;
      }

      // campo normal (input)
      return `<label>${cleanLabel(chave)}</label><input ${readonly} type="${tipo}" value="${val||''}" data-key="${chave}" />`;
    }

    // função para montar bloco com título e lista de chaves
    function montarBloco(titulo, keys){
      let bloco = `<div class="card"><h3>${titulo}</h3><div class="fields">`;
      keys.forEach(k=>{
        // se o objeto js tem a chave exatamente, usa; senão, tenta encontrar key case-insensitive
        let val = undefined;
        if (js.hasOwnProperty(k)) val = js[k];
        else {
          // procurar correspondência case-insensitive
          const foundKey = Object.keys(js).find(x => x.toLowerCase() === k.toLowerCase());
          if(foundKey) val = js[foundKey];
        }
        // se o campo não existir nos dados ainda, deixamos vazio (mas permitimos edição)
        bloco += `<div>${fieldHTML(k, val)}</div>`;
      });
      bloco += `</div></div>`;
      return bloco;
    }

    // montar blocos principais
    html += montarBloco('Dados do Pneu', BLOCO_DADOS_PNEU);
    html += montarBloco('Pneu Original', BLOCO_PNEU_ORIGINAL);
    html += montarBloco('1ª Recapagem', BLOCO_RECAP_1);
    html += montarBloco('2ª Recapagem', BLOCO_RECAP_2);

    // CPK total isolado (procura qualquer campo que contenha 'CPK Total' ou 'CPK')
    const cpkTotalKey = Object.keys(js).find(k=>k.toLowerCase().includes('cpk total')) ||
                        Object.keys(js).find(k=>k.toLowerCase()==='cpk total') ||
                        null;
    const cpkValue = cpkTotalKey ? js[cpkTotalKey] : ( js['CPK Total'] || js['CPK'] || '' );

    html += `<div class="card"><h3>CPK Total</h3>
      <div class="cpk-box">
        <div class="cpk-value">${cpkValue || '<span style="color:#999">—</span>'}</div>
        <div style="flex:1"></div>
      </div>
      <div class="small-muted">CPK total (apenas leitura). Se quiser alterar diretamente na planilha, use o sistema de origem.</div>
    </div>`;

    // botão salvar (fica no fim)
    html += `<div class="card"><h3>Ações</h3>
      <div class="actions">
        <button class="save-btn" onclick="salvarPneu()">💾 Salvar dados na planilha</button>
        <button onclick="window.location.href='dashboard.html'">📊 Ver Dashboard</button>
      </div>
      <div class="small-muted">Ao salvar, os campos com atributo data-key serão enviados para a planilha (mantenha o ID do pneu).</div>
    </div>`;

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `<div class="card" style="color:#b00">Erro: ${err.message}</div>`;
  }
}

// salvar dados no Apps Script (saveData)
async function salvarPneu(){
  const container = qs('#dadosPneu');
  if(!container) return alert('Nenhum dado para salvar. Busque um pneu primeiro.');
  // coletar todos os elementos com data-key
  const elems = container.querySelectorAll('[data-key]');
  const params = new URLSearchParams();
  params.append('action','saveData');

  elems.forEach(el=>{
    const key = el.getAttribute('data-key');
    let val = '';
    if(el.tagName.toLowerCase() === 'select') val = el.value;
    else if (el.type === 'checkbox') val = el.checked ? 'TRUE' : 'FALSE';
    else val = el.value;
    params.append(key, val);
  });

  // garantir que exista algum campo com "ID" para identificação
  let hasId = false;
  elems.forEach(el=>{
    if(el.getAttribute('data-key').toLowerCase().includes('id')) hasId = true;
  });
  if(!hasId) return alert('Não foi possível identificar o ID do pneu. Certifique-se que o bloco "Dados do Pneu" contém "ID Pneu".');

  try {
    const res = await fetch(API_URL + '?' + params.toString());
    const js = await res.json();
    if(js.error) return alert('Erro ao salvar: ' + js.error);
    alert('Dados salvos com sucesso!');
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
}

// limpeza cache
function limparCache(){
  if(!('caches' in window)) { alert('API de Cache não disponível neste navegador'); return; }
  caches.keys().then(keys=>{ keys.forEach(k=>caches.delete(k)); alert('Cache limpo!'); location.reload(); });
}

// Inicial — se quiser carregar algo ao abrir, descomente e ajuste
// window.addEventListener('load', ()=>{ /*...*/ });
