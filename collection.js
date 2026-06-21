// ========================================
// Styles By Tiwa - Featured Collection (Homepage)
// Pulls cards from Supabase so they're editable from the admin panel.
// ========================================

const collectionSupabaseUrl = "https://zlglsosfzrybgfuvwldk.supabase.co";
const collectionSupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM";

const collectionClient = supabase.createClient(collectionSupabaseUrl, collectionSupabaseKey);

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
    return;
  }

  displayCollections(data || []);
}

function displayCollections(items) {
  const grid = document.getElementById("collection-grid");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = items.map((item, i) => `
    <div class="card animate-on-scroll" data-delay="${(i % 3) * 100}">
      <div class="card-image-wrapper">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
        <div class="card-overlay">
          <span class="card-overlay-text">View Collection</span>
        </div>
        ${item.badge ? `<div class="card-badge">${escapeHtml(item.badge)}</div>` : ""}
      </div>
      <div class="card-content">
        <h3>${escapeHtml(item.title)}</h3>
        ${item.description ? `<p class="card-detail">${escapeHtml(item.description)}</p>` : ""}
        <button><a href="${escapeAttr(item.button_link || "shop.html")}">${escapeHtml(item.button_label || "View Products")}</a></button>
      </div>
    </div>
  `).join("");

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
