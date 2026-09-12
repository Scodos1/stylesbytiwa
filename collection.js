// ========================================
// Styles By Tiwa - Featured Collection (Homepage)
// Pulls cards from Supabase so they're editable from the admin panel.
// ========================================

const collectionClient = (typeof getSupabaseClient === 'function' ? getSupabaseClient() : supabase.createClient(SUPABASE_URL, SUPABASE_KEY));

async function loadCollections() {
  const grid = document.getElementById("collection-grid");
  if (!grid) return;

  const { data, error } = await collectionClient
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading collections:", error);
    displayCollectionsError(grid);
    return;
  }

  displayCollections(data || []);
}

function displayCollectionsError(grid) {
  if (!grid) return;
  grid.innerHTML = `<div class="card" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--gray);"><p>Unable to load featured collection. Please refresh.</p></div>`;
}

function displayCollections(items) {
  const grid = document.getElementById("collection-grid");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--gray);"><p>No featured collections yet. Check back soon or visit our <a href="shop.html" style="color:var(--gold)">Shop</a>.</p></div>`;
    return;
  }

  grid.innerHTML = items.map((item, i) => {
    var safeLink = (typeof isSafeUrl === 'function' ? (isSafeUrl(item.button_link) ? item.button_link : "shop.html") : (item.button_link || "shop.html"));
    // extra guard: block javascript: even if isSafeUrl unavailable
    if (/^(javascript|data|vbscript):/i.test(safeLink)) safeLink = "shop.html";
    return `
    <div class="card animate-on-scroll" data-delay="${(i % 3) * 100}">
      <div class="card-image-wrapper">
        <img src="${(typeof escapeHtml === 'function' ? escapeHtml(item.image) : item.image)}" alt="${(typeof escapeHtml === 'function' ? escapeHtml(item.title) : item.title)}" loading="lazy">
        <div class="card-overlay">
          <span class="card-overlay-text">View Collection</span>
        </div>
        ${item.badge ? `<div class="card-badge">${(typeof escapeHtml === 'function' ? escapeHtml(item.badge) : item.badge)}</div>` : ""}
      </div>
      <div class="card-content">
        <h3>${(typeof escapeHtml === 'function' ? escapeHtml(item.title) : item.title)}</h3>
        ${item.description ? `<p class="card-detail">${(typeof escapeHtml === 'function' ? escapeHtml(item.description) : item.description)}</p>` : ""}
        <a href="${(typeof escapeAttr === 'function' ? escapeAttr(safeLink) : safeLink)}" class="btn btn-outline" style="display:inline-block; padding:12px 28px; margin-top:4px;">${(typeof escapeHtml === 'function' ? escapeHtml(item.button_label || "View Products") : (item.button_label || "View Products"))}</a>
      </div>
    </div>
  `}).join("");

  // Re-create the same scroll-reveal behavior script.js uses for static
  // cards, since these are injected after script.js's own observer scan
  // already ran on page load.
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add("visible"), Number(delay));
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });

  grid.querySelectorAll(".animate-on-scroll").forEach(el => revealObserver.observe(el));
}

// 🛡️ Escape helpers (avoid markup injection from admin-entered data)
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

document.addEventListener("DOMContentLoaded", loadCollections);
