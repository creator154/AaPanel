const $ = (selector) => document.querySelector(selector);

const S = {
  token: localStorage.getItem("zx_admin_token") || "",
  scope: localStorage.getItem("zx_scope") || "all",

  type: "test",
  batch: null,

  batches: [],
  sourceItems: [],

  uploading: new Set(),
  success: new Set(),
  skipped: new Set(),

  uploadedIds: new Set(),
  uploadedTitles: new Set()
};


/* =========================================================
   API
========================================================= */

function API() {
  return (window.ZX_CONFIG?.API_BASE || "")
    .replace(/\/$/, "");
}


async function req(path, options = {}) {
  const headers = {
    ...(options.body
      ? { "Content-Type": "application/json" }
      : {}),
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
    logout();
    throw new Error(
      data.message || "Session expired. Login again."
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


/* =========================================================
   LOGIN
========================================================= */

function showLogin() {
  const login = $("#login-screen");
  const app = $("#app");

  if (login) {
    login.style.display = "flex";
  }

  if (app) {
    app.style.display = "none";
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


async function doLogin(event) {
  event?.preventDefault();

  const input = $("#auth-token");
  const button = $("#login-button");
  const error = $("#login-error");

  const authToken = input?.value.trim() || "";

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
    const response = await fetch(
      `${API()}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          authToken
        })
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Login failed"
      );
    }

    if (!data.token) {
      throw new Error(
        "Server did not return login token"
      );
    }

    S.token = data.token;
    S.scope = data.scope || "all";

    localStorage.setItem(
      "zx_admin_token",
      S.token
    );

    localStorage.setItem(
      "zx_scope",
      S.scope
    );

    showApp();

    await home();

  } catch (err) {
    if (error) {
      error.textContent =
        err.message || "Login failed";
    }

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Login";
    }
  }
}


function logout() {
  S.token = "";
  S.scope = "all";
  S.batch = null;

  localStorage.removeItem("zx_admin_token");
  localStorage.removeItem("zx_scope");

  showLogin();
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  return d.toLocaleString();
}


/* =========================================================
   SOURCE ID
========================================================= */

function sourceId(item) {
  return String(
    item?.testId ||
    item?.testID ||
    item?.id ||
    item?._id ||
    item?.test_id ||
    item?.dppId ||
    item?.dppID ||
    item?.sourceTestId ||
    ""
  ).trim();
}


function itemTitle(item) {
  return String(
    item?.title ||
    item?.name ||
    item?.testName ||
    item?.test_name ||
    item?.testTitle ||
    item?.test_title ||
    item?.subjectName ||
    "Untitled"
  ).trim();
}


/* =========================================================
   BATCH ID
========================================================= */

function sourceBatchId(batch) {
  return String(
    batch?.sourceBatchId ||
    batch?.batchId ||
    batch?.batchID ||
    batch?.id ||
    batch?._id ||
    ""
  ).trim();
}


function batchTitle(batch) {
  return String(
    batch?.name ||
    batch?.batchName ||
    batch?.title ||
    "Untitled Batch"
  ).trim();
}


/* =========================================================
   HOME
========================================================= */

async function home() {
  if (!S.token) {
    showLogin();
    return;
  }

  showApp();

  renderShell();

  await loadBatches();
}


/* =========================================================
   SHELL
========================================================= */

function renderShell() {
  const app = $("#app");

  if (!app) return;

  app.innerHTML = `
    <div class="zx-panel">

      <header class="zx-header">

        <div>
          <div class="zx-brand">
            ZX Uploader
          </div>

          <div class="zx-subtitle">
            Test & DPP Uploader
          </div>
        </div>

        <button
          class="zx-logout"
          onclick="logout()"
        >
          Logout
        </button>

      </header>


      <main class="zx-main">

        <section id="page-content"></section>

      </main>

    </div>
  `;

  addPanelStyles();
}


/* =========================================================
   STYLES
   IMPORTANT:
   Login screen CSS ko touch nahi karta
========================================================= */

function addPanelStyles() {
  if ($("#zx-panel-style")) return;

  const style = document.createElement("style");

  style.id = "zx-panel-style";

  style.textContent = `
    .zx-panel {
      min-height: 100vh;
      background: #f6f7fb;
      color: #111827;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .zx-header {
      height: 72px;
      padding: 0 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      box-sizing: border-box;
    }

    .zx-brand {
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -0.4px;
    }

    .zx-subtitle {
      margin-top: 2px;
      font-size: 12px;
      color: #6b7280;
    }

    .zx-logout {
      border: 0;
      background: #111827;
      color: white;
      border-radius: 10px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 700;
    }

    .zx-main {
      max-width: 1100px;
      margin: auto;
      padding: 28px 18px 60px;
      box-sizing: border-box;
    }

    .zx-page-title {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .zx-page-subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 24px;
    }

    .zx-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    .zx-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 4px 18px rgba(0,0,0,.04);
    }

    .zx-card-title {
      font-weight: 800;
      font-size: 16px;
      line-height: 1.4;
    }

    .zx-card-meta {
      margin-top: 7px;
      color: #6b7280;
      font-size: 12px;
    }

    .zx-batch-button {
      width: 100%;
      margin-top: 16px;
      border: 0;
      border-radius: 10px;
      padding: 11px 14px;
      background: #111827;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    .zx-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .zx-tab {
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 10px;
      padding: 10px 18px;
      font-weight: 700;
      cursor: pointer;
    }

    .zx-tab.active {
      background: #111827;
      color: white;
      border-color: #111827;
    }

    .zx-back {
      border: 0;
      background: transparent;
      padding: 0;
      margin-bottom: 14px;
      cursor: pointer;
      font-weight: 700;
      color: #374151;
    }

    .zx-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .zx-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 15px;
      display: flex;
      gap: 14px;
      align-items: center;
      justify-content: space-between;
    }

    .zx-item-info {
      min-width: 0;
      flex: 1;
    }

    .zx-item-title {
      font-weight: 750;
      font-size: 14px;
      line-height: 1.45;
    }

    .zx-item-meta {
      color: #6b7280;
      font-size: 11px;
      margin-top: 5px;
    }

    .zx-action {
      min-width: 105px;
      border: 0;
      border-radius: 9px;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      background: #111827;
      color: white;
    }

    .zx-action:disabled {
      cursor: default;
      opacity: .8;
    }

    .zx-action.success {
      background: #059669;
    }

    .zx-action.skipped {
      background: #6b7280;
    }

    .zx-action.loading {
      background: #374151;
    }

    .zx-empty {
      text-align: center;
      padding: 50px 20px;
      color: #6b7280;
      background: white;
      border: 1px dashed #d1d5db;
      border-radius: 16px;
    }

    .zx-loading {
      text-align: center;
      padding: 50px;
      color: #6b7280;
    }

    @media (max-width: 650px) {
      .zx-header {
        padding: 0 16px;
      }

      .zx-main {
        padding: 20px 12px 40px;
      }

      .zx-item {
        align-items: flex-start;
        flex-direction: column;
      }

      .zx-action {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =========================================================
   BATCHES
========================================================= */

async function loadBatches() {
  const page = $("#page-content");

  if (!page) return;

  page.innerHTML = `
    <div class="zx-loading">
      Loading batches...
    </div>
  `;

  try {
    const data = await req(
      "/api/admin/source/batches"
    );

    S.batches = Array.isArray(data)
      ? data
      : (
          data.items ||
          data.batches ||
          data.data ||
          []
        );

    renderBatches();

  } catch (err) {
    page.innerHTML = `
      <div class="zx-empty">
        <strong>Failed to load batches</strong>
        <br><br>
        ${esc(err.message)}
      </div>
    `;
  }
}


function renderBatches() {
  const page = $("#page-content");

  if (!page) return;

  page.innerHTML = `
    <div class="zx-page-title">
      Select Batch
    </div>

    <div class="zx-page-subtitle">
      ${S.batches.length} source batches available
    </div>

    ${
      S.batches.length
        ? `
          <div class="zx-grid">
            ${S.batches.map((batch, index) => `
              <div class="zx-card">

                <div class="zx-card-title">
                  ${esc(batchTitle(batch))}
                </div>

                <div class="zx-card-meta">
                  ${esc(
                    batch?.exam ||
                    batch?.category ||
                    batch?.language ||
                    ""
                  )}
                </div>

                <button
                  class="zx-batch-button"
                  onclick="selectBatch(${index})"
                >
                  Open Batch
                </button>

              </div>
            `).join("")}
          </div>
        `
        : `
          <div class="zx-empty">
            No batches found.
          </div>
        `
    }
  `;
}


function selectBatch(index) {
  const batch = S.batches[index];

  if (!batch) return;

  S.batch = batch;
  S.success.clear();
  S.skipped.clear();
  S.uploadedIds.clear();
  S.uploadedTitles.clear();

  renderContent();
}


/* =========================================================
   CONTENT PAGE
========================================================= */

function renderContent() {
  const page = $("#page-content");

  if (!page || !S.batch) return;

  page.innerHTML = `
    <button
      class="zx-back"
      onclick="loadBatches()"
    >
      ← Back to Batches
    </button>

    <div class="zx-page-title">
      ${esc(batchTitle(S.batch))}
    </div>

    <div class="zx-page-subtitle">
      Select content type
    </div>

    <div class="zx-tabs">

      <button
        id="tab-test"
        class="zx-tab ${S.type === "test" ? "active" : ""}"
        onclick="changeType('test')"
      >
        Tests
      </button>

      <button
        id="tab-dpp"
        class="zx-tab ${S.type === "dpp" ? "active" : ""}"
        onclick="changeType('dpp')"
      >
        DPPs
      </button>

    </div>

    <div id="source-list">
      <div class="zx-loading">
        Loading...
      </div>
    </div>
  `;

  loadSourceItems();
}


async function changeType(type) {
  S.type = type;

  S.sourceItems = [];
  S.success.clear();
  S.skipped.clear();
  S.uploadedIds.clear();
  S.uploadedTitles.clear();

  renderContent();
}


/* =========================================================
   SOURCE ITEMS
========================================================= */

async function loadSourceItems() {
  const list = $("#source-list");

  if (!list || !S.batch) return;

  list.innerHTML = `
    <div class="zx-loading">
      Loading ${S.type === "test" ? "tests" : "DPPs"}...
    </div>
  `;

  const batchId = sourceBatchId(S.batch);

  if (!batchId) {
    list.innerHTML = `
      <div class="zx-empty">
        Source batch ID not found.
      </div>
    `;

    return;
  }

  try {
    const endpoint =
      `/api/admin/source/batches/${encodeURIComponent(batchId)}/${S.type}s`;

    const data = await req(endpoint);

    S.sourceItems = Array.isArray(data)
      ? data
      : (
          data.items ||
          data.tests ||
          data.dpps ||
          data.data ||
          []
        );

    await loadBackendStatus(batchId);

    renderSourceItems();

  } catch (err) {
    list.innerHTML = `
      <div class="zx-empty">
        <strong>Failed to load ${S.type}s</strong>
        <br><br>
        ${esc(err.message)}
      </div>
    `;
  }
}


/* =========================================================
   UPLOAD STATUS
========================================================= */

async function loadBackendStatus(batchId) {
  try {
    const data = await req(
      `/api/admin/source/batches/${encodeURIComponent(batchId)}/${S.type}/status`
    );

    const ids = data.uploadedIds || [];
    const titles = data.uploadedTitles || [];

    S.uploadedIds = new Set(
      ids.map(id => String(id))
    );

    S.uploadedTitles = new Set(
      titles
        .map(title =>
          String(title)
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    );

  } catch (err) {
    console.warn(
      "Upload status check failed:",
      err.message
    );
  }
}


/* =========================================================
   RENDER ITEMS
========================================================= */

function getItemState(item, index) {
  const id = sourceId(item);

  const title = itemTitle(item)
    .trim()
    .toLowerCase();

  if (S.success.has(id || String(index))) {
    return "success";
  }

  if (S.skipped.has(id || String(index))) {
    return "skipped";
  }

  if (
    (id && S.uploadedIds.has(id)) ||
    (title && S.uploadedTitles.has(title))
  ) {
    return "skipped";
  }

  if (S.uploading.has(id || String(index))) {
    return "loading";
  }

  return "upload";
}


function renderSourceItems() {
  const list = $("#source-list");

  if (!list) return;

  if (!S.sourceItems.length) {
    list.innerHTML = `
      <div class="zx-empty">
        No ${S.type === "test" ? "tests" : "DPPs"} found.
      </div>
    `;

    return;
  }

  list.innerHTML = `
    <div class="zx-list">

      ${S.sourceItems.map((item, index) => {

        const id =
          sourceId(item) ||
          `item-${index}`;

        const title =
          itemTitle(item);

        const state =
          getItemState(item, index);

        let buttonText = "UPLOAD";
        let buttonClass = "";
        let disabled = "";

        if (state === "success") {
          buttonText = "SUCCESS";
          buttonClass = "success";
          disabled = "disabled";

        } else if (state === "skipped") {
          buttonText = "SKIPPED";
          buttonClass = "skipped";
          disabled = "disabled";

        } else if (state === "loading") {
          buttonText = "UPLOADING...";
          buttonClass = "loading";
          disabled = "disabled";
        }

        return `
          <div class="zx-item">

            <div class="zx-item-info">

              <div class="zx-item-title">
                ${esc(title)}
              </div>

              <div class="zx-item-meta">
                ${
                  id.startsWith("item-")
                    ? ""
                    : `ID: ${esc(id)}`
                }
              </div>

            </div>

            <button
              class="zx-action ${buttonClass}"
              ${disabled}
              onclick="uploadItem(${index})"
            >
              ${buttonText}
            </button>

          </div>
        `;
      }).join("")}

    </div>
  `;
}


/* =========================================================
   UPLOAD ITEM
========================================================= */

async function uploadItem(index) {
  const item = S.sourceItems[index];

  if (!item || !S.batch) return;

  const id =
    sourceId(item) ||
    `item-${index}`;

  const title =
    itemTitle(item);

  const normalizedTitle =
    title.trim().toLowerCase();

  if (
    S.uploadedIds.has(id) ||
    (
      normalizedTitle &&
      S.uploadedTitles.has(normalizedTitle)
    )
  ) {
    S.skipped.add(id);
    renderSourceItems();
    return;
  }

  if (S.uploading.has(id)) {
    return;
  }

  S.uploading.add(id);

  renderSourceItems();

  const batchId =
    sourceBatchId(S.batch);

  if (!batchId) {
    S.uploading.delete(id);
    renderSourceItems();

    alert("Source batch ID not found.");

    return;
  }

  try {
    const payload = {
      sourceTestId: id,
      sourceId: id,

      sourceBatchId: batchId,

      title: title,

      instructions:
        item?.instructions ||
        item?.instruction ||
        item?.description ||
        "",

      startTime:
        item?.startTime ||
        item?.start_time ||
        item?.startDate ||
        item?.start_date ||
        item?.scheduledAt ||
        item?.scheduleTime ||
        null,

      sourceItem: item
    };

    const result = await req(
      `/api/admin/source/batches/${encodeURIComponent(batchId)}/${S.type}/upload`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    S.uploading.delete(id);

    if (result?.skipped) {
      S.skipped.add(id);
      S.uploadedIds.add(id);

      if (normalizedTitle) {
        S.uploadedTitles.add(
          normalizedTitle
        );
      }

    } else {
      S.success.add(id);
      S.uploadedIds.add(id);

      if (normalizedTitle) {
        S.uploadedTitles.add(
          normalizedTitle
        );
      }
    }

    renderSourceItems();

  } catch (err) {
    S.uploading.delete(id);

    renderSourceItems();

    alert(
      `Upload failed:\n\n${err.message}`
    );
  }
}


/* =========================================================
   UPLOAD ALL
========================================================= */

async function uploadAll() {
  for (
    let index = 0;
    index < S.sourceItems.length;
    index++
  ) {
    const item = S.sourceItems[index];

    const id =
      sourceId(item) ||
      `item-${index}`;

    const title =
      itemTitle(item)
        .trim()
        .toLowerCase();

    if (
      S.success.has(id) ||
      S.skipped.has(id) ||
      S.uploadedIds.has(id) ||
      (
        title &&
        S.uploadedTitles.has(title)
      )
    ) {
      continue;
    }

    await uploadItem(index);
  }
}


/* =========================================================
   INITIALIZE
========================================================= */

function bindLogin() {
  const form = $("#login-form");

  if (form) {
    form.addEventListener(
      "submit",
      doLogin
    );
  }

  const button = $("#login-button");

  if (
    button &&
    !form
  ) {
    button.addEventListener(
      "click",
      doLogin
    );
  }
}


async function init() {
  bindLogin();

  if (S.token) {
    try {
      showApp();
      await home();

    } catch (err) {
      console.error(err);
      logout();
    }

  } else {
    showLogin();
  }
}


document.addEventListener(
  "DOMContentLoaded",
  init
);


/* =========================================================
   GLOBALS
========================================================= */

window.doLogin = doLogin;
window.logout = logout;
window.selectBatch = selectBatch;
window.changeType = changeType;
window.uploadItem = uploadItem;
window.uploadAll = uploadAll;
