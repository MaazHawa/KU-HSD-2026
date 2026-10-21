const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("forge.db");

// create sheet
db.exec(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer TEXT NOT NULL,
  productId TEXT NOT NULL,
  qty INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Queued',
  createdAt INTEGER NOT NULL
)`);

// add
const result = db.prepare("INSERT INTO orders (customer, productId, qty, createdAt) VALUES (?, ?, ?, ?)")
  .run(name, productId, amount, Date.now());
result.lastInsertRowid;   // 新订单的编号，自动 +1

// inquire all
db.prepare("SELECT * FROM orders ORDER BY createdAt").all();

// mark finished
db.prepare("UPDATE orders SET status = ? WHERE id = ?").run("Completed", id);