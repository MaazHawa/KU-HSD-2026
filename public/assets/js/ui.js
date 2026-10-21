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

// handles clicks on product order buttons
document.getElementById("product-list").addEventListener("click", e => {
  if (!e.target.classList.contains("order-btn")) return;
  const btn = e.target;
  const card = btn.closest(".card");
  btn.disabled = true;

  // creates the order using the entered information
  const result = placeOrder(card.querySelector(".order-name").value, card.dataset.id, card.querySelector(".order-qty").value);

  if (!result.ok) {
    toast(result.error);
  } else {
    toast("Order " + result.order.id + " placed!");
    card.querySelector(".order-qty").value = 1;
  }

  // re-enables the order button after a short delay
  setTimeout(() => { btn.disabled = false; }, 600);
});

// displays the products when the page loads
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

  // filters out completed orders and sorts by creation time
  const activeOrders = orders.filter(o => o.status !== "Completed");
  activeOrders.sort((a, b) => a.createdAt - b.createdAt);

  // creates the html for each active order
  const listHtml = activeOrders.map((o, index) => {
    const product = findProduct(o.productId);
    const productName = product ? product.name : "Unknown Item";
    const badgeClass = o.status.replace(" ", "-");

    return `
      <li style="padding: 8px 0; border-bottom: 1px solid var(--bronze);">
        <strong>#${index + 1} - ${o.id}</strong>: ${o.customer}
        <span class="muted">ordered ${o.qty}x ${productName}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="badge ${badgeClass}">${o.status}</span>
          <button class="complete-btn" data-id="${o.id}" style="min-height: 30px; padding: 4px 10px; font-size: 0.9rem;">Done</button>
        </div>
      </li>
    `;
  }).join("");

  // displays the queue or a message if it is empty
  document.getElementById("queue-list").innerHTML = listHtml || "<li>No active orders currently in queue.</li>";
}

// handles queue searches, workspace login, navigation, and order completion
document.body.addEventListener("click", e => {
  if (e.target.id === "queue-btn") {
    const orderId = document.getElementById("queue-input").value.trim();
    const resultDiv = document.getElementById("queue-result");

    // checks that an order id was entered
    if (!orderId) {
      resultDiv.textContent = "Please enter an Order ID.";
      return;
    }

    // finds the order's current position in the queue
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

    // checks the workspace password
    if (passInput.value === "gunter123") {
      document.getElementById("workspace-login").style.display = "none";
      document.getElementById("workspace-content").style.display = "block";
      passInput.value = "";
      renderWorkspaceQueue();
    } else {
      errorDiv.textContent = "Incorrect password.";
    }
  }

  if (e.target.tagName === "BUTTON" && e.target.closest("nav")) {
    // updates the active navigation button and view
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    e.target.classList.add("active");

    if (e.target.id === "nav-queue") {
      document.getElementById("view-queue").classList.add("active");
    } else if (e.target.id === "nav-shop") {
      document.getElementById("view-shop").classList.add("active");
    } else if (e.target.id === "nav-workspace") {
      document.getElementById("view-workspace").classList.add("active");
    } else if (e.target.id === "nav-game") {
      document.getElementById("view-game").classList.add("active");
    }
  }

  if (e.target.id === "workspace-refresh-btn") {
    // reloads the queue and displays a notification
    renderWorkspaceQueue();
    toast("Queue refreshed!");
  }

  if (e.target.classList.contains("complete-btn")) {
    const orderId = e.target.dataset.id;
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    // marks the selected order as completed and saves the changes
    if (orderIndex !== -1) {
      orders[orderIndex].status = "Completed";
      save(KEY_ORDERS, orders);
      renderWorkspaceQueue();
      toast(orderId + " marked as completed!");
    }
  }
});