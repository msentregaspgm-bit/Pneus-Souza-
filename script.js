const API_URL = 'https://script.google.com/macros/s/AKfycbw2vPBkDLNtzqJUonD7JU3AgPlqfmMWGzKGHKDrDOMf1KSbggDHwlTjnjsCbJhOqvEi/exec';

// Buscar Pneu por ID
async function buscarPneu() {
  const id = document.getElementById('idBusca').value;
  if (!id) return alert('Digite o ID Pneu');

  const res = await fetch(`${API_URL}?action=getById&id=${id}`);
  const data = await res.json();
  const formContainer = document.getElementById('formContainer');
  const form = document.getElementById('formPneu');
  form.innerHTML = '';
  formContainer.style.display = 'block';

  const headers = ["ID Pneu","Placa","Posição","Profundidade Sulco (mm)","Status","Marca","Data Instalação","Custo de Compra","KM Inicial","KM Final","KM Rodado","CPK","Data Instalação 1","Custo Recapagem 1","KM Inicial_2","KM Final_2","KM Rodado_2","CPK_2","Data Instalação 2","Custo Recapagem 2","KM Inicial_3","KM Final_3","KM Rodado_3","CPK_3","CPK Total"];
  
  headers.forEach((h, i) => {
    const label = document.createElement('label');
    label.textContent = h;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `campo_${i}`;
    input.value = data ? (data[i] || '') : '';
    if (h.startsWith('CPK')) input.readOnly = true;
    form.appendChild(label);
    form.appendChild(input);
  });
}

// Salvar pneu
async function salvarPneu() {
  const inputs = document.querySelectorAll('#formPneu input');
  const values = Array.from(inputs).map(i => i.value);
  const id = values[0];
  await fetch(`${API_URL}?action=addOrUpdate&id=${id}&values=${encodeURIComponent(JSON.stringify(values))}`);
  alert('Pneu salvo com sucesso!');
}

// Dashboard
if (window.location.pathname.includes('dashboard.html')) {
  window.addEventListener('load', async () => {
    const res = await fetch(`${API_URL}?action=getAll`);
    const data = await res.json();
    const content = document.getElementById('dashboardContent');

    if (!Array.isArray(data)) {
      content.innerHTML = '<p>Erro ao carregar dados.</p>';
      return;
    }

    let total = 0, count = 0;
    let marcas = {}, headers = data[0];
    const cpkIndex = headers.indexOf('CPK Total');
    const marcaIndex = headers.indexOf('Marca');

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const cpk = parseFloat(row[cpkIndex]);
      if (!isNaN(cpk)) {
        total += cpk;
        count++;
        const marca = row[marcaIndex] || 'Desconhecida';
        marcas[marca] = marcas[marca] || { total: 0, qtd: 0 };
        marcas[marca].total += cpk;
        marcas[marca].qtd++;
      }
    }

    let html = `<h3>Resumo Geral</h3><p><b>CPK Médio:</b> ${(total/count).toFixed(2)}</p>`;
    html += '<h3>Por Marca</h3>';
    for (const m in marcas) {
      html += `<p>${m}: ${(marcas[m].total / marcas[m].qtd).toFixed(2)}</p>`;
    }
    content.innerHTML = html;
  });
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}
