const $ = s => document.querySelector(s);

const S = {
  token: localStorage.getItem("zx_admin_token") || "",
  type: "test",
  batch: null,
  batches: []
};

const API = () =>
  ((window.ZX_CONFIG && window.ZX_CONFIG.API_BASE) || "").replace(/\/$/, "");

async function req(path, opt = {}) {
  const headers = {
    "Content-Type": "application/json",
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

  if (!r.ok) {
    throw Error(d.message || "Request failed");
  }

  return d;
}

function login() {
  document.body.innerHTML = `
    <div class="top">
      <div class="card login">
        <h2>Test Uploader Login</h2>

        <label class="label">Auth Token</label>

        <div class="pass">
          <input
            id="tok"
            type="password"
            placeholder="Enter your auth token"
          >
          <button class="eye" onclick="toggleToken()">👁</button>
        </div>

        <label class="label">Role</label>

        <select>
          <option>Batch Uploader</option>
        </select>

        <button class="btn full" onclick="doLogin()">Login</button>
      </div>
    </div>
  `;
}

function toggleToken() {
  const i = $("#tok");

  if (i) {
    i.type = i.type === "password" ? "text" : "password";
  }
}

async function doLogin() {
  try {
    const token = $("#tok").value.trim();

    if (!token) {
      return alert("Enter your auth token");
    }

    const r = await fetch(API() + "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        authToken: token
      })
    });

    const d = await r.json();

    if (!r.ok) {
      throw Error(d.message || "Login failed");
    }

    S.token = d.token;

    localStorage.setItem(
      "zx_admin_token",
      S.token
    );

    home();

  } catch (e) {
    alert(e.message || "Login failed");
  }
}

function shell(title, body) {
  document.body.innerHTML = `
    <div class="top">
      <div class="wrap">

        <div class="header">
          <h2>${title}</h2>

          <button class="btn red" onclick="logout()">
            ↪ Logout
          </button>
        </div>

        ${body}

      </div>
    </div>
  `;
}

async function home() {
  try {

    const [s, me] = await Promise.all([
      req("/api/admin/stats"),
      req("/api/admin/me")
    ]);

    const isMaster = me.user.scope === "all";

    shell(
      "Test Series Uploader",

      `
      <div class="hero">

        <h1>
          Test Series<br>
          Uploader
        </h1>

        <p>
          Upload and manage your test series content
        </p>

        <div class="scope">
          🔐 ${esc(me.user.username)}
          •
          ${isMaster ? "All batches" : "Assigned batches only"}
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
                ⚙ Manage Batches
              </button>

              <button
                class="btn gray"
                onclick="manageTokens()"
              >
                🔑 Uploader Tokens
              </button>

            </div>
          `
          : ""
      }

      <div class="stats">

        <div class="stat">
          Batches<br>
          <b>${s.batches}</b>
        </div>

        <div class="stat">
          Tests<br>
          <b>${s.tests}</b>
        </div>

        <div class="stat">
          DPPs<br>
          <b>${s.dpps}</b>
        </div>

        <div class="stat">
          Published<br>
          <b>${s.published}</b>
        </div>

      </div>

      <div class="tiles">

        <div
          class="tile blue"
          onclick="batches('test')"
        >
          <div class="icon">📄</div>
          <h2>Tests</h2>
          <p>Upload regular tests</p>
        </div>

        <div
          class="tile green"
          onclick="batches('dpp')"
        >
          <div class="icon">📚</div>
          <h2>DPPs</h2>
          <p>Upload daily practice problems</p>
        </div>

      </div>
      `
    );

  } catch (e) {
    logout();
  }
}

async function batches(type) {

  try {

    S.type = type;

    const data = await req(
      "/api/admin/batches"
    );

    S.batches = data.batches || [];

    const me = await req(
      "/api/admin/me"
    );

    shell(
      "Your Batches",

      `
      <button
        class="btn gray"
        onclick="home()"
      >
        ← Back to Dashboard
      </button>

      <div class="bar">

        <input
          id="search"
          placeholder="Search batches..."
          oninput="drawBatches()"
        >

        ${
          me.user.scope === "all"
            ? `
              <button
                class="btn green"
                onclick="newBatch()"
              >
                + Add Batch
              </button>
            `
            : ""
        }

      </div>

      <div id="list"></div>
      `
    );

    drawBatches();

  } catch (e) {
    alert(e.message);
  }
}

function drawBatches() {

  const q =
    ($("#search")?.value || "").toLowerCase();

  const list = S.batches.filter(
    b =>
      (b.name || "")
        .toLowerCase()
        .includes(q)
  );

  $("#list").innerHTML =
    list.map(
      b => `
      <div class="row">

        <div>
          <b>${esc(b.name)}</b>

          <small>
            Status: ${esc(b.status)}
            •
            ${esc(b.language || "")}
          </small>
        </div>

        <div class="actions">

          <button
            class="btn"
            onclick="content('${b._id}')"
          >
            View ${
              S.type === "test"
                ? "Tests"
                : "DPPs"
            }
          </button>

        </div>

      </div>
      `
    ).join("") ||
    "<p>No batches assigned to this token.</p>";
}

function newBatch() {

  modal(`

    <h3>Add Batch</h3>

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

    closeModal();

    batches(S.type);

  } catch (e) {

    alert(e.message);

  }
}

async function manageBatches() {
  batches("test");
}

async function manageTokens() {

  try {

    const [bs, ts] = await Promise.all([
      req("/api/admin/batches"),
      req("/api/admin/uploader-tokens")
    ]);

    const batches =
      bs.batches || [];

    const tokens =
      ts.tokens || [];

    const list =
      tokens.map(
        t => `
        <div class="row">

          <div>

            <b>
              ${esc(t.name)}
            </b>

            <small>
              ${t.batches.length}
              assigned batch(es):
              ${t.batches
                .map(b => esc(b.name))
                .join(", ")}
            </small>

          </div>

        </div>
        `
      ).join("");

    modal(`

      <h3>
        Create Scoped Uploader Token
      </h3>

      <p class="muted">
        This token will automatically
        show only the batches you select.
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
          batches.map(
            b => `
            <option value="${b._id}">
              ${esc(b.name)}
            </option>
            `
          ).join("")
        }

      </select>

      <button
        class="btn green full"
        onclick="createToken()"
      >
        Create Token
      </button>

      <hr>

      <h3>
        Existing Tokens
      </h3>

      ${
        list ||
        "<p>No scoped tokens yet.</p>"
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
      ).map(
        o => o.value
      );

    if (!ids.length) {
      throw Error(
        "Select at least one batch"
      );
    }

    const d = await req(
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

async function content(id) {

  try {

    S.batch =
      S.batches.find(
        b => b._id === id
      );

    const d =
      await req(
        "/api/admin/batches/" +
        id +
        "/content/" +
        S.type
      );

    const items =
      d.items || [];

    const me =
      await req(
        "/api/admin/me"
      );

    const rows =
      items.map(itemRow).join("");

    const add =
      me.user.scope === "all"
        ? `
          <button
            class="btn green"
            style="margin-left:8px"
            onclick="newContent()"
          >
            + Import ${
              S.type === "test"
                ? "Test"
                : "DPP"
            }
          </button>
        `
        : "";

    shell(
      "Available " +
      (
        S.type === "test"
          ? "Tests"
          : "DPPs"
      ),

      `
      <button
        class="btn gray"
        onclick="batches('${S.type}')"
      >
        ← Back to Batches
      </button>

      ${add}

      <div class="card">

        <b>
          ${esc(S.batch.name)}
        </b>

        <div class="notice">
          Available: ${items.length}
          •
          Uploaded:
          ${
            items.filter(
              x => x.published
            ).length
          }
        </div>

        <div id="items">

          ${
            rows ||
            "<p>No content available yet.</p>"
          }

        </div>

      </div>
      `
    );

  } catch (e) {

    alert(e.message);

  }
}

function itemRow(x) {

  return `
  <div class="row">

    <div>

      <b>
        ${esc(x.title)}
      </b>

      <small>
        Questions:
        ${x.totalQuestions || 0}

        ${
          x.startTime
            ? " • Start Time: " +
              new Date(
                x.startTime
              ).toLocaleString()
            : ""
        }

      </small>

    </div>

    <div class="actions">

      ${
        x.published

          ? `
            <span class="btn green">
              ✓ Uploaded
            </span>
          `

          : `
            <button
              class="btn green"
              onclick="publish('${x._id}')"
            >
              Upload ${
                S.type === "test"
                  ? "Test"
                  : "DPP"
              }
            </button>
          `
      }

    </div>

  </div>
  `;
}

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

    const text =
      await f.text();

    const questions =
      JSON.parse(text);

    if (!Array.isArray(questions)) {
      throw Error(
        "JSON must contain an array of questions"
      );
    }

    await req(
      "/api/admin/batches/" +
      S.batch._id +
      "/content/" +
      S.type,
      {
        method: "POST",

        body: JSON.stringify({

          title:
            $("#ct").value,

          startTime:
            $("#cs").value ||
            null,

          instructions:
            $("#ci").value,

          questions,

          published: true

        })
      }
    );

    closeModal();

    content(
      S.batch._id
    );

  } catch (e) {

    alert(e.message);

  }
}

async function publish(id) {

  await req(
    "/api/admin/content/" +
    id +
    "/publish",
    {
      method: "POST"
    }
  );

  content(
    S.batch._id
  );
}

function modal(html) {

  const m =
    document.createElement("div");

  m.id = "modal";
  m.className = "modal";

  m.innerHTML = `
    <div class="card">

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

function logout() {

  localStorage.removeItem(
    "zx_admin_token"
  );

  S.token = "";

  login();
}

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

Object.assign(
  window,
  {
    doLogin,
    login,
    home,
    logout,
    batches,
    drawBatches,
    newBatch,
    saveBatch,
    manageBatches,
    manageTokens,
    createToken,
    content,
    newContent,
    saveContent,
    publish,
    modal,
    closeModal,
    toggleToken
  }
);

if (S.token) {
  home();
} else {
  login();
}
