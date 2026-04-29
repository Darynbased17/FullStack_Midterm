const router = require('express').Router();
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

// Get all stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create stock (one per user)
router.post('/', auth, async (req, res) => {
  try {
    const { ticker, name, price } = req.body;
    if (!ticker || !name || !price)
      return res.status(400).json({ message: 'ticker, name, price required' });

    // Check user doesn't already own a stock
    const existing = await Stock.findOne({ owner: req.user.id });
    if (existing) return res.status(400).json({ message: 'You already have a stock' });

    // Check ticker not taken
    const takenTicker = await Stock.findOne({ ticker: ticker.toUpperCase() });
    if (takenTicker) return res.status(400).json({ message: 'Ticker already taken' });

    const stock = await Stock.create({
      ticker: ticker.toUpperCase(),
      name,
      price: parseFloat(price),
      owner: req.user.id,
      ownerUsername: req.user.username,
    });

    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update price — owner only
// We attach the broadcast function via app.locals
router.patch('/:ticker/price', auth, async (req, res) => {
  try {
    const { price } = req.body;
    if (price === undefined) return res.status(400).json({ message: 'price required' });

    const stock = await Stock.findOne({ ticker: req.params.ticker.toUpperCase() });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    // Only owner can change price
    if (stock.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Forbidden: not your stock' });

    stock.price = parseFloat(price);
    await stock.save();

    // Broadcast to all WebSocket clients
    const broadcast = req.app.locals.broadcast;
    if (broadcast) {
      broadcast({
        type: 'TICKER_UPDATE',
        payload: { ticker: stock.ticker, price: stock.price },
      });
    }

    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;