
const PRODUCTS = [
  { id: "sword", name: "Sword", icon: "⚔️", price: 100, hours: 2, materials: { iron: 8, coal: 5, leather: 1 } },
  { id: "plate", name: "Plate Armor", icon: "🛡️", price: 200, hours: 4, materials: { iron: 40, coal: 20, leather: 6 } },
  { id: "chain", name: "Chain Mail", icon: "⛓️", price: 400, hours: 6, materials: { iron: 20, coal: 10, leather: 2 } },
  { id: "pot", name: "Cooking Pot", icon: "🍲", price: 800, hours: 8, materials: { iron: 4, coal: 2, leather: 0 } }
];

const STATUSES = ["Queued", "In Progress", "Completed"];

const KEY_ORDERS = "gf_orders";
const KEY_NEXT = "gf_next_id";
const KEY_INVENTORY = "gf_inventory";

const STARTING_INVENTORY = {
  iron: 120,
  coal: 60,
  leather: 20,
  gold: 0
};

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

function getOrders() {
  return load(KEY_ORDERS, []);
}

function findProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

function getInventory() {
  const saved = load(KEY_INVENTORY, {});
  return { ...STARTING_INVENTORY, ...saved };
}

function saveInventory(inventory) {
  save(KEY_INVENTORY, inventory);
}

function addResources(resources) {
  const inventory = getInventory();

  Object.keys(resources).forEach(resource => {
    if (typeof inventory[resource] === "number") {
      inventory[resource] += resources[resource];
    }
  });

  saveInventory(inventory);
  return inventory;
}

function placeOrder(customer, productId, qty) {
  const name = String(customer).trim();
  const amount = Number(qty);
  const product = findProduct(productId);

  if (!name) {
    return { ok: false, error: "Please enter your name." };
  }

  if (!product) {
    return { ok: false, error: "Unknown item." };
  }

  if (!Number.isInteger(amount) || amount < 1 || amount > 20) {
    return { ok: false, error: "Quantity must be a whole number from 1 to 20." };
  }

  const inventory = getInventory();

  // Checks that Gunter has enough materials for the order.
  for (const material in product.materials) {
    const needed = product.materials[material] * amount;

    if ((inventory[material] || 0) < needed) {
      return {
        ok: false,
        error: `Not enough ${material}. Please try a smaller order or wait for restocking.`
      };
    }
  }

  // Reserves the materials when the order is accepted.
  for (const material in product.materials) {
    inventory[material] -= product.materials[material] * amount;
  }

  saveInventory(inventory);

  const next = load(KEY_NEXT, 1001);
  const order = {
    id: "GF-" + next,
    customer: name,
    productId,
    qty: amount,
    status: "Queued",
    createdAt: Date.now()
  };

  const orders = getOrders();
  orders.push(order);

  save(KEY_ORDERS, orders);
  save(KEY_NEXT, next + 1);

  return { ok: true, order };
}

function getOrderPosition(orderId) {
  const activeOrders = getOrders()
    .filter(order => order.status !== "Completed")
    .sort((a, b) => a.createdAt - b.createdAt);

  const index = activeOrders.findIndex(
    order => order.id.toUpperCase() === orderId.trim().toUpperCase()
  );

  return index === -1 ? null : index + 1;
}

function getEstimatedWaitTime(orderId) {
  const orders = getOrders();
  
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