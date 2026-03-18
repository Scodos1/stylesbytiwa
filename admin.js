const supabaseUrl = "https://zlglsosfzrybgfuvwldk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let editingId = null;

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

// ➕ ADD OR UPDATE PRODUCT
async function addProduct() {

  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const category = document.getElementById("category").value;
  const file = document.getElementById("imageFile").files[0];

  if (!title || !price || !category) {
    alert("Fill all fields");
    return;
  }

  let imageUrl = "";

  // 📸 UPLOAD IMAGE
  if (file) {
    const fileName = Date.now() + "-" + file.name;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Image upload failed");
      return;
    }

    imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
  }

  // ✏️ UPDATE MODE
  if (editingId) {

    const { error } = await supabaseClient
      .from("products")
      .update({
        title,
        price,
        category,
        ...(imageUrl && { image: imageUrl })
      })
      .eq("id", editingId);

    if (error) {
      alert("Update failed");
      return;
    }

    alert("Product updated ✅");
    editingId = null;

  } else {

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
      alert("Error adding product");
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
    alert("Delete failed");
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

  if (error) return;

  document.getElementById("title").value = data.title;
  document.getElementById("price").value = data.price;
  document.getElementById("category").value = data.category;

  editingId = id;
}

// 🚀 LOAD ON START
loadProducts();