const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function register(username, password) {
  const r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return r.json();
}

export async function login(username, password) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return r.json();
}

export async function getMe() {
  const r = await fetch(`${BASE}/api/auth/me`, { headers: authHeaders() });
  return r.json();
}

export async function getStocks() {
  const r = await fetch(`${BASE}/api/stocks`);
  return r.json();
}

export async function createStock(ticker, name, price) {
  const r = await fetch(`${BASE}/api/stocks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticker, name, price }),
  });
  return r.json();
}

export async function updatePrice(ticker, price) {
  const r = await fetch(`${BASE}/api/stocks/${ticker}/price`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ price }),
  });
  return r.json();
}

export async function buyStock(ticker, shares) {
  const r = await fetch(`${BASE}/api/trade/buy`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticker, shares: Number(shares) }),
  });
  return r.json();
}

export async function sellStock(ticker, shares) {
  const r = await fetch(`${BASE}/api/trade/sell`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticker, shares: Number(shares) }),
  });
  return r.json();
}