function deckCard(deck){
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
        ${deck.commanderMana ? `<span class="pill">${deck.commanderMana}</span>` : ''}
      </div>
    </article>`;
}