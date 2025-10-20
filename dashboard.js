const API_URL = "https://script.google.com/macros/s/AKfycbxpXBauMH7uQopvtU-ReL-YnN7vqH4d3cT76TOJvs0mwZ23I7lbwAqutWs_xebADNet/exec";

async function carregarDashboard(){
  try{
    const res=await fetch(API_URL+'?action=getDashboard');
    const js=await res.json();

    // Resumo
    document.getElementById('summary').innerHTML=`<h3>Resumo Geral</h3><p><b>CPK Médio:</b> R$ ${(
      Number(Object.values(js.cpkPorMarca||{}).reduce((a,b)=>a+Number(b||0),0))/
      (Object.keys(js.cpkPorMarca||{}).length||1)
    ).toFixed(0)}</p>`;

    // Gráfico
    const labels=Object.keys(js.cpkPorMarca||{});
    const data=labels.map(l=>Number(js.cpkPorMarca[l]||0));
    const ctx=document.getElementById('chartCPK').getContext('2d');
    if(window._chart)window._chart.destroy();
    window._chart=new Chart(ctx,{
      type:'bar',
      data:{labels,datasets:[{label:'CPK',data,backgroundColor:'rgba(28,140,58,0.85)',borderRadius:6}]},
      options:{
        plugins:{datalabels:{anchor:'end',align:'end',color:'#173a18',font:{weight:'bold'},formatter:v=>'R$ '+Number(v).toFixed(0)},legend:{display:false}},
        scales:{y:{beginAtZero:true,ticks:{callback:v=>'R$ '+v}}},
        responsive:true,maintainAspectRatio:false
      },
      plugins:[ChartDataLabels]
    });

    // Contagem por marca
    let htmlMarca='<table><thead><tr><th>Marca</th><th>Qtd</th></tr></thead><tbody>';
    for(let m in js.quantidadePorMarca)htmlMarca+=`<tr><td>${m}</td><td>${js.quantidadePorMarca[m]}</td></tr>`;
    htmlMarca+='</tbody></table>';document.getElementById('countByMarca').innerHTML=htmlMarca;

    // Contagem por fase
    let htmlFase='<table><thead><tr><th>Vida</th><th>Qtd</th></tr></thead><tbody>';
    for(let f in js.contagemPorFase)htmlFase+=`<tr><td>${f}</td><td>${js.contagemPorFase[f]}</td></tr>`;
    htmlFase+='</tbody></table>';document.getElementById('countsByPhase').innerHTML=htmlFase;

  }catch(e){
    console.error(e);
    document.getElementById('summary').innerHTML='Erro ao carregar dashboard';
  }
}