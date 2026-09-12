// ========================================
// Styles By Tiwa - Central Supabase Config
// Single source of truth for URL/key + helper
// ========================================
const SUPABASE_URL = "https://zlglsosfzrybgfuvwldk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM";

// Allowed admin email - keep in one place
const ALLOWED_ADMIN_EMAIL = "alagbefareed@gmail.com";

// Unified contact email (fixed typo: was alagbesuliat vs alagbesulait)
const CONTACT_EMAIL = "alagbesulait@gmail.com";

// Factory - pass extra options like { auth: { persistSession: true } }
function getSupabaseClient(extraOptions) {
  if (typeof supabase === "undefined" || !supabase.createClient) {
    console.error("Supabase library not loaded before supabase-config.js");
    return null;
  }
  return supabase.createClient(SUPABASE_URL, SUPABASE_KEY, extraOptions || {});
}

// Safe URL validator - blocks javascript:, data:, vbscript:
function isSafeUrl(url) {
  if (!url) return false;
  var trimmed = String(url).trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
  // allow relative URLs and http/https
  return true;
}

// Shared HTML escape
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(str) { return escapeHtml(str); }
