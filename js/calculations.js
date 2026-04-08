/* ──────────── Stats ──────────── */
function getStats() {
    const totalCases  = data.cases.length;
    const totalSlides = data.cases.reduce((a, c) => a + c.slides, 0);
    const totalPoints = data.cases.reduce((a, c) => a + (c.points || 0), 0);
    return { totalCases, totalSlides, totalPoints };
}
