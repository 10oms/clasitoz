require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cron = require('node-cron');

const app = express();

const PriceTrigger = require('./models/PriceTrigger');
const ScheduledOrder = require('./models/ScheduledOrder');
const User = require('./models/User');
const Order = require('./models/Order');

const { getPrice, getAllPrices } = require('./services/fakePriceEngine');

// =======================
// DB
// =======================


async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    // START CRON AFTER DB
    startCronJobs();

    // START SERVER AFTER DB
    const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Running on port " + PORT);
});

  } catch (err) {
    console.error("❌ DB Error:", err.message);
  }
}

startServer();
  

// =======================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}));

app.set('view engine', 'ejs');

// =======================
// GET USER
// =======================
async function getUser(req) {
  if (!req.session.userId) return null;
  return await User.findById(req.session.userId);
}

// =======================
// 👤 USER API
// =======================
app.get('/me', async (req, res) => {
  const user = await getUser(req);

  if (!user) {
    return res.json({ username: "Guest", balance: 0 });
  }

  res.json({
    username: user.username,
    balance: user.balance
  });
});

// =======================
// 📈 LIVE PRICES (FIX)
// =======================
app.get('/prices', (req, res) => {
  const prices = getAllPrices();
  res.json(prices);
});

// =======================
// CANDLES
// =======================
let candleStore = {};

app.get('/candles/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  if (!candleStore[symbol]) candleStore[symbol] = [];

  let candles = candleStore[symbol];
  let currentPrice = getPrice(symbol) || 1000;

  let last = candles.length ? candles[candles.length - 1] : null;
  let open = last ? last.close : currentPrice;

  let close = currentPrice + (Math.random() - 0.5) * 2;
  let high = Math.max(open, close) + Math.random() * 2;
  let low = Math.min(open, close) - Math.random() * 2;

  const candle = { time: Date.now(), open, high, low, close };

  candles.push(candle);
  if (candles.length > 100) candles.shift();

  res.json(candles);
});

// =======================
// AUTH
// =======================
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.send("User exists");

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashed });

  req.session.userId = user._id;
  res.send("Registered");
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send("Invalid");
  }

  req.session.userId = user._id;
  res.send("Login success");
});

// =======================
// WALLET
// =======================
app.post('/deposit', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.send("Login required");

  const amount = Number(req.body.amount);
  if (amount <= 0) return res.send("Invalid");

  user.balance += amount;
  await user.save();

  res.send("Deposited");
});

app.post('/withdraw', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.send("Login required");

  const amount = Number(req.body.amount);
  if (amount <= 0 || user.balance < amount)
    return res.send("Invalid");

  user.balance -= amount;
  await user.save();

  res.send("Withdrawn");
});

// =======================
// HOME
// =======================
app.get('/', async (req, res) => {
  const triggers = await PriceTrigger.find();
  const scheduled = await ScheduledOrder.find();
  const prices = getAllPrices();

  const stocks = Object.keys(prices).map(symbol => ({
    name: symbol,
    symbol,
    price: prices[symbol],
    change: (Math.random() * 10 - 5).toFixed(2)
  }));

  res.render('index', { triggers, scheduled, stocks });
});

// =======================
// WATCHLIST
// =======================
app.get('/watchlist', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json([]);

  res.json(
    (user.watchlist || []).map(stock => ({
      stock,
      price: getPrice(stock)
    }))
  );
});

app.post('/watchlist/add', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.send("Login required");

  const { stock } = req.body;

  if (!user.watchlist.includes(stock)) {
    user.watchlist.push(stock);
    await user.save();
  }

  res.send("Added");
});

app.post('/watchlist/remove', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.send("Login required");

  const { stock } = req.body;

  user.watchlist = user.watchlist.filter(s => s !== stock);
  await user.save();

  res.send("Removed");
});

// =======================
// STOCK PAGE
// =======================
app.get('/stock/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const price = getPrice(symbol);

  res.render('stock', {
    stock: {
      name: symbol,
      symbol,
      price,
      change: (Math.random()*10-5).toFixed(2),
      changePercent: (Math.random()*5).toFixed(2)
    }
  });
});

// =======================
// BUY / SELL
// =======================
app.post('/buy', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.send("Login required");

  const { stock, quantity } = req.body;
  const price = getPrice(stock);

  await autoBuy(user, stock, price, quantity);
  res.send("Bought");
});

app.post('/sell', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.send("Login required");

  const { stock, quantity } = req.body;
  const price = getPrice(stock);

  await autoSell(user, stock, price, quantity);
  res.send("Sold");
});

// =======================
// ADD TRIGGER
// =======================
app.post('/add-trigger', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.redirect('/');

  await PriceTrigger.create({
    stock: req.body.stock.toUpperCase(),
    targetPrice: req.body.targetPrice,
    action: req.body.action,
    quantity: req.body.quantity,
    userId: user._id
  });

  res.redirect('/');
});

// =======================
// DELETE TRIGGER
// =======================
app.post('/delete-trigger', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.send("Login required");

  const { id } = req.body;
  await PriceTrigger.findByIdAndDelete(id);

  res.send("Deleted");
});

// =======================
// ADD SCHEDULE
// =======================
app.post('/add-schedule', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.redirect('/');

  await ScheduledOrder.create({
    stock: req.body.stock.toUpperCase(),
    scheduledTime: new Date(req.body.scheduledTime),
    action: req.body.action,
    quantity: req.body.quantity,
    userId: user._id
  });

  res.redirect('/');
});

// =======================
// AUTO BUY / SELL
// =======================
async function autoBuy(user, stock, price, qty) {
  if (!user || user.balance < price * qty) return;

  user.balance -= price * qty;

  let existing = user.portfolio.find(p => p.stock === stock);

  if (existing) existing.quantity += qty;
  else user.portfolio.push({ stock, quantity: qty, avgPrice: price });

  await user.save();

  await Order.create({
    stock,
    type: "BUY",
    quantity: qty,
    price,
    userId: user._id,
    time: new Date()
  });
}

async function autoSell(user, stock, price, qty) {
  if (!user) return;

  let holding = user.portfolio.find(p => p.stock === stock);
  if (!holding || holding.quantity < qty) return;

  holding.quantity -= qty;
  user.balance += price * qty;

  if (holding.quantity === 0) {
    user.portfolio = user.portfolio.filter(p => p.stock !== stock);
  }

  await user.save();

  await Order.create({
    stock,
    type: "SELL",
    quantity: qty,
    price,
    userId: user._id,
    time: new Date()
  });
}

// =======================
// CRON
// =======================
function startCronJobs() {
  cron.schedule('*/5 * * * * *', async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      const triggers = await PriceTrigger.find();
      const schedules = await ScheduledOrder.find();
      const now = new Date();

      for (let t of triggers) {
        const price = getPrice(t.stock);
        const user = await User.findById(t.userId);

        if (t.action === "BUY" && price <= t.targetPrice) {
          await autoBuy(user, t.stock, price, t.quantity);
          await PriceTrigger.findByIdAndDelete(t._id);
        }

        if (t.action === "SELL" && price >= t.targetPrice) {
          await autoSell(user, t.stock, price, t.quantity);
          await PriceTrigger.findByIdAndDelete(t._id);
        }
      }

      for (let s of schedules) {
        if (new Date(s.scheduledTime) <= now) {
          const price = getPrice(s.stock);
          const user = await User.findById(s.userId);

          if (s.action === "BUY")
            await autoBuy(user, s.stock, price, s.quantity);
          else
            await autoSell(user, s.stock, price, s.quantity);

          await ScheduledOrder.findByIdAndDelete(s._id);
        }
      }

    } catch (err) {
      console.log("Cron Error:", err.message);
    }
  });
}

// =======================
// ORDERS
// =======================
app.get('/orders', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json([]);

  const orders = await Order.find({ userId: user._id }).sort({ time: -1 });
  res.json(orders);
});

// =======================
// PORTFOLIO
// =======================
app.get('/portfolio', async (req, res) => {
  try {
    const user = await getUser(req);

    if (!user) {
      return res.json({
        portfolio: [],
        balance: 0
      });
    }

    const portfolio = user.portfolio || [];

    const enriched = portfolio.map(p => {
      const currentPrice = getPrice(p.stock) || 0;

      return {
        stock: p.stock,
        quantity: p.quantity,
        avgPrice: p.avgPrice,
        currentPrice,
        pnl: (currentPrice - p.avgPrice) * p.quantity
      };
    });

    res.json({
      portfolio: enriched,
      balance: user.balance || 0
    });

  } catch (err) {
    console.log("Portfolio error:", err.message);

    res.json({
      portfolio: [],
      balance: 0
    });
  }
});

// =======================
