function esc(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}

function badge(status) {
  return '<span class="badge ' + status.replace(" ", "-") + '">' + status + "</span>";
}

function renderProducts() {
  document.getElementById("product-list").innerHTML = PRODUCTS.map(p => `
    <div class="card" data-id="${p.id}">
      <span class="icon">${p.icon}</span>
      <h3>${p.name}</h3>
      <div>${p.desc}</div>
      <div class="price">${p.price} gold each <span class="muted">· about ${p.hours}h to forge</span></div>
      <div class="row">
        <input class="order-name" placeholder="Your name" autocomplete="off">
        <input class="order-qty" type="number" min="1" max="20" value="1">
        <button class="order-btn">Order</button>
      </div>
    </div>`).join("");
}

function renderTrackResult(order) {
  const box = document.getElementById("track-result");
  if (!order) {
    box.innerHTML = '<div class="card">No order with that ID was found.</div>';
    return;
  }
  const product = findProduct(order.productId);
  const info = queueInfo(order.id);
  let line;
  if (order.status === "Completed") line = "Your order is ready for pickup!";
  else line = "Position " + info.position + " of " + info.total + " in Gunter's to-do list. Estimated wait: about " + info.hours + " hours.";
  box.innerHTML = `
    <div class="card">
      <h3>${esc(order.id)} ${badge(order.status)}</h3>
      <div>${order.qty} × ${product.name} for ${esc(order.customer)}</div>
      <div class="price">${line}</div>
    </div>`;
}

function renderQueue(highlightId) {
  const queue = activeQueue();
  const list = document.getElementById("queue-list");
  if (!queue.length) {
    list.innerHTML = "<li>The anvil is quiet. No pending orders.</li>";
    return;
  }
  list.innerHTML = queue.map(o => {
    const mine = o.id === highlightId ? ' class="mine"' : "";
    return `<li${mine}>${esc(o.id)}: ${o.qty} × ${findProduct(o.productId).name} ${badge(o.status)}</li>`;
  }).join("");
}

function renderSupplies() {
  const supplies = getSupplies();
  document.getElementById("supply-list").innerHTML = Object.keys(supplies).map(key => {
    const s = supplies[key];
    const isLow = s.amount <= s.low;
    const pct = Math.min(100, Math.round(s.amount / (s.low * 4) * 100));
    return `
      <div class="card ${isLow ? "low" : ""}">
        <strong>${s.label}</strong>: ${s.amount}
        ${isLow ? '<span class="low-text"> · running low!</span>' : ""}
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div class="row"><button class="restock-btn" data-key="${key}">+25 ${s.label}</button></div>
      </div>`;
  }).join("");
}

function renderAdminOrders() {
  const orders = getOrders().sort((a, b) => a.createdAt - b.createdAt);
  const box = document.getElementById("admin-orders");
  if (!orders.length) {
    box.innerHTML = '<div class="card">No orders yet.</div>';
    return;
  }
  box.innerHTML = orders.map(o => {
    const missing = o.status === "Queued" ? shortages(o) : [];
    const label = o.status === "Queued" ? "Start forging" : "Mark complete";
    const action = o.status === "Completed" ? "" : `<button class="advance-btn" data-id="${o.id}">${label}</button>`;
    const warn = missing.length ? `<div class="low-text">Short on: ${missing.join(", ")}</div>` : "";
    return `
      <div class="card">
        <strong>${esc(o.id)}</strong> ${badge(o.status)}
        <div>${o.qty} × ${findProduct(o.productId).name} for ${esc(o.customer)}</div>
        ${warn}
        <div class="row">${action}</div>
      </div>`;
  }).join("");
}

function refreshAll() {
  renderQueue();
  renderSupplies();
  renderAdminOrders();
}

document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button, .view").forEach(el => el.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.view).classList.add("active");
    refreshAll();
  });
});

document.getElementById("product-list").addEventListener("click", e => {
  if (!e.target.classList.contains("order-btn")) return;
  const btn = e.target;
  const card = btn.closest(".card");
  btn.disabled = true;
  const result = placeOrder(card.querySelector(".order-name").value, card.dataset.id, card.querySelector(".order-qty").value);
  if (!result.ok) {
    toast(result.error);
  } else {
    const info = queueInfo(result.order.id);
    toast("Order " + result.order.id + " placed! You are #" + info.position + " in line.");
    document.getElementById("track-id").value = result.order.id;
    card.querySelector(".order-qty").value = 1;
    refreshAll();
  }
  setTimeout(() => { btn.disabled = false; }, 600);
});

document.getElementById("track-form").addEventListener("submit", e => {
  e.preventDefault();
  const order = findOrder(document.getElementById("track-id").value);
  renderTrackResult(order);
  renderQueue(order ? order.id : null);
});

document.getElementById("supply-list").addEventListener("click", e => {
  if (!e.target.classList.contains("restock-btn")) return;
  restock(e.target.dataset.key, 25);
  refreshAll();
});

document.getElementById("admin-orders").addEventListener("click", e => {
  if (!e.target.classList.contains("advance-btn")) return;
  const result = advanceOrder(e.target.dataset.id);
  if (!result.ok) toast(result.error);
  refreshAll();
});

renderProducts();
refreshAll();
