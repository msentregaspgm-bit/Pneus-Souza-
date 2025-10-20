const API_URL = 'https://script.google.com/macros/s/AKfycbw2vPBkDLNtzqJUonD7JU3AgPlqfmMWGzKGHKDrDOMf1KSbggDHwlTjnjsCbJhOqvEi/exec';

async function buscarPneu() {
  const id = document.getElementById('idPneu').value;
  const res = await fetch(`${API_URL}?action=getById&id=${id}`);
  const data = await res.json();
  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);
}

document.getElementById('formPneu').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('novoID').value;
  const marca = document.getElementById('marca').value;
  const modelo = document.getElementById('modelo').value;
  const km = document.getElementById('km').value;
  const cpk = document.getElementById('cpk').value;

  const values = [id, marca, modelo, km, cpk];

  await fetch(`${API_URL}?action=addOrUpdate&id=${id}&values=${encodeURIComponent(JSON.stringify(values))}`);
  alert('Pneu salvo com sucesso!');
  document.getElementById('formPneu').reset();
});

async function mostrarDashboard() {
  const res = await fetch(`${API_URL}?action=getAll`);
  const data = await res.json();
  if (!Array.isArray(data)) return;

  let total = 0;
  let count = 0;
  let marcas = {};

  const headers = data[0];
  const cpkIndex = headers.indexOf('CPK (Custo por KM)');
  const marcaIndex = headers.indexOf('Marca');

  for (let i = 1; i < data.length; i++) {
    const linha = data[i];
    const cpk = parseFloat(linha[cpkIndex]);
    if (!isNaN(cpk)) {
      total += cpk;
      count++;
      const marca = linha[marcaIndex] || 'Desconhecida';
      marcas[marca] = marcas[marca] || { total: 0, qtd: 0 };
      marcas[marca].total += cpk;
      marcas[marca].qtd++;
    }
  }

  let html = `<p><b>CPK Médio Geral:</b> ${(total / count).toFixed(2)}</p>`;
  html += '<h4>CPK por Marca:</h4>';
  for (const m in marcas) {
    html += `<p>${m}: ${(marcas[m].total / marcas[m].qtd).toFixed(2)}</p>`;
  }

  document.getElementById('dashboardContent').innerHTML = html;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}
