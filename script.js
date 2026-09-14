const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const scoreSpan = document.getElementById('scoreDisplay')

const CW = 400, CH = 500;
canvas.width = CW ;
canvas.height = CH

//ESTADO DEL JUEGO
let player = {x: 180, y: 450, w: 30,h= 18}
let enemies = []
let bullets = []
let score = 0
let gameOver =false
let winFlag = false

let leftPressed = false
let rightPressed = false
let moveX = 0


