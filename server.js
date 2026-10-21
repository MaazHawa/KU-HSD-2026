const express = require("express");
const path = require("path");
const db = require("./db.js");

const PORT = process.env.PORT || 80;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function findProduct(id) { return PRODUCTS.find(p => p.id === id); }

const PRODUCTS = [
  { id: "sword", name: "Sword", icon: "⚔️", price: 100, hours: 2, desc: "add desc", materials: { iron: 8, coal: 5, leather: 1 } },
  { id: "plate", name: "Plate Armor", icon: "🛡️", price: 200, hours: 4, desc: "add desc", materials: { iron: 40, coal: 20, leather: 6 } },
  { id: "chain", name: "Chain Mail", icon: "⛓️", price: 400, hours: 6, desc: "add desc", materials: { iron: 20, coal: 10, leather: 2 } },
  { id: "pot", name: "Cooking Pot", icon: "🍲", price: 800, hours: 8, desc: "add desc", materials: { iron: 4, coal: 2, leather: 0 } }
];

app.listen(PORT, () => {
  console.log(`Gunter's Forge running at http://localhost:${PORT}`);
});

app.get("/api/products/" , (req, res) => {
  res.json(PRODUCTS)
});

// place order
app.post("/api/orders/place", (req, res) => {
  const { customer, productId, qty } = req.body || {};
  const name = String(customer ?? "").trim();
  const amount = Number(qty);
  const product = findProduct(productId);
  if (!name) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!product) return res.status(400).json({ ok: false, error: "Unknown item." });
  if (!Number.isInteger(amount) || amount < 1 || amount > 20) return res.status(400).json({ ok: false, error: "Quantity must be a whole number from 1 to 20." });

  const inventory = db.getInventory();

  // Checks that Gunter has enough materials for the order.
  for (const material in product.materials) {
    const needed = product.materials[material] * amount;

    if ((inventory[material] || 0) < needed) {
      return res.status(400).json({
        ok: false,
        error: `Not enough ${material}. Please try a smaller order or wait for restocking.`
      });
    }
  }

  // Reserves the materials when the order is accepted.
  const used = {};
  for (const material in product.materials) {
    used[material] = -product.materials[material] * amount;
  }
  db.addResources(used);

  const next = db.addOrder(name, productId, amount);
  const order = { id: "GF-" + (1000 + Number(next)), customer: name, productId, qty: amount, status: "Queued", createdAt: Date.now() };
  res.json({ ok: true, order });
});

// get order position
app.get("/api/orders/:id/position", (req, res) => {
  const orderId = req.params.id;
  const orders = db.getAllOrders().map(o => ({ ...o, id: "GF-" + (1000 + o.id) }));
  const activeOrders = orders.filter(o => o.status !== "Completed");
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);
  const index = activeOrders.findIndex(o => o.id === orderId);
  res.json({ ok: true, position: index === -1 ? null : index + 1 });
});

function getEstimatedWaitTime(orderId) {
  const orders = db.getAllOrders().map(o => ({ ...o, id: "GF-" + (1000 + o.id) }));

  const activeOrders = orders.filter(o => o.status !== "Completed");
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);

  const targetIndex = activeOrders.findIndex(o => o.id === orderId);
  if (targetIndex === -1) return null;

  let totalHours = 0;

  // Loop through all orders ahead of them, plus their own
  for (let i = 0; i <= targetIndex; i++) {
    const order = activeOrders[i];
    const product = findProduct(order.productId);

    if (product) {
      totalHours += product.hours * order.qty;
    }
  }

  return totalHours;
}

app.get("/api/orders/:id/wait", (req, res) => {
  res.json({ ok: true, waitTime: getEstimatedWaitTime(req.params.id) });
});

// get all orders
app.get("/api/orders/all", (req, res) => {
  res.json(db.getAllOrders().map(o => ({ ...o, id: "GF-" + (1000 + o.id) })));
});

// get non completed
app.get("/api/orders/incomplete", (req, res) => {
  if (req.get("x-password") !== "gunter123") return res.status(401).json({ ok: false, error: "Incorrect password." });
  const orders = db.getAllOrders().map(o => ({ ...o, id: "GF-" + (1000 + o.id) }));
  const activeOrders = orders.filter(o => o.status !== "Completed");
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);
  res.json({ ok: true, orders: activeOrders });
});

// change status
app.post("/api/orders/:id/complete", (req, res) => {
  if (req.get("x-password") !== "gunter123") return res.status(401).json({ ok: false, error: "Incorrect password." });
  const orderId = req.params.id;
  const id = Number(orderId.replace("GF-", "")) - 1000;
  const order = db.getOrderById(id);
  if (!order) return res.status(404).json({ ok: false, error: "Order not found." });
  db.markCompleted(id);
  res.json({ ok: true });
});

app.post("/api/orders/:id/start", (req, res) => {
  if (req.get("x-password") !== "gunter123") return res.status(401).json({ ok: false, error: "Incorrect password." });
  const orderId = req.params.id;
  const id = Number(orderId.replace("GF-", "")) - 1000;
  const order = db.getOrderById(id);
  if (!order) return res.status(404).json({ ok: false, error: "Order not found." });
  if (order.status !== "Queued") return res.status(400).json({ ok: false, error: "Only queued orders can be started." });
  db.markInProgress(id);
  res.json({ ok: true });
});

app.get("/api/inventory", (req, res) => {
  if (req.get("x-password") !== "gunter123") return res.status(401).json({ ok: false, error: "Incorrect password." });
  res.json({ ok: true, inventory: db.getInventory() });
});

app.post("/api/inventory/restock", (req, res) => {
  if (req.get("x-password") !== "gunter123") return res.status(401).json({ ok: false, error: "Incorrect password." });
  const { material, amount } = req.body || {};
  const count = Number(amount);
  if (!Object.hasOwn(db.getInventory(), String(material))) return res.status(400).json({ ok: false, error: "Unknown material." });
  if (!Number.isInteger(count) || count < 1 || count > 1000) return res.status(400).json({ ok: false, error: "Amount must be a whole number from 1 to 1000." });
  res.json({ ok: true, inventory: db.addResources({ [material]: count }) });
});

app.use("/api/mine", require("./mine.js"));

// get orderby id
app.get("/api/orders/:id", (req, res) => {
  const id = Number(req.params.id.replace("GF-", "")) - 1000;
  const order = db.getOrderById(id);
  if (!order) return res.status(404).json({ ok: false, error: "Order not found." });
  res.json({ ...order, id: "GF-" + (1000 + order.id) });
});