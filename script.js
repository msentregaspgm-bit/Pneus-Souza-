// ===============================
// CONFIGURAÇÃO
// ===============================
const API_URL = "https://script.google.com/macros/s/AKfycbxSLtRNkeyyxTTwCkWJU2a2w2Q1lOnLjDEjlkTASTbuQi8ttatvgj0cjvrbrFTzSP4g/exec";

// ===============================
// BUSCAR DADOS PELO ID PNEU
// ===============================
async function buscarPneu() {
  const idInput = document.getElementById("idPneu");
  const id = idInput.value.trim();
  const resultadoDiv = document.getElementById("resultado");

  if (!id) {
    alert("Digite um ID Pneu para buscar.");
    return;
  }

  resultadoDiv.innerHTML = "<p>🔍 Buscando dados...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getById&id=${encodeURIComponent(id)}`);
    const data = await res.json();

    if (data.error) {
      resultadoDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
      return;
    }

    gerarFormulario(data);
  } catch (err) {
    console.error(err);
    resultadoDiv.innerHTML = "<p style='color:red;'>Erro ao buscar dados. Verifique a conexão.</p>";
  }
}

// ===============================
// GERAR FORMULÁRIO AUTOMATICAMENTE
// ===============================
function gerarFormulario(data) {
  const container = document.getElementById("resultado");
  container.innerHTML = "";

  const form = document.createElement("form");
  form.id = "formPneu";

  for (const key in data) {
    const label = document.createElement("label");
    label.textContent = key;
    const input = document.createElement("input");
    input.value = data[key] || "";

    // Bloquear todos os campos que tenham "CPK" no nome
    if (key.toUpperCase().includes("CPK")) {
      input.readOnly = true;
      input.style.background = "#e6ffe6"; // leve verde
    }

    input.dataset.key = key;
    form.appendChild(label);
    form.appendChild(input);
  }

  const btnSalvar = document.createElement("button");
  btnSalvar.textContent = "💾 Salvar Alterações";
  btnSalvar.type = "button";
  btnSalvar.onclick = salvarAlteracoes;

  form.appendChild(document.createElement("br"));
  form.appendChild(btnSalvar);
  container.appendChild(form);
}

// ===============================
// SALVAR OU ATUALIZAR
// ===============================
async function salvarAlteracoes() {
  const form = document.getElementById("formPneu");
  const inputs = form.querySelectorAll("input");
  const values = [];

  inputs.forEach(input => values.push(input.value));
  const id = values[0]; // 1ª coluna = ID Pneu

  try {
    const params = new URLSearchParams({
      action: "addOrUpdate",
      id: id,
      values: encodeURIComponent(JSON.stringify(values))
    });

    const res = await fetch(`${API_URL}?${params}`);
    const text = await res.text();

    if (text === "OK") {
      alert("✅ Dados salvos com sucesso!");
    } else {
      alert("⚠️ Erro ao salvar: " + text);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Erro de conexão ao salvar.");
  }
}

// ===============================
// DASHBOARD
// ===============================
async function carregarDashboard() {
  const container = document.getElementById("dashboard");
  container.innerHTML = "<p>🔄 Carregando dados...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getAll`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      container.innerHTML = "<p>Nenhum dado encontrado.</p>";
      return;
    }

    // Calcula médias de CPK
    let totalCPK = 0, count = 0;
    const marcas = {};

    data.forEach(row => {
      const cpk = parseFloat(row["CPK Total"]) || 0;
      if (cpk > 0) {
        totalCPK += cpk;
        count++;

        const marca = row["Marca"] || "Sem marca";
        if (!marcas[marca]) marcas[marca] = [];
        marcas[marca].push(cpk);
      }
    });

    const mediaGeral = count ? (totalCPK / count).toFixed(2) : 0;
    let html = `<h2>📊 Dashboard CPK</h2><p><strong>Média Geral:</strong> ${mediaGeral}</p><hr>`;

    html += `<h3>CPK por Marca:</h3>`;
    for (const marca in marcas) {
      const lista = marcas[marca];
      const media = (lista.reduce((a, b) => a + b, 0) / lista.length).toFixed(2);
      html += `<p><strong>${marca}:</strong> ${media}</p>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red;'>Erro ao carregar dashboard.</p>";
  }
}
