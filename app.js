const $ = (s) => document.querySelector(s);

const S = {
  token: localStorage.getItem("zx_admin_token") || "",
  type: "test",
  batch: null,
  batches: [],
  sourceItems: []
};

function API() {
  return (
    (window.ZX_CONFIG && window.ZX_CONFIG.API_BASE) || ""
  ).replace(/\/$/, "");
}


/* =====================================================
   API REQUEST
   ===================================================== */

async function req(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (S.token) {
    headers.Authorization = `Bearer ${S.token}`;
  }

  const response = await fetch(`${API()}${path}`, {
    ...options,
    headers
  });

  let data = {};

  try {
    data = await response.json();
  } catch (_) {}

  if (response.status === 401) {
    localStorage.removeItem("zx_admin_token");
    S.token = "";
    showLogin();

    throw new Error(
      data.message || "Session expired. Please sign in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}


/* =====================================================
   LOGIN SCREEN
   ===================================================== */

function showLogin() {
  const login = $("#login-screen");
  const app = $("#app");

  if (login) {
    login.style.display = "flex";
  }

  if (app) {
    app.style.display = "none";
  }

  const input = $("#auth-token");

  if (input) {
    input.value = "";
  }

  const error = $("#login-error");

  if (error) {
    error.textContent = "";
  }
}


function showApp() {
  const login = $("#login-screen");
  const app = $("#app");

  if (login) {
    login.style.display = "none";
  }

  if (app) {
    app.style.display = "block";
  }
}


/* =====================================================
   LOGIN
   ===================================================== */

async function doLogin(e) {
  e.preventDefault();

  const input = $("#auth-token");
  const error = $("#login-error");
  const button = $("#login-button");

  const authToken =
    input ? input.value.trim() : "";

  if (!authToken) {
    if (error) {
      error.textContent = "Auth Token required";
    }

    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Signing in...";
  }

  if (error) {
    error.textContent = "";
  }

  try {
    console.log(
      "Login URL:",
      `${API()}/api/auth/login`
    );

    const data = await req(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          authToken
        })
      }
    );

    console.log("Login response:", data);

    if (!data.token) {
      throw new Error(
        data.message || "Token was not returned by server"
      );
    }

    S.token = data.token;

    localStorage.setItem(
      "zx_admin_token",
      data.token
    );

    showApp();

    await home();

  } catch (err) {
    console.error(
      "LOGIN ERROR:",
      err
    );

    if (error) {
      error.textContent =
        err.message || "Sign in failed";
    }

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Sign In";
    }
  }
}


/* =====================================================
   PANEL STYLES
   ===================================================== */

function addPanelStyles() {
  if ($("#zx-panel-styles")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "zx-panel-styles";

  style.textContent = `
    #app {
      min-height: 100vh;
      box-sizing: border-box;
      padding: 24px;
      color: #fff;
      background:
        radial-gradient(
          circle at top right,
          rgba(90,80,255,.20),
          transparent 35%
        ),
        #080a12;
      font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    .zx-wrap {
      width: min(1150px, 100%);
      margin: 0 auto;
    }

    .zx-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .zx-title {
      font-size: 25px;
      font-weight: 800;
      letter-spacing: -.5px;
    }

    .zx-sub {
      margin-top: 5px;
      color: #8f96a8;
      font-size: 13px;
    }

    .zx-card {
      background: rgba(20,23,35,.88);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 18px 60px rgba(0,0,0,.28);
    }

    .zx-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit,minmax(210px,1fr));
      gap: 16px;
    }

    .zx-stat {
      padding: 22px;
      border-radius: 16px;
      background: #111522;
      border: 1px solid rgba(255,255,255,.07);
      cursor: pointer;
      transition: .18s;
    }

    .zx-stat:hover {
      transform: translateY(-2px);
      border-color: rgba(120,110,255,.45);
    }

    .zx-stat-number {
      font-size: 30px;
      font-weight: 800;
      margin-top: 8px;
    }

    .zx-muted {
      color: #8f96a8;
    }

    .zx-btn {
      border: 0;
      border-radius: 11px;
      padding: 11px 16px;
      cursor: pointer;
      color: #fff;
      background: #635bff;
      font-weight: 700;
    }

    .zx-btn:hover {
      filter: brightness(1.1);
    }

    .zx-btn.secondary {
      background: #202536;
    }

    .zx-btn.danger {
      background: #9d3347;
    }

    .zx-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-bottom: 18px;
    }

    .zx-list {
      display: grid;
      gap: 10px;
    }

    .zx-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      padding: 15px;
      border-radius: 13px;
      background: #111522;
      border: 1px solid rgba(255,255,255,.06);
    }

    .zx-row-title {
      font-weight: 700;
    }

    .zx-row-sub {
      margin-top: 4px;
      color: #858da0;
      font-size: 12px;
    }

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

    .zx-empty {
      text-align: center;
      padding: 40px 20px;
      color: #858da0;
    }

    .zx-loading {
      text-align: center;
      padding: 45px;
      color: #9aa1b3;
    }

    @media(max-width:650px) {
      #app {
        padding: 14px;
      }

      .zx-top {
        align-items: flex-start;
        flex-direction: column;
      }

      .zx-row {
        align-items: flex-start;
        flex-direction: column;
      }
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

  if (!app) {
    throw new Error("#app not found in index.html");
  }

  app.innerHTML = `
    <div class="zx-wrap">

      <div class="zx-top">

        <div>
          <div class="zx-title">${escapeHtml(title)}</div>
          <div class="zx-sub">
            Batch Uploader Panel
          </div>
        </div>

        <button
          class="zx-btn secondary"
          onclick="logout()"
        >
          Logout
        </button>

      </div>

      ${body}

    </div>
  `;

  app.style.display = "block";
}


/* =====================================================
   DASHBOARD
   ===================================================== */

async function home() {
  showApp();

  shell(
    "Batch Uploader",
    `
      <div class="zx-loading">
        Loading dashboard...
      </div>
    `
  );

  try {
    const [stats, me] = await Promise.all([
      req("/api/admin/stats"),
      req("/api/admin/me")
    ]);

    shell(
      "Batch Uploader",
      `
        <div class="zx-card">

          <div class="zx-actions">
            <button
              class="zx-btn"
              onclick="batches('test')"
            >
              Tests
            </button>

            <button
              class="zx-btn secondary"
              onclick="batches('dpp')"
            >
              DPPs
            </button>
          </div>

          <div class="zx-grid">

            <div
              class="zx-stat"
              onclick="batches('test')"
            >
              <div class="zx-muted">
                Tests
              </div>

              <div class="zx-stat-number">
                ${Number(stats.tests || 0)}
              </div>
            </div>

            <div
              class="zx-stat"
              onclick="batches('dpp')"
            >
              <div class="zx-muted">
                DPPs
              </div>

              <div class="zx-stat-number">
                ${Number(stats.dpps || 0)}
              </div>
            </div>

            <div class="zx-stat">
              <div class="zx-muted">
                Published
              </div>

              <div class="zx-stat-number">
                ${Number(stats.published || 0)}
              </div>
            </div>

            <div class="zx-stat">
              <div class="zx-muted">
                Access
              </div>

              <div class="zx-stat-number"
                   style="font-size:20px">
                ${escapeHtml(
                  me.user?.scope === "all"
                    ? "All Batches"
                    : "Assigned"
                )}
              </div>
            </div>

          </div>

        </div>
      `
    );

  } catch (err) {
    shell(
      "Batch Uploader",
      `
        <div class="zx-card">
          <div class="zx-empty">
            <div>
              ${escapeHtml(err.message)}
            </div>

            <br>

            <button
              class="zx-btn"
              onclick="home()"
            >
              Retry
            </button>
          </div>
        </div>
      `
    );
  }
}


/* =====================================================
   SOURCE BATCHES
   ===================================================== */

async function batches(type) {
  S.type = type === "dpp" ? "dpp" : "test";

  shell(
    S.type === "test"
      ? "Select Batch"
      : "Select Batch • DPP",
    `
      <div class="zx-card">
        <div class="zx-loading">
          Loading batches...
        </div>
      </div>
    `
  );

  try {
    const data =
      await req(
        "/api/admin/source/batches"
      );

    const raw =
      data.data?.batches ||
      data.data?.items ||
      data.data?.data ||
      data.data ||
      [];

    S.batches =
      Array.isArray(raw)
        ? raw.map(normalizeBatch)
        : [];

    renderBatches();

  } catch (err) {
    shell(
      "Select Batch",
      `
        <div class="zx-card">
          <div class="zx-empty">
            ${escapeHtml(err.message)}

            <br><br>

            <button
              class="zx-btn"
              onclick="batches('${S.type}')"
            >
              Retry
            </button>
          </div>
        </div>
      `
    );
  }
}


function renderBatches() {
  shell(
    S.type === "test"
      ? "Select Batch"
      : "Select Batch • DPP",
    `
      <div class="zx-card">

        <div class="zx-actions">
          <button
            class="zx-btn secondary"
            onclick="home()"
          >
            ← Dashboard
          </button>

          <button
            class="zx-btn ${S.type === "test" ? "" : "secondary"}"
            onclick="batches('test')"
          >
            Tests
          </button>

          <button
            class="zx-btn ${S.type === "dpp" ? "" : "secondary"}"
            onclick="batches('dpp')"
          >
            DPPs
          </button>
        </div>

        <input
          id="batch-search"
          class="zx-search"
          placeholder="Search batch..."
          oninput="filterBatches()"
        >

        <div
          id="batch-list"
          class="zx-list"
        ></div>

      </div>
    `
  );

  drawBatchList(S.batches);
}


function filterBatches() {
  const q =
    ($("#batch-search")?.value || "")
      .trim()
      .toLowerCase();

  const list =
    S.batches.filter(
      b =>
        b.name
          .toLowerCase()
          .includes(q)
    );

  drawBatchList(list);
}


function drawBatchList(list) {
  const box = $("#batch-list");

  if (!box) {
    return;
  }

  if (!list.length) {
    box.innerHTML = `
      <div class="zx-empty">
        No batches found
      </div>
    `;

    return;
  }

  box.innerHTML =
    list.map(
      b => `
        <div class="zx-row">

          <div>
            <div class="zx-row-title">
              ${escapeHtml(b.name)}
            </div>

            <div class="zx-row-sub">
              ${escapeHtml(
                b.id
                  ? `Batch ID: ${b.id}`
                  : ""
              )}
            </div>
          </div>

          <button
            class="zx-btn"
            onclick="content('${escapeAttr(b.id)}')"
          >
            Open
          </button>

        </div>
      `
    ).join("");
}


/* =====================================================
   TESTS / DPPS
   ===================================================== */

async function content(sourceBatchId) {
  S.batch = S.batches.find(
    b => String(b.id) === String(sourceBatchId)
  ) || {
    id: sourceBatchId,
    name: "Selected Batch"
  };

  const endpoint =
    S.type === "dpp"
      ? `/api/admin/source/batches/${encodeURIComponent(
          sourceBatchId
        )}/dpps`
      : `/api/admin/source/batches/${encodeURIComponent(
          sourceBatchId
        )}/tests`;

  shell(
    S.batch.name,
    `
      <div class="zx-card">
        <div class="zx-loading">
          Loading ${S.type === "dpp" ? "DPPs" : "Tests"}...
        </div>
      </div>
    `
  );

  try {
    const data = await req(endpoint);

    const raw =
      data.data?.items ||
      data.data?.tests ||
      data.data?.dpps ||
      data.data?.data ||
      data.data ||
      [];

    S.sourceItems =
      Array.isArray(raw)
        ? raw.map(normalizeItem)
        : [];

    renderContent();

  } catch (err) {
    shell(
      S.batch.name,
      `
        <div class="zx-card">

          <div class="zx-actions">
            <button
              class="zx-btn secondary"
              onclick="batches('${S.type}')"
            >
              ← Back
            </button>
          </div>

          <div class="zx-empty">
            ${escapeHtml(err.message)}
          </div>

        </div>
      `
    );
  }
}


function renderContent() {
  shell(
    S.batch?.name || "Content",
    `
      <div class="zx-card">

        <div class="zx-actions">
          <button
            class="zx-btn secondary"
            onclick="batches('${S.type}')"
          >
            ← Batches
          </button>
        </div>

        <input
          id="item-search"
          class="zx-search"
          placeholder="Search ${S.type === "dpp" ? "DPP" : "test"}..."
          oninput="filterContent()"
        >

        <div
          id="item-list"
          class="zx-list"
        ></div>

      </div>
    `
  );

  drawContentList(S.sourceItems);
}


function filterContent() {
  const q =
    ($("#item-search")?.value || "")
      .trim()
      .toLowerCase();

  const list =
    S.sourceItems.filter(
      item =>
        item.title
          .toLowerCase()
          .includes(q)
    );

  drawContentList(list);
}


function drawContentList(list) {
  const box = $("#item-list");

  if (!box) {
    return;
  }

  if (!list.length) {
    box.innerHTML = `
      <div class="zx-empty">
        No ${S.type === "dpp" ? "DPPs" : "tests"} found
      </div>
    `;

    return;
  }

  box.innerHTML =
    list.map(
      item => `
        <div class="zx-row">

          <div>
            <div class="zx-row-title">
              ${escapeHtml(item.title)}
            </div>

            <div class="zx-row-sub">
              ${escapeHtml(
                item.id
                  ? `ID: ${item.id}`
                  : ""
              )}
            </div>
          </div>

          <button
            class="zx-btn"
            onclick="uploadSourceItem('${escapeAttr(item.id)}')"
          >
            Upload
          </button>

        </div>
      `
    ).join("");
}


/* =====================================================
   SOURCE ITEM UPLOAD
   ===================================================== */

async function uploadSourceItem(sourceId) {
  if (!S.batch?.id) {
    alert("Batch not selected");
    return;
  }

  const type =
    S.type === "dpp"
      ? "dpp"
      : "test";

  try {
    shell(
      "Uploading...",
      `
        <div class="zx-card">
          <div class="zx-loading">
            Fetching questions...
          </div>
        </div>
      `
    );

    const detail =
      await req(
        `/api/admin/source/tests/${encodeURIComponent(
          sourceId
        )}`
      );

    const source =
      detail.data || detail;

    const questions =
      extractQuestions(source);

    const title =
      source.title ||
      source.name ||
      "Untitled";

    const payload = {
      title,
      instructions:
        source.instructions ||
        source.description ||
        "",
      startTime:
        source.startTime ||
        source.startDate ||
        null,
      questions,
      published: true
    };

    const result =
      await req(
        `/api/admin/batches/${encodeURIComponent(
          S.batch.id
        )}/content/${type}`,
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );

    if (!result.success) {
      throw new Error(
        result.message ||
        "Upload failed"
      );
    }

    alert(
      `${type === "dpp" ? "DPP" : "Test"} uploaded successfully`
    );

    await content(S.batch.id);

  } catch (err) {
    console.error(
      "UPLOAD ERROR:",
      err
    );

    shell(
      S.batch?.name || "Upload",
      `
        <div class="zx-card">

          <div class="zx-empty">

            <div>
              Upload failed
            </div>

            <div
              style="
                margin-top:10px;
                color:#ff8498;
              "
            >
              ${escapeHtml(err.message)}
            </div>

            <br>

            <button
              class="zx-btn secondary"
              onclick="content('${escapeAttr(
                S.batch.id
              )}')"
            >
              Back
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
  const id =
    item._id ||
    item.id ||
    item.batchId ||
    item.batch_id;

  const name =
    item.name ||
    item.title ||
    item.batchName ||
    "Unnamed Batch";

  return {
    ...item,
    id: String(id || ""),
    name: String(name)
  };
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
    item.dppName ||
    "Untitled";

  return {
    ...item,
    id: String(id || ""),
    title: String(title)
  };
}


/* =====================================================
   QUESTION EXTRACTION
   ===================================================== */

function extractQuestions(source) {
  const candidates = [
    source.questions,
    source.questionList,
    source.data?.questions,
    source.data?.questionList,
    source.test?.questions,
    source.test?.questionList
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}


/* =====================================================
   LOGOUT
   ===================================================== */

function logout() {
  localStorage.removeItem("zx_admin_token");

  S.token = "";
  S.batch = null;
  S.batches = [];
  S.sourceItems = [];

  showLogin();
}


/* =====================================================
   ESCAPE HELPERS
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
   START
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const form = $("#login-form");

    if (form) {
      form.addEventListener(
        "submit",
        doLogin
      );
    }

    if (S.token) {
      showApp();
      home().catch(() => {
        logout();
      });
    } else {
      showLogin();
    }

  }
);


/* =====================================================
   GLOBALS
   ===================================================== */

window.doLogin = doLogin;
window.home = home;
window.batches = batches;
window.content = content;
window.filterBatches = filterBatches;
window.filterContent = filterContent;
window.uploadSourceItem = uploadSourceItem;
window.logout = logout;
