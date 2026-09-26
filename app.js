/* =========================================================
   ODDORA GAMES - APP.JS
   ========================================================= */

const SUPABASE_URL = "https://xywhwqbfzfvwjdthchjz.supabase.co";
const SUPABASE_KEY = "sb_publishable_31E-JTjhC4YxVIxrYHwfKA_4v4RbeZs";

let supabaseClient = null;

if (
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {
  try {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  } catch (error) {
    console.error("Supabase error:", error);
  }
}

/* =========================================================
   ELEMENTS
   ========================================================= */

const gameGrid = document.getElementById("gameGrid");
const gameModal = document.getElementById("gameModal");
const gameArea = document.getElementById("gameArea");
const closeModal = document.getElementById("closeModal");
const loginBtn = document.getElementById("loginBtn");
const search = document.getElementById("search");
const leaderboardBox = document.getElementById("leaderboardBox");

let currentGame = null;
let timer = null;
let activeTimeouts = [];

/* =========================================================
   GAMES
   ========================================================= */

const games = [
  {
    id: "reaction",
    name: "Reaction Rush",
    icon: "⚡",
    description: "Test your reaction speed.",
    play: startReactionGame
  },
  {
    id: "click",
    name: "Click Storm",
    icon: "👆",
    description: "Click as fast as possible in 10 seconds.",
    play: startClickGame
  },
  {
    id: "math",
    name: "Quick Math",
    icon: "🧠",
    description: "Solve mathematical challenges.",
    play: startMathGame
  },
  {
    id: "memory",
    name: "Memory Match",
    icon: "🃏",
    description: "Find all matching pairs.",
    play: startMemoryGame
  },
  {
    id: "target",
    name: "Target Tap",
    icon: "🎯",
    description: "Hit the moving target.",
    play: startTargetGame
  },
  {
    id: "color",
    name: "Color Switch",
    icon: "🌈",
    description: "Choose the correct color.",
    play: startColorGame
  }
];

/* =========================================================
   GENERAL FUNCTIONS
   ========================================================= */

function clearGameTimers() {
  clearInterval(timer);
  timer = null;

  activeTimeouts.forEach(id => clearTimeout(id));
  activeTimeouts = [];
}

function addTimeout(callback, delay) {
  const id = setTimeout(callback, delay);
  activeTimeouts.push(id);
  return id;
}

function renderGames(list = games) {
  if (!gameGrid) return;

  gameGrid.innerHTML = "";

  if (list.length === 0) {
    gameGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:40px;
        opacity:.7;
      ">
        No games found.
      </div>
    `;
    return;
  }

  list.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    card.innerHTML = `
      <div class="game-icon">${game.icon}</div>
      <h3>${game.name}</h3>
      <p>${game.description}</p>
      <button class="play-button">PLAY NOW</button>
    `;

    const button = card.querySelector(".play-button");

    button.addEventListener("click", () => {
      openGame(game);
    });

    gameGrid.appendChild(card);
  });
}

function openGame(game) {
  clearGameTimers();

  currentGame = game;

  if (!gameModal || !gameArea) return;

  gameModal.classList.remove("hidden");
  gameArea.innerHTML = "";

  try {
    game.play();
  } catch (error) {
    console.error(error);

    gameArea.innerHTML = `
      <h2>Game Error</h2>
      <p>Please try again.</p>
      <button class="game-action" onclick="closeGame()">
        CLOSE
      </button>
    `;
  }
}

function closeGame() {
  clearGameTimers();

  currentGame = null;

  if (gameModal) {
    gameModal.classList.add("hidden");
  }

  if (gameArea) {
    gameArea.innerHTML = "";
  }
}

function addButton(text, callback) {
  const button = document.createElement("button");

  button.className = "game-action";
  button.textContent = text;

  button.addEventListener("click", callback);

  gameArea.appendChild(button);

  return button;
}

function showScore(finalScore) {
  clearGameTimers();

  const safeScore = Math.max(0, Math.floor(Number(finalScore) || 0));

  gameArea.innerHTML = `
    <h2>Game Over</h2>

    <div class="big-score">
      ${safeScore}
    </div>

    <p>Your score</p>
  `;

  addButton("PLAY AGAIN", () => {
    if (currentGame) {
      currentGame.play();
    }
  });

  addButton("CLOSE", closeGame);

  saveScore(safeScore);
}

/* =========================================================
   REACTION RUSH
   ========================================================= */

function startReactionGame() {
  clearGameTimers();

  gameArea.innerHTML = `
    <h2>Reaction Rush</h2>

    <p>
      Wait until the button turns green.
      Then tap as quickly as possible.
    </p>

    <div
      id="reactionStatus"
      style="
        margin:25px 0;
        font-size:20px;
        font-weight:700;
      "
    >
      Get ready...
    </div>

    <button
      id="reactionButton"
      class="game-action"
      style="
        width:100%;
        height:120px;
        background:#333;
        font-size:25px;
      "
    >
      WAIT
    </button>
  `;

  const button = document.getElementById("reactionButton");
  const status = document.getElementById("reactionStatus");

  let active = false;
  let finished = false;
  let startTime = 0;

  const delay = 1500 + Math.random() * 3000;

  addTimeout(() => {
    if (finished) return;

    active = true;
    startTime = performance.now();

    button.style.background = "#16c784";
    button.textContent = "TAP!";
    status.textContent = "GO!";
  }, delay);

  button.addEventListener("click", () => {
    if (finished) return;

    if (!active) {
      finished = true;

      gameArea.innerHTML = `
        <h2>Too Early!</h2>
        <p>You tapped before the signal.</p>
      `;

      addButton("TRY AGAIN", startReactionGame);
      return;
    }

    finished = true;

    const reaction =
      Math.round(performance.now() - startTime);

    const reactionScore =
      Math.max(1, 1000 - reaction);

    showScore(reactionScore);
  });
}

/* =========================================================
   CLICK STORM
   ========================================================= */

function startClickGame() {
  clearGameTimers();

  let clicks = 0;
  let seconds = 10;

  gameArea.innerHTML = `
    <h2>Click Storm</h2>

    <p>
      Click as many times as possible in 10 seconds.
    </p>

    <div style="font-size:24px;margin:20px;">
      Time:
      <strong id="clickTime">10</strong>
    </div>

    <div
      class="big-score"
      id="clickScore"
    >
      0
    </div>

    <button
      id="clickButton"
      class="game-action"
      style="
        width:100%;
        height:120px;
        font-size:28px;
      "
    >
      CLICK!
    </button>
  `;

  const button = document.getElementById("clickButton");
  const timeDisplay = document.getElementById("clickTime");
  const scoreDisplay = document.getElementById("clickScore");

  button.addEventListener("click", () => {
    clicks++;
    scoreDisplay.textContent = clicks;
  });

  timer = setInterval(() => {
    seconds--;

    timeDisplay.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(timer);
      timer = null;

      showScore(clicks);
    }
  }, 1000);
}

/* =========================================================
   QUICK MATH
   ========================================================= */

function startMathGame() {
  clearGameTimers();

  let points = 0;
  let seconds = 20;
  let answer = 0;

  gameArea.innerHTML = `
    <h2>Quick Math</h2>

    <p>
      Solve as many questions as possible.
    </p>

    <div style="font-size:22px;margin:15px;">
      Time:
      <strong id="mathTime">20</strong>
    </div>

    <div
      id="mathQuestion"
      style="
        font-size:42px;
        font-weight:900;
        margin:25px;
        text-align:center;
      "
    ></div>

    <input
      id="mathInput"
      type="number"
      inputmode="numeric"
      placeholder="Answer"
      style="
        width:100%;
        box-sizing:border-box;
        padding:15px;
        border-radius:10px;
        border:1px solid #293253;
        background:#070914;
        color:white;
        text-align:center;
        margin-bottom:15px;
      "
    >

    <button
      id="mathSubmit"
      class="game-action"
    >
      SUBMIT
    </button>

    <div style="margin-top:20px;">
      Score:
      <strong id="mathScore">0</strong>
    </div>
  `;

  const question = document.getElementById("mathQuestion");
  const input = document.getElementById("mathInput");
  const submit = document.getElementById("mathSubmit");
  const scoreDisplay = document.getElementById("mathScore");
  const timeDisplay = document.getElementById("mathTime");

  function newQuestion() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;

    const operations = ["+", "-", "*"];

    const operation =
      operations[
        Math.floor(Math.random() * operations.length)
      ];

    if (operation === "+") {
      answer = a + b;
    }

    if (operation === "-") {
      answer = a - b;
    }

    if (operation === "*") {
      answer = a * b;
    }

    question.textContent =
      `${a} ${operation} ${b}`;

    input.value = "";

    input.focus();
  }

  function submitAnswer() {
    if (Number(input.value) === answer) {
      points++;
      scoreDisplay.textContent = points;
    }

    newQuestion();
  }

  submit.addEventListener("click", submitAnswer);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      submitAnswer();
    }
  });

  newQuestion();

  timer = setInterval(() => {
    seconds--;

    timeDisplay.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(timer);
      timer = null;

      showScore(points);
    }
  }, 1000);
}

/* =========================================================
   MEMORY MATCH
   ========================================================= */

function startMemoryGame() {
  clearGameTimers();

  const symbols = [
    "🍎",
    "🍌",
    "🍇",
    "🍊",
    "🍉",
    "🥝"
  ];

  let cards = [...symbols, ...symbols];

  cards.sort(() => Math.random() - 0.5);

  let first = null;
  let second = null;
  let locked = false;
  let matches = 0;

  gameArea.innerHTML = `
    <h2>Memory Match</h2>

    <p>
      Find all matching pairs.
    </p>

    <div
      id="memoryGrid"
      style="
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:10px;
        max-width:420px;
        margin:25px auto;
      "
    ></div>
  `;

  const grid = document.getElementById("memoryGrid");

  cards.forEach((symbol, index) => {
    const card = document.createElement("button");

    card.dataset.symbol = symbol;
    card.dataset.index = index;

    card.textContent = "?";

    card.style.height = "75px";
    card.style.fontSize = "30px";
    card.style.border = "1px solid #343e66";
    card.style.borderRadius = "12px";
    card.style.background = "#070914";
    card.style.color = "#fff";
    card.style.cursor = "pointer";

    card.addEventListener("click", () => {
      if (
        locked ||
        card.classList.contains("matched") ||
        card === first
      ) {
        return;
      }

      card.textContent = symbol;

      if (!first) {
        first = card;
        return;
      }

      second = card;
      locked = true;

      if (
        first.dataset.symbol ===
        second.dataset.symbol
      ) {
        first.classList.add("matched");
        second.classList.add("matched");

        matches++;

        first = null;
        second = null;
        locked = false;

        if (matches === symbols.length) {
          showScore(matches * 100);
        }
      } else {
        const firstCard = first;
        const secondCard = second;

        addTimeout(() => {
          firstCard.textContent = "?";
          secondCard.textContent = "?";

          first = null;
          second = null;
          locked = false;
        }, 700);
      }
    });

    grid.appendChild(card);
  });
}

/* =========================================================
   TARGET TAP
   ========================================================= */

function startTargetGame() {
  clearGameTimers();

  let points = 0;
  let seconds = 15;

  gameArea.innerHTML = `
    <h2>Target Tap</h2>

    <p>
      Hit the target as many times as possible.
    </p>

    <div style="margin:15px;">
      Time:
      <strong id="targetTime">15</strong>
    </div>

    <div
      id="targetArena"
      style="
        position:relative;
        height:320px;
        background:#070914;
        border:1px solid #293253;
        border-radius:16px;
        overflow:hidden;
        margin-top:20px;
      "
    >

      <button
        id="targetButton"
        style="
          position:absolute;
          width:65px;
          height:65px;
          border:0;
          border-radius:50%;
          background:#695cff;
          color:white;
          font-weight:900;
          cursor:pointer;
        "
      >
        TAP
      </button>

    </div>

    <div style="margin-top:20px;">
      Score:
      <strong id="targetScore">0</strong>
    </div>
  `;

  const arena =
    document.getElementById("targetArena");

  const button =
    document.getElementById("targetButton");

  const timeDisplay =
    document.getElementById("targetTime");

  const scoreDisplay =
    document.getElementById("targetScore");

  function moveTarget() {
    const maxX =
      Math.max(0, arena.clientWidth - 65);

    const maxY =
      Math.max(0, arena.clientHeight - 65);

    button.style.left =
      Math.random() * maxX + "px";

    button.style.top =
      Math.random() * maxY + "px";
  }

  button.addEventListener("click", () => {
    points++;

    scoreDisplay.textContent = points;

    moveTarget();
  });

  moveTarget();

  timer = setInterval(() => {
    seconds--;

    timeDisplay.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(timer);
      timer = null;

      showScore(points);
    }
  }, 1000);
}

/* =========================================================
   COLOR SWITCH
   ========================================================= */

function startColorGame() {
  clearGameTimers();

  const colors = [
    {
      name: "RED",
      value: "#ef4444"
    },
    {
      name: "BLUE",
      value: "#3b82f6"
    },
    {
      name: "GREEN",
      value: "#22c55e"
    },
    {
      name: "YELLOW",
      value: "#eab308"
    }
  ];

  let points = 0;
  let seconds = 20;
  let correctColor = null;

  gameArea.innerHTML = `
    <h2>Color Switch</h2>

    <p>
      Tap the button that matches the requested color.
    </p>

    <div
      style="
        margin:15px;
        font-size:22px;
      "
    >
      Time:
      <strong id="colorTime">20</strong>
    </div>

    <div
      id="colorQuestion"
      style="
        font-size:30px;
        font-weight:900;
        margin:25px;
      "
    ></div>

    <div
      id="colorButtons"
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
      "
    ></div>

    <div style="margin-top:20px;">
      Score:
      <strong id="colorScore">0</strong>
    </div>
  `;

  const question =
    document.getElementById("colorQuestion");

  const buttons =
    document.getElementById("colorButtons");

  const timeDisplay =
    document.getElementById("colorTime");

  const scoreDisplay =
    document.getElementById("colorScore");

  function newRound() {
    buttons.innerHTML = "";

    correctColor =
      colors[
        Math.floor(Math.random() * colors.length)
      ];

    question.textContent =
      correctColor.name;

    const shuffled =
      [...colors].sort(
        () => Math.random() - 0.5
      );

    shuffled.forEach(color => {
      const button =
        document.createElement("button");

      button.textContent = color.name;

      button.style.padding = "20px";
      button.style.border = "0";
      button.style.borderRadius = "12px";
      button.style.background = color.value;
      button.style.color = "#fff";
      button.style.fontWeight = "900";
      button.style.cursor = "pointer";

      button.addEventListener("click", () => {
        if (
          color.name ===
          correctColor.name
        ) {
          points++;
        } else {
          points =
            Math.max(0, points - 1);
        }

        scoreDisplay.textContent =
          points;

        newRound();
      });

      buttons.appendChild(button);
    });
  }

  newRound();

  timer = setInterval(() => {
    seconds--;

    timeDisplay.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(timer);
      timer = null;

      showScore(points);
    }
  }, 1000);
}

/* =========================================================
   LOGIN
   ========================================================= */

function updateLoginButton() {
  if (!loginBtn) return;

  if (!supabaseClient) {
    loginBtn.textContent = "SIGN IN";
    return;
  }

  supabaseClient.auth
    .getUser()
    .then(({ data }) => {
      if (data && data.user) {
        loginBtn.textContent = "ACCOUNT";
      } else {
        loginBtn.textContent = "SIGN IN";
      }
    })
    .catch(() => {
      loginBtn.textContent = "SIGN IN";
    });
}

async function openLogin() {
  if (!supabaseClient) {
    alert("Supabase is not connected.");
    return;
  }

  clearGameTimers();

  gameModal.classList.remove("hidden");

  gameArea.innerHTML = `
    <h2>ODDORA Account</h2>

    <p>
      Sign in or create a new account.
    </p>

    <input
      id="emailInput"
      type="email"
      placeholder="Email"
      autocomplete="email"
      style="
        width:100%;
        box-sizing:border-box;
        padding:14px;
        margin-bottom:12px;
        border-radius:10px;
        border:1px solid #293253;
        background:#070914;
        color:white;
      "
    >

    <input
      id="passwordInput"
      type="password"
      placeholder="Password"
      autocomplete="current-password"
      style="
        width:100%;
        box-sizing:border-box;
        padding:14px;
        margin-bottom:15px;
        border-radius:10px;
        border:1px solid #293253;
        background:#070914;
        color:white;
      "
    >

    <div
      style="
        display:flex;
        gap:10px;
        flex-wrap:wrap;
        justify-content:center;
      "
    >

      <button
        id="signInBtn"
        class="game-action"
      >
        SIGN IN
      </button>

      <button
        id="signUpBtn"
        class="game-action"
      >
        CREATE ACCOUNT
      </button>

    </div>

    <p
      id="loginMessage"
      style="margin-top:20px;"
    ></p>
  `;

  const emailInput =
    document.getElementById("emailInput");

  const passwordInput =
    document.getElementById("passwordInput");

  const signInBtn =
    document.getElementById("signInBtn");

  const signUpBtn =
    document.getElementById("signUpBtn");

  const message =
    document.getElementById("loginMessage");

  signInBtn.addEventListener(
    "click",
    async () => {
      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;

      if (!email || !password) {
        message.textContent =
          "Enter email and password.";

        return;
      }

      message.textContent =
        "Signing in...";

      const { error } =
        await supabaseClient.auth
          .signInWithPassword({
            email,
            password
          });

      if (error) {
        message.textContent =
          error.message;

        return;
      }

      message.textContent =
        "Signed in successfully.";

      updateLoginButton();

      addTimeout(() => {
        closeGame();
      }, 800);
    }
  );

  signUpBtn.addEventListener(
    "click",
    async () => {
      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;

      if (!email || !password) {
        message.textContent =
          "Enter email and password.";

        return;
      }

      if (password.length < 6) {
        message.textContent =
          "Password must be at least 6 characters.";

        return;
      }

      message.textContent =
        "Creating account...";

      const { data, error } =
        await supabaseClient.auth
          .signUp({
            email,
            password
          });

      if (error) {
        message.textContent =
          error.message;

        return;
      }

      if (data && data.session) {
        message.textContent =
          "Account created successfully.";

        updateLoginButton();
      } else {
        message.textContent =
          "Account created. Check your email if confirmation is required.";
      }
    }
  );
}

/* =========================================================
   ACCOUNT MENU
   ========================================================= */

async function accountMenu() {
  if (!supabaseClient) {
    openLogin();
    return;
  }

  const { data } =
    await supabaseClient.auth.getUser();

  if (!data || !data.user) {
    openLogin();
    return;
  }

  clearGameTimers();

  gameModal.classList.remove("hidden");

  gameArea.innerHTML = `
    <h2>ODDORA Account</h2>

    <p>
      ${escapeHtml(data.user.email)}
    </p>

    <button
      id="logoutBtn"
      class="game-action"
    >
      SIGN OUT
    </button>
  `;

  document
    .getElementById("logoutBtn")
    .addEventListener(
      "click",
      async () => {
        await supabaseClient.auth.signOut();

        updateLoginButton();

        closeGame();
      }
    );
}

function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}

/* =========================================================
   SAVE SCORE
   ========================================================= */

async function saveScore(finalScore) {
  if (!currentGame) return;

  const gameId = currentGame.id;

  const localKey =
    `oddora_${gameId}_scores`;

  let localScores = [];

  try {
    localScores =
      JSON.parse(
        localStorage.getItem(localKey)
      ) || [];
  } catch {
    localScores = [];
  }

  localScores.push({
    score: finalScore,
    date: new Date().toISOString()
  });

  localScores.sort(
    (a, b) => b.score - a.score
  );

  localScores =
    localScores.slice(0, 10);

  localStorage.setItem(
    localKey,
    JSON.stringify(localScores)
  );

  /*
    Optional Supabase leaderboard.

    This will only work if the appropriate
    table/policies have been created in Supabase.
  */

  if (supabaseClient) {
    try {
      const { data } =
        await supabaseClient.auth.getUser();

      if (data && data.user) {
        await supabaseClient
          .from("scores")
          .insert({
            user_id: data.user.id,
            game_id: gameId,
            score: finalScore
          });
      }
    } catch (error) {
      console.log(
        "Online score not saved:",
        error
      );
    }
  }

  loadLeaderboard();
}

/* =========================================================
   LEADERBOARD
   ========================================================= */

function getLocalLeaderboard() {
  const allScores = [];

  games.forEach(game => {
    const key =
      `oddora_${game.id}_scores`;

    let scores = [];

    try {
      scores =
        JSON.parse(
          localStorage.getItem(key)
        ) || [];
    } catch {
      scores = [];
    }

    scores.forEach(item => {
      allScores.push({
        game: game.name,
        icon: game.icon,
        score: Number(item.score) || 0,
        date: item.date
      });
    });
  });

  allScores.sort(
    (a, b) => b.score - a.score
  );

  return allScores.slice(0, 10);
}

async function loadLeaderboard() {
  if (!leaderboardBox) return;

  leaderboardBox.innerHTML = `
    <div style="padding:20px;text-align:center;">
      Loading scores...
    </div>
  `;

  let scores = [];

  if (supabaseClient) {
    try {
      const result =
        await supabaseClient
          .from("scores")
          .select(
            "game_id, score, created_at"
          )
          .order("score", {
            ascending: false
          })
          .limit(10);

      if (
        !result.error &&
        Array.isArray(result.data)
      ) {
        scores =
          result.data.map(item => {
            const game =
              games.find(
                g =>
                  g.id === item.game_id
              );

            return {
              game:
                game?.name ||
                item.game_id,
              icon:
                game?.icon ||
                "🎮",
              score:
                Number(item.score) || 0,
              date:
                item.created_at
            };
          });
      }
    } catch (error) {
      console.log(
        "Online leaderboard unavailable."
      );
    }
  }

  if (scores.length === 0) {
    scores = getLocalLeaderboard();
  }

  if (scores.length === 0) {
    leaderboardBox.innerHTML = `
      <div style="
        text-align:center;
        padding:25px;
        opacity:.7;
      ">
        No scores yet.<br>
        Play a game to create the first score.
      </div>
    `;

    return;
  }

  leaderboardBox.innerHTML =
    scores
      .map(
        (item, index) => `
          <div style="
            display:flex;
            align-items:center;
            gap:12px;
            padding:14px;
            border-bottom:1px solid rgba(255,255,255,.08);
          ">

            <strong style="
              width:30px;
            ">
              ${index + 1}
            </strong>

            <span style="
              font-size:24px;
            ">
              ${item.icon}
            </span>

            <span style="
              flex:1;
            ">
              ${escapeHtml(item.game)}
            </span>

            <strong>
              ${item.score}
            </strong>

          </div>
        `
      )
      .join("");
}

/* =========================================================
   EVENTS
   ========================================================= */

if (closeModal) {
  closeModal.addEventListener(
    "click",
    closeGame
  );
}

if (gameModal) {
  gameModal.addEventListener(
    "click",
    event => {
      if (event.target === gameModal) {
        closeGame();
      }
    }
  );
}

document.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      closeGame();
    }
  }
);

if (search) {
  search.addEventListener(
    "input",
    event => {
      const value =
        event.target.value
          .toLowerCase()
          .trim();

      const filtered =
        games.filter(game =>
          game.name
            .toLowerCase()
            .includes(value) ||
          game.description
            .toLowerCase()
            .includes(value)
        );

      renderGames(filtered);
    }
  );
}

if (loginBtn) {
  loginBtn.addEventListener(
    "click",
    async () => {
      if (!supabaseClient) {
        openLogin();
        return;
      }

      const { data } =
        await supabaseClient.auth.getUser();

      if (data && data.user) {
        accountMenu();
      } else {
        openLogin();
      }
    }
  );
}

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange(
    () => {
      updateLoginButton();
    }
  );
}

/* =========================================================
   STARTUP
   ========================================================= */

renderGames();
updateLoginButton();
loadLeaderboard();

console.log(
  "ODDORA Games loaded successfully."
);
