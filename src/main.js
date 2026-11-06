// СтанкоПром — demo landing
// Modules: header/nav, reveal on scroll, counters, hero canvas, catalog filter,
// countdown, modal, form validation, ticker duplication.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- русская типографика ----------
   1) предлоги, союзы, частицы и короткие слова склеиваются со следующим словом
      неразрывным пробелом — они не «висят» в конце строки;
   2) числа склеиваются с единицами/словами («14 дней», «3 года», «0 %»);
   3) пробел перед тире становится неразрывным — тире не начинает строку.
   Применяется к текстовым узлам, не трогает script/style/поля ввода. */
(function typograf() {
  const SHORT =
    "(?:в|во|на|с|со|к|о|об|обо|у|по|за|из|от|до|ни|не|и|а|но|же|бы|ли|для|при|про|над|под|без|что|как|или|это|все|уже|ещё|ещ[её]|мы|вы|он|она|они|его|её|их|то|там|где)";
  const reShort = new RegExp("(^|[\\s(\\[«])(" + SHORT + ") ", "giu");
  const reNum = /(\d) ([а-яА-ЯёЁ%]+)/g;
  const reDash = / —/g;

  const fix = (t) => {
    let prev;
    do {
      prev = t;
      t = t.replace(reShort, "$1$2 ");
    } while (t !== prev);
    return t.replace(reNum, "$1 $2").replace(reDash, " ⁠—");
  };

  const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE"]);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      let el = node.parentElement;
      while (el) {
        if (skip.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        el = el.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const out = fix(n.nodeValue);
    if (out !== n.nodeValue) n.nodeValue = out;
  });
})();

/* ---------- header: shadow on scroll + mobile burger ---------- */
const header = document.getElementById("header");
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  })
);

/* ---------- reveal on scroll (content visible by default; armed only when IO works) ---------- */
const revealEls = document.querySelectorAll(".reveal");
if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => {
    el.classList.add("armed");
    revealIO.observe(el);
  });
}

/* ---------- animated counters ---------- */
const counters = document.querySelectorAll(".counter");
const animateCounter = (el) => {
  const to = Number(el.dataset.to || 0);
  if (prefersReducedMotion) {
    el.textContent = to.toLocaleString("ru-RU");
    return;
  }
  const dur = 1400;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased).toLocaleString("ru-RU");
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const counterIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.6 }
);
counters.forEach((c) => counterIO.observe(c));

/* ---------- ticker: duplicate track for seamless loop ---------- */
const tickerTrack = document.getElementById("ticker-track");
tickerTrack.innerHTML += tickerTrack.innerHTML;

/* ---------- hero canvas: drifting blueprint grid + sparks ---------- */
const canvas = document.getElementById("hero-canvas");
if (canvas && !prefersReducedMotion) {
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  const sparks = Array.from({ length: 26 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0004,
    vy: -0.0003 - Math.random() * 0.0006,
    r: 1 + Math.random() * 1.8,
    a: 0.15 + Math.random() * 0.4,
  }));
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  let offset = 0;
  let rafId;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    // drifting grid
    const step = 56;
    offset = (offset + 0.15) % step;
    ctx.strokeStyle = "rgba(160,170,190,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -step + offset; x < w + step; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = -step + offset; y < h + step; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    // sparks (amber)
    sparks.forEach((s) => {
      s.x += s.vx;
      s.y += s.vy;
      if (s.y < -0.05) {
        s.y = 1.05;
        s.x = Math.random();
      }
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,180,60,${s.a})`;
      ctx.fill();
    });
    rafId = requestAnimationFrame(draw);
  };
  // pause when hero off-screen
  const heroIO = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        cancelAnimationFrame(rafId);
        draw();
      } else {
        cancelAnimationFrame(rafId);
      }
    },
    { threshold: 0 }
  );
  heroIO.observe(canvas);
  draw();
}

/* ---------- catalog filter ---------- */
const filterBtns = document.querySelectorAll(".filter");
const cards = document.querySelectorAll("#cat-grid .card");
filterBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    cards.forEach((card) => {
      const show = f === "all" || card.dataset.cat === f;
      card.classList.toggle("hidden-card", !show);
      if (show) card.classList.add("visible");
    });
  })
);

/* ---------- countdown: to end of current month ---------- */
const cdEls = {
  d: document.getElementById("cd-d"),
  h: document.getElementById("cd-h"),
  m: document.getElementById("cd-m"),
  s: document.getElementById("cd-s"),
};
const pad = (n) => String(n).padStart(2, "0");
const tickCountdown = () => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  let diff = Math.max(0, end - now);
  const d = Math.floor(diff / 86400000);
  diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);
  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);
  diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  cdEls.d.textContent = pad(d);
  cdEls.h.textContent = pad(h);
  cdEls.m.textContent = pad(m);
  cdEls.s.textContent = pad(s);
};
tickCountdown();
setInterval(tickCountdown, 1000);

/* ---------- validation helpers ---------- */
const validators = {
  name: (v) => v.trim().length >= 2,
  phone: (v) => v.replace(/\D/g, "").length >= 10,
  msg: () => true,
};
function validateForm(form) {
  let ok = true;
  form.querySelectorAll(".field").forEach((field) => {
    const input = field.querySelector("input, textarea, select");
    if (!input) return;
    const rule = validators[field.dataset.field] || (() => true);
    const valid = rule(input.value);
    field.classList.toggle("invalid", !valid);
    if (!valid) ok = false;
  });
  return ok;
}
// live re-validation
document.querySelectorAll(".field input, .field textarea").forEach((input) => {
  input.addEventListener("input", () => {
    const field = input.closest(".field");
    if (field && field.classList.contains("invalid")) {
      const rule = validators[field.dataset.field] || (() => true);
      field.classList.toggle("invalid", !rule(input.value));
    }
  });
});

/* ---------- lead form ---------- */
const leadForm = document.getElementById("lead-form");
leadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm(leadForm)) return;
  leadForm.innerHTML = `
    <div class="form-success show" role="status">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 9.5"/></svg>
      <b>Заявка отправлена</b>
      <p>Инженер свяжется с вами в течение рабочего дня и подготовит персональный расчёт.</p>
    </div>`;
});

/* ---------- modal ---------- */
const modal = document.getElementById("modal");
const modalProduct = document.getElementById("modal-product");
const modalForm = document.getElementById("modal-form");
const modalSuccess = document.getElementById("modal-success");
const modalSuccessProduct = document.getElementById("modal-success-product");
let lastFocused = null;

function openModal(product) {
  lastFocused = document.activeElement;
  modalProduct.textContent = product;
  modalSuccessProduct.textContent = product;
  modalForm.style.display = "grid";
  modalForm.reset();
  modalForm.querySelectorAll(".field").forEach((f) => f.classList.remove("invalid"));
  modalSuccess.classList.remove("show");
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  modal.querySelector("#m-name").focus();
}
function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

document.querySelectorAll("[data-order]").forEach((btn) =>
  btn.addEventListener("click", () => openModal(btn.dataset.order))
);
modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

modalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm(modalForm)) return;
  modalForm.style.display = "none";
  modalSuccess.classList.add("show");
});
