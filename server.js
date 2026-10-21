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
  { id: "pot", name: "Cooking Pot", icon: "switch", price: 800, hours: 8, desc: "add desc", materials: { iron: 4, coal: 2, leather: 0 } }
];

app.listen(PORT, () => {
  console.log(`Gunter's Forge running at http://localhost:${PORT}`);
});

app.get("/api/products/" , (req, res) => {
  res.json(PRODUCTS)
});

// place order
app.post("/api/orders", (req, res) => {
  const { customer, productId, qty } = req.body;
  const name = String(customer ?? "").trim();
  const amount = Number(qty);
  const product = findProduct(productId);
  if (!name) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!product) return res.status(400).json({ ok: false, error: "Unknown item." });
  if (!Number.isInteger(amount) || amount < 1 || amount > 20) return res.status(400).json({ ok: false, error: "Quantity must be a whole number from 1 to 20." });
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

// get all orders
app.get("/api/orders", (req, res) => {
  res.json(db.getAllOrders().map(o => ({ ...o, id: "GF-" + (1000 + o.id) })));
});
