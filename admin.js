// 🔗 SUPABASE SETUP
const supabaseUrl = "https://zlglsosfzrybgfuvwldk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM";

const supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: { persistSession: true }
  }
);

let editingId = null;

// 🔒 PROTECT PAGE
async function protectPage() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session || session.user.email !== "alagbefareed@gmail.com") {
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
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
        <img src="${product.image}" class="admin-product-img" alt="${product.title}">
        <div class="admin-card-body">
          <h3>${product.title}</h3>
          <p class="price">₦${Number(product.price).toLocaleString("en-NG")}</p>

          <div class="admin-card-actions">
            <button class="btn-edit" onclick="editProduct('${product.id}')">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn-delete" onclick="deleteProduct('${product.id}')">
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

  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const category = document.getElementById("category").value;
  const files = document.getElementById("imageFiles").files;

  if (!title || !price || !category) {
    alert("Please fill all fields");
    return;
  }

  let imageUrls = [];

  // 📸 MULTI IMAGE UPLOAD (PARALLEL)
  if (files.length > 0) {

    const uploadPromises = [];

    for (let i = 0; i < files.length; i++) {

      const file = files[i];
      const ext = file.name.split('.').pop();

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
      const { data: existing } = await supabaseClient
        .from("products")
        .select("images, image")
        .eq("id", editingId)
        .single();

      updateData.images = existing.images;
      updateData.image = existing.image;
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

    // ➕ INSERT NEW PRODUCT
    const { error } = await supabaseClient
      .from("products")
      .insert([
        {
          title,
          price,
          category,
          image: imageUrls[0] || "",
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

  document.getElementById("title").value = data.title;
  document.getElementById("price").value = data.price;
  document.getElementById("category").value = data.category;

  // 👀 SHOW ALL IMAGES
  const preview = document.getElementById("image-preview");
  preview.innerHTML = "";

  (data.images || []).forEach(img => {
    preview.innerHTML += `<img src="${img}">`;
  });

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
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
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
        <img src="${item.image}" class="admin-product-img" alt="${item.title}">
        <div class="admin-card-body">
          <h3>${item.title}</h3>
          <p class="price">${item.badge || "No badge"} · Order ${item.sort_order ?? 0}</p>

          <div class="admin-card-actions">
            <button class="btn-edit" onclick="editCollection('${item.id}')">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn-delete" onclick="deleteCollection('${item.id}')">
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
  const buttonLink = document.getElementById("collectionButtonLink").value.trim() || "shop.html";
  const sortOrder = Number(document.getElementById("collectionOrder").value) || 0;
  const file = document.getElementById("collectionImageFile").files[0];

  if (!title) {
    alert("Please enter a card title");
    return;
  }

  if (!editingCollectionId && !file) {
    alert("Please upload an image for this card");
    return;
  }

  let imageUrl = null;

  // 📸 IMAGE UPLOAD (same bucket as product images)
  if (file) {
    const ext = file.name.split('.').pop();
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
  preview.innerHTML = data.image ? `<img src="${data.image}">` : "";

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
});