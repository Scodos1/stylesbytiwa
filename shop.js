// 🔗 SUPABASE SETUP
const supabaseUrl = "https://zlglsosfzrybgfuvwldk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let allProducts = [];

// 🚀 LOAD PRODUCTS
async function loadProducts() {

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading products:", error);
    return;
  }

  allProducts = data;

  displayProducts(allProducts);
  showNewArrivals();
}

// 🎨 DISPLAY PRODUCTS
function displayProducts(products) {

  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = "";

  products.forEach(product => {

grid.innerHTML += `
  <div class="product-card">

    <div class="image-slider" 
         data-images='${JSON.stringify(product.images || [product.image])}'>

      <img src="${product.image}" 
           class="main-image"
           onclick='openModal(${JSON.stringify(product.images || [product.image])})'>
    </div>

    <h3>${product.title}</h3>
    <p class="price">₦${product.price}</p>

    <a class="order-btn"
      href="https://wa.me/2349078537344?text=Hello I want to order ${product.title}"
      target="_blank">
      Order on WhatsApp
    </a>

  </div>
`;
  });
}
initSliders();

// 🔍 FILTER PRODUCTS
function filterProducts(category) {

  if (category === "all") {
    displayProducts(allProducts);
  } else {
    const filtered = allProducts.filter(p => p.category === category);
    displayProducts(filtered);
  }
}

// 🆕 NEW ARRIVALS
function showNewArrivals() {

  const container = document.getElementById("new-arrivals");
  if (!container) return;

  const latest = allProducts.slice(0, 4);

  container.innerHTML = "";

  latest.forEach(product => {

    container.innerHTML += `
      <div class="product-card">

        <div onclick="openModal('${product.title}', '${product.price}', '${product.image}')">

          <img src="${product.image}">

          <h3>${product.title}</h3>

          <p class="price">₦${product.price}</p>

        </div>

        <a class="order-btn"
           href="https://wa.me/2349078537344?text=Hello I want to order ${product.title}"
           target="_blank"
           onclick="event.stopPropagation()">

           Order on WhatsApp

        </a>

      </div>
    `;
  });
}

// 🔍 OPEN MODAL
function openModal(title, price, image) {

  document.getElementById("product-modal").style.display = "block";

  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-price").innerText = "₦" + price;
  document.getElementById("modal-image").src = image;

  document.getElementById("modal-order").href =
    `https://wa.me/2349078537344?text=Hello I want to order ${title}`;
}

// ❌ CLOSE MODAL
function closeModal() {
  document.getElementById("product-modal").style.display = "none";
}

// 🚀 LOAD ON START
document.addEventListener("DOMContentLoaded", loadProducts);

function initSliders() {

  document.querySelectorAll(".image-slider").forEach(slider => {

    const images = JSON.parse(slider.dataset.images);
    const img = slider.querySelector(".main-image");
    const prev = slider.querySelector(".prev");
    const next = slider.querySelector(".next");

    let index = 0;

    function showImage(i) {
      index = (i + images.length) % images.length;
      img.src = images[index];
    }

    next.onclick = () => showImage(index + 1);
    prev.onclick = () => showImage(index - 1);

    // 📱 TOUCH SWIPE
    let startX = 0;

    slider.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", e => {
      let endX = e.changedTouches[0].clientX;

      if (startX - endX > 50) showImage(index + 1); // swipe left
      if (endX - startX > 50) showImage(index - 1); // swipe right
    });

  });
}

let modalImages = [];
let modalIndex = 0;

function openModal(images) {

  modalImages = images;
  modalIndex = 0;

  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");

  modal.style.display = "flex";
  modalImg.src = modalImages[0];
}

// CLOSE
document.querySelector(".close").onclick = function () {
  document.getElementById("imageModal").style.display = "none";
};

// NEXT / PREV
document.querySelector(".modal-next").onclick = function () {
  modalIndex = (modalIndex + 1) % modalImages.length;
  document.getElementById("modalImage").src = modalImages[modalIndex];
};

document.querySelector(".modal-prev").onclick = function () {
  modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
  document.getElementById("modalImage").src = modalImages[modalIndex];
};

// 📱 SWIPE IN MODAL
let startX = 0;

document.getElementById("imageModal").addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.getElementById("imageModal").addEventListener("touchend", e => {
  let endX = e.changedTouches[0].clientX;

  if (startX - endX > 50) {
    modalIndex = (modalIndex + 1) % modalImages.length;
  } else if (endX - startX > 50) {
    modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
  }

  document.getElementById("modalImage").src = modalImages[modalIndex];
});