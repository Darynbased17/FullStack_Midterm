import React, { useState, useEffect, useCallback } from 'react';
import { getMe, getStocks, createStock, updatePrice, buyStock, sellStock } from '../api';
import { useWebSocket } from '../useWebSocket';

export default function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [myStock, setMyStock] = useState(null);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPriceInput, setNewPriceInput] = useState('');
  const [tradeShares, setTradeShares] = useState({});
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [userData, stocksData] = await Promise.all([getMe(), getStocks()]);
      setUser(userData);
      setStocks(stocksData);
      const mine = stocksData.find(s => s.ownerUsername === userData.username);
      setMyStock(mine || null);
    }
    load();
  }, []);

  const handleWsMessage = useCallback((data) => {
    if (data.type === 'TICKER_UPDATE') {
      const { ticker, price } = data.payload;
      setStocks(prev => prev.map(s => s.ticker === ticker ? { ...s, price } : s));
    }
  }, []);

  useWebSocket(handleWsMessage);

  function calcNetWorth() {
    if (!user) return 0;
    const portfolioValue = (user.portfolio || []).reduce((acc, holding) => {
      const stock = stocks.find(s => s.ticker === holding.ticker);
      return acc + holding.shares * (stock ? stock.price : 0);
    }, 0);
    return user.walletBalance + portfolioValue;
  }

  function flash(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000);
  }

  async function handleCreateStock(e) {
    e.preventDefault();
    setLoading(true);
    const data = await createStock(newTicker, newName, parseFloat(newPrice));
    setLoading(false);
    if (data._id) {
      setStocks(prev => [data, ...prev]);
      setMyStock(data);
      setNewTicker(''); setNewName(''); setNewPrice('');
      flash('✅ Stock issued successfully!');
    } else {
      flash('❌ ' + (data.message || 'Error'), 'error');
    }
  }

  async function handleUpdatePrice(e) {
    e.preventDefault();
    if (!myStock) return;
    setLoading(true);
    const data = await updatePrice(myStock.ticker, parseFloat(newPriceInput));
    setLoading(false);
    if (data._id) {
      setMyStock(data);
      setNewPriceInput('');
      flash(`✅ Price updated → $${data.price}`);
    } else {
      flash('❌ ' + (data.message || 'Error'), 'error');
    }
  }

  async function handleBuy(ticker) {
    const shares = parseInt(tradeShares[ticker] || 1);
    setLoading(true);
    const data = await buyStock(ticker, shares);
    setLoading(false);
    if (data.walletBalance !== undefined) {
      setUser(prev => ({ ...prev, walletBalance: data.walletBalance, portfolio: data.portfolio }));
      flash(`✅ Bought ${shares} share(s) of $${ticker}`);
    } else {
      flash('❌ ' + (data.message || 'Error'), 'error');
    }
  }

  async function handleSell(ticker) {
    const shares = parseInt(tradeShares[ticker] || 1);
    setLoading(true);
    const data = await sellStock(ticker, shares);
    setLoading(false);
    if (data.walletBalance !== undefined) {
      setUser(prev => ({ ...prev, walletBalance: data.walletBalance, portfolio: data.portfolio }));
      flash(`✅ Sold ${shares} share(s) of $${ticker}`);
    } else {
      flash('❌ ' + (data.message || 'Error'), 'error');
    }
  }

  function getHolding(ticker) {
    if (!user) return 0;
    const h = (user.portfolio || []).find(p => p.ticker === ticker);
    return h ? h.shares : 0;
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: '#2563eb', fontSize: 18, fontWeight: 600 }}>Loading PEX...</div>
    </div>
  );

  const netWorth = calcNetWorth();

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.headerLogo}>💹 PEX</span>
        <span style={s.headerUser}>@{user.username}</span>
        <button style={s.logoutBtn} onClick={onLogout}>Logout</button>
      </div>

      {/* Flash */}
      {msg.text && (
        <div style={{ ...s.flash, background: msg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: msg.type === 'error' ? '#dc2626' : '#16a34a', border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div style={s.statsRow}>
        <StatCard label="Wallet Balance" value={`$${user.walletBalance.toFixed(2)}`} color="#2563eb" bg="#eff6ff" border="#bfdbfe" />
        <StatCard label="Net Worth (live)" value={`$${netWorth.toFixed(2)}`} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
        <StatCard label="Stocks in Market" value={stocks.length} color="#059669" bg="#f0fdf4" border="#bbf7d0" />
      </div>

      <div style={s.grid}>
        {/* Left panel */}
        <div style={s.panel}>
          <h3 style={s.panelTitle}>📊 My Stock</h3>

          {!myStock ? (
            <form onSubmit={handleCreateStock}>
              <p style={s.hint}>Issue your company on PEX and set your price</p>
              <label style={s.label}>Ticker Symbol</label>
              <input style={s.input} placeholder="e.g. DEV" value={newTicker} onChange={e => setNewTicker(e.target.value.toUpperCase())} maxLength={5} required />
              <label style={s.label}>Company Name</label>
              <input style={s.input} placeholder="e.g. Dev Corp" value={newName} onChange={e => setNewName(e.target.value)} required />
              <label style={s.label}>Initial Price ($)</label>
              <input style={s.input} placeholder="e.g. 100" type="number" min="0.01" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} required />
              <button style={loading ? { ...s.btnBlue, opacity: 0.7 } : s.btnBlue} disabled={loading}>
                🚀 Issue Stock
              </button>
            </form>
          ) : (
            <div>
              <div style={s.myStockCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={s.tickerBig}>${myStock.ticker}</div>
                    <div style={s.companyName}>{myStock.name}</div>
                  </div>
                  <div style={s.priceBig}>${myStock.price.toFixed(2)}</div>
                </div>
                <div style={s.ownerTag}>👑 You are the owner</div>
              </div>

              <form onSubmit={handleUpdatePrice} style={{ marginTop: 20 }}>
                <label style={s.label}>Update Stock Price</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...s.input, marginBottom: 0, flex: 1 }}
                    placeholder="New price ($)"
                    type="number" min="0.01" step="0.01"
                    value={newPriceInput}
                    onChange={e => setNewPriceInput(e.target.value)}
                    required
                  />
                  <button style={loading ? { ...s.btnGreen, opacity: 0.7, whiteSpace: 'nowrap' } : { ...s.btnGreen, whiteSpace: 'nowrap' }} disabled={loading}>
                    📡 Broadcast
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Portfolio */}
          <h3 style={{ ...s.panelTitle, marginTop: 32 }}>💼 My Portfolio</h3>
          {(user.portfolio || []).length === 0 ? (
            <p style={s.hint}>No holdings yet. Buy stocks from the market!</p>
          ) : (
            <div style={s.table}>
              <div style={s.tableHeader}>
                <span>Ticker</span><span>Shares</span><span>Value</span>
              </div>
              {(user.portfolio || []).map(h => {
                const st = stocks.find(x => x.ticker === h.ticker);
                const val = st ? st.price * h.shares : 0;
                return (
                  <div key={h.ticker} style={s.tableRow}>
                    <span style={s.tickerTag}>${h.ticker}</span>
                    <span style={s.tableCell}>{h.shares}</span>
                    <span style={{ ...s.tableCell, fontWeight: 700, color: '#059669' }}>${val.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={s.panel}>
          <h3 style={s.panelTitle}>📈 Live Market</h3>
          {stocks.length === 0 && <p style={s.hint}>No stocks listed yet.</p>}
          {stocks.map(stock => {
            const holding = getHolding(stock.ticker);
            const isOwn = stock.ownerUsername === user.username;
            return (
              <div key={stock.ticker} style={s.marketCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={s.tickerTag}>${stock.ticker}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{stock.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>by @{stock.ownerUsername}</div>
                    </div>
                  </div>
                  <div style={s.livePrice}>${stock.price.toFixed(2)}</div>
                </div>

                {isOwn ? (
                  <div style={s.ownBadge}>👑 Your stock</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                    <input
                      style={s.sharesInput}
                      type="number" min="1" placeholder="Shares"
                      value={tradeShares[stock.ticker] || ''}
                      onChange={e => setTradeShares(prev => ({ ...prev, [stock.ticker]: e.target.value }))}
                    />
                    <button style={s.btnBuy} onClick={() => handleBuy(stock.ticker)} disabled={loading}>
                      Buy
                    </button>
                    {holding > 0 && (
                      <button style={s.btnSell} onClick={() => handleSell(stock.ticker)} disabled={loading}>
                        Sell
                      </button>
                    )}
                    {holding > 0 && (
                      <span style={s.holdingBadge}>You own: {holding} shares</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, bg, border }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '20px 24px', flex: 1, minWidth: 160 }}>
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f0f4ff', fontFamily: 'system-ui, sans-serif', paddingBottom: 40 },
  header: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', background: '#fff', borderBottom: '1.5px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
  headerLogo: { fontSize: 20, fontWeight: 800, color: '#1e293b' },
  headerUser: { fontSize: 15, fontWeight: 700, color: '#2563eb' },
  logoutBtn: { marginLeft: 'auto', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  flash: { margin: '16px 28px 0', padding: '11px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600 },
  statsRow: { display: 'flex', gap: 16, padding: '20px 28px', flexWrap: 'wrap' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '0 28px' },
  panel: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 18, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  panelTitle: { color: '#1e293b', margin: '0 0 18px', fontSize: 16, fontWeight: 700 },
  hint: { color: '#94a3b8', fontSize: 13 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { width: '100%', padding: '10px 13px', marginBottom: 14, borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btnBlue: { width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnGreen: { padding: '10px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  myStockCard: { background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: 20 },
  tickerBig: { fontSize: 22, fontWeight: 800, color: '#2563eb', marginBottom: 4 },
  companyName: { fontSize: 13, color: '#64748b' },
  priceBig: { fontSize: 28, fontWeight: 800, color: '#059669' },
  ownerTag: { marginTop: 12, fontSize: 12, color: '#7c3aed', fontWeight: 600 },
  table: { border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f8fafc', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid #f1f5f9', alignItems: 'center' },
  tableCell: { fontSize: 14, color: '#1e293b' },
  tickerTag: { background: '#eff6ff', color: '#2563eb', padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: 12 },
  marketCard: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12 },
  livePrice: { fontSize: 20, fontWeight: 800, color: '#059669' },
  ownBadge: { marginTop: 10, fontSize: 12, color: '#7c3aed', fontWeight: 600 },
  sharesInput: { width: 80, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#1e293b', fontSize: 13, outline: 'none' },
  btnBuy: { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnSell: { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  holdingBadge: { fontSize: 12, color: '#64748b', fontWeight: 600 },
};