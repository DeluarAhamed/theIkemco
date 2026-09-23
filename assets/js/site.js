/* =========================================================================
   THE IKEM CO. — site.js
   Vanilla, no dependencies, ~330 lines. Everything degrades without it.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- page transition curtain ---------------------------------- */
  var curtain = $('.curtain');

  /* The curtain must never be able to strand a visitor on a blank screen.
     requestAnimationFrame does not run in a background or throttled tab, so
     the lift is driven by timers, repeated on every event that could mean the
     page has become visible. Calling it twice is harmless. */
  function lift() {
    if (curtain) curtain.classList.add('is-up');
  }
  var leaving = false;
  window.setTimeout(lift, 60);
  window.setTimeout(lift, 1200);
  window.addEventListener('load', lift);
  window.addEventListener('pageshow', lift);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) lift();
  });
  /* last resort: if a frozen transition left it mid travel, put it away flat */
  window.setTimeout(function () {
    if (leaving || !curtain) return;
    curtain.style.transition = 'none';
    curtain.style.transform = 'translateY(-100%)';
  }, 2500);

  function leaveTo(href) {
    if (!curtain || reduce) { window.location.href = href; return; }
    leaving = true;
    curtain.style.transition = 'none';
    curtain.classList.remove('is-up');
    curtain.style.transform = 'translateY(100%)';
    void curtain.offsetHeight;
    curtain.style.transition = '';
    curtain.style.transform = 'translateY(0)';
    window.setTimeout(function () { window.location.href = href; }, 640);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:\/\/)/.test(href)) return;
    if (a.origin && a.origin !== window.location.origin) return;
    if (a.pathname === window.location.pathname) return;
    e.preventDefault();
    closeMenu();
    leaveTo(a.href);
  });

  /* ---------- masthead -------------------------------------------------- */
  var masthead = $('#masthead');
  if (masthead && !masthead.classList.contains('is-solid')) {
    var onScroll = function () { masthead.classList.toggle('is-stuck', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- full screen menu ------------------------------------------ */
  var menu = $('#menu');
  var menuBtn = $('#menuBtn');

  function openMenu() {
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    masthead.classList.add('is-menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    $('.menu-btn-label', menuBtn).textContent = 'Close';
    $$('.menu-item', menu).forEach(function (el, i) { el.style.transitionDelay = (80 + i * 45) + 'ms'; });
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    masthead.classList.remove('is-menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    $('.menu-btn-label', menuBtn).textContent = 'Menu';
    $$('.menu-item', menu).forEach(function (el) { el.style.transitionDelay = '0ms'; });
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });
  }

  /* ---------- animated figures ------------------------------------------ */
  /* <span data-count="300" data-prefix="$" data-suffix="M+" data-dec="0">
     Renders its final value in the markup, so it is correct without script. */
  function formatCount(el, value) {
    var dec = parseInt(el.getAttribute('data-dec'), 10) || 0;
    var n = dec ? value.toFixed(dec) : Math.round(value).toLocaleString('en-US');
    el.textContent = (el.getAttribute('data-prefix') || '') + n + (el.getAttribute('data-suffix') || '');
  }

  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var to = parseFloat(el.getAttribute('data-count'));
    if (isNaN(to)) return;
    if (reduce || !window.gsap) { formatCount(el, to); return; }
    var proxy = { v: 0 };
    var tw = window.gsap.to(proxy, {
      v: to,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: function () { formatCount(el, proxy.v); }
    });
    /* a figure must never be left frozen part way through counting */
    window.setTimeout(function () {
      if (tw.progress() < 1) { tw.progress(1); formatCount(el, to); }
    }, 2600);
  }

  /* ---------- reveal, GSAP when it is available -------------------------- */
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  if (gsap && ST && !reduce) {
    gsap.registerPlugin(ST);
    root.classList.add('gsap-on');

    /* the opening. One orchestrated sequence rather than scattered effects. */
    var opener = gsap.timeline({ delay: 0.15 });
    var heroBits = $$('.hero .eyebrow, .hero h1, .hero .lede, .hero .hero-cta, .hero .scroll-cue');
    if (heroBits.length) {
      gsap.set(heroBits, { y: 26, opacity: 0 });
      opener.to(heroBits, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09, ease: 'power3.out' });
    }
    var introBits = $$('.page-intro .crumb, .page-intro h1, .page-intro .lede');
    if (introBits.length) {
      gsap.set(introBits, { y: 22, opacity: 0 });
      opener.to(introBits, { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'power3.out' }, 0);
    }

    /* Failsafe. rAF is paused while a tab is in the background, so a page
       opened in a background tab could otherwise sit at opacity 0. Nothing
       above the fold is ever allowed to stay invisible. */
    window.setTimeout(function () {
      if (opener.progress() < 1) opener.progress(1);
    }, 4000);

    var pending = [];

    /* Reveals are driven by IntersectionObserver rather than by scroll
       position, and every one carries a deadline.

       Two independent things can silently hide a whole section: a library can
       stop receiving scroll events, and animation frames are throttled to
       almost nothing in an unfocused or background tab, which freezes a tween
       the instant after it starts. The observer fires in both cases, and the
       deadline lands the tween on its end state if frames never arrive. A
       visitor may miss the motion. They never miss the content. */
    var revealIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealIO.unobserve(el);
        var tw = el.__reveal;
        if (!tw) return;
        tw.play();
        window.setTimeout(function () {
          if (tw.progress() < 1) tw.progress(1);
        }, 1200);
      });
      /* The root is stretched 14% past the fold so a block begins moving
         before it is scrolled to. Waiting until it is already on screen is
         what reads as content arriving late, or not at all on a fast scroll. */
    }, { rootMargin: '0px 0px 14% 0px', threshold: 0.01 }) : null;

    $$('[data-reveal]').forEach(function (el) {
      var kind = el.getAttribute('data-reveal');
      var tween;

      if (kind === 'media') {
        tween = gsap.fromTo(el,
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power3.inOut', paused: true });
      } else if (kind === 'mask') {
        tween = gsap.fromTo(el.children,
          { yPercent: 105 },
          { yPercent: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08, paused: true });
      } else {
        /* a group of rows or cards staggers, anything else moves as one */
        var kids = $$(':scope > .index-row, :scope > .prop, :scope > .entry, :scope > .film, :scope > .hood, :scope > .cred, :scope > .press-item, :scope > li', el);
        var subject = kids.length > 1 ? kids : el;
        tween = gsap.fromTo(subject,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: kids.length > 1 ? 0.07 : 0, paused: true });
      }

      el.__reveal = tween;
      pending.push({ tw: tween, el: el });
      if (revealIO) revealIO.observe(el);
      else tween.progress(1);
    });

    function sweepReveals() {
      var vh = window.innerHeight;
      pending.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        if (r.top < vh * 1.15 && r.bottom > -80 && p.tw.progress() < 1) p.tw.progress(1);
      });
    }

    window.addEventListener('load', function () {
      ST.refresh();
      window.setTimeout(function () { ST.refresh(); sweepReveals(); }, 400);
      window.setTimeout(sweepReveals, 2000);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ST.refresh(); });
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { ST.refresh(); sweepReveals(); }
    });

    /* Safety net. If anything ever makes the document scroller ambiguous
       again, ScrollTrigger stops updating silently and whole sections go
       invisible. This costs one rAF per scroll and removes that failure mode. */
    var stTick = false;
    window.addEventListener('scroll', function () {
      if (stTick) return;
      stTick = true;
      window.requestAnimationFrame(function () { stTick = false; ST.update(); });
    }, { passive: true });

    /* full bleed layers drift against the scroll */
    $$('[data-parallax]').forEach(function (layer) {
      gsap.fromTo(layer, { yPercent: -6 }, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });

    var countIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { threshold: 0.25 }) : null;

    $$('[data-count]').forEach(function (el) {
      if (countIO) countIO.observe(el);
      else countUp(el);
    });

    ST.refresh();
  } else {
    $$('[data-count]').forEach(function (el) { countUp(el); });
  }

  var targets = (gsap && ST && !reduce) ? [] : $$('[data-reveal]');
  if (targets.length && 'IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    targets.forEach(function (el, i) {
      if (i < 4) { el.classList.add('is-in'); return; }   /* above the fold shows at rest */
      io.observe(el);
    });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- parallax fallback, only when GSAP did not load ------------- */
  var layers = (gsap && ST && !reduce) ? [] : $$('[data-parallax]');
  if (layers.length && !reduce) {
    var ticking = false;
    var move = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;      /* -1 .. 1 */
        el.style.transform = 'translate3d(0,' + (p * -7).toFixed(2) + '%,0)';
      });
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(move); }
    }, { passive: true });
    move();
  }

  /* ---------- cursor preview -------------------------------------------- */
  var peek = $('#peek');
  if (peek && fine && !reduce) {
    var raf = null, pos = { x: 0, y: 0 };
    var draw = function () { peek.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px) translate(-50%,-50%)'; raf = null; };
    var track = function (e) {
      pos.x = e.clientX + 165;
      pos.y = e.clientY;
      if (pos.x > window.innerWidth - 165) pos.x = e.clientX - 165;
      if (!raf) raf = window.requestAnimationFrame(draw);
    };
    $$('[data-peek]').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        peek.innerHTML = '<div class="frame" data-slug="' + (row.getAttribute('data-peek-slug') || '') + '" style="width:100%;height:100%">' +
          '<img src="' + row.getAttribute('data-peek') + '" alt="" onerror="this.style.display=\'none\'"></div>';
        peek.classList.add('is-on');
      });
      row.addEventListener('mouseleave', function () { peek.classList.remove('is-on'); });
      row.addEventListener('mousemove', track);
    });
  }

  /* ---------- draggable rails ------------------------------------------- */
  $$('.rail').forEach(function (rail) {
    var down = false, startX = 0, startLeft = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      down = true; startX = e.clientX; startLeft = rail.scrollLeft;
      rail.classList.add('is-dragging');
    });
    window.addEventListener('pointerup', function () { down = false; rail.classList.remove('is-dragging'); });
    rail.addEventListener('pointermove', function (e) {
      if (!down) return;
      e.preventDefault();
      rail.scrollLeft = startLeft - (e.clientX - startX);
    });
  });

  /* ---------- property filter ------------------------------------------- */
  var filters = $$('.filter');
  if (filters.length) {
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-filter');
        filters.forEach(function (b) { b.classList.toggle('is-on', b === btn); });
        $$('#propGrid .prop').forEach(function (card) {
          card.classList.toggle('is-hidden', !(want === 'all' || card.getAttribute('data-status') === want));
        });
      });
    });
  }

  /* ---------- in page nav highlight -------------------------------------- */
  var tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var sections = tocLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- shortlist, kept on the visitor's own device ---------------- */
  var KEY = 'ikem.shortlist.v1';
  var read = function () { try { return JSON.parse(window.localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  var write = function (l) { try { window.localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} };

  var countEl = $('#shortlistCount');
  var listBtn = $('#shortlistBtn');
  var savedList = $('#savedList');

  function paintShortlist() {
    var list = read();
    if (countEl) countEl.textContent = String(list.length);
    if (listBtn) listBtn.hidden = list.length === 0;
    $$('[data-save]').forEach(function (btn) {
      var on = list.some(function (i) { return i.addr === btn.getAttribute('data-addr'); });
      btn.classList.toggle('is-saved', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!savedList) return;
    if (!list.length) {
      savedList.innerHTML = '<li class="saved-empty">Nothing saved yet. Use the marker on any property.</li>';
      return;
    }
    savedList.innerHTML = list.map(function (i) {
      return '<li><span><span class="addr">' + i.addr + '</span><br><span class="meta">' + i.meta + '</span></span>' +
        '<button class="saved-remove" type="button" data-remove="' + i.addr + '">Remove</button></li>';
    }).join('');
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-save]') : null;
    if (btn) {
      e.preventDefault();
      var addr = btn.getAttribute('data-addr');
      var list = read();
      var i = -1;
      list.forEach(function (item, idx) { if (item.addr === addr) i = idx; });
      if (i > -1) list.splice(i, 1);
      else list.push({ addr: addr, meta: btn.getAttribute('data-meta') || '' });
      write(list);
      paintShortlist();
      return;
    }
    var rm = e.target.closest ? e.target.closest('[data-remove]') : null;
    if (rm) {
      var target = rm.getAttribute('data-remove');
      write(read().filter(function (item) { return item.addr !== target; }));
      paintShortlist();
    }
  });
  paintShortlist();

  /* ---------- overlays ---------------------------------------------------- */
  var openOverlay = null, lastFocus = null;

  function closeOverlay() {
    if (!openOverlay) return;
    openOverlay.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    var stage = $('#theaterStage', openOverlay);
    if (stage) stage.innerHTML = '';
    openOverlay = null;
    if (lastFocus) lastFocus.focus();
  }
  function showOverlay(id) {
    var el = document.getElementById(id);
    if (!el) return;
    lastFocus = document.activeElement;
    openOverlay = el;
    el.classList.add('is-open');
    document.body.classList.add('is-locked');
    var close = $('.overlay-close', el);
    if (close) close.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest ? e.target.closest('[data-open]') : null;
    if (opener) { e.preventDefault(); showOverlay(opener.getAttribute('data-open')); return; }
    if (e.target.closest && e.target.closest('[data-close]')) { closeOverlay(); return; }
    if (openOverlay && e.target === openOverlay) closeOverlay();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (openOverlay) closeOverlay();
    else closeMenu();
  });

  /* ---------- video theater ---------------------------------------------- */
  $$('[data-film]').forEach(function (film) {
    film.addEventListener('click', function () {
      var stage = $('#theaterStage');
      var src = film.getAttribute('data-src') || '';
      $('#theaterName').textContent = film.getAttribute('data-name') || '';
      $('#theaterRole').textContent = film.getAttribute('data-role') || '';
      if (stage) {
        stage.innerHTML = '<video controls playsinline preload="metadata" src="' + src + '"></video>';
        var v = $('video', stage);
        v.addEventListener('error', function () {
          stage.innerHTML = '<div class="theater-empty"><span class="fine">Film slot</span>' +
            '<p style="margin:0">Place the finished film at<br><code>' + src + '</code></p></div>';
        });
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      }
      showOverlay('theater');
    });
  });

  /* ---------- forms -------------------------------------------------------- */
  $$('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = $('[data-status]', form);
      var email = form.querySelector('input[type="email"]');
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
        if (status) status.textContent = 'Please enter a valid email address.';
        email.focus();
        return;
      }
      var kind = form.getAttribute('data-form');
      var msg = kind === 'contact' ? 'Received. Ikem will come back to you directly.'
        : kind === 'portal' ? 'You are on the list for early access.'
        : kind === 'report' ? 'On its way. Check your inbox shortly.'
        : 'Thank you. Your first letter will arrive soon.';
      if (status) status.textContent = msg;
      form.reset();
    });
  });

  /* ---------- year ---------------------------------------------------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

}());
