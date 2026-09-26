const games = [
  {
    id: "reaction",
    name: "Reaction Rush",
    icon: "⚡",
    description: "Click as soon as the target appears."
  },
  {
    id: "click",
    name: "Click Storm",
    icon: "🖱️",
    description: "Make as many clicks as possible."
  },
  {
    id: "math",
    name: "Quick Math",
    icon: "➗",
    description: "Solve quick math challenges."
  },
  {
    id: "number",
    name: "Number Rush",
    icon: "🔢",
    description: "Find numbers as quickly as possible."
  },
  {
    id: "target",
    name: "Target Tap",
    icon: "🎯",
    description: "Hit the target before time runs out."
  },
  {
    id: "memory",
    name: "Memory Match",
    icon: "🧠",
    description: "Test your memory."
  },
  {
    id: "color",
    name: "Color Switch",
    icon: "🎨",
    description: "Choose the correct color."
  },
  {
    id: "dodge",
    name: "Dodge",
    icon: "🛡️",
    description: "Survive as long as possible."
  }
];

const gameGrid = document.getElementById("gameGrid");
const search = document.getElementById("search");
const leaderboardBox = document.getElementById("leaderboardBox");

const modal = document.getElementById("gameModal");
const closeModal = document.getElementById("closeModal");
const gameArea = document.getElementById("gameArea");

const loginBtn = document.getElementById("loginBtn");

let scores =
  JSON.parse(localStorage.getItem("oddoraScores")) || {};


/* =========================
   RENDER GAMES
========================= */

function renderGames(list = games) {

  gameGrid.innerHTML = "";

  list.forEach(game => {

    const card = document.createElement("article");

    card.className = "game-card";

    card.innerHTML = `
      <div class="game-icon">
        ${game.icon}
      </div>

      <h3>
        ${game.name}
      </h3>

      <p>
        ${game.description}
      </p>

      <button
        class="play-button"
        onclick="openGame('${game.id}')"
      >
        PLAY
      </button>
    `;

    gameGrid.appendChild(card);

  });

}


/* =========================
   SEARCH
========================= */

search.addEventListener("input", () => {

  const query =
    search.value.toLowerCase().trim();

  const filtered =
    games.filter(game =>
      (
        game.name +
        " " +
        game.description
      )
      .toLowerCase()
      .includes(query)
    );

  renderGames(filtered);

});


/* =========================
   SCORE SYSTEM
========================= */

function saveScore(gameName, score) {

  score = Math.max(0, Math.floor(score));

  if (
    !scores[gameName] ||
    score > scores[gameName]
  ) {

    scores[gameName] = score;

    localStorage.setItem(
      "oddoraScores",
      JSON.stringify(scores)
    );

  }

  renderLeaderboard();

}


/* =========================
   LEADERBOARD
========================= */

function renderLeaderboard() {

  const entries =
    Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {

    leaderboardBox.innerHTML = `
      <p>
        No scores yet.
        Play a game to appear here.
      </p>
    `;

    return;

  }

  leaderboardBox.innerHTML = "";

  entries.forEach((entry, index) => {

    const row =
      document.createElement("div");

    row.className = "score-row";

    row.innerHTML = `
      <span class="score-name">
        #${index + 1} ${entry[0]}
      </span>

      <span class="score-value">
        ${entry[1]}
      </span>
    `;

    leaderboardBox.appendChild(row);

  });

}


/* =========================
   OPEN GAME
========================= */

function openGame(id) {

  const game =
    games.find(item => item.id === id);

  if (!game) return;

  modal.classList.remove("hidden");

  gameArea.innerHTML = `
    <h2>
      ${game.icon} ${game.name}
    </h2>

    <p>
      ${game.description}
    </p>
  `;


  if (id === "reaction") {

    reactionGame();

  }

  else if (id === "click") {

    clickGame();

  }

  else if (id === "math") {

    mathGame();

  }

  else {

    demoGame(game.name);

  }

}


/* =========================
   CLOSE GAME
========================= */

closeModal.addEventListener(
  "click",
  () => {
    modal.classList.add("hidden");
  }
);


modal.addEventListener(
  "click",
  event => {

    if (event.target === modal) {

      modal.classList.add("hidden");

    }

  }
);


/* =========================
   REACTION GAME
========================= */

function reactionGame() {

  gameArea.innerHTML = `

    <h2>
      ⚡ Reaction Rush
    </h2>

    <p>
      Wait for the button to turn green.
      Then click immediately.
    </p>

    <button
      id="reactionButton"
      class="game-action"
    >
      WAIT...
    </button>

    <div
      id="reactionScore"
      class="big-score"
    >
      —
    </div>

  `;

  const button =
    document.getElementById(
      "reactionButton"
    );

  const score =
    document.getElementById(
      "reactionScore"
    );

  let ready = false;

  let startTime = 0;

  button.style.background = "#555";

  const delay =
    1000 + Math.random() * 3000;


  setTimeout(() => {

    ready = true;

    startTime = Date.now();

    button.textContent =
      "CLICK NOW";

    button.style.background =
      "#20b66b";

  }, delay);


  button.onclick = () => {

    if (!ready) {

      score.textContent =
        "Too early!";

      return;

    }

    const reaction =
      Date.now() - startTime;

    score.textContent =
      reaction + " ms";

    const points =
      Math.max(
        1,
        1000 - reaction
      );

    saveScore(
      "Reaction Rush",
      points
    );

    button.textContent =
      "PLAY AGAIN";

    button.style.background =
      "#695cff";

    ready = false;

    button.onclick =
      () => reactionGame();

  };

}


/* =========================
   CLICK STORM
========================= */

function clickGame() {

  gameArea.innerHTML = `

    <h2>
      🖱️ Click Storm
    </h2>

    <p>
      Click as many times as possible
      in 10 seconds.
    </p>

    <button
      id="clickButton"
      class="game-action"
    >
      START
    </button>

    <div
      id="clickScore"
      class="big-score"
    >
      10
    </div>

  `;

  const button =
    document.getElementById(
      "clickButton"
    );

  const display =
    document.getElementById(
      "clickScore"
    );

  let clicks = 0;

  let running = false;

  let endTime = 0;


  button.onclick = () => {

    if (running) {

      clicks++;

      button.textContent =
        clicks;

      return;

    }


    running = true;

    clicks = 0;

    endTime =
      Date.now() + 10000;

    button.textContent =
      "0";


    function timer() {

      const remaining =
        Math.max(
          0,
          endTime - Date.now()
        );


      display.textContent =
        Math.ceil(
          remaining / 1000
        );


      if (remaining <= 0) {

        running = false;

        display.textContent =
          "TIME!";

        button.textContent =
          "PLAY AGAIN";

        saveScore(
          "Click Storm",
          clicks
        );

        return;

      }


      requestAnimationFrame(timer);

    }


    timer();

  };

}


/* =========================
   QUICK MATH
========================= */

function mathGame() {

  let round = 0;

  let points = 0;


  function nextQuestion() {

    round++;


    if (round > 10) {

      gameArea.innerHTML = `

        <h2>
          Finished!
        </h2>

        <div class="big-score">
          ${points}/10
        </div>

        <button
          class="game-action"
          id="mathAgain"
        >
          PLAY AGAIN
        </button>

      `;

      saveScore(
        "Quick Math",
        points
      );

      document
        .getElementById("mathAgain")
        .onclick = mathGame;

      return;

    }


    const a =
      Math.floor(
        Math.random() * 20
      ) + 1;

    const b =
      Math.floor(
        Math.random() * 20
      ) + 1;

    const answer =
      a + b;


    gameArea.innerHTML = `

      <h2>
        ➗ Quick Math
      </h2>

      <p>
        Question ${round} / 10
      </p>

      <div class="big-score">
        ${a} + ${b}
      </div>

      <input
        id="mathAnswer"
        type="number"
        placeholder="Answer"
        style="
          padding:14px;
          border-radius:10px;
          border:1px solid #303b5d;
          background:#0c1122;
          color:white;
          width:180px;
          text-align:center;
        "
      >

      <br><br>

      <button
        id="mathSubmit"
        class="game-action"
      >
        SUBMIT
      </button>

    `;


    const input =
      document.getElementById(
        "mathAnswer"
      );

    const submit =
      document.getElementById(
        "mathSubmit"
      );


    input.focus();


    function submitAnswer() {

      if (
        Number(input.value) ===
        answer
      ) {

        points++;

      }

      nextQuestion();

    }


    submit.onclick =
      submitAnswer;


    input.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {

          submitAnswer();

        }

      }
    );

  }


  nextQuestion();

}


/* =========================
   OTHER GAMES
========================= */

function demoGame(name) {

  gameArea.innerHTML = `

    <h2>
      Game Preview
    </h2>

    <p>
      ${name} is included in
      the ODDORA arcade.
    </p>

    <button
      class="game-action"
      id="demoButton"
    >
      START DEMO
    </button>

  `;


  document
    .getElementById("demoButton")
    .onclick = () => {

      saveScore(name, 1);

      gameArea.innerHTML = `

        <h2>
          Completed!
        </h2>

        <div class="big-score">
          +1
        </div>

        <button
          class="game-action"
          onclick="openGame('${games.find(g => g.name === name)?.id}')"
        >
          PLAY AGAIN
        </button>

      `;

    };

}


/* =========================
   LOGIN PLACEHOLDER
========================= */

loginBtn.addEventListener(
  "click",
  () => {

    alert(
      "Online accounts will be connected in the backend stage. Your current scores are saved on this device."
    );

  }
);


/* =========================
   START
========================= */

renderGames();

renderLeaderboard();
