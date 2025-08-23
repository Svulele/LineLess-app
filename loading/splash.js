export function showSplash(title = "Loading...", { tagline = "", duration = 2000, onComplete } = {}) {
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

  setTimeout(() => {
    splash.classList.add("fade-out");
    splash.addEventListener("animationend", () => {
      splash.remove();
      if (onComplete) onComplete();
    }, { once: true });
  }, duration);
}
