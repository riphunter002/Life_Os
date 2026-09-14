// ==================== LIFE OS — CONFIGURAÇÕES (configuracoes.html) ====================

// ==================== PERFIL ====================
const profileEditForm = document.getElementById('profileEditForm');
const profileFeedback = document.getElementById('profileFeedback');

function carregarPerfilNoForm() {
    const perfil = getJSON(STORAGE_KEYS.profile, null);
    if (!perfil) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('editUserName').value = perfil.name;
    document.getElementById('editUserHeight').value = perfil.height;
    document.getElementById('editUserInitialWeight').value = perfil.initialWeight;
}

profileEditForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const perfil = getJSON(STORAGE_KEYS.profile, {});

    perfil.name = document.getElementById('editUserName').value;
    perfil.height = document.getElementById('editUserHeight').value;
    perfil.initialWeight = document.getElementById('editUserInitialWeight').value;
    if (!perfil.createdAt) perfil.createdAt = todayISO();

    setJSON(STORAGE_KEYS.profile, perfil);

    profileFeedback.textContent = 'Perfil atualizado com sucesso! ✅';
    profileFeedback.className = 'feedback feedback-success';
    setTimeout(() => { profileFeedback.textContent = ''; }, 3000);
});

// ==================== APARÊNCIA ====================
const themeRadioGroup = document.getElementById('themeRadioGroup');

function marcarTemaAtivo() {
    const preferencia = localStorage.getItem(STORAGE_KEYS.theme) || 'system';
    themeRadioGroup.querySelectorAll('.radio-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.value === preferencia);
    });
}

themeRadioGroup.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
        const valor = opt.dataset.value;
        localStorage.setItem(STORAGE_KEYS.theme, valor);
        aplicarTema(valor);
        atualizarIconeTema();
        marcarTemaAtivo();
    });
});

// ==================== DADOS: EXPORTAR / IMPORTAR / LIMPAR ====================
const dadosFeedback = document.getElementById('dadosFeedback');

document.getElementById('btnExportar').addEventListener('click', exportarDados);

const inputImportar = document.getElementById('btnImportar');
document.getElementById('btnImportarTrigger').addEventListener('click', () => inputImportar.click());

inputImportar.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (!confirm('Importar este backup irá substituir os dados atuais que tiverem o mesmo tipo (perfil, diário, treinos, histórico). Deseja continuar?')) {
        this.value = '';
        return;
    }

    importarDados(file, (sucesso) => {
        if (sucesso) {
            dadosFeedback.textContent = 'Backup importado com sucesso! Recarregando...';
            dadosFeedback.className = 'feedback feedback-success';
            setTimeout(() => window.location.reload(), 1200);
        } else {
            dadosFeedback.textContent = 'Não foi possível importar este arquivo. Verifique se é um backup válido do Life OS.';
            dadosFeedback.className = 'feedback feedback-error';
        }
    });

    this.value = '';
});

document.getElementById('btnLimparDados').addEventListener('click', () => {
    if (!confirm('Tem certeza? Todos os dados do Life OS neste navegador serão apagados permanentemente.')) return;
    if (!confirm('Última confirmação: essa ação não pode ser desfeita. Apagar tudo mesmo?')) return;

    limparTodosDados();
    window.location.href = 'index.html';
});

// ==================== INICIALIZAÇÃO ====================
carregarPerfilNoForm();
marcarTemaAtivo();
