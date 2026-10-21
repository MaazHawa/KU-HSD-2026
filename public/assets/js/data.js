// product information for the blacksmith shop
const PRODUCTS = [
  { id: "sword", name: "Sword", icon: "⚔️", price: 100, hours: 2, materials: { iron: 8, coal: 5, leather: 1 } },
  { id: "plate", name: "Plate Armor", icon: "🛡️", price: 200, hours: 4, materials: { iron: 40, coal: 20, leather: 6 } },
  { id: "chain", name: "Chain Mail", icon: "⛓️", price: 400, hours: 6, materials: { iron: 20, coal: 10, leather: 2 } },
  { id: "pot", name: "Cooking Pot", icon: "🍲", price: 800, hours: 8, materials: { iron: 4, coal: 2, leather: 0 } }
];

// available order statuses
const STATUSES = ["Queued", "In Progress", "Completed"];

// localstorage keys
const KEY_ORDERS = "gf_orders";
const KEY_NEXT = "gf_next_id";

/**
 * loads saved data from localstorage
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * key: the storage key
 * fallback: the default value
 *
 * returns
 * saved data or the fallback value
 */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * saves data to localstorage
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * key: the storage key
 * value: the data to save
 *
 * returns
 * nothing
 */
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * retrieves all saved orders
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * none
 *
 * returns
 * an array of orders
 */
function getOrders() {
  return load(KEY_ORDERS, []);
}

/**
 * finds a product by id
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * id: the product id
 *
 * returns
 * the product or undefined
 */
function findProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

/**
 * validates, creates, and saves an order
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * customer: the customer's name
 * productId: the selected product id
 * qty: the requested quantity
 *
 * returns
 * the order on success or an error message
 */
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

/**
 * finds an order's position in the active queue
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * orderId: the order id to find
 *
 * returns
 * the queue position or null if the order is not active
 */
function getOrderPosition(orderId) {
  const orders = getOrders();
  const activeOrders = orders.filter(o => o.status !== "Completed");

  // sorts orders from oldest to newest
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);

  const index = activeOrders.findIndex(o => o.id === orderId);

  return index === -1 ? null : index + 1;
}