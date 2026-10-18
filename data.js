const PRODUCTS = [
  { id: "sword", name: "Sword", icon: "⚔️", price: 120, hours: 6, desc: "A balanced steel blade with a leather-wrapped grip.", materials: { iron: 8, coal: 5, leather: 1 } },
  { id: "plate", name: "Plate Armor", icon: "🛡️", price: 450, hours: 24, desc: "A full harness of fitted steel plates.", materials: { iron: 40, coal: 20, leather: 6 } },
  { id: "chain", name: "Chain Mail", icon: "⛓️", price: 260, hours: 16, desc: "Thousands of riveted rings, light and flexible.", materials: { iron: 20, coal: 10, leather: 2 } },
  { id: "pot", name: "Cooking Pot", icon: "🍲", price: 30, hours: 2, desc: "A sturdy cast pot that will outlive the kitchen.", materials: { iron: 4, coal: 2, leather: 0 } }
];

const DEFAULT_SUPPLIES = {
  iron: { label: "Iron", amount: 120, low: 30 },
  coal: { label: "Coal", amount: 70, low: 20 },
  leather: { label: "Leather", amount: 14, low: 5 }
};

const STATUSES = ["Queued", "In Progress", "Completed"];
const KEY_ORDERS = "gf_orders";
const KEY_SUPPLIES = "gf_supplies";
const KEY_NEXT = "gf_next_id";

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getOrders() { return load(KEY_ORDERS, []); }
function getSupplies() { return load(KEY_SUPPLIES, JSON.parse(JSON.stringify(DEFAULT_SUPPLIES))); }
function findProduct(id) { return PRODUCTS.find(p => p.id === id); }

function placeOrder(customer, productId, qty) {
  const name = String(customer).trim();
  const amount = Number(qty);
  const product = findProduct(productId);
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!product) return { ok: false, error: "Unknown item." };
  if (!Number.isInteger(amount) || amount < 1 || amount > 20) return { ok: false, error: "Quantity must be a whole number from 1 to 20." };
  const next = load(KEY_NEXT, 1001);
  const order = { id: "GF-" + next, customer: name, productId, qty: amount, status: "Queued", createdAt: Date.now() };
  const orders = getOrders();
  orders.push(order);
  save(KEY_ORDERS, orders);
  save(KEY_NEXT, next + 1);
  return { ok: true, order };
}

function activeQueue() {
  return getOrders()
    .filter(o => o.status !== "Completed")
    .sort((a, b) => a.createdAt - b.createdAt);
}

function queueInfo(orderId) {
  const queue = activeQueue();
  const index = queue.findIndex(o => o.id === orderId);
  if (index === -1) return null;
  let hours = 0;
  for (let i = 0; i <= index; i++) {
    hours += findProduct(queue[i].productId).hours * queue[i].qty;
  }
  return { position: index + 1, total: queue.length, hours };
}

function findOrder(id) {
  const wanted = String(id).trim().toUpperCase();
  return getOrders().find(o => o.id === wanted) || null;
}

function materialsNeeded(order) {
  const base = findProduct(order.productId).materials;
  const need = {};
  for (const key in base) need[key] = base[key] * order.qty;
  return need;
}

function shortages(order) {
  const supplies = getSupplies();
  const need = materialsNeeded(order);
  return Object.keys(need).filter(k => supplies[k].amount < need[k]);
}

function advanceOrder(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || order.status === "Completed") return { ok: false, error: "Nothing to advance." };
  if (order.status === "Queued") {
    const missing = shortages(order);
    if (missing.length) return { ok: false, error: "Not enough " + missing.join(", ") + " to start this order." };
    const supplies = getSupplies();
    const need = materialsNeeded(order);
    for (const k in need) supplies[k].amount -= need[k];
    save(KEY_SUPPLIES, supplies);
    order.status = "In Progress";
  } else {
    order.status = "Completed";
  }
  save(KEY_ORDERS, orders);
  return { ok: true, order };
}

function restock(key, amount) {
  const supplies = getSupplies();
  if (!supplies[key]) return;
  supplies[key].amount += amount;
  save(KEY_SUPPLIES, supplies);
}
