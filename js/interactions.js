/* ============================================================
   BEYOND THE PITCH — Interactions v3
   ============================================================ */

/* ── Loader ──────────────────────────────────────────── */
(function() {
    var fill  = document.getElementById('loader-fill');
    var loader = document.getElementById('loader');
    var pct = 0;
    var iv = setInterval(function() {
        pct += Math.random() * 12 + 4;
        if (pct > 100) pct = 100;
        if (fill) fill.style.width = pct + '%';
        if (pct >= 100) {
            clearInterval(iv);
            setTimeout(function() {
                if (loader) loader.classList.add('hidden');
                animateHeroStats();
                revealVisible();
            }, 300);
        }
    }, 90);
})();

/* ── Custom Cursor ───────────────────────────────────── */
var cur = document.getElementById('cursor');
var trail = document.getElementById('cursor-trail');
var mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    if (cur) { cur.style.left = mx+'px'; cur.style.top = my+'px'; }
});

(function animTrail() {
    tx += (mx-tx)*0.12; ty += (my-ty)*0.12;
    if (trail) { trail.style.left = tx+'px'; trail.style.top = ty+'px'; }
    requestAnimationFrame(animTrail);
})();

/* ── Scroll Progress ─────────────────────────────────── */
var progressBar = document.getElementById('scroll-progress-bar');
window.addEventListener('scroll', function() {
    var scrolled = document.documentElement.scrollTop;
    var maxS = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = ((scrolled/maxS)*100) + '%';
    revealVisible();
    updateActiveNav();
}, {passive:true});

/* ── Hero Stat Counters ──────────────────────────────── */
function animateHeroStats() {
    document.querySelectorAll('.hstat-num').forEach(function(el) {
        var target = parseFloat(el.dataset.target);
        var prefix = el.dataset.prefix || '';
        var suffix = el.dataset.suffix || '';
        if (!target) return;
        var start = performance.now();
        var dur = 1400 + Math.random()*400;
        function upd(now) {
            var t = Math.min((now-start)/dur, 1);
            var eased = 1 - Math.pow(1-t, 4);
            var val = target < 10 ? (target*eased).toFixed(0) : Math.round(target*eased).toLocaleString();
            el.textContent = prefix + val + suffix;
            if (t < 1) requestAnimationFrame(upd);
        }
        requestAnimationFrame(upd);
    });
}

/* ── Reveal on scroll ────────────────────────────────── */
function revealVisible() {
    document.querySelectorAll('.tevent').forEach(function(el) {
        if (el.getBoundingClientRect().top < window.innerHeight - 80) el.classList.add('visible');
    });
    document.querySelectorAll('.fade-up').forEach(function(el) {
        if (el.getBoundingClientRect().top < window.innerHeight - 60) el.classList.add('visible');
    });
}

/* ── Nav Active ──────────────────────────────────────── */
var sections = ['hero','history','race','worldmap','rivalries','dominance',
                'economics','legends','patterns','nations','explorer','epilogue'];
var chapterNames = {
    hero:'Introduction', history:'Chapter 01 — History', race:'Chapter 02 — The Race',
    worldmap:'Chapter 03 — World Map', rivalries:'Chapter 04 — Rivalries',
    dominance:'Chapter 05 — Dominance', economics:'Chapter 06 — Economics',
    legends:'Chapter 07 — Legends', patterns:'Chapter 08 — Patterns',
    nations:'Chapter 09 — Nations', explorer:'Chapter 10 — Compare', epilogue:'Epilogue'
};

function updateActiveNav() {
    var scrollY = window.scrollY + 140;
    var active = sections[0];
    sections.forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) active = id;
    });
    document.querySelectorAll('.nav-links a').forEach(function(a) {
        var href = (a.getAttribute('href')||'').replace('#','');
        a.classList.toggle('active', href===active);
    });
    var ct = document.getElementById('nav-chapter-text');
    if (ct && chapterNames[active]) ct.textContent = chapterNames[active];
}

/* ── Nav smooth scroll ───────────────────────────────── */
document.querySelectorAll('.nav-links a').forEach(function(a) {
    a.addEventListener('click', function(e) {
        e.preventDefault();
        var id = (a.getAttribute('href')||'').replace('#','');
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({behavior:'smooth'});
    });
});

/* ── Initial reveal ──────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function() {
    revealVisible();
    updateActiveNav();
});
window.addEventListener('load', function() {
    revealVisible();
    updateActiveNav();
});

// ── Reveal htv-pairs on scroll ────────────────────────────
function revealHtvPairs() {
    document.querySelectorAll('.htv-pair').forEach(function(el) {
        if (el.getBoundingClientRect().top < window.innerHeight - 40) {
            el.classList.add('htv-visible');
        }
    });
}
window.addEventListener('load', revealHtvPairs);
window.addEventListener('scroll', revealHtvPairs, { passive: true });
