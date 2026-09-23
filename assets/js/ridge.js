/* =========================================================================
   Ridge — a custom canvas graphic for The Ikem Co.
   Draws layered contour lines of a hillside. Every canvas takes a seed, so
   each neighborhood and each section gets its own ridge that is reproducible
   and belongs only to this site. Doubles as the fallback behind any section
   whose background video has not been supplied yet.

   <canvas data-ridge="view-park" data-ridge-tone="light|dark" data-ridge-lines="14"></canvas>
   ========================================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* deterministic pseudo random from a string seed */
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

  /* one octave of smooth value noise over a fixed lattice */
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
    var mode = canvas.getAttribute('data-ridge-mode') || 'ridge';
    var lines = parseInt(canvas.getAttribute('data-ridge-lines'), 10) || 16;
    if (mode === 'plan') lines = 7;
    var rand = seedFrom(seed);

    /* an abstract elevation, drawn once from the same seed. Used wherever a
       photograph has not arrived yet, so a property card reads as an
       architect's drawing rather than an empty box. */
    var plan = null;
    function makePlan() {
      var volumes = [];
      var count = 2 + Math.floor(rand() * 3);
      var x = 0.06 + rand() * 0.06;
      for (var i = 0; i < count; i++) {
        var w = 0.16 + rand() * 0.24;
        if (x + w > 0.94) { w = Math.max(0.1, 0.94 - x); }
        var h = 0.16 + rand() * 0.34;
        volumes.push({
          x: x, w: w, h: h,
          cols: 2 + Math.floor(rand() * 4),
          rows: 1 + Math.floor(rand() * 3),
          glass: rand() > 0.32,
          cantilever: rand() > 0.62 ? 0.05 + rand() * 0.06 : 0
        });
        x += w + (rand() * 0.035);
        if (x > 0.9) break;
      }
      return { volumes: volumes, ground: 0.76 + rand() * 0.08, datum: 0.2 + rand() * 0.12 };
    }

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

    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1;
    var t = 0;
    var running = false;
    var raf = null;
    var last = 0;

    function size() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ink(alpha) {
      return tone === 'light'
        ? 'rgba(51, 48, 42,' + alpha.toFixed(3) + ')'
        : 'rgba(233, 229, 219,' + alpha.toFixed(3) + ')';
    }

    function drawPlan() {
      if (!plan) plan = makePlan();
      var g = h * plan.ground;

      /* two datum rules, the way an elevation drawing carries them */
      ctx.lineWidth = 1;
      ctx.strokeStyle = ink(0.1);
      [plan.datum, plan.datum + 0.1].forEach(function (d) {
        ctx.beginPath();
        ctx.moveTo(0, h * d);
        ctx.lineTo(w, h * d);
        ctx.stroke();
      });

      plan.volumes.forEach(function (v) {
        var x0 = w * v.x, vw = w * v.w, vh = h * v.h, y0 = g - vh;

        if (v.cantilever) {
          ctx.strokeStyle = ink(0.24);
          ctx.beginPath();
          ctx.moveTo(x0 - w * v.cantilever, y0);
          ctx.lineTo(x0 + vw + w * v.cantilever, y0);
          ctx.stroke();
        }

        ctx.strokeStyle = ink(0.34);
        ctx.strokeRect(x0, y0, vw, vh);

        if (v.glass) {
          ctx.strokeStyle = ink(0.16);
          for (var c = 1; c < v.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(x0 + (vw / v.cols) * c, y0);
            ctx.lineTo(x0 + (vw / v.cols) * c, g);
            ctx.stroke();
          }
          for (var r = 1; r < v.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(x0, y0 + (vh / v.rows) * r);
            ctx.lineTo(x0 + vw, y0 + (vh / v.rows) * r);
            ctx.stroke();
          }
        }
      });

      /* ground, then the piers below it */
      ctx.strokeStyle = ink(0.4);
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(w, g);
      ctx.stroke();

      ctx.strokeStyle = ink(0.18);
      for (var p = 0; p < 9; p++) {
        var px = w * (0.08 + p * 0.1);
        ctx.beginPath();
        ctx.moveTo(px, g);
        ctx.lineTo(px, g + h * 0.05);
        ctx.stroke();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var step = Math.max(4, Math.round(w / 220));

      for (var i = 0; i < layers.length; i++) {
        var L = layers[i];
        var fade = 1 - i / (layers.length * 1.25);
        ctx.beginPath();
        for (var x = 0; x <= w + step; x += step) {
          var u = x / w;
          var n = L.a(u + t * L.drift) * 0.55 + L.b(u * 1.7 + t * L.drift * 1.7) * 0.32 + L.c(u * 3.1) * 0.13;
          var y = h * (L.base - L.amp * (n - 0.5) * 2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = mode === 'plan'
          ? ink(0.07 * fade + 0.02)
          : ink(tone === 'light' ? 0.22 * fade + 0.04 : 0.34 * fade + 0.06);
        ctx.stroke();
      }

      if (mode === 'plan') drawPlan();
    }

    function frame(now) {
      raf = null;
      if (!running) return;
      if (now - last > 40) {          /* hold near 25fps, this is ambient */
        last = now;
        t += 0.06;
        draw();
      }
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduce || mode === 'plan') return;   /* a drawing does not drift */
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
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { rootMargin: '120px' }).observe(canvas);
    } else {
      start();
    }

    return { resize: function () { size(); draw(); } };
  }

  var instances = [];

  /* Any frame whose photograph has not been supplied yet draws its own.
     Property and neighbourhood slots get an abstract elevation, everything
     else gets contours. Seeded from the file path, so a given slot always
     looks the same, and the drawing disappears the moment a real image lands. */
  function fillEmptyFrames() {
    Array.prototype.forEach.call(document.querySelectorAll('.frame > img'), function (img) {
      var frame = img.parentElement;

      var place = function () {
        if (img.naturalWidth > 0) return;
        if (frame.querySelector('canvas')) return;
        var src = img.getAttribute('src') || 'ikem';
        var architectural = /(property-|hood-)/.test(src);
        var c = document.createElement('canvas');
        c.setAttribute('data-ridge', src);
        c.setAttribute('data-ridge-mode', architectural ? 'plan' : 'ridge');
        c.setAttribute('data-ridge-tone',
          (frame.classList.contains('is-dark') || frame.classList.contains('is-clay')) ? 'dark' : 'light');
        c.setAttribute('data-ridge-lines', architectural ? '7' : '14');
        frame.insertBefore(c, frame.firstChild);
        instances.push(build(c));
      };

      if (img.complete) place();
      else img.addEventListener('error', place);
    });
  }

  function init() {
    instances = Array.prototype.map.call(document.querySelectorAll('canvas[data-ridge]'), build);
    fillEmptyFrames();
  }

  window.Ridge = { build: build, fillEmptyFrames: fillEmptyFrames };

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
