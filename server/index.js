import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.get('/api/sources', (req, res) => {
  const sources = db.prepare('SELECT * FROM sources').all();
  const total = sources.reduce((sum, source) => sum + source.balance, 0);
  res.json({ sources, total });
});
app.post('/api/transactions', (req, res) => {
  const { amount, type, category, note, source_id } = req.body;
  
  const processTransaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO transactions (amount, type, category, note, source_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(amount, type, category, note, source_id);
    if (type === 'EXPENSE') {
      db.prepare('UPDATE sources SET balance = balance - ? WHERE id = ?')
        .run(amount, source_id);
    } else {
      db.prepare('UPDATE sources SET balance = balance + ? WHERE id = ?')
        .run(amount, source_id);
    }
  });

  processTransaction();
  res.json({ success: true });
});

app.get('/api/history', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const data = db.prepare(`
      SELECT t.*, COALESCE(s.name, 'Unknown') as source_name 
      FROM transactions t 
      LEFT JOIN sources s ON t.source_id = s.id 
      ORDER BY t.date DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const countObj = db.prepare('SELECT count(*) as count FROM transactions').get();
    const totalRecords = countObj.count;
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({ data, pagination: { page, limit, totalRecords, totalPages } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.get('/api/receivables', (req, res) => {
  const rows = db.prepare('SELECT * FROM receivables WHERE is_settled = 0 ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/receivables', (req, res) => {
  const { person_name, amount, reason, source_id } = req.body;

  const lendMoney = db.transaction(() => {
    db.prepare('INSERT INTO receivables (person_name, amount, reason) VALUES (?, ?, ?)')
      .run(person_name, amount, reason);
    db.prepare('UPDATE sources SET balance = balance - ? WHERE id = ?')
      .run(amount, source_id);
    db.prepare(`
      INSERT INTO transactions (amount, type, category, note, source_id) 
      VALUES (?, 'EXPENSE', 'Lending', ?, ?)
    `).run(amount, `Lent to ${person_name}`, source_id);
  });

  lendMoney();
  res.json({ success: true });
});

app.post('/api/receivables/settle', (req, res) => {
  const { id, source_id } = req.body;
  
  const settleDebt = db.transaction(() => {
    const debt = db.prepare('SELECT * FROM receivables WHERE id = ?').get(id);
    db.prepare('UPDATE receivables SET is_settled = 1 WHERE id = ?').run(id);
    db.prepare('UPDATE sources SET balance = balance + ? WHERE id = ?').run(debt.amount, source_id);
    db.prepare(`
      INSERT INTO transactions (amount, type, category, note, source_id) 
      VALUES (?, 'INCOME', 'Debt Repayment', ?, ?)
    `).run(debt.amount, `Settled: ${debt.person_name}`, source_id);
  });

  settleDebt();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is ready at http://localhost:${PORT}`);
});