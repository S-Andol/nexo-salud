// NEXO Salud — GitHub Pages showcase script.
// Purely presentational: renders static illustrative data (same specialties/
// professional style as the app's seed data), toggles the mobile menu, and shows
// a discreet "available in the full app" hint for any action that would normally
// require the real backend (auth, booking). No network calls, no fake success states.

var SPECIALTY_ICONS = {
  "Clínica Médica": '<path d="M12 3v18M3 12h18" stroke-linecap="round" />',
  "Cardiología":
    '<path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4 6 4c2.4 0 3.9 1.3 6 3.6C14.1 5.3 15.6 4 18 4c4 0 5.6 4 4 7.7C19.5 16.4 12 21 12 21Z" stroke-linejoin="round" />',
  "Dermatología": '<circle cx="12" cy="12" r="8" />',
  "Traumatología": '<path d="M6 18 18 6M9 6h5v5M15 18H9v-5" stroke-linecap="round" stroke-linejoin="round" />',
  "Pediatría":
    '<path d="M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round" stroke-linejoin="round" />',
  "Oftalmología":
    '<path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" stroke-linejoin="round" /><circle cx="12" cy="12" r="3" />',
  "Psicología": '<path d="M9 3a4 4 0 0 0-4 4v1a4 4 0 0 0 0 8v1a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4Z" stroke-linejoin="round" />',
  "Nutrición": '<path d="M12 3c-4 3-6 6-6 10a6 6 0 0 0 12 0c0-4-2-7-6-10Z" stroke-linejoin="round" />',
};

var SPECIALTIES = [
  "Clínica Médica",
  "Cardiología",
  "Dermatología",
  "Traumatología",
  "Pediatría",
  "Oftalmología",
  "Psicología",
  "Nutrición",
];

// Same illustrative shape/style as prisma/seed.ts (name, specialty, matrícula) —
// static values, not a live query against the real database.
var PROFESSIONALS = [
  { firstName: "Valentina", lastName: "Acosta", specialty: "Cardiología", license: "MN 54197", avatar: "brand" },
  { firstName: "Thiago", lastName: "Benítez", specialty: "Psicología", license: "MN 75040", avatar: "amber" },
  { firstName: "Sofía", lastName: "Fernández", specialty: "Clínica Médica", license: "MN 81272", avatar: "sky" },
  { firstName: "Santiago", lastName: "García", specialty: "Nutrición", license: "MN 67557", avatar: "rose" },
  { firstName: "Lucas", lastName: "González", specialty: "Cardiología", license: "MN 56267", avatar: "violet" },
  { firstName: "Benjamín", lastName: "López", specialty: "Pediatría", license: "MN 42318", avatar: "emerald" },
];

function renderSpecialties() {
  var grid = document.getElementById("specialtyGrid");
  if (!grid) return;
  grid.innerHTML = SPECIALTIES.map(function (name) {
    var icon = SPECIALTY_ICONS[name] || '<path d="M12 3v18M3 12h18" stroke-linecap="round" />';
    return (
      '<a href="#" class="specialty-card" data-demo-disabled>' +
      '<span class="specialty-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">' +
      icon +
      "</svg>" +
      "</span>" +
      '<span class="label">' +
      name +
      "</span>" +
      "</a>"
    );
  }).join("");
}

function renderProfessionals() {
  var grid = document.getElementById("professionalsGrid");
  if (!grid) return;
  grid.innerHTML = PROFESSIONALS.map(function (p) {
    var initials = (p.firstName[0] + p.lastName[0]).toUpperCase();
    return (
      '<a href="#" class="professional-card" data-demo-disabled>' +
      '<div class="professional-head">' +
      '<span class="avatar avatar-' +
      p.avatar +
      '">' +
      initials +
      "</span>" +
      "<div>" +
      '<p class="professional-name">' +
      p.firstName +
      " " +
      p.lastName +
      "</p>" +
      '<p class="professional-specialty">' +
      p.specialty +
      "</p>" +
      '<p class="professional-license">Mat. ' +
      p.license +
      "</p>" +
      "</div>" +
      "</div>" +
      '<span class="badge badge-neutral">Ver disponibilidad en la app completa</span>' +
      "</a>"
    );
  }).join("");
}

function setupMobileMenu() {
  var toggle = document.getElementById("menuToggle");
  var menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", function () {
    var isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", function (e) {
    var target = e.target;
    if (target && target.tagName === "A") {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupDemoDisabledHints() {
  var toast = document.getElementById("toast");
  if (!toast) return;
  var hideTimer = null;

  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-demo-disabled]") : null;
    if (!el) return;
    e.preventDefault();

    toast.textContent = "Disponible en la aplicación completa — esto es una demo visual.";
    toast.classList.add("visible");
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      toast.classList.remove("visible");
    }, 2600);
  });
}

function setupYear() {
  var el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

renderSpecialties();
renderProfessionals();
setupMobileMenu();
setupDemoDisabledHints();
setupYear();
