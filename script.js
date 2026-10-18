// =====================================================
//  ANA 😸 - Nave 360°  (movimiento + disparo en todas direcciones)
// =====================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreDisplay');
const livesSpan = document.getElementById('livesDisplay');

const CW = 400, CH = 500;
canvas.width = CW;
canvas.height = CH;

// ---- ESTADO ----
let player = {
    x: CW / 2,
    y: CH / 2,
    r: 14,          // radio de colisión
    angle: -Math.PI / 2, // apunta hacia arriba al inicio
    speed: 0,
    maxSpeed: 4.2,
    accel: 0.28,
    friction: 0.92,
    lives: 3,
    invincible: 0   // frames de invencibilidad tras recibir daño
};

let enemies = [];
let bullets = [];
let particles = [];
let score = 0;
let gameOver = false;
let spawnTimer = 0;
let shootCooldown = 0;

const SHOOT_DELAY = 11;
const MAX_ENEMIES = 14;
const SPAWN_INTERVAL = 55; // frames entre spawns

// Teclado
const keys = {
    left: false, right: false, up: false, down: false
};

// Táctil / ratón
let pointerActive = false;
let pointerX = 0;
let pointerY = 0;

// ---- UTILIDADES ----
function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function updateScore() {
    scoreSpan.textContent = score;
}

function updateLives() {
    const hearts = '❤️ '.repeat(player.lives).trim();
    livesSpan.textContent = hearts || '💀';
}

// ---- REINICIAR ----
function resetGame() {
    player.x = CW / 2;
    player.y = CH / 2;
    player.angle = -Math.PI / 2;
    player.speed = 0;
    player.lives = 3;
    player.invincible = 0;
    enemies = [];
    bullets = [];
    particles = [];
    score = 0;
    gameOver = false;
    spawnTimer = 0;
    shootCooldown = 0;
    updateScore();
    updateLives();
}

// ---- DISPARO ----
function shootBullet() {
    if (gameOver || player.lives <= 0) return;
    const speed = 7.5;
    bullets.push({
        x: player.x + Math.cos(player.angle) * 16,
        y: player.y + Math.sin(player.angle) * 16,
        vx: Math.cos(player.angle) * speed,
        vy: Math.sin(player.angle) * speed,
        life: 55
    });
}

// ---- SPAWN DE ENEMIGOS (desde los 4 bordes) ----
function spawnEnemy() {
    if (enemies.length >= MAX_ENEMIES) return;

    const side = Math.floor(Math.random() * 4); // 0=arriba, 1=derecha, 2=abajo, 3=izquierda
    let x, y;
    const margin = 20;

    switch (side) {
        case 0: x = margin + Math.random() * (CW - margin * 2); y = -20; break;
        case 1: x = CW + 20; y = margin + Math.random() * (CH - margin * 2); break;
        case 2: x = margin + Math.random() * (CW - margin * 2); y = CH + 20; break;
        case 3: x = -20; y = margin + Math.random() * (CH - margin * 2); break;
    }

    // Dirección hacia el centro + un poco de variación
    const targetX = CW / 2 + (Math.random() - 0.5) * 120;
    const targetY = CH / 2 + (Math.random() - 0.5) * 120;
    const ang = angleTo(x, y, targetX, targetY);
    const spd = 0.7 + Math.random() * 1.1 + Math.min(score / 400, 1.4);

    const colors = ['#f2b84b', '#d96c4a', '#6bb0d9', '#c77dff', '#ff6b9d'];
    enemies.push({
        x, y,
        r: 13 + Math.random() * 4,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2
    });
}

// ---- PARTÍCULAS (explosiones) ----
function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 3.5;
        particles.push({
            x, y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 20 + Math.random() * 18,
            color
        });
    }
}

// ---- LÓGICA PRINCIPAL ----
function update() {
    if (gameOver) return;

    // --- Movimiento del jugador ---
    let dx = 0, dy = 0;

    if (keys.left)  dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up)    dy -= 1;
    if (keys.down)  dy += 1;

    // Táctil / ratón: moverse hacia el puntero
    if (pointerActive) {
        const distToPointer = dist(player.x, player.y, pointerX, pointerY);
        if (distToPointer > 8) {
            const ang = angleTo(player.x, player.y, pointerX, pointerY);
            dx = Math.cos(ang);
            dy = Math.sin(ang);
        }
    }

    if (dx !== 0 || dy !== 0) {
        // Normalizar diagonal
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;

        player.speed = Math.min(player.speed + player.accel, player.maxSpeed);
        player.angle = Math.atan2(dy, dx);

        player.x += dx * player.speed;
        player.y += dy * player.speed;
    } else {
        player.speed *= player.friction;
        if (player.speed < 0.05) player.speed = 0;
        // Sigue moviéndose un poco por inercia en la dirección actual
        player.x += Math.cos(player.angle) * player.speed;
        player.y += Math.sin(player.angle) * player.speed;
    }

    // Límites del canvas (rebote suave)
    const pad = player.r + 2;
    if (player.x < pad) { player.x = pad; }
    if (player.x > CW - pad) { player.x = CW - pad; }
    if (player.y < pad) { player.y = pad; }
    if (player.y > CH - pad) { player.y = CH - pad; }

    // Invencibilidad
    if (player.invincible > 0) player.invincible--;

    // --- Disparo automático ---
    shootCooldown--;
    if (shootCooldown <= 0) {
        shootBullet();
        shootCooldown = SHOOT_DELAY;
    }

    // --- Balas ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.life <= 0 || b.x < -20 || b.x > CW + 20 || b.y < -20 || b.y > CH + 20) {
            bullets.splice(i, 1);
        }
    }

    // --- Spawn de enemigos ---
    spawnTimer++;
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        spawnEnemy();
        // A veces spawnea dos a la vez cuando sube la dificultad
        if (score > 150 && Math.random() < 0.35) spawnEnemy();
    }

    // --- Enemigos ---
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.wobble += 0.08;
        e.x += e.vx + Math.sin(e.wobble) * 0.4;
        e.y += e.vy + Math.cos(e.wobble * 0.7) * 0.3;

        // Si se alejan mucho, los eliminamos
        if (e.x < -60 || e.x > CW + 60 || e.y < -60 || e.y > CH + 60) {
            enemies.splice(i, 1);
            continue;
        }

        // Colisión bala ↔ enemigo
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (dist(b.x, b.y, e.x, e.y) < e.r + 4) {
                createExplosion(e.x, e.y, e.color, 12);
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                updateScore();
                break;
            }
        }
    }

    // --- Colisión enemigo ↔ jugador ---
    if (player.invincible <= 0) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (dist(player.x, player.y, e.x, e.y) < player.r + e.r - 2) {
                // Daño
                player.lives--;
                player.invincible = 70; // ~1.1 segundos
                updateLives();
                createExplosion(e.x, e.y, '#ff6b6b', 16);
                enemies.splice(i, 1);

                if (player.lives <= 0) {
                    gameOver = true;
                    createExplosion(player.x, player.y, '#b1dcff', 25);
                }
                break;
            }
        }
    }

    // --- Partículas ---
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ---- DIBUJAR ----
function draw() {
    // Fondo
    ctx.fillStyle = '#0b111f';
    ctx.fillRect(0, 0, CW, CH);

    // Estrellas
    for (let i = 0; i < 60; i++) {
        if (i % 3 === 0) continue;
        ctx.fillStyle = `rgba(255,255,240,${0.35 + (i % 7) * 0.08})`;
        ctx.beginPath();
        ctx.arc((i * 37) % CW, (i * 53) % CH, 1.1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Partículas
    for (const p of particles) {
        ctx.globalAlpha = Math.min(1, p.life / 15);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Balas
    ctx.shadowColor = '#f0ff60';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#f2ff80';
    for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Enemigos
    for (const e of enemies) {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.roundRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2, 5);
        ctx.fill();

        // Ojos
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fcf9ea';
        ctx.fillRect(e.x - e.r + 4, e.y - 5, 5, 5);
        ctx.fillRect(e.x + e.r - 9, e.y - 5, 5, 5);
        ctx.fillStyle = '#121212';
        ctx.fillRect(e.x - e.r + 5, e.y - 3, 2.5, 2.5);
        ctx.fillRect(e.x + e.r - 7.5, e.y - 3, 2.5, 2.5);
    }
    ctx.shadowBlur = 0;

    // Nave (con rotación)
    if (player.lives > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle + Math.PI / 2); // +90° porque el sprite apunta "arriba"

        // Parpadeo de invencibilidad
        if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        }

        ctx.shadowColor = '#7bb3ff';
        ctx.shadowBlur = 18;

        // Cuerpo
        ctx.fillStyle = '#b1dcff';
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(12, 10);
        ctx.lineTo(5, 6);
        ctx.lineTo(-5, 6);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();

        // Cabina
        ctx.fillStyle = '#76b8ff';
        ctx.beginPath();
        ctx.ellipse(0, -4, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Alas laterales
        ctx.fillStyle = '#5f9eff';
        ctx.fillRect(-14, 2, 5, 8);
        ctx.fillRect(9, 2, 5, 8);

        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // Mensaje Game Over
    if (gameOver) {
        ctx.font = 'bold 26px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffb0a0';
        ctx.shadowColor = '#ff4f4f';
        ctx.shadowBlur = 22;
        ctx.fillText('💀 GAME OVER', CW / 2, CH / 2 - 18);
        ctx.shadowBlur = 0;
        ctx.font = '14px monospace';
        ctx.fillStyle = '#a0b0c8';
        ctx.fillText('Pulsa Reiniciar', CW / 2, CH / 2 + 18);
    }

    // Indicador de dirección (pequeña flecha en la nave cuando está quieta)
    if (!gameOver && player.speed < 0.3) {
        ctx.strokeStyle = 'rgba(177, 220, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
            player.x + Math.cos(player.angle) * 28,
            player.y + Math.sin(player.angle) * 28
        );
        ctx.stroke();
    }
}

// Helper roundRect (por compatibilidad)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}

// ---- LOOP ----
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ---- CONTROLES TECLADO ----
window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = true; e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { keys.right = true; e.preventDefault(); }
    if (k === 'arrowup' || k === 'w') { keys.up = true; e.preventDefault(); }
    if (k === 'arrowdown' || k === 's') { keys.down = true; e.preventDefault(); }
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
    if (k === 'arrowup' || k === 'w') keys.up = false;
    if (k === 'arrowdown' || k === 's') keys.down = false;
});

// ---- CONTROLES PUNTERO (ratón + táctil) ----
function getCanvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (CW / rect.width),
        y: (clientY - rect.top) * (CH / rect.height)
    };
}

function onPointerDown(e) {
    e.preventDefault();
    pointerActive = true;
    const p = e.touches ? e.touches[0] : e;
    const pos = getCanvasPos(p.clientX, p.clientY);
    pointerX = pos.x;
    pointerY = pos.y;
}

function onPointerMove(e) {
    if (!pointerActive) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    const pos = getCanvasPos(p.clientX, p.clientY);
    pointerX = pos.x;
    pointerY = pos.y;
}

function onPointerUp(e) {
    e.preventDefault();
    pointerActive = false;
}

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseup', onPointerUp);
canvas.addEventListener('mouseleave', onPointerUp);

canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove', onPointerMove, { passive: false });
canvas.addEventListener('touchend', onPointerUp, { passive: false });
canvas.addEventListener('touchcancel', onPointerUp, { passive: false });

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

document.getElementById('resetBtn').addEventListener('click', resetGame);

// ---- INICIO ----
updateScore();
updateLives();
gameLoop();
