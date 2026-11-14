const rotationDelay = 5000;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll(".research-carousel").forEach((carousel) => {
  const slideArea = carousel.querySelector(".research-carousel-slides");
  const slides = [...slideArea.children];
  const controls = carousel.querySelector(".research-carousel-controls");

  let currentIndex = 0;
  let hovering = false;
  let timer;

  function showPaper(index) {
    currentIndex = index;
    slides.forEach((slide, position) => {
      const active = position === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      buttons[position].setAttribute("aria-current", String(active));
    });
  }

  function scheduleRotation() {
    window.clearTimeout(timer);
    if (reducedMotion.matches || hovering || document.hidden || controls.querySelector(":focus-visible")) return;

    timer = window.setTimeout(() => {
      showPaper((currentIndex + 1) % slides.length);
      scheduleRotation();
    }, rotationDelay);
  }

  const buttons = slides.map((slide, index) => {
    const button = document.createElement("button");
    const title = slide.querySelector("h3").textContent;
    button.type = "button";
    button.setAttribute("aria-label", `Show ${title}`);
    button.addEventListener("click", () => {
      showPaper(index);
      scheduleRotation();
    });
    return button;
  });

  controls.append(...buttons);
  controls.addEventListener("focusin", scheduleRotation);
  controls.addEventListener("focusout", () => queueMicrotask(scheduleRotation));
  slideArea.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hovering = true;
    scheduleRotation();
  });
  slideArea.addEventListener("pointerleave", () => {
    hovering = false;
    scheduleRotation();
  });
  document.addEventListener("visibilitychange", scheduleRotation);
  reducedMotion.addEventListener("change", scheduleRotation);

  showPaper(currentIndex);
  controls.hidden = false;
  scheduleRotation();
});
