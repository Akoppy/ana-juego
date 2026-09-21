const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const scoreSpan = document.getElementById('scoreDisplay')

const CW = 400, CH = 500;
canvas.width = CW ;
canvas.height = CH

//ESTADO DEL JUEGO
let player = {x: 180, y: 450, w: 30, h: 18}
let enemies = []
let bullets = []
let score = 0
let gameOver =false
let winFlag = false

let leftPressed = false
let rightPressed = false
let moveX = 0

const ENEMY_ROWS = 4 ;
const ENEMY_COLS = 6 ;
const ENEMY_SPACING= 12;
const ENEMY_W = 26;
const ENEMY_H = 20;
let enemyDirection =1
let enemySpeed = 0.8 
let enemyMoveCounter=0
const ENEMY_MOVE_FRAMES=12
let shootCooldown =0
const SHOOT_DELAY =14

// inicializacion de enemigos
function initEnemies() {
    enemies = []
    const startX =30
    const startY= 40
   for (let row = 0; row < ENEMY_ROWS; row++) {
   for (let col = 0; col < ENEMY_COLS; col++) {
       enemies.push({
           x: startX + col *(ENEMY_W + ENEMY_SPACING), 
           y: startY + row *(ENEMY_H + ENEMY_SPACING),
           w: ENEMY_W,
           h: ENEMY_H,
           alive:true,
           color:row === 0 ? '#5673A3' :(row === 1 ? '#6485BD': '#7B9BD4')
       })
    }
    }
    enemyDirection = 1
    enemySpeed = 0.8
    enemyMoveCounter=0    
}

// reiniciar
function resetGame() {
    player.x = 180
    bullets=[]
    score = 0
    gameOver= false
    winFlag =false
    leftPressed = false
    rightPressed = false
    moveX = 0
    shootCooldown =0
    initEnemies()
    updateScore()
}
//actualizar puntos
function updateScore(){
    scoreSpan.textContent= score
}

//disparar
function shootBullet() {
    if (gameOver || winFlag) return 
    bullets.push({
        x:player.x + player.w/2-3,
        y:player.y-8,
        w:6,
        h:14,
        speed:5

    })
}

//colisiones
function rectCollide(r1,r2){
    return !(r2.x > r1.y + r1.w || r2.x + r2.w <r1.x ||r2.y + r1.y+ r2.h <r1.y)
}

//funciones del teclado
function handleKeyDown (e) {}

function handleKeyup (e) {}

//funciones para tactil

function handleTouchStart(e) {}

function handleTouchEnd (e) {}



//EVENTOS
window.addEventListener('keydown', handleKeyDown)
window.addEventListener('keyup', handleKeyup)
canvas.addEventListener('touchstart', handleTouchStart, {passive: false})
canvas.addEventListener('touchmove', handlemove, {passive: false})
canvas.addEventListener('touchend', handleTouchEnd, {passive: false})
canvas.addEventListener('contextmenu', (e) => e.preventDefault())
document.getElementById('resetBtn').addEventListener('click',resetGame)

//inicio del juego alli llamareamos las funciones que necesitemos
initEnemies()
updateScore()
