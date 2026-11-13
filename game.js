(function () {
    "use strict";
    var screen = document.getElementById("leaderboardScreen");
    var body = document.getElementById("leaderboardBody");
    var status = document.getElementById("leaderboardStatus");
    var back = document.getElementById("backToGame");
    var storageKey = "lsac_bug_breaker_preview_scores";
    var previousFocus = null;

    function getScores() {
        try {
            var data = JSON.parse(localStorage.getItem(storageKey) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) { return []; }
    }
    function showMessageRow(message) {
        body.replaceChildren();
        var row = document.createElement("tr");
        var cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = message;
        row.appendChild(cell);
        body.appendChild(row);
    }
    function load() {
        var scores = getScores().sort(function(a,b) {
            return b.score - a.score || b.level - a.level;
        }).slice(0, 10);
        body.replaceChildren();
        if (!scores.length) showMessageRow("NO SCORES YET — BE FIRST!");
        scores.forEach(function(entry, index) {
            var row = document.createElement("tr");
            [index + 1, entry.player_name, entry.score, entry.level].forEach(function(value) {
                var cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });
            body.appendChild(row);
        });
        status.textContent = "PREVIEW ONLY — SCORES SAVED ON THIS DEVICE";
    }
    function submit(name, score, level) {
        try {
            var scores = getScores();
            scores.push({player_name:name, score:score, level:level});
            localStorage.setItem(storageKey, JSON.stringify(scores.sort(function(a,b) {
                return b.score - a.score || b.level - a.level;
            }).slice(0, 50)));
            return Promise.resolve({ok:true});
        } catch (error) {
            return Promise.resolve({ok:false, reason:"Local preview storage unavailable."});
        }
    }
    function show() {
        previousFocus = document.activeElement;
        screen.classList.remove("hidden");
        load();
        back.focus();
    }
    function hide() {
        screen.classList.add("hidden");
        if (previousFocus && previousFocus.focus) previousFocus.focus();
    }
    document.getElementById("viewLeaderboard").addEventListener("click", show);
    back.addEventListener("click", hide);
    screen.addEventListener("keydown", function(event) {
        if (event.key === "Escape") hide();
        if (event.key === "Tab") { event.preventDefault(); back.focus(); }
    });
    window.BugLeaderboard = {show:show, hide:hide, submit:submit, load:load};
})();

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var scoreEl = document.getElementById("score");
var levelEl = document.getElementById("level");
var livesEl = document.getElementById("lives");
var overlay = document.getElementById("overlay");
var titleEl = document.getElementById("title");
var subtitleEl = document.getElementById("subtitle");
var startBtn = document.getElementById("start");
var playerNameEl = document.getElementById("playerName");
var nameErrorEl = document.getElementById("nameError");
var currentPlayerName = "";

var mainColor = "#0078d4";
var glowColor = "#50e6ff";

var ballRadius = 9;
var baseSpeed = 3;
var normalPaddleWidth = 80;
var widePaddleWidth = 130;
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

var x, y, dx, dy, paddleX;
var paddleWidth = normalPaddleWidth;
var wideUntil = 0;
var launched = false;
var rightPressed = false;
var leftPressed = false;
var bricks = [];
var particles = [];
var popups = [];
var trail = [];
var powerUps = [];
var combo = 0;
var shake = 0;
var score = 0;
var lives = 3;
var level = 1;
var message = "";
var messageUntil = 0;
var running = false;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);
canvas.addEventListener("click", launch);
startBtn.addEventListener("click", startGame);
playerNameEl.addEventListener("keydown", function(e) { if(e.key === "Enter") startGame(); });
playerNameEl.addEventListener("input", function() { nameErrorEl.hidden = true; });

function keyDownHandler(e) {
    if(e.code == "ArrowRight") rightPressed = true;
    if(e.code == "ArrowLeft") leftPressed = true;
    if(e.code == "Space" && running) {
        e.preventDefault();
        launch();
    }
}

function keyUpHandler(e) {
    if(e.code == "ArrowRight") rightPressed = false;
    if(e.code == "ArrowLeft") leftPressed = false;
}

function mouseMoveHandler(e) {
    var rect = canvas.getBoundingClientRect();
    var relativeX = (e.clientX - rect.left) * canvas.width / rect.width;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = clampPaddle(relativeX - paddleWidth/2);
    }
}

function clampPaddle(value) {
    return Math.max(0, Math.min(canvas.width - paddleWidth, value));
}

function ballSpeed() {
    return baseSpeed + (level - 1) * 0.5;
}

function launch() {
    if(!running || launched) return;
    launched = true;
    var speed = ballSpeed();
    dx = speed * (Math.random() < 0.5 ? -0.7 : 0.7);
    dy = -Math.sqrt(speed*speed - dx*dx);
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
                hits: isBug ? 2 : 1,
                flash: 0
            };
        }
    }
}

function resetBall() {
    launched = false;
    combo = 0;
    trail = [];
    powerUps = [];
    paddleX = (canvas.width - paddleWidth)/2;
    showMessage("Click or press Space to launch");
}

function updateHud() {
    setHud(scoreEl, score);
    setHud(levelEl, level);
    setHud(livesEl, lives);
}

function setHud(el, value) {
    if(el.textContent == String(value)) return;
    el.textContent = value;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
}

function showMessage(text) {
    message = text;
    messageUntil = performance.now() + 2000;
}

function startGame() {
    var name = playerNameEl.value.trim().replace(/\s+/g, " ");
    if(!name || name.length > 18) { nameErrorEl.hidden = false; playerNameEl.focus(); return; }
    currentPlayerName = name;
    nameErrorEl.hidden = true;
    score = 0;
    lives = 3;
    level = 1;
    paddleWidth = normalPaddleWidth;
    particles = [];
    popups = [];
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
    showMessage("Level " + level + "! Click to launch, it's faster now.");
}

function endGame() {
    running = false;
    var finalScore = score;
    var finalLevel = level;
    var finalName = currentPlayerName;
    titleEl.textContent = "GAME OVER";
    subtitleEl.textContent = "You scored " + score + " and reached level " + level + ". Can you beat it?";
    startBtn.textContent = "▶ PLAY AGAIN";
    overlay.classList.remove("hidden");
    if(window.BugLeaderboard) {
        window.BugLeaderboard.submit(finalName, finalScore, finalLevel).then(function(result) {
            if(!result.ok) console.warn("Score not saved:", result.reason);
        });
    }
}

function bricksLeft() {
    return bricks.flat().filter(function(b) { return b.status == 1; }).length;
}

function burst(bx, by, color) {
    for(var i=0; i<14; i++) {
        particles.push({
            x: bx,
            y: by,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color
        });
    }
}

function addPopup(text, px, py, color) {
    popups.push({ text: text, x: px, y: py, life: 45, color: color });
}

function breakBrick(b) {
    combo++;
    var points = b.topic.points * combo;
    score += points;
    updateHud();
    burst(b.x + brickWidth/2, b.y + brickHeight/2, b.topic.color);
    addPopup("+" + points, b.x + brickWidth/2, b.y, "#ffffff");
    if(combo >= 3) {
        addPopup("Combo x" + combo + "!", canvas.width/2, canvas.height/2, glowColor);
    }
    if(b.topic == bug) {
        powerUps.push({ x: b.x + brickWidth/2, y: b.y + brickHeight });
    }
}

function collisionDetection() {
    for(var c=0; c<brickColumnCount; c++) {
        for(var r=0; r<brickRowCount; r++) {
            var b = bricks[c][r];
            if(b.status == 1 && x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
                dy = -dy;
                b.hits--;
                b.flash = 8;
                if(b.hits > 0) continue;
                b.status = 0;
                breakBrick(b);
                if(bricksLeft() == 0) {
                    nextLevel();
                    return;
                }
            }
        }
    }
}

function bounceOffPaddle() {
    var hit = (x - (paddleX + paddleWidth/2)) / (paddleWidth/2);
    var angle = hit * Math.PI / 3;
    var speed = ballSpeed();
    dx = speed * Math.sin(angle);
    dy = -speed * Math.cos(angle);
    combo = 0;
}

function loseLife() {
    lives--;
    shake = 15;
    updateHud();
    if(!lives) {
        endGame();
        return;
    }
    resetBall();
}

function updatePowerUps() {
    powerUps.forEach(function(p) {
        p.y += 2;
        if(p.y > paddleY && p.y < paddleY + paddleHeight + 10 && p.x > paddleX && p.x < paddleX + paddleWidth) {
            p.caught = true;
            paddleWidth = widePaddleWidth;
            paddleX = clampPaddle(paddleX - (widePaddleWidth - normalPaddleWidth)/2);
            wideUntil = performance.now() + 8000;
            addPopup("WIDE PADDLE!", paddleX + paddleWidth/2, paddleY - 20, glowColor);
        }
    });
    powerUps = powerUps.filter(function(p) { return !p.caught && p.y < canvas.height; });

    if(paddleWidth != normalPaddleWidth && performance.now() > wideUntil) {
        paddleX += (paddleWidth - normalPaddleWidth)/2;
        paddleWidth = normalPaddleWidth;
    }
}

function drawBall() {
    trail.forEach(function(t, i) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, ballRadius * (i + 1) / trail.length, 0, Math.PI*2);
        ctx.fillStyle = "rgba(80, 230, 255, " + (i / trail.length * 0.4) + ")";
        ctx.fill();
    });
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
    ctx.fillStyle = paddleWidth > normalPaddleWidth ? glowColor : mainColor;
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
        ctx.fillStyle = b.flash > 0 ? "#ffffff" : b.topic.color;
        ctx.fill();
        if(b.flash > 0) b.flash--;
        if(b.topic == bug && b.hits == 1) {
            ctx.strokeStyle = "#ffd1d1";
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.fillStyle = b.flash > 0 ? b.topic.color : "#ffffff";
        ctx.fillText(b.topic.label, b.x + brickWidth/2, b.y + brickHeight/2 + 1);
    });
}

function drawPowerUps() {
    ctx.font = "bold 10px Segoe UI, sans-serif";
    powerUps.forEach(function(p) {
        ctx.beginPath();
        ctx.roundRect(p.x - 22, p.y - 8, 44, 16, 8);
        ctx.fillStyle = glowColor;
        ctx.fill();
        ctx.fillStyle = "#0b1a33";
        ctx.fillText("WIDE", p.x, p.y + 1);
    });
}

function drawEffects() {
    particles.forEach(function(p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    particles = particles.filter(function(p) { return p.life > 0; });

    ctx.font = "bold 16px Segoe UI, sans-serif";
    popups.forEach(function(p) {
        p.y -= 0.8;
        p.life--;
        ctx.globalAlpha = Math.min(1, p.life / 20);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#0b1a33";
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
    });
    popups = popups.filter(function(p) { return p.life > 0; });
    ctx.globalAlpha = 1;
}

function drawMessage() {
    if(!message || performance.now() > messageUntil && launched) return;
    var boxY = canvas.height - 90;
    ctx.beginPath();
    ctx.roundRect(20, boxY, canvas.width - 40, 40, 8);
    ctx.fillStyle = "rgba(0, 120, 212, 0.85)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Segoe UI, sans-serif";
    ctx.fillText(message, canvas.width/2, boxY + 20, canvas.width - 60);
}

function draw() {
    if(!running) return;

    ctx.save();
    if(shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake--;
    }
    ctx.clearRect(-20, -20, canvas.width + 40, canvas.height + 40);

    if(rightPressed) paddleX = clampPaddle(paddleX + 7);
    if(leftPressed) paddleX = clampPaddle(paddleX - 7);
    updatePowerUps();

    if(!launched) {
        x = paddleX + paddleWidth/2;
        y = paddleY - ballRadius - 1;
    }

    drawBricks();
    drawPowerUps();
    drawBall();
    drawPaddle();
    drawEffects();
    drawMessage();
    ctx.restore();

    if(launched) {
        collisionDetection();

        if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
            dx = -dx;
        }
        if(y + dy < ballRadius) {
            dy = -dy;
        }
        else if(y + dy > paddleY - ballRadius && dy > 0) {
            if(x > paddleX - ballRadius && x < paddleX + paddleWidth + ballRadius && y < paddleY + paddleHeight) {
                bounceOffPaddle();
            }
            else if(y + dy > canvas.height - ballRadius) {
                loseLife();
                if(!running) return;
            }
        }

        trail.push({ x: x, y: y });
        if(trail.length > 8) trail.shift();
        x += dx;
        y += dy;
    }

    requestAnimationFrame(draw);
}

buildBricks();
drawBricks();
