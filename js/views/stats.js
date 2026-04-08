/* ──────────── Stats view ──────────── */
function renderStats() {
    if (!historyCache) return '<div style="text-align:center;padding:40px;color:var(--text-muted)">Carregando...</div>';

    const allDays = Object.values(historyCache).sort((a, b) => a.date.localeCompare(b.date));
    const now2  = new Date();
    const today = todayStr();

    function inPeriod(dateStr) {
        if (statsView === 'all') return true;
        const d = new Date(dateStr + 'T12:00:00');
        if (statsView === 'week') {
            const weekAgo = new Date(now2); weekAgo.setDate(weekAgo.getDate() - 6);
            return d >= weekAgo;
        }
        if (statsView === 'month') return dateStr.slice(0, 7) === today.slice(0, 7);
        if (statsView === 'year')  return dateStr.slice(0, 4) === today.slice(0, 4);
        return true;
    }

    const filtered = allDays.filter(d => inPeriod(d.date));
    const dayStats = filtered.map(d => ({ date: d.date, ...calcDayStats(d) }));

    let totalCases = 0, totalSlides = 0, totalPoints = 0;
    let totalOwnC = 0, totalThirdC = 0;
    let totalOwnS = 0, totalThirdS = 0;
    for (const d of dayStats) {
        totalOwnC   += d.ownTotalCases;
        totalThirdC += d.totalCases - d.ownTotalCases;
        totalOwnS   += d.ownTotalSlides;
        totalThirdS += d.totalSlides - d.ownTotalSlides;
        totalPoints += d.totalPoints;
        if (statsSegment === 'own') {
            totalCases += d.ownTotalCases; totalSlides += d.ownTotalSlides;
        } else if (statsSegment === 'third') {
            totalCases += d.totalCases - d.ownTotalCases; totalSlides += d.totalSlides - d.ownTotalSlides;
        } else {
            totalCases += d.totalCases; totalSlides += d.totalSlides;
        }
    }

    const periodLabels = { week: 'Esta Semana', month: 'Este Mês', year: 'Este Ano', all: 'Geral' };
    const periodTabs = ['week', 'month', 'year', 'all'].map(p =>
        `<button class="period-btn${statsView === p ? ' active' : ''}" data-period="${p}">${periodLabels[p]}</button>`
    ).join('');

    function segVal(f) {
        if (!f) return 0;
        if (statsMetric === 'slides') {
            if (statsSegment === 'own')   return f.ownTotalSlides;
            if (statsSegment === 'third') return f.totalSlides - f.ownTotalSlides;
            return f.totalSlides;
        }
        if (statsMetric === 'points') return f.totalPoints;
        if (statsSegment === 'own')   return f.ownTotalCases;
        if (statsSegment === 'third') return f.totalCases - f.ownTotalCases;
        return f.totalCases;
    }

    let chartItems = [];
    if (statsView === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now2); d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const f = dayStats.find(x => x.date === ds);
            const lbl = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','');
            const ownV   = f ? (statsMetric === 'slides' ? f.ownTotalSlides : statsMetric === 'points' ? f.totalPoints : f.ownTotalCases) : 0;
            const thirdV = f ? (statsMetric === 'slides' ? f.totalSlides - f.ownTotalSlides : statsMetric === 'points' ? 0 : f.totalCases - f.ownTotalCases) : 0;
            chartItems.push({ lbl, val: segVal(f), own: ownV, third: thirdV });
        }
    } else if (statsView === 'month') {
        const year = now2.getFullYear(), month = now2.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const f = dayStats.find(x => x.date === ds);
            const lbl = (i === 1 || i % 5 === 0) ? String(i) : '';
            const ownV   = f ? (statsMetric === 'slides' ? f.ownTotalSlides : statsMetric === 'points' ? f.totalPoints : f.ownTotalCases) : 0;
            const thirdV = f ? (statsMetric === 'slides' ? f.totalSlides - f.ownTotalSlides : statsMetric === 'points' ? 0 : f.totalCases - f.ownTotalCases) : 0;
            chartItems.push({ lbl, val: segVal(f), own: ownV, third: thirdV });
        }
    } else {
        const mMap = {};
        for (const d of dayStats) {
            const mk = d.date.slice(0, 7);
            if (!mMap[mk]) mMap[mk] = { own: 0, third: 0, pts: 0 };
            mMap[mk].own   += statsMetric === 'slides' ? d.ownTotalSlides : d.ownTotalCases;
            mMap[mk].third += statsMetric === 'slides' ? d.totalSlides - d.ownTotalSlides : d.totalCases - d.ownTotalCases;
            mMap[mk].pts   += d.totalPoints;
        }
        for (const [mk, v] of Object.entries(mMap).sort()) {
            const [y, m] = mk.split('-');
            const lbl = new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.','');
            const val = statsMetric === 'points' ? v.pts : statsSegment === 'own' ? v.own : statsSegment === 'third' ? v.third : v.own + v.third;
            chartItems.push({ lbl, val, own: v.own, third: v.third });
        }
    }

    const maxVal = Math.max(...chartItems.map(c => c.val), 1);
    const isAll = statsSegment === 'all' && statsMetric !== 'points';
    const bars = chartItems.map(ci => {
        const hPct     = Math.round((ci.val   / maxVal) * 90);
        const ownPct   = Math.round((ci.own   / maxVal) * 90);
        const thirdPct = Math.round((ci.third / maxVal) * 90);
        let barHTML, valHTML;

        if (isAll && ci.own + ci.third > 0) {
            barHTML = `<div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:1px;justify-content:flex-end;height:${hPct}px;">
                ${ci.third > 0 ? `<div class="chart-bar secondary" style="height:${Math.max(thirdPct,2)}px;"></div>` : ''}
                ${ci.own   > 0 ? `<div class="chart-bar" style="height:${Math.max(ownPct,2)}px;"></div>` : ''}
            </div>`;
            if (ci.own > 0 && ci.third > 0) {
                valHTML = `<div class="chart-val-stack"><span style="color:var(--primary)">${ci.own}</span><span style="color:#ca8a04">${ci.third}</span></div>`;
            } else {
                valHTML = ci.val > 0 ? `<div class="chart-val">${ci.val}</div>` : '';
            }
        } else {
            const barClass = statsMetric === 'points' ? ' pts' : statsSegment === 'third' ? ' secondary' : '';
            barHTML = `<div class="chart-bar${barClass}" style="height:${Math.max(hPct, ci.val > 0 ? 2 : 0)}px;"></div>`;
            valHTML = ci.val > 0 ? `<div class="chart-val">${ci.val}</div>` : '';
        }
        return `<div class="chart-col">${valHTML}${barHTML}<div class="chart-lbl">${ci.lbl}</div></div>`;
    }).join('');

    const legendHTML = isAll ? `<div class="chart-legend">
        <div class="legend-item"><div class="legend-dot" style="background:var(--primary)"></div>Meus</div>
        <div class="legend-item"><div class="legend-dot" style="background:#ca8a04"></div>Terceiros</div>
    </div>` : '';

    const metricToggleHTML = `
        <div class="stats-period-tabs">
            <button class="period-btn${statsMetric === 'cases'  ? ' active' : ''}" data-metric="cases">Casos</button>
            <button class="period-btn${statsMetric === 'slides' ? ' active' : ''}" data-metric="slides">Lâminas</button>
            <button class="period-btn${statsMetric === 'points' ? ' active' : ''}" data-metric="points">Pontos</button>
        </div>`;

    const metricLabel = statsMetric === 'points' ? 'Pontos' : statsMetric === 'slides' ? 'Lâminas' : 'Casos';

    return `
    <div class="stats-period-tabs-row">
        <div class="stats-period-tabs" style="margin-right:auto">${periodTabs}</div>
        ${metricToggleHTML}
    </div>
    ${statsMetric !== 'points' ? `
    <div class="stats-segment-row">
        <div class="segment-chip${statsSegment === 'all'   ? ' active' : ''}" data-segment="all">
            <div class="sc-val">${statsMetric === 'slides' ? totalOwnS + totalThirdS : totalOwnC + totalThirdC}</div>
            <div class="sc-lbl">Todos</div>
        </div>
        <div class="segment-chip${statsSegment === 'own'   ? ' active' : ''}" data-segment="own">
            <div class="sc-val">${statsMetric === 'slides' ? totalOwnS : totalOwnC}</div>
            <div class="sc-lbl">Meus</div>
        </div>
        <div class="segment-chip${statsSegment === 'third' ? ' active' : ''}" data-segment="third">
            <div class="sc-val">${statsMetric === 'slides' ? totalThirdS : totalThirdC}</div>
            <div class="sc-lbl">Terceiros</div>
        </div>
    </div>` : ''}
    <div class="stats-summary-grid">
        <div class="stats-summary-item"><div class="ssi-value">${totalOwnC + totalThirdC}</div><div class="ssi-label">Casos</div></div>
        <div class="stats-summary-item"><div class="ssi-value">${totalOwnS + totalThirdS}</div><div class="ssi-label">Lâminas</div></div>
        <div class="stats-summary-item"><div class="ssi-value">${totalPoints}</div><div class="ssi-label">Pontos</div></div>
        <div class="stats-summary-item"><div class="ssi-value">${dayStats.length}</div><div class="ssi-label">Dias</div></div>
        <div class="stats-summary-item"><div class="ssi-value">${totalOwnC}</div><div class="ssi-label">Meus casos</div></div>
        <div class="stats-summary-item"><div class="ssi-value">${totalThirdC}</div><div class="ssi-label">Terceiros</div></div>
    </div>
    <div class="chart-wrap">
        <div class="chart-title">${metricLabel} por período</div>
        <div class="chart-bars">${bars}</div>
        ${legendHTML}
    </div>`;
}
