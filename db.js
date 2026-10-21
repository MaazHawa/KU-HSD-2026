const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(__dirname + "/forge.db");

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

// get incomplete orders
function getIncompleteOrders() {
  return db.prepare("SELECT * FROM orders WHERE status != 'Completed' ORDER BY createdAt").all();
}

// mark done
function markCompleted(id) {
  db.prepare("UPDATE orders SET status = 'Completed' WHERE id = ?").run(id);
}

// by id
function getOrderById(id) {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
}

function markInProgress(id) {
  db.prepare("UPDATE orders SET status = 'In Progress' WHERE id = ?").run(id);
}

const STARTING_INVENTORY = {
  iron: 120,
  coal: 60,
  leather: 20,
  gold: 0
};

db.exec(`CREATE TABLE IF NOT EXISTS inventory (
  material TEXT PRIMARY KEY,
  amount INTEGER NOT NULL
)`);

for (const material in STARTING_INVENTORY) {
  db.prepare("INSERT OR IGNORE INTO inventory (material, amount) VALUES (?, ?)")
    .run(material, STARTING_INVENTORY[material]);
}

function getInventory() {
  const inventory = {};
  for (const row of db.prepare("SELECT * FROM inventory").all()) {
    inventory[row.material] = row.amount;
  }
  return inventory;
}

function addResources(resources) {
  for (const material in resources) {
    db.prepare("UPDATE inventory SET amount = amount + ? WHERE material = ?")
      .run(resources[material], material);
  }
  return getInventory();
}

module.exports = { db, addOrder, getAllOrders, markCompleted ,getOrderById, getIncompleteOrders, markInProgress, getInventory, addResources};