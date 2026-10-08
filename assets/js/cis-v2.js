// Mirrors packages/core/src/lib/services/cis.ts in the concertje monorepo.
(function () {
  const clamp = (v) => Math.min(100, Math.max(0, v));

  function baseV1(listeners) {
    return Math.max(20, clamp((100 * Math.log10(listeners + 1)) / 7));
  }

  function baseV2(listeners) {
    const floor = Math.log10(10000);
    const ceiling = Math.log10(5000000);
    return clamp(((Math.log10(listeners + 1) - floor) / (ceiling - floor)) * 100);
  }

  function momentumV1(recent, prior) {
    const total = recent + prior;
    if (recent === 0 || total < 2) return 0;
    const ratio = (recent / 14 + 0.5) / (prior / 16 + 0.5);
    return clamp(50 + 25 * Math.log2(ratio));
  }

  function momentumV2(recent, prior) {
    return momentumV1(recent, prior) * Math.min(1, (recent + prior) / 20);
  }

  function formatListeners(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return Math.round(n / 1e3) + 'k';
    return String(Math.round(n));
  }

  function formatLift(v) {
    if (!Number.isFinite(v)) return v > 0 ? '∞' : '–∞';
    return (v > 0 ? '+' : '') + v.toFixed(2);
  }

  function setBar(root, key, value) {
    root.querySelector(`[data-bar="${key}"]`).style.width = value + '%';
    root.querySelector(`[data-out="${key}"]`).textContent = Math.round(value);
  }

  const renderers = {
    base(root) {
      const input = root.querySelector('[data-in="logListeners"]');
      const listeners = Math.round(10 ** Number(input.value));
      root.querySelector('[data-out="listeners"]').textContent = formatListeners(listeners);
      setBar(root, 'v1', baseV1(listeners));
      setBar(root, 'v2', baseV2(listeners));
    },
    momentum(root) {
      const recent = Number(root.querySelector('[data-in="recent"]').value);
      const prior = Number(root.querySelector('[data-in="prior"]').value);
      root.querySelector('[data-out="recent"]').textContent = recent;
      root.querySelector('[data-out="prior"]').textContent = prior;
      const v1 = momentumV1(recent, prior);
      const v2 = momentumV2(recent, prior);
      setBar(root, 'v1', v1);
      setBar(root, 'v2', v2);
      root.querySelector('[data-out="note"]').textContent =
        `Worth ${(v1 * 0.3).toFixed(1)} CIS points in v1 and ${(v2 * 0.15).toFixed(1)} in v2.`;
    },
    lift(root) {
      const recent = Number(root.querySelector('[data-in="recent"]').value);
      const prior = Number(root.querySelector('[data-in="prior"]').value);
      root.querySelector('[data-out="recent"]').textContent = recent;
      root.querySelector('[data-out="prior"]').textContent = prior;
      const priorWeekly = (prior * 7) / 21;
      const raw = Math.log2(recent / priorWeekly);
      const lift = Math.log2((recent + 10) / (priorWeekly + 10));
      root.querySelector('[data-out="raw"]').textContent = Number.isNaN(raw) ? '–' : formatLift(raw);
      root.querySelector('[data-out="lift"]').textContent = formatLift(lift);
      root.querySelector('[data-out="note"]').textContent =
        lift > 0 ? 'Rising: this show can enter the Trending lane.' : 'Not rising: this show stays out of the lane.';
    },
  };

  document.querySelectorAll('[data-cis-widget]').forEach((root) => {
    const render = renderers[root.dataset.cisWidget];
    root.addEventListener('input', () => render(root));
    root.querySelectorAll('[data-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        root.querySelector('[data-in="logListeners"]').value = button.dataset.preset;
        render(root);
      });
    });
    render(root);
  });
})();
