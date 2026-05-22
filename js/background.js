/* ── Background Canvas — Floating particle field ── */
(function () {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], frame = 0;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const GOLD  = 'rgba(245,200,66,';
    const ROSE  = 'rgba(255,77,109,';
    const TEAL  = 'rgba(61,214,192,';
    const COLS  = [GOLD, ROSE, TEAL];

    function mkParticle() {
        const c = COLS[Math.floor(Math.random() * COLS.length)];
        return {
            x:    Math.random() * W,
            y:    Math.random() * H,
            r:    Math.random() * 1.2 + 0.3,
            vx:   (Math.random() - 0.5) * 0.25,
            vy:   (Math.random() - 0.5) * 0.25,
            a:    Math.random() * 0.4 + 0.05,
            col:  c,
            da:   (Math.random() - 0.5) * 0.002,
        };
    }

    for (let i = 0; i < 120; i++) particles.push(mkParticle());

    // Football pitch lines — faint geometric background
    function drawPitchLines() {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.012)';
        ctx.lineWidth = 1;

        // Outer rectangle
        const px = W * 0.15, py = H * 0.2, pw = W * 0.7, ph = H * 0.6;
        ctx.strokeRect(px, py, pw, ph);

        // Centre line
        ctx.beginPath();
        ctx.moveTo(W / 2, py);
        ctx.lineTo(W / 2, py + ph);
        ctx.stroke();

        // Centre circle
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, Math.min(pw, ph) * 0.14, 0, Math.PI * 2);
        ctx.stroke();

        // Penalty boxes
        const pbw = pw * 0.25, pbh = ph * 0.35;
        ctx.strokeRect(px, H / 2 - pbh / 2, pbw, pbh);
        ctx.strokeRect(px + pw - pbw, H / 2 - pbh / 2, pbw, pbh);

        ctx.restore();
    }

    function draw() {
        frame++;
        ctx.clearRect(0, 0, W, H);
        drawPitchLines();

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.a += p.da;
            if (p.a < 0.03 || p.a > 0.45) p.da *= -1;
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.col + p.a + ')';
            ctx.fill();
        });

        // Connection lines between close particles
        if (frame % 2 === 0) {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 90) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(245,200,66,${0.03 * (1 - dist / 90)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        requestAnimationFrame(draw);
    }

    draw();
})();
