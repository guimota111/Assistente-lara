/* ──────────── Data defaults ──────────── */
function defaultData() {
    return {
        date: todayStr(),
        cases: [],
    };
}

/* ──────────── State ──────────── */
let data         = defaultData();
let currentUser  = null;
let authReady    = false;
let currentView  = 'today';
let expandedYears    = new Set();
let expandedMonths   = new Set();
let expandedDays     = new Set();
let historyCache     = null;
let menuOpen         = false;
let statsView        = 'week';
let statsSegment     = 'all';
let statsMetric      = 'cases';
let pendenciasCache  = null;
let caseTypesCache   = null; // [{ id, name, defaultPoints }]
