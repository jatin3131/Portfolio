// /*
//   Ambient Reel Background
//   ------------------------
//   Drives the page-wide colour wash (see .ambient-bg in
//   css/ai-video-generation.css) from the dominant colours of the vertical
//   reel video pinned to the right of the page.

//   Exposes window.initAmbientBg() / window.teardownAmbientBg() so PJAX
//   navigation (see js/main.js -> pjaxSyncAmbientChrome) can start this up
//   again each time you navigate INTO this page, and cleanly stop it each
//   time you navigate AWAY — instead of relying on this script only ever
//   running once, on a hard page load.

//   HOW TO ADD YOUR VIDEO LATER:
//   In the HTML, find <video id="ambientVideo" ...> and add a real source, e.g.

//     <video id="ambientVideo" class="ambient-video" muted loop playsinline autoplay>
//       <source src="videos/your-reel.mp4" type="video/mp4">
//     </video>

//   If the video file lives on another domain (e.g. Cloudinary), also add
//   crossorigin="anonymous" on the <video> tag AND make sure that host serves
//   proper CORS headers — otherwise the browser will block colour sampling
//   (the canvas will be "tainted") and this script will silently fall back
//   to the static placeholder gradient. Nothing else needs to change; this
//   script detects the source automatically on init.
// */

// (function () {
//   let intervalId = null;

//   function stopSampling() {
//     if (intervalId) {
//       clearInterval(intervalId);
//       intervalId = null;
//     }
//   }

//   function initAmbientBg() {
//     // Never run two samplers at once — matters when PJAX re-enters this
//     // page and calls this a second (or third...) time.
//     stopSampling();

//     const frame = document.querySelector('.ambient-video-frame');
//     const video = document.getElementById('ambientVideo');
//     if (!frame || !video) return;

//     const root = document.documentElement;

//     function hasRealSource() {
//       if (video.currentSrc) return true;
//       const src = video.getAttribute('src');
//       if (src && src.trim()) return true;
//       const sourceEl = video.querySelector('source[src]');
//       return !!(sourceEl && sourceEl.getAttribute('src') && sourceEl.getAttribute('src').trim());
//     }

//     if (!hasRealSource()) {
//       // No video yet — keep the placeholder card and the default (static)
//       // ambient gradient defined in :root. Nothing more to do.
//       return;
//     }

//     frame.classList.add('has-video');

//     // small offscreen canvas — we only need a handful of pixels to get a
//     // representative average colour, not a full-resolution frame
//     const canvas = document.createElement('canvas');
//     canvas.width = 24;
//     canvas.height = 42; // roughly matches the 9:16 reel aspect ratio
//     const ctx = canvas.getContext('2d', { willReadFrequently: true });

//     function averageColor(x, y, w, h) {
//       const { data } = ctx.getImageData(x, y, w, h);
//       let r = 0, g = 0, b = 0, count = 0;
//       for (let i = 0; i < data.length; i += 4) {
//         r += data[i];
//         g += data[i + 1];
//         b += data[i + 2];
//         count++;
//       }
//       if (!count) return null;
//       return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
//     }

//     function sample() {
//       if (video.readyState < 2) return; // not enough data yet
//       try {
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//         const top    = averageColor(0, 0, canvas.width, Math.floor(canvas.height / 2));
//         const bottom = averageColor(0, Math.floor(canvas.height / 2), canvas.width, Math.ceil(canvas.height / 2));
//         const full   = averageColor(0, 0, canvas.width, canvas.height);

//         if (full)   root.style.setProperty('--ambient-1', full);
//         if (top)    root.style.setProperty('--ambient-3', top);
//         if (bottom) root.style.setProperty('--ambient-2', bottom);
//       } catch (err) {
//         // Likely a CORS-tainted canvas (cross-origin video without proper
//         // headers). Stop trying so we don't spam the console every tick.
//         stopSampling();
//       }
//     }

//     // Sampling a few times a second is plenty for a smooth ambient effect
//     // and keeps this cheap even on lower-powered devices.
//     intervalId = setInterval(sample, 450);
//     video.addEventListener('loadeddata', sample, { once: true });
//   }

//   // function teardownAmbientBg() {
//   //   stopSampling();
//   //   // Clear the sampled colours so a later re-entry into this page starts
//   //   // from the CSS file's own defaults instead of a stale leftover value.
//   //   const root = document.documentElement;
//   //   root.style.removeProperty('--ambient-1');
//   //   root.style.removeProperty('--ambient-2');
//   //   root.style.removeProperty('--ambient-3');
//   // }

//   window.initAmbientBg = initAmbientBg;
//   window.teardownAmbientBg = teardownAmbientBg;

//   // Run immediately on a normal hard page load (PJAX calls initAmbientBg()
//   // itself when it dynamically inserts this page's chrome, so this guard
//   // just covers "user loaded this page directly / hit refresh").
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initAmbientBg);
//   } else {
//     initAmbientBg();
//   }
// })();