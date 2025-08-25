export function showSplash(title = "Loading...", options = {}) {
  let onComplete;
  if (typeof options === "function") {
    onComplete = options;
    options = {};
  } else {
    onComplete = options.onComplete;
  }

  const { tagline = "", duration = 2000 } = options;
  let splash = document.getElementById("splash");

  if (!splash) {
    splash = document.createElement("div");
    splash.id = "splash";
    document.body.appendChild(splash);
  }

  splash.innerHTML = `
    <div class="splash-card">
      <div class="logo-box">
        <div class="logo-glyph">
          <div class="bar a"></div>
          <div class="bar b"></div>
        </div>
      </div>
      <h1>${title}</h1>
      <p class="tagline">${tagline}</p>
      <div class="loader"></div>
    </div>
  `;

  splash.classList.add("show");

  // Remove splash after duration
  setTimeout(() => {
    splash.classList.add("fade-out");

    // Guarantee callback runs even if animation fails
    const safeCallback = () => {
      splash.remove();
      if (onComplete) onComplete();
    };

    splash.addEventListener("animationend", safeCallback, { once: true });

    // Fallback if animation never fires
    setTimeout(safeCallback, 1000);
  }, duration);
}
