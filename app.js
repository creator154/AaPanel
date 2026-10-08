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
  skipped: new Set()
};


/* =====================================================
   API
===================================================== */

function API() {
  return (
    window.ZX_CONFIG?.API_BASE ||
    "https://panel1-18e1d76be41d.herokuapp.com"
  ).replace(/\/$/, "");
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

  const response = await fetch(
    `${API()}${path}`,
    {
      ...options,
      headers
    }
  );

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


/* =====================================================
   PREMIUM UI
===================================================== */

function addPanelStyles() {

  if ($("#zx-panel-styles")) return;

  const style = document.createElement("style");

  style.id = "zx-panel-styles";

  style.textContent = `

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background:
        radial-gradient(
          circle at top left,
          #312e81 0,
          transparent 35%
        ),
        radial-gradient(
          circle at top right,
          #581c87 0,
          transparent 35%
        ),
        #05070d;

      color: #fff;
    }


    /* ================= LOGIN ================= */

    #login-screen {

      min-height: 100vh;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 24px;

      background:
        radial-gradient(
          circle at 20% 20%,
          rgba(99,102,241,.28),
          transparent 35%
        ),
        radial-gradient(
          circle at 80% 80%,
          rgba(168,85,247,.22),
          transparent 35%
        ),
        #05070d;
    }


    .zx-login-card {

      width: 100%;
      max-width: 430px;

      padding: 38px 32px;

      border-radius: 26px;

      background:
        linear-gradient(
          145deg,
          rgba(24,29,45,.97),
          rgba(10,13,22,.97)
        );

      border: 1px solid rgba(255,255,255,.10);

      box-shadow:
        0 30px 100px rgba(0,0,0,.55),
        inset 0 1px 0 rgba(255,255,255,.05);

      text-align: center;
    }


    .zx-login-logo {

      width: 68px;
      height: 68px;

      margin: 0 auto 20px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 20px;

      background:
        linear-gradient(
          135deg,
          #6366f1,
          #8b5cf6
        );

      font-size: 30px;

      box-shadow:
        0 15px 40px rgba(99,102,241,.35);
    }


    .zx-login-title {

      font-size: 28px;
      font-weight: 850;

      letter-spacing: -.5px;
    }


    .zx-login-sub {

      margin-top: 8px;

      color: #8f98ad;

      font-size: 14px;
    }


    .zx-login-label {

      display: block;

      margin-top: 28px;
      margin-bottom: 8px;

      text-align: left;

      color: #cbd5e1;

      font-size: 13px;
      font-weight: 700;
    }


    .zx-login-input {

      width: 100%;

      padding: 15px 16px;

      border-radius: 13px;

      border: 1px solid rgba(255,255,255,.10);

      background: #080b13;

      color: #fff;

      outline: none;

      font-size: 15px;
    }


    .zx-login-input:focus {

      border-color: #6366f1;

      box-shadow:
        0 0 0 3px rgba(99,102,241,.12);
    }


    .zx-login-button {

      width: 100%;

      margin-top: 18px;

      padding: 14px;

      border: 0;
      border-radius: 13px;

      background:
        linear-gradient(
          135deg,
          #6366f1,
          #8b5cf6
        );

      color: #fff;

      font-size: 15px;
      font-weight: 800;

      cursor: pointer;

      box-shadow:
        0 12px 30px rgba(99,102,241,.25);
    }


    .zx-login-button:disabled {

      opacity: .55;
      cursor: wait;
    }


    #login-error {

      min-height: 20px;

      margin-top: 13px;

      color: #f87171;

      font-size: 13px;
    }


    /* ================= APP ================= */

    #app {

      min-height: 100vh;

      padding: 24px;

      background:
        radial-gradient(
          circle at 10% 0%,
          rgba(99,102,241,.18),
          transparent 30%
        ),
        radial-gradient(
          circle at 90% 10%,
          rgba(168,85,247,.14),
          transparent 30%
        ),
        #060912;
    }


    .zx-wrap {

      width: min(1120px, 100%);

      margin: auto;
    }


    .zx-top {

      display: flex;

      align-items: center;
      justify-content: space-between;

      gap: 15px;

      margin-bottom: 24px;
    }


    .zx-title {

      font-size: 27px;
      font-weight: 850;

      letter-spacing: -.5px;
    }


    .zx-sub {

      margin-top: 5px;

      color: #8b95aa;

      font-size: 13px;
    }


    .zx-card {

      padding: 22px;

      border-radius: 22px;

      background:
        rgba(15,19,31,.92);

      border: 1px solid rgba(255,255,255,.07);

      box-shadow:
        0 25px 70px rgba(0,0,0,.28);
    }


    .zx-actions {

      display: flex;

      flex-wrap: wrap;

      gap: 9px;

      margin-bottom: 18px;
    }


    .zx-btn {

      padding: 11px 16px;

      border: 0;
      border-radius: 11px;

      background:
        linear-gradient(
          135deg,
          #6366f1,
          #7c3aed
        );

      color: #fff;

      font-weight: 750;

      cursor: pointer;
    }


    .zx-btn.secondary {

      background: #202536;
    }


    .zx-btn:disabled {

      opacity: .55;

      cursor: not-allowed;
    }


    /* ================= HOME ================= */

    .zx-dashboard-grid {

      display: grid;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 18px;

      margin-top: 22px;
    }


    .zx-type-card {

      min-height: 210px;

      padding: 28px;

      border: 0;

      border-radius: 22px;

      text-align: left;

      color: #fff;

      cursor: pointer;

      transition:
        transform .2s,
        box-shadow .2s;
    }


    .zx-type-card:hover {

      transform: translateY(-3px);
    }


    .zx-type-card.test {

      background:
        linear-gradient(
          135deg,
          #3730a3,
          #4f46e5,
          #6366f1
        );

      box-shadow:
        0 20px 50px rgba(79,70,229,.22);
    }


    .zx-type-card.dpp {

      background:
        linear-gradient(
          135deg,
          #9a3412,
          #ea580c,
          #f97316
        );

      box-shadow:
        0 20px 50px rgba(234,88,12,.20);
    }


    .zx-type-icon {

      font-size: 34px;

      margin-bottom: 25px;
    }


    .zx-type-title {

      font-size: 26px;

      font-weight: 850;
    }


    .zx-type-description {

      margin-top: 8px;

      color: rgba(255,255,255,.78);

      font-size: 14px;
    }


    /* ================= SEARCH ================= */

    .zx-search {

      width: 100%;

      padding: 14px 16px;

      margin-bottom: 17px;

      border-radius: 12px;

      border: 1px solid rgba(255,255,255,.09);

      outline: none;

      background: #090d16;

      color: #fff;

      font-size: 14px;
    }


    /* ================= LIST ================= */

    .zx-list {

      display: grid;

      gap: 11px;
    }


    .zx-row {

      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 15px;

      padding: 17px;

      border-radius: 15px;

      background: #111622;

      border: 1px solid rgba(255,255,255,.06);
    }


    .zx-row-title {

      font-weight: 750;

      overflow-wrap: anywhere;
    }


    .zx-row-sub {

      margin-top: 6px;

      color: #818ba0;

      font-size: 12px;
    }


    .zx-empty,
    .zx-loading {

      padding: 40px 15px;

      text-align: center;

      color: #858ea2;
    }


    /* ================= STATUS ================= */

    .zx-status {

      display: inline-flex;

      margin-left: 8px;

      padding: 4px 8px;

      border-radius: 999px;

      font-size: 10px;

      font-weight: 800;
    }


    .zx-status.success {

      background: rgba(34,197,94,.12);

      color: #86efac;
    }


    .zx-status.skipped {

      background: rgba(148,163,184,.12);

      color: #cbd5e1;
    }


    .zx-progress {

      height: 8px;

      margin: 12px 0 20px;

      overflow: hidden;

      border-radius: 99px;

      background: #252b3b;
    }


    .zx-progress-bar {

      height: 100%;

      background:
        linear-gradient(
          90deg,
          #6366f1,
          #22c55e
        );

      transition: width .25s;
    }


    .zx-progress-text {

      margin-bottom: 8px;

      color: #a5b4fc;

      font-size: 13px;
    }


    /* ================= MOBILE ================= */

    @media(max-width:700px) {

      #app {
        padding: 14px;
      }

      .zx-dashboard-grid {
        grid-template-columns: 1fr;
      }

      .zx-row {

        align-items: flex-start;

        flex-direction: column;
      }

      .zx-row .zx-btn {

        width: 100%;
      }

      .zx-top {

        align-items: flex-start;
      }

      .zx-title {
        font-size: 23px;
      }

      .zx-login-card {
        padding: 32px 23px;
      }

    }

  `;

  document.head.appendChild(style);
}


/* =====================================================
   LOGIN
===================================================== */

function showLogin() {

  addPanelStyles();

  const login = $("#login-screen");
  const app = $("#app");

  if (login) {

    login.style.display = "flex";

    login.innerHTML = `

      <div class="zx-login-card">

        <div class="zx-login-logo">
          📝
        </div>

        <div class="zx-login-title">
          Test Uploader
        </div>

        <div class="zx-login-sub">
          Secure Batch Uploader Panel
        </div>

        <form onsubmit="doLogin(event)">

          <label class="zx-login-label">
            Auth Token
          </label>

          <input
            id="auth-token"
            class="zx-login-input"
            type="password"
            placeholder="Enter your auth token"
            autocomplete="off"
          >

          <button
            id="login-button"
            class="zx-login-button"
            type="submit"
          >
            Login
          </button>

          <div id="login-error"></div>

        </form>

      </div>

    `;
  }

  if (app) {
    app.style.display = "none";
  }
}


function showApp() {

  addPanelStyles();

  if ($("#login-screen")) {
    $("#login-screen").style.display = "none";
  }

  if ($("#app")) {
    $("#app").style.display = "block";
  }
}


async function doLogin(event) {

  event?.preventDefault();

  const input = $("#auth-token");
  const button = $("#login-button");
  const error = $("#login-error");

  const authToken =
    input?.value.trim() || "";

  if (!authToken) {

    if (error) {
      error.textContent =
        "Auth Token required";
    }

    return;
  }


  button.disabled = true;
  button.textContent = "Signing in...";


  try {

    const response =
      await fetch(
        `${API()}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              authToken
            })
        }
      );


    const data =
      await response.json();


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
        err.message ||
        "Login failed";
    }

  } finally {

    button.disabled = false;
    button.textContent = "Login";

  }
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

      <div class="zx-title"
           style="font-size:19px">

        What do you want to upload?

      </div>

      <div class="zx-sub">

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

  S.type =
    type === "dpp"
      ? "dpp"
      : "test";

  S.batch = null;
  S.sourceItems = [];


  shell(
    S.type === "test"
      ? "Tests • Select Batch"
      : "DPPs • Select Batch",

    `

    <div class="zx-card">

      <div class="zx-actions">

        <button
          class="zx-btn ${
            S.type === "test"
              ? ""
              : "secondary"
          }"
          onclick="batches('test')"
        >
          📝 Tests
        </button>


        <button
          class="zx-btn ${
            S.type === "dpp"
              ? ""
              : "secondary"
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


      <div id="batch-list">

        <div class="zx-loading">
          Loading batches...
        </div>

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
            .filter(
              x => x.id
            )
        : [];


    let localBatches = [];


    try {

      const localData =
        await req(
          "/api/admin/batches"
        );


      localBatches =
        (localData.batches || [])
          .map(b => ({
            ...b,

            id:
              String(
                b._id ||
                b.id ||
                ""
              ),

            sourceBatchId:
              String(
                b.sourceBatchId ||
                ""
              )
          }));

    } catch (e) {

      console.warn(
        "Local batches unavailable:",
        e.message
      );

    }


    S.batches =
      sourceBatches.map(source => {

        const local =
          localBatches.find(
            b =>
              String(
                b.sourceBatchId
              ) ===
              String(source.id)
          );


        return {

          ...source,

          id:
            String(source.id),

          sourceBatchId:
            String(source.id),

          localId:
            local
              ? String(local.id)
              : "",

          name:
            String(
              source.name ||
              source.title ||
              "Unnamed Batch"
            )

        };

      });


    renderBatches();


  } catch (error) {

    const box =
      $("#batch-list");

    if (box) {

      box.innerHTML = `

        <div class="zx-empty">

          ${escapeHtml(
            error.message
          )}

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

  drawBatchList(
    S.batches
  );

}


function filterBatches() {

  const q =
    (
      $("#batch-search")?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  drawBatchList(
    S.batches.filter(
      b =>
        String(
          b.name || ""
        )
          .toLowerCase()
          .includes(q)
    )
  );

}


function drawBatchList(list) {

  const box =
    $("#batch-list");

  if (!box) return;


  if (!list.length) {

    box.innerHTML = `
      <div class="zx-empty">
        No matching batches found.
      </div>
    `;

    return;
  }


  box.innerHTML =
    list.map(batch => `

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

    `).join("");
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

    alert(
      "Batch not found"
    );

    return;
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


      <div id="item-list">

        <div class="zx-loading">
          Loading...
        </div>

      </div>

    </div>

    `
  );


  try {

    const data =
      await req(endpoint);


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
            .filter(
              i => i.id
            )
        : [];


    /*
      Reset browser status.
      Backend status will be authoritative
      once the upload/status routes are connected.
    */

    S.success = new Set();
    S.skipped = new Set();


    await loadBackendStatus();


    renderContent();


  } catch (error) {

    const box =
      $("#item-list");

    if (box) {

      box.innerHTML = `

        <div class="zx-empty">

          ${escapeHtml(
            error.message
          )}

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


  const type =
    S.type === "dpp"
      ? "dpp"
      : "test";


  try {

    const data =
      await req(
        `/api/admin/source/batches/${encodeURIComponent(srcId)}/${type}/status`
      );


    const uploaded =
      data.uploaded ||
      data.success ||
      data.skipped ||
      data.items ||
      [];


    if (Array.isArray(uploaded)) {

      uploaded.forEach(id => {

        S.skipped.add(
          String(
            typeof id === "object"
              ? id.sourceTestId ||
                id.sourceDppId ||
                id.id
              : id
          )
        );

      });

    }


    if (Array.isArray(data.successIds)) {

      data.successIds.forEach(id => {

        S.success.add(
          String(id)
        );

      });

    }

  } catch (e) {

    /*
      Status endpoint backend me abhi na ho
      to page ko break nahi karna.
    */

    console.warn(
      "Backend status unavailable:",
      e.message
    );

  }
}


/* =====================================================
   CONTENT RENDER
===================================================== */

function renderContent() {

  drawContentList(
    S.sourceItems
  );

}


function filterContent() {

  const q =
    (
      $("#item-search")?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  drawContentList(
    S.sourceItems.filter(
      item =>
        String(
          item.title || ""
        )
          .toLowerCase()
          .includes(q)
    )
  );

}


function drawContentList(list) {

  const box =
    $("#item-list");

  if (!box) return;


  const total =
    S.sourceItems.length;


  const done =
    S.sourceItems.filter(
      item =>
        S.success.has(
          String(item.id)
        ) ||
        S.skipped.has(
          String(item.id)
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

        ${done} / ${total}
        ${
          S.type === "dpp"
            ? "DPPs"
            : "Tests"
        }

        processed

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
    list.map(item => {

      const id =
        String(item.id);


      const success =
        S.success.has(id);


      const skipped =
        S.skipped.has(id);


      const uploading =
        S.uploading.has(id);


      let buttonText =
        "UPLOAD";


      let buttonClass =
        "";


      if (success) {

        buttonText =
          "✓ SUCCESS";

        buttonClass =
          "success";

      } else if (skipped) {

        buttonText =
          "✓ SKIPPED";

        buttonClass =
          "secondary";

      } else if (uploading) {

        buttonText =
          "UPLOADING...";

      }


      const disabled =
        success ||
        skipped ||
        uploading;


      return `

        <div class="zx-row">

          <div>

            <div class="zx-row-title">

              ${escapeHtml(
                item.title
              )}

              ${
                success
                  ? `
                    <span class="zx-status success">
                      SUCCESS
                    </span>
                  `
                  : ""
              }

              ${
                skipped
                  ? `
                    <span class="zx-status skipped">
                      SKIPPED
                    </span>
                  `
                  : ""
              }

            </div>


            <div class="zx-row-sub">

              ID:
              ${escapeHtml(id)}

              ${
                item.totalQuestions
                  ? ` · ${escapeHtml(
                      item.totalQuestions
                    )} questions`
                  : ""
              }

            </div>

          </div>


          <button
            class="zx-btn ${buttonClass}"
            ${
              disabled
                ? "disabled"
                : ""
            }
            onclick="uploadSourceItem('${escapeAttr(id)}')"
          >

            ${buttonText}

          </button>

        </div>

      `;

    }).join("");
}


/* =====================================================
   UPLOAD ALL
===================================================== */

async function uploadAll() {

  if (!S.batch) {

    alert(
      "Batch not selected"
    );

    return;
  }


  const pending =
    S.sourceItems.filter(
      item => {

        const id =
          String(item.id);

        return (
          !S.success.has(id) &&
          !S.skipped.has(id) &&
          !S.uploading.has(id)
        );

      }
    );


  if (!pending.length) {

    alert(
      "All items are already processed."
    );

    return;
  }


  if (
    !confirm(
      `Upload ${pending.length} pending ${
        S.type === "dpp"
          ? "DPPs"
          : "tests"
      }?`
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

    } catch (e) {

      console.error(
        "Upload All stopped:",
        e
      );

      break;
    }

  }

  renderContent();
}


/* =====================================================
   UPLOAD SINGLE ITEM
===================================================== */

async function uploadSourceItem(
  sourceId,
  silent = false
) {

  if (!S.batch) {

    throw new Error(
      "Batch not selected"
    );

  }


  const id =
    String(sourceId);


  if (
    S.success.has(id) ||
    S.skipped.has(id)
  ) {
    return;
  }


  const item =
    S.sourceItems.find(
      i =>
        String(i.id) === id
    );


  if (!item) {

    throw new Error(
      "Item not found"
    );

  }


  S.uploading.add(id);

  renderContent();


  try {

    const type =
      S.type === "dpp"
        ? "dpp"
        : "test";


    /*
      IMPORTANT

      Actual upload route.

      Backend is responsible for:
      - fetching source data
      - saving to MongoDB
      - duplicate detection
      - returning success/skipped
    */

    const result =
      await req(
        `/api/admin/source/batches/${encodeURIComponent(
          S.batch.sourceBatchId ||
          S.batch.id
        )}/${type}/upload`,

        {
          method: "POST",

          body: JSON.stringify({

            sourceId: id,

            title:
              item.title,

            sourceItem:
              item

          })

        }
      );


    const status =
      String(
        result.status ||
        result.result ||
        ""
      ).toLowerCase();


    if (
      status === "skipped" ||
      result.skipped === true
    ) {

      S.skipped.add(id);

    } else {

      S.success.add(id);

    }


    if (!silent) {

      alert(
        status === "skipped" ||
        result.skipped === true

          ? "Already uploaded — SKIPPED"

          : `${
              type === "dpp"
                ? "DPP"
                : "Test"
            } uploaded successfully`
      );

    }


  } catch (error) {

    if (!silent) {

      alert(
        `Upload failed: ${error.message}`
      );

    }

    throw error;


  } finally {

    S.uploading.delete(id);

    renderContent();

  }

}


/* =====================================================
   HELPERS
===================================================== */

function normalizeBatch(item) {

  const id =
    item._id ||
    item.id ||
    item.batchId ||
    item.batch_id;


  return {

    ...item,

    id:
      String(id || ""),

    name:
      String(
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

    id:
      String(id || ""),

    title:
      String(
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

  S.success.clear();
  S.skipped.clear();
  S.uploading.clear();


  showLogin();
}


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

  addPanelStyles();

  if (S.token) {

    showApp();

    home().catch(
      err => {

        console.error(
          "AUTO LOGIN ERROR:",
          err
        );

        logout();

      }
    );

  } else {

    showLogin();

  }

}


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
