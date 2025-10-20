const API_URL = "https://script.google.com/macros/s/AKfycbxpXBauMH7uQopvtU-ReL-YnN7vqH4d3cT76TOJvs0mwZ23I7lbwAqutWs_xebADNet/exec";

function qs(sel){return document.querySelector(sel);}

// === Buscar Pneu ===
async function buscarPneu(){
  const id = qs('#idPneu').value.trim();
  if(!id){alert('Digite o ID do pneu');return;}
  qs('#dadosPneu').innerHTML='Carregando...';
  const res = await fetch(API_URL+'?action=getPneuById&idPneu='+encodeURIComponent(id));
  const js = await res.json();
  if(js.error){qs('#dadosPneu').innerHTML='<p style="color:red">'+js.error+'</p>';return;}
  let html='<h3>Dados do Pneu</h3>';
  Object.keys(js).forEach(k=>{
    const val=js[k]||'';
    const bloqueado=k.toUpperCase().includes('CPK')?'readonly':'';
    const tipo=k.toLowerCase().includes('data')?'date':'text';
    html+=`<label>${k}</label><input ${bloqueado} type="${tipo}" name="${k}" value="${val}"/>`;
  });
  qs('#dadosPneu').innerHTML=html;
}

// === Limpeza Cache ===
function limparCache(){
  caches.keys().then(n=>{n.forEach(c=>caches.delete(c));alert('Cache limpo!');location.reload();});
}

// === Ir para dashboard ===
function irParaDashboard(){
  window.location.href='dashboard.html';
}