/* ──────────── Events ──────────── */
function attachEvents() {
    document.getElementById('btnSignIn')?.addEventListener('click', signIn);
    document.getElementById('btnSignOut')?.addEventListener('click', doSignOut);

    document.getElementById('btnMenu')?.addEventListener('click', () => { menuOpen = true; renderRoot(); });
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => { menuOpen = false; renderRoot(); });
    document.getElementById('sideNavToday')?.addEventListener('click',     () => setView('today'));
    document.getElementById('sideNavTipos')?.addEventListener('click',     () => setView('tipos'));
    document.getElementById('sideNavHistory')?.addEventListener('click',   () => setView('history'));
    document.getElementById('sideNavRecords')?.addEventListener('click',   () => setView('records'));
    document.getElementById('sideNavStats')?.addEventListener('click',     () => setView('stats'));
    document.getElementById('sideNavPendencias')?.addEventListener('click',() => setView('pendencias'));

    // ── Today: type select auto-fills points ──
    document.getElementById('typeSelect')?.addEventListener('change', () => {
        const sel = document.getElementById('typeSelect');
        const opt = sel.options[sel.selectedIndex];
        const pts = parseInt(opt.dataset.pts) || 0;
        const pi = document.getElementById('pointsInput');
        if (pi) pi.value = pts;
    });

    // ── Today: go to tipos view from gear button ──
    document.getElementById('btnGoTipos')?.addEventListener('click', () => setView('tipos'));

    function getRegisterValues() {
        const type   = document.getElementById('typeSelect')?.value || '';
        const slides = Math.max(1, parseInt(document.getElementById('slidesInput')?.value) || 1);
        const points = Math.max(0, parseInt(document.getElementById('pointsInput')?.value) || 0);
        return { type, slides, points };
    }
    function resetForm() {
        setTimeout(() => {
            const si = document.getElementById('slidesInput'); if (si) { si.value = 1; }
            const pi = document.getElementById('pointsInput'); if (pi) pi.value = 0;
            // Reset type-based points
            const sel = document.getElementById('typeSelect');
            if (sel) {
                const opt = sel.options[sel.selectedIndex];
                if (pi) pi.value = parseInt(opt?.dataset.pts) || 0;
            }
        }, 50);
    }

    document.getElementById('btnCase')?.addEventListener('click', () => {
        const { type, slides, points } = getRegisterValues();
        registerCase(type, slides, points, false);
        resetForm();
    });
    document.getElementById('btnCase3rd')?.addEventListener('click', () => {
        const { type, slides, points } = getRegisterValues();
        registerCase(type, slides, points, true);
        resetForm();
    });
    document.getElementById('slidesInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btnCase')?.click();
    });
    document.getElementById('pointsInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btnCase')?.click();
    });

    // ── Today: delete current-day case ──
    document.querySelectorAll('.btn-delete[data-delete-case]').forEach(btn => {
        btn.addEventListener('click', () => deleteCase(parseInt(btn.dataset.deleteCase)));
    });

    // ── History ──
    document.querySelectorAll('.history-year-header').forEach(el => {
        el.addEventListener('click', () => {
            const y = el.dataset.year;
            if (expandedYears.has(y)) expandedYears.delete(y); else expandedYears.add(y);
            renderRoot();
        });
    });
    document.querySelectorAll('.history-month-header').forEach(el => {
        el.addEventListener('click', () => {
            const m = el.dataset.month;
            if (expandedMonths.has(m)) expandedMonths.delete(m); else expandedMonths.add(m);
            renderRoot();
        });
    });
    document.querySelectorAll('.history-day-header').forEach(el => {
        el.addEventListener('click', e => {
            if (e.target.closest('.btn-delete-day')) return;
            const date = el.dataset.date;
            if (expandedDays.has(date)) expandedDays.delete(date); else expandedDays.add(date);
            renderRoot();
        });
    });
    document.querySelectorAll('.btn-delete-day').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); deleteHistoryDay(btn.dataset.deleteDay); });
    });
    document.querySelectorAll('.btn-delete[data-delete-hcase]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteHistoryCase(btn.dataset.date, parseInt(btn.dataset.deleteHcase));
        });
    });

    // ── Stats ──
    document.querySelectorAll('.period-btn[data-period]').forEach(btn => {
        btn.addEventListener('click', () => { statsView = btn.dataset.period; renderRoot(); });
    });
    document.querySelectorAll('.period-btn[data-metric]').forEach(btn => {
        btn.addEventListener('click', () => { statsMetric = btn.dataset.metric; renderRoot(); });
    });
    document.querySelectorAll('.segment-chip[data-segment]').forEach(chip => {
        chip.addEventListener('click', () => { statsSegment = chip.dataset.segment; renderRoot(); });
    });

    // ── Tipos ──
    document.getElementById('btnAddTipo')?.addEventListener('click', async () => {
        if (!caseTypesCache) caseTypesCache = [];
        caseTypesCache.push({ id: Date.now().toString(), name: '', defaultPoints: 0 });
        await saveCaseTypes();
        renderRoot();
        // Focus the last name input
        setTimeout(() => {
            const inputs = document.querySelectorAll('.tipo-name-input');
            if (inputs.length) inputs[inputs.length - 1].focus();
        }, 50);
    });

    document.querySelectorAll('.tipo-name-input').forEach(input => {
        input.addEventListener('blur', async () => {
            const idx = parseInt(input.dataset.tipoIdx);
            caseTypesCache[idx].name = input.value.trim();
            await saveCaseTypes();
        });
    });

    document.querySelectorAll('.tipo-pts-input').forEach(input => {
        input.addEventListener('blur', async () => {
            const idx = parseInt(input.dataset.tipoIdx);
            caseTypesCache[idx].defaultPoints = Math.max(0, parseInt(input.value) || 0);
            await saveCaseTypes();
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { input.blur(); }
        });
    });

    document.querySelectorAll('.btn-delete-tipo').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.tipoDel);
            if (!confirm(`Apagar o tipo "${caseTypesCache[idx]?.name || 'sem nome'}"?`)) return;
            caseTypesCache.splice(idx, 1);
            await saveCaseTypes();
            renderRoot();
        });
    });

    // ── Pendências ──
    document.getElementById('btnAddPend')?.addEventListener('click', async () => {
        const opts = pendenciasCache.statusOptions;
        pendenciasCache.items.push({ name: '', status: opts[0] || 'Pendente', obs: '', updatedAt: new Date().toISOString() });
        await savePendencias();
        renderRoot();
    });
    document.querySelectorAll('.btn-delete-pend').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.pendDel);
            if (!confirm('Apagar esta pendência?')) return;
            pendenciasCache.items.splice(idx, 1);
            await savePendencias();
            renderRoot();
        });
    });
    document.querySelectorAll('.pend-input').forEach(input => {
        input.addEventListener('blur', async () => {
            const idx = parseInt(input.dataset.pendIdx);
            const field = input.dataset.pendField;
            if (idx === undefined || !field) return;
            pendenciasCache.items[idx][field] = input.value;
            pendenciasCache.items[idx].updatedAt = new Date().toISOString();
            await savePendencias();
            const dateEl = input.closest('.pend-row')?.querySelector('.pend-date-val');
            if (dateEl) dateEl.textContent = formatPendDate(pendenciasCache.items[idx].updatedAt);
        });
    });
    document.querySelectorAll('.pend-select').forEach(sel => {
        sel.addEventListener('change', async () => {
            const idx = parseInt(sel.dataset.pendIdx);
            if (sel.value === '__new__') {
                const novo = prompt('Nome do novo status:');
                if (novo && novo.trim()) {
                    const name = novo.trim();
                    if (!pendenciasCache.statusOptions.includes(name)) pendenciasCache.statusOptions.push(name);
                    pendenciasCache.items[idx].status = name;
                } else { sel.value = pendenciasCache.items[idx].status; return; }
            } else {
                pendenciasCache.items[idx].status = sel.value;
            }
            pendenciasCache.items[idx].updatedAt = new Date().toISOString();
            await savePendencias();
            renderRoot();
        });
    });
}
