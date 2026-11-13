var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var scoreEl = document.getElementById("score");
var levelEl = document.getElementById("level");
var livesEl = document.getElementById("lives");
var overlay = document.getElementById("overlay");
var titleEl = document.getElementById("title");
var subtitleEl = document.getElementById("subtitle");
var startBtn = document.getElementById("start");

var mainColor = "#0078d4";
var glowColor = "#50e6ff";

var ballRadius = 9;
var baseSpeed = 2.5;
var paddleWidth = 80;
var paddleHeight = 12;
var paddleY = canvas.height - paddleHeight - 6;

var brickRowCount = 5;
var brickColumnCount = 5;
var brickWidth = 76;
var brickHeight = 22;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;
var bugChance = 0.2;

var topics = [
    { name: "Security", label: "SEC",   color: "#0f9d9a", points: 3 },
    { name: "AI",       label: "AI",    color: "#c27c0e", points: 2 },
    { name: "Data",     label: "DATA",  color: "#00a36c", points: 2 },
    { name: "Code",     label: "CODE",  color: "#8661c5", points: 1 },
    { name: "Cloud",    label: "CLOUD", color: "#0078d4", points: 1 }
];
var bug = { name: "Bug", label: "BUG", color: "#e5484d", points: 2 };

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

var x, y, dx, dy, paddleX;
var rightPressed = false;
var leftPressed = false;
var bricks = [];
var score = 0;
var lives = 3;
var level = 1;
var tip = "";
var tipUntil = 0;
var running = false;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);
startBtn.addEventListener("click", startGame);

function keyDownHandler(e) {
    if(e.code == "ArrowRight") rightPressed = true;
    if(e.code == "ArrowLeft") leftPressed = true;
}

function keyUpHandler(e) {
    if(e.code == "ArrowRight") rightPressed = false;
    if(e.code == "ArrowLeft") leftPressed = false;
}

function mouseMoveHandler(e) {
    var rect = canvas.getBoundingClientRect();
    var relativeX = (e.clientX - rect.left) * canvas.width / rect.width;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, relativeX - paddleWidth/2));
    }
}

function buildBricks() {
    bricks = [];
    for(var c=0; c<brickColumnCount; c++) {
        bricks[c] = [];
        for(var r=0; r<brickRowCount; r++) {
            var isBug = Math.random() < bugChance;
            bricks[c][r] = {
                x: r*(brickWidth+brickPadding) + brickOffsetLeft,
                y: c*(brickHeight+brickPadding) + brickOffsetTop,
                status: 1,
                topic: isBug ? bug : topics[c],
                hits: isBug ? 2 : 1
            };
        }
    }
}

function resetBall() {
    var speed = baseSpeed + (level - 1) * 0.5;
    x = canvas.width/2;
    y = canvas.height - 30;
    dx = speed;
    dy = -speed;
    paddleX = (canvas.width - paddleWidth)/2;
}

function updateHud() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = lives;
}

function showTip(text) {
    tip = text;
    tipUntil = performance.now() + 2500;
}

function randomTip(topic) {
    var list = tips[topic.name];
    return list[Math.floor(Math.random() * list.length)];
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

function nextLevel() {
    level++;
    buildBricks();
    resetBall();
    updateHud();
    showTip("Level " + level + "! The ball is getting faster.");
}

function endGame() {
    running = false;
    titleEl.textContent = "Game over";
    subtitleEl.textContent = "You scored " + score + " and reached level " + level + ".";
    startBtn.textContent = "Play again";
    overlay.classList.remove("hidden");
}

function bricksLeft() {
    return bricks.flat().filter(function(b) { return b.status == 1; }).length;
}

function collisionDetection() {
    for(var c=0; c<brickColumnCount; c++) {
        for(var r=0; r<brickRowCount; r++) {
            var b = bricks[c][r];
            if(b.status == 1 && x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
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

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddleX, paddleY, paddleWidth, paddleHeight, 6);
    ctx.fillStyle = mainColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    ctx.font = "bold 11px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    bricks.flat().forEach(function(b) {
        if(b.status != 1) return;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, brickWidth, brickHeight, 5);
        ctx.fillStyle = b.topic.color;
        ctx.fill();
        if(b.topic == bug && b.hits == 1) {
            ctx.strokeStyle = "#ffd1d1";
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillText(b.topic.label, b.x + brickWidth/2, b.y + brickHeight/2 + 1);
    });
}

function drawTip() {
    if(!tip || performance.now() > tipUntil) return;
    var boxY = canvas.height - 90;
    ctx.beginPath();
    ctx.roundRect(20, boxY, canvas.width - 40, 40, 8);
    ctx.fillStyle = "rgba(0, 120, 212, 0.85)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Segoe UI, sans-serif";
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

    if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if(y + dy < ballRadius) {
        dy = -dy;
    }
    else if(y + dy > paddleY - ballRadius) {
        if(x > paddleX && x < paddleX + paddleWidth && dy > 0) {
            dy = -dy;
        }
        else if(y + dy > canvas.height - ballRadius) {
            lives--;
            updateHud();
            if(!lives) {
                endGame();
                return;
            }
            resetBall();
        }
    }

    if(rightPressed && paddleX < canvas.width-paddleWidth) paddleX += 7;
    if(leftPressed && paddleX > 0) paddleX -= 7;

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}
