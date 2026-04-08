/* ──────────── Init ──────────── */
auth.onAuthStateChanged(async user => {
    currentUser = user;
    authReady   = true;
    if (user) {
        await initData();
        // Load case types synchronously so the form is ready
        await loadCaseTypes();
        renderRoot();
        // Load history in background for stats/records/history views
        if (!historyCache) loadHistory().then(() => renderRoot()).catch(() => {});
    } else {
        data = defaultData();
        renderRoot();
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Assistente-lara/sw.js', {
            scope: '/Assistente-lara/'
        }).catch(() => {});
    });
}
