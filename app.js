const $ = s => document.querySelector(s);

const S = {
  token: localStorage.getItem("zx_admin_token") || "",
  type: "test",
  batch: null,
  batches: []
};

const API = () =>
  ((window.ZX_CONFIG && window.ZX_CONFIG.API_BASE) || "")
    .replace(/\/$/, "");


/* =====================================================
   API
   ===================================================== */

async function req(path, opt = {}) {

  const headers = {
    ...(opt.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(opt.headers || {})
  };

  if (S.token) {
    headers.Authorization = "Bearer " + S.token;
  }

  const r = await fetch(API() + path, {
    ...opt,
    headers
  });

  const d = await r.json().catch(() => ({}));

  if (r.status === 401) {
    localStorage.removeItem("zx_admin_token");
    S.token = "";
    showLogin();
    throw Error("Session expired. Login again.");
  }

  if (!r.ok) {
    throw Error(d.message || "Request failed");
  }

  return d;
}


/* =====================================================
   LOGIN SCREEN
   ===================================================== */

function showLogin() {

  const loginScreen = $("#login-screen");
  const app = $("#app");

  if (loginScreen) {
    loginScreen.style.display = "flex";
  }

  if (app) {
    app.style.display = "none";
    app.innerHTML = "";
  }

  const token = $("#auth-token");

  if (token) {
    token.value = "";
    token.focus();
  }

  const error = $("#login-error");

  if (error) {
    error.textContent = "";
  }

  const button = $("#login-button");

  if (button) {
    button.disabled = false;
    button.textContent = "Login";
  }
}


/* =====================================================
   HIDE LOGIN / SHOW APP
   ===================================================== */

function showApp() {

  const loginScreen = $("#login-screen");
  const app = $("#app");

  if (loginScreen) {
    loginScreen.style.display = "none";
  }

  if (app) {
    app.style.display = "block";
  }
}


/* =====================================================
   LOGIN
   ===================================================== */

async function doLogin(e) {

  if (e) {
    e.preventDefault();
  }

  const input = $("#auth-token");
  const error = $("#login-error");
  const button = $("#login-button");

  if (!input) {
    return;
  }

  const token = input.value.trim();

  if (!token) {
    if (error) {
      error.textContent = "Enter your auth token.";
    }
    return;
  }

  if (error) {
    error.textContent = "";
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Signing in...";
  }

  try {

    const r = await fetch(
      API() + "/api/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          authToken: token
        })
      }
    );

    const d = await r.json().catch(() => ({}));

    if (!r.ok) {
      throw Error(
        d.message || "Invalid auth token."
      );
    }

    /*
      Backend currently returns d.token.
    */

    S.token =
      d.token ||
      d.jwt ||
      "";

    if (!S.token) {
      throw Error(
        "Login response did not contain a token."
      );
    }

    localStorage.setItem(
      "zx_admin_token",
      S.token
    );

    showApp();

    await home();

  } catch (e) {

    console.error(e);

    if (error) {
      error.textContent =
        e.message || "Login failed.";
    }

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Login";
    }
  }
}


/* =====================================================
   SHELL
   ===================================================== */

function shell(title, body) {

  showApp();

  const app = $("#app");

  if (!app) {
    return;
  }

  app.innerHTML = `

    <div class="panel-shell">

      <div class="panel-header">

        <div>
          <div class="panel-brand">
            Batch Uploader
          </div>

          <div class="panel-title">
            ${esc(title)}
          </div>
        </div>

        <button
          class="btn red"
          onclick="logout()"
        >
          Logout
        </button>

      </div>

      <div class="panel-content">

        ${body}

      </div>

    </div>
  `;

  addPanelStyles();
}


/* =====================================================
   PANEL STYLES
   ===================================================== */

function addPanelStyles() {

  if ($("#zx-panel-style")) {
    return;
  }

  const style =
    document.createElement("style");

  style.id = "zx-panel-style";

  style.textContent = `

    #app {
      min-height:100vh;
      color:#e5e7eb;
      background:
        radial-gradient(
          circle at 10% 0%,
          rgba(79,70,229,.14),
          transparent 30%
        ),
        #070b16;
    }

    .panel-shell {
      min-height:100vh;
    }

    .panel-header {
      min-height:76px;
      padding:0 28px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      border-bottom:1px solid rgba(255,255,255,.08);
      background:rgba(15,23,42,.82);
      backdrop-filter:blur(18px);
    }

    .panel-brand {
      color:#94a3b8;
      font-size:12px;
      font-weight:600;
      margin-bottom:4px;
    }

    .panel-title {
      color:#fff;
      font-size:20px;
      font-weight:750;
    }

    .panel-content {
      max-width:1150px;
      margin:auto;
      padding:28px;
    }

    .hero {
      padding:28px;
      margin-bottom:22px;
      border:1px solid rgba(255,255,255,.08);
      border-radius:18px;
      background:
        linear-gradient(
          135deg,
          rgba(79,70,229,.18),
          rgba(124,58,237,.08)
        );
      box-shadow:0 20px 50px rgba(0,0,0,.2);
    }

    .hero h1 {
      margin:0 0 8px;
      font-size:30px;
      line-height:1.15;
      color:#fff;
    }

    .hero p {
      margin:0;
      color:#94a3b8;
    }

    .scope {
      margin-top:18px;
      color:#a5b4fc;
      font-size:13px;
    }

    .stats {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:14px;
      margin-bottom:22px;
    }

    .stat {
      padding:19px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.07);
      background:rgba(15,23,42,.72);
      color:#94a3b8;
      font-size:13px;
    }

    .stat b {
      display:block;
      margin-top:6px;
      color:#fff;
      font-size:25px;
    }

    .tiles {
      display:grid;
      grid-template-columns:repeat(2,1fr);
      gap:18px;
    }

    .tile {
      padding:28px;
      border-radius:18px;
      border:1px solid rgba(255,255,255,.08);
      cursor:pointer;
      transition:.2s;
      background:#111827;
    }

    .tile:hover {
      transform:translateY(-3px);
      border-color:rgba(99,102,241,.5);
      box-shadow:0 18px 40px rgba(0,0,0,.22);
    }

    .tile h2 {
      margin:14px 0 7px;
      color:#fff;
    }

    .tile p {
      margin:0;
      color:#94a3b8;
    }

    .icon {
      font-size:30px;
    }

    .blue {
      background:
        linear-gradient(
          135deg,
          rgba(37,99,235,.17),
          rgba(15,23,42,.85)
        );
    }

    .green {
      background:
        linear-gradient(
          135deg,
          rgba(16,185,129,.14),
          rgba(15,23,42,.85)
        );
    }

    .bar {
      margin:20px 0;
    }

    .bar input {
      width:100%;
      height:46px;
      padding:0 14px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.1);
      outline:none;
      background:#0f172a;
      color:#fff;
    }

    .row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:15px;
      padding:18px;
      margin-bottom:10px;
      border:1px solid rgba(255,255,255,.07);
      border-radius:13px;
      background:rgba(15,23,42,.75);
    }

    .row b {
      color:#fff;
      display:block;
      margin-bottom:5px;
    }

    .row small {
      color:#64748b;
    }

    .actions {
      display:flex;
      gap:8px;
    }

    .btn {
      border:0;
      border-radius:8px;
      padding:10px 15px;
      color:#fff;
      background:#4f46e5;
      cursor:pointer;
      font-weight:600;
    }

    .btn:hover {
      filter:brightness(1.1);
    }

    .btn.green {
      background:#059669;
    }

    .btn.red {
      background:#dc2626;
    }

    .btn.gray {
      background:#334155;
    }

    .btn.full {
      width:100%;
    }

    .card {
      padding:22px;
      margin-top:18px;
      border-radius:15px;
      border:1px solid rgba(255,255,255,.07);
      background:#0f172a;
    }

    .notice {
      margin:14px 0;
      padding:12px;
      border-radius:8px;
      color:#a5b4fc;
      background:rgba(79,70,229,.10);
    }

    .admin-tools {
      display:flex;
      gap:10px;
      margin-bottom:20px;
    }

    .muted {
      color:#94a3b8;
      font-size:13px;
    }

    @media(max-width:750px) {

      .stats {
        grid-template-columns:repeat(2,1fr);
      }

      .tiles {
        grid-template-columns:1fr;
      }

      .panel-header {
        padding:0 16px;
      }

      .panel-content {
        padding:18px;
      }
    }

    @media(max-width:500px) {

      .stats {
        grid-template-columns:1fr 1fr;
      }

      .row {
        align-items:flex-start;
        flex-direction:column;
      }

      .actions {
        width:100%;
      }

      .actions .btn {
        width:100%;
      }

      .admin-tools {
        flex-direction:column;
      }
    }

  `;

  document.head.appendChild(style);
}


/* =====================================================
   HOME
   ===================================================== */

async function home() {

  try {

    const [s, me] =
      await Promise.all([
        req("/api/admin/stats"),
        req("/api/admin/me")
      ]);

    const user =
      me.user || {};

    const isMaster =
      user.scope === "all";

    shell(
      "Dashboard",

      `

      <div class="hero">

        <h1>
          Test Series Uploader
        </h1>

        <p>
          Upload and manage your test series content
        </p>

        <div class="scope">
          🔐 ${esc(user.username || "Uploader")}
          •
          ${
            isMaster
              ? "All batches"
              : "Assigned batches only"
          }
        </div>

      </div>

      ${
        isMaster
          ? `
            <div class="admin-tools">

              <button
                class="btn gray"
                onclick="manageBatches()"
              >
                Manage Batches
              </button>

              <button
                class="btn gray"
                onclick="manageTokens()"
              >
                Uploader Tokens
              </button>

            </div>
          `
          : ""
      }

      <div class="stats">

        <div class="stat">
          Batches
          <b>${s.batches || 0}</b>
        </div>

        <div class="stat">
          Tests
          <b>${s.tests || 0}</b>
        </div>

        <div class="stat">
          DPPs
          <b>${s.dpps || 0}</b>
        </div>

        <div class="stat">
          Published
          <b>${s.published || 0}</b>
        </div>

      </div>

      <div class="tiles">

        <div
          class="tile blue"
          onclick="batches('test')"
        >
          <div class="icon">📄</div>

          <h2>Tests</h2>

          <p>
            View your batches and upload tests
          </p>
        </div>

        <div
          class="tile green"
          onclick="batches('dpp')"
        >
          <div class="icon">📚</div>

          <h2>DPPs</h2>

          <p>
            View your batches and upload DPPs
          </p>
        </div>

      </div>
      `
    );

  } catch (e) {

    console.error(e);

    if (
      String(e.message)
        .toLowerCase()
        .includes("session")
    ) {
      logout();
    } else {
      alert(e.message || "Dashboard failed to load");
    }
  }
}


/* =====================================================
   SOURCE BATCHES
   ===================================================== */

async function batches(type) {

  try {

    S.type = type;

    const data =
      await req(
        "/api/admin/source/batches"
      );

    S.batches =
      normalizeBatches(data);

    shell(
      type === "test"
        ? "Your Test Batches"
        : "Your DPP Batches",

      `

      <button
        class="btn gray"
        onclick="home()"
      >
        ← Back
      </button>

      <div class="bar">

        <input
          id="search"
          placeholder="Search batches..."
          oninput="drawBatches()"
        >

      </div>

      <div id="list"></div>

      `
    );

    drawBatches();

  } catch (e) {

    console.error(e);

    alert(
      e.message ||
      "Failed to load batches"
    );
  }
}


/* =====================================================
   NORMALIZE BATCHES
   ===================================================== */

function normalizeBatches(data) {

  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.batches)) {
    list = data.batches;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  } else if (
    data.data &&
    Array.isArray(data.data.batches)
  ) {
    list = data.data.batches;
  } else if (
    data.data &&
    Array.isArray(data.data.data)
  ) {
    list = data.data.data;
  }

  return list
    .map((b, index) => {

      const id =
        b._id ||
        b.id ||
        b.batchId;

      const name =
        b.name ||
        b.batchName ||
        b.title ||
        `Batch ${index + 1}`;

      return {
        ...b,
        _id: String(id || ""),
        name: String(name)
      };
    })
    .filter(b => b._id);
}


/* =====================================================
   DRAW BATCHES
   ===================================================== */

function drawBatches() {

  const q =
    ($("#search")?.value || "")
      .toLowerCase()
      .trim();

  const list =
    S.batches.filter(b =>
      (b.name || "")
        .toLowerCase()
        .includes(q)
    );

  const el = $("#list");

  if (!el) {
    return;
  }

  el.innerHTML =
    list.map(b => `

      <div class="row">

        <div>
          <b>${esc(b.name)}</b>

          <small>
            ${esc(
              b.language ||
              b.status ||
              ""
            )}
          </small>
        </div>

        <div class="actions">

          <button
            class="btn"
            onclick="content('${escAttr(b._id)}')"
          >
            View ${
              S.type === "test"
                ? "Tests"
                : "DPPs"
            }
          </button>

        </div>

      </div>

    `).join("");

  if (!list.length) {
    el.innerHTML =
      "<p class='muted'>No batches found.</p>";
  }
}


/* =====================================================
   CONTENT
   ===================================================== */

async function content(sourceBatchId) {

  try {

    S.batch =
      S.batches.find(
        b =>
          String(b._id) ===
          String(sourceBatchId)
      );

    if (!S.batch) {
      throw Error("Batch not found");
    }

    const endpoint =
      S.type === "test"
        ? `/api/admin/source/batches/${encodeURIComponent(sourceBatchId)}/tests`
        : `/api/admin/source/batches/${encodeURIComponent(sourceBatchId)}/dpps`;

    const data =
      await req(endpoint);

    const items =
      normalizeItems(data);

    shell(
      S.type === "test"
        ? "Available Tests"
        : "Available DPPs",

      `

      <button
        class="btn gray"
        onclick="batches('${S.type}')"
      >
        ← Back to Batches
      </button>

      <div class="card">

        <b>
          ${esc(S.batch.name)}
        </b>

        <div class="notice">
          Available: ${items.length}
        </div>

        <div id="items">

          ${
            items.length
              ? items.map(itemRow).join("")
              : "<p class='muted'>No content available.</p>"
          }

        </div>

      </div>

      `
    );

  } catch (e) {

    console.error(e);

    alert(
      e.message ||
      "Failed to load content"
    );
  }
}


/* =====================================================
   NORMALIZE ITEMS
   ===================================================== */

function normalizeItems(data) {

  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.items)) {
    list = data.items;
  } else if (Array.isArray(data.tests)) {
    list = data.tests;
  } else if (Array.isArray(data.dpps)) {
    list = data.dpps;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  } else if (
    data.data &&
    Array.isArray(data.data.items)
  ) {
    list = data.data.items;
  } else if (
    data.data &&
    Array.isArray(data.data.tests)
  ) {
    list = data.data.tests;
  } else if (
    data.data &&
    Array.isArray(data.data.dpps)
  ) {
    list = data.data.dpps;
  }

  return list
    .map((x, index) => ({
      ...x,

      _sourceId: String(
        x._id ||
        x.id ||
        x.testId ||
        x.dppId ||
        ""
      ),

      _title: String(
        x.title ||
        x.name ||
        x.testName ||
        x.dppName ||
        `Item ${index + 1}`
      )
    }))
    .filter(x => x._sourceId);
}


/* =====================================================
   ITEM ROW
   ===================================================== */

function itemRow(x) {

  const count =
    x.totalQuestions ||
    x.questionCount ||
    (
      Array.isArray(x.questions)
        ? x.questions.length
        : 0
    ) ||
    0;

  return `

    <div class="row">

      <div>

        <b>
          ${esc(x._title)}
        </b>

        <small>
          ${count} Questions
        </small>

      </div>

      <div class="actions">

        <button
          class="btn green"
          onclick="uploadSourceItem('${escAttr(x._sourceId)}')"
        >
          Upload
        </button>

      </div>

    </div>

  `;
}


/* =====================================================
   SOURCE ITEM UPLOAD
   ===================================================== */

async function uploadSourceItem(sourceId) {

  try {

    if (!sourceId) {
      throw Error("Invalid source item ID");
    }

    const data =
      await req(
        `/api/admin/source/tests/${encodeURIComponent(sourceId)}`
      );

    const item =
      extractDetails(data);

    if (!item) {
      throw Error("Test details not found");
    }

    const questions =
      extractQuestions(item);

    if (!Array.isArray(questions)) {
      throw Error(
        "Questions were not found in source response"
      );
    }

    const title =
      item.title ||
      item.name ||
      item.testName ||
      item.dppName ||
      "Imported Test";

    await req(
      `/api/admin/batches/${encodeURIComponent(
        S.batch._id
      )}/content/${S.type}`,
      {
        method: "POST",

        body: JSON.stringify({
          title,

          startTime:
            item.startTime ||
            item.startDate ||
            null,

          instructions:
            item.instructions ||
            "",

          questions,

          published: true
        })
      }
    );

    alert("Uploaded successfully");

    await content(S.batch._id);

  } catch (e) {

    console.error(e);

    alert(
      e.message ||
      "Upload failed"
    );
  }
}


/* =====================================================
   DETAILS
   ===================================================== */

function extractDetails(data) {

  if (
    data &&
    data.data &&
    !Array.isArray(data.data)
  ) {

    if (data.data.test) {
      return data.data.test;
    }

    if (data.data.dpp) {
      return data.data.dpp;
    }

    return data.data;
  }

  if (data && data.test) {
    return data.test;
  }

  if (data && data.dpp) {
    return data.dpp;
  }

  return data;
}


/* =====================================================
   QUESTIONS
   ===================================================== */

function extractQuestions(item) {

  if (Array.isArray(item.questions)) {
    return item.questions;
  }

  if (
    item.data &&
    Array.isArray(item.data.questions)
  ) {
    return item.data.questions;
  }

  if (
    item.test &&
    Array.isArray(item.test.questions)
  ) {
    return item.test.questions;
  }

  if (
    item.dpp &&
    Array.isArray(item.dpp.questions)
  ) {
    return item.dpp.questions;
  }

  return [];
}


/* =====================================================
   LOCAL BATCH MANAGEMENT
   ===================================================== */

async function manageBatches() {

  try {

    const data =
      await req("/api/admin/batches");

    const localBatches =
      data.batches || [];

    modal(`

      <h3>Local Batches</h3>

      <button
        class="btn green full"
        onclick="newBatch()"
      >
        + Create Batch
      </button>

      <div style="margin-top:15px">

        ${
          localBatches.length
            ? localBatches.map(b => `
                <div class="row">

                  <div>
                    <b>${esc(b.name)}</b>
                    <small>
                      ${esc(b.category || "")}
                    </small>
                  </div>

                </div>
              `).join("")
            : "<p class='muted'>No local batches.</p>"
        }

      </div>
    `);

  } catch (e) {
    alert(e.message);
  }
}


function newBatch() {

  modal(`

    <h3>Create Local Batch</h3>

    <label class="label">
      Batch Name
    </label>

    <input id="bn">

    <label class="label">
      Category
    </label>

    <select id="bc">
      <option>Boards Level Tests</option>
      <option>JEE Tests</option>
      <option>NEET Tests</option>
      <option>DROPPER Tests</option>
      <option>Other Batch Tests</option>
    </select>

    <label class="label">
      Subgroup
    </label>

    <input id="bs">

    <label class="label">
      Language
    </label>

    <select id="bl">
      <option>Hindi</option>
      <option>English</option>
      <option>Hinglish</option>
    </select>

    <label class="label">
      Status
    </label>

    <select id="bt">
      <option>Paid</option>
      <option>Unpaid</option>
    </select>

    <button
      class="btn green full"
      onclick="saveBatch()"
    >
      Create Batch
    </button>

  `);
}


async function saveBatch() {

  try {

    await req(
      "/api/admin/batches",
      {
        method: "POST",

        body: JSON.stringify({

          name: $("#bn").value,

          category: $("#bc").value,

          subgroup: $("#bs").value,

          language: $("#bl").value,

          status: $("#bt").value

        })
      }
    );

    alert("Batch created");

    closeModal();

    await manageBatches();

  } catch (e) {

    alert(e.message);
  }
}


/* =====================================================
   TOKEN MANAGEMENT
   ===================================================== */

async function manageTokens() {

  try {

    const [bs, ts] =
      await Promise.all([
        req("/api/admin/batches"),
        req("/api/admin/uploader-tokens")
      ]);

    const localBatches =
      bs.batches || [];

    const tokens =
      ts.tokens || [];

    const list =
      tokens.map(t => `

        <div class="row">

          <div>

            <b>
              ${esc(t.name)}
            </b>

            <small>

              ${
                (t.batches || []).length
              }

              assigned batch(es)

            </small>

          </div>

        </div>

      `).join("");

    modal(`

      <h3>
        Create Scoped Uploader Token
      </h3>

      <p class="muted">
        This token will show only the assigned batches.
      </p>

      <label class="label">
        Token Name
      </label>

      <input
        id="tn"
        placeholder="NEET Uploader"
      >

      <label class="label">
        Batches
      </label>

      <select
        id="tb"
        multiple
        size="8"
      >

        ${
          localBatches.map(b => `

            <option
              value="${escAttr(b._id)}"
            >
              ${esc(b.name)}
            </option>

          `).join("")
        }

      </select>

      <button
        class="btn green full"
        onclick="createToken()"
      >
        Create Token
      </button>

      <hr>

      <h3>Existing Tokens</h3>

      ${
        list ||
        "<p class='muted'>No scoped tokens yet.</p>"
      }

    `);

  } catch (e) {

    alert(e.message);
  }
}


async function createToken() {

  try {

    const ids =
      Array.from(
        $("#tb").selectedOptions
      ).map(o => o.value);

    if (!ids.length) {
      throw Error(
        "Select at least one batch"
      );
    }

    const d =
      await req(
        "/api/admin/uploader-tokens",
        {
          method: "POST",

          body: JSON.stringify({

            name:
              $("#tn").value ||
              "Batch Uploader",

            batchIds: ids

          })
        }
      );

    alert(
      "Token created.\n\n" +
      d.token +
      "\n\nSave it now."
    );

    closeModal();

  } catch (e) {

    alert(e.message);
  }
}


/* =====================================================
   MANUAL IMPORT
   ===================================================== */

function newContent() {

  modal(`

    <h3>
      Import ${
        S.type === "test"
          ? "Test"
          : "DPP"
      }
    </h3>

    <p class="muted">
      Select a prepared JSON file.
    </p>

    <label class="label">
      Title
    </label>

    <input
      id="ct"
      placeholder="Practice Test-01"
    >

    <label class="label">
      Start Time
    </label>

    <input
      id="cs"
      type="datetime-local"
    >

    <label class="label">
      Instructions
    </label>

    <textarea id="ci"></textarea>

    <label class="label">
      Questions JSON file
    </label>

    <input
      id="cf"
      type="file"
      accept="application/json,.json"
    >

    <button
      class="btn green full"
      onclick="saveContent()"
    >
      Import & Upload
    </button>

  `);
}


async function saveContent() {

  try {

    const f =
      $("#cf").files[0];

    if (!f) {
      throw Error(
        "Select a JSON file"
      );
    }

    const questions =
      JSON.parse(
        await f.text()
      );

    if (!Array.isArray(questions)) {
      throw Error(
        "JSON must contain an array of questions"
      );
    }

    await req(
      `/api/admin/batches/${S.batch._id}/content/${S.type}`,
      {
        method: "POST",

        body: JSON.stringify({

          title:
            $("#ct").value,

          startTime:
            $("#cs").value || null,

          instructions:
            $("#ci").value,

          questions,

          published: true

        })
      }
    );

    alert("Imported successfully");

    closeModal();

    await content(S.batch._id);

  } catch (e) {

    alert(e.message);
  }
}


/* =====================================================
   PUBLISH
   ===================================================== */

async function publish(id) {

  try {

    await req(
      "/api/admin/content/" +
      id +
      "/publish",
      {
        method: "POST"
      }
    );

    await content(S.batch._id);

  } catch (e) {

    alert(e.message);
  }
}


/* =====================================================
   MODAL
   ===================================================== */

function modal(html) {

  closeModal();

  const m =
    document.createElement("div");

  m.id = "modal";

  m.style.cssText = `
    position:fixed;
    inset:0;
    z-index:9999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    background:rgba(0,0,0,.65);
    backdrop-filter:blur(8px);
    overflow:auto;
  `;

  m.innerHTML = `

    <div
      class="card"
      style="
        width:100%;
        max-width:600px;
        max-height:90vh;
        overflow:auto;
        background:#0f172a;
      "
    >

      <div style="text-align:right">

        <button
          class="btn gray"
          onclick="closeModal()"
        >
          Close
        </button>

      </div>

      ${html}

    </div>

  `;

  document.body.appendChild(m);
}


function closeModal() {

  $("#modal")?.remove();

}


/* =====================================================
   LOGOUT
   ===================================================== */

function logout() {

  localStorage.removeItem(
    "zx_admin_token"
  );

  S.token = "";

  showLogin();
}


/* =====================================================
   ESCAPE
   ===================================================== */

function esc(v) {

  return String(v ?? "")
    .replace(
      /[&<>\"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[m])
    );
}


function escAttr(v) {

  return String(v ?? "")
    .replace(
      /['\\]/g,
      m => "\\" + m
    );
}


/* =====================================================
   GLOBALS
   ===================================================== */

Object.assign(window, {

  doLogin,
  home,
  logout,
  batches,
  drawBatches,
  manageBatches,
  newBatch,
  saveBatch,
  manageTokens,
  createToken,
  content,
  uploadSourceItem,
  newContent,
  saveContent,
  publish,
  modal,
  closeModal

});


/* =====================================================
   LOGIN FORM
   ===================================================== */

const loginForm =
  $("#login-form");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    doLogin
  );
}


/* =====================================================
   START
   ===================================================== */

if (S.token) {

  showApp();

  home();

} else {

  showLogin();

}
