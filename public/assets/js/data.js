let PRODUCTS = [];

const STATUSES = ["Queued", "In Progress", "Completed"];

const LOW_STOCK_LIMITS = {
  iron: 20,
  coal: 10,
  leather: 5
};

let workspacePassword = "";

async function request(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok && data.ok === undefined) data.ok = false;
    return data;
  } catch (e) {
    return { ok: false, error: "Can't reach the forge server. Please try again." };
  }
}

function passwordHeaders() {
  return { "Content-Type": "application/json", "x-password": workspacePassword };
}

async function loadProducts() {
  const data = await request("/api/products");
  if (Array.isArray(data)) PRODUCTS = data;
  return PRODUCTS;
}

async function checkPassword(password) {
  workspacePassword = password;
  const data = await request("/api/orders/incomplete", { headers: passwordHeaders() });
  if (!data.ok) workspacePassword = "";
  return data.ok;
}

async function getOrders() {
  const data = await request("/api/orders/incomplete", { headers: passwordHeaders() });
  return data.ok ? data.orders : [];
}

async function getOrder(orderId) {
  const data = await request(`/api/orders/${encodeURIComponent(orderId)}`);
  return data.id ? data : null;
}

function findProduct(id) {
  return PRODUCTS.find(product => product.id === id);
}

// ------------------------------
// INVENTORY MANAGEMENT
// ------------------------------

async function getInventory() {
  const data = await request("/api/inventory", { headers: passwordHeaders() });
  return data.ok ? data.inventory : {};
}

async function addResources(resources) {
  const [material, amount] = Object.entries(resources)[0];
  return request("/api/inventory/restock", {
    method: "POST",
    headers: passwordHeaders(),
    body: JSON.stringify({ material, amount })
  });
}

async function placeOrder(customer, productId, qty) {
  return request("/api/orders/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, productId, qty })
  });
}

async function setOrderStatus(orderId, status) {
  const action = status === "In Progress" ? "start" : "complete";
  return request(`/api/orders/${encodeURIComponent(orderId)}/${action}`, {
    method: "POST",
    headers: passwordHeaders()
  });
}

async function getOrderPosition(orderId) {
  const data = await request(`/api/orders/${encodeURIComponent(orderId)}/position`);
  return data.ok ? data.position : null;
}

async function startMineRun() {
  return request("/api/mine/runs", { method: "POST" });
}

async function digRock(runId, rock) {
  return request(`/api/mine/runs/${runId}/dig`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rock })
  });
}

async function getEstimatedWaitTime(orderId) {
  const data = await request(`/api/orders/${encodeURIComponent(orderId)}/wait`);
  return data.ok ? data.waitTime : null;
}