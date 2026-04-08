/* ──────────── Firestore refs ──────────── */
function currentRef()     { return db.collection('users').doc(currentUser.uid).collection('data').doc('current'); }
function historyRef(date) { return db.collection('users').doc(currentUser.uid).collection('history').doc(date); }
function historyCollRef() { return db.collection('users').doc(currentUser.uid).collection('history'); }
function caseTypesRef()   { return db.collection('users').doc(currentUser.uid).collection('config').doc('caseTypes'); }

/* ──────────── Data operations ──────────── */
async function initData() {
    try {
        const doc = await currentRef().get();
        if (doc.exists) {
            const d = doc.data();
            if (d.date !== todayStr()) {
                // Day changed: save old data to history and reset
                const oldCases = d.cases || (d.sessions || []).flatMap(s => s.cases || []);
                if (oldCases.length > 0) await saveToHistory({ date: d.date, cases: oldCases });
                data = defaultData();
                saveData();
            } else {
                // Normalize legacy format (sessions-based) to flat cases
                if (d.sessions && !d.cases) {
                    data = { date: d.date, cases: d.sessions.flatMap(s => s.cases || []) };
                    saveData();
                } else {
                    data = { date: d.date, cases: d.cases || [] };
                }
            }
        } else {
            data = defaultData();
            saveData();
        }
    } catch (e) {
        console.warn('initData:', e);
        data = defaultData();
    }
}

function saveData() {
    if (!currentUser) return;
    currentRef().set(data).catch(e => console.warn('saveData:', e));
}

async function saveToHistory(dayData) {
    if (!currentUser || !(dayData.cases || []).length) return;
    historyCache = null;
    try {
        const existing = await historyRef(dayData.date).get();
        if (existing.exists) {
            const d = existing.data();
            // Merge existing cases (handle both legacy sessions format and flat format)
            const existingCases = d.cases || (d.sessions || []).flatMap(s => s.cases || []);
            const merged = [...existingCases, ...dayData.cases];
            await historyRef(dayData.date).set({ date: dayData.date, cases: merged });
        } else {
            await historyRef(dayData.date).set({ date: dayData.date, cases: dayData.cases });
        }
    } catch (e) { console.warn('saveToHistory:', e); }
}

async function loadHistory() {
    if (historyCache) return historyCache;
    if (!currentUser) return {};
    try {
        const snap = await historyCollRef().get();
        historyCache = {};
        snap.forEach(doc => { historyCache[doc.id] = doc.data(); });
    } catch (e) {
        console.warn('loadHistory:', e);
        historyCache = {};
    }
    return historyCache;
}

/* ──────────── Case types ──────────── */
async function loadCaseTypes() {
    if (caseTypesCache !== null) return caseTypesCache;
    if (!currentUser) { caseTypesCache = []; return caseTypesCache; }
    try {
        const doc = await caseTypesRef().get();
        caseTypesCache = doc.exists ? (doc.data().types || []) : [];
    } catch(e) {
        console.warn('loadCaseTypes:', e);
        caseTypesCache = [];
    }
    return caseTypesCache;
}

async function saveCaseTypes() {
    if (!currentUser) return;
    await caseTypesRef().set({ types: caseTypesCache || [] }).catch(e => console.warn('saveCaseTypes:', e));
}

/* ──────────── Stats calculation ──────────── */
function getHistoryCases(day) {
    return day.cases || (day.sessions || []).flatMap(s => s.cases || []);
}

function calcDayStats(day) {
    const allCases   = getHistoryCases(day);
    const ownCases   = allCases.filter(c => !c.thirdParty);
    return {
        totalCases:    allCases.length,
        ownTotalCases: ownCases.length,
        totalSlides:   allCases.reduce((a, c) => a + c.slides, 0),
        ownTotalSlides: ownCases.reduce((a, c) => a + c.slides, 0),
        totalPoints:   allCases.reduce((a, c) => a + (c.points || 0), 0),
        // Keep totalCasesMs / ownCasesMs for legacy history data that has duration
        totalCasesMs:  allCases.reduce((a, c) => a + (c.duration || 0), 0),
        ownCasesMs:    ownCases.reduce((a, c) => a + (c.duration || 0), 0),
        allCases,
    };
}
