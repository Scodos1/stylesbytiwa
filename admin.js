// 🔗 SUPABASE SETUP (centralized in supabase-config.js)
const supabaseClient = (typeof getSupabaseClient === 'function' ? getSupabaseClient({ auth: { persistSession: true } }) : supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true } }));

let editingId = null;

// Use centralized helpers if available, else fallback
const _escapeHtml = (typeof escapeHtml === 'function') ? escapeHtml : function(str) {
  if (str === undefined || str === null) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
};
const _isSafeUrl = (typeof isSafeUrl === 'function') ? isSafeUrl : function(url){ return !/^(javascript|data|vbscript):/i.test(String(url||"").trim()); };
const _allowedAdminEmail = (typeof ALLOWED_ADMIN_EMAIL !== 'undefined') ? ALLOWED_ADMIN_EMAIL : "alagbefareed@gmail.com";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg","image/png","image/webp","image/gif","image/jpg"];

function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    // fallback check by extension
    var ext = (file.name.split('.').pop()||"").toLowerCase();
    if (!["jpg","jpeg","png","webp","gif"].includes(ext)) return "Invalid file type: " + file.name;
  }
  if (file.size > MAX_IMAGE_SIZE) return file.name + " exceeds 5MB limit";
  return null;
}

// 🔒 PROTECT PAGE
async function protectPage() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session || (session.user.email || "").toLowerCase() !== _allowedAdminEmail.toLowerCase()) {
    window.location.replace("login.html");
    return false;
  }

  return true;
}

// 🚀 LOAD PRODUCTS
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    const c = document.getElementById("admin-products");
    if (c) c.innerHTML = `<p class="admin-empty">Failed to load products. Please refresh.</p>`;
    return;
  }

  displayAdminProducts(data);
}

// 🎨 DISPLAY PRODUCTS
function displayAdminProducts(products) {
  const container = document.getElementById("admin-products");
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `<p class="admin-empty">No products yet. Add your first product above.</p>`;
    return;
  }

  container.innerHTML = "";

  products.forEach(product => {
    container.innerHTML += `
      <div class="admin-product-card">
        <img src="${_escapeHtml(product.image)}" class="admin-product-img" alt="${_escapeHtml(product.title)}" loading="lazy">
        <div class="admin-card-body">
          <h3>${_escapeHtml(product.title)}</h3>
          <p class="price">₦${Number(product.price).toLocaleString("en-NG")}</p>

          <div class="admin-card-actions">
            <button class="btn-edit" onclick="editProduct('${_escapeHtml(product.id)}')">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn-delete" onclick="deleteProduct('${_escapeHtml(product.id)}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

// ➕ ADD / UPDATE PRODUCT
async function addProduct() {

  const title = document.getElementById("title").value.trim();
  const priceRaw = document.getElementById("price").value.trim();
  const price = Number(priceRaw);
  const category = document.getElementById("category").value;
  const files = document.getElementById("imageFiles").files;

  if (!title || !priceRaw || !category) {
    alert("Please fill all fields");
    return;
  }
  if (isNaN(price) || price <= 0) {
    alert("Please enter a valid price greater than 0");
    return;
  }

  // Validate files before upload
  for (let f of files) {
    const err = validateImageFile(f);
    if (err) { alert(err); return; }
  }

  let imageUrls = [];

  // 📸 MULTI IMAGE UPLOAD (PARALLEL)
  if (files.length > 0) {

    const uploadPromises = [];

    for (let i = 0; i < files.length; i++) {

      const file = files[i];
      const ext = (file.name.split('.').pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"") || "jpg";

      const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const uploadTask = supabaseClient
        .storage
        .from("product-images")
        .upload(fileName, file)
        .then(({ error }) => {

          if (error) throw error;

          const { data } = supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(fileName);

          return data.publicUrl;
        });

      uploadPromises.push(uploadTask);
    }

    try {
      imageUrls = await Promise.all(uploadPromises);
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
      return;
    }
  }

  // ✏️ UPDATE PRODUCT
  if (editingId) {

    let updateData = {
      title,
      price,
      category
    };

    if (imageUrls.length > 0) {
      updateData.images = imageUrls;
      updateData.image = imageUrls[0];
    } else {
      // ✅ KEEP EXISTING IMAGES
      const { data: existing, error: fetchErr } = await supabaseClient
        .from("products")
        .select("images, image")
        .eq("id", editingId)
        .single();

      if (fetchErr || !existing) {
        console.error(fetchErr);
        alert("Could not fetch existing product images");
        return;
      }

      updateData.images = existing.images || [];
      updateData.image = existing.image || (existing.images && existing.images[0]) || "";
    }

    const { error } = await supabaseClient
      .from("products")
      .update(updateData)
      .eq("id", editingId);

    if (error) {
      console.error(error);
      alert("Update failed ❌");
      return;
    }

    alert("Product updated ✅");
    editingId = null;

  } else {

    // ➕ INSERT NEW PRODUCT - require at least one image
    if (imageUrls.length === 0) {
      alert("Please upload at least one product image");
      return;
    }
    const { error } = await supabaseClient
      .from("products")
      .insert([
        {
          title,
          price,
          category,
          image: imageUrls[0],
          images: imageUrls
        }
      ]);

    if (error) {
      console.error(error);
      alert("Error adding product ❌");
      return;
    }

    alert("Product added ✅");
  }

  clearForm();
  loadProducts();
}

// 🧹 CLEAR FORM
function clearForm() {
  document.getElementById("title").value = "";
  document.getElementById("price").value = "";
  document.getElementById("category").selectedIndex = 0;
  document.getElementById("imageFiles").value = "";
  document.getElementById("image-preview").innerHTML = "";

  editingId = null;
}

// 🗑 DELETE PRODUCT
async function deleteProduct(id) {
  const confirmDelete = confirm("Delete this product?");
  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Delete failed ❌");
  } else {
    alert("Deleted ✅");
    loadProducts();
  }
}

// ✏️ EDIT PRODUCT
async function editProduct(id) {

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("title").value = data.title || "";
  document.getElementById("price").value = data.price || "";
  document.getElementById("category").value = data.category || "";

  // 👀 SHOW ALL IMAGES
  const preview = document.getElementById("image-preview");
  preview.innerHTML = "";

  (data.images || []).forEach(img => {
    // escape src to avoid XSS though src is URL
    const safe = _escapeHtml(img);
    const el = document.createElement("img");
    el.src = safe;
    el.alt = "";
    preview.appendChild(el);
  });
  // fallback for legacy single image
  if (!(data.images || []).length && data.image) {
    const el = document.createElement("img");
    el.src = _escapeHtml(data.image);
    preview.appendChild(el);
  }

  editingId = id;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 👀 IMAGE PREVIEW
document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("imageFiles");

  if (input) {
    input.addEventListener("change", function () {

      const preview = document.getElementById("image-preview");
      preview.innerHTML = "";

      const files = this.files;

      for (let file of files) {
        const err = validateImageFile(file);
        if (err) { alert(err); this.value=""; preview.innerHTML=""; return; }
        const reader = new FileReader();

        reader.onload = function (e) {
          const img = document.createElement("img");
          img.src = e.target.result;
          preview.appendChild(img);
        };

        reader.readAsDataURL(file);
      }
    });
  }

});

// 🔓 LOGOUT
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

// ========================================
// FEATURED COLLECTION (homepage cards)
// ========================================
let editingCollectionId = null;

// 🚀 LOAD COLLECTION CARDS
async function loadCollections() {
  const { data, error } = await supabaseClient
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error(error);
    const c = document.getElementById("admin-collections");
    if (c) c.innerHTML = `<p class="admin-empty">Failed to load collections. Please refresh.</p>`;
    return;
  }

  displayAdminCollections(data);
}

// 🎨 DISPLAY COLLECTION CARDS
function displayAdminCollections(items) {
  const container = document.getElementById("admin-collections");
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<p class="admin-empty">No featured collection cards yet. Add your first card above.</p>`;
    return;
  }

  container.innerHTML = "";

  items.forEach(item => {
    container.innerHTML += `
      <div class="admin-product-card">
        <img src="${_escapeHtml(item.image)}" class="admin-product-img" alt="${_escapeHtml(item.title)}" loading="lazy">
        <div class="admin-card-body">
          <h3>${_escapeHtml(item.title)}</h3>
          <p class="price">${_escapeHtml(item.badge || "No badge")} · Order ${_escapeHtml(String(item.sort_order ?? 0))}</p>

          <div class="admin-card-actions">
            <button class="btn-edit" onclick="editCollection('${_escapeHtml(item.id)}')">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn-delete" onclick="deleteCollection('${_escapeHtml(item.id)}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

// ➕ ADD / UPDATE COLLECTION CARD
async function addCollection() {

  const title = document.getElementById("collectionTitle").value.trim();
  const badge = document.getElementById("collectionBadge").value.trim();
  const description = document.getElementById("collectionDescription").value.trim();
  const buttonLabel = document.getElementById("collectionButtonLabel").value.trim() || "View Products";
  let buttonLink = document.getElementById("collectionButtonLink").value.trim() || "shop.html";
  const sortOrder = Number(document.getElementById("collectionOrder").value) || 0;
  const file = document.getElementById("collectionImageFile").files[0];

  if (!title) {
    alert("Please enter a card title");
    return;
  }
  if (!_isSafeUrl(buttonLink)) {
    alert("Button link contains unsafe URL");
    return;
  }
  if (file) {
    const err = validateImageFile(file);
    if (err) { alert(err); return; }
  }

  if (!editingCollectionId && !file) {
    alert("Please upload an image for this card");
    return;
  }

  let imageUrl = null;

  // 📸 IMAGE UPLOAD (same bucket as product images)
  if (file) {
    const ext = (file.name.split('.').pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"") || "jpg";
    const fileName = `collection-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Image upload failed ❌");
      return;
    }

    const { data } = supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  // ✏️ UPDATE EXISTING CARD
  if (editingCollectionId) {

    const updateData = {
      title,
      badge,
      description,
      button_label: buttonLabel,
      button_link: buttonLink,
      sort_order: sortOrder
    };

    if (imageUrl) updateData.image = imageUrl;

    const { error } = await supabaseClient
      .from("collections")
      .update(updateData)
      .eq("id", editingCollectionId);

    if (error) {
      console.error(error);
      alert("Update failed ❌");
      return;
    }

    alert("Collection card updated ✅");
    editingCollectionId = null;

  } else {

    // ➕ INSERT NEW CARD
    const { error } = await supabaseClient
      .from("collections")
      .insert([{
        title,
        badge,
        description,
        button_label: buttonLabel,
        button_link: buttonLink,
        sort_order: sortOrder,
        image: imageUrl
      }]);

    if (error) {
      console.error(error);
      alert("Error adding collection card ❌");
      return;
    }

    alert("Collection card added ✅");
  }

  clearCollectionForm();
  loadCollections();
}

// 🧹 CLEAR FORM
function clearCollectionForm() {
  document.getElementById("collectionTitle").value = "";
  document.getElementById("collectionBadge").value = "";
  document.getElementById("collectionDescription").value = "";
  document.getElementById("collectionButtonLabel").value = "";
  document.getElementById("collectionButtonLink").value = "";
  document.getElementById("collectionOrder").value = "0";
  document.getElementById("collectionImageFile").value = "";
  document.getElementById("collection-image-preview").innerHTML = "";

  editingCollectionId = null;
}

// 🗑 DELETE COLLECTION CARD
async function deleteCollection(id) {
  const confirmDelete = confirm("Delete this featured collection card?");
  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from("collections")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Delete failed ❌");
  } else {
    alert("Deleted ✅");
    loadCollections();
  }
}

// ✏️ EDIT COLLECTION CARD
async function editCollection(id) {

  const { data, error } = await supabaseClient
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("collectionTitle").value = data.title || "";
  document.getElementById("collectionBadge").value = data.badge || "";
  document.getElementById("collectionDescription").value = data.description || "";
  document.getElementById("collectionButtonLabel").value = data.button_label || "";
  document.getElementById("collectionButtonLink").value = data.button_link || "";
  document.getElementById("collectionOrder").value = data.sort_order ?? 0;

  const preview = document.getElementById("collection-image-preview");
  preview.innerHTML = "";
  if (data.image) {
    const img = document.createElement("img");
    img.src = _escapeHtml(data.image);
    img.alt = _escapeHtml(data.title || "");
    preview.appendChild(img);
  }

  editingCollectionId = id;

  const panel = document.getElementById("collectionFormPanel");
  if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 👀 IMAGE PREVIEW (collection card image)
document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("collectionImageFile");

  if (input) {
    input.addEventListener("change", function () {

      const preview = document.getElementById("collection-image-preview");
      preview.innerHTML = "";

      const file = this.files[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) { alert(err); this.value=""; return; }

      const reader = new FileReader();

      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        preview.appendChild(img);
      };

      reader.readAsDataURL(file);
    });
  }

});

// 🚀 INIT
document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await protectPage();
  if (!allowed) return;

  loadProducts();
  loadCollections();
  loadVideos();
});

// ========================================
// VIDEOS (homepage Latest Arrivals reel)
// ========================================
let editingVideoId = null;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ["video/mp4","video/webm","video/quicktime"];

function validateVideoFile(file) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    var ext = (file.name.split('.').pop()||"").toLowerCase();
    if (!["mp4","webm","mov"].includes(ext)) return "Invalid video type: " + file.name;
  }
  if (file.size > MAX_VIDEO_SIZE) return file.name + " exceeds 25MB limit";
  return null;
}

// 🚀 LOAD VIDEOS
async function loadVideos() {
  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    const c = document.getElementById("admin-videos");
    if (c) c.innerHTML = `<p class="admin-empty">Failed to load videos. Please refresh.</p>`;
    return;
  }

  displayAdminVideos(data);
}

// 🎨 DISPLAY VIDEOS
function displayAdminVideos(videos) {
  const container = document.getElementById("admin-videos");
  if (!container) return;

  if (!videos || videos.length === 0) {
    container.innerHTML = `<p class="admin-empty">No videos yet. Add your first video above.</p>`;
    return;
  }

  container.innerHTML = "";

  videos.forEach(v => {
    container.innerHTML += `
      <div class="admin-product-card">
        <img src="${_escapeHtml(v.poster_url || '')}" class="admin-product-img" alt="${_escapeHtml(v.title)}" loading="lazy" style="aspect-ratio:9/16"/>
        <div class="admin-card-body">
          <h3>${_escapeHtml(v.title)}</h3>
          <p class="price">${_escapeHtml(v.subtitle || '')} · Order ${_escapeHtml(String(v.sort_order ?? 0))}</p>
          <div class="admin-card-actions">
            <button class="btn-edit" onclick="editVideo('${_escapeHtml(v.id)}')">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn-delete" onclick="deleteVideo('${_escapeHtml(v.id)}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

// ➕ ADD / UPDATE VIDEO
async function addVideo() {
  const title = document.getElementById("videoTitle").value.trim();
  const subtitle = document.getElementById("videoSubtitle").value.trim();
  const sortOrder = Number(document.getElementById("videoOrder").value) || 0;
  const videoFile = document.getElementById("videoFile").files[0];
  const posterFile = document.getElementById("videoPosterFile").files[0];

  if (!title) {
    alert("Please enter a video title");
    return;
  }

  if (videoFile) {
    const err = validateVideoFile(videoFile);
    if (err) { alert(err); return; }
  }

  if (posterFile) {
    const err = validateImageFile(posterFile);
    if (err) { alert(err); return; }
  }

  if (!editingVideoId && !videoFile) {
    alert("Please upload a video file");
    return;
  }

  let videoUrl = null;
  let posterUrl = null;

  // 📹 VIDEO UPLOAD
  if (videoFile) {
    const ext = (videoFile.name.split('.').pop()||"mp4").toLowerCase().replace(/[^a-z0-9]/g,"") || "mp4";
    const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(fileName, videoFile);

    if (uploadError) {
      console.error(uploadError);
      alert("Video upload failed ❌");
      return;
    }

    const { data } = supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(fileName);

    videoUrl = data.publicUrl;
  }

  // 🖼 POSTER UPLOAD
  if (posterFile) {
    const ext = (posterFile.name.split('.').pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"") || "jpg";
    const fileName = `poster-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(fileName, posterFile);

    if (!uploadError) {
      const { data } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(fileName);
      posterUrl = data.publicUrl;
    }
  }

  // ✏️ UPDATE
  if (editingVideoId) {
    const updateData = { title, subtitle, sort_order: sortOrder };
    if (videoUrl) updateData.video_url = videoUrl;
    if (posterUrl) updateData.poster_url = posterUrl;

    const { error } = await supabaseClient
      .from("videos")
      .update(updateData)
      .eq("id", editingVideoId);

    if (error) {
      console.error(error);
      alert("Update failed ❌");
      return;
    }

    alert("Video updated ✅");
    editingVideoId = null;

  } else {
    // ➕ INSERT NEW
    const { error } = await supabaseClient
      .from("videos")
      .insert([{
        title,
        subtitle,
        video_url: videoUrl,
        poster_url: posterUrl || "",
        sort_order: sortOrder
      }]);

    if (error) {
      console.error(error);
      alert("Error adding video ❌");
      return;
    }

    alert("Video added ✅");
  }

  clearVideoForm();
  loadVideos();
}

// 🧹 CLEAR FORM
function clearVideoForm() {
  document.getElementById("videoTitle").value = "";
  document.getElementById("videoSubtitle").value = "";
  document.getElementById("videoOrder").value = "0";
  document.getElementById("videoFile").value = "";
  document.getElementById("videoPosterFile").value = "";
  document.getElementById("video-file-info").textContent = "";
  document.getElementById("video-poster-preview").innerHTML = "";
  editingVideoId = null;
}

// 🗑 DELETE VIDEO
async function deleteVideo(id) {
  const confirmDelete = confirm("Delete this video?");
  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from("videos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Delete failed ❌");
  } else {
    alert("Deleted ✅");
    loadVideos();
  }
}

// ✏️ EDIT VIDEO
async function editVideo(id) {
  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) { console.error(error); return; }

  document.getElementById("videoTitle").value = data.title || "";
  document.getElementById("videoSubtitle").value = data.subtitle || "";
  document.getElementById("videoOrder").value = data.sort_order ?? 0;

  const preview = document.getElementById("video-poster-preview");
  preview.innerHTML = "";
  if (data.poster_url) {
    const img = document.createElement("img");
    img.src = _escapeHtml(data.poster_url);
    img.alt = _escapeHtml(data.title || "");
    preview.appendChild(img);
  }

  const fileInfo = document.getElementById("video-file-info");
  fileInfo.textContent = data.video_url ? "Current video loaded. Upload new to replace." : "";

  editingVideoId = id;

  const panel = document.getElementById("videoFormPanel");
  if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 👀 VIDEO FILE PREVIEW
document.addEventListener("DOMContentLoaded", () => {

  const videoInput = document.getElementById("videoFile");
  if (videoInput) {
    videoInput.addEventListener("change", function () {
      const info = document.getElementById("video-file-info");
      if (this.files[0]) {
        const f = this.files[0];
        const err = validateVideoFile(f);
        if (err) { alert(err); this.value = ""; info.textContent = ""; return; }
        const mb = (f.size / (1024*1024)).toFixed(1);
        info.textContent = f.name + " (" + mb + " MB)";
      } else {
        info.textContent = "";
      }
    });
  }

  const posterInput = document.getElementById("videoPosterFile");
  if (posterInput) {
    posterInput.addEventListener("change", function () {
      const preview = document.getElementById("video-poster-preview");
      preview.innerHTML = "";
      const file = this.files[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) { alert(err); this.value = ""; return; }
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

});
