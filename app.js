const $ = (selector) => document.querySelector(selector);

const S = {
  token: localStorage.getItem("zx_admin_token") || "",
  scope: localStorage.getItem("zx_scope") || "all",
  type: "test",
  batch: null,
  batches: [],
  sourceItems: []
};


/* =====================================================
   API
   ===================================================== */

function API() {
  return (window.ZX_CONFIG?.API_BASE || "").replace(/\/$/, "");
}


async function req(path, options = {}) {

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  if (S.token) {
    headers.Authorization = `Bearer ${S.token}`;
  }

  const response = await fetch(`${API()}${path}`, { ...options, headers });

  let data = {};

  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (response.status === 401) {
    localStorage.removeItem("zx_admin_token");
    localStorage.removeItem("zx_scope");
    S.token = "";
    S.scope = "all";
    showLogin();
    throw new Error(data.message || "Session expired");
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
}


/* =====================================================
   LOGIN / APP VISIBILITY
   ===================================================== */

function showLogin() {
  const login = $("#login-screen");
  const app = $("#app");

  if (login) login.style.display = "flex";
  if (app) app.style.display = "none";

  const error = $("#login-error");
  if (error) error.textContent = "";
}


function showApp() {
  const login = $("#login-screen");
  const app = $("#app");

  if (login) login.style.display = "none";
  if (app) app.style.display = "block";
}


/* =====================================================
   LOGIN
   ===================================================== */

async function doLogin(event) {

  if (event) event.preventDefault();

  const input = $("#auth-token");
  const error = $("#login-error");
  const button = $("#login-button");

  const authToken = input?.value.trim() || "";

  if (!authToken) {
    if (error) {
      error.style.color = "#fb7185";
      error.textContent = "Auth Token required";
    }
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Signing in...";
  }

  if (error) error.textContent = "";

  try {

    const response = await fetch(`${API()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authToken })
    });

    let data = {};

    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Login failed (${response.status})`
      );
    }

    if (!data.token) {
      throw new Error("Server did not return login token");
    }

    S.token = data.token;
    S.scope = data.scope || "all";

    localStorage.setItem("zx_admin_token", data.token);
    localStorage.setItem("zx_scope", S.scope);

    showApp();

    // Login ke turant baad batch list auto load
    await batches("test");

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    if (error) {
      error.style.color = "#fb7185";
      error.textContent = err.message || "Sign in failed";
    }

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Login";
    }
  }
}


/* =====================================================
   PANEL STYLE
   ===================================================== */

function addPanelStyles() {

  if ($("#zx-panel-styles")) return;

  const style = document.createElement("style");
  style.id = "zx-panel-styles";

  style.textContent = `

    #app {
      min-height: 100vh;
      box-sizing: border-box;
      padding: 22px;
      color: #fff;
      background:
        radial-gradient(circle at 10% 0%, rgba(99,102,241,.20), transparent 32%),
        radial-gradient(circle at 90% 10%, rgba(168,85,247,.18), transparent 30%),
        #070a12;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .zx-wrap { width: min(1180px, 100%); margin: 0 auto; }

    .zx-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 26px;
    }

    .zx-title { font-size: 26px; font-weight: 800; letter-spacing: -.5px; }
    .zx-sub { margin-top: 5px; color: #8d96aa; font-size: 13px; }

    .zx-card {
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 20px;
      padding: 20px;
      background: rgba(16,20,32,.86);
      box-shadow: 0 25px 70px rgba(0,0,0,.30);
    }

    .zx-dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      margin-top: 20px;
    }

    .zx-type-card {
      position: relative;
      min-height: 210px;
      padding: 25px;
      overflow: hidden;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,.10);
      cursor: pointer;
      transition: transform .20s ease, border-color .20s ease, box-shadow .20s ease;
    }

    .zx-type-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255,255,255,.22);
      box-shadow: 0 22px 55px rgba(0,0,0,.32);
    }

    .zx-type-card.test { background: linear-gradient(135deg, #3730a3, #4f46e5 48%, #6366f1); }
    .zx-type-card.dpp { background: linear-gradient(135deg, #7c2d12, #ea580c 48%, #f97316); }

    .zx-type-glow {
      position: absolute;
      width: 180px; height: 180px;
      right: -55px; top: -60px;
      border-radius: 50%;
      background: rgba(255,255,255,.12);
      filter: blur(3px);
    }

    .zx-type-icon {
      position: relative;
      width: 54px; height: 54px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 15px;
      background: rgba(255,255,255,.16);
      border: 1px solid rgba(255,255,255,.20);
      font-size: 25px;
      margin-bottom: 24px;
    }

    .zx-type-title { position: relative; font-size: 24px; font-weight: 800; }

    .zx-type-description {
      position: relative;
      margin-top: 7px;
      color: rgba(255,255,255,.78);
      font-size: 13px;
      line-height: 1.5;
    }

    .zx-type-arrow {
      position: absolute;
      right: 24px; bottom: 23px;
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: rgba(255,255,255,.14);
      font-size: 18px;
    }

    .zx-section-title { font-size: 17px; font-weight: 750; }
    .zx-section-sub { margin-top: 5px; color: #7f889d; font-size: 12px; }

    .zx-actions { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 18px; }

    .zx-btn {
      border: 0;
      border-radius: 11px;
      padding: 11px 16px;
      cursor: pointer;
      color: #fff;
      background: linear-gradient(135deg, #635bff, #7c3aed);
      font-weight: 700;
    }

    .zx-btn.secondary { background: #202536; }

    .zx-search {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 15px;
      border-radius: 11px;
      border: 1px solid rgba(255,255,255,.09);
      outline: none;
      background: #0c0f18;
      color: #fff;
      margin-bottom: 16px;
    }

    .zx-list { display: grid; gap: 11px; }

    .zx-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      padding: 16px;
      border-radius: 14px;
      background: #111522;
      border: 1px solid rgba(255,255,255,.06);
      transition: border-color .18s ease, transform .18s ease;
    }

    .zx-row:hover { border-color: rgba(99,102,241,.40); transform: translateY(-1px); }

    .zx-row-title { font-weight: 700; }
    .zx-row-sub { margin-top: 5px; color: #858da0; font-size: 12px; }

    .zx-empty, .zx-loading { text-align: center; padding: 45px 20px; color: #858da0; }

    @media (max-width: 700px) {
      #app { padding: 14px; }
      .zx-dashboard-grid { grid-template-columns: 1fr; }
      .zx-top { align-items: flex-start; flex-direction: column; }
      .zx-row { align-items: flex-start; flex-direction: column; }
      .zx-type-card { min-height: 190px; }
    }

  `;

  document.head.appendChild(style);
}


/* =====================================================
   SHELL
   ===================================================== */

function shell(title, body) {

  addPanelStyles();

  const app = $("#app");

  if (!app) throw new Error("#app not found");

  app.innerHTML = `

    <div class="zx-wrap">

      <div class="zx-top">

        <div>
          <div class="zx-title">${escapeHtml(title)}</div>
          <div class="zx-sub">Batch Uploader Panel</div>
        </div>

        <button class="zx-btn secondary" onclick="logout()">Logout</button>

      </div>

      ${body}

    </div>

  `;

  app.style.display = "block";
}


/* =====================================================
   HOME (optional dashboard)
   ===================================================== */

async function home() {

  showApp();

  shell(
    "Batch Uploader",
    `
      <div class="zx-card">

        <div class="zx-section-title">What do you want to upload?</div>
        <div class="zx-section-sub">Select Tests or DPPs to continue</div>

        <div class="zx-dashboard-grid">

          <div class="zx-type-card test" onclick="batches('test')">
            <div class="zx-type-glow"></div>
            <div class="zx-type-icon">📝</div>
            <div class="zx-type-title">Tests</div>
            <div class="zx-type-description">
              Browse batches and upload test papers with questions.
            </div>
            <div class="zx-type-arrow">→</div>
          </div>

          <div class="zx-type-card dpp" onclick="batches('dpp')">
            <div class="zx-type-glow"></div>
            <div class="zx-type-icon">📚</div>
            <div class="zx-type-title">DPPs</div>
            <div class="zx-type-description">
              Browse batches and upload daily practice problems.
            </div>
            <div class="zx-type-arrow">→</div>
          </div>

        </div>

      </div>
    `
  );
}


/* =====================================================
   BATCHES
   ===================================================== */

async function batches(type) {

  S.type = type === "dpp" ? "dpp" : "test";
  S.batch = null;

  shell(
    S.type === "test" ? "Tests • Select Batch" : "DPPs • Select Batch",
    `
      <div class="zx-card">

        <div class="zx-actions">

          <button class="zx-btn ${S.type === "test" ? "" : "secondary"}"
            onclick="batches('test')">📝 Tests</button>

          <button class="zx-btn ${S.type === "dpp" ? "" : "secondary"}"
            onclick="batches('dpp')">📚 DPPs</button>

        </div>

        <input
          id="batch-search"
          class="zx-search"
          placeholder="Search batch..."
          autocomplete="off"
          oninput="filterBatches()"
        >

        <div id="batch-list" class="zx-list">
          <div class="zx-loading">Loading batches...</div>
        </div>

      </div>
    `
  );

  try {

    if (S.scope === "batches") {

      // Scoped token: sirf is token ke assigned batches
      const data = await req("/api/admin/batches");

      S.batches = (data.batches || [])
        .map((b) => ({
          ...b,
          id: String(b._id),
          name: String(b.name || "Unnamed Batch")
        }))
        .filter((b) => b.id);

    } else {

      // Master token: source (PenPencil) ke saare batches
      const data = await req("/api/admin/source/batches");

      const raw =
        data.batches ||
        data.data?.batches ||
        data.data?.items ||
        data.data?.data ||
        data.data ||
        [];

      S.batches = Array.isArray(raw)
        ? raw.map(normalizeBatch).filter((b) => b.id)
        : [];
    }

    renderBatches();

  } catch (error) {

    const box = $("#batch-list");

    if (box) {
      box.innerHTML = `
        <div class="zx-empty">
          <div>${escapeHtml(error.message)}</div>
          <br>
          <button class="zx-btn" onclick="batches('${S.type}')">Retry</button>
        </div>
      `;
    }
  }
}


/* =====================================================
   RENDER BATCHES
   ===================================================== */

function renderBatches() {

  const box = $("#batch-list");

  if (!box) return;

  if (!S.batches.length) {
    box.innerHTML = `
      <div class="zx-empty">
        No batches found.
        <br><br>
        ${
          S.scope === "batches"
            ? "Is token ko koi batch assign nahi hai."
            : "Check that the source auth token has batch access."
        }
      </div>
    `;
    return;
  }

  drawBatchList(S.batches);
}


function filterBatches() {

  const query = ($("#batch-search")?.value || "").trim().toLowerCase();

  const list = S.batches.filter((batch) =>
    batch.name.toLowerCase().includes(query)
  );

  drawBatchList(list);
}


function drawBatchList(list) {

  const box = $("#batch-list");

  if (!box) return;

  if (!list.length) {
    box.innerHTML = `<div class="zx-empty">No matching batches found</div>`;
    return;
  }

  box.innerHTML = list
    .map(
      (batch) => `

        <div class="zx-row">

          <div>
            <div class="zx-row-title">${escapeHtml(batch.name)}</div>
            <div class="zx-row-sub">${escapeHtml(
              batch.sourceBatchId || batch.id
            )}</div>
          </div>

          <button class="zx-btn" onclick="content('${escapeAttr(batch.id)}')">
            Open →
          </button>

        </div>

      `
    )
    .join("");
}


/* =====================================================
   CONTENT
   ===================================================== */

async function content(batchId) {

  S.batch =
    S.batches.find((batch) => String(batch.id) === String(batchId)) || {
      id: batchId,
      name: "Selected Batch"
    };

  // Scoped token me source id batch ke sourceBatchId field me hota hai
  const srcId =
    S.scope === "batches" ? S.batch.sourceBatchId : S.batch.id;

  if (!srcId) {
    alert("Is batch ka sourceBatchId set nahi hai");
    return;
  }

  const endpoint =
    S.type === "dpp"
      ? `/api/admin/source/batches/${encodeURIComponent(srcId)}/dpps`
      : `/api/admin/source/batches/${encodeURIComponent(srcId)}/tests`;

  shell(
    S.batch.name,
    `
      <div class="zx-card">

        <div class="zx-actions">
          <button class="zx-btn secondary" onclick="batches('${S.type}')">
            ← Batches
          </button>
        </div>

        <input
          id="item-search"
          class="zx-search"
          placeholder="${S.type === "dpp" ? "Search DPP..." : "Search test..."}"
          autocomplete="off"
          oninput="filterContent()"
        >

        <div id="item-list" class="zx-list">
          <div class="zx-loading">Loading...</div>
        </div>

      </div>
    `
  );

  try {

    const data = await req(endpoint);

    const raw =
      data.items ||
      data.data?.items ||
      data.data?.tests ||
      data.data?.dpps ||
      data.data?.data ||
      data.data ||
      data.tests ||
      data.dpps ||
      [];

    S.sourceItems = Array.isArray(raw)
      ? raw.map(normalizeItem).filter((item) => item.id)
      : [];

    renderContent();

  } catch (error) {

    const box = $("#item-list");

    if (box) {
      box.innerHTML = `
        <div class="zx-empty">
          ${escapeHtml(error.message)}
          <br><br>
          <button class="zx-btn secondary" onclick="batches('${S.type}')">
            ← Back
          </button>
        </div>
      `;
    }
  }
}


/* =====================================================
   RENDER CONTENT
   ===================================================== */

function renderContent() {

  const box = $("#item-list");

  if (!box) return;

  drawContentList(S.sourceItems);
}


function filterContent() {

  const query = ($("#item-search")?.value || "").trim().toLowerCase();

  const list = S.sourceItems.filter((item) =>
    item.title.toLowerCase().includes(query)
  );

  drawContentList(list);
}


function drawContentList(list) {

  const box = $("#item-list");

  if (!box) return;

  if (!list.length) {
    box.innerHTML = `
      <div class="zx-empty">
        No ${S.type === "dpp" ? "DPPs" : "tests"} found
      </div>
    `;
    return;
  }

  box.innerHTML = list
    .map(
      (item) => `

        <div class="zx-row">

          <div>
            <div class="zx-row-title">${escapeHtml(item.title)}</div>
            <div class="zx-row-sub">ID: ${escapeHtml(item.id)}</div>
          </div>

          <button class="zx-btn"
            onclick="uploadSourceItem('${escapeAttr(item.id)}')">
            Upload
          </button>

        </div>

      `
    )
    .join("");
}


/* =====================================================
   UPLOAD
   ===================================================== */

async function uploadSourceItem(sourceId) {

  if (!S.batch?.id) {
    alert("Batch not selected");
    return;
  }

  const type = S.type === "dpp" ? "dpp" : "test";

  try {

    shell(
      "Uploading...",
      `
        <div class="zx-card">
          <div class="zx-loading">
            Fetching ${type === "dpp" ? "DPP" : "test"} questions...
          </div>
        </div>
      `
    );

    const detail = await req(
      `/api/admin/source/tests/${encodeURIComponent(sourceId)}`
    );

    const source = detail.data || detail;

    const questions = extractQuestions(source);

    const title = source.title || source.name || "Untitled";

    const payload = {
      title,
      instructions: source.instructions || source.description || "",
      startTime: source.startTime || source.startDate || null,
      questions,
      published: true
    };

    // Master token: source batch ke liye local batch banao/dhundo.
    // Scoped token: batch already local hai.
    let localId = S.batch.id;

    if (S.scope !== "batches") {
      const local = await req(
        `/api/admin/source/batches/${encodeURIComponent(S.batch.id)}/local`,
        {
          method: "POST",
          body: JSON.stringify({ name: S.batch.name })
        }
      );

      localId = local.batch._id;
    }

    const result = await req(
      `/api/admin/batches/${encodeURIComponent(localId)}/content/${type}`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    if (result.success === false) {
      throw new Error(result.message || "Upload failed");
    }

    alert(`${type === "dpp" ? "DPP" : "Test"} uploaded successfully`);

    await content(S.batch.id);

  } catch (error) {

    console.error("UPLOAD ERROR:", error);

    shell(
      S.batch?.name || "Upload",
      `
        <div class="zx-card">
          <div class="zx-empty">

            <div>Upload failed</div>

            <div style="margin-top:10px;color:#ff8498;">
              ${escapeHtml(error.message)}
            </div>

            <br>

            <button class="zx-btn secondary"
              onclick="content('${escapeAttr(S.batch.id)}')">
              ← Back
            </button>

          </div>
        </div>
      `
    );
  }
}


/* =====================================================
   NORMALIZERS
   ===================================================== */

function normalizeBatch(item) {

  const id = item._id || item.id || item.batchId || item.batch_id;

  const name =
    item.name || item.title || item.batchName || item.batch_name || "Unnamed Batch";

  return { ...item, id: String(id || ""), name: String(name) };
}


function normalizeItem(item) {

  const id =
    item._id ||
    item.id ||
    item.testId ||
    item.test_id ||
    item.dppId ||
    item.dpp_id;

  const title =
    item.title ||
    item.name ||
    item.testName ||
    item.test_name ||
    item.dppName ||
    item.dpp_name ||
    "Untitled";

  return { ...item, id: String(id || ""), title: String(title) };
}


/* =====================================================
   QUESTIONS
   ===================================================== */

function extractQuestions(source) {

  const candidates = [
    source.questions,
    source.questionList,
    source.question_list,
    source.data?.questions,
    source.data?.questionList,
    source.data?.question_list,
    source.test?.questions,
    source.test?.questionList,
    source.test?.question_list
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }

  return [];
}


/* =====================================================
   LOGOUT
   ===================================================== */

function logout() {

  localStorage.removeItem("zx_admin_token");
  localStorage.removeItem("zx_scope");

  S.token = "";
  S.scope = "all";
  S.batch = null;
  S.batches = [];
  S.sourceItems = [];

  showLogin();
}


/* =====================================================
   ESCAPE
   ===================================================== */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeAttr(value) {

  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}


/* =====================================================
   INITIALIZATION
   ===================================================== */

function initLogin() {

  if (S.token) {

    showApp();

    batches(S.type).catch((error) => {
      console.error("Auto login failed:", error);
      logout();
    });

  } else {

    showLogin();
  }
}


/* =====================================================
   START
   ===================================================== */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLogin);
} else {
  initLogin();
}


/* =====================================================
   GLOBAL FUNCTIONS
   ===================================================== */

window.doLogin = doLogin;
window.home = home;
window.batches = batches;
window.content = content;
window.filterBatches = filterBatches;
window.filterContent = filterContent;
window.uploadSourceItem = uploadSourceItem;
window.logout = logout;
