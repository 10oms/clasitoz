document.addEventListener('DOMContentLoaded', () => {

  const searchInput = document.getElementById('search-input');
  const sectorFilter = document.getElementById('sector-filter');

  function filterStocks() {
    const query = searchInput.value.toLowerCase().trim();
    const sector = sectorFilter.value;

    const cards = document.querySelectorAll('.stock-card');

    cards.forEach(card => {
      const name = card.dataset.name || "";
      const symbol = card.dataset.symbol || "";
      const cardSector = card.dataset.sector || "";

      const matchSearch =
        name.includes(query) ||
        symbol.toLowerCase().includes(query);

      const matchSector =
        sector === "all" || cardSector === sector;

      if (matchSearch && matchSector) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  // 🔥 EVENTS
  searchInput.addEventListener('keyup', filterStocks);
  sectorFilter.addEventListener('change', filterStocks);

  // 🔥 FIX CARD CLICK (NO CONFLICT)
  document.querySelectorAll('.stock-card').forEach(card => {
    card.addEventListener('click', function(e) {

      // prevent button click conflict
      if (e.target.closest('button')) return;

      const symbol = this.dataset.symbol;
      window.location.href = '/stock/' + symbol;
    });
  });

});