let editingId = null;

const supabaseUrl = "https://zlglsosfzrybgfuvwldk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 🚀 LOAD PRODUCTS
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load error:", error);
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

        <div class="admin-actions">
          <button onclick="editProduct('${product.id}')">Edit</button>
          <button onclick="deleteProduct('${product.id}')">Delete</button>
        </div>

      </div>
    `;
  });
}

// ➕ ADD OR UPDATE PRODUCT
async function addProduct() {

  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const category = document.getElementById("category").value;
  const file = document.getElementById("imageFile").files[0];

  if (!title || !price || !category) {
    alert("Please fill all fields");
    return;
  }

  let imageUrl = "";

  // 📸 UPLOAD IMAGE (ONLY IF FILE EXISTS)
  if (file) {

    alert("Uploading image...");

    const fileName = `${Date.now()}-${Math.random()}-${file.name}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Image upload failed ❌");
      return;
    }

    imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
  }

  // ✏️ UPDATE MODE
  if (editingId) {

    const updateData = {
      title,
      price,
      category
    };

    // only update image if new one was uploaded
    if (imageUrl) {
      updateData.image = imageUrl;
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

    // ➕ ADD NEW PRODUCT
    const { error } = await supabaseClient
      .from("products")
      .insert([
        {
          title,
          price,
          category,
          image: imageUrl
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
  document.getElementById("imageFile").value = "";
  document.getElementById("category").selectedIndex = 0;

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

  editingId = id;

  // 🔥 scroll to form for better UX
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 🚀 LOAD ON START
loadProducts();

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
