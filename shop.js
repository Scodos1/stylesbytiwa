// ========================================
// Styles By Tiwa - Shop Page
// ========================================

// 🔗 SUPABASE SETUP
const supabaseUrl = "https://zlglsosfzrybgfuvwldk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let allProducts = [];
let activeFilter = "all";

// 💰 FORMAT PRICE
function formatPrice(price) {
  const num = Number(price);
  if (isNaN(num)) return price;
  return num.toLocaleString("en-NG");
}

// 🚀 LOAD PRODUCTS
async function loadProducts() {

  showSkeletons();

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading products:", error);
    showLoadError();
    return;
  }

  allProducts = data || [];

  filterProducts(activeFilter);
}

// 💀 SKELETON LOADING STATE
function showSkeletons() {
  const grid = document.getElementById("product-grid");
  const empty = document.getElementById("shop-empty");
  if (!grid) return;

  empty && (empty.style.display = "none");

  let html = "";
  for (let i = 0; i < 8; i++) {
    html += `<div class="product-card skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-price"></div>
    </div>`;
  }
  grid.innerHTML = html;
}

// ⚠️ ERROR STATE
function showLoadError() {
  const grid = document.getElementById("product-grid");
  const empty = document.getElementById("shop-empty");
  if (!grid) return;

  grid.innerHTML = "";
  if (empty) {
    empty.style.display = "flex";
    empty.innerHTML = `
      <i class="fas fa-triangle-exclamation"></i>
      <p>Something went wrong loading the collection. Please refresh the page.</p>
    `;
  }
}

// 🎨 DISPLAY PRODUCTS
function displayProducts(products) {

  const grid = document.getElementById("product-grid");
  const empty = document.getElementById("shop-empty");
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = "";
    if (empty) {
      empty.style.display = "flex";
      empty.innerHTML = `
        <i class="fas fa-search"></i>
        <p>No products found in this category</p>
      `;
    }
    return;
  }

  if (empty) empty.style.display = "none";

  grid.innerHTML = products.map((product, i) => {

    const images = (product.images && product.images.length) ? product.images : [product.image];
    const multiImage = images.length > 1;
    const whatsappMsg = encodeURIComponent(`Hello, I want to order ${product.title}`);

    return `
      <div class="product-card">

        <div class="product-image-wrapper" data-index="${i}">
          <img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}" class="product-image" loading="lazy">
          ${multiImage ? `<span class="image-count-badge"><i class="fas fa-images"></i> ${images.length}</span>` : ""}
          <div class="product-image-overlay">
            <span><i class="fas fa-expand"></i> View</span>
          </div>
        </div>

        <div class="product-info">
          <h3>${escapeHtml(product.title)}</h3>
          <p class="price">₦${formatPrice(product.price)}</p>

          <a class="order-btn"
            href="https://wa.me/2349078537344?text=${whatsappMsg}"
            target="_blank" rel="noopener">
            <i class="fab fa-whatsapp"></i>
            <span>Order on WhatsApp</span>
          </a>
        </div>

      </div>
    `;
  }).join("");

  // Attach lightbox listeners (safer than inline onclick with dynamic data)
  grid.querySelectorAll(".product-image-wrapper").forEach(wrapper => {
    wrapper.addEventListener("click", () => {
      const i = Number(wrapper.dataset.index);
      const product = products[i];
      const images = (product.images && product.images.length) ? product.images : [product.image];
      openLightbox(images);
    });
  });
}

// 🛡️ ESCAPE HTML (avoid markup injection from product data)
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 🔍 FILTER PRODUCTS
function filterProducts(category) {
  activeFilter = category;

  if (category === "all") {
    displayProducts(allProducts);
  } else {
    const filtered = allProducts.filter(p => p.category === category);
    displayProducts(filtered);
  }
}

// 🖱️ WIRE UP FILTER BUTTONS
function initFilters() {
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterProducts(btn.dataset.filter);
    });
  });
}

// ========================================
// 🖼️ LIGHTBOX MODAL
// ========================================
let modalImages = [];
let modalIndex = 0;

function openLightbox(images) {
  modalImages = Array.isArray(images) ? images : JSON.parse(images);
  modalIndex = 0;

  const modal = document.getElementById("imageModal");
  if (!modal) return;

  updateModalImage();
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const modal = document.getElementById("imageModal");
  if (!modal) return;
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function updateModalImage() {
  const modalImg = document.getElementById("modalImage");
  const counter = document.getElementById("modalCounter");
  const nav = document.querySelector(".modal-nav");

  if (modalImg) modalImg.src = modalImages[modalIndex];

  const multi = modalImages.length > 1;

  if (counter) {
    counter.textContent = `${modalIndex + 1} / ${modalImages.length}`;
    counter.style.display = multi ? "block" : "none";
  }
  if (nav) nav.style.display = multi ? "flex" : "none";
}

function nextModalImage() {
  modalIndex = (modalIndex + 1) % modalImages.length;
  updateModalImage();
}

function prevModalImage() {
  modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
  updateModalImage();
}

function initLightbox() {
  const modal = document.getElementById("imageModal");
  if (!modal) return;

  const closeBtn = modal.querySelector(".modal-close");
  const nextBtn = modal.querySelector(".modal-next");
  const prevBtn = modal.querySelector(".modal-prev");

  closeBtn && closeBtn.addEventListener("click", closeLightbox);
  nextBtn && nextBtn.addEventListener("click", nextModalImage);
  prevBtn && prevBtn.addEventListener("click", prevModalImage);

  // Click outside image to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextModalImage();
    if (e.key === "ArrowLeft") prevModalImage();
  });

  // 📱 Swipe support
  let startX = 0;

  modal.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  modal.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) nextModalImage();
    if (endX - startX > 50) prevModalImage();
  });
}

// 🚀 INIT
document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  initLightbox();
  loadProducts();
});
