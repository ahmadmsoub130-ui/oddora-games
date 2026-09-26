/* =====================================================
   ODDORA GAMES - APP.JS
   ===================================================== */

/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://mfhsjtrlrihhbqryajoc.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_RpIsvyN1uDfQSSDnGBJEsw_L2OkdPJZ";

let supabaseClient = null;

try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }
} catch (error) {
  console.error("Supabase initialization error:", error);
}


/* =========================
   GLOBAL STATE
========================= */

let currentUser = null;

let currentGame = null;

let currentQuestion = 0;

let currentScore = 0;

let tapCount = 0;

let tapTimeLeft = 0;

let tapTimer = null;

let authMode = "login";

let selectedCategory = "الكل";


/* =========================
   LOCAL STORAGE
========================= */

const STORAGE_KEY = "oddora_scores";

function getLocalScores() {

  try {

    return JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    ) || {
      total: 0,
      games: {}
    };

  } catch {

    return {
      total: 0,
      games: {}
    };

  }

}


function saveLocalScores(scores) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(scores)
  );

}


function addScore(gameId, points) {

  const scores = getLocalScores();

  scores.total += points;

  if (!scores.games[gameId]) {
    scores.games[gameId] = 0;
  }

  scores.games[gameId] += points;

  saveLocalScores(scores);

}


/* =========================
   DOM
========================= */

const gamesGrid =
  document.getElementById("gamesGrid");

const searchInput =
  document.getElementById("search");

const filters =
  document.getElementById("filters");

const gameScreen =
  document.getElementById("gameScreen");

const gameContent =
  document.getElementById("gameContent");

const activeGameTitle =
  document.getElementById("activeGameTitle");

const closeGame =
  document.getElementById("closeGame");

const year =
  document.getElementById("year");

const authModal =
  document.getElementById("authModal");

const openAuth =
  document.getElementById("openAuth");

const openAuthHero =
  document.getElementById("openAuthHero");

const closeAuth =
  document.getElementById("closeAuth");

const loginMode =
  document.getElementById("loginMode");

const signupMode =
  document.getElementById("signupMode");

const authTitle =
  document.getElementById("authTitle");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const submitAuth =
  document.getElementById("submitAuth");

const authMessage =
  document.getElementById("authMessage");

const authArea =
  document.getElementById("authArea");


if (year) {
  year.textContent = new Date().getFullYear();
}


/* =========================
   HELPERS
========================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function normalizeArabic(text) {

  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "");

}


/* =========================
   GAME LIST
========================= */

function getFilteredGames() {

  const search =
    normalizeArabic(
      searchInput?.value || ""
    );

  return GAMES.filter(game => {

    const categoryMatch =
      selectedCategory === "الكل" ||
      game.category === selectedCategory;

    const searchMatch =
      !search ||
      normalizeArabic(game.title)
        .includes(search) ||
      normalizeArabic(game.description)
        .includes(search);

    return categoryMatch && searchMatch;

  });

}


/* =========================
   RENDER GAMES
========================= */

function renderGames() {

  if (!gamesGrid) return;

  const games =
    getFilteredGames();

  if (!games.length) {

    gamesGrid.innerHTML = `
      <div class="content-box"
           style="grid-column:1/-1;text-align:center">
        <h2>لم نجد اللعبة</h2>
        <p>جرّب كلمة بحث أخرى.</p>
      </div>
    `;

    return;

  }


  gamesGrid.innerHTML =
    games.map(game => `

      <article class="game-card">

        <div>

          <div class="game-icon">
            ${game.icon}
          </div>

          <h3>
            ${escapeHTML(game.title)}
          </h3>

          <p>
            ${escapeHTML(game.description)}
          </p>

          <div class="game-category">
            ${escapeHTML(game.category)}
          </div>

        </div>

        <button
          class="btn"
          data-play="${game.id}">
          العب الآن
        </button>

      </article>

    `).join("");


  gamesGrid
    .querySelectorAll("[data-play]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            Number(button.dataset.play);

          openGame(id);

        }
      );

    });

}


/* =========================
   OPEN GAME
========================= */

function openGame(id) {

  const game =
    GAMES.find(
      item => item.id === id
    );

  if (!game) return;

  currentGame = game;

  currentQuestion = 0;

  currentScore = 0;

  tapCount = 0;

  clearInterval(tapTimer);

  if (activeGameTitle) {
    activeGameTitle.textContent =
      game.title;
  }

  if (gameScreen) {
    gameScreen.hidden = false;
  }

  document
    .getElementById("games")
    ?.scrollIntoView({
      behavior: "smooth"
    });


  if (game.type === "quiz") {
    renderQuiz();
  }

  else if (game.type === "riddle") {
    renderRiddle();
  }

  else if (game.type === "story") {
    renderStory();
  }

  else if (game.type === "tap") {
    renderTapGame();
  }

}


/* =========================
   CLOSE GAME
========================= */

function closeCurrentGame() {

  clearInterval(tapTimer);

  if (gameScreen) {
    gameScreen.hidden = true;
  }

  if (gameContent) {
    gameContent.innerHTML = "";
  }

  currentGame = null;

  document
    .getElementById("games")
    ?.scrollIntoView({
      behavior: "smooth"
    });

}


closeGame?.addEventListener(
  "click",
  closeCurrentGame
);


/* =========================
   QUIZ GAME
========================= */

function renderQuiz() {

  const question =
    currentGame.questions[currentQuestion];

  if (!question) {

    finishQuiz();

    return;

  }


  const total =
    currentGame.questions.length;

  gameContent.innerHTML = `

    <div class="scorebox">
      السؤال ${currentQuestion + 1}
      / ${total}
    </div>

    <div class="scorebox">
      النقاط: ${currentScore}
    </div>

    <div class="question">
      ${escapeHTML(question.q)}
    </div>

    <div class="answers">

      ${question.answers.map(
        (answer, index) => `

          <button
            class="answer"
            data-answer="${index}">
            ${escapeHTML(answer)}
          </button>

        `
      ).join("")}

    </div>

    <div
      class="result"
      id="quizResult">
    </div>

  `;


  gameContent
    .querySelectorAll("[data-answer]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          handleQuizAnswer(
            Number(button.dataset.answer),
            button
          );

        }
      );

    });

}


function handleQuizAnswer(
  selected,
  clickedButton
) {

  const question =
    currentGame.questions[currentQuestion];

  const buttons =
    gameContent.querySelectorAll(
      "[data-answer]"
    );

  buttons.forEach(
    button => {
      button.disabled = true;
    }
  );


  if (selected === question.correct) {

    currentScore += 10;

    clickedButton.classList.add(
      "correct"
    );

    const result =
      document.getElementById(
        "quizResult"
      );

    if (result) {
      result.textContent =
        "إجابة صحيحة! +10 نقاط";
      result.style.color =
        "var(--good)";
    }

  } else {

    clickedButton.classList.add(
      "wrong"
    );

    buttons[
      question.correct
    ]?.classList.add(
      "correct"
    );

    const result =
      document.getElementById(
        "quizResult"
      );

    if (result) {
      result.textContent =
        "إجابة غير صحيحة.";
      result.style.color =
        "var(--bad)";
    }

  }


  setTimeout(() => {

    currentQuestion++;

    renderQuiz();

  }, 900);

}


function finishQuiz() {

  addScore(
    currentGame.id,
    currentScore
  );

  gameContent.innerHTML = `

    <div class="content-box">

      <div style="font-size:60px">
        🏆
      </div>

      <h2>
        انتهت اللعبة
      </h2>

      <p>
        حصلت على
        <strong>
          ${currentScore}
        </strong>
        نقطة.
      </p>

      <button
        class="btn"
        id="restartGame">
        العب مرة أخرى
      </button>

    </div>

  `;


  document
    .getElementById("restartGame")
    ?.addEventListener(
      "click",
      () => {

        currentQuestion = 0;
        currentScore = 0;

        renderQuiz();

      }
    );

}


/* =========================
   RIDDLE GAME
========================= */

function renderRiddle() {

  gameContent.innerHTML = `

    <div class="riddle-box">

      <div style="font-size:55px">
        ${currentGame.icon}
      </div>

      <div class="question">
        ${escapeHTML(
          currentGame.question
        )}
      </div>

      <input
        id="riddleAnswer"
        class="text-input"
        type="text"
        placeholder="اكتب إجابتك هنا"
        autocomplete="off">

      <br><br>

      <button
        class="btn"
        id="checkRiddle">
        تحقق من الإجابة
      </button>

      <div
        class="result"
        id="riddleResult">
      </div>

    </div>

  `;


  const input =
    document.getElementById(
      "riddleAnswer"
    );

  const button =
    document.getElementById(
      "checkRiddle"
    );

  const result =
    document.getElementById(
      "riddleResult"
    );


  function checkAnswer() {

    const userAnswer =
      normalizeArabic(
        input.value
      );

    if (!userAnswer) {

      result.textContent =
        "اكتب إجابة أولًا.";

      return;

    }


    const accepted =
      currentGame.accepted || [
        currentGame.answer
      ];


    const correct =
      accepted.some(
        answer =>
          normalizeArabic(answer)
            === userAnswer
      );


    if (correct) {

      addScore(
        currentGame.id,
        15
      );

      result.innerHTML =
        "إجابة صحيحة! +15 نقطة";

      result.style.color =
        "var(--good)";

      button.disabled = true;

    } else {

      result.innerHTML =
        `إجابة غير صحيحة. حاول مرة أخرى.`;

      result.style.color =
        "var(--bad)";

    }

  }


  button?.addEventListener(
    "click",
    checkAnswer
  );


  input?.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        checkAnswer();
      }

    }
  );

}


/* =========================
   STORY GAME
========================= */

function renderStory() {

  const story =
    currentGame.story || [];

  let page = 0;


  function drawStory() {

    const isLast =
      page >= story.length - 1;


    gameContent.innerHTML = `

      <div class="story">

        <div
          style="
            font-size:50px;
            margin-bottom:10px;
          ">
          ${currentGame.icon}
        </div>

        <div>
          ${escapeHTML(story[page])}
        </div>

        <div
          style="
            margin-top:20px;
            color:var(--muted);
          ">
          صفحة ${page + 1}
          من ${story.length}
        </div>

        <div>

          ${
            page > 0
            ? `
              <button
                class="btn secondary"
                id="storyBack">
                السابق
              </button>
            `
            : ""
          }

          ${
            !isLast
            ? `
              <button
                class="btn"
                id="storyNext">
                التالي
              </button>
            `
            : `
              <button
                class="btn"
                id="storyFinish">
                إنهاء القصة
              </button>
            `
          }

        </div>

      </div>

    `;


    document
      .getElementById("storyBack")
      ?.addEventListener(
        "click",
        () => {

          page--;

          drawStory();

        }
      );


    document
      .getElementById("storyNext")
      ?.addEventListener(
        "click",
        () => {

          page++;

          drawStory();

        }
      );


    document
      .getElementById("storyFinish")
      ?.addEventListener(
        "click",
        finishStory
      );

  }


  function finishStory() {

    addScore(
      currentGame.id,
      20
    );

    gameContent.innerHTML = `

      <div class="content-box">

        <div style="font-size:60px">
          🌙
        </div>

        <h2>
          انتهت الحكاية
        </h2>

        <p>
          حصلت على
          <strong>20 نقطة</strong>
          لإكمال القصة.
        </p>

        <button
          class="btn"
          id="storyAgain">
          قراءة القصة مرة أخرى
        </button>

      </div>

    `;


    document
      .getElementById("storyAgain")
      ?.addEventListener(
        "click",
        () => {

          page = 0;

          drawStory();

        }
      );

  }


  drawStory();

}


/* =========================
   TAP GAME
========================= */

function renderTapGame() {

  tapCount = 0;

  tapTimeLeft =
    currentGame.duration || 10;


  gameContent.innerHTML = `

    <div>

      <div
        class="scorebox">
        الوقت:
        <span id="tapTimer">
          ${tapTimeLeft}
        </span>
      </div>

      <div
        class="scorebox">
        الضغطات:
        <span id="tapScore">
          0
        </span>
      </div>

      <div class="timer">
        ${currentGame.icon}
      </div>

      <button
        id="tapButton"
        class="big-action">
        اضغط!
      </button>

      <div
        class="result"
        id="tapResult">
        اضغط للبدء
      </div>

    </div>

  `;


  const tapButton =
    document.getElementById(
      "tapButton"
    );

  const timerElement =
    document.getElementById(
      "tapTimer"
    );

  const scoreElement =
    document.getElementById(
      "tapScore"
    );

  const resultElement =
    document.getElementById(
      "tapResult"
    );


  let started = false;


  function finishTapGame() {

    clearInterval(tapTimer);

    tapButton.disabled = true;

    const points =
      Math.min(
        tapCount,
        100
      );


    addScore(
      currentGame.id,
      points
    );


    resultElement.innerHTML =
      `انتهى الوقت! حصلت على
       <strong>${points}</strong>
       نقطة.`;

  }


  tapButton.addEventListener(
    "click",
    () => {

      if (!started) {

        started = true;

        resultElement.textContent =
          "استمر بالضغط!";

        tapTimer =
          setInterval(() => {

            tapTimeLeft--;

            timerElement.textContent =
              tapTimeLeft;

            if (tapTimeLeft <= 0) {

              finishTapGame();

            }

          }, 1000);

      }


      if (tapTimeLeft > 0) {

        tapCount++;

        scoreElement.textContent =
          tapCount;

      }

    }
  );

}


/* =========================
   FILTERS
========================= */

filters
  ?.querySelectorAll(
    "[data-category]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedCategory =
          button.dataset.category;

        filters
          .querySelectorAll("button")
          .forEach(
            item =>
              item.classList.add(
                "secondary"
              )
          );

        button.classList.remove(
          "secondary"
        );

        renderGames();

      }
    );

  });


/* =========================
   SEARCH
========================= */

searchInput?.addEventListener(
  "input",
  renderGames
);


/* =========================
   AUTH MODAL
========================= */

function showAuthModal(
  mode = "login"
) {

  authMode = mode;

  if (!authModal) return;

  authModal.classList.add("show");

  authModal.setAttribute(
    "aria-hidden",
    "false"
  );

  updateAuthMode();

  setTimeout(
    () => emailInput?.focus(),
    100
  );

}


function hideAuthModal() {

  authModal?.classList.remove(
    "show"
  );

  authModal?.setAttribute(
    "aria-hidden",
    "true"
  );

  clearAuthMessage();

}


openAuth?.addEventListener(
  "click",
  () => showAuthModal("login")
);


openAuthHero?.addEventListener(
  "click",
  () => showAuthModal("signup")
);


closeAuth?.addEventListener(
  "click",
  hideAuthModal
);


authModal?.addEventListener(
  "click",
  event => {

    if (event.target === authModal) {
      hideAuthModal();
    }

  }
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      authModal?.classList.contains("show")
    ) {

      hideAuthModal();

    }

  }
);


/* =========================
   AUTH MODE
========================= */

function updateAuthMode() {

  if (authMode === "login") {

    authTitle.textContent =
      "تسجيل الدخول";

    submitAuth.textContent =
      "تسجيل الدخول";

    loginMode.classList.remove(
      "secondary"
    );

    signupMode.classList.add(
      "secondary"
    );

  } else {

    authTitle.textContent =
      "إنشاء حساب";

    submitAuth.textContent =
      "إنشاء حساب";

    signupMode.classList.remove(
      "secondary"
    );

    loginMode.classList.add(
      "secondary"
    );

  }

}


loginMode?.addEventListener(
  "click",
  () => {

    authMode = "login";

    clearAuthMessage();

    updateAuthMode();

  }
);


signupMode?.addEventListener(
  "click",
  () => {

    authMode = "signup";

    clearAuthMessage();

    updateAuthMode();

  }
);


/* =========================
   AUTH MESSAGE
========================= */

function showAuthMessage(
  message,
  type = "normal"
) {

  if (!authMessage) return;

  authMessage.textContent =
    message;

  if (type === "error") {
    authMessage.style.color =
      "var(--bad)";
  }

  else if (type === "success") {
    authMessage.style.color =
      "var(--good)";
  }

  else {
    authMessage.style.color =
      "#ffd36b";
  }

}


function clearAuthMessage() {

  if (!authMessage) return;

  authMessage.textContent = "";

}


/* =========================
   LOGIN / SIGNUP
========================= */

submitAuth?.addEventListener(
  "click",
  handleAuth
);


passwordInput?.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      handleAuth();
    }

  }
);


emailInput?.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      passwordInput?.focus();
    }

  }
);


async function handleAuth() {

  clearAuthMessage();

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email) {

    showAuthMessage(
      "اكتب البريد الإلكتروني.",
      "error"
    );

    return;

  }


  if (!password || password.length < 6) {

    showAuthMessage(
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
      "error"
    );

    return;

  }


  if (!supabaseClient) {

    showAuthMessage(
      "تعذر الاتصال بخدمة الحسابات.",
      "error"
    );

    return;

  }


  submitAuth.disabled = true;

  submitAuth.textContent =
    "جارٍ التنفيذ...";


  try {

    if (authMode === "signup") {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signUp({
          email,
          password
        });


      if (error) {
        throw error;
      }


      if (data?.session) {

        showAuthMessage(
          "تم إنشاء الحساب وتسجيل الدخول.",
          "success"
        );

        await refreshAuth();

        setTimeout(
          hideAuthModal,
          700
        );

      } else {

        showAuthMessage(
          "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا طلب منك ذلك.",
          "success"
        );

      }

    } else {

      const {
        error
      } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });


      if (error) {
        throw error;
      }


      showAuthMessage(
        "تم تسجيل الدخول بنجاح.",
        "success"
      );


      await refreshAuth();


      setTimeout(
        hideAuthModal,
        700
      );

    }

  } catch (error) {

    console.error(error);

    showAuthMessage(
      translateAuthError(
        error?.message
      ),
      "error"
    );

  } finally {

    submitAuth.disabled = false;

    updateAuthMode();

  }

}


/* =========================
   AUTH ERROR TRANSLATION
========================= */

function translateAuthError(
  message
) {

  const text =
    String(message || "")
      .toLowerCase();


  if (
    text.includes("invalid login") ||
    text.includes("invalid credentials")
  ) {

    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

  }


  if (
    text.includes("user already registered")
  ) {

    return "هذا البريد مسجل مسبقًا. جرّب تسجيل الدخول.";

  }


  if (
    text.includes("password")
  ) {

    return "تحقق من كلمة المرور. يجب أن تكون 6 أحرف على الأقل.";

  }


  if (
    text.includes("email")
  ) {

    return "تحقق من البريد الإلكتروني.";

  }


  return message ||
    "حدث خطأ. حاول مرة أخرى.";

}


/* =========================
   AUTH UI
========================= */

function renderLoggedOut() {

  authArea.innerHTML = `

    <button
      class="btn"
      id="openAuthDynamic">
      دخول / تسجيل
    </button>

  `;


  document
    .getElementById(
      "openAuthDynamic"
    )
    ?.addEventListener(
      "click",
      () => showAuthModal("login")
    );

}


function renderLoggedIn(user) {

  const email =
    user?.email || "المستخدم";

  const firstLetter =
    email
      .charAt(0)
      .toUpperCase();


  const scores =
    getLocalScores();


  authArea.innerHTML = `

    <div class="profile">

      <div class="avatar">
        ${escapeHTML(firstLetter)}
      </div>

      <button
        class="btn secondary"
        id="logoutButton">
        خروج
      </button>

    </div>

  `;


  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  logoutButton?.addEventListener(
    "click",
    logout
  );


  console.log(
    "ODDORA user:",
    email,
    "Local score:",
    scores.total
  );

}


async function refreshAuth() {

  if (!supabaseClient) {

    renderLoggedOut();

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {
      throw error;
    }


    currentUser =
      data?.session?.user || null;


    if (currentUser) {
      renderLoggedIn(
        currentUser
      );
    } else {
      renderLoggedOut();
    }

  } catch (error) {

    console.error(
      "Auth refresh error:",
      error
    );

    currentUser = null;

    renderLoggedOut();

  }

}


async function logout() {

  try {

    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }

  } catch (error) {

    console.error(error);

  }


  currentUser = null;

  renderLoggedOut();

}


/* =========================
   SUPABASE AUTH LISTENER
========================= */

if (supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      currentUser =
        session?.user || null;


      if (currentUser) {
        renderLoggedIn(
          currentUser
        );
      } else {
        renderLoggedOut();
      }

    }
  );

}


/* =========================
   INITIALIZATION
========================= */

function initializeApp() {

  renderGames();

  updateAuthMode();

  refreshAuth();

}


initializeApp();
