/* =========================================================================
   Ridge — the custom drawing engine for The Ikem Co.

   Three modes, all generated from a text seed so a given slot always draws
   the same thing, and no two slots draw the same thing.

     contour    layered topographic lines. The house style, used for ambience
                behind dark sections and wherever a slot is simply waiting.
     terrain    a layered ridge landscape with atmospheric depth. Used for
                neighbourhood slots.
     elevation  an architectural elevation: volumes, glazing, a cantilever,
                horizon and ground shadow. Used for property slots.

   <canvas data-ridge="view-park" data-ridge-mode="terrain"
           data-ridge-tone="light|dark" data-ridge-lines="14"></canvas>
   ========================================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seedFrom(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  function makeNoise(rand, points) {
    var table = [];
    for (var i = 0; i <= points; i++) table.push(rand());
    return function (t) {
      var x = t * points;
      var i0 = Math.floor(x) % points;
      var i1 = (i0 + 1) % points;
      var f = x - Math.floor(x);
      var s = f * f * (3 - 2 * f);
      return table[i0] * (1 - s) + table[i1] * s;
    };
  }

  function build(canvas) {
    var seed = canvas.getAttribute('data-ridge') || 'ikem';
    var tone = canvas.getAttribute('data-ridge-tone') || 'dark';
    var mode = canvas.getAttribute('data-ridge-mode') || 'contour';
    var lines = parseInt(canvas.getAttribute('data-ridge-lines'), 10) || 16;
    var rand = seedFrom(seed);

    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1, t = 0;
    var running = false, raf = null, last = 0;

    function ink(a) {
      return tone === 'light'
        ? 'rgba(51, 48, 42,' + a.toFixed(3) + ')'
        : 'rgba(233, 229, 219,' + a.toFixed(3) + ')';
    }

    /* ---- contour ------------------------------------------------------ */
    var layers = [];
    for (var i = 0; i < lines; i++) {
      layers.push({
        a: makeNoise(rand, 5 + Math.floor(rand() * 4)),
        b: makeNoise(rand, 11 + Math.floor(rand() * 7)),
        c: makeNoise(rand, 23),
        base: 0.24 + (i / lines) * 0.72,
        amp: 0.16 * (1 - i / (lines * 1.6)) + 0.02,
        drift: (rand() - 0.5) * 0.02
      });
    }

    function drawContour(alphaScale) {
      var step = Math.max(4, Math.round(w / 220));
      for (var i = 0; i < layers.length; i++) {
        var L = layers[i];
        var fade = 1 - i / (layers.length * 1.25);
        ctx.beginPath();
        for (var x = 0; x <= w + step; x += step) {
          var u = x / w;
          var n = L.a(u + t * L.drift) * 0.55 + L.b(u * 1.7 + t * L.drift * 1.7) * 0.32 + L.c(u * 3.1) * 0.13;
          var y = h * (L.base - L.amp * (n - 0.5) * 2);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = ink(((tone === 'light' ? 0.22 : 0.34) * fade + 0.05) * alphaScale);
        ctx.stroke();
      }
    }

    /* ---- terrain ------------------------------------------------------ */
    var ridges = null;
    function makeRidges() {
      var out = [];
      for (var i = 0; i < 6; i++) {
        out.push({
          a: makeNoise(rand, 3 + i),
          b: makeNoise(rand, 7 + i * 2),
          base: 0.40 + i * 0.095,
          amp: 0.115 - i * 0.013
        });
      }
      return out;
    }

    function drawTerrain() {
      if (!ridges) ridges = makeRidges();

      /* sky, a whisper of tone so the horizon has somewhere to sit */
      var sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
      sky.addColorStop(0, ink(0.10));
      sky.addColorStop(1, ink(0));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.62);

      var step = Math.max(3, Math.round(w / 260));
      for (var i = 0; i < ridges.length; i++) {
        var R = ridges[i];
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (var x = 0; x <= w + step; x += step) {
          var u = x / w;
          var n = R.a(u) * 0.62 + R.b(u * 1.9) * 0.38;
          var y = h * (R.base - R.amp * (n - 0.5) * 2);
          x === 0 ? ctx.lineTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        /* nearer ridges sit heavier, which is what reads as distance */
        ctx.fillStyle = ink(0.045 + i * 0.032);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = ink(0.10 + i * 0.03);
        ctx.stroke();
      }
    }

    /* ---- elevation ---------------------------------------------------- */
    var plan = null;
    function makePlan() {
      var vols = [];
      var count = 2 + Math.floor(rand() * 3);
      var x = 0.08 + rand() * 0.07;
      for (var i = 0; i < count; i++) {
        var vw = 0.15 + rand() * 0.22;
        if (x + vw > 0.93) vw = Math.max(0.1, 0.93 - x);
        vols.push({
          x: x, w: vw,
          h: 0.16 + rand() * 0.32,
          cols: 2 + Math.floor(rand() * 4),
          rows: 1 + Math.floor(rand() * 3),
          glazed: rand() > 0.28,
          lit: rand(),
          cantilever: rand() > 0.55 ? 0.035 + rand() * 0.05 : 0
        });
        x += vw + 0.012 + rand() * 0.03;
        if (x > 0.9) break;
      }
      return { vols: vols, ground: 0.76 + rand() * 0.06, mast: 0.2 + rand() * 0.6 };
    }

    function drawElevation() {
      if (!plan) plan = makePlan();
      var g = h * plan.ground;

      var sky = ctx.createLinearGradient(0, 0, 0, g);
      sky.addColorStop(0, ink(0.11));
      sky.addColorStop(1, ink(0.01));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, g);

      ctx.fillStyle = ink(0.07);
      ctx.fillRect(0, g, w, h - g);

      plan.vols.forEach(function (v) {
        var x0 = w * v.x, vw = w * v.w, vh = h * v.h, y0 = g - vh;

        if (v.cantilever) {
          ctx.fillStyle = ink(0.13);
          ctx.fillRect(x0 - w * v.cantilever, y0 - h * 0.012, vw + w * v.cantilever * 2, h * 0.012);
        }

        ctx.fillStyle = ink(0.10 + v.lit * 0.07);
        ctx.fillRect(x0, y0, vw, vh);
        ctx.lineWidth = 1;
        ctx.strokeStyle = ink(0.34);
        ctx.strokeRect(x0, y0, vw, vh);

        if (v.glazed) {
          var cw = vw / v.cols, rh = vh / v.rows;
          for (var c = 0; c < v.cols; c++) {
            for (var r = 0; r < v.rows; r++) {
              /* a few panels catch the light, the rest stay quiet */
              if (((c * 7 + r * 13 + Math.floor(v.lit * 100)) % 5) === 0) {
                ctx.fillStyle = ink(0.16);
                ctx.fillRect(x0 + cw * c, y0 + rh * r, cw, rh);
              }
            }
          }
          ctx.strokeStyle = ink(0.15);
          for (var cc = 1; cc < v.cols; cc++) {
            ctx.beginPath();
            ctx.moveTo(x0 + cw * cc, y0);
            ctx.lineTo(x0 + cw * cc, g);
            ctx.stroke();
          }
          for (var rr = 1; rr < v.rows; rr++) {
            ctx.beginPath();
            ctx.moveTo(x0, y0 + rh * rr);
            ctx.lineTo(x0 + vw, y0 + rh * rr);
            ctx.stroke();
          }
        }

        /* the shadow the volume throws along the ground plane */
        var sh = ctx.createLinearGradient(0, g, 0, g + h * 0.06);
        sh.addColorStop(0, ink(0.16));
        sh.addColorStop(1, ink(0));
        ctx.fillStyle = sh;
        ctx.fillRect(x0, g, vw, h * 0.06);
      });

      /* a single vertical, the way an elevation drawing carries a tree or mast */
      var mx = w * plan.mast;
      ctx.strokeStyle = ink(0.22);
      ctx.beginPath();
      ctx.moveTo(mx, g);
      ctx.lineTo(mx, g - h * 0.30);
      ctx.stroke();

      ctx.strokeStyle = ink(0.42);
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(w, g);
      ctx.stroke();
    }

    /* ---- plumbing ----------------------------------------------------- */
    function size() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      if (mode === 'terrain') { drawTerrain(); drawContour(0.35); return; }
      if (mode === 'elevation') { drawContour(0.25); drawElevation(); return; }
      drawContour(1);
    }

    function frame(now) {
      raf = null;
      if (!running) return;
      if (now - last > 40) { last = now; t += 0.06; draw(); }
      raf = window.requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduce || mode !== 'contour') return;  /* a drawing does not drift */
      running = true;
      raf = window.requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = null;
    }

    size();
    draw();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { rootMargin: '120px' }).observe(canvas);
    } else {
      start();
    }

    return { resize: function () { size(); draw(); } };
  }

  var instances = [];

  /* Which drawing belongs in a slot, decided by the file it is standing in for. */
  function modeFor(src) {
    if (/property-|listing-/.test(src)) return 'elevation';
    if (/hood-|corridor|neighbou?rhood/.test(src)) return 'terrain';
    if (/service-|peek-/.test(src)) return 'elevation';
    return 'contour';
  }

  function fillEmptyFrames() {
    Array.prototype.forEach.call(document.querySelectorAll('.frame > img'), function (img) {
      var frame = img.parentElement;

      var place = function () {
        if (img.naturalWidth > 0) return;
        if (frame.querySelector('canvas')) return;
        var src = (img.getAttribute('src') || 'ikem').split('?')[0];
        var c = document.createElement('canvas');
        c.setAttribute('data-ridge', src);
        c.setAttribute('data-ridge-mode', modeFor(src));
        c.setAttribute('data-ridge-tone',
          (frame.classList.contains('is-dark') || frame.classList.contains('is-clay')) ? 'dark' : 'light');
        c.setAttribute('data-ridge-lines', '14');
        frame.insertBefore(c, frame.firstChild);
        instances.push(build(c));
      };

      /* a lazy image reports complete before it has been asked to load */
      if (img.complete && img.naturalWidth === 0) place();
      img.addEventListener('error', place);
    });
  }

  function init() {
    instances = Array.prototype.map.call(document.querySelectorAll('canvas[data-ridge]'), build);
    fillEmptyFrames();
  }

  window.Ridge = { build: build, modeFor: modeFor, fillEmptyFrames: fillEmptyFrames };

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      instances.forEach(function (inst) { inst.resize(); });
    }, 180);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
