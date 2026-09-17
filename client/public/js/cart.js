(function () {
  "use strict";

  var CART_KEY = "pizzazone_cart";
  var getDynamicApiBase = function() {
    var hostname = window.location.hostname;
    var protocol = window.location.protocol;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5001/api';
    }
    var isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isIp) {
      return protocol + '//' + hostname + ':5001/api';
    }
    return '/api';
  };
  var API_BASE = getDynamicApiBase();
  var storeSettings = {
    taxPercentage: 0,
    deliveryCharge: 0
  };

  function fetchSettings() {
    fetch(API_BASE + "/settings/public")
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success && data.data) {
          if (data.data.TAX_PERCENTAGE !== undefined) {
            storeSettings.taxPercentage = Number(data.data.TAX_PERCENTAGE) || 0;
          }
          if (data.data.DELIVERY_BASE_CHARGE !== undefined) {
            storeSettings.deliveryCharge = Number(data.data.DELIVERY_BASE_CHARGE) || 0;
          }
          renderCart();
        }
      })
      .catch(function(err) { console.error("Failed to load settings:", err); });
  }

  function fetchBankAccounts() {
    fetch(API_BASE + "/bank-accounts")
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success && data.data) {
          bankAccounts = data.data;
          renderBankAccounts();
        }
      })
      .catch(function(err) { console.error("Failed to load bank accounts:", err); });
  }

  function renderBankAccounts() {
    var container = document.getElementById("cart-bank-accounts");
    if (!container) return;
    
    if (bankAccounts.length === 0) {
      container.innerHTML = '<div style="font-size: 11px; color: #dc2626;">No bank accounts configured.</div>';
      return;
    }

    container.innerHTML = bankAccounts.map(function(bank) {
      return `
        <div style="background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; font-size: 11px; color: #334155;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${escapeHtml(bank.bankName)}</div>
          <div style="display: grid; grid-template-columns: 50px 1fr; gap: 2px;">
            <span style="color: #64748b;">Title:</span> <span style="font-weight: 600;">${escapeHtml(bank.accountTitle)}</span>
            <span style="color: #64748b;">Acc:</span> <span style="font-weight: 600; font-family: monospace;">${escapeHtml(bank.accountNumber)}</span>
            ${bank.iban ? `<span style="color: #64748b;">IBAN:</span> <span style="font-weight: 600; font-family: monospace;">${escapeHtml(bank.iban)}</span>` : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  function parsePrice(raw) {
    var cleaned = (raw || "").replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch (err) {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCart(name, size, price) {
    var cart = getCart();
    var existing = cart.find(function (item) {
      return item.name === name && item.size === size && item.price === price;
    });

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name: name, size: size, price: price, qty: 1 });
    }

    setCart(cart);
    renderCart();
  }

  function updateQty(index, delta) {
    var cart = getCart();
    if (!cart[index]) return;

    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }

    setCart(cart);
    renderCart();
  }

  function removeItem(index) {
    var cart = getCart();
    cart.splice(index, 1);
    setCart(cart);
    renderCart();
  }

  function renderCart() {
    var cart = getCart();
    var cartItems = document.getElementById("cart-items");
    var cartCount = document.getElementById("cart-count");
    
    var cartSubtotalEl = document.getElementById("cart-subtotal");
    var cartDeliveryEl = document.getElementById("cart-delivery");
    var cartDeliveryRow = document.getElementById("cart-delivery-row");
    var cartTaxEl = document.getElementById("cart-tax");
    var cartTaxRow = document.getElementById("cart-tax-row");
    var cartTotal = document.getElementById("cart-total");

    if (!cartItems || !cartCount || !cartTotal) return;

    var totalCount = cart.reduce(function (acc, item) { return acc + item.qty; }, 0);
    var subtotalAmount = cart.reduce(function (acc, item) { return acc + (item.qty * item.price); }, 0);
    var taxAmount = Math.round((subtotalAmount * storeSettings.taxPercentage) / 100);
    var deliveryAmount = cart.length > 0 ? storeSettings.deliveryCharge : 0;
    var totalAmount = subtotalAmount + taxAmount + deliveryAmount;

    cartCount.textContent = String(totalCount);
    
    if (cartSubtotalEl) cartSubtotalEl.textContent = String(subtotalAmount);
    if (cartDeliveryEl) cartDeliveryEl.textContent = String(deliveryAmount);
    if (cartTaxEl) cartTaxEl.textContent = String(taxAmount);
    cartTotal.textContent = String(totalAmount);

    if (cartDeliveryRow) {
      cartDeliveryRow.style.display = cart.length > 0 ? "flex" : "none";
    }
    if (cartTaxRow) {
      cartTaxRow.style.display = cart.length > 0 ? "flex" : "none";
    }

    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="cart-empty">No items yet. Add your favorite menu items.</div>';
      return;
    }

    cartItems.innerHTML = cart.map(function (item, index) {
      var lineTotal = item.qty * item.price;
      var sizeLabel = item.size ? "Size: " + item.size : "Single item";

      return (
        '<div class="cart-item">' +
          '<p class="cart-item-title">' + escapeHtml(item.name) + '</p>' +
          '<div class="cart-item-size">' + escapeHtml(sizeLabel) + '</div>' +
          '<div class="cart-row">' +
            '<div class="qty-controls">' +
              '<button class="qty-btn" data-action="minus" data-index="' + index + '">-</button>' +
              '<span>' + item.qty + '</span>' +
              '<button class="qty-btn" data-action="plus" data-index="' + index + '">+</button>' +
            '</div>' +
            '<div class="cart-price">Rs. ' + lineTotal + '</div>' +
          '</div>' +
          '<button class="remove-btn" data-action="remove" data-index="' + index + '">Remove</button>' +
        '</div>'
      );
    }).join("");

    cartItems.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var index = parseInt(btn.getAttribute("data-index"), 10);
        var action = btn.getAttribute("data-action");

        if (action === "plus") updateQty(index, 1);
        if (action === "minus") updateQty(index, -1);
        if (action === "remove") removeItem(index);
      });
    });
  }

  function enhanceMenuCards() {
    document.querySelectorAll(".menu-card").forEach(function (card) {
      if (card.getAttribute("data-cart-enhanced") === "1") return;

      var nameEl = card.querySelector(".menu-item-name");
      if (!nameEl) return;
      var itemName = nameEl.textContent.trim();

      var sizeBoxes = card.querySelectorAll(".size-box");
      sizeBoxes.forEach(function (box) {
        var labelEl = box.querySelector(".size-label");
        var priceEl = box.querySelector(".size-price");
        if (!priceEl) return;

        var size = labelEl ? labelEl.textContent.trim() : "Single";
        var price = parsePrice(priceEl.textContent);

        var btn = document.createElement("button");
        btn.className = "menu-add-btn";
        btn.type = "button";
        btn.textContent = "Add " + size + " (Rs. " + price + ")";
        btn.addEventListener("click", function () {
          addToCart(itemName, size, price);
          showStatus("Added to cart: " + itemName + " (" + size + ")", false);
        });

        box.appendChild(btn);
      });

      card.setAttribute("data-cart-enhanced", "1");
    });
  }

  function enhanceListRows() {
    document.querySelectorAll(".item-row").forEach(function (row) {
      if (row.getAttribute("data-cart-enhanced") === "1") return;

      var nameEl = row.querySelector(".item-row-name");
      var priceEl = row.querySelector(".item-row-price");
      if (!nameEl || !priceEl) return;

      var name = nameEl.textContent.trim();
      var price = parsePrice(priceEl.textContent);

      var addBtn = document.createElement("button");
      addBtn.className = "list-add-btn";
      addBtn.type = "button";
      addBtn.textContent = "Add";
      addBtn.addEventListener("click", function () {
        addToCart(name, "Regular", price);
        showStatus("Added to cart: " + name, false);
      });

      row.appendChild(addBtn);
      row.setAttribute("data-cart-enhanced", "1");
    });
  }

  function toggleCart(open) {
    var drawer = document.getElementById("cart-drawer");
    var backdrop = document.getElementById("cart-backdrop");
    if (!drawer || !backdrop) return;

    if (open) {
      drawer.classList.add("open");
      backdrop.classList.add("open");
      document.body.classList.add("ck-no-scroll");
    } else {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      document.body.classList.remove("ck-no-scroll");
    }
  }

  function showStatus(message, isError) {
    var box = document.getElementById("order-status");
    if (!box) return;

    box.textContent = message;
    box.classList.toggle("ck-status--error", !!isError);
    box.classList.toggle("ck-status--ok", !isError);
  }

  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("cheezka_user") || "null");
    } catch (err) {
      return null;
    }
  }

  function updatePlaceOrderAccess() {
    var placeBtn = document.getElementById("place-order-btn");
    if (!placeBtn) return;

    var user = getLoggedInUser();
    if (user && user.email) {
      placeBtn.disabled = false;
      placeBtn.textContent = "Place Online Order";
      return;
    }

    placeBtn.disabled = true;
    placeBtn.textContent = "Login Required";
    showStatus("Please login first to place an order.", true);
  }

  function placeOrder() {
    var user = getLoggedInUser();
    if (!user || !user.email) {
      showStatus("Please login first to place an order. Redirecting...", true);
      setTimeout(function () {
        window.location.href = "login.html";
      }, 900);
      return;
    }

    var cart = getCart();
    var name = (document.getElementById("customer-name") || {}).value || "";
    var phone = (document.getElementById("customer-phone") || {}).value || "";
    var address = (document.getElementById("customer-address") || {}).value || "";
    var paymentMethod = (document.getElementById("payment-method") || {}).value || "Cash on Delivery";
    var notes = (document.getElementById("order-notes") || {}).value || "";

    if (cart.length === 0) {
      showStatus("Cart is empty. Add items first.", true);
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showStatus("Please fill name, phone, and address.", true);
      return;
    }

    var total = cart.reduce(function (acc, item) { return acc + item.qty * item.price; }, 0);

    // Online Payment validation
    var transactionId = "";
    var screenshotFile = null;
    if (paymentMethod === "Online Payment") {
      transactionId = (document.getElementById("transaction-id") || {}).value || "";
      var fileInput = document.getElementById("payment-screenshot");
      screenshotFile = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!transactionId.trim() || !screenshotFile) {
        showStatus("Transaction ID and Screenshot are required for Online Payment.", true);
        return;
      }
    }

    var placeBtn = document.getElementById("place-order-btn");
    if (placeBtn) {
      placeBtn.disabled = true;
      placeBtn.textContent = "Placing...";
    }

    // Map the items to what the Node backend expects
    var orderItems = cart.map(function(item) {
      return {
        name: item.name,
        size: item.size,
        price: item.price,
        quantity: item.qty
      };
    });

    var mappedPaymentMethod = paymentMethod === 'Online Payment' ? 'Online' : 'COD';

    // The Node.js API requires Authorization header
    var headers = { "Content-Type": "application/json" };
    if (user.token) {
      headers["Authorization"] = "Bearer " + user.token;
    }

    fetch(API_BASE + "/orders", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        shippingAddress: address.trim(),
        phoneNumber: phone.trim(),
        paymentMethod: mappedPaymentMethod,
        notes: notes.trim(),
        orderItems: orderItems
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (err) {
            throw new Error((err && err.detail) || "Could not place order");
          });
        }
        return response.json();
      })
      .then(function (savedOrder) {
        if (!savedOrder.success) {
          throw new Error(savedOrder.message || "Failed to place order");
        }

        var orderId = savedOrder.data._id;

        // If online payment, upload the screenshot
        if (mappedPaymentMethod === 'Online' && screenshotFile) {
          showStatus("Order created. Uploading receipt...", false);
          var formData = new FormData();
          formData.append("order", orderId);
          formData.append("transactionId", transactionId.trim());
          formData.append("screenshot", screenshotFile);

          // Need auth header without Content-Type so browser sets boundary
          var uploadHeaders = {};
          if (user.token) uploadHeaders["Authorization"] = "Bearer " + user.token;

          return fetch(API_BASE + "/payments", {
            method: "POST",
            headers: uploadHeaders,
            body: formData
          }).then(function(uploadRes) {
            if (!uploadRes.ok) {
              return uploadRes.json().then(function(err) {
                throw new Error("Order placed, but receipt upload failed: " + (err.message || err.detail));
              });
            }
            return savedOrder;
          });
        }

        return savedOrder;
      })
      .then(function (finalOrder) {
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem("cheezka_checkout_form");

        (document.getElementById("customer-name") || {}).value = "";
        (document.getElementById("customer-phone") || {}).value = "";
        (document.getElementById("customer-address") || {}).value = "";
        (document.getElementById("order-notes") || {}).value = "";
        (document.getElementById("transaction-id") || {}).value = "";
        if (document.getElementById("payment-screenshot")) {
          document.getElementById("payment-screenshot").value = "";
        }

        showStatus("Order placed successfully! ID: " + finalOrder.data._id.slice(-8).toUpperCase(), false);
        renderCart();
        
        // Redirect to tracking page after 2 seconds
        setTimeout(function() {
          window.location.href = "/orders/" + finalOrder.data._id + "/track";
        }, 2000);
      })
      .catch(function (err) {
        showStatus("Order failed: " + err.message, true);
      })
      .finally(function () {
        if (placeBtn) {
          placeBtn.disabled = false;
          placeBtn.textContent = "Place Online Order";
        }
      });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function saveCheckoutFormToStorage() {
    var formData = {
      name: (document.getElementById("customer-name") || {}).value || "",
      phone: (document.getElementById("customer-phone") || {}).value || "",
      address: (document.getElementById("customer-address") || {}).value || "",
      paymentMethod: (document.getElementById("payment-method") || {}).value || "Cash on Delivery",
      notes: (document.getElementById("order-notes") || {}).value || ""
    };
    localStorage.setItem("cheezka_checkout_form", JSON.stringify(formData));
  }

  function restoreCheckoutFormFromStorage() {
    try {
      var saved = JSON.parse(localStorage.getItem("cheezka_checkout_form") || "{}");
      if (saved.name) (document.getElementById("customer-name") || {}).value = saved.name;
      if (saved.phone) (document.getElementById("customer-phone") || {}).value = saved.phone;
      if (saved.address) (document.getElementById("customer-address") || {}).value = saved.address;
      if (saved.paymentMethod) (document.getElementById("payment-method") || {}).value = saved.paymentMethod;
      if (saved.notes) (document.getElementById("order-notes") || {}).value = saved.notes;
    } catch (err) {
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetchSettings();
    fetchBankAccounts();
    enhanceMenuCards();
    enhanceListRows();
    renderCart();
    updatePlaceOrderAccess();

    var openBtn = document.getElementById("open-cart-btn");
    var closeBtn = document.getElementById("close-cart-btn");
    var backdrop = document.getElementById("cart-backdrop");
    var placeBtn = document.getElementById("place-order-btn");

    if (openBtn) {
      openBtn.addEventListener("click", function () {
        toggleCart(true);
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        toggleCart(false);
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        toggleCart(false);
      });
    }
    if (placeBtn) {
      placeBtn.addEventListener("click", placeOrder);
    }

    var checkoutInputs = [
      "customer-name",
      "customer-phone",
      "customer-address",
      "payment-method",
      "order-notes"
    ];

    checkoutInputs.forEach(function (inputId) {
      var input = document.getElementById(inputId);
      if (input) {
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && input.tagName !== "TEXTAREA") {
            e.preventDefault();
            return false;
          }
        });

        input.addEventListener("change", function () {
          saveCheckoutFormToStorage();
          if (inputId === "payment-method") {
            var detailsDiv = document.getElementById("online-payment-details");
            if (detailsDiv) {
              detailsDiv.style.display = input.value === "Online Payment" ? "block" : "none";
            }
          }
        });
        input.addEventListener("input", function () {
          saveCheckoutFormToStorage();
          if (input.tagName === "TEXTAREA") {
            input.style.height = "38px";
            input.style.height = input.scrollHeight + "px";
          }
        });
      }
    });

    restoreCheckoutFormFromStorage();

    var orderNotesInput = document.getElementById("order-notes");
    if (orderNotesInput) {
      orderNotesInput.style.height = "38px";
      orderNotesInput.style.height = orderNotesInput.scrollHeight + "px";
    }
    
    // Initial toggle state for payment details
    var payMethodInput = document.getElementById("payment-method");
    var detailsDiv = document.getElementById("online-payment-details");
    if (payMethodInput && detailsDiv) {
      detailsDiv.style.display = payMethodInput.value === "Online Payment" ? "block" : "none";
    }

    var query = new URLSearchParams(window.location.search);
    if (query.get("cart") === "1" || query.get("checkout") === "1") {
      toggleCart(true);
      if (query.get("checkout") === "1") {
        var input = document.getElementById("customer-name");
        if (input) {
          setTimeout(function () { input.focus(); }, 120);
        }
      }
    }
  });
})();
