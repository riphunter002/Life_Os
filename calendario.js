// ==================== LIFE OS — CALENDÁRIO (calendario.html) ====================

const NOMES_MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const NOMES_DIA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

let mesAtual = new Date();
mesAtual.setDate(1);

const calendarWeekdays = document.getElementById('calendarWeekdays');
const calendarGrid = document.getElementById('calendarGrid');
const mesAtualLabel = document.getElementById('mesAtualLabel');

calendarWeekdays.innerHTML = NOMES_DIA_SEMANA.map(d => `<div class="calendar-weekday">${d}</div>`).join('');

function renderizarCalendario() {
    mesAtualLabel.textContent = `${NOMES_MES[mesAtual.getMonth()]} de ${mesAtual.getFullYear()}`;

    const diarios = getJSON(STORAGE_KEYS.diarios, {});
    const treinos = getJSON(STORAGE_KEYS.treinos, {});
    const historicoPeso = getJSON(STORAGE_KEYS.peso, []);
    const pesoPorDia = {};
    historicoPeso.forEach(r => { pesoPorDia[r.data] = r.peso; });

    const hojeISO = todayISO();
    const primeiroDiaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay();
    const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();

    const celulas = [];

    // Dias do mês anterior (preenchimento)
    for (let i = 0; i < primeiroDiaSemana; i++) {
        celulas.push({ data: null, outroMes: true });
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
        celulas.push({ data: isoFromDate(data), outroMes: false });
    }

    calendarGrid.innerHTML = celulas.map(celula => {
        if (celula.outroMes) {
            return '<div class="calendar-cell other-month"></div>';
        }

        const iso = celula.data;
        const temDiario = Boolean(diarios[iso]);
        const temTreino = treinos[iso] === true;
        const peso = pesoPorDia[iso];
        const isHoje = iso === hojeISO;

        const indicadores = [];
        if (temDiario) indicadores.push('<span class="dot dot-diario" title="Registro no diário"></span>');
        if (temTreino) indicadores.push('<span class="dot dot-treino" title="Treino concluído"></span>');

        return `
            <div class="calendar-cell${isHoje ? ' today' : ''}" data-iso="${iso}">
                <span class="day-number">${Number(iso.split('-')[2])}</span>
                <div class="day-indicators">${indicadores.join('')}</div>
                ${peso !== undefined ? `<span class="day-weight-tag">${peso}kg</span>` : ''}
            </div>
        `;
    }).join('');

    calendarGrid.querySelectorAll('.calendar-cell[data-iso]').forEach(cell => {
        cell.addEventListener('click', () => abrirDetalhesDoDia(cell.dataset.iso));
    });
}

document.getElementById('mesAnterior').addEventListener('click', () => {
    mesAtual.setMonth(mesAtual.getMonth() - 1);
    renderizarCalendario();
});
document.getElementById('mesSeguinte').addEventListener('click', () => {
    mesAtual.setMonth(mesAtual.getMonth() + 1);
    renderizarCalendario();
});
document.getElementById('btnHoje').addEventListener('click', () => {
    mesAtual = new Date();
    mesAtual.setDate(1);
    renderizarCalendario();
});

// ==================== MODAL DE DETALHES DO DIA ====================
const dayModal = document.getElementById('dayModal');
const dayModalTitle = document.getElementById('dayModalTitle');
const dayModalBody = document.getElementById('dayModalBody');

function abrirDetalhesDoDia(iso) {
    const diarios = getJSON(STORAGE_KEYS.diarios, {});
    const treinos = getJSON(STORAGE_KEYS.treinos, {});
    const historicoPeso = getJSON(STORAGE_KEYS.peso, []);
    const historicoCalorias = getJSON(STORAGE_KEYS.calorias, []);

    const peso = historicoPeso.find(r => r.data === iso);
    const calorias = historicoCalorias.find(r => r.data === iso);
    const texto = diarios[iso];
    const treinoFeito = treinos[iso] === true;

    dayModalTitle.textContent = `${nomeDoDia(iso)}, ${formatDateBR(iso)}`;

    dayModalBody.innerHTML = `
        <p style="margin-bottom: 14px;">
            <span class="badge ${treinoFeito ? 'badge-success' : 'badge-neutral'}">
                ${treinoFeito ? 'Treino concluído' : 'Sem treino registrado'}
            </span>
        </p>
        <p style="margin-bottom: 8px; color: var(--text-secondary); font-size: 13.5px;">
            <strong>Peso:</strong> ${peso ? `${peso.peso}kg` : 'não registrado'}
        </p>
        <p style="margin-bottom: 14px; color: var(--text-secondary); font-size: 13.5px;">
            <strong>Calorias:</strong> ${calorias ? `${calorias.calorias} kcal` : 'não registrado'}
        </p>
        <div class="form-group">
            <label>Diário</label>
            ${texto
                ? `<p style="white-space: pre-wrap; line-height: 1.6; color: var(--text-secondary);">${escaparHTML(texto)}</p>`
                : `<p style="color: var(--text-muted); font-style: italic;">Nenhum registro para este dia.</p>`}
        </div>
        <a href="diario.html" class="btn btn-secondary btn-block">Abrir Meu Diário</a>
    `;

    dayModal.classList.remove('hidden');
}

document.getElementById('closeDayModal').addEventListener('click', () => dayModal.classList.add('hidden'));
dayModal.addEventListener('click', (e) => { if (e.target === dayModal) dayModal.classList.add('hidden'); });

// ==================== INICIALIZAÇÃO ====================
renderizarCalendario();
