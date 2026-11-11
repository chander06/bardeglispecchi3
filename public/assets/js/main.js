/* Bar degli Specchi v3 — main.js (nessuna dipendenza) */
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-ready'); }); });

  /* ---------- Rivelazioni ---------- */
  var els = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- La giornata del bar ---------- */
  var day = document.querySelector('[data-day]');
  var phases = day ? Array.prototype.slice.call(day.querySelectorAll('.phase')) : [];
  var hH = day && day.querySelector('[data-hand="h"]');
  var hM = day && day.querySelector('[data-hand="m"]');

  // Colori chiave: mattina (crema) → pomeriggio (ambra) → tramonto → sera (blu notte)
  var KEYS = [
    { t: 0.00, hand: [154, 106, 46], bg: [243, 238, 227], fg: [29, 29, 27], soft: [74, 73, 69], orb: [231, 183, 102], face: [251, 248, 241] },
    { t: 0.45, hand: [136, 84, 32], bg: [238, 214, 168], fg: [36, 30, 22], soft: [96, 80, 56], orb: [240, 168, 70], face: [250, 240, 218] },
    { t: 0.62, hand: [104, 56, 20], bg: [222, 160, 104], fg: [40, 26, 16], soft: [90, 56, 32], orb: [236, 120, 64], face: [246, 228, 206] },
    { t: 0.70, hand: [226, 194, 140], bg: [62, 48, 72], fg: [240, 232, 220], soft: [200, 190, 200], orb: [220, 200, 200], face: [40, 40, 62] },
    { t: 0.82, hand: [226, 194, 140], bg: [16, 24, 40], fg: [236, 232, 220], soft: [160, 166, 182], orb: [226, 228, 236], face: [30, 40, 60] },
    { t: 1.00, hand: [226, 194, 140], bg: [16, 24, 40], fg: [236, 232, 220], soft: [160, 166, 182], orb: [226, 228, 236], face: [30, 40, 60] }
  ];
  function mix(a, b, k) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }); }
  function rgb(c, a) { return a === undefined ? 'rgb(' + c.join(' ') + ')' : 'rgb(' + c.join(' ') + ' / ' + a + ')'; }
  function colorsAt(p) {
    for (var i = 0; i < KEYS.length - 1; i++) {
      var A = KEYS[i], B = KEYS[i + 1];
      if (p <= B.t) {
        var k = (p - A.t) / (B.t - A.t);
        k = k * k * (3 - 2 * k); // morbido
        return { hand: mix(A.hand, B.hand, k), bg: mix(A.bg, B.bg, k), fg: mix(A.fg, B.fg, k), soft: mix(A.soft, B.soft, k), orb: mix(A.orb, B.orb, k), face: mix(A.face, B.face, k) };
      }
    }
    return KEYS[KEYS.length - 1];
  }

  function paintDay(p) {
    var c = colorsAt(p);
    var s = day.style;
    s.setProperty('--p', p.toFixed(3));
    s.setProperty('--bg', rgb(c.bg));
    s.setProperty('--fg', rgb(c.fg));
    s.setProperty('--soft', rgb(c.soft));
    s.setProperty('--orb', rgb(c.orb));
    s.setProperty('--glow', rgb(c.orb, 0.45));
    s.setProperty('--face', rgb(c.face));
    s.setProperty('--hand-c', rgb(c.hand));
    s.setProperty('--night', Math.min(1, Math.max(0, (p - 0.68) / 0.16)).toFixed(3));
    // Sole/luna su un arco: sorge a sinistra, tramonta a destra
    var a = Math.PI * (1 - p);
    s.setProperty('--ox', (50 + Math.cos(a) * 42).toFixed(2) + '%');
    s.setProperty('--oy', (78 - Math.sin(a) * 62).toFixed(2) + '%');
    // Orologio: dalle 7:00 alle 22:00
    var hours = 7 + p * 15;
    if (hH) hH.style.transform = 'rotate(' + (hours * 30).toFixed(2) + 'deg)';
    if (hM) hM.style.transform = 'rotate(' + ((hours % 1) * 360 + Math.floor(hours) * 360).toFixed(2) + 'deg)';
    // Pannelli: uno per momento della giornata
    var n = phases.length;
    phases.forEach(function (ph, i) {
      var c0 = (i + 0.5) / n;
      var d = (p - c0) * n;               // -0.5..0.5 dentro la sua fascia
      var o = 1 - Math.max(0, Math.abs(d) - 0.22) * 3.2;
      if (i === 0 && p < c0) o = 1;
      if (i === n - 1 && p > c0) o = 1;
      o = Math.max(0, Math.min(1, o));
      ph.style.opacity = o.toFixed(3);
      ph.style.transform = 'translateY(' + (-d * 40 * (1 - o)).toFixed(1) + 'px)';
      ph.style.visibility = o < 0.02 ? 'hidden' : 'visible';
      ph.setAttribute('aria-hidden', o < 0.5 ? 'true' : 'false');
    });
  }

  if (day) {
    if (reduce) {
      day.classList.add('is-static');
      phases.forEach(function (ph) { ph.removeAttribute('aria-hidden'); });
    }
  }

  /* ---------- Scroll ---------- */
  var nav = document.querySelector('[data-nav]');
  var quick = document.querySelector('[data-quickbar]');
  var hero = document.querySelector('.hero');
  var ticking = false;
  function update() {
    if (day && !reduce) {
      var r = day.getBoundingClientRect();
      var p = -r.top / Math.max(1, r.height - window.innerHeight);
      paintDay(Math.min(1, Math.max(0, p)));
    }
    var y = window.scrollY || window.pageYOffset;
    if (quick && hero) quick.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  /* ---------- Menu telefono ---------- */
  var toggle = document.querySelector('.nav__toggle');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.querySelectorAll('.nav__links a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
