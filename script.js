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
    let bloqueado = val ? 'readonly' : ''; // bloqueia campos preenchidos

    if (lower.includes('cpk')) {
      val = val ? Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
      bloqueado = 'readonly';
    } else if (lower.includes('custo')) {
      if (val) bloqueado = 'readonly';
      val = val ? Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
    }

    if (lower.includes('marca')) {
      input = criarSelect(dropdownData.marcas, val, bloqueado);
    } else if (lower.includes('status')) {
      input = criarSelect(dropdownData.status, val, bloqueado);
    } else if (lower.includes('placa')) {
      input = criarSelect(dropdownData.placas, val, bloqueado);
    } else if (lower.includes('posicao') || lower.includes('posição')) {
      input = criarSelect(dropdownData.posicoes, val, bloqueado);
    } else if (!input) {
      tipo = lower.includes('data') ? 'date' : 'text';
      input = `<input ${bloqueado} type="${tipo}" value="${val || ''}" />`;
    }

    html += `<label>${k}</label>${input}`;
  });

  qs('#dadosPneu').innerHTML = html;
}

function criarSelect(lista = [], valor = '', bloqueado = '') {
  return `<select ${bloqueado}>
    ${lista.map(opt => `<option value="${opt}" ${opt == valor ? 'selected' : ''}>${opt}</option>`).join('')}
  </select>`;
}

function limparCache(){
  caches.keys().then(n=>{n.forEach(c=>caches.delete(c));alert('Cache limpo!');location.reload();});
}