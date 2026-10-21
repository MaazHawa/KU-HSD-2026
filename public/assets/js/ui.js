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

async function renderProducts() {
  const res = await fetch("/api/products");
  const products = await res.json();
  document.getElementById("product-list").innerHTML = products.map(p => `
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

document.getElementById("product-list").addEventListener("click", async e => {
  if (!e.target.classList.contains("order-btn")) return;
  const btn = e.target;
  const card = btn.closest(".card");
  btn.disabled = true;
  const res = await fetch("/api/orders/place",{
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      customer: card.querySelector(".order-name").value, 
      productId: card.dataset.id, 
      qty: card.querySelector(".order-qty").value })
  }); 
  const data = await res.json();
  if (!data.ok) {
    toast(data.error);
  } else {
    toast("Order " + data.order.id + " placed!");
    card.querySelector(".order-qty").value = 1;
  }
  setTimeout(() => { btn.disabled = false; }, 600);
});

renderProducts();

async function renderWorkspaceQueue(pass) {
  const res = await fetch("/api/orders/incomplete", {
    headers : { "x-password": pass }
  }); 
  const data = await res.json();
  if (!data.ok) {
    toast(data.error);
    return false;
  }
  const orders = data.orders;

  const listHtml = orders.map((o, index) => {
    const product = findProduct(o.productId);
    const productName = product ? product.name : "Unknown Item";
    const badgeClass = o.status.replace(" ", "-"); 
    return `
      <li style="padding: 8px 0; border-bottom: 1px solid var(--bronze);">
        <strong>#${index + 1} - ${o.id}</strong>: ${o.customer} 
        <span class="muted">ordered ${o.qty}x ${productName}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="badge ${badgeClass}">${o.status}</span>
          <button class="complete-btn" data-id="${o.id}" style="min-height: 30px; padding: 4px 10px; font-size: 0.9rem;">Done</button>
        </div>
      </li>
    `;
  }).join("");

  
  document.getElementById("queue-list").innerHTML = listHtml || "<li>No active orders currently in queue.</li>";
}

document.body.addEventListener("click", async e => {
  if (e.target.id === "queue-btn") {
    const orderId = document.getElementById("queue-input").value.trim();
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    const resultDiv = document.getElementById("queue-result");
    
    if (!orderId) {
      resultDiv.textContent = "Please enter an Order ID.";
      return;
    }

    const posres = await fetch(`/api/orders/${orderId}/position`);
    const podata = await posres.json();
    const position = podata.position;
    
    if (position == -1) {
      resultDiv.textContent = "Order isn't found or already finished.";
    } else {
      resultDiv.textContent = `You are #${position} in line.`;
    }
  }

  if (e.target.id === "workspace-unlock-btn") {
    const passInput = document.getElementById("workspace-password");
    const errorDiv = document.getElementById("workspace-error");
    
    if (passInput.value === "gunter123") {
      document.getElementById("workspace-login").style.display = "none";
      document.getElementById("workspace-content").style.display = "block";
      passInput.value = ""; 
      renderWorkspaceQueue(passInput);
    } else {
      errorDiv.textContent = "Incorrect password.";
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
    } else if (e.target.id === "nav-workspace") {
      document.getElementById("view-workspace").classList.add("active"); 
    }
  }

  if (e.target.id === "workspace-refresh-btn") {
    renderWorkspaceQueue();
    toast("Queue refreshed!");
  }

  if (e.target.classList.contains("complete-btn")) {
    const orderId = e.target.dataset.id;
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].status = "Completed";
            save(KEY_ORDERS, orders);
            renderWorkspaceQueue();
      toast(orderId + " marked as completed!");
    }
  }
});

