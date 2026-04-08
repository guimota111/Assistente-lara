/* ──────────── Today view ──────────── */
function renderToday() {
    const s = getStats();
    return `
    <div class="today-simple">
        ${renderRegisterCard(s)}
        ${renderCasesList()}
    </div>`;
}

function renderRegisterCard(s) {
    const types = caseTypesCache || [];
    const typeOptions = types.map(t =>
        `<option value="${esc(t.name)}" data-pts="${t.defaultPoints}">${esc(t.name)} · ${t.defaultPoints} pt${t.defaultPoints !== 1 ? 's' : ''}</option>`
    ).join('');

    return `
    <div class="card register-card">
        <div class="register-summary">
            <div class="rsumm-item">
                <span class="rsumm-val">${s.totalCases}</span>
                <span class="rsumm-lbl">Casos</span>
            </div>
            <div class="rsumm-sep">·</div>
            <div class="rsumm-item">
                <span class="rsumm-val">${s.totalSlides}</span>
                <span class="rsumm-lbl">Lâminas</span>
            </div>
            <div class="rsumm-sep">·</div>
            <div class="rsumm-item">
                <span class="rsumm-val">${s.totalPoints}</span>
                <span class="rsumm-lbl">Pontos</span>
            </div>
        </div>

        <div class="register-form">
            <div class="register-row">
                <label for="typeSelect">Tipo</label>
                <div class="type-select-wrap">
                    <select id="typeSelect">
                        <option value="" data-pts="0">— Sem tipo —</option>
                        ${typeOptions}
                    </select>
                    <button class="btn-icon" id="btnGoTipos" title="Gerenciar tipos de caso">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>
                    </button>
                </div>
            </div>
            <div class="register-row">
                <label for="slidesInput">Lâminas</label>
                <input class="num-input" type="number" id="slidesInput" min="1" value="1">
                <label for="pointsInput">Pontos</label>
                <input class="num-input" type="number" id="pointsInput" min="0" value="0">
            </div>
            <div class="register-area-btns">
                <button class="btn btn-success btn-lg" id="btnCase">Registrar Caso</button>
                <button class="btn btn-outline" id="btnCase3rd" title="Caso de segunda assinatura">+ Terceiro</button>
            </div>
        </div>
    </div>`;
}

function renderCasesList() {
    const count = data.cases.length;
    const title = `<div class="card cases-card"><h2>Casos de hoje${count > 0 ? ' (' + count + ')' : ''}</h2>`;
    if (count === 0) return title + `<div class="empty-cases">Nenhum caso registrado ainda.</div></div>`;

    const rows = [...data.cases].reverse().map(c => {
        const timeStr = new Date(c.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `
        <div class="case-item">
            <div class="case-item-left">
                <span class="case-num">#${c.id}${c.thirdParty ? ' <span class="badge-3rd">3°</span>' : ''}</span>
                ${c.type ? `<span class="case-type-label">${esc(c.type)}</span>` : ''}
            </div>
            <div class="case-item-right">
                <span class="case-slides">${c.slides} lâm.</span>
                ${c.points > 0 ? `<span class="case-points">${c.points} pts</span>` : ''}
                <span class="case-time">${timeStr}</span>
                <button class="btn-delete" data-delete-case="${c.id}" title="Apagar caso">✕</button>
            </div>
        </div>`;
    }).join('');

    return title + `<div class="case-list">${rows}</div></div>`;
}
