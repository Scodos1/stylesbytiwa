// ========================================
// Styles By Tiwa - Premium Scripts
// ========================================

// Menu Toggle
function toggleMenu() {
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menuToggle');
  nav.classList.toggle('active');
  menuToggle.classList.toggle('active');
  document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
}

function closeMenu() {
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menuToggle');
  nav.classList.remove('active');
  menuToggle.classList.remove('active');
  document.body.style.overflow = '';
}

// WhatsApp Order
function order() {
  window.open(
    'https://wa.me/2349078537344?text=Hello%20I%20want%20to%20order%20an%20outfit',
    '_blank'
  );
}

// ========================================
// LOADER
// ========================================
window.addEventListener('load', () => {
  // If we've arrived here via a cross-page link to a section
  // (e.g. shop.html -> index.html#about), smoothly scroll to it
  // once the loader is gone, instead of the browser's instant jump.
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      window.scrollTo(0, 0);
    }
  }

  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, 1500);
});

// ========================================
// NAVBAR SCROLL EFFECT
// ========================================
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;

  if (currentScroll > 80) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
}, { passive: true });

// ========================================
// SCROLL ANIMATIONS (Intersection Observer)
// ========================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, Number(delay));
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// ========================================
// PARTICLE CANVAS
// ========================================
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  const particleCount = 50;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      gold: Math.random() > 0.7
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    if (p.gold) {
      ctx.fillStyle = `rgba(201, 169, 97, ${p.opacity})`;
    } else {
      ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity * 0.3})`;
    }
    ctx.fill();
  }

  function updateParticle(p) {
    p.x += p.speedX;
    p.y += p.speedY;

    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      updateParticle(p);
      drawParticle(p);
    });

    requestAnimationFrame(animateParticles);
  }

  resizeCanvas();
  initParticles();
  animateParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });
}

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ========================================
// FORM INPUT ANIMATION
// ========================================
document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
  input.addEventListener('focus', () => {
    input.parentElement.classList.add('focused');
  });
  input.addEventListener('blur', () => {
    if (!input.value) {
      input.parentElement.classList.remove('focused');
    }
  });
});