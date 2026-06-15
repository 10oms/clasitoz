// =========================
// 🔐 AUTH FUNCTIONS (ADDED)
// =========================

async function login() {
  try {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("Enter username & password");
      return;
    }

    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    alert(await res.text());
    loadUser();
    loadPortfolio();

  } catch (err) {
    console.error("Login error:", err);
  }
}

async function register() {
  try {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("Enter username & password");
      return;
    }

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    alert(await res.text());
    loadUser();
    loadPortfolio();

  } catch (err) {
    console.error("Register error:", err);
  }
}


// =========================
// ORIGINAL CODE (UNCHANGED)
// =========================

console.log("✅ script.js loaded");

// =========================
// 📈 LIVE PRICE UPDATE
// =========================
async function updatePrices() {
  try {
    const res = await fetch('/prices');
    const data = await res.json();

    document.querySelectorAll('.stock-card').forEach(card => {
      const symbol = card.getAttribute('data-symbol');
      const priceEl = card.querySelector('.stock-price');

      if (data[symbol] && priceEl) {
        priceEl.innerText = "₹" + data[symbol].toFixed(2);
      }
    });

  } catch (err) {
    console.error("Price update error:", err);
  }
}
setInterval(updatePrices, 2000);


// =========================
// 💰 PORTFOLIO
// =========================
async function loadPortfolio() {
  try {
    const container = document.getElementById("portfolio-container");
    if (!container) return;

    const res = await fetch('/portfolio');
    const data = await res.json();

    if (!data || !data.portfolio) {
      container.innerHTML = `<div class="empty-state">No data</div>`;
      return;
    }

    if (!data.portfolio.length) {
      container.innerHTML = `<div class="empty-state">No stocks</div>`;
      return;
    }

    let html = `
      <p><strong>Balance:</strong> ₹${Number(data.balance || 0).toFixed(2)}</p>
      <table style="width:100%">
        <tr>
          <th>Stock</th><th>Qty</th><th>Avg</th><th>Current</th><th>P&L</th>
        </tr>
    `;

    data.portfolio.forEach(p => {
      const color = p.pnl >= 0 ? "green" : "red";

      html += `
        <tr>
          <td>${p.stock}</td>
          <td>${p.quantity}</td>
          <td>₹${Number(p.avgPrice).toFixed(2)}</td>
          <td>₹${Number(p.currentPrice).toFixed(2)}</td>
          <td style="color:${color}">₹${Number(p.pnl).toFixed(2)}</td>
        </tr>
      `;
    });

    html += "</table>";
    container.innerHTML = html;

  } catch (err) {
    console.error("Portfolio error:", err);
    document.getElementById("portfolio-container").innerHTML =
      `<div class="empty-state">Error loading</div>`;
  }
}
setInterval(loadPortfolio, 2000);


// =========================
// ⭐ WATCHLIST
// =========================
async function loadWatchlist() {
  try {
    const res = await fetch('/watchlist');
    const data = await res.json();

    const container = document.getElementById("watchlist-container");
    if (!container) return;

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<div class="empty-state">No watchlist</div>`;
      return;
    }

    container.innerHTML = data.map(item => `
      <li style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:600;">${item.stock || 'N/A'}</span>
        <span style="color:#00ffae;font-weight:700;">
          ₹${Number(item.price || 0).toFixed(2)}
        </span>
        <button onclick="removeFromWatchlist('${item.stock}')">❌</button>
      </li>
    `).join('');

  } catch (err) {
    console.error("Watchlist error:", err);
  }
}
const data = await res.json();
console.log("WATCHLIST DATA:", data);

async function removeFromWatchlist(stock) {
  await fetch('/watchlist/remove', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ stock })
  });

  loadWatchlist();
}
setInterval(loadWatchlist, 4000);


// =========================
// 📜 ORDER HISTORY
// =========================
async function loadOrders() {
  try {
    const res = await fetch('/orders');
    const data = await res.json();

    const container = document.getElementById("orders-container");
    if (!container) return;

    if (!data.length) {
      container.innerHTML = `<div>No orders</div>`;
      return;
    }

    container.innerHTML = data.map(o => `
      <li style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px;
        margin-bottom:6px;
        border-radius:8px;
        background:rgba(255,255,255,0.1);
      ">
        <span style="font-weight:600;">
          ${o.type} ${o.stock}
        </span>

        <span style="color:${o.type === 'BUY' ? '#00ffae' : '#ff6b5f'};">
          ${o.quantity} × ₹${Number(o.price).toFixed(2)}
        </span>
      </li>
    `).join('');

  } catch (err) {
    console.error(err);
  }
}
setInterval(loadOrders, 4000);


// =========================
// 🛒 BUY / SELL / WATCH
// =========================
document.addEventListener("click", async (e) => {

  if (e.target.classList.contains("buy-btn")) {
    const stock = e.target.dataset.symbol;
    const qty = prompt(`Buy ${stock} qty:`);

    if (!qty) return;

    const res = await fetch('/buy', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ stock, quantity:Number(qty) })
    });

    alert(await res.text());
    loadUser();
    loadPortfolio();
  }

  if (e.target.classList.contains("sell-btn")) {
    const stock = e.target.dataset.symbol;
    const qty = prompt(`Sell ${stock} qty:`);

    if (!qty) return;

    const res = await fetch('/sell', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ stock, quantity:Number(qty) })
    });

    alert(await res.text());
    loadUser();
    loadPortfolio();
  }

  if (e.target.classList.contains("watch-btn")) {
    const stock = e.target.dataset.symbol;

    const res = await fetch('/watchlist/add', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ stock })
    });

    alert(await res.text());
    loadWatchlist();
  }

  if (e.target.classList.contains("delete-trigger")) {
    const id = e.target.dataset.id;

    await fetch('/delete-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    location.reload();
  }

});


// =========================
// 👤 USER
// =========================
async function loadUser() {
  try {
    const res = await fetch('/me');
    const data = await res.json();

    const usernameEl = document.getElementById("panel-username");
    const balanceEl = document.getElementById("panel-balance");

    if (!usernameEl || !balanceEl) return;

    usernameEl.innerText = data.username || "Guest";
    balanceEl.innerText = "₹" + Number(data.balance || 0).toFixed(2);

  } catch (err) {
    console.error("Load user error:", err);
  }
}
setInterval(loadUser, 4000);


// =========================
// 🔥 DOM LOAD
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadPortfolio();
  loadWatchlist();
  loadOrders();
  loadUser();

  const userBtn = document.getElementById("user-btn");
  const panel = document.getElementById("side-panel");
  const closeBtn = document.getElementById("close-panel");
  const overlay = document.getElementById("overlay");

  if (!userBtn || !panel || !closeBtn || !overlay) return;

  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("open");
    overlay.classList.toggle("active");
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.remove("open");
    overlay.classList.remove("active");
  });

  overlay.addEventListener("click", () => {
    panel.classList.remove("open");
    overlay.classList.remove("active");
  });
});


// =========================
// 💰 DEPOSIT / WITHDRAW
// =========================

async function depositMoney() {
  try {
    const amount = document.getElementById("amount-input").value;

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    const res = await fetch('/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount) })
    });

    alert(await res.text());
    loadUser();
    loadPortfolio();

  } catch (err) {
    console.error("Deposit error:", err);
  }
}

async function withdrawMoney() {
  try {
    const amount = document.getElementById("amount-input").value;

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    const res = await fetch('/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount) })
    });

    alert(await res.text());
    loadUser();
    loadPortfolio();

  } catch (err) {
    console.error("Withdraw error:", err);
  }
}
