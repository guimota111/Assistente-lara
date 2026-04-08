/* ──────────── Actions ──────────── */
function registerCase(type, slides, points, thirdParty = false) {
    const entry = {
        id: data.cases.length + 1,
        type: type || '',
        slides,
        points: points || 0,
        time: new Date().toISOString(),
    };
    if (thirdParty) entry.thirdParty = true;
    data.cases.push(entry);
    saveData();
    renderRoot();
}

function deleteCase(caseId) {
    if (!confirm('Apagar este caso?')) return;
    data.cases = data.cases.filter(c => c.id !== caseId);
    data.cases.forEach((c, i) => c.id = i + 1);
    saveData();
    renderRoot();
}

async function deleteHistoryDay(date) {
    const label = formatDateShort(date);
    if (!confirm(`Apagar o dia "${label}" do histórico?`)) return;
    try {
        await historyRef(date).delete();
        if (historyCache) delete historyCache[date];
        expandedDays.delete(date);
        renderRoot();
    } catch (e) {
        console.warn('deleteHistoryDay:', e);
        alert('Erro ao apagar o dia.');
    }
}

async function deleteHistoryCase(date, flatCaseIdx) {
    if (!confirm('Apagar este caso?')) return;
    try {
        const snap = await historyRef(date).get();
        if (!snap.exists) return;
        const d = snap.data();
        if (d.sessions) {
            // Legacy format: find case by flat index across sessions
            const sessions = d.sessions.map(s => ({ ...s, cases: [...(s.cases || [])] }));
            let idx = flatCaseIdx;
            for (const s of sessions) {
                if (idx < s.cases.length) { s.cases.splice(idx, 1); break; }
                idx -= s.cases.length;
            }
            await historyRef(date).set({ date, sessions });
            if (historyCache) historyCache[date] = { date, sessions };
        } else {
            const cases = [...(d.cases || [])];
            cases.splice(flatCaseIdx, 1);
            await historyRef(date).set({ date, cases });
            if (historyCache) historyCache[date] = { date, cases };
        }
        renderRoot();
    } catch (e) {
        console.warn('deleteHistoryCase:', e);
        alert('Erro ao apagar o caso.');
    }
}
