var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var scoreEl = document.getElementById("score");
var livesEl = document.getElementById("lives");
var overlay = document.getElementById("overlay");
var titleEl = document.getElementById("title");
var subtitleEl = document.getElementById("subtitle");
var startBtn = document.getElementById("start");

var mainColor = "#0078d4";
var glowColor = "#50e6ff";

var ballRadius = 9;
var x, y, dx, dy;
var paddleHeight = 12;
var paddleWidth = 80;
var paddleX;
var rightPressed = false;
var leftPressed = false;
var brickRowCount = 5;
var brickColumnCount = 3;
var brickWidth = 76;
var brickHeight = 22;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;
var score = 0;
var lives = 3;
var running = false;
var bricks = [];

function buildBricks() {
    bricks = [];
    for(var c=0; c<brickColumnCount; c++) {
        bricks[c] = [];
        for(var r=0; r<brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
}

function resetBall() {
    x = canvas.width/2;
    y = canvas.height-30;
    dx = 2.5;
    dy = -2.5;
    paddleX = (canvas.width-paddleWidth)/2;
}

function updateHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
startBtn.addEventListener("click", startGame);

function keyDownHandler(e) {
    if(e.code == "ArrowRight") {
        rightPressed = true;
    }
    else if(e.code == "ArrowLeft") {
        leftPressed = true;
    }
}
function keyUpHandler(e) {
    if(e.code == "ArrowRight") {
        rightPressed = false;
    }
    else if(e.code == "ArrowLeft") {
        leftPressed = false;
    }
}
function mouseMoveHandler(e) {
    var rect = canvas.getBoundingClientRect();
    var relativeX = (e.clientX - rect.left) * canvas.width / rect.width;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(canvas.width-paddleWidth, relativeX - paddleWidth/2));
    }
}

function startGame() {
    score = 0;
    lives = 3;
    buildBricks();
    resetBall();
    updateHud();
    overlay.classList.add("hidden");
    running = true;
    requestAnimationFrame(draw);
}

function endGame(title, message) {
    running = false;
    titleEl.textContent = title;
    subtitleEl.textContent = message;
    startBtn.textContent = "Play again";
    overlay.classList.remove("hidden");
}

function collisionDetection() {
    for(var c=0; c<brickColumnCount; c++) {
        for(var r=0; r<brickRowCount; r++) {
            var b = bricks[c][r];
            if(b.status == 1) {
                if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    updateHud();
                    if(score == brickRowCount*brickColumnCount) {
                        endGame("You win!", "You broke every brick with " + lives + " lives left.");
                    }
                }
            }
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();
}
function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height-paddleHeight-6, paddleWidth, paddleHeight, 6);
    ctx.fillStyle = mainColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();
}
function drawBricks() {
    for(var c=0; c<brickColumnCount; c++) {
        for(var r=0; r<brickRowCount; r++) {
            if(bricks[c][r].status == 1) {
                var brickX = (r*(brickWidth+brickPadding))+brickOffsetLeft;
                var brickY = (c*(brickHeight+brickPadding))+brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 5);
                ctx.fillStyle = mainColor;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function draw() {
    if(!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    if(!running) return;

    if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if(y + dy < ballRadius) {
        dy = -dy;
    }
    else if(y + dy > canvas.height-ballRadius-paddleHeight-6) {
        if(x > paddleX && x < paddleX + paddleWidth && dy > 0) {
            dy = -dy;
        }
        else if(y + dy > canvas.height-ballRadius) {
            lives--;
            updateHud();
            if(!lives) {
                endGame("Game over", "You scored " + score + ".");
                return;
            }
            resetBall();
        }
    }

    if(rightPressed && paddleX < canvas.width-paddleWidth) {
        paddleX += 7;
    }
    else if(leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}

buildBricks();
resetBall();
