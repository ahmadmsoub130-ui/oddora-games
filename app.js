const SUPABASE_URL = "ضع_هنا_Project_URL";
const SUPABASE_KEY = "ضع_هنا_Publishable_or_anon_Key";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const games = [const games = [
  {
    id: "reaction",
    title: "Reaction Rush",
    icon: "⚡",
    description: "اختبر سرعة رد فعلك في 10 جولات."
  },
  {
    id: "click",
    title: "Click Storm",
    icon: "🖱️",
    description: "اضغط بأسرع ما تستطيع خلال 10 ثوانٍ."
  },
  {
    id: "math",
    title: "Quick Math",
    icon: "🧠",
    description: "حل أكبر عدد من المسائل قبل انتهاء الوقت."
  },
  {
    id: "memory",
    title: "Memory Match",
    icon: "🧩",
    description: "اختبر ذاكرتك وطابق البطاقات."
  },
  {
    id: "target",
    title: "Target Tap",
    icon: "🎯",
    description: "اضرب الأهداف المتحركة واحصل على أعلى نتيجة."
  },
  {
    id: "color",
    title: "Color Switch",
    icon: "🌈",
    description: "اختر اللون الصحيح قبل انتهاء الوقت."
  }
];

const gameGrid = document.getElementById("gameGrid");
const search = document.getElementById("search");
const modal = document.getElementById("gameModal");
const gameArea = document.getElementById("gameArea");
const closeModal = document.getElementById("closeModal");
const leaderboardBox = document.getElementById("leaderboardBox");
const loginBtn = document.getElementById("loginBtn");

let currentGame = null;

function getScores() {
  try {
    return JSON.parse(localStorage.getItem("oddoraScores")) || {};
  } catch {
    return {};
  }
}

function saveScore(game, score) {
  const scores = getScores();

  if (!scores[game]) {
    scores[game] = [];
  }

  scores[game].push({
    score: Math.round(score),
    date: Date.now()
  });

  scores[game].sort((a, b) => b.score - a.score);
  scores[game] = scores[game].slice(0, 10);

  localStorage.setItem("oddoraScores", JSON.stringify(scores));

  renderLeaderboard();
}

function getBestScore(game) {
  const scores = getScores();
  return scores[game]?.[0]?.score || 0;
}

function renderGames(list = games) {
  gameGrid.innerHTML = "";

  list.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    card.innerHTML = `
      <div class="game-icon">${game.icon}</div>
      <h3>${game.title}</h3>
      <p>${game.description}</p>
      <button class="play-button">PLAY NOW</button>
    `;

    card.querySelector(".play-button").addEventListener("click", () => {
      openGame(game.id);
    });

    gameGrid.appendChild(card);
  });
}

function renderLeaderboard() {
  const scores = getScores();
  const allScores = [];

  Object.keys(scores).forEach(gameId => {
    scores[gameId].forEach(item => {
      const game = games.find(g => g.id === gameId);

      if (game) {
        allScores.push({
          game: game.title,
          score: item.score
        });
      }
    });
  });

  allScores.sort((a, b) => b.score - a.score);

  if (!allScores.length) {
    leaderboardBox.innerHTML = `
      <div class="score-row">
        <span class="score-name">No scores yet</span>
        <span class="score-value">—</span>
      </div>
    `;
    return;
  }

  leaderboardBox.innerHTML = allScores
    .slice(0, 10)
    .map((item, index) => `
      <div class="score-row">
        <span class="score-name">
          #${index + 1} ${item.game}
        </span>
        <span class="score-value">
          ${item.score}
        </span>
      </div>
    `)
    .join("");
}

function openGame(id) {
  currentGame = id;
  modal.classList.remove("hidden");

  if (id === "reaction") {
    reactionRush();
  }

  if (id === "click") {
    clickStorm();
  }

  if (id === "math") {
    quickMath();
  }

  if (id === "memory") {
    memoryMatch();
  }

  if (id === "target") {
    targetTap();
  }

  if (id === "color") {
    colorSwitch();
  }
}

function closeGame() {
  modal.classList.add("hidden");
  gameArea.innerHTML = "";
  currentGame = null;
}

closeModal.addEventListener("click", closeGame);

modal.addEventListener("click", e => {
  if (e.target === modal) {
    closeGame();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeGame();
  }
});

search.addEventListener("input", e => {
  const value = e.target.value.toLowerCase().trim();

  const filtered = games.filter(game =>
    game.title.toLowerCase().includes(value) ||
    game.description.toLowerCase().includes(value)
  );

  renderGames(filtered);
});

/* =========================
   REACTION RUSH
========================= */

function reactionRush() {
  let round = 0;
  let totalScore = 0;
  let bestReaction = Infinity;
  let timer = null;
  let started = false;
  let target = null;
  let startTime = 0;

  gameArea.innerHTML = `
    <h2>⚡ Reaction Rush</h2>

    <p>
      Wait for the target to appear.
      Then tap it as quickly as possible.
    </p>

    <div id="reactionInfo">
      Round 0 / 10
    </div>

    <div
      id="reactionArena"
      style="
        position:relative;
        height:300px;
        margin:20px 0;
        border:1px solid #303a60;
        border-radius:18px;
        background:#080b18;
        overflow:hidden;
      "
    >
      <button
        id="reactionStart"
        class="game-action"
        style="
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
        "
      >
        START GAME
      </button>
    </div>

    <div id="reactionResult"></div>
  `;

  const arena = document.getElementById("reactionArena");
  const info = document.getElementById("reactionInfo");
  const startButton = document.getElementById("reactionStart");
  const result = document.getElementById("reactionResult");

  function startGame() {
    round = 0;
    totalScore = 0;
    bestReaction = Infinity;
    started = true;

    startButton.remove();
    nextRound();
  }

  function nextRound() {
    if (!started) return;

    round++;

    if (round > 10) {
      finishGame();
      return;
    }

    info.textContent = `Round ${round} / 10`;

    arena.innerHTML = "";

    const waiting = document.createElement("div");

    waiting.textContent = "WAIT...";
    waiting.style.position = "absolute";
    waiting.style.left = "50%";
    waiting.style.top = "50%";
    waiting.style.transform = "translate(-50%, -50%)";
    waiting.style.fontSize = "30px";
    waiting.style.fontWeight = "900";

    arena.appendChild(waiting);

    const delay = 900 + Math.random() * 2600;

    timer = setTimeout(() => {
      showTarget();
    }, delay);
  }

  function showTarget() {
    if (!started) return;

    arena.innerHTML = "";

    target = document.createElement("button");

    target.textContent = "TAP!";

    target.style.position = "absolute";
    target.style.width = "82px";
    target.style.height = "82px";
    target.style.borderRadius = "50%";
    target.style.border = "0";
    target.style.background = "#695cff";
    target.style.color = "#fff";
    target.style.fontWeight = "900";
    target.style.cursor = "pointer";
    target.style.fontSize = "15px";

    const x = Math.random() * (arena.clientWidth - 100) + 10;
    const y = Math.random() * (arena.clientHeight - 100) + 10;

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

    startTime = performance.now();

    target.addEventListener("click", event => {
      event.stopPropagation();

      const reaction = Math.round(performance.now() - startTime);

      if (reaction < bestReaction) {
        bestReaction = reaction;
      }

      const points = Math.max(50, 1000 - reaction);

      totalScore += points;

      arena.innerHTML = `
        <div style="
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
          text-align:center;
        ">
          <div style="font-size:35px;font-weight:900;">
            ${reaction} ms
          </div>

          <div style="margin-top:10px;color:#9187ff;">
            +${points} points
          </div>
        </div>
      `;

      setTimeout(nextRound, 700);
    });

    arena.appendChild(target);
  }

  arena.addEventListener("click", () => {
    if (!started || !target) return;

    clearTimeout(timer);

    arena.innerHTML = `
      <div style="
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        text-align:center;
      ">
        <div style="
          font-size:32px;
          font-weight:900;
        ">
          TOO EARLY!
        </div>

        <div style="
          margin-top:10px;
          color:#aeb7d5;
        ">
          +0 points
        </div>
      </div>
    `;

    target = null;

    setTimeout(nextRound, 700);
  });

  function finishGame() {
    started = false;

    clearTimeout(timer);

    saveScore("reaction", totalScore);

    result.innerHTML = `
      <div style="margin-top:20px;">
        <div style="
          font-size:16px;
          color:#aeb7d5;
        ">
          FINAL SCORE
        </div>

        <div class="big-score">
          ${totalScore}
        </div>

        <div style="margin-bottom:20px;">
          Best reaction:
          <strong>
            ${bestReaction === Infinity ? "—" : bestReaction + " ms"}
          </strong>
        </div>

        <button id="reactionAgain" class="game-action">
          PLAY AGAIN
        </button>
      </div>
    `;

    document
      .getElementById("reactionAgain")
      .addEventListener("click", reactionRush);
  }

  startButton.addEventListener("click", startGame);
}

/* =========================
   CLICK STORM
========================= */

function clickStorm() {
  let clicks = 0;
  let time = 10;
  let running = false;
  let interval = null;

  gameArea.innerHTML = `
    <h2>🖱️ Click Storm</h2>

    <p>
      Click as many times as possible in 10 seconds.
    </p>

    <div style="font-size:25px;margin:20px;">
      Time:
      <strong id="clickTime">10</strong>
    </div>

    <div class="big-score" id="clickScore">
      0
    </div>

    <button id="clickButton" class="game-action">
      START
    </button>
  `;

  const button = document.getElementById("clickButton");
  const score = document.getElementById("clickScore");
  const timeText = document.getElementById("clickTime");

  button.addEventListener("click", () => {
    if (!running) {
      running = true;
      clicks = 0;
      time = 10;

      button.textContent = "CLICK!";

      interval = setInterval(() => {
        time--;

        timeText.textContent = time;

        if (time <= 0) {
          clearInterval(interval);
          running = false;

          button.textContent = "PLAY AGAIN";

          saveScore("click", clicks);

          alert(`Time's up! Your score: ${clicks}`);
        }
      }, 1000);

      return;
    }

    clicks++;
    score.textContent = clicks;
  });
}

/* =========================
   QUICK MATH
========================= */

function quickMath() {
  let score = 0;
  let question = 0;
  let answer = 0;
  let timer = 20;
  let interval = null;

  gameArea.innerHTML = `
    <h2>🧠 Quick Math</h2>

    <p>
      Solve as many questions as possible.
    </p>

    <div style="font-size:20px;margin:15px;">
      Time:
      <strong id="mathTime">20</strong>
    </div>

    <div
      id="mathQuestion"
      style="
        font-size:42px;
        font-weight:900;
        margin:25px;
      "
    >
      Ready?
    </div>

    <input
      id="mathAnswer"
      type="number"
      inputmode="numeric"
      placeholder="Answer"
      style="
        width:100%;
        max-width:260px;
        padding:14px;
        border-radius:12px;
        border:1px solid #303a60;
        background:#080b18;
        color:#fff;
        text-align:center;
        margin-bottom:15px;
      "
    >

    <br>

    <button id="mathStart" class="game-action">
      START
    </button>

    <div style="margin-top:20px;">
      Score:
      <strong id="mathScore">0</strong>
    </div>
  `;

  const questionBox = document.getElementById("mathQuestion");
  const answerInput = document.getElementById("mathAnswer");
  const startButton = document.getElementById("mathStart");
  const scoreText = document.getElementById("mathScore");
  const timeText = document.getElementById("mathTime");

  function newQuestion() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;

    const operations = ["+", "-", "*"];
    const operation =
      operations[Math.floor(Math.random() * operations.length)];

    if (operation === "+") {
      answer = a + b;
    }

    if (operation === "-") {
      answer = a - b;
    }

    if (operation === "*") {
      answer = a * b;
    }

    questionBox.textContent = `${a} ${operation} ${b}`;
    answerInput.value = "";
    answerInput.focus();
  }

  function finish() {
    clearInterval(interval);

    saveScore("math", score);

    questionBox.textContent = `FINAL SCORE: ${score}`;
    startButton.textContent = "PLAY AGAIN";
    answerInput.disabled = true;
  }

  startButton.addEventListener("click", () => {
    if (timer <= 0) {
      timer = 20;
      score = 0;
      answerInput.disabled = false;
    }

    score = 0;
    timer = 20;

    scoreText.textContent = score;
    timeText.textContent = timer;

    newQuestion();

    clearInterval(interval);

    interval = setInterval(() => {
      timer--;

      timeText.textContent = timer;

      if (timer <= 0) {
        finish();
      }
    }, 1000);
  });

  answerInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;

    if (timer <= 0) return;

    const userAnswer = Number(answerInput.value);

    if (userAnswer === answer) {
      score += 10;
      scoreText.textContent = score;
      newQuestion();
    } else {
      answerInput.value = "";
    }
  });
}

/* =========================
   MEMORY MATCH
========================= */

function memoryMatch() {
  const symbols = [
    "🍎",
    "🍎",
    "🚀",
    "🚀",
    "⭐",
    "⭐",
    "🔥",
    "🔥"
  ];

  symbols.sort(() => Math.random() - 0.5);

  let first = null;
  let second = null;
  let lock = false;
  let matches = 0;

  gameArea.innerHTML = `
    <h2>🧩 Memory Match</h2>

    <p>
      Match all pairs.
    </p>

    <div
      id="memoryGrid"
      style="
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:10px;
        max-width:400px;
        margin:25px auto;
      "
    ></div>

    <div id="memoryStatus">
      Matches: 0 / 4
    </div>
  `;

  const grid = document.getElementById("memoryGrid");
  const status = document.getElementById("memoryStatus");

  symbols.forEach(symbol => {
    const card = document.createElement("button");

    card.textContent = "?";

    card.dataset.symbol = symbol;

    card.style.height = "80px";
    card.style.fontSize = "30px";
    card.style.border = "1px solid #303a60";
    card.style.borderRadius = "12px";
    card.style.background = "#171d35";
    card.style.color = "#fff";
    card.style.cursor = "pointer";

    card.addEventListener("click", () => {
      if (lock) return;
      if (card === first) return;
      if (card.dataset.matched === "true") return;

      card.textContent = symbol;

      if (!first) {
        first = card;
        return;
      }

      second = card;
      lock = true;

      if (first.dataset.symbol === second.dataset.symbol) {
        first.dataset.matched = "true";
        second.dataset.matched = "true";

        matches++;

        status.textContent = `Matches: ${matches} / 4`;

        first = null;
        second = null;
        lock = false;

        if (matches === 4) {
          saveScore("memory", 1000);
          status.innerHTML = `
            <strong>
              YOU WIN! +1000
            </strong>
          `;
        }

        return;
      }

      setTimeout(() => {
        first.textContent = "?";
        second.textContent = "?";

        first = null;
        second = null;
        lock = false;
      }, 700);
    });

    grid.appendChild(card);
  });
}

/* =========================
   TARGET TAP
========================= */

function targetTap() {
  let score = 0;
  let time = 20;
  let running = false;
  let interval = null;
  let targetTimer = null;

  gameArea.innerHTML = `
    <h2>🎯 Target Tap</h2>

    <p>
      Hit as many targets as possible in 20 seconds.
    </p>

    <div>
      Time:
      <strong id="targetTime">20</strong>
      |
      Score:
      <strong id="targetScore">0</strong>
    </div>

    <div
      id="targetArena"
      style="
        position:relative;
        height:320px;
        margin:20px 0;
        border-radius:18px;
        border:1px solid #303a60;
        background:#080b18;
        overflow:hidden;
      "
    >
      <button
        id="targetStart"
        class="game-action"
        style="
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
        "
      >
        START
      </button>
    </div>
  `;

  const arena = document.getElementById("targetArena");
  const start = document.getElementById("targetStart");
  const scoreText = document.getElementById("targetScore");
  const timeText = document.getElementById("targetTime");

  function spawnTarget() {
    if (!running) return;

    const target = document.createElement("button");

    target.textContent = "+10";

    target.style.position = "absolute";
    target.style.width = "65px";
    target.style.height = "65px";
    target.style.borderRadius = "50%";
    target.style.border = "0";
    target.style.background = "#695cff";
    target.style.color = "#fff";
    target.style.fontWeight = "900";
    target.style.cursor = "pointer";

    target.style.left =
      Math.random() * (arena.clientWidth - 80) + "px";

    target.style.top =
      Math.random() * (arena.clientHeight - 80) + "px";

    target.addEventListener("click", e => {
      e.stopPropagation();

      score += 10;

      scoreText.textContent = score;

      target.remove();

      spawnTarget();
    });

    arena.appendChild(target);
  }

  function finish() {
    running = false;

    clearInterval(interval);
    clearTimeout(targetTimer);

    arena.innerHTML = `
      <div style="
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        text-align:center;
      ">
        <div style="font-size:18px;">
          FINAL SCORE
        </div>

        <div class="big-score">
          ${score}
        </div>

        <button id="targetAgain" class="game-action">
          PLAY AGAIN
        </button>
      </div>
    `;

    saveScore("target", score);

    document
      .getElementById("targetAgain")
      .addEventListener("click", targetTap);
  }

  start.addEventListener("click", () => {
    running = true;
    score = 0;
    time = 20;

    start.remove();

    scoreText.textContent = score;
    timeText.textContent = time;

    spawnTarget();

    interval = setInterval(() => {
      time--;

      timeText.textContent = time;

      if (time <= 0) {
        finish();
      }
    }, 1000);
  });
}

/* =========================
   COLOR SWITCH
========================= */

function colorSwitch() {
  const colors = [
    {
      name: "RED",
      value: "#ff4d6d"
    },
    {
      name: "BLUE",
      value: "#4d8dff"
    },
    {
      name: "GREEN",
      value: "#45d483"
    },
    {
      name: "YELLOW",
      value: "#ffd166"
    }
  ];

  let score = 0;
  let time = 20;
  let running = false;
  let interval = null;
  let correct = null;

  gameArea.innerHTML = `
    <h2>🌈 Color Switch</h2>

    <p>
      Tap the button that matches the displayed color name.
    </p>

    <div>
      Time:
      <strong id="colorTime">20</strong>
      |
      Score:
      <strong id="colorScore">0</strong>
    </div>

    <div
      id="colorName"
      style="
        font-size:45px;
        font-weight:900;
        margin:25px;
      "
    >
      READY
    </div>

    <div
      id="colorButtons"
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
      "
    ></div>

    <button
      id="colorStart"
      class="game-action"
      style="margin-top:20px;"
    >
      START
    </button>
  `;

  const nameBox = document.getElementById("colorName");
  const buttonsBox = document.getElementById("colorButtons");
  const start = document.getElementById("colorStart");
  const timeText = document.getElementById("colorTime");
  const scoreText = document.getElementById("colorScore");

  colors.forEach(color => {
    const button = document.createElement("button");

    button.textContent = color.name;

    button.style.padding = "20px";
    button.style.border = "0";
    button.style.borderRadius = "14px";
    button.style.background = color.value;
    button.style.color = "#111";
    button.style.fontWeight = "900";
    button.style.cursor = "pointer";

    button.addEventListener("click", () => {
      if (!running) return;

      if (color.name === correct) {
        score += 10;
      } else {
        score = Math.max(0, score - 5);
      }

      scoreText.textContent = score;

      nextColor();
    });

    buttonsBox.appendChild(button);
  });

  function nextColor() {
    const random =
      colors[Math.floor(Math.random() * colors.length)];

    correct = random.name;

    nameBox.textContent = random.name;
    nameBox.style.color = random.value;
  }

  function finish() {
    running = false;

    clearInterval(interval);

    saveScore("color", score);

    nameBox.textContent = `FINAL SCORE: ${score}`;

    start.textContent = "PLAY AGAIN";
  }

  start.addEventListener("click", () => {
    running = true;
    score = 0;
    time = 20;

    scoreText.textContent = score;
    timeText.textContent = time;

    nextColor();

    clearInterval(interval);

    interval = setInterval(() => {
      time--;

      timeText.textContent = time;

      if (time <= 0) {
        finish();
      }
    }, 1000);
  });
}

/* =========================
   LOGIN
========================= */

loginBtn.addEventListener("click", async () => {
  const email = prompt("Enter your email:");

  if (!email) return;

  const password = prompt("Enter your password:");

  if (!password) return;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const createAccount = confirm(
      "Account not found. Do you want to create a new account?"
    );

    if (!createAccount) return;

    const { error: signupError } =
      await supabaseClient.auth.signUp({
        email,
        password
      });

    if (signupError) {
      alert(signupError.message);
      return;
    }

    alert(
      "Account created successfully. Check your email if confirmation is required."
    );

    return;
  }

  alert("Welcome to ODDORA!");

  updateLoginButton();
});

async function updateLoginButton() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (user) {
    loginBtn.textContent = "ACCOUNT";
  } else {
    loginBtn.textContent = "SIGN IN";
  }
}

updateLoginButton();

/* =========================
   START
========================= */

renderGames();
renderLeaderboard();
