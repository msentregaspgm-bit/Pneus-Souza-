// URL do Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwCXn68asRZR12jilIx05Oj3JhZxI0-bavVbBo95beQ8Mm0Zjgs_6TpLCWsoLXuvtPm/exec";

// === FUNÇÃO DE BUSCA PELO ID ===
async function buscarPneu() {
    const idInput = document.getElementById("pneuId");
    const id = idInput.value.trim();
    const resultadoDiv = document.getElementById("resultado");

    if (!id) {
        alert("Por favor, insira o ID do pneu.");
        return;
    }

    resultadoDiv.innerHTML = "<p>🔄 Buscando informações...</p>";

    try {
        const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`);
        const data = await response.json();

        if (data.error) {
            resultadoDiv.innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
            return;
        }

        // === Renderiza os dados do pneu ===
        resultadoDiv.innerHTML = `
            <div class="dados-container">
                <h3>📋 Dados do Pneu</h3>
                <p><b>ID:</b> ${data.ID || "-"}</p>
                <p><b>Marca:</b> ${data.Marca || "-"}</p>
                <p><b>Modelo:</b> ${data.Modelo || "-"}</p>
                <p><b>Medida:</b> ${data.Medida || "-"}</p>
                <p><b>Placa:</b> ${data.Placa || "-"}</p>
                <p><b>Posição:</b> ${data.Posição || "-"}</p>
                <p><b>Status:</b> ${data.Status || "-"}</p>
                <p><b>Vida:</b> ${data.Vida || "-"}</p>
                <p><b>Data de Instalação:</b> ${data["Data de Instalação"] || "-"}</p>
                <p><b>CPK:</b> R$ ${formatarMoeda(data.CPK)}</p>
                <p><b>Custo de Compra:</b> R$ ${formatarMoeda(data["Custo de Compra"])}</p>
                <p><b>Custo de Recapagem:</b> R$ ${formatarMoeda(data["Custo de Recapagem"])}</p>
            </div>
        `;

    } catch (error) {
        console.error("Erro na busca:", error);
        resultadoDiv.innerHTML = `<p style="color:red;">❌ Erro ao buscar dados. Verifique a conexão.</p>`;
    }
}

// === FORMATAÇÃO DE MOEDA BRASILEIRA ===
function formatarMoeda(valor) {
    if (!valor || isNaN(valor)) return "0";
    return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 0 });
}

// === LIMPAR CACHE ===
function limparCache() {
    localStorage.clear();
    sessionStorage.clear();
    alert("🧹 Cache limpo com sucesso!");
    location.reload();
}

// === ABRIR DASHBOARD ===
function abrirDashboard() {
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("busca").style.display = "none";
}

// === VOLTAR PARA BUSCA ===
function voltarParaBusca() {
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("busca").style.display = "block";
}
