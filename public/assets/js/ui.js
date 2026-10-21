
/**
 * converts text into html-safe text
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * text: the text to escape
 *
 * returns
 * the escaped html string
 */
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * displays a temporary notification
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * message: the notification to display
 *
 * returns
 * nothing
 */
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}

/**
 * displays all available products in the shop
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * none
 *
 * returns
 * nothing
 */
function renderProducts() {
  document.getElementById("product-list").innerHTML = PRODUCTS.map(p => `
    <div class="card" data-id="${p.id}">
      <span class="icon">${p.icon}</span>
      <h3>${p.name}</h3>
      <div class="price">${p.price} gold each <span class="muted">· about ${p.hours}h to forge</span></div>
      <div class="row">
        <input class="order-name" placeholder="Your name" autocomplete="off">
        <input class="order-qty" type="number" min="1" max="20" value="1">
        <button class="order-btn">Order</button>
      </div>
    </div>`).join("");
}

// Handles clicks on product order buttons
document.getElementById("product-list").addEventListener("click", e => {
  if (!e.target.classList.contains("order-btn")) return;

  const btn = e.target;
  const card = btn.closest(".card");
  btn.disabled = true;

  // Creates the order using the entered information
  const result = placeOrder(
    card.querySelector(".order-name").value,
    card.dataset.id,
    card.querySelector(".order-qty").value
  );

  if (!result.ok) {
    toast(result.error);
  } else {
    toast("Order " + result.order.id + " placed!");
    card.querySelector(".order-qty").value = 1;
  }

  // Re-enables the order button after a short delay
  setTimeout(() => {
    btn.disabled = false;
  }, 600);
});

// Displays the products when the page loads
renderProducts();

/**
 * displays all unfinished orders in the workspace queue
 *
 * contribution
 * developed jointly by the author and an ai language model, then reviewed and edited by the author
 *
 * args
 * none
 *
 * returns
 * nothing
 */
function renderWorkspaceQueue() {
  const orders = getOrders();

  // Filters out completed orders and sorts by creation time
  const activeOrders = orders.filter(o => o.status !== "Completed");
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);

  // Creates the HTML for each active order
  const listHtml = activeOrders.map((o, index) => {
    const product = findProduct(o.productId);
    const productName = product ? product.name : "Unknown Item";
    const badgeClass = o.status.replace(" ", "-");

    return `
      <li style="padding: 8px 0; border-bottom: 1px solid var(--bronze);">
        <strong>#${index + 1} - ${esc(o.id)}</strong>: ${esc(o.customer)}
        <span class="muted">ordered ${o.qty}x ${esc(productName)}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="badge ${badgeClass}">${esc(o.status)}</span>
          <button class="complete-btn" data-id="${esc(o.id)}"
            style="min-height: 30px; padding: 4px 10px; font-size: 0.9rem;">Done</button>
        </div>
      </li>
    `;
  }).join("");

  // Displays the queue or a message if it is empty
  document.getElementById("queue-list").innerHTML =
    listHtml || "<li>No active orders currently in queue.</li>";
}

// Handles queue searches, workspace login, navigation, and order completion
document.body.addEventListener("click", e => {
  if (e.target.id === "queue-btn") {
    const orderId = document.getElementById("queue-input").value.trim();
    const resultDiv = document.getElementById("queue-result");

    // Checks that an order ID was entered
    if (!orderId) {
      resultDiv.textContent = "Please enter an Order ID.";
      return;
    }

    // Finds the order's current position in the queue
    const position = getOrderPosition(orderId);

    if (position === null) {
      resultDiv.textContent = "Order isn't found or already finished.";
    } else {
      resultDiv.textContent = `You are #${position} in line.`;
    }
  }

  if (e.target.id === "workspace-unlock-btn") {
    const passInput = document.getElementById("workspace-password");
    const errorDiv = document.getElementById("workspace-error");

    // Checks the workspace password
    if (passInput.value === "gunter123") {
      document.getElementById("workspace-login").style.display = "none";
      document.getElementById("workspace-content").style.display = "block";
      passInput.value = "";
      errorDiv.textContent = "";
      renderWorkspaceQueue();
    } else {
      errorDiv.textContent = "Incorrect password.";
    }
  }

  // Handles navigation between all four views
  if (e.target.tagName === "BUTTON" && e.target.closest("nav")) {
    document.querySelectorAll("nav button").forEach(b =>
      b.classList.remove("active")
    );

    document.querySelectorAll(".view").forEach(v =>
      v.classList.remove("active")
    );

    e.target.classList.add("active");

    if (e.target.id === "nav-queue") {
      document.getElementById("view-queue").classList.add("active");
    } else if (e.target.id === "nav-shop") {
      document.getElementById("view-shop").classList.add("active");
    } else if (e.target.id === "nav-workspace") {
      document.getElementById("view-workspace").classList.add("active");
    } else if (e.target.id === "nav-mine") {
      document.getElementById("view-mine").classList.add("active");
    }
  }

  if (e.target.id === "workspace-refresh-btn") {
    // Reloads the queue and displays a notification
    renderWorkspaceQueue();
    toast("Queue refreshed!");
  }

  if (e.target.classList.contains("complete-btn")) {
    const orderId = e.target.dataset.id;
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    // Marks the selected order as completed and saves the changes
    if (orderIndex !== -1) {
      orders[orderIndex].status = "Completed";
      save(KEY_ORDERS, orders);
      renderWorkspaceQueue();
      toast(orderId + " marked as completed!");
    }
  }
});

/* Gunter's Mine minigame */

let mineEnergy = 12;
let mineResources = { iron: 0, coal: 0, gold: 0 };
let mineScore = 0;
let mineOver = false;

let mineBest = Number(localStorage.getItem("gf_mine_best")) || 0;

// Updates the resource and score displays
function updateMineStats() {
  document.getElementById("mine-energy").textContent = mineEnergy;
  document.getElementById("mine-iron").textContent = mineResources.iron;
  document.getElementById("mine-coal").textContent = mineResources.coal;
  document.getElementById("mine-gold").textContent = mineResources.gold;
  document.getElementById("mine-best").textContent = mineBest;
}

// Creates six random rocks to mine
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
        <span>${rock.icon}</span>
        <small>${rock.name}</small>
      </button>
    `;
  }).join("");

  updateMineStats();
}

// Resets energy, resources, and score for a new run
function resetMine() {
  mineEnergy = 12;
  mineResources = { iron: 0, coal: 0, gold: 0 };
  mineScore = 0;
  mineOver = false;

  document.getElementById("mine-message").textContent =
    "Choose a rock to start mining!";

  renderMine();
}

// Handles mining and restarting
document.body.addEventListener("click", e => {
  if (e.target.closest("#mine-reset")) {
    resetMine();
    return;
  }

  const rock = e.target.closest(".mine-rock");

  if (!rock || mineOver) return;

  const ore = rock.dataset.ore;
  mineEnergy--;

  // Awards resources and points based on the selected ore
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

  // Saves the player's best score
  if (mineScore > mineBest) {
    mineBest = mineScore;
    localStorage.setItem("gf_mine_best", mineBest);
  }

  // Ends the run when the player runs out of energy
  if (mineEnergy === 0) {
    mineOver = true;
    document.getElementById("mine-message").textContent =
      `Mining finished! You scored ${mineScore} points.`;
  } else {
    document.getElementById("mine-message").textContent =
      `You mined ${ore}! Keep going!`;
  }

  renderMine();
});

// Initializes the minigame
renderMine();
