let stocks = {
  RELIANCE: 2800,
  INFY: 1500,
  TCS: 3600,
  HDFCBANK: 1650,
  ICICIBANK: 950,
  WIPRO: 420
};

function updatePrices() {
  Object.keys(stocks).forEach(symbol => {
    let volatility = 0.02; // 2%
    let change = stocks[symbol] * volatility * (Math.random() - 0.5);
    stocks[symbol] += change;
  });
}

// run every 2 sec
setInterval(updatePrices, 2000);

function getPrice(symbol) {
  return stocks[symbol] || null;
}

function getAllPrices() {
  return stocks;
}

module.exports = { getPrice, getAllPrices };