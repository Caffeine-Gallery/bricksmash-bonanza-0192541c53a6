import { backend } from 'declarations/backend';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');
const playerNameInput = document.getElementById('playerName');
const submitScoreButton = document.getElementById('submitScore');
const scoreList = document.getElementById('scoreList');

let gameLoop;
let paddle, ball, bricks;
let score = 0;
let gameState = 'menu';

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 5;
const BRICK_ROWS = 5;
const BRICK_COLUMNS = 8;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;
const PADDLE_SPEED = 7;

class Paddle {
    constructor() {
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.x = (canvas.width - this.width) / 2;
        this.y = canvas.height - this.height - 10;
    }

    draw() {
        ctx.fillStyle = '#0095DD';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(direction) {
        if (direction === 'left') {
            this.x -= PADDLE_SPEED;
        } else if (direction === 'right') {
            this.x += PADDLE_SPEED;
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }
}

class Ball {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 30;
        this.dx = 2;
        this.dy = -2;
        this.radius = BALL_RADIUS;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0095DD';
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x + this.dx > canvas.width - this.radius || this.x + this.dx < this.radius) {
            this.dx = -this.dx;
        }
        if (this.y + this.dy < this.radius) {
            this.dy = -this.dy;
        } else if (this.y + this.dy > canvas.height - this.radius) {
            if (this.x > paddle.x && this.x < paddle.x + paddle.width) {
                this.dy = -this.dy;
            } else {
                gameState = 'gameOver';
            }
        }
    }
}

class Brick {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = BRICK_WIDTH;
        this.height = BRICK_HEIGHT;
        this.status = 1;
    }

    draw() {
        if (this.status === 1) {
            ctx.fillStyle = '#0095DD';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

function initializeBricks() {
    const bricks = [];
    for (let c = 0; c < BRICK_COLUMNS; c++) {
        bricks[c] = [];
        for (let r = 0; r < BRICK_ROWS; r++) {
            const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
            bricks[c][r] = new Brick(brickX, brickY);
        }
    }
    return bricks;
}

function collisionDetection() {
    for (let c = 0; c < BRICK_COLUMNS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                if (
                    ball.x > brick.x &&
                    ball.x < brick.x + brick.width &&
                    ball.y > brick.y &&
                    ball.y < brick.y + brick.height
                ) {
                    ball.dy = -ball.dy;
                    brick.status = 0;
                    score++;
                    if (score === BRICK_ROWS * BRICK_COLUMNS) {
                        gameState = 'gameOver';
                    }
                }
            }
        }
    }
}

function drawScore() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#0095DD';
    ctx.fillText(`Score: ${score}`, 8, 20);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paddle.draw();
    ball.draw();
    drawScore();

    for (let c = 0; c < BRICK_COLUMNS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
            bricks[c][r].draw();
        }
    }

    collisionDetection();
    ball.move();

    if (gameState === 'playing') {
        requestAnimationFrame(draw);
    } else if (gameState === 'gameOver') {
        endGame();
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    paddle = new Paddle();
    ball = new Ball();
    bricks = initializeBricks();
    menu.style.display = 'none';
    canvas.style.display = 'block';
    draw();
}

function endGame() {
    cancelAnimationFrame(gameLoop);
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'block';
    finalScoreSpan.textContent = score;
}

async function submitScore() {
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        await backend.addHighScore(playerName, score);
        await updateHighScores();
        gameOverScreen.style.display = 'none';
        menu.style.display = 'block';
    }
}

async function updateHighScores() {
    const highScores = await backend.getHighScores();
    scoreList.innerHTML = '';
    highScores.forEach(([name, score]) => {
        const li = document.createElement('li');
        li.textContent = `${name}: ${score}`;
        scoreList.appendChild(li);
    });
}

document.addEventListener('keydown', (e) => {
    if (gameState === 'playing') {
        if (e.key === 'ArrowLeft') {
            paddle.move('left');
        } else if (e.key === 'ArrowRight') {
            paddle.move('right');
        }
    }
});

startButton.addEventListener('click', startGame);
submitScoreButton.addEventListener('click', submitScore);

// Initialize high scores on page load
updateHighScores();
