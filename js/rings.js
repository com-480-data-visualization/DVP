/* ============================================================
   HERO RINGS — Animated stat arcs behind the player cards
   Three orbital rings per player, pulsing and rotating
   ============================================================ */
(function () {
    window.addEventListener('load', function () {
        var canvas = document.getElementById('rings-canvas');
        var wrap   = document.querySelector('.hero-rings-wrap');
        if (!canvas || !wrap) return;

        var ctx = canvas.getContext('2d');
        var W, H, dpr = window.devicePixelRatio || 1;

        function resize() {
            W = wrap.offsetWidth;
            H = wrap.offsetHeight;
            canvas.width  = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width  = W + 'px';
            canvas.style.height = H + 'px';
            ctx.scale(dpr, dpr);
        }

        window.addEventListener('resize', function () { resize(); });
        resize();

        // Three player centres (left, centre, right thirds)
        var PLAYERS = [
            {
                name: 'Prinz',
                goals: 34, maxGoals: 34,
                careerPct: 1.0,   // 14yr / 14yr max
                color: '#f5c842',
                rings: [
                    { r: 0,   speed: 0.003,  offset: 0 },
                    { r: 0,   speed: -0.002, offset: 1.4 },
                    { r: 0,   speed: 0.0015, offset: 2.8 }
                ]
            },
            {
                name: 'Marta',
                goals: 24, maxGoals: 34,
                careerPct: 22/24,
                color: '#f5c842',
                rings: [
                    { r: 0,   speed: 0.0025,  offset: 0.5 },
                    { r: 0,   speed: -0.0018, offset: 2.1 },
                    { r: 0,   speed: 0.0012,  offset: 3.6 }
                ]
            },
            {
                name: 'Wambach',
                goals: 23, maxGoals: 34,
                careerPct: 14/24,
                color: '#f5c842',
                rings: [
                    { r: 0,   speed: 0.002,   offset: 1.0 },
                    { r: 0,   speed: -0.0022, offset: 2.6 },
                    { r: 0,   speed: 0.0017,  offset: 4.0 }
                ]
            }
        ];

        // Ring config: radius offset, arc fill fraction, line width, opacity
        var RING_CONF = [
            { dr: 0,   fill: function(p){ return p.goals / p.maxGoals; },       lw: 2.5, alpha: 0.55 },
            { dr: 18,  fill: function(p){ return p.careerPct; },                 lw: 1.5, alpha: 0.35 },
            { dr: 36,  fill: function(){ return 0.6 + Math.random()*0.05; },     lw: 1,   alpha: 0.2  }
        ];

        var baseR = 0, progress = 0;
        var startTime = performance.now();

        function getPlayerCX(i) {
            // card occupies 1/3 of width each
            var cardW = W / 3;
            return cardW * i + cardW / 2;
        }
        function getPlayerCY() { return H / 2; }

        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

        function draw(now) {
            ctx.clearRect(0, 0, W, H);

            var elapsed = (now - startTime) / 1000; // seconds
            progress = Math.min(elapsed / 1.8, 1);   // 1.8s intro
            var ep = easeOut(progress);

            // Compute base radius from card height
            baseR = Math.min(W / 3, H) * 0.42;

            PLAYERS.forEach(function (p, pi) {
                var cx = getPlayerCX(pi);
                var cy = getPlayerCY();

                RING_CONF.forEach(function (rc, ri) {
                    var rad  = baseR + rc.dr;
                    var rot  = p.rings[ri].offset + elapsed * p.rings[ri].speed * Math.PI * 2;
                    var fill = rc.fill(p) * ep;

                    // Subtle background ring (full circle, very faint)
                    ctx.beginPath();
                    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(245,200,66,' + (rc.alpha * 0.18) + ')';
                    ctx.lineWidth   = rc.lw;
                    ctx.stroke();

                    // Active arc
                    var startA = rot - Math.PI / 2;
                    var endA   = startA + fill * Math.PI * 2;

                    var grad = ctx.createLinearGradient(
                        cx + Math.cos(startA) * rad,
                        cy + Math.sin(startA) * rad,
                        cx + Math.cos(endA) * rad,
                        cy + Math.sin(endA) * rad
                    );
                    grad.addColorStop(0,   'rgba(245,200,66,' + (rc.alpha * 0.3) + ')');
                    grad.addColorStop(0.5, 'rgba(245,200,66,' + rc.alpha + ')');
                    grad.addColorStop(1,   'rgba(255,77,109,'  + (rc.alpha * 0.6) + ')');

                    ctx.beginPath();
                    ctx.arc(cx, cy, rad, startA, endA);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth   = rc.lw;
                    ctx.lineCap     = 'round';
                    ctx.stroke();

                    // End-cap dot
                    var dotX = cx + Math.cos(endA) * rad;
                    var dotY = cy + Math.sin(endA) * rad;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, rc.lw * 1.4, 0, Math.PI * 2);
                    ctx.fillStyle = ri === 0 ? p.color : 'rgba(245,200,66,' + rc.alpha + ')';
                    ctx.fill();
                });

                // Tiny orbiting particles
                var numDots = 4;
                for (var d = 0; d < numDots; d++) {
                    var angle = (d / numDots) * Math.PI * 2 + elapsed * 0.4 * (pi % 2 === 0 ? 1 : -1);
                    var pr = baseR + 8 + Math.sin(elapsed * 1.2 + d) * 6;
                    ctx.beginPath();
                    ctx.arc(cx + Math.cos(angle) * pr, cy + Math.sin(angle) * pr, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(245,200,66,' + (0.15 + 0.1 * Math.sin(elapsed + d)) + ')';
                    ctx.fill();
                }
            });

            // Connecting line between player centres (very subtle)
            ctx.beginPath();
            ctx.moveTo(getPlayerCX(0), getPlayerCY());
            ctx.lineTo(getPlayerCX(2), getPlayerCY());
            ctx.strokeStyle = 'rgba(245,200,66,' + (0.04 * ep) + ')';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 8]);
            ctx.stroke();
            ctx.setLineDash([]);

            requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);
    });
})();

/* ── Animate donut rings on load ─────────────────────────── */
window.addEventListener('load', function () {
    setTimeout(function () {
        document.querySelectorAll('.donut-arc').forEach(function (arc) {
            var fill = parseFloat(arc.getAttribute('data-fill')) || 0;
            var total = 188.5;
            arc.style.strokeDashoffset = (total - fill).toString();
        });
    }, 400);
});
