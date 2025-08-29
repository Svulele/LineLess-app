/*
 * LineLess – Your Queue Management App
 * Copyright (c) 2025 Sbulele Landa
 * Licensed under the MIT License
 */


export function showSplash(title = "Loading...", options = {}) {
  const { tagline = "", duration = 1200, onComplete } = options;

  let splash = document.getElementById("splash");

  // Create splash element if it doesn't exist
  if (!splash) {
    splash = document.createElement("div");
    splash.id = "splash";
    document.body.appendChild(splash);
  }

  // Fill splash content
  splash.innerHTML = `
    <div class="splash-card">
      <div class="logo-box">
        <div class="logo-glyph">
          <div class="bar a"></div>
          <div class="bar b"></div>
        </div>
      </div>
      <h1 class="splash-title">${title}</h1>
      <div class="tagline">${tagline}</div>
    </div>
  `;

  
  splash.classList.remove("fade-out", "show");
  void splash.offsetWidth; // force reflow for animation restart
  splash.classList.add("show");

  // Hides splash after duration
  setTimeout(() => {
    splash.classList.add("fade-out");

    // Remove splash element after fade-out
    splash.addEventListener("transitionend", () => {
      if (splash.parentElement) splash.remove();
      if (onComplete) onComplete();
    }, { once: true });

    // Fallback if transitionend doesn't fire
    setTimeout(() => {
      if (splash.parentElement) splash.remove();
      if (onComplete) onComplete();
    }, 400);

  }, duration);
}
