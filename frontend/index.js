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
const muteButton = document.getElementById('muteButton');
const volumeSlider = document.getElementById('volumeSlider');

let gameLoop;
let paddle, ball, bricks;
let score = 0;
let gameState = 'menu';
let gameMusic;

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLUMNS = 8;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;
const PADDLE_SPEED = 20;
const BALL_SPEED = 5;

const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];

class Paddle {
    constructor() {
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.x = (canvas.width - this.width) / 2;
        this.y = canvas.height - this.height - 10;
    }

    draw() {
        ctx.fillStyle = '#e94560';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#ff9ff3';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
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
        this.dx = 0;
        this.dy = -BALL_SPEED;
        this.radius = BALL_RADIUS;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#54a0ff';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(84, 160, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
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
                this.bounceOffPaddle();
            } else {
                gameState = 'gameOver';
            }
        }
    }

    bounceOffPaddle() {
        const relativeIntersectX = (paddle.x + (paddle.width / 2)) - this.x;
        const normalizedRelativeIntersectionX = relativeIntersectX / (paddle.width / 2);
        
        const incomingAngle = Math.atan2(-this.dy, this.dx);
        const bounceAngle = normalizedRelativeIntersectionX * (Math.PI / 3);
        const newAngle = incomingAngle + bounceAngle;

        const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dx = speed * Math.cos(newAngle);
        this.dy = -Math.abs(speed * Math.sin(newAngle));

        const minVerticalSpeed = 0.1 * speed;
        if (Math.abs(this.dy) < minVerticalSpeed) {
            this.dy = this.dy > 0 ? minVerticalSpeed : -minVerticalSpeed;
        }
    }
}

class Brick {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = BRICK_WIDTH;
        this.height = BRICK_HEIGHT;
        this.status = 1;
        this.color = color;
    }

    draw() {
        if (this.status === 1) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
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
            bricks[c][r] = new Brick(brickX, brickY, COLORS[r % COLORS.length]);
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
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#e94560';
    ctx.fillText(`Score: ${score}`, 8, 20);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    playGameMusic();
    draw();
}

function endGame() {
    cancelAnimationFrame(gameLoop);
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'block';
    finalScoreSpan.textContent = score;
    stopGameMusic();
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
    highScores.forEach(([name, score], index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${name}: ${score}`;
        scoreList.appendChild(li);
    });
}

function initializeAudio() {
    gameMusic = new Audio('path/to/your/8bit-music.mp3');
    gameMusic.loop = true;
    gameMusic.volume = 0.5;
}

function playGameMusic() {
    if (gameMusic) {
        gameMusic.play().catch(error => console.error('Error playing music:', error));
    }
}

function stopGameMusic() {
    if (gameMusic) {
        gameMusic.pause();
        gameMusic.currentTime = 0;
    }
}

function toggleMute() {
    if (gameMusic) {
        gameMusic.muted = !gameMusic.muted;
        muteButton.textContent = gameMusic.muted ? 'Unmute' : 'Mute';
    }
}

function setVolume() {
    if (gameMusic) {
        gameMusic.volume = volumeSlider.value;
    }
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
muteButton.addEventListener('click', toggleMute);
volumeSlider.addEventListener('input', setVolume);

initializeAudio();
updateHighScores();
