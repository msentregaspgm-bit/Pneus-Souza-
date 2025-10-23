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

    // Adiciona título acima do gráfico
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
          title: {
            display: false
          }
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
