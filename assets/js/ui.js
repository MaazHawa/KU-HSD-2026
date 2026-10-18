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
