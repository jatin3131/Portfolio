/* ============================================================
   RIPPLE EFFECT — any element with class "ripple-host"
   ============================================================ */
function initRipples() {
  document.querySelectorAll(".ripple-host").forEach((host) => {
    host.addEventListener("click", (e) => {
      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const span = document.createElement("span");
      span.className = "ripple";
      span.style.left = `${x}px`;
      span.style.top = `${y}px`;
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;

      host.appendChild(span);
      setTimeout(() => span.remove(), 650);
    });
  });
}


function showWvNoteModal() {
  document.getElementById('wvNoteModalOverlay').classList.add('wv-active');
}

function closeWvNoteModal() {
  document.getElementById('wvNoteModalOverlay').classList.remove('wv-active');
}

const wvNoteModalOverlay = document.getElementById('wvNoteModalOverlay');
if (wvNoteModalOverlay) {
  wvNoteModalOverlay.addEventListener('click', function (e) {
    if (e.target === this) {
      closeWvNoteModal();
    }
  });
}


/* ============================================================
   PROJECT DETAIL MODAL — any element with class "read-more"
   reads data-title / data-sub / data-desc / data-images (JSON array)
   Shows a 3-image film-strip slider that auto-advances left,
   looping seamlessly, while the modal is open.

   Optional data-extra-img: if present, a single extra image is
   shown below the text. When the modal opens, it auto-scrolls
   down to reveal that image, plays a quick "pop" effect on it,
   then scrolls back up so the user lands on the normal top view.
   ============================================================ */
function initDetailModal() {
  const overlay = document.getElementById("project-modal");
  if (!overlay) return;

  const panel = overlay.querySelector(".detail-panel");
  const track = overlay.querySelector(".detail-slider-track");
  const eyebrow = overlay.querySelector(".detail-eyebrow");
  const title = overlay.querySelector(".detail-title");
  const desc = overlay.querySelector(".detail-desc-main");
  const closeBtn = overlay.querySelector(".detail-close");
  const extraWrap = overlay.querySelector(".detail-extra");
  const extraImg = extraWrap ? extraWrap.querySelector("img") : null;
  const extraContent = overlay.querySelector(".detail-extra-content");

  let sliderTimer = null;
  let sliderIndex = 0;
  let slideCount = 0;
  const pendingTimeouts = [];

  function clearPending() {
    pendingTimeouts.forEach((id) => clearTimeout(id));
    pendingTimeouts.length = 0;
  }

  function parseImages(btn) {
    try {
      const raw = btn.dataset.images;
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (err) {
      /* fall through to single image */
    }
    return btn.dataset.img ? [btn.dataset.img] : [];
  }

  function parseExtra(btn) {
    try {
      const raw = btn.dataset.extra;
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (err) {
      /* malformed JSON in data-extra: just skip it */
    }
    return [];
  }

  function buildExtraContent(btn, blocks, altText) {
    if (!extraContent) return;
    extraContent.innerHTML = "";

    if (btn.dataset.extraHtml) {
      extraContent.innerHTML = btn.dataset.extraHtml;
      return;
    }

    blocks.forEach((block) => {
      if (!block) return;
      if (typeof block.text === "string") {
        const p = document.createElement("p");
        p.className = "detail-desc";
        p.textContent = block.text;
        extraContent.appendChild(p);
      } else if (typeof block.image === "string") {
        const img = document.createElement("img");
        img.className = "detail-inline-img";
        img.src = block.image;
        img.alt = altText;
        extraContent.appendChild(img);
      }
    });
  }

  function buildSlides(images, altText) {
    track.innerHTML = "";
    track.style.transition = "none";
    track.style.transform = "translateX(0%)";

    images.forEach((src) => {
      const im = document.createElement("img");
      im.src = src;
      im.alt = altText;
      track.appendChild(im);
    });

    if (images.length > 1) {
      const clone = document.createElement("img");
      clone.src = images[0];
      clone.alt = altText;
      track.appendChild(clone);
    }
  }

  function startSlider(count) {
    clearInterval(sliderTimer);
    sliderIndex = 0;
    slideCount = count;
    if (count <= 1) return;

    sliderTimer = setInterval(() => {
      sliderIndex += 1;
      track.style.transition = "transform 0.7s cubic-bezier(0.65,0,0.35,1)";
      track.style.transform = `translateX(-${sliderIndex * 100}%)`;

      if (sliderIndex === slideCount) {
        const id = setTimeout(() => {
          track.style.transition = "none";
          track.style.transform = "translateX(0%)";
          sliderIndex = 0;
        }, 700);
        pendingTimeouts.push(id);
      }
    }, 2600);
  }

  function openModal(btn) {
    clearPending();

    const images = parseImages(btn);
    const data = {
      title: btn.dataset.title || "",
      sub: btn.dataset.sub || "",
      desc: btn.dataset.desc || "",
      extraImg: btn.dataset.extraImg || "",
    };

    buildSlides(images, data.title);
    eyebrow.textContent = data.sub;
    title.textContent = data.title;
    desc.textContent = data.desc;
    buildExtraContent(btn, parseExtra(btn), data.title);

    if (extraWrap && extraImg) {
      if (data.extraImg) {
        extraImg.classList.remove("pop-anim");
        extraImg.src = data.extraImg;
        extraImg.alt = data.title;
        extraWrap.style.display = "block";
      } else {
        extraWrap.style.display = "none";
      }
    }

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    panel.scrollTop = 0;

    void track.offsetWidth;
    startSlider(images.length);

    if (data.extraImg) {
      const t1 = setTimeout(() => {
        panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
        const t2 = setTimeout(() => {
          extraImg.classList.add("pop-anim");
          const t3 = setTimeout(() => {
            panel.scrollTo({ top: 0, behavior: "smooth" });
          }, 650);
          pendingTimeouts.push(t3);
        }, 750);
        pendingTimeouts.push(t2);
      }, 400);
      pendingTimeouts.push(t1);
    }
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    clearInterval(sliderTimer);
    clearPending();
  }

  document.querySelectorAll(".read-more").forEach((btn) => {
  if (btn.dataset.comingSoon === "true") return; // skip stub/coming-soon cards
  btn.addEventListener("click", () => openModal(btn));
});

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });
}

/* ============================================================
   IMAGE CLICK → OPEN MODAL
   Clicking a project's image (in any grid, in any section) opens
   the same detail modal as its "Read More" button.
   ============================================================ */
function initImageClickToOpenModal() {
  document.querySelectorAll(".project-img-wrap").forEach((wrap) => {
    if (wrap.dataset.comingSoon === "true") return; // skip stub/coming-soon cards
    wrap.addEventListener("click", () => {
      const card = wrap.closest(".project-card");
      const btn = card && card.querySelector(".read-more");
      if (btn) btn.click();
    });
  });
}

/* ============================================================
   HERO CAROUSEL — 3-up "film strip": a peeked previous frame on
   the left, the big active frame centered, a peeked upcoming
   frame on the right. Moving forward always slides the strip
   left, like film advancing through a projector — including at
   the wrap-around point, thanks to a cloned frame at each end
   that gets swapped out invisibly once its transition finishes.

   Navigation is auto-play + the left/right arrow buttons + the
   dots only. There is no click-and-drag / swipe-to-slide — the
   strip no longer responds to cursor movement.
   ============================================================ */
function initHeroCarousel() {
  const strip = document.getElementById("hero-carousel");
  if (!strip) return;

  const visual = strip.querySelector(".hero-strip");
  const track = strip.querySelector(".hero-track");
  const realFrames = Array.from(track.querySelectorAll(".hero-frame"));
  const realCount = realFrames.length;
  if (!realCount) return;

  const dotsWrap = strip.querySelector(".dots");
  const dots = Array.from(dotsWrap.querySelectorAll(".dot"));
  const prevBtn = strip.querySelector(".hero-arrow-left");
  const nextBtn = strip.querySelector(".hero-arrow-right");

  // Build an extended list with a clone of the last frame prepended and a
  // clone of the first frame appended, so we can always animate leftward
  // and snap invisibly at the seam for a seamless infinite loop. Each
  // frame already carries its own caption + Read More button, so cloning
  // brings that content along automatically — nothing to re-sync in JS.
  const firstClone = realFrames[0].cloneNode(true);
  const lastClone = realFrames[realCount - 1].cloneNode(true);
  track.insertBefore(lastClone, realFrames[0]);
  track.appendChild(firstClone);

  const frames = Array.from(track.querySelectorAll(".hero-frame"));
  let position = 1; // index into `frames`; 1..realCount map to the real frames
  let paused = false;
  let timer = null;

  function logicalIndex(pos) {
    return (((pos - 1) % realCount) + realCount) % realCount;
  }

  function centerFrame(pos, extraOffsetPx, instant) {
    const frame = frames[pos];
    if (!frame) return;
    const offset =
      visual.clientWidth / 2 - (frame.offsetLeft + frame.offsetWidth / 2) + extraOffsetPx;
    track.style.transition = instant ? "none" : "transform 0.6s cubic-bezier(0.22,1,0.36,1)";
    track.style.transform = `translateX(${offset}px)`;
  }

  function render(instant) {
    frames.forEach((f, i) => f.classList.toggle("active", i === position));
    dots.forEach((d, i) => d.classList.toggle("dot-active", i === logicalIndex(position)));
    centerFrame(position, 0, instant);
  }

  function settleLoopIfNeeded() {
    if (position === frames.length - 1) {
      // sitting on the appended clone-of-first → snap to the real first frame
      position = 1;
      render(true);
    } else if (position === 0) {
      // sitting on the prepended clone-of-last → snap to the real last frame
      position = realCount;
      render(true);
    }
  }

  function go(dir) {
    position += dir;
    render(false);
    setTimeout(settleLoopIfNeeded, 620);
  }

  function goToLogical(i) {
    position = i + 1;
    render(false);
  }

  function startAutoplay() {
    stopAutoplay();
    if (paused) return;
    timer = setInterval(() => go(1), 8000);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
  }

  prevBtn.addEventListener("click", () => {
    go(-1);
    startAutoplay();
  });
  nextBtn.addEventListener("click", () => {
    go(1);
    startAutoplay();
  });
  dots.forEach((d, i) =>
    d.addEventListener("click", () => {
      goToLogical(i);
      startAutoplay();
    })
  );

  // Clicking a peeked (non-active) frame brings it to center directly.
  // Clicking anywhere on the active frame (its poster image, not just the
  // Read More button) opens the same modal Read More does.
  frames.forEach((f, i) => {
    f.addEventListener("click", (e) => {
      if (e.target.closest(".read-more")) return;
      if (!f.classList.contains("active")) {
        position = i;
        render(false);
        setTimeout(settleLoopIfNeeded, 620);
        startAutoplay();
      } else {
        const readMoreBtn = f.querySelector(".read-more");
        if (readMoreBtn) readMoreBtn.click();
      }
    });
  });

  strip.addEventListener("mouseenter", () => {
    paused = true;
    stopAutoplay();
  });
  strip.addEventListener("mouseleave", () => {
    paused = false;
    startAutoplay();
  });

  window.addEventListener("resize", () => centerFrame(position, 0, true));

  render(true);
  startAutoplay();
}

/* ============================================================
   AI VIDEO GENERATION — category tabs + hover-to-play grid
   Purely data-driven via data-filter / data-category attributes,
   so adding more tabs or more .video-card items just works.
   ============================================================ */
function initVideoTabs() {
  const tabs = document.querySelectorAll(".video-tab");
  const cards = document.querySelectorAll(".video-card");
  if (!tabs.length) return;

  function applyFilter(filter) {
    tabs.forEach((t) => t.classList.toggle("pill-active", t.dataset.filter === filter));
    cards.forEach((c) => {
      c.style.display = c.dataset.category === filter ? "" : "none";
    });
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      applyFilter(t.dataset.filter);
    })
  );

  const defaultTab = document.querySelector(".video-tab[data-default]") || tabs[0];
  applyFilter(defaultTab.dataset.filter);
}

// Shared flag: while a video's prompt modal is open, don't pause that video
// on mouseleave — the whole point is that playback keeps going.
let promptModalOpen = false;

function initVideoHoverPlay() {
  document.querySelectorAll(".video-card").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          /* Autoplay blocked — it will just sit on its first frame. */
        });
      }
    };

    card.addEventListener("mouseenter", tryPlay);
    card.addEventListener("mouseleave", () => {
      if (promptModalOpen) return;
      video.pause();
      video.currentTime = 0;
    });
    // touch devices / plain clicks on the card itself: toggle playback
    card.addEventListener("click", (e) => {
      if (e.target.closest(".video-prompt-btn")) return;
      if (video.paused) tryPlay();
      else video.pause();
    });
  });
}

/* ============================================================
   SHARED PROMPT MODAL — used by both the video-prompt button and
   the AI Illustrations grid. Optionally shows an image up top.
   ============================================================ */
function initPromptModal() {
  const overlay = document.getElementById("prompt-modal");
  if (!overlay) return null;

  const imageWrap = overlay.querySelector(".prompt-modal-image");
  const imageEl = imageWrap ? imageWrap.querySelector("img") : null;
  const titleEl = overlay.querySelector(".prompt-modal-title");
  const textEl = overlay.querySelector(".prompt-modal-text");
  const closeBtn = overlay.querySelector(".detail-close");

  function open({ title, prompt, image }) {
    titleEl.textContent = title || "";
    textEl.textContent = prompt || "";

    if (imageWrap && imageEl) {
      if (image) {
        imageEl.src = image;
        imageEl.alt = title || "";
        imageWrap.style.display = "block";
      } else {
        imageWrap.style.display = "none";
      }
    }

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    promptModalOpen = true;
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    promptModalOpen = false;
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });

  return { open, close };
}

/* ============================================================
   VIDEO PROMPT BUTTONS — each .video-prompt-btn carries its own
   data-title / data-prompt so adding more clips (or editing the
   prompt text) is just editing attributes in the HTML.
   ============================================================ */
function initVideoPromptButtons(promptModal) {
  if (!promptModal) return;
  document.querySelectorAll(".video-prompt-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // don't trigger the card's own play/pause toggle
      promptModal.open({
        title: btn.dataset.title || "Prompt",
        prompt: btn.dataset.prompt || "",
      });
    });
  });
}

/* ============================================================
   AI ILLUSTRATIONS GRID — image-only cards; click opens the
   shared prompt modal with the image on top plus prompt text.
   Each card just needs data-title / data-prompt.
   ============================================================ */
function initIllustrationGrid(promptModal) {
  if (!promptModal) return;
  document.querySelectorAll(".illustration-card").forEach((card) => {
    card.addEventListener("click", () => {
      const img = card.querySelector("img");
      promptModal.open({
        title: card.dataset.title || "",
        prompt: card.dataset.prompt || "",
        image: img ? img.src : "",
      });
    });
  });
}

/* ============================================================
   HEADER MODAL TRIGGERS — About Me, Work Experience, Certifications.
   Same simple open/close pattern for all three; About Me additionally
   has a one-time attention pulse that stops after the first click.
   ============================================================ */
function initHeaderModalTrigger(buttonSelector, modalId) {
  const btn = document.querySelector(buttonSelector);
  const overlay = document.getElementById(modalId);
  if (!btn || !overlay) return;

  const closeBtn = overlay.querySelector(".detail-close");

  function open() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", () => {
    btn.classList.remove("pulse");
    open();
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
}

/* ============================================================
   Note: the old "background blob" element and its dynamic-height
   resize logic have been removed entirely. That function tied the
   blob's height to the page's own scrollHeight via a ResizeObserver,
   which — once the blob was visible — created a feedback loop
   (blob grows -> page grows -> blob grows again) causing endless
   page height. Since the blob effect itself has been removed from
   the design, that logic is gone too, not just hidden.
   ============================================================ */
/* ============================================================
   jnbCW — CONTACT WIDGET (floating bottom-right contact button)
   ============================================================ */
function initContactWidget() {
  const jnbCW_container = document.getElementById('jnbCW-container');
  const jnbCW_toggleBtn  = document.getElementById('jnbCW-toggle');
  const jnbCW_closeBtn   = document.getElementById('jnbCW-close');

  if (!jnbCW_container || !jnbCW_toggleBtn || !jnbCW_closeBtn) {
    console.warn('jnbCW: widget elements not found in the DOM.');
    return;
  }

  function jnbCW_open() {
    jnbCW_container.classList.add('jnbCW-open');
  }
  function jnbCW_close() {
    jnbCW_container.classList.remove('jnbCW-open');
  }

  jnbCW_toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    jnbCW_open();
  });

  jnbCW_closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    jnbCW_close();
  });

  jnbCW_container.addEventListener('click', (e) => {
    if (jnbCW_container.classList.contains('jnbCW-open')) {
      e.stopPropagation();
    }
  });

  document.addEventListener('click', () => jnbCW_close());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') jnbCW_close();
  });

  console.log('jnbCW: widget initialized successfully.');
}

   
document.addEventListener("DOMContentLoaded", () => {
  initRipples();
  initDetailModal();
  initImageClickToOpenModal();
  initHeroCarousel();
  initVideoTabs();
  initVideoHoverPlay();
  const promptModal = initPromptModal();
  initVideoPromptButtons(promptModal);
  initIllustrationGrid(promptModal);
  initHeaderModalTrigger(".edu-btn", "education-modal");
  initHeaderModalTrigger(".workexp-btn", "workexp-modal");
  initHeaderModalTrigger(".cert-btn", "cert-modal");
  initHeaderModalTrigger(".about-btn", "about-modal");
    initContactWidget();
});