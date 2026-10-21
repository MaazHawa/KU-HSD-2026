
/*
 * Gunter's Forge
 * Shared business data, inventory, orders, and mining progression.
 * Data is stored in the browser using localStorage.
 */

// ------------------------------
// PRODUCTS AND BUSINESS SETTINGS
// ------------------------------

const PRODUCTS = [
  {
    id: "sword",
    name: "Sword",
    icon: "⚔️",
    description: "A dependable forged blade for a town guard or adventurer.",
    category: "Weapons",
    price: 100,
    hours: 2,
    materials: { iron: 8, coal: 5, leather: 1 }
  },
  {
    id: "plate",
    name: "Plate Armor",
    icon: "🛡️",
    description: "Heavy protective armor made for the royal guard.",
    category: "Armor",
    price: 200,
    hours: 4,
    materials: { iron: 40, coal: 20, leather: 6 }
  },
  {
    id: "chain",
    name: "Chain Mail",
    icon: "⛓️",
    description: "Flexible interlocking metal rings for reliable protection.",
    category: "Armor",
    price: 400,
    hours: 6,
    materials: { iron: 20, coal: 10, leather: 2 }
  },
  {
    id: "pot",
    name: "Cooking Pot",
    icon: "🍲",
    description: "A sturdy iron pot for cooking over an open fire.",
    category: "Household",
    price: 800,
    hours: 8,
    materials: { iron: 4, coal: 2, leather: 0 }
  }
];

const STATUSES = ["Queued", "In Progress", "Completed"];

const LOW_STOCK_LIMITS = {
  iron: 20,
  coal: 10,
  leather: 5
};

const KEY_ORDERS = "gf_orders";
const KEY_NEXT = "gf_next_id";
const KEY_INVENTORY = "gf_inventory";
const KEY_LEDGER = "gf_inventory_ledger";
const KEY_BUSINESS = "gf_business";
const KEY_MINE = "gf_mine_data";

const STARTING_INVENTORY = {
  iron: 120,
  coal: 60,
  leather: 20,
  gold: 0
};

const DEFAULT_BUSINESS = {
  totalRevenue: 0,
  totalCompleted: 0,
  totalRestockCost: 0,
  nextTransactionId: 1
};

const DEFAULT_MINE = {
  bestScore: 0,
  pickaxeLevel: 1,
  energyUpgrade: 0,
  totalIronMined: 0,
  totalCoalMined: 0,
  totalGoldMined: 0
};

// ------------------------------
// LOCAL STORAGE HELPERS
// ------------------------------

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save " + key, error);
    return false;
  }
}

function getOrders() {
  const orders = load(KEY_ORDERS, []);
  return Array.isArray(orders) ? orders : [];
}

function findProduct(id) {
  return PRODUCTS.find(product => product.id === id);
}

// ------------------------------
// INVENTORY MANAGEMENT
// ------------------------------

function getInventory() {
  const stored = load(KEY_INVENTORY, {});
  return { ...STARTING_INVENTORY, ...stored };
}

function saveInventory(inventory) {
  return save(KEY_INVENTORY, inventory);
}

function getInventoryLedger() {
  const ledger = load(KEY_LEDGER, []);
  return Array.isArray(ledger) ? ledger : [];
}

function recordInventoryTransaction(
  type,
  resource,
  amount,
  description,
  reference = ""
) {
  const business = getBusinessData();

  const entry = {
    id: business.nextTransactionId,
    type,
    resource,
    amount,
    description,
    reference,
    createdAt: Date.now()
  };

  business.nextTransactionId++;
  save(KEY_BUSINESS, business);

  const ledger = getInventoryLedger();
  ledger.unshift(entry);

  // Keep the latest 200 transactions.
  save(KEY_LEDGER, ledger.slice(0, 200));

  return entry;
}

function getMaterialRequirements(product, quantity) {
  const requirements = {};

  Object.keys(product.materials).forEach(resource => {
    requirements[resource] = product.materials[resource] * quantity;
  });

  return requirements;
}

function checkMaterials(requirements) {
  const inventory = getInventory();

  for (const resource in requirements) {
    if ((inventory[resource] || 0) < requirements[resource]) {
      return {
        ok: false,
        resource,
        needed: requirements[resource],
        available: inventory[resource] || 0
      };
    }
  }

  return { ok: true };
}

function addResources(resources, description = "Resources added") {
  const inventory = getInventory();
  const changes = [];

  for (const resource in resources) {
    const amount = Number(resources[resource]);

    if (
      !Object.prototype.hasOwnProperty.call(inventory, resource) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      continue;
    }

    inventory[resource] += amount;
    changes.push({ resource, amount });
  }

  saveInventory(inventory);

  changes.forEach(change => {
    recordInventoryTransaction(
      "Restock",
      change.resource,
      change.amount,
      description
    );
  });

  return inventory;
}

function getLowStockWarnings() {
  const inventory = getInventory();
  const warnings = [];

  for (const resource in LOW_STOCK_LIMITS) {
    if (inventory[resource] <= LOW_STOCK_LIMITS[resource]) {
      warnings.push({
        resource,
        quantity: inventory[resource],
        threshold: LOW_STOCK_LIMITS[resource],
        message: `${resource} is running low (${inventory[resource]} left).`
      });
    }
  }

  return warnings;
}

// ------------------------------
// BUSINESS STATISTICS
// ------------------------------

function getBusinessData() {
  return {
    ...DEFAULT_BUSINESS,
    ...load(KEY_BUSINESS, {})
  };
}

function saveBusinessData(data) {
  return save(KEY_BUSINESS, data);
}

function getBusinessStats() {
  const orders = getOrders();
  const business = getBusinessData();

  const activeOrders = orders.filter(
    order => order.status !== "Completed"
  );

  const completedOrders = orders.filter(
    order => order.status === "Completed"
  );

  const queuedOrders = activeOrders.filter(
    order => order.status === "Queued"
  );

  const inProgressOrders = activeOrders.filter(
    order => order.status === "In Progress"
  );

  const totalActiveHours = activeOrders.reduce((total, order) => {
    const product = findProduct(order.productId);
    return total + (product ? product.hours * order.qty : 0);
  }, 0);

  const totalOrderValue = orders.reduce((total, order) => {
    const product = findProduct(order.productId);
    return total + (product ? product.price * order.qty : 0);
  }, 0);

  return {
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    queuedOrders: queuedOrders.length,
    inProgressOrders: inProgressOrders.length,
    completedOrders: completedOrders.length,
    totalActiveHours,
    totalRevenue: business.totalRevenue,
    totalCompleted: business.totalCompleted,
    totalOrderValue,
    totalRestockCost: business.totalRestockCost
  };
}

// ------------------------------
// ORDER QUEUE AND SCHEDULING
// ------------------------------

function getQueueOrders() {
  return getOrders()
    .filter(order => order.status !== "Completed")
    .sort((a, b) => {
      // Higher priority comes first. Older orders come first
      // when priorities are equal.
      const priorityDifference =
        (Number(b.priority) || 0) - (Number(a.priority) || 0);

      return priorityDifference || a.createdAt - b.createdAt;
    });
}

function getOrderPosition(orderId) {
  const order = getOrders().find(
    item => item.id.toUpperCase() === String(orderId).trim().toUpperCase()
  );

  if (!order || order.status === "Completed") {
    return null;
  }

  const queue = getQueueOrders();
  const index = queue.findIndex(item => item.id === order.id);

  return index === -1 ? null : index + 1;
}

function getEstimatedCompletion(orderId) {
  const queue = getQueueOrders();
  const index = queue.findIndex(order => order.id === orderId);

  if (index === -1) {
    return null;
  }

  // Orders are processed one at a time for this estimate.
  const hoursAhead = queue.slice(0, index).reduce((total, order) => {
    const product = findProduct(order.productId);
    return total + (product ? product.hours * order.qty : 0);
  }, 0);

  const currentOrder = queue[index];
  const product = findProduct(currentOrder.productId);

  return hoursAhead + (product ? product.hours * currentOrder.qty : 0);
}

function placeOrder(customer, productId, qty, priority = 0) {
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
    return {
      ok: false,
      error: "Quantity must be a whole number from 1 to 20."
    };
  }

  const requirements = getMaterialRequirements(product, amount);
  const materialCheck = checkMaterials(requirements);

  if (!materialCheck.ok) {
    return {
      ok: false,
      error:
        `Not enough ${materialCheck.resource}. ` +
        `Need ${materialCheck.needed}, have ${materialCheck.available}.`
    };
  }

  const inventory = getInventory();

  // Reserve materials when the order is accepted.
  for (const resource in requirements) {
    inventory[resource] -= requirements[resource];
  }

  if (!saveInventory(inventory)) {
    return {
      ok: false,
      error: "Inventory could not be saved. Please try again."
    };
  }

  for (const resource in requirements) {
    if (requirements[resource] > 0) {
      recordInventoryTransaction(
        "Order",
        resource,
        -requirements[resource],
        `Materials reserved for ${product.name}`,
        productId
      );
    }
  }

  const nextId = load(KEY_NEXT, 1001);

  const order = {
    id: "GF-" + nextId,
    customer: name,
    productId,
    qty: amount,
    status: "Queued",
    priority: Number(priority) || 0,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    totalPrice: product.price * amount,
    estimatedHours: product.hours * amount
  };

  const orders = getOrders();
  orders.push(order);

  if (!save(KEY_ORDERS, orders)) {
    // Return the reserved materials if the order cannot be saved.
    for (const resource in requirements) {
      inventory[resource] += requirements[resource];
    }

    saveInventory(inventory);

    return {
      ok: false,
      error: "The order could not be saved. Please try again."
    };
  }

  save(KEY_NEXT, nextId + 1);

  return { ok: true, order };
}

function updateOrderStatus(orderId, nextStatus) {
  if (!STATUSES.includes(nextStatus)) {
    return { ok: false, error: "Invalid order status." };
  }

  const orders = getOrders();
  const order = orders.find(item => item.id === orderId);

  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  if (order.status === "Completed") {
    return { ok: false, error: "This order is already completed." };
  }

  if (
    (order.status === "Queued" && nextStatus !== "In Progress") ||
    (order.status === "In Progress" && nextStatus !== "Completed")
  ) {
    return {
      ok: false,
      error: "Orders must move through the production stages in order."
    };
  }

  order.status = nextStatus;

  if (nextStatus === "In Progress") {
    order.startedAt = Date.now();
  }

  if (nextStatus === "Completed") {
    order.completedAt = Date.now();

    const business = getBusinessData();
    business.totalRevenue += order.totalPrice ||
      ((findProduct(order.productId) || {}).price || 0) * order.qty;
    business.totalCompleted++;
    saveBusinessData(business);
  }

  save(KEY_ORDERS, orders);

  return { ok: true, order };
}

function getCustomerOrders(customerName) {
  const normalizedName = String(customerName).trim().toLowerCase();

  return getOrders()
    .filter(order => order.customer.trim().toLowerCase() === normalizedName)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ------------------------------
// RESTOCKING
// ------------------------------

function restockResource(resource, quantity, unitCost = 0) {
  const amount = Number(quantity);
  const cost = Number(unitCost);

  if (!Object.prototype.hasOwnProperty.call(STARTING_INVENTORY, resource)) {
    return { ok: false, error: "Unknown resource." };
  }

  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    return {
      ok: false,
      error: "Restock quantity must be a whole number from 1 to 1000."
    };
  }

  if (!Number.isFinite(cost) || cost < 0) {
    return { ok: false, error: "Unit cost must be zero or greater." };
  }

  addResources({ [resource]: amount }, "Manual restock");

  const business = getBusinessData();
  business.totalRestockCost += amount * cost;
  saveBusinessData(business);

  return { ok: true, inventory: getInventory() };
}

// ------------------------------
// MINE PROGRESSION
// ------------------------------

function getMineData() {
  return {
    ...DEFAULT_MINE,
    ...load(KEY_MINE, {})
  };
}

function saveMineData(data) {
  return save(KEY_MINE, data);
}

function upgradeMine(upgradeType) {
  const mine = getMineData();
  const inventory = getInventory();

  if (upgradeType === "pickaxe") {
    const cost = mine.pickaxeLevel * 10;

    if (inventory.iron < cost) {
      return {
        ok: false,
        error: `You need ${cost} iron to upgrade your pickaxe.`
      };
    }

    inventory.iron -= cost;
    mine.pickaxeLevel++;

    saveInventory(inventory);
    saveMineData(mine);

    recordInventoryTransaction(
      "Upgrade",
      "iron",
      -cost,
      "Pickaxe upgrade"
    );

    return { ok: true, mine };
  }

  if (upgradeType === "energy") {
    const cost = (mine.energyUpgrade + 1) * 15;

    if (inventory.coal < cost) {
      return {
        ok: false,
        error: `You need ${cost} coal to upgrade your energy capacity.`
      };
    }

    inventory.coal -= cost;
    mine.energyUpgrade++;

    saveInventory(inventory);
    saveMineData(mine);

    recordInventoryTransaction(
      "Upgrade",
      "coal",
      -cost,
      "Mining energy upgrade"
    );

    return { ok: true, mine };
  }

  return { ok: false, error: "Unknown upgrade." };
}

function saveMineRun(resources, score) {
  const mine = getMineData();

  mine.bestScore = Math.max(mine.bestScore, Number(score) || 0);
  mine.totalIronMined += Number(resources.iron) || 0;
  mine.totalCoalMined += Number(resources.coal) || 0;
  mine.totalGoldMined += Number(resources.gold) || 0;

  saveMineData(mine);

  // Mined resources are transferred into the actual shop inventory.
  addResources(resources, "Collected from the mine");

  return mine;
}
