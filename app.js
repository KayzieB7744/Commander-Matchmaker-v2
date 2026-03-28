let DECKS = [];
let podSeed = Date.now();
let duelSeed = Date.now() + 12345;

const $ = (id) => document.getElementById(id);

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const rng = mulberry32(seed || 1);
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function deckCard(deck) {
  return `
    <article class="deck-card">
      <div class="deck-title">${deck.preconName}</div>
      <div class="deck-sub">${deck.setName} • ${deck.code} • ${deck.release}</div>
      <div class="meta">
        <span class="pill">Power ${deck.power}</span>
        <span class="pill">Bracket ${deck.bracket}</span>
        <span class="pill">${deck.speed}</span>
        <span class="pill">${deck.archetype}</span>
        <span class="pill">${deck.tags}</span>
        ${deck.commanderMana ? `<span class="pill">${deck.commanderMana}</span>` : ""}
      </div>
    </article>
  `;
}

function renderEmpty(el, text) {
  el.innerHTML = `<div class="empty">${text}</div>`;
}

function uniqueValues(key) {
  return [...new Set(DECKS.map((d) => d[key]).filter(Boolean))].sort();
}

function populateArchetypes() {
  const sel = $("deckArchetype");
  if (!sel) return;

  sel.innerHTML = `<option value="">All</option>`;

  uniqueValues("archetype").forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    sel.appendChild(opt);
  });
}

function filterDecks(filters) {
  return DECKS.filter((deck) => {
    const bracketOk = filters.bracket
      ? Number(deck.bracket) === Number(filters.bracket)
      : true;

    const powerOk =
      Number(deck.power) >= Number(filters.minPower) &&
      Number(deck.power) <= Number(filters.maxPower);

    const speedOk = filters.avoidFast ? deck.speed !== "fast" : true;

    return bracketOk && powerOk && speedOk;
  });
}

function renderDeckList() {
  const q = ($("searchInput")?.value || "").trim().toLowerCase();
  const bracket = $("deckBracket")?.value || "";
  const speed = $("deckSpeed")?.value || "";
  const archetype = $("deckArchetype")?.value || "";

  const list = DECKS.filter((deck) => {
    const text = [
      deck.preconName,
      deck.setName,
      deck.code,
      deck.tags,
      deck.archetype,
      deck.commanderMana || "",
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!q || text.includes(q)) &&
      (!bracket || Number(deck.bracket) === Number(bracket)) &&
      (!speed || deck.speed === speed) &&
      (!archetype || deck.archetype === archetype)
    );
  });

  const deckCount = $("deckCount");
  const deckList = $("deckList");

  if (deckCount) {
    deckCount.textContent = `${list.length} deck${list.length === 1 ? "" : "s"} shown`;
  }

  if (!deckList) return;

  if (!list.length) {
    renderEmpty(deckList, "No decks match those filters.");
    return;
  }

  deckList.innerHTML = list.map(deckCard).join("");
}

function buildPod() {
  const filters = {
    bracket: $("podBracket")?.value || "",
    minPower: Number($("podMinPower")?.value || 1),
    maxPower: Number($("podMaxPower")?.value || 10),
    avoidFast: ($("podAvoidFast")?.value || "no") === "yes",
  };

  const size = Number($("podSize")?.value || 4);
  const pool = filterDecks(filters);

  const podStatus = $("podStatus");
  const podResults = $("podResults");

  if (podStatus) {
    podStatus.textContent = `${pool.length} eligible deck${pool.length === 1 ? "" : "s"}`;
  }

  if (!podResults) return;

  if (pool.length < size) {
    renderEmpty(
      podResults,
      `Only ${pool.length} eligible deck${pool.length === 1 ? "" : "s"} found. Widen the filters or reduce pod size.`
    );
    return;
  }

  const pod = seededShuffle(pool, podSeed).slice(0, size);
  podResults.innerHTML = pod.map(deckCard).join("");
}

function buildDuel() {
  const filters = {
    bracket: $("duelBracket")?.value || "",
    minPower: Number($("duelMinPower")?.value || 1),
    maxPower: Number($("duelMaxPower")?.value || 10),
    avoidFast: ($("duelAvoidFast")?.value || "no") === "yes",
  };

  const pool = filterDecks(filters);

  const duelStatus = $("duelStatus");
  const duelResults = $("duelResults");

  if (duelStatus) {
    duelStatus.textContent = `${pool.length} eligible deck${pool.length === 1 ? "" : "s"}`;
  }

  if (!duelResults) return;

  if (pool.length < 2) {
    renderEmpty(duelResults, "Need at least 2 eligible decks.");
    return;
  }

  const duel = seededShuffle(pool, duelSeed).slice(0, 2);
  duelResults.innerHTML = duel.map(deckCard).join("");
}

function wireTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");

      const tabId = btn.dataset.tab;
      const panel = document.getElementById(tabId);
      if (panel) panel.classList.add("active");
    });
  });
}

function wireEvents() {
  ["searchInput", "deckBracket", "deckSpeed", "deckArchetype"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", renderDeckList);
    if (el) el.addEventListener("change", renderDeckList);
  });

  ["podBracket", "podMinPower", "podMaxPower", "podAvoidFast", "podSize"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", buildPod);
    if (el) el.addEventListener("change", buildPod);
  });

  ["duelBracket", "duelMinPower", "duelMaxPower", "duelAvoidFast"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", buildDuel);
    if (el) el.addEventListener("change", buildDuel);
  });

  const rerollPodBtn = $("rerollPodBtn");
  if (rerollPodBtn) {
    rerollPodBtn.addEventListener("click", () => {
      podSeed = Math.floor(Math.random() * 1_000_000_000);
      buildPod();
    });
  }

  const rerollDuelBtn = $("rerollDuelBtn");
  if (rerollDuelBtn) {
    rerollDuelBtn.addEventListener("click", () => {
      duelSeed = Math.floor(Math.random() * 1_000_000_000);
      buildDuel();
    });
  }
}

async function init() {
  try {
    const res = await fetch(`decks.json?t=${Date.now()}`);
    if (!res.ok) {
      throw new Error(`Failed to load decks.json (${res.status})`);
    }

    DECKS = await res.json();

    populateArchetypes();
    wireTabs();
    wireEvents();

    renderDeckList();
    buildPod();
    buildDuel();
  } catch (err) {
    console.error(err);

    const deckList = $("deckList");
    const podResults = $("podResults");
    const duelResults = $("duelResults");

    if (deckList) renderEmpty(deckList, "Could not load deck data.");
    if (podResults) renderEmpty(podResults, "Could not load deck data.");
    if (duelResults) renderEmpty(duelResults, "Could not load deck data.");
  }
}

init();
