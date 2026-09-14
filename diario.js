// ==================== LIFE OS — HISTÓRICO DO DIÁRIO (diario.html) ====================

const historicoContainer = document.getElementById('historicoContainer');

function carregarHistorico() {
    const diariosSalvos = getJSON(STORAGE_KEYS.diarios, {});
    const datas = Object.keys(diariosSalvos).sort().reverse(); // mais recente primeiro (ISO ordena corretamente)

    if (datas.length === 0) {
        historicoContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="book-open"></i>
                <p>Nenhum registro encontrado. Volte na Visão Geral e escreva seu primeiro diário!</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    historicoContainer.innerHTML = datas.map(iso => `
        <div class="entry-card" data-iso="${iso}">
            <div class="entry-card-header">
                <h3>📅 ${nomeDoDia(iso)}, ${formatDateBR(iso)}</h3>
                <div class="entry-card-actions">
                    <button type="button" class="icon-btn btn-editar" title="Editar"><i data-lucide="pencil"></i></button>
                    <button type="button" class="icon-btn btn-excluir" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
            <p class="entry-texto">${escaparHTML(diariosSalvos[iso])}</p>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();

    historicoContainer.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => iniciarEdicao(btn.closest('.entry-card')));
    });
    historicoContainer.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', () => excluirRegistro(btn.closest('.entry-card').dataset.iso));
    });
}

function iniciarEdicao(card) {
    const iso = card.dataset.iso;
    const diariosSalvos = getJSON(STORAGE_KEYS.diarios, {});
    const textoAtual = diariosSalvos[iso] || '';

    card.querySelector('.entry-card-header').innerHTML = `
        <h3>📅 ${nomeDoDia(iso)}, ${formatDateBR(iso)}</h3>
    `;

    const pTexto = card.querySelector('.entry-texto');
    pTexto.outerHTML = `
        <textarea class="edit-textarea" rows="4">${escaparHTML(textoAtual)}</textarea>
        <div class="settings-actions-row" style="margin-top: 10px;">
            <button type="button" class="btn btn-primary btn-sm btn-salvar-edicao">Salvar</button>
            <button type="button" class="btn btn-ghost btn-sm btn-cancelar-edicao">Cancelar</button>
        </div>
    `;

    card.querySelector('.btn-salvar-edicao').addEventListener('click', () => {
        const novoTexto = card.querySelector('.edit-textarea').value.trim();
        if (!novoTexto) return;
        const diarios = getJSON(STORAGE_KEYS.diarios, {});
        diarios[iso] = novoTexto;
        setJSON(STORAGE_KEYS.diarios, diarios);
        carregarHistorico();
    });

    card.querySelector('.btn-cancelar-edicao').addEventListener('click', carregarHistorico);
}

function excluirRegistro(iso) {
    if (!confirm(`Excluir o registro de ${formatDateBR(iso)}? Esta ação não pode ser desfeita.`)) return;
    const diarios = getJSON(STORAGE_KEYS.diarios, {});
    delete diarios[iso];
    setJSON(STORAGE_KEYS.diarios, diarios);
    carregarHistorico();
}

carregarHistorico();
