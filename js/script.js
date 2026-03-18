// script.js

/* =========================================================
   PAGE LOADER (new animated loader)
   ========================================================= */

(function () {
  const LOADER_VISIBLE_MS = 2200;   // how long loader stays visible
  const FADE_OUT_MS = 700;          // matches CSS fade-out

  document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("pageLoader");
    if (!loader) return;

    document.documentElement.classList.add("page-loader--no-scroll");
    document.body.classList.add("page-loader--no-scroll");

    setTimeout(() => {
      setTimeout(() => {
        loader.classList.add("page-loader--hide");

        document.documentElement.classList.remove("page-loader--no-scroll");
        document.body.classList.remove("page-loader--no-scroll");

        setTimeout(() => {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, FADE_OUT_MS);
      }, LOADER_VISIBLE_MS);
    }, 80);
  });
})();

/* =========================================================
   GLOBAL INITIALIZATION
   ========================================================= */

let cartToastTimer = null;
let checkoutOverlayEl = null;

document.addEventListener("DOMContentLoaded", () => {
  addPageEnterClass();
  setupYear();
  setupNav();
  highlightActiveNav();

  initCartToast();
  initCartOverlay();
  setupCart();

  setupAuthForm();
  setupCarousel();
  setupContactForm();
  initHeaderScrollHide();
});

/* =========================================================
   PAGE ENTER ANIMATION
   ========================================================= */

function addPageEnterClass() {
  document.body.classList.add("page-enter");
}

/* =========================================================
   FOOTER YEAR
   ========================================================= */

function setupYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* =========================================================
   NAVIGATION (MOBILE)
   ========================================================= */

function setupNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");

  if (toggle && header) {
    toggle.addEventListener("click", () => {
      header.classList.toggle("nav-open");
    });
  }
}

/* =========================================================
   HIGHLIGHT ACTIVE NAV LINK
   ========================================================= */

function highlightActiveNav() {
  const page = document.body.getAttribute("data-page");
  const links = document.querySelectorAll(".nav-links a");

  links.forEach((link) => {
    if (page && link.getAttribute("href")?.includes(page)) {
      link.classList.add("active");
    }
  });
}

/* =========================================================
   CART SYSTEM
   ========================================================= */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("sweetLayersCart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("sweetLayersCart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + (item.qty || 1), 0);
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = count;
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
  updateCartCount();
  showCartToast(product);
}

function setupCart() {
  updateCartCount();

  document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
      });

      btn.style.transform = "translateY(-2px) scale(1.05)";
      btn.style.boxShadow = "0 16px 35px rgba(75, 59, 71, 0.18)";
      setTimeout(() => {
        btn.style.transform = "";
        btn.style.boxShadow = "";
      }, 180);
    });
  });

  const navCart = document.querySelector(".nav-cart");
  if (navCart) {
    navCart.addEventListener("click", toggleCartOverlay);
  }
}

/* =========================================================
   NAVBAR HIDE ON SCROLL
   ========================================================= */

let lastScrollY = window.scrollY;
let header = null;
const revealZone = 60;

function initHeaderScrollHide() {
  header = document.querySelector(".site-header");
  if (!header) return;

  window.addEventListener("scroll", handleHeaderScroll);
  window.addEventListener("mousemove", handleHeaderHoverReveal);
}

function handleHeaderScroll() {
  if (!header) return;

  if (window.scrollY > lastScrollY && window.scrollY > 120) {
    header.classList.add("header-hidden");
  } else {
    header.classList.remove("header-hidden");
  }
  lastScrollY = window.scrollY;
}

function handleHeaderHoverReveal(e) {
  if (!header) return;
  if (e.clientY < revealZone) header.classList.remove("header-hidden");
}

/* =========================================================
   CART OVERLAY
   ========================================================= */

function initCartOverlay() {
  if (document.getElementById("cartOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "cartOverlay";
  overlay.className = "cart-overlay";

  overlay.innerHTML = `
    <div class="cart-panel">
      <div class="cart-panel-header">
        <div class="cart-panel-title">Your Cart</div>
        <button class="cart-panel-close" id="closeCartOverlay">×</button>
      </div>
      <div id="cartOverlayContent"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById("closeCartOverlay").addEventListener("click", closeCartOverlay);

  overlay.addEventListener("click", (e) => {
    if (e.target.id === "cartOverlay") closeCartOverlay();
  });
}

function toggleCartOverlay() {
  const overlay = document.getElementById("cartOverlay");
  if (!overlay) return;

  overlay.classList.contains("visible") ? closeCartOverlay() : openCartOverlay();
}

function openCartOverlay() {
  const overlay = document.getElementById("cartOverlay");
  if (!overlay) return;

  renderCartOverlay();
  positionCartPanel();
  overlay.classList.add("visible");
}

function closeCartOverlay() {
  const overlay = document.getElementById("cartOverlay");
  if (overlay) overlay.classList.remove("visible");
}

function positionCartPanel() {
  const panel = document.querySelector(".cart-panel");
  const cartBtn = document.querySelector(".nav-cart");
  if (!panel || !cartBtn) return;

  const rect = cartBtn.getBoundingClientRect();
  panel.style.top = rect.bottom + 12 + "px";
  panel.style.right = window.innerWidth - rect.right + "px";
}

window.addEventListener("resize", () => {
  if (document.getElementById("cartOverlay")?.classList.contains("visible")) {
    positionCartPanel();
  }
});

/* =========================================================
   RENDER CART CONTENT
   ========================================================= */

function renderCartOverlay() {
  const container = document.getElementById("cartOverlayContent");
  if (!container) return;

  const cart = getCart();
  if (!cart.length) {
    container.innerHTML = `<div class="cart-empty-message">Your cart is empty 🍰</div>`;
    return;
  }

  let total = 0;

  container.innerHTML =
    cart
      .map((item) => {
        const qty = item.qty || 1;
        const price = item.price || 0;
        total += qty * price;
        return `
        <div class="cart-item-row" data-id="${item.id}">
          <div>${item.name}</div>
          <div>
            <div class="qty-controls">
              <button data-cart-action="dec" data-id="${item.id}">−</button>
              <span>${qty}</span>
              <button data-cart-action="inc" data-id="${item.id}">+</button>
            </div>
          </div>
          <div>₱${price.toLocaleString()}</div>
          <button class="cart-remove-btn" data-cart-action="remove" data-id="${item.id}">
            Remove
          </button>
        </div>
      `;
      })
      .join("") +
    `
      <div class="cart-summary-box">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <span>₱${total.toLocaleString()}</span>
        </div>
        <div class="cart-summary-row cart-summary-total">
          <span>Total</span>
          <span>₱${total.toLocaleString()}</span>
        </div>
        <button class="btn btn-primary" id="checkoutBtn" style="margin-top:.7rem;width:100%">
          Checkout
        </button>
      </div>
    `;

  container.querySelectorAll("[data-cart-action]").forEach((btn) =>
    btn.addEventListener("click", () => handleCartAction(btn.dataset.cartAction, btn.dataset.id))
  );

  document.getElementById("checkoutBtn")?.addEventListener("click", () =>
    showCheckoutModal(cart, total)
  );
}

/* =========================================================
   UPDATE CART ITEMS
   ========================================================= */

function handleCartAction(action, id) {
  let cart = getCart();
  const index = cart.findIndex((item) => item.id === id);
  if (index === -1) return;

  if (action === "inc") cart[index].qty++;
  else if (action === "dec") {
    cart[index].qty--;
    if (cart[index].qty < 1) cart.splice(index, 1);
  } else if (action === "remove") cart.splice(index, 1);

  saveCart(cart);
  updateCartCount();
  renderCartOverlay();
}

/* =========================================================
   CART TOAST
   ========================================================= */

function initCartToast() {
  if (document.getElementById("cartToast")) return;

  const toast = document.createElement("div");
  toast.id = "cartToast";
  toast.className = "cart-toast";

  toast.innerHTML = `
    <div class="cart-toast-icon">🛒</div>
    <div class="cart-toast-main">
      <div class="cart-toast-title">Added to cart</div>
      <div class="cart-toast-text" id="cartToastText">Item added to your cart.</div>
      <div class="cart-toast-actions">
        <button class="cart-toast-btn cart-toast-btn-primary" id="cartToastViewCart">
          View cart
        </button>
        <button class="cart-toast-btn cart-toast-btn-ghost" id="cartToastContinue">
          Continue
        </button>
      </div>
    </div>
    <button class="cart-toast-close" id="cartToastClose">×</button>
  `;

  document.body.appendChild(toast);

  document.getElementById("cartToastViewCart").addEventListener("click", () => {
    hideCartToast();
    openCartOverlay();
  });

  document.getElementById("cartToastContinue").addEventListener("click", hideCartToast);
  document.getElementById("cartToastClose").addEventListener("click", hideCartToast);
}

function showCartToast(product) {
  const toast = document.getElementById("cartToast");
  if (!toast) return;

  document.getElementById("cartToastText").textContent = `"${product.name}" has been added to your cart.`;

  toast.classList.add("cart-toast--visible");

  if (cartToastTimer) clearTimeout(cartToastTimer);
  cartToastTimer = setTimeout(hideCartToast, 3500);
}

function hideCartToast() {
  const toast = document.getElementById("cartToast");
  if (toast) toast.classList.remove("cart-toast--visible");
}

/* =========================================================
   CHECKOUT MODAL
   ========================================================= */

function showCheckoutModal(cart, total) {
  if (!cart.length) return;

  if (!checkoutOverlayEl) {
    checkoutOverlayEl = document.createElement("div");
    checkoutOverlayEl.className = "checkout-overlay";
    document.body.appendChild(checkoutOverlayEl);
  }

  const firstItem = cart[0];

  checkoutOverlayEl.innerHTML = `
    <div class="checkout-panel">
      <div class="checkout-header">
        <div class="checkout-title">Checkout</div>
        <button class="checkout-close" id="checkoutCloseBtn">×</button>
      </div>

      <div class="checkout-body">
        <p class="checkout-summary-text">
          Review your order and choose a payment method.
        </p>

        <div class="checkout-summary">
          <div class="checkout-summary-row">
            <span>${cart.length}× ${firstItem.name}</span>
            <span>₱${total.toLocaleString()}</span>
          </div>
          <div class="checkout-summary-row checkout-summary-total">
            <span>Total</span>
            <span>₱${total.toLocaleString()}</span>
          </div>
        </div>

        <div class="checkout-methods">
          <div class="checkout-method">
            <input type="radio" name="payment" value="gcash" id="payGcash" checked />
            <label for="payGcash">GCash / E-wallet</label>
          </div>
          <div class="checkout-method">
            <input type="radio" name="payment" value="bank" id="payBank" />
            <label for="payBank">Bank transfer</label>
          </div>
          <div class="checkout-method">
            <input type="radio" name="payment" value="cash" id="payCash" />
            <label for="payCash">Cash on pickup</label>
          </div>
        </div>

        <div class="checkout-footer">
          <button class="btn btn-ghost" id="backToCartBtn">Back to cart</button>
          <button class="btn btn-primary" id="confirmOrderBtn">
            Confirm order
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("checkoutCloseBtn").addEventListener("click", hideCheckoutModal);
  document.getElementById("backToCartBtn").addEventListener("click", hideCheckoutModal);

  document.getElementById("confirmOrderBtn").addEventListener("click", () => {
    const payment = document.querySelector('input[name="payment"]:checked');
    const method = payment ? payment.value : "gcash";

    saveCart([]);
    updateCartCount();
    renderCartOverlay();
    hideCheckoutModal();
    closeCartOverlay();
  });

  checkoutOverlayEl.addEventListener("click", (e) => {
    if (e.target === checkoutOverlayEl) hideCheckoutModal();
  });

  checkoutOverlayEl.classList.add("visible");
}

function hideCheckoutModal() {
  if (checkoutOverlayEl) checkoutOverlayEl.classList.remove("visible");
}

/* =========================================================
   LOGIN / REGISTER
   ========================================================= */

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("sweetLayersUsers") || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem("sweetLayersUsers", JSON.stringify(users));
}

function setCurrentUser(email) {
  localStorage.setItem("sweetLayersCurrentUser", email);
}

function setupAuthForm() {
  const form = document.getElementById("authForm");
  if (!form) return;

  const modeInput = document.getElementById("authMode");
  const nameField = document.getElementById("nameField");
  const nameInput = document.getElementById("authName");
  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  const submitBtn = document.getElementById("authSubmitBtn");
  const modeButtons = document.querySelectorAll(".auth-mode-btn");

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      modeInput.value = mode;

      if (mode === "register") {
        nameField.style.display = "";
        submitBtn.textContent = "Create account";
      } else {
        nameField.style.display = "none";
        submitBtn.textContent = "Log in";
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const mode = modeInput.value;
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const name = nameInput.value.trim();

    if (!email || !password) return alert("Please enter your email and password.");

    let users = getUsers();

    if (mode === "register") {
      if (!name) return alert("Please enter your name.");
      if (users.some((u) => u.email === email)) return alert("Email already registered.");

      users.push({ email, password, name });
      saveUsers(users);
      setCurrentUser(email);
      alert("Account created!");
      window.location.href = "index.html";
    } else {
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) return alert("Incorrect login.");

      setCurrentUser(email);
      alert("Welcome back!");
      window.location.href = "index.html";
    }
  });
}

/* =========================================================
   CAROUSEL
   ========================================================= */

function setupCarousel() {
  const carousel = document.getElementById("cakeCarousel");
  if (!carousel) return;

  const track = carousel.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const prevBtn = carousel.querySelector(".carousel-control.prev");
  const nextBtn = carousel.querySelector(".carousel-control.next");
  const dotsWrapper = document.getElementById("carouselDots");
  const dots = dotsWrapper ? Array.from(dotsWrapper.children) : [];
  let currentIndex = 0;
  let autoSlideTimer;

  function updateCarousel(index) {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(${-currentIndex * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
  }

  prevBtn?.addEventListener("click", () => updateCarousel(currentIndex - 1));
  nextBtn?.addEventListener("click", () => updateCarousel(currentIndex + 1));

  dots.forEach((dot, i) => dot.addEventListener("click", () => updateCarousel(i)));

  function startAuto() {
    clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(() => updateCarousel(currentIndex + 1), 7000);
  }

  carousel.addEventListener("mouseenter", () => clearInterval(autoSlideTimer));
  carousel.addEventListener("mouseleave", startAuto);

  const miniPrev = carousel.querySelector(".mini-prev");
  const miniNext = carousel.querySelector(".mini-next");

  if (miniPrev && miniNext && dots.length) {
    const getActiveIndex = () => dots.findIndex((dot) => dot.classList.contains("active"));
    const goTo = (i) => dots[(i + dots.length) % dots.length].click();

    miniPrev.addEventListener("click", () => goTo(getActiveIndex() - 1));
    miniNext.addEventListener("click", () => goTo(getActiveIndex() + 1));
  }

  updateCarousel(0);
  startAuto();
}

/* =========================================================
   CONTACT FORM
   ========================================================= */

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const fileInput = document.getElementById("cakePhoto");
  const fileNameLabel = document.getElementById("fileName");

  if (fileInput && fileNameLabel) {
    fileInput.addEventListener("change", () => {
      fileNameLabel.textContent =
        fileInput.files?.length ? fileInput.files[0].name : "No file chosen";
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thank you! We'll get back to you soon.");

    form.reset();
    if (fileNameLabel) fileNameLabel.textContent = "No file chosen";
  });
}
