const header = document.querySelector(".header");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
const habits = [...document.querySelectorAll("[data-habit]")];
const progressText = document.querySelector("#progress-text");
const progressNumber = document.querySelector("#progress-number");
const progressRing = document.querySelector("#progress-ring");
const mainStreak = document.querySelector("#main-streak");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

menuButton?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

function updatePreview() {
  const completed = habits.filter((habit) => habit.classList.contains("completed")).length;
  const total = habits.length;
  const percent = Math.round((completed / total) * 100);

  progressText.textContent = `${completed} de ${total} concluídos`;
  progressNumber.textContent = `${percent}%`;
  progressRing.style.setProperty("--progress", percent);

  // Apenas uma demonstração visual da landing page.
  mainStreak.textContent = completed === total ? "8" : completed === 0 ? "6" : "7";
}

habits.forEach((habit) => {
  habit.addEventListener("click", () => {
    const completed = habit.classList.toggle("completed");
    habit.setAttribute("aria-pressed", String(completed));
    updatePreview();
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
