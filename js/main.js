/* BrittonBMI — interactions & motion
   No dependencies. Lenis (smooth scroll) is used when it loads from the CDN,
   otherwise native scrolling is used. Everything motion-related is skipped
   when the visitor prefers reduced motion. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame.bind(window);

  /* ---------- Smooth scroll (Locomotive-style feel) ---------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    (function loop(time) { lenis.raf(time); raf(loop); })(performance.now());
    // anchor links go through Lenis so they glide too
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === '#top' ? 0 : -parseInt(getComputedStyle(root).getPropertyValue('--header-h'), 10) || 0 });
    });
  }

  /* ---------- Split text ---------- */
  function splitWords(el, mode) {
    var charIndex = 0;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var word = document.createElement('span');
        word.className = 'split-word';
        word.setAttribute('aria-hidden', 'true');
        if (mode === 'chars') {
          Array.prototype.forEach.call(part, function (ch) {
            var c = document.createElement('span');
            c.className = 'split-char';
            c.style.setProperty('--c', charIndex++);
            c.textContent = ch;
            word.appendChild(c);
          });
        } else {
          var inner = document.createElement('span');
          inner.className = 'split-line__inner';
          inner.textContent = part;
          word.appendChild(inner);
        }
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  }

  // Give every word a line index so lines rise one after another (barberhauler "lines" split)
  function indexLines(el) {
    var words = el.querySelectorAll('.split-word');
    var lastTop = null, line = -1;
    words.forEach(function (w) {
      var top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 4) { line++; lastTop = top; }
      var inner = w.querySelector('.split-line__inner');
      if (inner) inner.style.setProperty('--i', line);
    });
  }

  var splitEls = document.querySelectorAll('[data-split]');
  if (!reduceMotion) {
    splitEls.forEach(function (el) {
      splitWords(el, el.getAttribute('data-split'));
      if (el.getAttribute('data-split') === 'lines') indexLines(el);
    });
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        document.querySelectorAll('[data-split="lines"]').forEach(indexLines);
      }, 150);
    });
  }

  /* ---------- Stagger groups ---------- */
  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    var kids = group.querySelectorAll('[data-reveal]');
    kids.forEach(function (kid, i) {
      if (!kid.style.getPropertyValue('--reveal-delay')) kid.style.setProperty('--reveal-delay', (i * 0.08).toFixed(2) + 's');
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll('[data-reveal], [data-split]:not([data-split-auto]), [data-steps]' + (window.matchMedia('(max-width: 767px)').matches ? ', [data-steps] > .step' : ''));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-inview'); });
  } else {
    // Elements hidden with clip-path report no intersection in Chrome,
    // so those are watched through their parent instead.
    var watchMap = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        (watchMap.get(entry.target) || []).forEach(function (el) { el.classList.add('is-inview'); });
        watchMap.delete(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) {
      // hero items reveal on load instead
      if (el.closest('.hero') || el.closest('.site-header')) return;
      var mode = el.getAttribute('data-reveal') || '';
      var watched = /^(clip-up|clip-right|panel|tag)$/.test(mode) ? el.parentElement : el;
      // anything inside a clip-revealed panel plays once the panel has opened
      var clipParent = el.parentElement && el.parentElement.closest('[data-reveal="panel"],[data-reveal="clip-up"],[data-reveal="clip-right"]');
      if (clipParent) {
        watched = clipParent.parentElement;
        var d = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0;
        el.style.setProperty('--reveal-delay', (d + 0.55).toFixed(2) + 's');
      }
      if (!watchMap.has(watched)) watchMap.set(watched, []);
      watchMap.get(watched).push(el);
      io.observe(watched);
    });
  }

  /* ---------- Page load (hero intro) ---------- */
  function onLoaded() {
    root.classList.add('is-loaded');
    setTimeout(function () {
      document.querySelectorAll('.hero [data-split], .hero [data-reveal], .site-header [data-reveal]').forEach(function (el) { el.classList.add('is-inview'); });
    }, 250);
  }
  if (document.readyState === 'complete') onLoaded();
  else window.addEventListener('load', onLoaded);
  // safety net if a slow asset holds up "load"
  setTimeout(function () { if (!root.classList.contains('is-loaded')) onLoaded(); }, 2500);

  /* ---------- Header: hide on scroll down, show on scroll up ---------- */
  var header = document.querySelector('[data-header]');
  var lastY = window.scrollY;
  var menuOpen = false;
  function onScrollHeader() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    if (!menuOpen) header.classList.toggle('is-hidden', y > 400 && y > lastY);
    lastY = y;
  }

  /* ---------- Parallax ---------- */
  var parallaxEls = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax], [data-parallax-inner]'));
  // Hero: the photo drifts down at a fraction of scroll speed, so its framing
  // at the top of the page is exactly the design's.
  var scrollParallax = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax-scroll]'));
  function updateParallax() {
    var sy = window.scrollY;
    scrollParallax.forEach(function (el) {
      if (sy > window.innerHeight * 1.5) return;
      el.style.translate = '0 ' + (sy * parseFloat(el.getAttribute('data-parallax-scroll'))).toFixed(1) + 'px';
    });
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var box = (el.hasAttribute('data-parallax-inner') ? el.parentElement : el.closest('section')) || el;
      var r = box.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var strength = parseFloat(el.getAttribute('data-parallax') || el.getAttribute('data-parallax-inner')) || 0.1;
      // progress -1 (below viewport) .. 1 (above viewport)
      var progress = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
      // content scrolls up, the image drifts down: it appears to move slower
      var shift = -progress * strength * r.height;
      el.style.translate = '0 ' + shift.toFixed(1) + 'px';
      if (el.hasAttribute('data-parallax-inner')) {
        // oversize the image inside its mask so the drift never shows an edge
        var pad = Math.ceil(strength * r.height);
        el.style.height = (r.height + pad * 2) + 'px';
        el.style.marginTop = (-pad) + 'px';
      }
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    raf(function () { onScrollHeader(); updateParallax(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Panel stack ----------
     Each panel pins (sticky); the next one waits tucked beneath it for a "hold"
     of extra scroll, then slides up over it. The hold is real scroll distance
     (margin-top on the next panel) that a translate cancels out visually. */
  var stack = document.querySelector('[data-stack]');
  var panels = stack ? Array.prototype.slice.call(stack.querySelectorAll(':scope > [data-panel]')) : [];
  var HOLD = function () { return Math.round(window.innerHeight * (window.innerWidth < 768 ? 0.35 : 0.5)); };
  var stackLayout = [];
  function layoutStack() {
    if (!panels.length) return;
    var vh = window.innerHeight, hold = reduceMotion ? 0 : HOLD(), y = 0;
    stackLayout = panels.map(function (el, i) {
      el.style.marginTop = i > 0 ? hold + 'px' : '';
      el.style.translate = '';
      var h = el.offsetHeight;
      var stickTop = Math.min(0, vh - h);
      if (i < panels.length - 1) el.style.setProperty('--stick-top', stickTop + 'px');
      if (i > 0) y += hold;
      var info = { el: el, top: y, h: h, stickTop: stickTop, hold: i > 0 ? hold : 0 };
      y += h;
      return info;
    });
    updateStack();
  }
  function updateStack() {
    if (!stackLayout.length || reduceMotion) return;
    var stackTop = stack.getBoundingClientRect().top + window.scrollY;
    var sy = window.scrollY;
    stackLayout.forEach(function (p, i) {
      if (i === 0) return;
      var prev = stackLayout[i - 1];
      // scroll position at which the previous panel pins
      var pinAt = stackTop + prev.top - prev.stickTop;
      var d = Math.max(0, Math.min(p.hold, sy - pinAt));
      p.el.style.translate = '0 ' + (d - p.hold) + 'px';
      // previous panel recedes as this one covers it
      var pinnedBottom = prev.stickTop + prev.h;
      var overTop = p.el.getBoundingClientRect().top;
      var cover = Math.max(0, Math.min(1, (pinnedBottom - overTop) / prev.h));
      prev.el.style.setProperty('--cover', cover.toFixed(3));
    });
  }
  layoutStack();
  window.addEventListener('resize', layoutStack);
  window.addEventListener('load', layoutStack);
  window.addEventListener('scroll', function () { raf(updateStack); }, { passive: true });

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target, end = parseInt(el.getAttribute('data-count'), 10), start = null, dur = 1600;
        (function step(t) {
          if (!start) start = t;
          var p = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased);
          if (p < 1) raf(step);
        })(performance.now());
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; cio.observe(el); });
  }

  /* ---------- Trust logo marquee (slow, seamless) ---------- */
  var SPEED = 32; // px per second — slow, readable drift
  document.querySelectorAll('[data-marquee]').forEach(function (marquee) {
    var track = marquee.querySelector('[data-marquee-track]');
    var originals = Array.prototype.slice.call(track.children);
    // one full copy for a seamless loop
    originals.forEach(function (li) {
      var clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img').forEach(function (img) { img.alt = ''; });
      track.appendChild(clone);
    });
    function measure() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var first = originals[0], firstClone = track.children[originals.length];
      var distance = firstClone.offsetLeft - first.offsetLeft;
      if (!distance) distance = track.scrollWidth / 2 + gap / 2;
      track.style.setProperty('--marquee-distance', (-distance) + 'px');
      track.style.setProperty('--marquee-duration', (distance / SPEED).toFixed(1) + 's');
    }
    if (document.readyState === 'complete') measure(); else window.addEventListener('load', measure);
    window.addEventListener('resize', measure);
    measure();
  });

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    if (open) header.classList.remove('is-hidden');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  toggle.addEventListener('click', function () { setMenu(!menuOpen); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); } });
  window.matchMedia('(min-width: 768px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });
})();
