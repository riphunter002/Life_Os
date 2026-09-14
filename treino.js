// ==================== LIFE OS — SAÚDE & TREINO (treino.html) ====================

const DIAS_SEMANA = [
    { idx: 1, nome: 'Segunda-feira' },
    { idx: 2, nome: 'Terça-feira' },
    { idx: 3, nome: 'Quarta-feira' },
    { idx: 4, nome: 'Quinta-feira' },
    { idx: 5, nome: 'Sexta-feira' },
    { idx: 6, nome: 'Sábado' },
    { idx: 0, nome: 'Domingo' }
];

// ==================== TREINO DE HOJE ====================
const btnTreino = document.getElementById('btnTreino');
const treinoStatus = document.getElementById('treinoStatus');
const planoHojeDesc = document.getElementById('planoHojeDesc');

function carregarStatusTreino() {
    const treinosSalvos = getJSON(STORAGE_KEYS.treinos, {});

    if (treinosSalvos[todayISO()] === true) {
        treinoStatus.textContent = 'Concluído';
        treinoStatus.className = 'badge badge-success';
        btnTreino.textContent = 'Desfazer';
        btnTreino.classList.remove('btn-primary');
        btnTreino.classList.add('btn-secondary');
    } else {
        treinoStatus.textContent = 'Pendente';
        treinoStatus.className = 'badge badge-danger';
        btnTreino.textContent = 'Marcar como concluído';
        btnTreino.classList.remove('btn-secondary');
        btnTreino.classList.add('btn-primary');
    }
}

function mostrarPlanoDeHoje() {
    const plano = getJSON(STORAGE_KEYS.planoTreino, {});
    const diaHoje = new Date().getDay();
    const config = plano[diaHoje];

    if (config && config.ativo && config.desc) {
        planoHojeDesc.textContent = `Hoje: ${config.desc}`;
    } else if (config && config.ativo) {
        planoHojeDesc.textContent = 'Hoje é dia de treino programado.';
    } else {
        planoHojeDesc.textContent = 'Nenhum treino programado para hoje.';
    }
}

btnTreino.addEventListener('click', function () {
    const treinosSalvos = getJSON(STORAGE_KEYS.treinos, {});
    treinosSalvos[todayISO()] = treinoStatus.textContent !== 'Concluído';
    setJSON(STORAGE_KEYS.treinos, treinosSalvos);
    carregarStatusTreino();
    atualizarStats();
    renderizarHeatmap();
});

// ==================== PLANO SEMANAL ====================
const weekPlanGrid = document.getElementById('weekPlanGrid');
const btnSalvarPlano = document.getElementById('btnSalvarPlano');
const planoFeedback = document.getElementById('planoFeedback');

function renderizarPlanoSemanal() {
    const plano = getJSON(STORAGE_KEYS.planoTreino, {});
    weekPlanGrid.innerHTML = DIAS_SEMANA.map(dia => {
        const config = plano[dia.idx] || { ativo: false, desc: '' };
        return `
            <div class="day-row">
                <label class="day-row-label checkbox-row">
                    <input type="checkbox" data-dia="${dia.idx}" class="dia-ativo" ${config.ativo ? 'checked' : ''}>
                    ${dia.nome}
                </label>
                <input type="text" data-dia="${dia.idx}" class="dia-desc" placeholder="Ex: Peito e tríceps" value="${(config.desc || '').replace(/"/g, '&quot;')}">
            </div>
        `;
    }).join('');
}

btnSalvarPlano.addEventListener('click', function () {
    const plano = {};
    document.querySelectorAll('.dia-ativo').forEach(checkbox => {
        const idx = checkbox.dataset.dia;
        const descInput = document.querySelector(`.dia-desc[data-dia="${idx}"]`);
        plano[idx] = { ativo: checkbox.checked, desc: descInput ? descInput.value.trim() : '' };
    });

    setJSON(STORAGE_KEYS.planoTreino, plano);
    planoFeedback.textContent = 'Plano semanal salvo com sucesso! ✅';
    planoFeedback.className = 'feedback feedback-success';
    mostrarPlanoDeHoje();

    setTimeout(() => { planoFeedback.textContent = ''; }, 3000);
});

// ==================== ESTATÍSTICAS ====================
function atualizarStats() {
    const treinos = getJSON(STORAGE_KEYS.treinos, {});
    document.getElementById('statStreakAtual').textContent = `${calcularStreakAtual(treinos)} dias`;
    document.getElementById('statMelhorStreak').textContent = `${calcularMelhorStreak(treinos)} dias`;
    document.getElementById('statTotalTreinos').textContent = Object.values(treinos).filter(Boolean).length;
}

// ==================== HEATMAP (últimos 84 dias) ====================
function renderizarHeatmap() {
    const treinos = getJSON(STORAGE_KEYS.treinos, {});
    const heatmap = document.getElementById('heatmapTreino');
    const hojeISO = todayISO();
    const dias = [];

    for (let i = 83; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        dias.push(isoFromDate(data));
    }

    heatmap.innerHTML = dias.map(iso => {
        const feito = treinos[iso] === true;
        const classes = ['heatmap-cell'];
        if (feito) classes.push('filled');
        if (iso === hojeISO) classes.push('today');
        return `<div class="${classes.join(' ')}" title="${formatDateBR(iso)} — ${feito ? 'Treino concluído' : 'Sem treino'}"></div>`;
    }).join('');
}

// ==================== INICIALIZAÇÃO ====================
carregarStatusTreino();
mostrarPlanoDeHoje();
renderizarPlanoSemanal();
atualizarStats();
renderizarHeatmap();
