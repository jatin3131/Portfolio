/* ============================================================
   RIPPLE EFFECT — any element with class "ripple-host"
   ============================================================ */
function initRipples(root) {
  (root || document).querySelectorAll(".ripple-host").forEach((host) => {
    if (host.dataset.rippleBound) return; // never double-bind a host
    host.dataset.rippleBound = "true";
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

// Delegated so this keeps working no matter how many times the overlay
// underneath gets replaced by pjax navigation.
function initWvNoteModal() {
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'wvNoteModalOverlay') {
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
  const grid = document.querySelector(".video-grid");
  if (!tabs.length) return;

  function applyFilter(filter) {
    tabs.forEach((t) => t.classList.toggle("pill-active", t.dataset.filter === filter));
    cards.forEach((c) => {
      c.style.display = c.dataset.category === filter ? "" : "none";
    });
    if (grid) grid.classList.toggle("grid-cinematic", filter === "cinematic");
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => applyFilter(t.dataset.filter))
  );

  const defaultTab = document.querySelector(".video-tab[data-default]") || tabs[0];
  applyFilter(defaultTab.dataset.filter);
}

// Shared flag: while a video's prompt modal is open, don't pause that video
// on mouseleave — the whole point is that playback keeps going.
let promptModalOpen = false;

function initVideoHoverPlay() {
  document.querySelectorAll(".video-card:not(.video-cinematic)").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;
    video.playsInline = true;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          // Audible autoplay blocked by the browser — fall back to muted play
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    card.addEventListener("mouseenter", tryPlay);
    card.addEventListener("mouseleave", () => {
      if (promptModalOpen) return;
      video.pause();
      video.currentTime = 0;
    });
    card.addEventListener("click", (e) => {
      if (e.target.closest(".video-prompt-btn")) return;
      if (video.paused) tryPlay();
      else video.pause();
    });
  });
}

function initCinematicVideos() {
  document.querySelectorAll(".video-card.video-cinematic").forEach((card) => {
    const video = card.querySelector("video");
    const fsBtn = card.querySelector(".video-fullscreen-btn");
    const centerBtn = card.querySelector(".video-center-btn");
    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;
    video.playsInline = true;

    const togglePlay = () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    // Click the card itself (outside the fullscreen/prompt/center buttons) to play/pause
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(".video-fullscreen-btn") ||
        e.target.closest(".video-prompt-btn") ||
        e.target.closest(".video-center-btn")
      ) return;
      togglePlay();
    });

    // Center play/pause button — visible on hover
    if (centerBtn) {
      const cbPlay = centerBtn.querySelector(".cb-play");
      const cbPause = centerBtn.querySelector(".cb-pause");

      const syncCenterIcon = () => {
        if (!cbPlay || !cbPause) return;
        cbPlay.style.display = video.paused ? "block" : "none";
        cbPause.style.display = video.paused ? "none" : "block";
      };

      centerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlay();
      });

      video.addEventListener("play", syncCenterIcon);
      video.addEventListener("pause", syncCenterIcon);
      syncCenterIcon();
    }

    if (!fsBtn) return;
    const expandIcon = fsBtn.querySelector(".fs-expand");
    const collapseIcon = fsBtn.querySelector(".fs-collapse");

    fsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!document.fullscreenElement) {
        video.play().catch(() => {});
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iOS Safari
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

    video.addEventListener("fullscreenchange", () => {
      const isFs = document.fullscreenElement === video;
      card.classList.toggle("is-fullscreen", isFs);
      if (expandIcon) expandIcon.style.display = isFs ? "none" : "block";
      if (collapseIcon) collapseIcon.style.display = isFs ? "block" : "none";
    });

    // iOS Safari fires this instead of fullscreenchange
    video.addEventListener("webkitendfullscreen", () => {
      card.classList.remove("is-fullscreen");
      if (expandIcon) expandIcon.style.display = "block";
      if (collapseIcon) collapseIcon.style.display = "none";
      video.pause();
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
   MORE PROJECTS PILL — expandable second row of category pills
   ============================================================ */
function initMorePillsToggle() {
  const toggleBtn = document.getElementById("morePillsToggle");
  const extraRow = document.getElementById("morePillsRow");
  const topbar = document.querySelector(".topbar");
  if (!toggleBtn || !extraRow) return;

  function openRow(animate = true) {
    // When the row needs to be open on page load (active pill is hidden
    // inside it), skip the transition entirely so it doesn't visibly
    // "grow open" every time the page/navbar loads — it should just
    // already look open.
    if (!animate) extraRow.classList.add("no-anim");

    extraRow.classList.add("open");
    // measure actual wrapped height (works for any screen width / pill count)
    extraRow.style.maxHeight = extraRow.scrollHeight + "px";
    toggleBtn.classList.add("pill-active");
    toggleBtn.setAttribute("aria-expanded", "true");
    if (topbar) topbar.classList.add("topbar-expanded");

    if (!animate) {
      // force a reflow so the "no-anim" state is actually painted once,
      // then remove it so future (real, user-triggered) toggles animate again
      void extraRow.offsetHeight;
      requestAnimationFrame(() => {
        extraRow.classList.remove("no-anim");
      });
    }
  }

  function closeRow() {
    // set explicit height first so the collapse transition has something to animate from
    extraRow.style.maxHeight = extraRow.scrollHeight + "px";
    requestAnimationFrame(() => {
      extraRow.style.maxHeight = "0px";
    });
    extraRow.classList.remove("open");
    toggleBtn.classList.remove("pill-active");
    toggleBtn.setAttribute("aria-expanded", "false");
    if (topbar) topbar.classList.remove("topbar-expanded");
  }

  // Auto-open if the active category lives inside the hidden row —
  // instantly, with no transition (this runs on every page load).
  if (extraRow.querySelector(".pill-active")) {
    openRow(false);
  }

  toggleBtn.addEventListener("click", () => {
    const isOpen = extraRow.classList.contains("open");
    isOpen ? closeRow() : openRow(true);
  });

  // Recalculate height on resize/orientation change, so it never gets
  // stuck at a stale value if pills reflow to more/fewer lines.
  window.addEventListener("resize", () => {
    if (extraRow.classList.contains("open")) {
      extraRow.style.maxHeight = extraRow.scrollHeight + "px";
    }
  });
}
/* ============================================================
   HEADER MODAL TRIGGERS — About Me, Work Experience, Certifications.
   Same simple open/close pattern for all three; About Me additionally
   has a one-time attention pulse that stops after the first click.
   ============================================================ */
/* ============================================================
   HEADER MODAL TRIGGERS — About Me, Work Experience, Certifications,
   Education. The trigger buttons live in the topbar, which is
   persistent and never reloaded. The overlay panels live in the
   page content, which DOES get swapped out on every pjax navigation
   (see PJAX section below). So: bind the "open" click once per
   button (fine, buttons never disappear), but always look the
   overlay up fresh by ID at click time, and handle "close" via
   document-level delegation instead of binding straight to the
   overlay/close-button elements — that way it keeps working no
   matter how many times the overlay node underneath gets replaced.
   ============================================================ */
function initHeaderModalTriggers() {
  const triggers = [
    [".edu-btn", "education-modal"],
    [".workexp-btn", "workexp-modal"],
    [".cert-btn", "cert-modal"],
    [".about-btn", "about-modal"],
  ];
  const modalIds = triggers.map(([, id]) => id);

  function openOverlay(overlay) {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeOverlay(overlay) {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  triggers.forEach(([selector, modalId]) => {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener("click", () => {
      btn.classList.remove("pulse");
      const overlay = document.getElementById(modalId); // always current, swap-safe
      if (overlay) openOverlay(overlay);
    });
  });

  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest(".detail-close");
    if (closeBtn) {
      const overlay = closeBtn.closest(".detail-overlay");
      if (overlay && modalIds.includes(overlay.id)) closeOverlay(overlay);
      return;
    }
    if (e.target.classList && e.target.classList.contains("detail-overlay")) {
      if (modalIds.includes(e.target.id)) closeOverlay(e.target);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    modalIds.forEach((id) => {
      const overlay = document.getElementById(id);
      if (overlay && overlay.classList.contains("open")) closeOverlay(overlay);
    });
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


/* ============================================================
   CERTIFICATE LIGHTBOX — click any certificate image inside the
   Certifications modal to view it enlarged. Lives in page content
   (the cert-modal gets swapped on every pjax navigation), so this
   just needs to be re-run each time that content loads in.
   ============================================================ */
function initCertLightbox() {
  const lightbox = document.getElementById('cert-lightbox');
  const lightboxImg = document.getElementById('cert-lightbox-img');
  const closeBtn = document.querySelector('.cert-lightbox-close');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  document.querySelectorAll('.cert-image img').forEach((img) => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || 'Certificate preview';
      lightbox.classList.add('open');
    });
  });

  function closeCertLightbox() {
    lightbox.classList.remove('open');
    lightboxImg.src = '';
  }

  closeBtn.addEventListener('click', closeCertLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeCertLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCertLightbox();
  });
}

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

   
/* ============================================================
   PJAX-STYLE NAVIGATION
   The problem this solves: this is a plain multi-page site, so
   every internal link click was doing a full browser reload —
   which reloads and re-paints the topbar too (that's the "flash").
   This intercepts clicks on internal .html links, fetches the
   destination page in the background, and swaps out ONLY the
   #page-content container. The topbar element itself is never
   touched, so it never reloads or re-animates between pages.

   A page opts into this simply by having a `<div id="page-content">`
   wrapping everything below the topbar. Any page that doesn't have
   that wrapper yet (not converted over) is handled gracefully: this
   just falls back to a normal full page load for it, same as today.
   ============================================================ */
const PJAX_CONTENT_ID = "page-content";
let pjaxBusy = false;

function pjaxSetActivePill(url) {
  const path = new URL(url, window.location.href).pathname.split("/").pop();
  document.querySelectorAll(".pills-row .pill").forEach((pill) => {
    const pillPath = (pill.getAttribute("href") || "").split("/").pop();
    pill.classList.toggle("pill-active", !!pillPath && pillPath === path);
  });
}

// Keep "More Projects" open/closed to match the newly active pill —
// instantly, no animation, since this is a sync, not a user click.
function pjaxSyncMorePillsRow() {
  const extraRow = document.getElementById("morePillsRow");
  const toggleBtn = document.getElementById("morePillsToggle");
  const topbar = document.querySelector(".topbar");
  if (!extraRow || !toggleBtn) return;

  const shouldBeOpen = !!extraRow.querySelector(".pill-active");
  const isOpen = extraRow.classList.contains("open");
  if (shouldBeOpen === isOpen) return;

  extraRow.classList.add("no-anim");
  if (shouldBeOpen) {
    extraRow.classList.add("open");
    extraRow.style.maxHeight = extraRow.scrollHeight + "px";
    toggleBtn.classList.add("pill-active");
    toggleBtn.setAttribute("aria-expanded", "true");
    if (topbar) topbar.classList.add("topbar-expanded");
  } else {
    extraRow.classList.remove("open");
    extraRow.style.maxHeight = "0px";
    toggleBtn.classList.remove("pill-active");
    toggleBtn.setAttribute("aria-expanded", "false");
    if (topbar) topbar.classList.remove("topbar-expanded");
  }
  void extraRow.offsetHeight; // force reflow so the instant state actually paints
  requestAnimationFrame(() => extraRow.classList.remove("no-anim"));
}

function pjaxIsEligible(link) {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (link.target && link.target !== "_self") return false;
  if (link.hasAttribute("download")) return false;
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch (e) {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  if (!/\.html?$/i.test(url.pathname)) return false;
  return true;
}

// All the initializers that target elements living INSIDE #page-content.
// Safe to call over and over — the elements underneath are brand new
// nodes every time (old ones were just discarded with the old container),
// so there's no risk of double-binding listeners.
function initPageContent(root) {
  initRipples(root || document);
  initDetailModal();
  initImageClickToOpenModal();
  initHeroCarousel();
  initVideoTabs();
  initVideoHoverPlay();
  initCinematicVideos();
  const promptModal = initPromptModal();
  initVideoPromptButtons(promptModal);
  initIllustrationGrid(promptModal);
  initContactWidget();
  initCertLightbox();
}

async function pjaxNavigate(url, addToHistory) {
  const container = document.getElementById(PJAX_CONTENT_ID);
  if (!container || pjaxBusy) {
    if (!container) window.location.href = url;
    return;
  }
  pjaxBusy = true;
  container.classList.add("pjax-loading");

  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("Bad response: " + res.status);
    const html = await res.text();
    const newDoc = new DOMParser().parseFromString(html, "text/html");
    const newContainer = newDoc.getElementById(PJAX_CONTENT_ID);

    if (!newContainer) {
      // Destination page hasn't been converted to #page-content yet —
      // fall back to a real navigation instead of showing nothing.
      window.location.href = url;
      return;
    }

    container.replaceWith(newContainer);

    // Browsers don't execute <script> tags that arrive via a DOM swap like
    // this — only ones parsed by the browser itself. Some pages still have
    // their own small inline <script> blocks (e.g. page-specific modals),
    // so re-create each one to force it to actually run.
    newContainer.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });

    document.title = newDoc.title;
    pjaxSetActivePill(url);
    pjaxSyncMorePillsRow();
    window.scrollTo(0, 0);
    if (addToHistory) history.pushState({ pjax: true }, "", url);
    initPageContent(newContainer);
  } catch (err) {
    window.location.href = url;
  } finally {
    pjaxBusy = false;
  }
}

function initPjaxNavigation() {
  if (!document.getElementById(PJAX_CONTENT_ID)) return; // this page isn't converted

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest("a");
    if (!link || !pjaxIsEligible(link)) return;

    const href = link.getAttribute("href");
    const destUrl = new URL(href, window.location.href).href;
    e.preventDefault();
    if (destUrl === window.location.href) return; // already here
    pjaxNavigate(href, true);
  });

  window.addEventListener("popstate", () => {
    pjaxNavigate(window.location.href, false);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPageContent(document);
  initHeaderModalTriggers();
  initWvNoteModal();
  initMorePillsToggle();
  initPjaxNavigation();
});