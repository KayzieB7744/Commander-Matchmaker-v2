const DATA_URL = "decks.json";

let allDecks = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rawDecks = await response.json();

    allDecks = rawDecks
      .map(normalizeDeck)
      .filter((deck) => deck && deck.deckName);

    initControls();
    refreshAll();
  } catch (error) {
    console.error("Failed to load decks.json", error);
    showError("Failed to load deck data. Please check decks.json and app.js.");
  }
});

function normalizeDeck(deck) {
  const deckName =
    deck.deckName ||
    deck.preconName ||
    deck.name ||
    "";

  const power = toNumber(deck.power, 0);
  const bracket = toInt(deck.bracket, 0);
  const gameSpeedRaw = deck.gameSpeed || deck.speed || "Medium";
  const threatRaw = deck.threatPerception || deck.threat || null;
  const upgradeFrom = deck.upgradeFrom || "";

  let deckType =
    deck.deckType ||
    deck.type ||
    deck.source ||
    (deck.preconName ? "Precon" : (upgradeFrom ? "Upgraded Precon" : "Homebrew"));

  deckType = normalizeDeckType(deckType);

  return {
    include: toInclude(deck.include),
    releaseDate: deck.releaseDate || deck.release || "",
    code: deck.code || "",
    setName: deck.setName || "",
    deckName,
    commander: deck.commander || "",
    commanderMana: deck.commanderMana || "",
    power,
    bracket,
    gameSpeed: normalizeGameSpeed(gameSpeedRaw),
    threatPerception: normalizeThreatPerception(
      threatRaw || deriveThreatPerception(power, bracket, deckType)
    ),
    archetype: deck.archetype || "",
    tags: deck.tags || "",
    deckType,
    version: deck.version || "",
    upgradeFrom
  };
}

function normalizeDeckType(value) {
  const v = String(value || "").trim().toLowerCase();

  if (v === "precon") return "Precon";
  if (v === "homebrew") return "Homebrew";
  if (v === "upgraded precon") return "Upgraded Precon";
  if (v === "optimized") return "Optimized";
  if (v === "cedh") return "cEDH";
  if (v === "hbw") return "Homebrew";
  if (v === "other") return "Homebrew";

  return "Homebrew";
}

function normalizeGameSpeed(value) {
  const v = String(value || "").trim().toLowerCase();

  if (v === "slow") return "Slow";
  if (v === "medium" || v === "mid") return "Medium";
  if (v === "fast") return "Fast";

  return "Medium";
}

function normalizeThreatPerception(value) {
  const v = String(value || "").trim().toLowerCase();

  if (v === "low") return "Low";
  if (v === "medium") return "Medium";
  if (v === "high") return "High";
  if (v === "very high") return "Very High";

  return "Medium";
}

function deriveThreatPerception(power, bracket, deckType) {
  if (deckType === "Precon" && power <= 5.5) return "Medium";
  if (bracket <= 2) return "Medium";
  if (bracket === 3) return power >= 6.5 ? "High" : "Medium";
  if (bracket >= 4) return power >= 7.5 ? "Very High" : "High";
  return "Medium";
}

function toInclude(value) {
  if (value === 1 || value === "1" || value === true) return 1;
  if (value === 0 || value === "0" || value === false) return 0;
  return 1;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function initControls() {
  bind("pod-generate", generatePod);
  bind("pod-reroll", rerollPod);
  bind("duel-generate", generateDuel);
  bind("duel-reroll", rerollDuel);

  [
    "pod-bracket",
    "pod-min-power",
    "pod-max-power",
    "pod-avoid-fast",
    "pod-size",
    "pod-deck-type",
    "pod-threat-filter",
    "pod-max-high-threat",
    "duel-bracket",
    "duel-min-power",
    "duel-max-power",
    "duel-avoid-fast",
    "duel-deck-type",
    "duel-threat-filter",
    "duel-avoid-threat-mismatch"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", refreshAll);
    }
  });

  const podSizeEl = document.getElementById("pod-size");
  const maxHighThreatEl = document.getElementById("pod-max-high-threat");

  if (podSizeEl && maxHighThreatEl) {
    maxHighThreatEl.value = podSizeEl.value;
    podSizeEl.addEventListener("change", () => {
      maxHighThreatEl.value = podSizeEl.value;
      refreshAll();
    });
  }
}

function bind(id, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("click", handler);
  }
}

function rerollPod() {
  generatePod();
}

function rerollDuel() {
  generateDuel();
}

function refreshAll() {
  generatePod();
  generateDuel();
}

function generatePod() {
  const settings = {
    bracket: toInt(valueOf("pod-bracket"), 3),
    minPower: toNumber(valueOf("pod-min-power"), 6),
    maxPower: toNumber(valueOf("pod-max-power"), 7),
    avoidFast: valueOf("pod-avoid-fast") === "yes",
    podSize: toInt(valueOf("pod-size"), 4),
    deckType: valueOf("pod-deck-type") || "any",
    threatFilter: valueOf("pod-threat-filter") || "any",
    maxHighThreat: toInt(
      valueOf("pod-max-high-threat"),
      toInt(valueOf("pod-size"), 4)
    )
  };

  const eligible = allDecks.filter((deck) => isEligibleForPod(deck, settings));

  setText("pod-eligible-count", String(eligible.length));
  setText("pod-pool", hasHomebrews() ? "Precons + Homebrews" : "Precons only");

  const picks = pickBalancedPod(eligible, settings);
  renderPodResults(picks);
}

function isEligibleForPod(deck, settings) {
  if (deck.include !== 1) return false;
  if (!deck.deckName) return false;
  if (deck.bracket !== settings.bracket) return false;
  if (deck.power < settings.minPower || deck.power > settings.maxPower) return false;
  if (settings.avoidFast && deck.gameSpeed === "Fast") return false;
  if (settings.deckType !== "any" && deck.deckType !== settings.deckType) return false;
  if (!passesThreatFilter(deck, settings.threatFilter)) return false;
  return true;
}

function pickBalancedPod(eligible, settings) {
  const shuffled = shuffleArray(eligible);
  const picks = [];

  for (const deck of shuffled) {
    if (picks.length >= settings.podSize) break;
    if (picks.some((picked) => picked.deckName === deck.deckName)) continue;
    if (!isSpeedCompatibleWithPod(deck, picks)) continue;
    if (!passesHighThreatCap(deck, picks, settings.maxHighThreat)) continue;

    picks.push(deck);
  }

  return picks;
}

function isSpeedCompatibleWithPod(candidate, picks) {
  if (picks.length === 0) return true;

  const speeds = picks.map((d) => d.gameSpeed);
  const all = [...speeds, candidate.gameSpeed];

  const hasSlow = all.includes("Slow");
  const hasFast = all.includes("Fast");

  return !(hasSlow && hasFast);
}

function passesHighThreatCap(candidate, picks, maxHighThreat) {
  const currentHighThreat = picks.filter(isHighThreat).length;
  const nextHighThreat = currentHighThreat + (isHighThreat(candidate) ? 1 : 0);
  return nextHighThreat <= maxHighThreat;
}

function isHighThreat(deck) {
  return deck.threatPerception === "High" || deck.threatPerception === "Very High";
}

function renderPodResults(picks) {
  const names = ["pod-pick-1", "pod-pick-2", "pod-pick-3", "pod-pick-4"];
  const threats = [
    "pod-pick-1-threat",
    "pod-pick-2-threat",
    "pod-pick-3-threat",
    "pod-pick-4-threat"
  ];
  const details = [
    "pod-pick-1-meta",
    "pod-pick-2-meta",
    "pod-pick-3-meta",
    "pod-pick-4-meta"
  ];

  for (let i = 0; i < 4; i += 1) {
    const deck = picks[i] || null;
    setText(names[i], deck ? deck.deckName : "");
    setText(threats[i], deck ? deck.threatPerception : "");
    setText(
      details[i],
      deck
        ? `${deck.setName} • ${deck.commanderMana} • ${deck.power.toFixed(1)} • ${deck.gameSpeed} • ${deck.deckType}`
        : ""
    );
  }
}

function generateDuel() {
  const settings = {
    bracket: toInt(valueOf("duel-bracket"), 3),
    minPower: toNumber(valueOf("duel-min-power"), 6),
    maxPower: toNumber(valueOf("duel-max-power"), 7),
    avoidFast: valueOf("duel-avoid-fast") === "yes",
    deckType: valueOf("duel-deck-type") || "any",
    threatFilter: valueOf("duel-threat-filter") || "any",
    avoidThreatMismatch: valueOf("duel-avoid-threat-mismatch") === "yes"
  };

  const eligible = allDecks.filter((deck) => isEligibleForDuel(deck, settings));

  setText("duel-eligible-count", String(eligible.length));
  setText("duel-pool", hasHomebrews() ? "Precons + Homebrews" : "Precons only");

  const picks = pickBalancedDuel(eligible, settings);
  renderDuelResults(picks);
}

function isEligibleForDuel(deck, settings) {
  if (deck.include !== 1) return false;
  if (!deck.deckName) return false;
  if (deck.bracket !== settings.bracket) return false;
  if (deck.power < settings.minPower || deck.power > settings.maxPower) return false;
  if (settings.avoidFast && deck.gameSpeed === "Fast") return false;
  if (settings.deckType !== "any" && deck.deckType !== settings.deckType) return false;
  if (!passesThreatFilter(deck, settings.threatFilter)) return false;
  return true;
}

function pickBalancedDuel(eligible, settings) {
  const shuffled = shuffleArray(eligible);
  if (shuffled.length === 0) return [];

  const first = shuffled[0];
  let second = null;

  for (let i = 1; i < shuffled.length; i += 1) {
    const candidate = shuffled[i];
    if (candidate.deckName === first.deckName) continue;
    if (!isSpeedCompatiblePair(first, candidate)) continue;
    if (settings.avoidThreatMismatch && isThreatMismatch(first, candidate)) continue;

    second = candidate;
    break;
  }

  return second ? [first, second] : [first];
}

function isSpeedCompatiblePair(a, b) {
  const speeds = [a.gameSpeed, b.gameSpeed];
  return !(speeds.includes("Slow") && speeds.includes("Fast"));
}

function isThreatMismatch(a, b) {
  const lowMedium = ["Low", "Medium"];
  return (
    (a.threatPerception === "Very High" && lowMedium.includes(b.threatPerception)) ||
    (b.threatPerception === "Very High" && lowMedium.includes(a.threatPerception))
  );
}

function renderDuelResults(picks) {
  const first = picks[0] || null;
  const second = picks[1] || null;

  setText("duel-pick-1", first ? first.deckName : "");
  setText("duel-pick-2", second ? second.deckName : "");

  setText("duel-pick-1-threat", first ? first.threatPerception : "");
  setText("duel-pick-2-threat", second ? second.threatPerception : "");

  setText(
    "duel-pick-1-meta",
    first
      ? `${first.setName} • ${first.commanderMana} • ${first.power.toFixed(1)} • ${first.gameSpeed} • ${first.deckType}`
      : ""
  );
  setText(
    "duel-pick-2-meta",
    second
      ? `${second.setName} • ${second.commanderMana} • ${second.power.toFixed(1)} • ${second.gameSpeed} • ${second.deckType}`
      : ""
  );
}

function passesThreatFilter(deck, filterValue) {
  if (filterValue === "any") return true;
  if (filterValue === "exclude very high") {
    return deck.threatPerception !== "Very High";
  }
  if (filterValue === "low-medium only") {
    return ["Low", "Medium"].includes(deck.threatPerception);
  }
  return true;
}

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function hasHomebrews() {
  return allDecks.some((deck) => deck.deckType !== "Precon");
}

function valueOf(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function showError(message) {
  const errorBox = document.getElementById("app-error");
  if (errorBox) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }
}