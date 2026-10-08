const $ = (selector) => document.querySelector(selector);

const S = {
  token: localStorage.getItem("zx_admin_token") || "",
  scope: localStorage.getItem("zx_scope") || "all",
  type: "test",
  batch: null,
  batches: [],
  sourceItems: [],
  uploading: new Set(),
  uploaded: new Set(),
  skipped: new Set(),
  success: new Set()
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
    throw new Error(data.message || "Session expired. Login again.");
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
   LOGIN
===================================================== */

function showLogin() {
  const login = $("#login-screen");
  const app = $("#app");

  if (login) login.style.display = "flex";
  if (app) app.style.display = "none";

  if ($("#login-error")) {
    $("#login-error").textContent = "";
  }
}

function showApp() {
  if ($("#login-screen")) {
    $("#login-screen").style.display = "none";
  }

  if ($("#app")) {
    $("#app").style.display = "block";
  }
}

async function doLogin(event) {
  event?.preventDefault();

  const authToken = $("#auth-token")?.value.trim() || "";
  const error = $("#login-error");
  const button = $("#login-button");

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

  try {
    const response = await fetch(`${API()}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        authToken
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Login failed"
      );
    }

    if (!data.token) {
      throw new Error("Server did not return login token");
    }

    S.token = data.token;
    S.scope = data.scope || "all";

    localStorage.setItem("zx_admin_token", S.token);
    localStorage.setItem("zx_scope", S.scope);

    showApp();

    await home();

  } catch (err) {
    if (error) {
      error.textContent = err.message || "Login failed";
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Login";
    }
  }
}


/* =====================================================
   STYLES
===================================================== */

function addPanelStyles() {
  if ($("#zx-panel-styles")) return;

  const style = document.createElement("style");

  style.id = "zx-panel-styles";

  style.textContent = `
    #app {
      min-height:100vh;
      box-sizing:border-box;
      padding:22px;
      color:#fff;
      background:
        radial-gradient(
          circle at 10% 0%,
          rgba(99,102,241,.2),
          transparent 32%
        ),
        radial-gradient(
          circle at 90% 10%,
          rgba(168,85,247,.18),
          transparent 30%
        ),
        #070a12;
      font-family:Inter,system-ui,-apple-system,sans-serif;
    }

    .zx-wrap {
      width:min(1180px,100%);
      margin:auto;
    }

    .zx-top {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
      margin-bottom:24px;
    }

    .zx-title {
      font-size:26px;
      font-weight:800;
    }

    .zx-sub,
    .zx-section-sub {
      color:#8d96aa;
      font-size:13px;
      margin-top:5px;
    }

    .zx-card {
      border:1px solid #ffffff12;
      border-radius:20px;
      padding:20px;
      background:#101420e8;
      box-shadow:0 25px 70px #0005;
    }

    .zx-dashboard-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:18px;
      margin-top:20px;
    }

    .zx-type-card {
      position:relative;
      min-height:190px;
      padding:25px;
      border-radius:20px;
      cursor:pointer;
      overflow:hidden;
    }

    .zx-type-card.test {
      background:
        linear-gradient(
          135deg,
          #3730a3,
          #4f46e5,
          #6366f1
        );
    }

    .zx-type-card.dpp {
      background:
        linear-gradient(
          135deg,
          #7c2d12,
          #ea580c,
          #f97316
        );
    }

    .zx-type-icon {
      font-size:28px;
      margin-bottom:22px;
    }

    .zx-type-title {
      font-size:24px;
      font-weight:800;
    }

    .zx-type-description {
      margin-top:8px;
      color:#ffffffc9;
      font-size:13px;
    }

    .zx-actions {
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      margin-bottom:18px;
    }

    .zx-btn {
      border:0;
      border-radius:11px;
      padding:11px 16px;
      cursor:pointer;
      color:white;
      background:
        linear-gradient(
          135deg,
          #635bff,
          #7c3aed
        );
      font-weight:700;
    }

    .zx-btn:disabled {
      opacity:.55;
      cursor:not-allowed;
    }

    .zx-btn.secondary {
      background:#202536;
    }

    .zx-btn.success {
      background:#166534;
    }

    .zx-btn.skip {
      background:#334155;
      color:#cbd5e1;
    }

    .zx-search {
      width:100%;
      box-sizing:border-box;
      padding:13px 15px;
      border-radius:11px;
      border:1px solid #ffffff18;
      outline:none;
      background:#0c0f18;
      color:#fff;
      margin-bottom:16px;
    }

    .zx-list {
      display:grid;
      gap:11px;
    }

    .zx-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:15px;
      padding:16px;
      border-radius:14px;
      background:#111522;
      border:1px solid #ffffff0f;
    }

    .zx-row-title {
      font-weight:700;
      overflow-wrap:anywhere;
    }

    .zx-row-sub {
      margin-top:6px;
      color:#858da0;
      font-size:12px;
    }

    .zx-empty,
    .zx-loading {
      text-align:center;
      padding:35px 15px;
      color:#858da0;
    }

    .zx-badge {
      display:inline-block;
      margin-left:8px;
      padding:4px 8px;
      border-radius:999px;
      font-size:11px;
    }

    .zx-badge-success {
      background:#16a34a25;
      color:#86efac;
    }

    .zx-badge-skipped {
      background:#334155;
      color:#cbd5e1;
    }

    .zx-progress {
      height:8px;
      background:#252a3a;
      border-radius:10px;
      overflow:hidden;
      margin:12px 0 18px;
    }

    .zx-progress-bar {
      height:100%;
      background:
        linear-gradient(
          90deg,
          #6366f1,
          #22c55e
        );
      transition:width .25s;
    }

    .zx-progress-text {
      font-size:13px;
      color:#a5b4fc;
      margin-top:12px;
    }

    @media(max-width:700px) {
      #app {
        padding:14px;
      }

      .zx-dashboard-grid {
        grid-template-columns:1fr;
      }

      .zx-row {
        align-items:flex-start;
        flex-direction:column;
      }

      .zx-title {
        font-size:23px;
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
    throw new Error("#app not found");
  }

  app.innerHTML = `
    <div class="zx-wrap">

      <div class="zx-top">

        <div>
          <div class="zx-title">
            ${escapeHtml(title)}
          </div>

          <div class="zx-sub">
            Batch Uploader Panel
          </div>
        </div>

        <div class="zx-actions">

          <button
            class="zx-btn secondary"
            onclick="home()"
          >
            Dashboard
          </button>

          <button
            class="zx-btn secondary"
            onclick="logout()"
          >
            Logout
          </button>

        </div>

      </div>

      ${body}

    </div>
  `;

  app.style.display = "block";
}


/* =====================================================
   HOME
===================================================== */

async function home() {
  showApp();

  shell(
    "Batch Uploader",
    `
      <div class="zx-card">

        <div
          class="zx-title"
          style="font-size:18px"
        >
          What do you want to upload?
        </div>

        <div class="zx-section-sub">
          Select Tests or DPPs to continue
        </div>

        <div class="zx-dashboard-grid">

          <div
            class="zx-type-card test"
            onclick="batches('test')"
          >

            <div class="zx-type-icon">
              📝
            </div>

            <div class="zx-type-title">
              Tests
            </div>

            <div class="zx-type-description">
              Browse batches and upload test papers.
            </div>

          </div>

          <div
            class="zx-type-card dpp"
            onclick="batches('dpp')"
          >

            <div class="zx-type-icon">
              📚
            </div>

            <div class="zx-type-title">
              DPPs
            </div>

            <div class="zx-type-description">
              Browse batches and upload practice problems.
            </div>

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
  S.sourceItems = [];
  S.uploaded.clear();
  S.skipped.clear();
  S.success.clear();

  shell(
    S.type === "test"
      ? "Tests • Select Batch"
      : "DPPs • Select Batch",
    `
      <div class="zx-card">

        <div class="zx-actions">

          <button
            class="zx-btn ${
              S.type === "test" ? "" : "secondary"
            }"
            onclick="batches('test')"
          >
            📝 Tests
          </button>

          <button
            class="zx-btn ${
              S.type === "dpp" ? "" : "secondary"
            }"
            onclick="batches('dpp')"
          >
            📚 DPPs
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
        >
          <div class="zx-loading">
            Loading batches...
          </div>
        </div>

      </div>
    `
  );

  try {
    const data = await req(
      "/api/admin/source/batches"
    );

    const raw =
      data.batches ||
      data.data?.batches ||
      data.data?.items ||
      data.data?.data ||
      data.data ||
      [];

    const sourceBatches =
      Array.isArray(raw)
        ? raw
            .map(normalizeBatch)
            .filter(x => x.id)
        : [];

    let localBatches = [];

    try {
      const localData = await req(
        "/api/admin/batches"
      );

      localBatches =
        (localData.batches || []).map(b => ({
          ...b,
          id: String(b._id || b.id || ""),
          sourceBatchId: String(
            b.sourceBatchId || ""
          )
        }));

    } catch (e) {
      console.warn(
        "Local batch mapping unavailable:",
        e.message
      );
    }

    S.batches = sourceBatches.map(source => {

      const local =
        localBatches.find(
          b =>
            String(b.sourceBatchId) ===
            String(source.id)
        );

      return {
        ...source,
        id: String(source.id),
        sourceBatchId: String(source.id),
        localId: local
          ? String(local.id)
          : "",
        name: String(
          source.name ||
          source.title ||
          source.batchName ||
          "Unnamed Batch"
        )
      };
    });

    renderBatches();

  } catch (error) {

    const box = $("#batch-list");

    if (box) {
      box.innerHTML = `
        <div class="zx-empty">

          ${escapeHtml(error.message)}

          <br><br>

          <button
            class="zx-btn"
            onclick="batches('${S.type}')"
          >
            Retry
          </button>

        </div>
      `;
    }
  }
}

function renderBatches() {
  drawBatchList(S.batches);
}

function filterBatches() {
  const q =
    ($("#batch-search")?.value || "")
      .trim()
      .toLowerCase();

  drawBatchList(
    S.batches.filter(
      b =>
        String(b.name || "")
          .toLowerCase()
          .includes(q)
    )
  );
}

function drawBatchList(list) {
  const box = $("#batch-list");

  if (!box) return;

  if (!list.length) {
    box.innerHTML = `
      <div class="zx-empty">
        No matching batches found.
      </div>
    `;

    return;
  }

  box.innerHTML = list
    .map(batch => `
      <div class="zx-row">

        <div>

          <div class="zx-row-title">
            ${escapeHtml(batch.name)}
          </div>

          <div class="zx-row-sub">
            Source ID:
            ${escapeHtml(
              batch.sourceBatchId ||
              batch.id
            )}
          </div>

        </div>

        <button
          class="zx-btn"
          onclick="content('${escapeAttr(batch.id)}')"
        >
          Open →
        </button>

      </div>
    `)
    .join("");
}


/* =====================================================
   CONTENT
===================================================== */

async function content(batchId) {
  S.batch =
    S.batches.find(
      b =>
        String(b.id) ===
        String(batchId)
    ) || null;

  if (!S.batch) {
    return alert("Batch not found");
  }

  const srcId =
    S.batch.sourceBatchId ||
    S.batch.id;

  const endpoint =
    S.type === "dpp"
      ? `/api/admin/source/batches/${encodeURIComponent(srcId)}/dpps`
      : `/api/admin/source/batches/${encodeURIComponent(srcId)}/tests`;

  shell(
    S.batch.name,
    `
      <div class="zx-card">

        <div class="zx-actions">

          <button
            class="zx-btn secondary"
            onclick="batches('${S.type}')"
          >
            ← Batches
          </button>

          <button
            class="zx-btn secondary"
            onclick="content('${escapeAttr(S.batch.id)}')"
          >
            Refresh
          </button>

          <button
            class="zx-btn"
            onclick="uploadAll()"
          >
            Upload All Pending
          </button>

        </div>

        <div id="progress-summary"></div>

        <input
          id="item-search"
          class="zx-search"
          placeholder="Search ${
            S.type === "dpp"
              ? "DPP"
              : "test"
          }..."
          oninput="filterContent()"
        >

        <div
          id="item-list"
          class="zx-list"
        >
          <div class="zx-loading">
            Loading...
          </div>
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

    S.sourceItems =
      Array.isArray(raw)
        ? raw
            .map(normalizeItem)
            .filter(i => i.id)
        : [];

    /*
     * Backend status is authoritative.
     * LocalStorage is only used as fallback
     * for old uploads.
     */

    await loadBackendStatus();

    renderContent();

  } catch (error) {

    const box = $("#item-list");

    if (box) {
      box.innerHTML = `
        <div class="zx-empty">

          ${escapeHtml(error.message)}

          <br><br>

          <button
            class="zx-btn secondary"
            onclick="batches('${S.type}')"
          >
            ← Back
          </button>

        </div>
      `;
    }
  }
}


/* =====================================================
   BACKEND STATUS
===================================================== */

async function loadBackendStatus() {

  if (!S.batch) return;

  const srcId =
    S.batch.sourceBatchId ||
    S.batch.id;

  /*
   * Old localStorage status.
   * Only fallback.
   */

  let oldStatus = [];

  try {
    oldStatus = JSON.parse(
      localStorage.getItem(
        statusPrefix()
      ) || "[]"
    );
  } catch (_) {
    oldStatus = [];
  }

  S.uploaded = new Set(
    oldStatus.map(String)
  );

  S.skipped.clear();
  S.success.clear();

  try {

    const data = await req(
      `/api/admin/source/batches/${encodeURIComponent(srcId)}/${S.type}/status`
    );

    const uploadedIds =
      Array.isArray(data.uploadedIds)
        ? data.uploadedIds
        : [];

    const uploadedTitles =
      Array.isArray(data.uploadedTitles)
        ? data.uploadedTitles
        : [];

    for (const id of uploadedIds) {
      S.uploaded.add(String(id));
      S.skipped.add(String(id));
    }

    /*
     * Legacy records without sourceTestId.
     * Match by normalized title.
     */

    if (uploadedTitles.length) {

      const titleSet =
        new Set(
          uploadedTitles.map(
            normalizeTitle
          )
        );

      for (const item of S.sourceItems) {

        if (
          titleSet.has(
            normalizeTitle(item.title)
          )
        ) {
          S.uploaded.add(
            String(item.id)
          );

          S.skipped.add(
            String(item.id)
          );
        }
      }
    }

  } catch (error) {

    /*
     * If status endpoint is not deployed yet,
     * keep old localStorage behavior.
     */

    console.warn(
      "Backend status unavailable:",
      error.message
    );
  }
}


/* =====================================================
   STATUS
===================================================== */

function statusPrefix() {

  return `zx_uploaded_${S.type}_${S.batch?.sourceBatchId || S.batch?.id || "unknown"}`;
}

function saveUploadStatus(id) {

  S.uploaded.add(String(id));

  localStorage.setItem(
    statusPrefix(),
    JSON.stringify(
      [...S.uploaded]
    )
  );
}

function normalizeTitle(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


/* =====================================================
   RENDER CONTENT
===================================================== */

function renderContent() {
  drawContentList(
    S.sourceItems
  );
}

function filterContent() {

  const q =
    ($("#item-search")?.value || "")
      .trim()
      .toLowerCase();

  drawContentList(
    S.sourceItems.filter(
      item =>
        String(item.title || "")
          .toLowerCase()
          .includes(q)
    )
  );
}

function drawContentList(list) {

  const box = $("#item-list");

  if (!box) return;

  const total =
    S.sourceItems.length;

  const done =
    S.sourceItems.filter(
      i =>
        S.uploaded.has(
          String(i.id)
        )
    ).length;

  const percent =
    total
      ? Math.round(
          done / total * 100
        )
      : 0;

  const summary =
    $("#progress-summary");

  if (summary) {

    summary.innerHTML = `
      <div class="zx-progress-text">
        Uploaded ${done} / ${total}
        ${
          S.type === "dpp"
            ? "DPPs"
            : "tests"
        }
      </div>

      <div class="zx-progress">

        <div
          class="zx-progress-bar"
          style="width:${percent}%"
        ></div>

      </div>
    `;
  }

  if (!list.length) {

    box.innerHTML = `
      <div class="zx-empty">
        No ${
          S.type === "dpp"
            ? "DPPs"
            : "tests"
        } found.
      </div>
    `;

    return;
  }

  box.innerHTML =
    list
      .map(item => {

        const id =
          String(item.id);

        const uploaded =
          S.uploaded.has(id);

        const skipped =
          S.skipped.has(id);

        const success =
          S.success.has(id);

        const uploading =
          S.uploading.has(id);

        let buttonText = "UPLOAD";
        let buttonClass = "";
        let disabled = false;
        let badge = "";

        /*
         * Priority:
         *
         * Uploading
         * Success
         * Skipped
         * Upload
         */

        if (uploading) {

          buttonText = "UPLOADING...";
          disabled = true;

        } else if (success) {

          buttonText = "SUCCESS";
          buttonClass = "success";
          disabled = true;

          badge = `
            <span class="zx-badge zx-badge-success">
              ✓ SUCCESS
            </span>
          `;

        } else if (skipped || uploaded) {

          buttonText = "SKIPPED";
          buttonClass = "skip";
          disabled = true;

          badge = `
            <span class="zx-badge zx-badge-skipped">
              SKIPPED
            </span>
          `;

        }

        /*
         * IMPORTANT:
         * There is NO VIEW button here.
         */

        return `
          <div class="zx-row">

            <div>

              <div class="zx-row-title">

                ${escapeHtml(item.title)}

                ${badge}

              </div>

              <div class="zx-row-sub">
                ID:
                ${escapeHtml(item.id)}
              </div>

            </div>

            <button
              class="zx-btn ${buttonClass}"
              ${disabled ? "disabled" : ""}
              onclick="uploadSourceItem('${escapeAttr(item.id)}')"
            >
              ${buttonText}
            </button>

          </div>
        `;

      })
      .join("");
}


/* =====================================================
   UPLOAD ALL
===================================================== */

async function uploadAll() {

  if (!S.batch) {
    return alert(
      "Batch not selected"
    );
  }

  const pending =
    S.sourceItems.filter(
      item =>
        !S.uploaded.has(
          String(item.id)
        ) &&
        !S.uploading.has(
          String(item.id)
        )
    );

  if (!pending.length) {

    return alert(
      "All items are already uploaded/skipped."
    );
  }

  if (
    !confirm(
      `Upload ${pending.length} pending ${
        S.type === "dpp"
          ? "DPPs"
          : "tests"
      } from this batch?`
    )
  ) {
    return;
  }

  for (const item of pending) {

    try {

      await uploadSourceItem(
        item.id,
        true
      );

    } catch (error) {

      console.error(
        "Upload All stopped:",
        error
      );

      break;
    }
  }

  renderContent();
}


/* =====================================================
   SOURCE UPLOAD
===================================================== */

async function uploadSourceItem(
  sourceId,
  silent = false
) {

  if (!S.batch?.id) {
    throw new Error(
      "Batch not selected"
    );
  }

  const item =
    S.sourceItems.find(
      i =>
        String(i.id) ===
        String(sourceId)
    );

  if (!item) {
    throw new Error(
      "Item not found"
    );
  }

  /*
   * Already uploaded/skipped.
   */

  if (
    S.uploaded.has(
      String(sourceId)
    )
  ) {
    return;
  }

  const type =
    S.type === "dpp"
      ? "dpp"
      : "test";

  const srcBatchId =
    S.batch.sourceBatchId ||
    S.batch.id;

  S.uploading.add(
    String(sourceId)
  );

  renderContent();

  try {

    /*
     * IMPORTANT:
     *
     * We no longer depend on
     * /api/admin/source/tests/:id
     * before uploading.
     *
     * The backend source-upload endpoint
     * receives the original source item too.
     *
     * This fixes the PenPencil 404 issue.
     */

    const result =
      await req(
        `/api/admin/source/batches/${encodeURIComponent(srcBatchId)}/${type}/upload`,
        {
          method: "POST",

          body: JSON.stringify({
            sourceTestId:
              String(sourceId),

            sourceItem:
              item
          })
        }
      );

    /*
     * Backend says already exists.
     */

    if (
      result.skipped === true ||
      result.status === "skipped"
    ) {

      S.uploaded.add(
        String(sourceId)
      );

      S.skipped.add(
        String(sourceId)
      );

      saveUploadStatus(
        sourceId
      );

      if (!silent) {
        alert(
          `${type === "dpp" ? "DPP" : "Test"} already uploaded — SKIPPED`
        );
      }

      return;
    }

    /*
     * Successful fresh upload.
     */

    if (
      result.success !== false
    ) {

      S.uploaded.add(
        String(sourceId)
      );

      S.success.add(
        String(sourceId)
      );

      saveUploadStatus(
        sourceId
      );

      if (!silent) {

        /*
         * Keep SUCCESS visible in UI.
         * Do not immediately replace it
         * with SKIPPED.
         */

        alert(
          `${type === "dpp" ? "DPP" : "Test"} uploaded successfully`
        );
      }

      return;
    }

    throw new Error(
      result.message ||
      "Upload failed"
    );

  } catch (error) {

    /*
     * If backend reports duplicate
     * through message/status, mark SKIPPED.
     */

    const msg =
      String(
        error.message || ""
      ).toLowerCase();

    if (
      msg.includes("already uploaded") ||
      msg.includes("already exists") ||
      msg.includes("duplicate")
    ) {

      S.uploaded.add(
        String(sourceId)
      );

      S.skipped.add(
        String(sourceId)
      );

      saveUploadStatus(
        sourceId
      );

      if (!silent) {

        alert(
          `${type === "dpp" ? "DPP" : "Test"} already uploaded — SKIPPED`
        );
      }

      return;
    }

    if (!silent) {

      alert(
        `Upload failed: ${error.message}`
      );
    }

    throw error;

  } finally {

    S.uploading.delete(
      String(sourceId)
    );

    renderContent();
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

  return {
    ...item,

    id: String(
      id || ""
    ),

    name: String(
      item.name ||
      item.title ||
      item.batchName ||
      item.batch_name ||
      "Unnamed Batch"
    )
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

  return {
    ...item,

    id: String(
      id || ""
    ),

    title: String(
      item.title ||
      item.name ||
      item.testName ||
      item.test_name ||
      item.dppName ||
      item.dpp_name ||
      "Untitled"
    )
  };
}


/* =====================================================
   QUESTION EXTRACTION
===================================================== */

function extractQuestions(source) {

  const candidates = [

    source?.questions,

    source?.questionList,

    source?.question_list,

    source?.data?.questions,

    source?.data?.questionList,

    source?.data?.question_list,

    source?.test?.questions,

    source?.test?.questionList,

    source?.test?.question_list,

    source?.data?.test?.questions,

    source?.data?.test?.questionList,

    source?.data?.test?.question_list

  ];

  for (
    const value of candidates
  ) {

    if (
      Array.isArray(value)
    ) {
      return value;
    }
  }

  return [];
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

  localStorage.removeItem(
    "zx_admin_token"
  );

  localStorage.removeItem(
    "zx_scope"
  );

  S.token = "";
  S.scope = "all";
  S.batch = null;
  S.batches = [];
  S.sourceItems = [];

  S.uploading.clear();
  S.uploaded.clear();
  S.skipped.clear();
  S.success.clear();

  showLogin();
}


/* =====================================================
   ESCAPE
===================================================== */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function escapeAttr(value) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    );
}


/* =====================================================
   INIT
===================================================== */

function initLogin() {

  if (S.token) {

    showApp();

    home().catch(err => {

      console.error(
        "AUTO LOGIN ERROR:",
        err
      );

      logout();
    });

  } else {

    showLogin();
  }
}


/* =====================================================
   START
===================================================== */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initLogin
  );

} else {

  initLogin();
}


/* =====================================================
   GLOBALS
===================================================== */

window.doLogin =
  doLogin;

window.home =
  home;

window.batches =
  batches;

window.content =
  content;

window.filterBatches =
  filterBatches;

window.filterContent =
  filterContent;

window.uploadSourceItem =
  uploadSourceItem;

window.uploadAll =
  uploadAll;

window.logout =
  logout;
