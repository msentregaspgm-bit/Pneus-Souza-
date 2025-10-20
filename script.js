const API_URL = "https://script.google.com/macros/s/AKfycbxpXBauMH7uQopvtU-ReL-YnN7vqH4d3cT76TOJvs0mwZ23I7lbwAqutWs_xebADNet/exec";

// 🔹 Limpar cache
function limparCache() {
  localStorage.clear();
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  location.reload();
}

// 🔹 Buscar dados do pneu pelo ID
async function buscarPneu() {
  const idInput = document.getElementById("idPneu").value.trim();
  if (!idInput) {
    alert("Digite o ID do pneu.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}?action=getPneuById&idPneu=${encodeURIComponent(idInput)}`);
    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    preencherFormulario(data);
  } catch (error) {
    alert("Erro ao buscar dados: " + error.message);
  }
}

// 🔹 Preencher o formulário com os dados vindos do Apps Script
function preencherFormulario(data) {
  Object.keys(data).forEach(key => {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === "date" && data[key]) {
        input.value = new Date(data[key]).toISOString().split("T")[0];
      } else {
        input.value = data[key];
      }
    }
  });
}

// 🔹 Carregar listas suspensas
async function carregarListas() {
  try {
    const response = await fetch(`${API_URL}?action=getDropdowns`);
    const listas = await response.json();

    preencherSelect("marca", listas.marcas);
    preencherSelect("placa", listas.placas);
    preencherSelect("posicao", listas.posicoes);
    preencherSelect("status", listas.status);
    preencherSelect("vida", listas.vidas);
  } catch (error) {
    console.error("Erro ao carregar listas suspensas:", error);
  }
}

// 🔹 Preencher dropdowns dinamicamente
function preencherSelect(id, options) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = `<option value="">Selecione</option>`;
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

// 🔹 Salvar dados no Apps Script
async function salvarDados() {
  const form = document.getElementById("formPneu");
  const formData = new FormData(form);
  const params = new URLSearchParams();
  formData.forEach((v, k) => params.append(k, v));
  params.append("action", "saveData");

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      alert("Dados salvos com sucesso!");
    } else {
      alert("Erro ao salvar: " + (data.error || "Desconhecido"));
    }
  } catch (error) {
    alert("Erro de conexão: " + error.message);
  }
}

// 🔹 Redirecionar para o dashboard
function irParaDashboard() {
  window.location.href = "dashboard.html";
}

// 🔹 Animação ao carregar o app
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("fade-out");
    setTimeout(() => loader.remove(), 500);
  }
  carregarListas();
});
