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

document.getElementById("product-list").addEventListener("click", e => {
  if (!e.target.classList.contains("order-btn")) return;
  const btn = e.target;
  const card = btn.closest(".card");
  btn.disabled = true;
  const result = placeOrder(card.querySelector(".order-name").value, card.dataset.id, card.querySelector(".order-qty").value);
  if (!result.ok) {
    toast(result.error);
  } else {
    toast("Order " + result.order.id + " placed!");
    card.querySelector(".order-qty").value = 1;
  }
  setTimeout(() => { btn.disabled = false; }, 600);
});

renderProducts();

function renderQueueTab() {
  const queueHtml = `
    <div class="card">
      <h3>Check Your Position</h3>
      <div class="row">
        <input id="queue-input" placeholder="Order ID (e.g., GF-1001)" autocomplete="off">
        <button id="queue-btn">Check</button>
      </div>
      <div id="queue-result" style="margin-top: 15px; font-weight: bold;"></div>
    </div>
  `;
  document.getElementById("view-queue").innerHTML = queueHtml;
}

document.body.addEventListener("click", e => {
  if (e.target.id === "queue-btn") {
    const orderId = document.getElementById("queue-input").value.trim();
    const resultDiv = document.getElementById("queue-result");
    if (!orderId) {
      resultDiv.textContent = "Please enter an Order ID.";
      return;
    }
    const position = getOrderPosition(orderId);
    if (position === null) {
      resultDiv.textContent = "Order isn't found or already finished.";
    } else {
      resultDiv.textContent = `You are #${position} in line.`;
    }
  }

  if (e.target.tagName === "BUTTON" && e.target.closest("nav")) {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active")); 
    e.target.classList.add("active");
    if (e.target.id === "nav-queue") {
      document.getElementById("view-queue").classList.add("active");
    } else if (e.target.id === "nav-shop") {
      document.getElementById("view-shop").classList.add("active"); 
    }
  }
});

renderQueueTab();