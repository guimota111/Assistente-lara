/* ──────────── History view ──────────── */
function renderHistory() {
    const days = Object.values(historyCache).sort((a, b) => b.date.localeCompare(a.date));
    if (days.length === 0) {
        return `<div class="empty-history">Nenhum dia registrado ainda.</div>`;
    }

    let allCases = 0, allSlides = 0, allPoints = 0;
    for (const day of days) {
        const s = calcDayStats(day);
        allCases += s.totalCases; allSlides += s.totalSlides; allPoints += s.totalPoints;
    }
    const totals = `
    <div class="history-totals">
        <div class="total-item"><div class="total-value">${days.length}</div><div class="total-label">Dias trabalhados</div></div>
        <div class="total-item"><div class="total-value">${allCases}</div><div class="total-label">Total de casos</div></div>
        <div class="total-item"><div class="total-value">${allSlides}</div><div class="total-label">Total de lâminas</div></div>
        <div class="total-item"><div class="total-value">${allPoints}</div><div class="total-label">Total de pontos</div></div>
    </div>`;

    const byYear = {};
    for (const day of days) {
        const [y, m] = day.date.split('-');
        if (!byYear[y]) byYear[y] = {};
        if (!byYear[y][m]) byYear[y][m] = [];
        byYear[y][m].push(day);
    }

    const yearBlocks = Object.keys(byYear).sort((a, b) => b - a).map(year => {
        const isYearOpen = expandedYears.has(year);
        let yCases = 0, ySlides = 0, yPoints = 0, yDays = 0;
        for (const m of Object.keys(byYear[year])) {
            for (const day of byYear[year][m]) {
                const s = calcDayStats(day);
                yCases += s.totalCases; ySlides += s.totalSlides; yPoints += s.totalPoints; yDays++;
            }
        }
        const monthBlocks = isYearOpen ? Object.keys(byYear[year]).sort((a, b) => b - a).map(month => {
            const monthKey = `${year}-${month}`;
            const isMonthOpen = expandedMonths.has(monthKey);
            const monthDays = byYear[year][month];
            let mCases = 0, mSlides = 0, mPoints = 0;
            for (const day of monthDays) {
                const s = calcDayStats(day);
                mCases += s.totalCases; mSlides += s.totalSlides; mPoints += s.totalPoints;
            }
            const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
                .toLocaleDateString('pt-BR', { month: 'long' });
            const mLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            const dayBlocks = isMonthOpen ? monthDays.map(renderHistoryDay).join('') : '';
            return `
            <div class="history-month">
                <div class="history-month-header" data-month="${monthKey}">
                    <div>
                        <div class="hmonth-name">${mLabel}</div>
                        <div class="hmonth-meta">${monthDays.length} dia${monthDays.length !== 1 ? 's' : ''} · ${mCases} caso${mCases !== 1 ? 's' : ''} · ${mSlides} lâminas · ${mPoints} pts</div>
                    </div>
                    <span class="hday-chevron${isMonthOpen ? ' open' : ''}">▼</span>
                </div>
                ${isMonthOpen ? `<div class="history-month-body">${dayBlocks}</div>` : ''}
            </div>`;
        }).join('') : '';

        return `
        <div class="history-year">
            <div class="history-year-header" data-year="${year}">
                <div>
                    <div class="hyear-label">${year}</div>
                    <div class="hyear-meta">${yDays} dia${yDays !== 1 ? 's' : ''} · ${yCases} caso${yCases !== 1 ? 's' : ''} · ${ySlides} lâminas · ${yPoints} pts</div>
                </div>
                <span class="hday-chevron${isYearOpen ? ' open' : ''}" style="color:rgba(255,255,255,0.8)">▼</span>
            </div>
            ${isYearOpen ? `<div class="history-year-body">${monthBlocks}</div>` : ''}
        </div>`;
    }).join('');

    return totals + yearBlocks;
}

function renderHistoryDay(day) {
    const s = calcDayStats(day);
    const isOpen = expandedDays.has(day.date);

    const header = `
    <div class="history-day-header" data-date="${day.date}">
        <div class="hday-left">
            <div class="hday-date">${formatDateShort(day.date)}</div>
            <div class="hday-meta">${s.totalCases} caso${s.totalCases !== 1 ? 's' : ''} · ${s.totalSlides} lâminas · ${s.totalPoints} pts</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
            <div class="hday-right">
                <div class="hday-cases">${s.totalCases} caso${s.totalCases !== 1 ? 's' : ''}</div>
                ${s.totalPoints > 0 ? `<div class="hday-time">${s.totalPoints} pts</div>` : ''}
            </div>
            <span class="hday-chevron${isOpen ? ' open' : ''}">▼</span>
            <button class="btn-delete-day" data-delete-day="${day.date}" title="Apagar este dia">✕</button>
        </div>
    </div>`;

    if (!isOpen) return `<div class="history-day">${header}</div>`;

    const allCases = getHistoryCases(day);
    const caseRows = [...allCases].reverse().map((c, ri) => {
        const origIdx = allCases.length - 1 - ri;
        const timeStr = c.time
            ? new Date(c.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : (c.endTime ? new Date(c.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--');
        return `
        <div class="hday-case-row">
            <span class="case-num">#${allCases.length - ri}${c.thirdParty ? ' <span class="badge-3rd">3°</span>' : ''}</span>
            ${c.type ? `<span class="case-type-label">${esc(c.type)}</span>` : '<span></span>'}
            <span class="case-slides">${c.slides} lâm.</span>
            ${c.points > 0 ? `<span class="case-points">${c.points} pts</span>` : '<span></span>'}
            <span class="case-time">${timeStr}</span>
            <button class="btn-delete" data-delete-hcase="${origIdx}" data-date="${day.date}" title="Apagar caso">✕</button>
        </div>`;
    }).join('');

    const statsRow = `
    <div class="hday-stats-row">
        <div class="hday-stat"><div class="hday-stat-val">${s.totalCases}</div><div class="hday-stat-lbl">Casos</div></div>
        <div class="hday-stat"><div class="hday-stat-val">${s.totalSlides}</div><div class="hday-stat-lbl">Lâminas</div></div>
        <div class="hday-stat"><div class="hday-stat-val">${s.totalPoints}</div><div class="hday-stat-lbl">Pontos</div></div>
        <div class="hday-stat"><div class="hday-stat-val">${s.ownTotalCases}</div><div class="hday-stat-lbl">Meus</div></div>
        <div class="hday-stat"><div class="hday-stat-val">${s.totalCases - s.ownTotalCases}</div><div class="hday-stat-lbl">Terceiros</div></div>
    </div>`;

    return `<div class="history-day">${header}<div class="history-day-body">${statsRow}<div class="session-cases-list">${caseRows}</div></div></div>`;
}
