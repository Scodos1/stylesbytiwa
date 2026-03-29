function toggleMenu(){

const nav = document.getElementById("nav");

nav.classList.toggle("active");

}

function order(){

window.open(
"https://wa.me/2349078537344?text=Hello%20I%20want%20to%20order%20an%20outfit",
"_blank"
)

}

async function loadProducts() {

const container = document.getElementById("product-gallery");

const response = await fetch("/products/");
const files = await response.text();

console.log(files);

}

loadProducts();