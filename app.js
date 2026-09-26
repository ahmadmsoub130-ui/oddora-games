const SUPABASE_URL = "https://mfhsjtrlrihhbqryajoc.supabase.co";
const SUPABASE_KEY = "sb_publishable_RpIsvyN1uDfQSSDnGBJEsw_L2OkdPJZ";

let supabaseClient = null;

if (window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  } catch (e) {
    console.error("Supabase error:", e);
  }
}

let currentGame = null;
let currentQuestion = 0;
let currentScore = 0;
let tapCount = 0;
let tapTime = 0;
let tapTimer = null;
let selectedCategory = "الكل";

const gamesGrid = document.getElementById("gamesGrid");
const searchInput = document.getElementById("search");
const filters = document.getElementById("filters");
const gameScreen = document.getElementById("gameScreen");
const gameContent = document.getElementById("gameContent");
const activeGameTitle = document.getElementById("activeGameTitle");
const closeGame = document.getElementById("closeGame");

const authModal = document.getElementById("authModal");
const openAuth = document.getElementById("openAuth");
const openAuthHero = document.getElementById("openAuthHero");
const closeAuth = document.getElementById("closeAuth");

const loginMode = document.getElementById("loginMode");
const signupMode = document.getElementById("signupMode");
const authTitle = document.getElementById("authTitle");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitAuth = document.getElementById("submitAuth");
const authMessage = document.getElementById("authMessage");
const authArea = document.getElementById("authArea");

let authMode = "login";

document.getElementById("year").textContent =
  new Date().getFullYear();

function escapeHTML(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(text) {
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

function getScores() {
  try {
    return JSON.parse(localStorage.getItem("oddora_scores")) || {
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

function addScore(gameId, points) {
  const scores = getScores();

  scores.total += points;

  if (!scores.games[gameId]) {
    scores.games[gameId] = 0;
  }

  scores.games[gameId] += points;

  localStorage.setItem(
    "oddora_scores",
    JSON.stringify(scores)
  );
}

/* =========================
   عرض الألعاب
========================= */

function renderGames() {
  if (!gamesGrid) return;

  if (!Array.isArray(window.GAMES) && !Array.isArray(GAMES)) {
    gamesGrid.innerHTML = `
      <div class="content-box">
        <h2>حدث خطأ في تحميل الألعاب</h2>
        <p>ملف games.js لم يتم تحميله بشكل صحيح.</p>
      </div>
    `;
    return;
  }

  const allGames = Array.isArray(window.GAMES)
    ? window.GAMES
    : GAMES;

  const search = normalize(
    searchInput ? searchInput.value : ""
  );

  const filtered = allGames.filter(game => {

    const categoryOK =
      selectedCategory === "الكل" ||
      game.category === selectedCategory;

    const searchOK =
      !search ||
      normalize(game.title).includes(search) ||
      normalize(game.description).includes(search);

    return categoryOK && searchOK;
  });

  if (!filtered.length) {
    gamesGrid.innerHTML = `
      <div class="content-box"
           style="grid-column:1/-1;text-align:center">
        <h2>لا توجد ألعاب</h2>
        <p>جرّب البحث بكلمة أخرى.</p>
      </div>
    `;
    return;
  }

  gamesGrid.innerHTML = filtered.map(game => `
    <article class="game-card">

      <div>
        <div class="game-icon">
          ${game.icon || "🎮"}
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

      button.addEventListener("click", () => {

        const id = Number(
          button.getAttribute("data-play")
        );

        openGame(id);
      });

    });
}

/* =========================
   فتح اللعبة
========================= */

function openGame(id) {

  const allGames =
    Array.isArray(window.GAMES)
      ? window.GAMES
      : GAMES;

  const game = allGames.find(
    item => Number(item.id) === Number(id)
  );

  if (!game) {
    alert("لم يتم العثور على اللعبة.");
    return;
  }

  currentGame = game;
  currentQuestion = 0;
  currentScore = 0;
  tapCount = 0;

  clearInterval(tapTimer);

  activeGameTitle.textContent =
    game.title;

  gameScreen.hidden = false;

  gameScreen.scrollIntoView({
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
    renderTap();
  }

  else {
    gameContent.innerHTML = `
      <div class="content-box">
        <h2>نوع اللعبة غير معروف</h2>
      </div>
    `;
  }
}

/* =========================
   لعبة الأسئلة
========================= */

function renderQuiz() {

  const questions =
    currentGame.questions || [];

  if (
    currentQuestion >= questions.length
  ) {
    finishQuiz();
    return;
  }

  const q =
    questions[currentQuestion];

  gameContent.innerHTML = `
    <div class="scorebox">
      السؤال ${currentQuestion + 1}
      / ${questions.length}
    </div>

    <div class="scorebox">
      النقاط: ${currentScore}
    </div>

    <div class="question">
      ${escapeHTML(q.q)}
    </div>

    <div class="answers">

      ${q.answers.map((answer, index) => `
        <button
          class="answer"
          data-answer="${index}">
          ${escapeHTML(answer)}
        </button>
      `).join("")}

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

          checkQuizAnswer(
            Number(
              button.getAttribute("data-answer")
            ),
            button
          );

        }
      );

    });
}

function checkQuizAnswer(
  selected,
  button
) {

  const q =
    currentGame.questions[currentQuestion];

  const buttons =
    gameContent.querySelectorAll(
      "[data-answer]"
    );

  buttons.forEach(
    b => b.disabled = true
  );

  const result =
    document.getElementById(
      "quizResult"
    );

  if (selected === q.correct) {

    currentScore += 10;

    button.classList.add("correct");

    result.textContent =
      "إجابة صحيحة! +10 نقاط";

    result.style.color =
      "var(--good)";

  } else {

    button.classList.add("wrong");

    if (buttons[q.correct]) {
      buttons[q.correct]
        .classList.add("correct");
    }

    result.textContent =
      "إجابة غير صحيحة.";

    result.style.color =
      "var(--bad)";
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
        <strong>${currentScore}</strong>
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
    .addEventListener(
      "click",
      () => {

        currentQuestion = 0;
        currentScore = 0;

        renderQuiz();

      }
    );
}

/* =========================
   لعبة الألغاز
========================= */

function renderRiddle() {

  gameContent.innerHTML = `
    <div class="riddle-box">

      <div style="font-size:55px">
        ${currentGame.icon || "🧩"}
      </div>

      <div class="question">
        ${escapeHTML(
          currentGame.question
        )}
      </div>

      <input
        id="riddleAnswer"
        class="text-input"
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

  function check() {

    const answer =
      normalize(input.value);

    if (!answer) {

      result.textContent =
        "اكتب إجابة أولًا.";

      return;
    }

    const accepted =
      currentGame.accepted ||
      [currentGame.answer];

    const correct =
      accepted.some(
        item =>
          normalize(item) === answer
      );

    if (correct) {

      addScore(
        currentGame.id,
        15
      );

      result.textContent =
        "إجابة صحيحة! +15 نقطة";

      result.style.color =
        "var(--good)";

      button.disabled = true;

    } else {

      result.textContent =
        "إجابة غير صحيحة. حاول مرة أخرى.";

      result.style.color =
        "var(--bad)";
    }
  }

  button.addEventListener(
    "click",
    check
  );

  input.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        check();
      }

    }
  );
}

/* =========================
   القصص
========================= */

function renderStory() {

  const story =
    currentGame.story || [];

  let page = 0;

  function draw() {

    const last =
      page === story.length - 1;

    gameContent.innerHTML = `
      <div class="story">

        <div
          style="font-size:50px">
          ${currentGame.icon || "🌙"}
        </div>

        <div>
          ${escapeHTML(story[page])}
        </div>

        <div
          style="margin-top:20px;color:var(--muted)">
          صفحة ${page + 1}
          من ${story.length}
        </div>

        <div style="margin-top:20px">

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
            !last
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
          draw();
        }
      );

    document
      .getElementById("storyNext")
      ?.addEventListener(
        "click",
        () => {
          page++;
          draw();
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
          <strong>20</strong>
          نقطة.
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
      .addEventListener(
        "click",
        () => {

          page = 0;

          draw();

        }
      );
  }

  draw();
}

/* =========================
   تحديات الضغط
========================= */

function renderTap() {

  tapCount = 0;

  tapTime =
    Number(
      currentGame.duration || 10
    );

  gameContent.innerHTML = `
    <div>

      <div class="scorebox">
        الوقت:
        <span id="tapTimer">
          ${tapTime}
        </span>
      </div>

      <div class="scorebox">
        الضغطات:
        <span id="tapScore">
          0
        </span>
      </div>

      <div class="timer">
        ${currentGame.icon || "⚡"}
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

  const button =
    document.getElementById(
      "tapButton"
    );

  const timer =
    document.getElementById(
      "tapTimer"
    );

  const score =
    document.getElementById(
      "tapScore"
    );

  const result =
    document.getElementById(
      "tapResult"
    );

  let started = false;

  function finish() {

    clearInterval(tapTimer);

    button.disabled = true;

    const points =
      Math.min(tapCount, 100);

    addScore(
      currentGame.id,
      points
    );

    result.innerHTML =
      `انتهى الوقت! حصلت على <strong>${points}</strong> نقطة.`;
  }

  button.addEventListener(
    "click",
    () => {

      if (!started) {

        started = true;

        result.textContent =
          "استمر بالضغط!";

        tapTimer =
          setInterval(
            () => {

              tapTime--;

              timer.textContent =
                tapTime;

              if (tapTime <= 0) {
                finish();
              }

            },
            1000
          );
      }

      if (tapTime > 0) {

        tapCount++;

        score.textContent =
          tapCount;
      }

    }
  );
}

/* =========================
   الفلاتر والبحث
========================= */

if (filters) {

  filters
    .querySelectorAll(
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
              b =>
                b.classList.add(
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
}

if (searchInput) {

  searchInput.addEventListener(
    "input",
    renderGames
  );
}

/* =========================
   إغلاق اللعبة
========================= */

closeGame?.addEventListener(
  "click",
  () => {

    clearInterval(tapTimer);

    gameScreen.hidden = true;

    gameContent.innerHTML = "";

    currentGame = null;

    document
      .getElementById("games")
      ?.scrollIntoView({
        behavior: "smooth"
      });
  }
);

/* =========================
   تسجيل الدخول
========================= */

function showAuth(mode) {

  authMode = mode;

  authModal.classList.add(
    "show"
  );

  authModal.setAttribute(
    "aria-hidden",
    "false"
  );

  updateAuthMode();
}

function hideAuth() {

  authModal.classList.remove(
    "show"
  );

  authModal.setAttribute(
    "aria-hidden",
    "true"
  );
}

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

function message(
  text,
  type = "normal"
) {

  authMessage.textContent =
    text;

  authMessage.style.color =
    type === "error"
      ? "var(--bad)"
      : type === "success"
        ? "var(--good)"
        : "#ffd36b";
}

openAuth?.addEventListener(
  "click",
  () => showAuth("login")
);

openAuthHero?.addEventListener(
  "click",
  () => showAuth("signup")
);

closeAuth?.addEventListener(
  "click",
  hideAuth
);

loginMode?.addEventListener(
  "click",
  () => {

    authMode = "login";

    updateAuthMode();

  }
);

signupMode?.addEventListener(
  "click",
  () => {

    authMode = "signup";

    updateAuthMode();

  }
);

authModal?.addEventListener(
  "click",
  event => {

    if (event.target === authModal) {
      hideAuth();
    }

  }
);

async function handleAuth() {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  message("");

  if (!email) {
    message(
      "اكتب البريد الإلكتروني.",
      "error"
    );
    return;
  }

  if (password.length < 6) {
    message(
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
      "error"
    );
    return;
  }

  if (!supabaseClient) {

    message(
      "خدمة الحسابات غير متاحة.",
      "error"
    );

    return;
  }

  submitAuth.disabled = true;

  try {

    let result;

    if (authMode === "signup") {

      result =
        await supabaseClient.auth.signUp({
          email,
          password
        });

    } else {

      result =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
    }

    if (result.error) {
      throw result.error;
    }

    if (
      authMode === "signup" &&
      !result.data.session
    ) {

      message(
        "تم إنشاء الحساب. تحقق من بريدك الإلكتروني.",
        "success"
      );

    } else {

      message(
        "تم تسجيل الدخول بنجاح.",
        "success"
      );

      setTimeout(
        hideAuth,
        700
      );
    }

    updateAuth();

  } catch (error) {

    console.error(error);

    message(
      error.message ||
      "حدث خطأ.",
      "error"
    );

  } finally {

    submitAuth.disabled = false;

    updateAuthMode();
  }
}

submitAuth?.addEventListener(
  "click",
  handleAuth
);

/* =========================
   حالة الحساب
========================= */

function renderLoggedOut() {

  authArea.innerHTML = `
    <button
      class="btn"
      id="dynamicAuth">
      دخول / تسجيل
    </button>
  `;

  document
    .getElementById("dynamicAuth")
    ?.addEventListener(
      "click",
      () => showAuth("login")
    );
}

function renderLoggedIn(user) {

  const email =
    user?.email || "المستخدم";

  const letter =
    email.charAt(0).toUpperCase();

  authArea.innerHTML = `
    <div class="profile">

      <div class="avatar">
        ${escapeHTML(letter)}
      </div>

      <button
        class="btn secondary"
        id="logoutButton">
        خروج
      </button>

    </div>
  `;

  document
    .getElementById("logoutButton")
    ?.addEventListener(
      "click",
      async () => {

        await supabaseClient.auth.signOut();

      }
    );
}

async function updateAuth() {

  if (!supabaseClient) {

    renderLoggedOut();

    return;
  }

  try {

    const {
      data
    } =
      await supabaseClient.auth.getSession();

    const user =
      data?.session?.user || null;

    if (user) {
      renderLoggedIn(user);
    } else {
      renderLoggedOut();
    }

  } catch (error) {

    console.error(error);

    renderLoggedOut();
  }
}

if (supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    (
      event,
      session
    ) => {

      if (session?.user) {
        renderLoggedIn(
          session.user
        );
      } else {
        renderLoggedOut();
      }

    }
  );
}

/* =========================
   تشغيل الموقع
========================= */

renderGames();

updateAuth();
