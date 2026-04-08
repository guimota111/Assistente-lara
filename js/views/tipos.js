/* ──────────── Tipos de caso ──────────── */
function renderTipos() {
    const types = caseTypesCache || [];

    const rows = types.length === 0
        ? `<div class="empty-tipos">Nenhum tipo cadastrado ainda.</div>`
        : types.map((t, i) => `
        <div class="tipo-row">
            <input class="tipo-name-input pend-input" type="text"
                value="${esc(t.name)}"
                data-tipo-idx="${i}" data-tipo-field="name"
                placeholder="Nome do tipo">
            <div class="tipo-pts-wrap">
                <input class="tipo-pts-input num-input" type="number" min="0"
                    value="${t.defaultPoints}"
                    data-tipo-idx="${i}" data-tipo-field="defaultPoints">
                <span class="tipo-pts-label">pts padrão</span>
            </div>
            <button class="btn-delete-tipo btn-delete" data-tipo-del="${i}" title="Apagar tipo">✕</button>
        </div>`).join('');

    return `
    <div class="card tipos-card">
        <p class="tipos-desc">Cadastre os tipos de caso com pontuação padrão. Ao registrar um caso, a pontuação é preenchida automaticamente mas pode ser alterada.</p>
        <div class="tipos-list" id="tiposList">${rows}</div>
        <button class="btn btn-primary" id="btnAddTipo">+ Novo Tipo</button>
    </div>`;
}
