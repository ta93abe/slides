const deck = document.querySelector(".deck");
const slides = [...document.querySelectorAll(".slide")];
const progress = document.querySelector(".progress i");
const currentLabel = document.querySelector("[data-current]");
const counter = document.querySelector(".progress");

if (!deck || slides.length === 0) {
  throw new Error("deck is missing");
}

const total = slides.length;
let index = 0;
let overview = false;
let touchX = null;

function clamp(value) {
  return Math.min(total - 1, Math.max(0, value));
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "");
  const asNumber = Number.parseInt(raw, 10);
  if (Number.isFinite(asNumber) && asNumber >= 1) {
    return clamp(asNumber - 1);
  }
  return 0;
}

function render() {
  slides.forEach((slide, slideIndex) => {
    const on = overview || slideIndex === index;
    slide.classList.toggle("is-active", slideIndex === index);
    slide.toggleAttribute("hidden", !on);
    slide.toggleAttribute("inert", !on);
  });
  const ratio = ((index + 1) / total) * 100;
  if (progress instanceof HTMLElement) {
    progress.style.width = `${ratio}%`;
  }
  if (currentLabel) {
    currentLabel.textContent = String(index + 1);
  }
  if (counter instanceof HTMLElement) {
    counter.setAttribute("aria-valuenow", String(index + 1));
  }
  const nextHash = `#${index + 1}`;
  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }
}

function go(next) {
  index = clamp(next);
  if (overview) {
    setOverview(false);
  }
  render();
}

function setOverview(on) {
  overview = on;
  deck.classList.toggle("is-overview", on);
  render();
}

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  switch (event.key) {
    case "ArrowRight":
    case "PageDown":
    case " ":
      event.preventDefault();
      go(index + 1);
      break;
    case "ArrowLeft":
    case "PageUp":
      event.preventDefault();
      go(index - 1);
      break;
    case "Home":
      event.preventDefault();
      go(0);
      break;
    case "End":
      event.preventDefault();
      go(total - 1);
      break;
    case "f":
    case "F":
      event.preventDefault();
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void document.documentElement.requestFullscreen();
      }
      break;
    case "o":
    case "O":
      event.preventDefault();
      setOverview(!overview);
      break;
    case "Escape":
      if (overview) {
        event.preventDefault();
        setOverview(false);
      }
      break;
    default:
      break;
  }
});

window.addEventListener("hashchange", () => {
  index = parseHash();
  render();
});

deck.addEventListener("click", (event) => {
  if (!overview) {
    return;
  }
  const slide = event.target instanceof Element ? event.target.closest(".slide") : null;
  if (!slide) {
    return;
  }
  const next = Number.parseInt(slide.getAttribute("data-index") ?? "1", 10) - 1;
  go(next);
});

deck.addEventListener(
  "touchstart",
  (event) => {
    touchX = event.changedTouches[0]?.clientX ?? null;
  },
  { passive: true },
);

deck.addEventListener(
  "touchend",
  (event) => {
    if (touchX == null) {
      return;
    }
    const x = event.changedTouches[0]?.clientX ?? touchX;
    const delta = x - touchX;
    touchX = null;
    if (Math.abs(delta) < 48) {
      return;
    }
    go(index + (delta < 0 ? 1 : -1));
  },
  { passive: true },
);

index = parseHash();
render();
