// ==================== LIFE OS — VISÃO GERAL (index.html) ====================

function corDoTema(variavel) {
    return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
}

// ==================== PERFIL ====================
const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');
const welcomeTitle = document.getElementById('welcomeTitle');
const profileSummary = document.getElementById('profileSummary');

function checkProfile() {
    const savedProfile = getJSON(STORAGE_KEYS.profile, null);

    if (savedProfile) {
        profileModal.classList.add('hidden');
        welcomeTitle.innerText = `Olá, ${savedProfile.name}! 👋`;
        profileSummary.innerText = `Marco Zero: ${savedProfile.initialWeight}kg · Altura: ${savedProfile.height}cm`;
    } else {
        profileModal.classList.remove('hidden');
    }
}

profileForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const userProfile = {
        name: document.getElementById('userName').value,
        height: document.getElementById('userHeight').value,
        initialWeight: document.getElementById('userInitialWeight').value,
        createdAt: todayISO()
    };

    setJSON(STORAGE_KEYS.profile, userProfile);

    checkProfile();
    renderizarGraficos();
    atualizarStats();
});

// ==================== MONITORAMENTO FÍSICO (peso + calorias) ====================
const btnSaveHealth = document.getElementById('btnSaveHealth');
const dailyWeightInput = document.getElementById('dailyWeight');
const dailyCaloriesInput = document.getElementById('dailyCalories');
const healthFeedback = document.getElementById('healthFeedback');

btnSaveHealth.addEventListener('click', function () {
    const pesoAtual = parseFloat(dailyWeightInput.value);
    const caloriasAtual = parseInt(dailyCaloriesInput.value, 10);
    const profile = getJSON(STORAGE_KEYS.profile, null);

    if (isNaN(pesoAtual) && isNaN(caloriasAtual)) {
        healthFeedback.textContent = 'Preencha ao menos um dos campos antes de salvar.';
        healthFeedback.className = 'feedback feedback-error';
        return;
    }

    const mensagens = [];

    if (!isNaN(pesoAtual)) {
        upsertHistoricoDoDia(STORAGE_KEYS.peso, 'peso', pesoAtual);
        dailyWeightInput.value = '';

        if (profile) {
            const diferenca = pesoAtual - parseFloat(profile.initialWeight);
            if (diferenca < 0) {
                mensagens.push(`🔥 Você perdeu ${Math.abs(diferenca).toFixed(2)}kg desde o início.`);
            } else if (diferenca > 0) {
                mensagens.push(`📈 Você ganhou ${diferenca.toFixed(2)}kg desde o início.`);
            } else {
                mensagens.push('⚖️ Seu peso está igual ao início.');
            }
        }
    }

    if (!isNaN(caloriasAtual)) {
        upsertHistoricoDoDia(STORAGE_KEYS.calorias, 'calorias', caloriasAtual);
        dailyCaloriesInput.value = '';
        mensagens.push(`🍽️ ${caloriasAtual} kcal registradas hoje.`);
    }

    healthFeedback.textContent = mensagens.join(' ') || 'Registro salvo com sucesso!';
    healthFeedback.className = 'feedback feedback-success';

    renderizarGraficos();
    atualizarStats();
});

// ==================== TREINO (toggle rápido do dia) ====================
const btnTreino = document.getElementById('btnTreino');
const treinoStatus = document.getElementById('treinoStatus');

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

btnTreino.addEventListener('click', function () {
    const treinosSalvos = getJSON(STORAGE_KEYS.treinos, {});
    treinosSalvos[todayISO()] = treinoStatus.textContent !== 'Concluído';
    setJSON(STORAGE_KEYS.treinos, treinosSalvos);
    carregarStatusTreino();
    atualizarStats();
});

// ==================== DIÁRIO RÁPIDO ====================
const btnSalvarDiario = document.getElementById('btnSalvarDiario');
const textoDiario = document.getElementById('textoDiario');
const diarioFeedback = document.getElementById('diarioFeedback');

function carregarDiarioDeHoje() {
    const diariosSalvos = getJSON(STORAGE_KEYS.diarios, {});
    textoDiario.value = diariosSalvos[todayISO()] || '';
}

btnSalvarDiario.addEventListener('click', function () {
    const textoDigitado = textoDiario.value.trim();

    if (textoDigitado === '') {
        diarioFeedback.textContent = 'Escreva algo antes de salvar.';
        diarioFeedback.className = 'feedback feedback-error';
        return;
    }

    const diariosSalvos = getJSON(STORAGE_KEYS.diarios, {});
    diariosSalvos[todayISO()] = textoDigitado;
    setJSON(STORAGE_KEYS.diarios, diariosSalvos);

    diarioFeedback.textContent = 'Diário atualizado com sucesso! ✅';
    diarioFeedback.className = 'feedback feedback-success';

    atualizarStats();

    setTimeout(() => { diarioFeedback.textContent = ''; }, 3000);
});

// ==================== ESTATÍSTICAS RÁPIDAS ====================
function atualizarStats() {
    const profile = getJSON(STORAGE_KEYS.profile, null);
    const historicoPeso = getJSON(STORAGE_KEYS.peso, []);
    const treinos = getJSON(STORAGE_KEYS.treinos, {});
    const diarios = getJSON(STORAGE_KEYS.diarios, {});

    const pesoAtual = historicoPeso.length
        ? historicoPeso[historicoPeso.length - 1].peso
        : (profile ? parseFloat(profile.initialWeight) : null);

    document.getElementById('statPesoAtual').textContent = pesoAtual !== null ? `${pesoAtual}kg` : '--';

    if (profile && pesoAtual !== null) {
        const diferenca = pesoAtual - parseFloat(profile.initialWeight);
        const label = diferenca === 0
            ? 'Igual ao marco zero'
            : `${diferenca > 0 ? '+' : ''}${diferenca.toFixed(1)}kg desde o início`;
        document.getElementById('statPesoLabel').textContent = label;
    }

    document.getElementById('statStreak').textContent = `${calcularStreakAtual(treinos)} dias`;
    document.getElementById('statDiario').textContent = Object.keys(diarios).length;
}

// ==================== GRÁFICOS (CHART.JS) ====================
let graficoPeso, graficoCalorias;

function opcoesComuns() {
    const grid = corDoTema('--border-color');
    const texto = corDoTema('--text-secondary');
    return {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: texto }, grid: { color: grid } },
            y: { ticks: { color: texto }, grid: { color: grid } }
        }
    };
}

function renderizarGraficos() {
    const perfil = getJSON(STORAGE_KEYS.profile, null);
    if (!perfil) return;

    const accent = corDoTema('--accent');

    // ---- Gráfico de peso ----
    const historicoPeso = getJSON(STORAGE_KEYS.peso, []);
    const labelsPeso = [`Início (${formatDateBR(perfil.createdAt) || perfil.createdAt})`, ...historicoPeso.map(r => formatDateBR(r.data))];
    const valoresPeso = [parseFloat(perfil.initialWeight), ...historicoPeso.map(r => r.peso)];

    if (graficoPeso) graficoPeso.destroy();
    graficoPeso = new Chart(document.getElementById('graficoPeso').getContext('2d'), {
        type: 'line',
        data: {
            labels: labelsPeso,
            datasets: [{
                label: 'Peso (kg)',
                data: valoresPeso,
                borderColor: accent,
                backgroundColor: hexParaRgba(accent, 0.15),
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointRadius: 3
            }]
        },
        options: opcoesComuns()
    });

    // ---- Gráfico de calorias ----
    const historicoCalorias = getJSON(STORAGE_KEYS.calorias, []);
    const canvasCal = document.getElementById('graficoCalorias');

    if (graficoCalorias) graficoCalorias.destroy();

    if (!historicoCalorias.length) {
        return;
    }

    graficoCalorias = new Chart(canvasCal.getContext('2d'), {
        type: 'bar',
        data: {
            labels: historicoCalorias.map(r => formatDateBR(r.data)),
            datasets: [{
                label: 'Calorias (kcal)',
                data: historicoCalorias.map(r => r.calorias),
                backgroundColor: hexParaRgba(corDoTema('--success'), 0.6),
                borderRadius: 6
            }]
        },
        options: opcoesComuns()
    });
}

function hexParaRgba(cor, alpha) {
    // Aceita tanto '#rrggbb' quanto valores nomeados/rgb já resolvidos pelo navegador
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = cor;
    const normalizado = ctx.fillStyle; // sempre retorna em formato #rrggbb
    const r = parseInt(normalizado.slice(1, 3), 16);
    const g = parseInt(normalizado.slice(3, 5), 16);
    const b = parseInt(normalizado.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Re-renderiza os gráficos com as cores corretas ao trocar de tema
document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    setTimeout(renderizarGraficos, 0);
});

// ==================== INICIALIZAÇÃO DA PÁGINA ====================
checkProfile();
carregarStatusTreino();
carregarDiarioDeHoje();
renderizarGraficos();
atualizarStats();
