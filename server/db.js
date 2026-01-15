import Database from 'better-sqlite3';

const db = new Database('finance.db', { verbose: console.log });
console.log('Connected to SQLite database.');

// 2. Define the Schema (The Tables)
const schema = `
  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'CASH' or 'BANK'
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT NOT NULL, -- 'EXPENSE' or 'INCOME'
    category TEXT NOT NULL,
    note TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_id INTEGER,
    FOREIGN KEY(source_id) REFERENCES sources(id)
  );

  CREATE TABLE IF NOT EXISTS receivables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_name TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    is_settled INTEGER DEFAULT 0, -- 0 = False, 1 = True
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// 3. Execute the Schema
db.exec(schema);

const sourceCount = db.prepare('SELECT count(*) as count FROM sources').get();
if (sourceCount.count === 0) {
  console.log('Seeding initial accounts...');
  const insert = db.prepare('INSERT INTO sources (name, type, balance) VALUES (?, ?, ?)');

  insert.run('Cash in Wallet', 'CASH', 800);
  insert.run('BOI Bank', 'BANK', 168.73);   
  insert.run('IPPB Bank', 'BANK', 1074.36);  

  console.log('Initial accounts created!');
}

export default db;