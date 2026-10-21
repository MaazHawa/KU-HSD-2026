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
function addOrder(customer, productId, qty) {
  return db.prepare("INSERT INTO orders (customer, productId, qty, createdAt) VALUES (?, ?, ?, ?)")
    .run(customer, productId, qty, Date.now()).lastInsertRowid;
}

// get all
function getAllOrders() {
  return db.prepare("SELECT * FROM orders ORDER BY createdAt").all();
}

function getIncompleteOrders() {
  return db.prepare("SELECT * FROM orders WHERE status != 'Completed' ORDER BY createdAt").all();
}

// mark done
function markCompleted(id) {
  db.prepare("UPDATE orders SET status = 'Completed' WHERE id = ?").run(id);
}

module.exports = { addOrder, getAllOrders, markCompleted };