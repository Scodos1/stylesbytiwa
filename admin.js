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

  container.innerHTML = "";

  products.forEach(product => {
    container.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" />
        <h3>${product.title}</h3>
        <p class="price">₦${product.price}</p>

        <button onclick="editProduct('${product.id}')">Edit</button>
        <button onclick="deleteProduct('${product.id}')">Delete</button>
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

// 🚀 INIT
document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await protectPage();
  if (!allowed) return;

  loadProducts();
});