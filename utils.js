// ==================== LIFE OS — UTILITÁRIOS COMPARTILHADOS ====================
// Chaves de armazenamento (localStorage)
const STORAGE_KEYS = {
    profile: 'lifeOS_profile',
    peso: 'lifeOS_historicoPeso',
    calorias: 'lifeOS_historicoCalorias',
    treinos: 'lifeOS_treinos',
    diarios: 'lifeOS_diarios',
    planoTreino: 'lifeOS_planoTreino',
    theme: 'lifeOS_theme'
};

// ---------- Helpers de armazenamento ----------
function getJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Helpers de data ----------
// Datas são guardadas internamente em ISO (YYYY-MM-DD) para permitir
// ordenação e comparação corretas. A exibição usa o formato brasileiro.
function pad(n) {
    return String(n).padStart(2, '0');
}

function isoFromDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
    return isoFromDate(new Date());
}

function formatDateBR(iso) {
    if (!iso || iso.indexOf('-') === -1) return iso;
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function parseBRtoISO(br) {
    const [d, m, y] = br.split('/');
    return `${y}-${pad(m)}-${pad(d)}`;
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function nomeDoDia(iso) {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const [y, m, d] = iso.split('-').map(Number);
    return dias[new Date(y, m - 1, d).getDay()];
}

// Converte dados antigos gravados com chave "dd/mm/aaaa" para o novo
// formato ISO, preservando qualquer registro já existente do usuário.
function migrarDatasLegadas() {
    const brDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    [STORAGE_KEYS.treinos, STORAGE_KEYS.diarios].forEach(key => {
        const obj = getJSON(key, null);
        if (!obj || Array.isArray(obj)) return;
        let migrou = false;
        const novo = {};
        for (const k of Object.keys(obj)) {
            if (brDateRegex.test(k)) {
                novo[parseBRtoISO(k)] = obj[k];
                migrou = true;
            } else {
                novo[k] = obj[k];
            }
        }
        if (migrou) setJSON(key, novo);
    });

    [STORAGE_KEYS.peso, STORAGE_KEYS.calorias].forEach(key => {
        const arr = getJSON(key, null);
        if (!Array.isArray(arr)) return;
        let migrou = false;
        const novo = arr.map(item => {
            if (item && item.data && brDateRegex.test(item.data)) {
                migrou = true;
                return { ...item, data: parseBRtoISO(item.data) };
            }
            return item;
        });
        if (migrou) setJSON(key, novo);
    });
}

// Insere ou atualiza (sem duplicar) o registro do dia em um histórico
// no formato [{ data: 'YYYY-MM-DD', valor }].
function upsertHistoricoDoDia(chaveStorage, campoValor, valor, dataISO = todayISO()) {
    const historico = getJSON(chaveStorage, []);
    const idx = historico.findIndex(item => item.data === dataISO);
    if (idx >= 0) {
        historico[idx][campoValor] = valor;
    } else {
        historico.push({ data: dataISO, [campoValor]: valor });
    }
    historico.sort((a, b) => a.data.localeCompare(b.data));
    setJSON(chaveStorage, historico);
    return historico;
}

// ---------- Sequências (streaks) de treino ----------
function calcularStreakAtual(treinos) {
    const cursor = new Date();
    if (!treinos[isoFromDate(cursor)]) {
        cursor.setDate(cursor.getDate() - 1);
    }
    let streak = 0;
    while (treinos[isoFromDate(cursor)]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function calcularMelhorStreak(treinos) {
    const dias = Object.keys(treinos).filter(k => treinos[k]).sort();
    if (!dias.length) return 0;
    let melhor = 1;
    let atual = 1;
    for (let i = 1; i < dias.length; i++) {
        const diffDias = (new Date(dias[i]) - new Date(dias[i - 1])) / 86400000;
        if (diffDias === 1) {
            atual++;
        } else if (diffDias > 1) {
            atual = 1;
        }
        melhor = Math.max(melhor, atual);
    }
    return melhor;
}

// ---------- Tema (claro / escuro / sistema) ----------
function resolverTema(preferencia) {
    if (preferencia === 'system' || !preferencia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preferencia;
}

function aplicarTema(preferencia) {
    document.documentElement.setAttribute('data-theme', resolverTema(preferencia));
}

function initTheme() {
    const preferencia = localStorage.getItem(STORAGE_KEYS.theme) || 'system';
    aplicarTema(preferencia);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const pref = localStorage.getItem(STORAGE_KEYS.theme) || 'system';
        if (pref === 'system') aplicarTema(pref);
    });
}

function alternarTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const proximo = atual === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.theme, proximo);
    document.documentElement.setAttribute('data-theme', proximo);
    atualizarIconeTema();
}

function atualizarIconeTema() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const theme = document.documentElement.getAttribute('data-theme');
    btn.innerHTML = theme === 'dark'
        ? '<i data-lucide="sun"></i>'
        : '<i data-lucide="moon"></i>';
    if (window.lucide) lucide.createIcons();
}

function initThemeToggleButton() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    atualizarIconeTema();
    btn.addEventListener('click', alternarTema);
}

// ---------- Navegação mobile (sidebar retrátil) ----------
function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const close = document.getElementById('sidebarClose');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('navOverlay');
    if (!sidebar) return;

    const abrir = () => {
        sidebar.classList.add('open');
        overlay?.classList.add('visible');
    };
    const fechar = () => {
        sidebar.classList.remove('open');
        overlay?.classList.remove('visible');
    };

    toggle?.addEventListener('click', abrir);
    close?.addEventListener('click', fechar);
    overlay?.addEventListener('click', fechar);
}

// ---------- Exportar / Importar dados ----------
function exportarDados() {
    const dados = { _exportadoEm: new Date().toISOString() };
    Object.values(STORAGE_KEYS).forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null) {
            try {
                dados[key] = JSON.parse(val);
            } catch (e) {
                dados[key] = val;
            }
        }
    });

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function importarDados(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dados = JSON.parse(e.target.result);
            const chavesValidas = Object.values(STORAGE_KEYS);
            let importou = false;
            Object.entries(dados).forEach(([key, value]) => {
                if (chavesValidas.includes(key)) {
                    localStorage.setItem(key, JSON.stringify(value));
                    importou = true;
                }
            });
            callback(importou, null);
        } catch (err) {
            callback(false, err);
        }
    };
    reader.onerror = () => callback(false, reader.error);
    reader.readAsText(file);
}

function limparTodosDados() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

// ---------- Inicialização comum a todas as páginas ----------
// utils.js é sempre carregado (via <script> no fim do <body>) antes do script
// específico de cada página, então rodamos isto de forma síncrona e direta
// (sem esperar DOMContentLoaded) para garantir que a migração de dados
// aconteça antes que a página seguinte leia o localStorage.
migrarDatasLegadas();
initMobileNav();
initThemeToggleButton();
if (window.lucide) lucide.createIcons();
