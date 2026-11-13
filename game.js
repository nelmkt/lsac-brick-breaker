var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var scoreEl = document.getElementById("score");
var livesEl = document.getElementById("lives");
var levelEl = document.getElementById("level");
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
var brickColumnCount = 5;
var topics = [
    { name: "Security", label: "SEC",   color: "#0f9d9a", points: 3 },
    { name: "AI",       label: "AI",    color: "#c27c0e", points: 2 },
    { name: "Data",     label: "DATA",  color: "#00a36c", points: 2 },
    { name: "Code",     label: "CODE",  color: "#8661c5", points: 1 },
    { name: "Cloud",    label: "CLOUD", color: "#0078d4", points: 1 }
];
var bug = { name: "Bug", label: "BUG", color: "#e5484d", points: 2 };
var bugChance = 0.2;

var tips = {
    Cloud: [
        "Cloud means renting computers on demand instead of buying them.",
        "Microsoft Learn has free Azure Fundamentals (AZ-900) learning paths.",
        "Serverless means you write the code and the cloud runs the servers."
    ],
    Code: [
        "Git tracks every change, so commit early and often.",
        "VS Code is free and works with almost any language.",
        "Reading other people's code is a skill too. Practice it."
    ],
    Data: [
        "SQL is still one of the most in-demand skills.",
        "Clean data beats a fancy model almost every time.",
        "Power BI turns spreadsheets into dashboards."
    ],
    AI: [
        "A model is only as good as the data it learned from.",
        "Prompting is a skill: be clear and give examples.",
        "Always check AI output, it can be confidently wrong."
    ],
    Security: [
        "Turn on two-factor authentication everywhere you can.",
        "Never commit passwords or API keys to GitHub.",
        "Least privilege: only give access to what's needed."
    ],
    Bug: [
        "Bug squashed! Reading the error message is step one of debugging.",
        "Bug squashed! Rubber duck debugging: explain your code out loud."
    ]
};
var tip = "";
var tipUntil = 0;
var level = 1;
var baseSpeed = 2.5;
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
            var isBug = Math.random() < bugChance;
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                topic: isBug ? bug : topics[c],
                hits: isBug ? 2 : 1
            };
        }
    }
}

function resetBall() {
    x = canvas.width/2;
    y = canvas.height-30;
    var speed = baseSpeed + (level - 1) * 0.5;
    dx = speed;
    dy = -speed;
    paddleX = (canvas.width-paddleWidth)/2;
}

function updateHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    levelEl.textContent = level;
}

function showTip(text) {
    tip = text;
    tipUntil = performance.now() + 2500;
}

function randomTip(topic) {
    var list = tips[topic.name];
    return list[Math.floor(Math.random() * list.length)];
}

function nextLevel() {
    level++;
    buildBricks();
    resetBall();
    updateHud();
    showTip("Level " + level + "! The ball is getting faster.");
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
    level = 1;
    tip = "";
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
                    b.hits--;
                    if(b.hits > 0) continue;
                    b.status = 0;
                    score += b.topic.points;
                    updateHud();
                    showTip(randomTip(b.topic));
                    if(bricksLeft() == 0) {
                        nextLevel();
                        return;
                    }
                }
            }
        }
    }
}

function bricksLeft() {
    var left = 0;
    for(var c=0; c<brickColumnCount; c++) {
        for(var r=0; r<brickRowCount; r++) {
            if(bricks[c][r].status == 1) left++;
        }
    }
    return left;
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
                var b = bricks[c][r];
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 5);
                ctx.fillStyle = b.topic.color;
                ctx.globalAlpha = b.hits > 1 ? 1 : 0.85;
                ctx.fill();
                ctx.globalAlpha = 1;
                if(b.topic == bug && b.hits == 1) {
                    ctx.strokeStyle = "#ffd1d1";
                    ctx.setLineDash([4, 3]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                ctx.closePath();

                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 11px Segoe UI, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(b.topic.label, brickX + brickWidth/2, brickY + brickHeight/2 + 1);
            }
        }
    }
}

function drawTip() {
    if(!tip || performance.now() > tipUntil) return;
    var boxY = canvas.height - 90;
    ctx.beginPath();
    ctx.roundRect(20, boxY, canvas.width - 40, 40, 8);
    ctx.fillStyle = "rgba(0, 120, 212, 0.85)";
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tip, canvas.width/2, boxY + 20, canvas.width - 60);
}

function draw() {
    if(!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawTip();
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
                endGame("Game over", "You scored " + score + " and reached level " + level + ".");
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
