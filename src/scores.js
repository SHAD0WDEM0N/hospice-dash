/* Storage stays small, and older Hospice Dash personal bests are preserved. */
(function (root) {
  function createScores(storage) {
    const valid = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
    let best = 0, previous = null, available = true;
    try {
      best = valid(storage.getItem('hospice-dash-best'));
      const value = storage.getItem('hospice-dash-previous');
      previous = value === null ? null : valid(value);
    } catch { available = false; }
    function persist(key, value) { try { storage.setItem(key, String(value)); } catch { available = false; } }
    return {
      get best() { return best; }, get previous() { return previous; }, get available() { return available; },
      recordBest(score) { score = valid(Math.floor(score)); if (score > best) { best = score; persist('hospice-dash-best', best); } },
      finish(score) { previous = valid(Math.floor(score)); persist('hospice-dash-previous', previous); this.recordBest(previous); }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createScores };
  else root.HospiceScores = { createScores };
})(typeof window !== 'undefined' ? window : globalThis);
