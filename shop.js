let allProducts = []

// 🔥 CONNECT TO SUPABASE
const supabaseUrl = "https://zlglsosfzrybgfuvwldk.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2xzb3NmenJ5YmdmdXZ3bGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDY0MDksImV4cCI6MjA4OTMyMjQwOX0.-F8BTkb-x1ZM8PvvYbE8p58o6rStxMigGGTzPma-AmM"

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)

// 🚀 LOAD PRODUCTS FROM DATABASE
async function loadProducts(){

const { data, error } = await supabaseClient
  .from("products")
  .select("*")
  .order("created_at", { ascending: false })

if(error){
  console.error(error)
  return
}

allProducts = data

displayProducts(allProducts)

showNewArrivals()

}

// 🎨 KEEP YOUR DESIGN EXACTLY
function displayProducts(products){

const grid = document.getElementById("product-grid")

if(!grid) return

grid.innerHTML = ""

products.forEach(product => {

grid.innerHTML += `

<div class="product-card">

<img src="${product.image}" alt="${product.title}">

<h3>${product.title}</h3>

<p class="price">₦${product.price}</p>

<a class="order-btn"
href="https://wa.me/2349078537344?text=Hello I want to order ${product.title}"
target="_blank">

Order on WhatsApp

</a>

</div>

`

})

}

// 🔍 FILTER (UNCHANGED)
function filterProducts(category){

if(category === "all"){

displayProducts(allProducts)

}else{

let filtered = allProducts.filter(p => p.category === category)

displayProducts(filtered)

}

}

// 🆕 NEW ARRIVALS (UNCHANGED)
function showNewArrivals(){

const container = document.getElementById("new-arrivals")

if(!container) return

let latest = allProducts.slice(0,4)

container.innerHTML = ""

latest.forEach(product => {

container.innerHTML += `

<div class="product-card">

<img src="${product.image}">

<h3>${product.title}</h3>

<p class="price">₦${product.price}</p>

<a class="order-btn"
href="https://wa.me/2349078537344?text=Hello I want to order ${product.title}"
target="_blank">

Order on WhatsApp

</a>

</div>

`

})

}

// ⚡ REAL-TIME UPDATE (NEW)
supabaseClient
  .channel('products-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    () => {
      loadProducts()
    }
  )
  .subscribe()

// START
loadProducts()