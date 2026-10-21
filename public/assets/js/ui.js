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
      <h3>${esc(p.name)}</h3>
      <div class="price">${p.price} gold each
        <span class="muted">· about ${p.hours}h to forge</span>
      </div>
      <p class="muted">Materials per item: ${Object.entries(p.materials)
        .filter(([material, amount]) => amount > 0)
        .map(([material, amount]) => `${amount}${material}`)
        .join(", ")}</p>
      <div class="row">
        <input class="order-name" placeholder="Your name" autocomplete="off">
        <input class="order-qty" type="number" min="1" max="20" value="1">
        <button class="order-btn">Order</button>
      </div>
    </div>
  `).join("");
}

function renderInventory() {
  const inventory = getInventory();

  document.getElementById("inventory-iron").textContent = inventory.iron;
  document.getElementById("inventory-coal").textContent = inventory.coal;
  document.getElementById("inventory-leather").textContent = inventory.leather;
  document.getElementById("inventory-gold").textContent = inventory.gold;

  const warnings = [];

  if (inventory.iron < 20) warnings.push("Iron is running low.");
  if (inventory.coal < 10) warnings.push("Coal is running low.");
  if (inventory.leather < 5) warnings.push("Leather is running low.");

  document.getElementById("inventory-warning").textContent =
    warnings.length ? warnings.join(" ") : "Stock levels look good.";
}

function renderWorkspaceQueue() {
  const activeOrders = getOrders()
    .filter(order => order.status !== "Completed")
    .sort((a, b) => a.createdAt - b.createdAt);

  const listHtml = activeOrders.map((order, index) => {
    const product = findProduct(order.productId);
    const productName = product ? product.name : "Unknown Item";
    const badgeClass = order.status.replace(" ", "-");

    const nextStatus = order.status === "Queued"
      ? "In Progress"
      : "Completed";

    const buttonText = order.status === "Queued"
      ? "Start"
      : "Done";

    return `
      <li style="padding: 10px 0; border-bottom: 1px solid var(--bronze);">
         <strong>#${index + 1} ${esc(order.id)}</strong>:
        ${esc(order.customer)}
        <div class="muted">${order.qty}x ${esc(productName)}</div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px;">
          <span class="badge ${badgeClass}">${esc(order.status)}</span>
          <button class="advance-btn" data-id="${esc(order.id)}"
            data-next="${nextStatus}"
            style="min-height:32px; padding:4px 10px;">
            ${buttonText}
          </button>
        </div>
      </li>
    `;
  }).join("");

  document.getElementById("queue-list").innerHTML =
    listHtml || "<li>No active orders currently in queue.</li>";
}

function renderOrderTracking(orderId) {
  const resultDiv = document.getElementById("queue-result");
  const normalizedId = orderId.trim().toUpperCase();

  if (!normalizedId) {
    resultDiv.textContent = "Please enter an Order ID.";
    return;
  }

  const order = getOrders().find(
    item => item.id.toUpperCase() === normalizedId
  );

  if (!order) {
    resultDiv.textContent = "Order not found. Check the ID and try again.";
    return;
  }

  const product = findProduct(order.productId);
  const productName = product ? product.name : "Unknown Item";
  const position = getOrderPosition(order.id);
  
  // Calculate the wait time using the function from data.js
  const waitTime = getEstimatedWaitTime(order.id);

  if (order.status === "Completed") {
    resultDiv.textContent =
      `${order.id}: ${order.qty}x ${productName}. Status: Completed!`;
  } else {
    // Show position and estimated wait time
    resultDiv.innerHTML = `
      ${order.id}: ${order.qty}x ${productName}. Status: ${order.status}. Queue position: #${position}.<br>
      <span style="color: var(--warn); font-size: 0.9em; display: inline-block; margin-top: 4px;">
        Estimated wait: ${waitTime} hours
      </span>
    `;
  }
}

function refreshWorkspace() {
  renderWorkspaceQueue();
  renderInventory();
}

function showView(viewId, button) {
  document.querySelectorAll("nav button").forEach(item =>
    item.classList.remove("active")
  );

  document.querySelectorAll("main > .view").forEach(view =>
    view.classList.remove("active")
  );

  button.classList.add("active");
  document.getElementById(viewId).classList.add("active");

  if (viewId === "view-workspace") {
    refreshWorkspace();
  }
}

// Places an order from the Shop.
document.getElementById("product-list").addEventListener("click", event => {
  const button = event.target.closest(".order-btn");
  if (!button) return;

  const card = button.closest(".card");
  button.disabled = true;

  const result = placeOrder(
    card.querySelector(".order-name").value,
    card.dataset.id,
    card.querySelector(".order-qty").value
  );

  if (!result.ok) {
    toast(result.error);
  } else {
    toast(`Order ${result.order.id} placed! Save your order ID.`);
    card.querySelector(".order-name").value = "";
    card.querySelector(".order-qty").value = "1";
    renderInventory();
  }

  setTimeout(() => {
    button.disabled = false;
  }, 600);
});

// Handles navigation and other application buttons.
document.body.addEventListener("click", event => {
  const navButton = event.target.closest("nav button");

  if (navButton) {
    const views = {
      "nav-shop": "view-shop",
      "nav-queue": "view-queue",
      "nav-workspace": "view-workspace",
      "nav-mine": "view-mine"
    };

    if (views[navButton.id]) {
      showView(views[navButton.id], navButton);
    }
    return;
  }

  if (event.target.closest("#queue-btn")) {
    renderOrderTracking(document.getElementById("queue-input").value);
    return;
  }

  if (event.target.closest("#workspace-unlock-btn")) {
    const password = document.getElementById("workspace-password");
    const error = document.getElementById("workspace-error");

    if (password.value === "gunter123") {
      document.getElementById("workspace-login").style.display = "none";
      document.getElementById("workspace-content").style.display = "block";
      password.value = "";
      error.textContent = "";
      refreshWorkspace();
      toast("Workspace unlocked.");
    } else {
      error.textContent = "Incorrect password.";
    }
    return;
  }

  if (event.target.closest("#workspace-refresh-btn")) {
    refreshWorkspace();
    toast("Inventory and queue refreshed.");
    return;
  }

  if (event.target.closest("#restock-leather-btn")) {
    addResources({ leather: 10 });
    renderInventory();
    toast("Leather delivery recorded: +10.");
    return;
  }

  const advanceButton = event.target.closest(".advance-btn");

  if (advanceButton) {
    const orderId = advanceButton.dataset.id;
    const nextStatus = advanceButton.dataset.next;
    const orders = getOrders();
    const order = orders.find(item => item.id === orderId);

    if (order && STATUSES.includes(nextStatus)) {
      order.status = nextStatus;
      save(KEY_ORDERS, orders);
      refreshWorkspace();
      toast(`${orderId}: ${nextStatus}.`);
    }
    return;
  }

  if (event.target.closest("#mine-reset")) {
    resetMine();
    return;
  }

  const rock = event.target.closest(".mine-rock");

  if (rock && !mineOver) {
    mineRock(rock.dataset.ore);
  }
});

// ------------------------------
// Gunter's Mine minigame
// ------------------------------

let mineEnergy = 12;
let mineResources = { iron: 0, coal: 0, gold: 0 };
let mineScore = 0;
let mineOver = false;
let mineBest = Number(localStorage.getItem("gf_mine_best")) || 0;

function updateMineStats() {
  document.getElementById("mine-energy").textContent = mineEnergy;
  document.getElementById("mine-iron").textContent = mineResources.iron;
  document.getElementById("mine-coal").textContent = mineResources.coal;
  document.getElementById("mine-gold").textContent = mineResources.gold;
  document.getElementById("mine-best").textContent = mineBest;
}

function renderMine() {
  const rocks = document.getElementById("mine-rocks");

  const types = [
    { name: "Iron Ore", icon: "🪨", type: "iron" },
    { name: "Coal", icon: "⚫", type: "coal" },
    { name: "Gold Ore", icon: "🟡", type: "gold" }
  ];

  rocks.innerHTML = Array.from({ length: 6 }, () => {
    const rock = types[Math.floor(Math.random() * types.length)];

    return `
      <button class="mine-rock" data-ore="${rock.type}"
        ${mineOver ? "disabled" : ""}>
        <span>${rock.icon}</span><br>
        <small>${rock.name}</small>
      </button>
    `;
  }).join("");

  updateMineStats();
}

function mineRock(ore) {
  if (mineEnergy <= 0 || mineOver) return;

  mineEnergy--;

  if (ore === "iron") {
    mineResources.iron++;
    mineScore += 10;
  } else if (ore === "coal") {
    mineResources.coal++;
    mineScore += 5;
  } else if (ore === "gold") {
    mineResources.gold++;
    mineScore += 25;
  }

  if (mineScore > mineBest) {
    mineBest = mineScore;
    localStorage.setItem("gf_mine_best", mineBest);
  }

  // Transfers mined resources into the workshop inventory.
  if (ore === "iron") addResources({ iron: 1 });
  if (ore === "coal") addResources({ coal: 1 });
  if (ore === "gold") addResources({ gold: 1 });

  if (mineEnergy === 0) {
    mineOver = true;
    document.getElementById("mine-message").textContent =
      `Run finished! Score: ${mineScore}. Your mined resources were added to inventory.`;
  } else {
    document.getElementById("mine-message").textContent =
      `You collected ${ore}! Your resources were added to the workshop.`;
  }

  renderMine();
}

function resetMine() {
  mineEnergy = 12;
  mineResources = { iron: 0, coal: 0, gold: 0 };
  mineScore = 0;
  mineOver = false;

  document.getElementById("mine-message").textContent =
    "Choose a rock to start mining!";

  renderMine();
}

// Initial page setup.
renderProducts();
renderInventory(); 
renderMine();