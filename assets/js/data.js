const PRODUCTS = [
  { id: "sword", name: "Sword", icon: "⚔️", price: 100, hours: 2, materials: { iron: 8, coal: 5, leather: 1 } },
  { id: "plate", name: "Plate Armor", icon: "🛡️", price: 200, hours: 4, materials: { iron: 40, coal: 20, leather: 6 } },
  { id: "chain", name: "Chain Mail", icon: "⛓️", price: 400, hours: 6, materials: { iron: 20, coal: 10, leather: 2 } },
  { id: "pot", name: "Cooking Pot", icon: "(🍲", price: 800, hours: 8, materials: { iron: 4, coal: 2, leather: 0 } }
];

const STATUSES = ["Queued", "In Progress", "Completed"];
const KEY_ORDERS = "gf_orders";
const KEY_NEXT = "gf_next_id";

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
} //test

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getOrders() { return load(KEY_ORDERS, []); }
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

function getOrderPosition(orderID) {
  const order = getOrders()
  const activeOrders = orders.filter(o => o.status !== "Completed");
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);
  const index = activeOrders.findIndex(o => o.id === orderId);
  return index === -1 ? null : index + 1;
}

function getOrderPosition(orderId) {
  const orders = getOrders(); 
  const activeOrders = orders.filter(o => o.status !== "Completed");
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);
  const index = activeOrders.findIndex(o => o.id === orderId);
  return index === -1 ? null : index + 1;
}
