const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Stock = require('../models/Stock');

// Buy shares
router.post('/buy', auth, async (req, res) => {
  try {
    const { ticker, shares } = req.body;
    if (!ticker || !shares || shares <= 0)
      return res.status(400).json({ message: 'ticker and positive shares required' });

    const stock = await Stock.findOne({ ticker: ticker.toUpperCase() });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const user = await User.findById(req.user.id);
    const totalCost = stock.price * shares;

    if (user.walletBalance < totalCost)
      return res.status(400).json({ message: 'Insufficient funds' });

    // Atomic-style update in single logic block
    user.walletBalance -= totalCost;

    const holding = user.portfolio.find(p => p.ticker === stock.ticker);
    if (holding) {
      holding.shares += shares;
    } else {
      user.portfolio.push({ ticker: stock.ticker, shares });
    }

    await user.save();
    res.json({ walletBalance: user.walletBalance, portfolio: user.portfolio });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sell shares
router.post('/sell', auth, async (req, res) => {
  try {
    const { ticker, shares } = req.body;
    if (!ticker || !shares || shares <= 0)
      return res.status(400).json({ message: 'ticker and positive shares required' });

    const stock = await Stock.findOne({ ticker: ticker.toUpperCase() });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const user = await User.findById(req.user.id);

    const holding = user.portfolio.find(p => p.ticker === stock.ticker);
    if (!holding || holding.shares < shares)
      return res.status(400).json({ message: 'Not enough shares' });

    // Atomic-style update in single logic block
    holding.shares -= shares;
    if (holding.shares === 0) {
      user.portfolio = user.portfolio.filter(p => p.ticker !== stock.ticker);
    }
    user.walletBalance += stock.price * shares;

    await user.save();
    res.json({ walletBalance: user.walletBalance, portfolio: user.portfolio });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;