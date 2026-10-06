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


async function req(path, opt = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(opt.headers || {})
  };

  if (S.token) {
    headers.Authorization =
      "Bearer " + S.token;
  }

  const r = await fetch(
    API() + path,
    {
      ...opt,
      headers
    }
  );

  const d =
    await r.json().catch(() => ({}));

  if (!r.ok) {
    throw Error(
      d.message ||
      "Request failed"
    );
  }

  return d;
}


/* =====================================================
   LOGIN
   ===================================================== */

function login() {

  document.body.innerHTML = `
    <div class="top">
      <div class="card login">

        <h2>
          Test Uploader Login
        </h2>

        <label class="label">
          Auth Token
        </label>

        <div class="pass">

          <input
            id="tok"
            type="password"
            placeholder="Enter your auth token"
          >

          <button
            class="eye"
            onclick="toggleToken()"
          >
            👁
          </button>

        </div>

        <label class="label">
          Role
        </label>

        <select>
          <option>
            Batch Uploader
          </option>
        </select>

        <button
          class="btn full"
          onclick="doLogin()"
        >
          Login
        </button>

      </div>
    </div>
  `;
}


function toggleToken() {

  const i = $("#tok");

  if (i) {
    i.type =
      i.type === "password"
        ? "text"
        : "password";
  }
}


async function doLogin() {

  try {

    const token =
      $("#tok").value.trim();

    if (!token) {
      return alert(
        "Enter your auth token"
      );
    }


    const r =
      await fetch(
        API() + "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              authToken:
                token
            })
        }
      );


    const d =
      await r.json();


    if (!r.ok) {
      throw Error(
        d.message ||
        "Login failed"
      );
    }


    S.token =
      d.token;


    localStorage.setItem(
      "zx_admin_token",
      S.token
    );


    home();

  } catch (e) {

    alert(
      e.message ||
      "Login failed"
    );

  }
}


/* =====================================================
   SHELL
   ===================================================== */

function shell(
  title,
  body
) {

  document.body.innerHTML = `

    <div class="top">

      <div class="wrap">

        <div class="header">

          <h2>
            ${esc(title)}
          </h2>

          <button
            class="btn red"
            onclick="logout()"
          >
            ↪ Logout
          </button>

        </div>

        ${body}

      </div>

    </div>

  `;
}


/* =====================================================
   HOME
   ===================================================== */

async function home() {

  try {

    const [
      s,
      me
    ] =
      await Promise.all([
        req(
          "/api/admin/stats"
        ),
        req(
          "/api/admin/me"
        )
      ]);


    const isMaster =
      me.user.scope === "all";


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

          🔐
          ${esc(me.user.username)}

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
          <b>
            ${s.batches}
          </b>
        </div>

        <div class="stat">
          Tests<br>
          <b>
            ${s.tests}
          </b>
        </div>

        <div class="stat">
          DPPs<br>
          <b>
            ${s.dpps}
          </b>
        </div>

        <div class="stat">
          Published<br>
          <b>
            ${s.published}
          </b>
        </div>

      </div>


      <div class="tiles">

        <div
          class="tile blue"
          onclick="batches('test')"
        >

          <div class="icon">
            📄
          </div>

          <h2>
            Tests
          </h2>

          <p>
            Upload regular tests
          </p>

        </div>


        <div
          class="tile green"
          onclick="batches('dpp')"
        >

          <div class="icon">
            📚
          </div>

          <h2>
            DPPs
          </h2>

          <p>
            Upload daily practice problems
          </p>

        </div>

      </div>

      `
    );

  } catch (e) {

    console.error(e);

    logout();

  }
}


/* =====================================================
   SOURCE BATCHES
   ===================================================== */

async function batches(type) {

  try {

    S.type =
      type;


    /*
      IMPORTANT:
      Batches now come from the
      authorized source account.
    */

    const data =
      await req(
        "/api/admin/source/batches"
      );


    console.log(
      "SOURCE BATCH RESPONSE:",
      data
    );


    S.batches =
      normalizeBatches(
        data
      );


    shell(
      type === "test"
        ? "Your Tests Batches"
        : "Your DPP Batches",

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

      </div>


      <div
        id="list"
      ></div>

      `
    );


    drawBatches();

  } catch (e) {

    console.error(e);

    alert(
      e.message ||
      "Failed to load source batches"
    );

  }
}


/* =====================================================
   NORMALIZE BATCH RESPONSE
   ===================================================== */

function normalizeBatches(data) {

  let list = [];


  if (
    Array.isArray(data)
  ) {

    list =
      data;

  } else if (
    Array.isArray(data.batches)
  ) {

    list =
      data.batches;

  } else if (
    Array.isArray(data.data)
  ) {

    list =
      data.data;

  } else if (
    data.data &&
    Array.isArray(data.data.batches)
  ) {

    list =
      data.data.batches;

  } else if (
    data.data &&
    Array.isArray(data.data.data)
  ) {

    list =
      data.data.data;

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

        _id:
          String(id || ""),

        name:
          String(name)

      };

    })
    .filter(
      b => b._id
    );
}


/* =====================================================
   DRAW BATCHES
   ===================================================== */

function drawBatches() {

  const q =
    (
      $("#search")?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const list =
    S.batches.filter(
      b =>
        (
          b.name ||
          ""
        )
          .toLowerCase()
          .includes(q)
    );


  const el =
    $("#list");


  if (!el) {
    return;
  }


  el.innerHTML =
    list
      .map(
        b => `

        <div class="row">

          <div>

            <b>
              ${esc(b.name)}
            </b>

            <small>
              ${
                esc(
                  b.language ||
                  b.status ||
                  ""
                )
              }
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

        `
      )
      .join("");


  if (!list.length) {

    el.innerHTML =
      "<p>No batches found.</p>";

  }
}


/* =====================================================
   OLD LOCAL BATCH MANAGEMENT
   MASTER ONLY
   ===================================================== */

function newBatch() {

  modal(`

    <h3>
      Add Local Batch
    </h3>

    <label class="label">
      Batch Name
    </label>

    <input
      id="bn"
    >


    <label class="label">
      Category
    </label>

    <select id="bc">

      <option>
        Boards Level Tests
      </option>

      <option>
        JEE Tests
      </option>

      <option>
        NEET Tests
      </option>

      <option>
        DROPPER Tests
      </option>

      <option>
        Other Batch Tests
      </option>

    </select>


    <label class="label">
      Subgroup
    </label>

    <input
      id="bs"
    >


    <label class="label">
      Language
    </label>

    <select id="bl">

      <option>
        Hindi
      </option>

      <option>
        English
      </option>

      <option>
        Hinglish
      </option>

    </select>


    <label class="label">
      Status
    </label>

    <select id="bt">

      <option>
        Paid
      </option>

      <option>
        Unpaid
      </option>

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

        method:
          "POST",

        body:
          JSON.stringify({

            name:
              $("#bn").value,

            category:
              $("#bc").value,

            subgroup:
              $("#bs").value,

            language:
              $("#bl").value,

            status:
              $("#bt").value

          })

      }
    );


    closeModal();

    batches(
      S.type
    );

  } catch (e) {

    alert(
      e.message
    );

  }
}


async function manageBatches() {

  /*
    Master can still create
    local batches if needed.
  */

  batches("test");

}


/* =====================================================
   TOKEN MANAGEMENT
   ===================================================== */

async function manageTokens() {

  try {

    const [
      bs,
      ts
    ] =
      await Promise.all([

        req(
          "/api/admin/batches"
        ),

        req(
          "/api/admin/uploader-tokens"
        )

      ]);


    const localBatches =
      bs.batches || [];


    const tokens =
      ts.tokens || [];


    const list =
      tokens
        .map(
          t => `

          <div class="row">

            <div>

              <b>
                ${esc(t.name)}
              </b>

              <small>

                ${
                  t.batches.length
                }

                assigned batch(es):

                ${
                  t.batches
                    .map(
                      b =>
                        esc(b.name)
                    )
                    .join(", ")
                }

              </small>

            </div>

          </div>

          `
        )
        .join("");


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
          localBatches
            .map(
              b => `

              <option
                value="${escAttr(b._id)}"
              >
                ${esc(b.name)}
              </option>

              `
            )
            .join("")
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

    alert(
      e.message
    );

  }
}


async function createToken() {

  try {

    const ids =
      Array.from(
        $("#tb").selectedOptions
      )
        .map(
          o =>
            o.value
        );


    if (!ids.length) {

      throw Error(
        "Select at least one batch"
      );

    }


    const d =
      await req(
        "/api/admin/uploader-tokens",
        {

          method:
            "POST",

          body:
            JSON.stringify({

              name:
                $("#tn").value ||
                "Batch Uploader",

              batchIds:
                ids

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

    alert(
      e.message
    );

  }
}


/* =====================================================
   SOURCE CONTENT
   ===================================================== */

async function content(
  sourceBatchId
) {

  try {

    S.batch =
      S.batches.find(
        b =>
          String(b._id) ===
          String(sourceBatchId)
      );


    if (!S.batch) {

      throw Error(
        "Batch not found"
      );

    }


    const endpoint =
      S.type === "test"
        ? `/api/admin/source/batches/${encodeURIComponent(
            sourceBatchId
          )}/tests`
        : `/api/admin/source/batches/${encodeURIComponent(
            sourceBatchId
          )}/dpps`;


    const data =
      await req(
        endpoint
      );


    console.log(
      "SOURCE CONTENT RESPONSE:",
      data
    );


    const items =
      normalizeItems(
        data
      );


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
          ${esc(
            S.batch.name
          )}
        </b>


        <div class="notice">

          Available:
          ${items.length}

        </div>


        <div id="items">

          ${
            items.length
              ? items
                  .map(
                    itemRow
                  )
                  .join("")
              : "<p>No content available.</p>"
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
   NORMALIZE TEST / DPP RESPONSE
   ===================================================== */

function normalizeItems(
  data
) {

  let list = [];


  if (
    Array.isArray(data)
  ) {

    list =
      data;

  } else if (
    Array.isArray(data.items)
  ) {

    list =
      data.items;

  } else if (
    Array.isArray(data.tests)
  ) {

    list =
      data.tests;

  } else if (
    Array.isArray(data.dpps)
  ) {

    list =
      data.dpps;

  } else if (
    Array.isArray(data.data)
  ) {

    list =
      data.data;

  } else if (
    data.data &&
    Array.isArray(
      data.data.items
    )
  ) {

    list =
      data.data.items;

  } else if (
    data.data &&
    Array.isArray(
      data.data.tests
    )
  ) {

    list =
      data.data.tests;

  } else if (
    data.data &&
    Array.isArray(
      data.data.dpps
    )
  ) {

    list =
      data.data.dpps;

  }


  return list.map(
    (x, index) => ({

      ...x,

      _sourceId:
        String(
          x._id ||
          x.id ||
          x.testId ||
          x.dppId ||
          ""
        ),

      _title:
        String(
          x.title ||
          x.name ||
          x.testName ||
          x.dppName ||
          `Item ${index + 1}`
        )

    })
  )
  .filter(
    x =>
      x._sourceId
  );
}


/* =====================================================
   ITEM ROW
   ===================================================== */

function itemRow(x) {

  return `

    <div class="row">

      <div>

        <b>
          ${esc(x._title)}
        </b>


        <small>

          ${
            x.totalQuestions ||
            x.questionCount ||
            (
              Array.isArray(
                x.questions
              )
                ? x.questions.length
                : 0
            ) ||
            0
          }

          Questions

        </small>

      </div>


      <div class="actions">

        <button
          class="btn green"
          onclick="uploadSourceItem('${escAttr(
            x._sourceId
          )}')"
        >
          Upload
        </button>

      </div>

    </div>

  `;
}


/* =====================================================
   SOURCE ITEM DETAILS
   ===================================================== */

async function uploadSourceItem(
  sourceId
) {

  try {

    if (!sourceId) {

      throw Error(
        "Invalid source item ID"
      );

    }


    const data =
      await req(
        `/api/admin/source/tests/${encodeURIComponent(
          sourceId
        )}`
      );


    console.log(
      "SOURCE ITEM DETAILS:",
      data
    );


    const item =
      extractDetails(
        data
      );


    if (!item) {

      throw Error(
        "Test details not found"
      );

    }


    const questions =
      extractQuestions(
        item
      );


    if (!Array.isArray(
      questions
    )) {

      throw Error(
        "Questions were not found in source response"
      );

    }


    const title =
      item.title ||
      item.name ||
      item.testName ||
      "Imported Test";


    await req(

      `/api/admin/batches/${encodeURIComponent(
        S.batch._id
      )}/content/${S.type}`,

      {

        method:
          "POST",

        body:
          JSON.stringify({

            title,

            startTime:
              item.startTime ||
              item.startDate ||
              null,

            instructions:
              item.instructions ||
              "",

            questions,

            published:
              true

          })

      }

    );


    alert(
      "Uploaded successfully"
    );


    content(
      S.batch._id
    );

  } catch (e) {

    console.error(e);

    alert(
      e.message ||
      "Upload failed"
    );

  }
}


/* =====================================================
   EXTRACT DETAILS
   ===================================================== */

function extractDetails(
  data
) {

  if (
    data &&
    data.data &&
    !Array.isArray(
      data.data
    )
  ) {

    if (
      data.data.test
    ) {

      return data.data.test;

    }

    if (
      data.data.dpp
    ) {

      return data.data.dpp;

    }

    return data.data;

  }


  if (
    data &&
    data.test
  ) {

    return data.test;

  }


  if (
    data &&
    data.dpp
  ) {

    return data.dpp;

  }


  return data;
}


/* =====================================================
   EXTRACT QUESTIONS
   ===================================================== */

function extractQuestions(
  item
) {

  if (
    Array.isArray(
      item.questions
    )
  ) {

    return item.questions;

  }


  if (
    item.data &&
    Array.isArray(
      item.data.questions
    )
  ) {

    return item.data.questions;

  }


  if (
    item.test &&
    Array.isArray(
      item.test.questions
    )
  ) {

    return item.test.questions;

  }


  if (
    item.dpp &&
    Array.isArray(
      item.dpp.questions
    )
  ) {

    return item.dpp.questions;

  }


  return [];
}


/* =====================================================
   OLD MANUAL IMPORT
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

    <textarea
      id="ci"
    ></textarea>


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
      JSON.parse(
        text
      );


    if (
      !Array.isArray(
        questions
      )
    ) {

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

        method:
          "POST",

        body:
          JSON.stringify({

            title:
              $("#ct").value,

            startTime:
              $("#cs").value ||
              null,

            instructions:
              $("#ci").value,

            questions,

            published:
              true

          })

      }

    );


    closeModal();


    content(
      S.batch._id
    );

  } catch (e) {

    alert(
      e.message
    );

  }
}


/* =====================================================
   PUBLISH
   ===================================================== */

async function publish(
  id
) {

  try {

    await req(
      "/api/admin/content/" +
      id +
      "/publish",
      {
        method:
          "POST"
      }
    );


    content(
      S.batch._id
    );

  } catch (e) {

    alert(
      e.message
    );

  }
}


/* =====================================================
   MODAL
   ===================================================== */

function modal(
  html
) {

  const m =
    document.createElement(
      "div"
    );


  m.id =
    "modal";

  m.className =
    "modal";


  m.innerHTML = `

    <div class="card">

      <div
        style="text-align:right"
      >

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


  document.body.appendChild(
    m
  );
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


  S.token =
    "";


  login();

}


/* =====================================================
   ESCAPE
   ===================================================== */

function esc(v) {

  return String(
    v ?? ""
  )
    .replace(
      /[&<>\"']/g,
      m => ({

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        "\"":
          "&quot;",

        "'":
          "&#039;"

      }[m])
    );

}


function escAttr(v) {

  return String(
    v ?? ""
  )
    .replace(
      /['\\]/g,
      m =>
        "\\" + m
    );

}


/* =====================================================
   GLOBALS
   ===================================================== */

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

    uploadSourceItem,

    newContent,

    saveContent,

    publish,

    modal,

    closeModal,

    toggleToken

  }
);


/* =====================================================
   START
   ===================================================== */

if (S.token) {

  home();

} else {

  login();

}
