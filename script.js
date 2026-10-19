// ---- CONFIGURACIÓN RETRO ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreDisplay');
const livesSpan = document.getElementById('livesDisplay'); // NUEVO

const CW = 400, CH = 500;
canvas.width = CW; canvas.height = CH;

// ---- ESTADO DEL JUEGO ----
// CAMBIO 1: nave en el centro + ángulo + 3 vidas
let player = {
    x: CW / 2,
    y: CH / 2,
    w: 30,
    h: 16,
    angle: -Math.PI / 2,
    lives: 3,
    invincible: 1
};

let enemies = [];
let bullets = [];
let score = 0;
let gameOver = false;

// CAMBIO 2: controles en 4 direcciones
let keys = { left: false, right: false, up: false, down: false };

// CAMBIO 3: enemigos aparecen desde los bordes
let spawnTimer = 0;
const SPAWN_INTERVAL = 55;
const MAX_ENEMIES = 14;

let shootCooldown = 7;
const SHOOT_DELAY = 12;

let pointerActive = false;
let pointerX = 0;
let pointerY = 0;

function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function initEnemies() {
    enemies = [];
    spawnTimer = 0;
}

function resetGame() {
    player.x = CW / 2;
    player.y = CH / 2;
    player.angle = -Math.PI / 2;
    player.lives = 3;
    player.invincible = 1;
    bullets = [];
    score = 0;
    gameOver = false;
    keys = { left: false, right: false, up: false, down: false };
    shootCooldown = 5;
    pointerActive = false;
    initEnemies();
    updateScore();
    updateLives();
}

// CAMBIO 6: la bala sale en la dirección del ángulo
function shootBullet() {
    if (gameOver || player.lives <= 0) return;
    const speed = 6;
    bullets.push({
        x: player.x + Math.cos(player.angle) * 10,
        y: player.y + Math.sin(player.angle) * 10,
        vx: Math.cos(player.angle) * speed,
        vy: Math.sin(player.angle) * speed,
        life: 50
    });
}

function updateScore() {
    scoreSpan.textContent = score;
}

function updateLives() {
    livesSpan.textContent = player.lives > 0
        ? '❤️ '.repeat(player.lives).trim()
        : '💀';
}

function rectCollide(r1, r2) {
    return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x ||
        r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}

// CAMBIO 7: enemigos salen de los 4 lados y van al centro
function spawnEnemy() {
    if (enemies.length >= MAX_ENEMIES) return;

    const side = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 20;

    if (side === 0) { x = margin + Math.random() * (CW - margin * 2); y = -25; }
    else if (side === 1) { x = CW + 25; y = margin + Math.random() * (CH - margin * 2); }
    else if (side === 2) { x = margin + Math.random() * (CW - margin * 2); y = CH + 25; }
    else { x = -25; y = margin + Math.random() * (CH - margin * 2); }

    const tx = CW / 2 + (Math.random() - 0.5) * 100;
    const ty = CH / 2 + (Math.random() - 0.5) * 100;
    const ang = angleTo(x, y, tx, ty);
    const spd = 0.8 + Math.random() * 1.0 + Math.min(score / 350, 1.2);

    const colors = ['#f2b84b', '#d96c4a', '#6bb0d9', '#c77dff'];
    enemies.push({
        x, y,
        w: 26,
        h: 20,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        alive: true,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

function update() {
    if (gameOver) return;

    let moveX = 0;
    let moveY = 0;
    const SPEED = 4.5;

    if (keys.left)  moveX -= 1;
    if (keys.right) moveX += 1;
    if (keys.up)    moveY -= 1;
    if (keys.down)  moveY += 1;

    if (pointerActive) {
        const d = dist(player.x, player.y, pointerX, pointerY);
        if (d > 10) {
            const a = angleTo(player.x, player.y, pointerX, pointerY);
            moveX = Math.cos(a);
            moveY = Math.sin(a);
        }
    }

    if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY) || 1;
        moveX /= len;
        moveY /= len;
        player.angle = Math.atan2(moveY, moveX);
        player.x += moveX * SPEED;
        player.y += moveY * SPEED;
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > CW) player.x = CW - player.w;
    if (player.y < 0) player.y = 0;
    if (player.y + player.h > CH) player.y = CH - player.h;

    if (player.invincible > 0) player.invincible--;

    shootCooldown--;
    if (shootCooldown <= 0) {
        shootBullet();
        shootCooldown = SHOOT_DELAY;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.life <= 0 || b.x < -30 || b.x > CW + 30 || b.y < -30 || b.y > CH + 30) {
            bullets.splice(i, 1);
        }
    }

    spawnTimer++;
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 2;
        spawnEnemy();
        if (score > 120 && Math.random() < 0.3) spawnEnemy();
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.alive) continue;
        e.x += e.vx;
        e.y += e.vy;
        if (e.x < -80 || e.x > CW + 80 || e.y < -80 || e.y > CH + 80) {
            enemies.splice(i, 1);
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let bulletUsed = false;
        for (const e of enemies) {
            if (!e.alive) continue;
            const ex = e.x + e.w / 2;
            const ey = e.y + e.h / 2;
            if (dist(b.x, b.y, ex, ey) < 16) {
                e.alive = false;
                bulletUsed = true;
                score += 10;
                updateScore();
                break;
            }
        }
        if (bulletUsed) bullets.splice(i, 1);
    }

    enemies = enemies.filter(e => e.alive);

    if (player.invincible <= 0) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (rectCollide(player, e)) {
                player.lives--;
                player.invincible = 70;
                updateLives();
                enemies.splice(i, 1);
                if (player.lives <= 0) gameOver = true;
                break;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, CW, CH);

    ctx.fillStyle = '#0b111f';
    ctx.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 70; i++) {
        if (i % 2 === 0) continue;
        ctx.fillStyle = `rgba(255,255,240,${0.4 + (i % 5) * 0.1})`;
        ctx.beginPath();
        ctx.arc((i * 23) % CW, (i * 13) % CH, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    if (player.lives > 0) {
        ctx.save();
        ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
        ctx.rotate(player.angle + Math.PI / 2);
        if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }
        ctx.shadowColor = '#7bb3ff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#b1dcff';
        ctx.beginPath();
        ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 6);
        ctx.fill();
        ctx.fillStyle = '#76b8ff';
        ctx.beginPath();
        ctx.roundRect(-7, -player.h / 2 - 6, 14, 8, 4);
        ctx.fill();
        ctx.fillStyle = '#5f9eff';
        ctx.fillRect(-player.w / 2 - 4, -4, 4, 8);
        ctx.fillRect(player.w / 2, -4, 4, 8);
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#f2ff80';
    ctx.shadowColor = '#f0ff60';
    ctx.shadowBlur = 16;
    for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const e of enemies) {
        if (!e.alive) continue;
        ctx.fillStyle = e.color;
        ctx.shadowColor = '#b0d0ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(e.x, e.y, e.w, e.h, 6);
        ctx.fill();
        ctx.fillStyle = '#fcf9ea';
        ctx.shadowBlur = 4;
        ctx.fillRect(e.x + 4, e.y + 3, 6, 6);
        ctx.fillRect(e.x + e.w - 10, e.y + 3, 6, 6);
        ctx.fillStyle = '#121212';
        ctx.fillRect(e.x + 6, e.y + 5, 3, 3);
        ctx.fillRect(e.x + e.w - 8, e.y + 5, 3, 3);
    }
    ctx.shadowBlur = 0;

    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (gameOver) {
        ctx.fillStyle = '#ffb0a0';
        ctx.shadowColor = '#ff4f4f';
        ctx.shadowBlur = 24;
        ctx.fillText('GAME OVER', CW / 2, CH / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.font = '14px monospace';
        ctx.fillStyle = '#a0b0c8';
        ctx.fillText('Pulsa Reiniciar', CW / 2, CH / 2 + 16);
    }
}

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

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') { keys.left = true; e.preventDefault(); }
    else if (key === 'arrowright' || key === 'd') { keys.right = true; e.preventDefault(); }
    else if (key === 'arrowup' || key === 'w') { keys.up = true; e.preventDefault(); }
    else if (key === 'arrowdown' || key === 's') { keys.down = true; e.preventDefault(); }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') keys.left = false;
    else if (key === 'arrowright' || key === 'd') keys.right = false;
    else if (key === 'arrowup' || key === 'w') keys.up = false;
    else if (key === 'arrowdown' || key === 's') keys.down = false;
}

function getCanvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (CW / rect.width),
        y: (clientY - rect.top) * (CH / rect.height)
    };
}

function handlePointerDown(e) {
    e.preventDefault();
    pointerActive = true;
    const t = e.touches ? e.touches[0] : e;
    const pos = getCanvasPos(t.clientX, t.clientY);
    pointerX = pos.x;
    pointerY = pos.y;
}

function handlePointerMove(e) {
    if (!pointerActive) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const pos = getCanvasPos(t.clientX, t.clientY);
    pointerX = pos.x;
    pointerY = pos.y;
}

function handlePointerUp(e) {
    e.preventDefault();
    pointerActive = false;
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
canvas.addEventListener('touchend', handlePointerUp, { passive: false });
canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('mouseleave', handlePointerUp);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

document.getElementById('resetBtn').addEventListener('click', resetGame);

initEnemies();
updateScore();
updateLives();
gameLoop();
// ---- INICIO ----
updateScore();
updateLives();
gameLoop();
