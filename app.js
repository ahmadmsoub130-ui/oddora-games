const games = [
  {
    id: "reaction",
    name: "Reaction Rush",
    icon: "⚡",
    description: "Test your reaction speed across 10 rounds."
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

  score = Math.max(
    0,
    Math.floor(score)
  );

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

    demoGame(game);

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


/* =========================================================
   REACTION RUSH
========================================================= */

function reactionGame() {

  let round = 0;

  let totalScore = 0;

  let bestReaction = null;

  let gameRunning = false;

  let targetTimer = null;

  let reactionStart = 0;


  function startScreen() {

    gameArea.innerHTML = `

      <h2>
        ⚡ Reaction Rush
      </h2>

      <p>
        Complete 10 rounds.
        Wait for the target and tap it as quickly
        as possible.
      </p>

      <button
        id="startReaction"
        class="game-action"
      >
        START GAME
      </button>

      <div
        style="
          margin-top:20px;
          color:#9da7c8;
        "
      >
        Best score:
        <strong>
          ${scores["Reaction Rush"] || 0}
        </strong>
      </div>

    `;


    document
      .getElementById("startReaction")
      .onclick = startRound;

  }


  function startRound() {

    round++;

    gameRunning = false;

    gameArea.innerHTML = `

      <h2>
        ⚡ Reaction Rush
      </h2>

      <p>
        Round ${round} / 10
      </p>

      <div
        id="reactionArena"
        style="
          position:relative;
          height:300px;
          margin-top:20px;
          border-radius:18px;
          border:1px solid #303a61;
          background:#080c19;
          overflow:hidden;
        "
      >

        <div
          id="reactionMessage"
          style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#aab4d4;
            font-weight:800;
          "
        >
          WAIT...
        </div>

      </div>

      <div
        id="reactionInfo"
        style="
          margin-top:18px;
          color:#9da7c8;
        "
      >
        Get ready...
      </div>

    `;


    const arena =
      document.getElementById(
        "reactionArena"
      );


    const message =
      document.getElementById(
        "reactionMessage"
      );


    const info =
      document.getElementById(
        "reactionInfo"
      );


    const delay =
      900 +
      Math.random() * 2600;


    targetTimer =
      setTimeout(() => {

        if (!gameRunning) {

          gameRunning = true;

          reactionStart =
            performance.now();


          message.remove();


          const target =
            document.createElement("button");


          target.id =
            "reactionTarget";


          target.textContent =
            "TAP!";


          target.style.position =
            "absolute";


          target.style.width =
            "82px";


          target.style.height =
            "82px";


          target.style.borderRadius =
            "50%";


          target.style.border =
            "0";


          target.style.background =
            "#695cff";


          target.style.color =
            "#ffffff";


          target.style.fontWeight =
            "900";


          target.style.cursor =
            "pointer";


          target.style.left =
            Math.random() *
              (arena.clientWidth - 100)
            + "px";


          target.style.top =
            Math.random() *
              (arena.clientHeight - 100)
            + "px";


          arena.appendChild(target);


          info.textContent =
            "TAP THE TARGET!";


          target.onclick =
            finishRound;


        }

      }, delay);


    arena.onclick = event => {

      if (
        gameRunning &&
        event.target === arena
      ) {

        finishRound();

      }

    };


    function finishRound() {

      if (!gameRunning) {

        clearTimeout(targetTimer);

        info.textContent =
          "Too early! Wait for the target.";

        setTimeout(
          startRound,
          900
        );

        return;

      }


      gameRunning = false;


      const reaction =
        Math.round(
          performance.now() -
          reactionStart
        );


      if (
        bestReaction === null ||
        reaction < bestReaction
      ) {

        bestReaction =
          reaction;

      }


      const points =
        Math.max(
          50,
          1000 - reaction
        );


      totalScore += points;


      info.textContent =
        reaction +
        " ms  •  +" +
        points +
        " points";


      if (round >= 10) {

        finishGame();

        return;

      }


      setTimeout(
        startRound,
        1000
      );

    }

  }


  function finishGame() {

    saveScore(
      "Reaction Rush",
      totalScore
    );


    gameArea.innerHTML = `

      <h2>
        ⚡ Game Complete
      </h2>

      <p>
        You completed all 10 rounds.
      </p>

      <div
        class="big-score"
      >
        ${totalScore}
      </div>

      <p>
        Best reaction:
        <strong>
          ${bestReaction} ms
        </strong>
      </p>

      <button
        id="reactionAgain"
        class="game-action"
      >
        PLAY AGAIN
      </button>

    `;


    document
      .getElementById("reactionAgain")
      .onclick =
      reactionGame;

  }


  startScreen();

}


/* =========================================================
   CLICK STORM
========================================================= */

function clickGame() {

  let clicks = 0;

  let running = false;

  let endTime = 0;


  gameArea.innerHTML = `

    <h2>
      🖱️ Click Storm
    </h2>

    <p>
      Make as many clicks as possible
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


/* =========================================================
   QUICK MATH
========================================================= */

function mathGame() {

  let round = 0;

  let points = 0;


  function nextQuestion() {

    round++;


    if (round > 10) {

      saveScore(
        "Quick Math",
        points
      );


      gameArea.innerHTML = `

        <h2>
          ➗ Finished!
        </h2>

        <div class="big-score">
          ${points}/10
        </div>

        <button
          id="mathAgain"
          class="game-action"
        >
          PLAY AGAIN
        </button>

      `;


      document
        .getElementById("mathAgain")
        .onclick =
        mathGame;


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


/* =========================================================
   OTHER GAMES
========================================================= */

function demoGame(game) {

  gameArea.innerHTML = `

    <h2>
      ${game.icon}
      ${game.name}
    </h2>

    <p>
      This game is part of the ODDORA arcade.
    </p>

    <button
      id="demoButton"
      class="game-action"
    >
      START
    </button>

  `;


  document
    .getElementById("demoButton")
    .onclick = () => {

      saveScore(
        game.name,
        1
      );


      gameArea.innerHTML = `

        <h2>
          Completed!
        </h2>

        <div class="big-score">
          +1
        </div>

        <button
          id="demoAgain"
          class="game-action"
        >
          PLAY AGAIN
        </button>

      `;


      document
        .getElementById("demoAgain")
        .onclick = () => {

          openGame(game.id);

        };

    };

}


/* =========================================================
   LOGIN
========================================================= */

loginBtn.addEventListener(
  "click",
  () => {

    alert(
      "Online accounts will be connected in the backend stage. Your current scores are saved on this device."
    );

  }
);


/* =========================================================
   START
========================================================= */

renderGames();

renderLeaderboard();
