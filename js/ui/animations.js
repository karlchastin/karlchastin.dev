export const cachedEls = {
  track: null,
  tabs: null,
  glassActive: null,
  glassLeft: null,
  glassRight: null,
  trackWidth: 0,
};
let isInitialized = false;

export const initCache = (isInstant = false) => {
  if (!cachedEls.tabs || cachedEls.tabs.length === 0) {
    cachedEls.track = document.getElementById("tabs-track");
    cachedEls.tabs = Array.from(document.querySelectorAll(".tab"));
    cachedEls.glassActive = document.getElementById("glass-active");
    cachedEls.glassLeft = document.getElementById("glass-left");
    cachedEls.glassRight = document.getElementById("glass-right");

    if (cachedEls.track) {
      cachedEls.track.style.paddingLeft = "5px";
      cachedEls.track.style.paddingRight = "0px";
      cachedEls.track.style.position = "relative";
    }

    cachedEls.tabs.forEach((t) => {
      t.style.position = "absolute";
      t.style.top = "0";
      t.style.left = "0";
      t.style.margin = "0";
    });
  }

  if (!cachedEls.trackWidth || isInstant) {
    cachedEls.trackWidth = cachedEls.track.getBoundingClientRect().width;
  }
};

export function syncBackgrounds(currentIndex = 0, isInstant = false) {
  initCache(isInstant);
  const { track, tabs, glassActive, glassLeft, glassRight } = cachedEls;
  if (!tabs.length || !track) return;

  const P_LEFT = 5;
  const P_RIGHT = 0;
  const P_PANEL = 18;
  const GAP = 10;
  const W_ICON = 26;

  const W_TOTAL = cachedEls.trackWidth - P_LEFT - P_RIGHT;

  const activeTab = tabs[currentIndex];
  const isExpanding = activeTab.classList.contains("show-text");
  const textEl = activeTab.querySelector(".tab-text");

    const targetTextWidth = isExpanding && textEl ? Math.min(textEl.scrollWidth, 150) + 8 : 0;
  const w_a = W_ICON + targetTextWidth;

  const P_A = w_a + 2 * P_PANEL;
  const L = currentIndex;
  const R = tabs.length - 1 - currentIndex;

  const gaps = (L > 0 ? GAP : 0) + (R > 0 ? GAP : 0);
  const avail = W_TOTAL - P_A - gaps;

  const baseL = L > 0 ? (L * W_ICON + 2 * P_PANEL) : 0;
  const baseR = R > 0 ? (R * W_ICON + 2 * P_PANEL) : 0;
  const freeSpace = Math.max(0, avail - baseL - baseR);
  const totalGaps = Math.max(0, L - 1) + Math.max(0, R - 1);
  const gapSize = totalGaps > 0 ? freeSpace / totalGaps : 0;

  let P_L = 0, P_R = 0;

  if (L === 0) {
    P_R = avail;
  } else if (R === 0) {
    P_L = avail;
  } else {
    P_L = baseL + Math.max(0, L - 1) * gapSize;
    P_R = baseR + Math.max(0, R - 1) * gapSize;
  }

  const panelX_L = 0;
  const panelX_A = L > 0 ? P_L + GAP : 0;
  const panelX_R = panelX_A + P_A + GAP;

  if (glassLeft) {
    glassLeft.style.opacity = L === 0 ? "0" : "1";
    glassLeft.style.left = `${P_LEFT + panelX_L}px`;
    glassLeft.style.width = `${Math.max(0, P_L)}px`;
  }

  if (glassActive) {
    glassActive.style.left = `${P_LEFT + panelX_A}px`;
    glassActive.style.width = `${Math.max(0, P_A)}px`;
  }

  if (glassRight) {
    glassRight.style.opacity = R === 0 ? "0" : "1";
    glassRight.style.left = `${P_LEFT + panelX_R}px`;
    glassRight.style.width = `${Math.max(0, P_R)}px`;
  }

  tabs.forEach((tab, i) => {
    let targetX = 0;

    if (i < currentIndex) {
      targetX = panelX_L + P_PANEL + i * (W_ICON + gapSize);
    } else if (i === currentIndex) {
      targetX = panelX_A + P_PANEL;
    } else {
      const j = i - currentIndex - 1;
      targetX = panelX_R + P_PANEL + j * (W_ICON + gapSize);
    }

    const finalX = P_LEFT + targetX;
    tab.style.transition = isInstant
      ? "transform 0s"
      : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
    tab.style.transform = `translateX(${finalX}px)`;
  });

  if (!isInitialized) isInitialized = true;
}

