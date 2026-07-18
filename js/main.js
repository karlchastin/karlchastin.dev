import { $, $$ } from './utils/dom.js';
import { injectIcons } from "./ui/icons.js";
import { WORKER_URL, profiles } from "./config.js";
import {
  setupTabs,
  swapData,
  isAnimating as isTabsAnimating,
} from "./ui/tabs.js";
import { syncBackgrounds } from "./ui/animations.js";
import { setupUIEvents } from "./ui/events.js";
import { renderAllComponents } from "./ui/components.js";
import { initBgEffects } from "./ui/bg-effects.js";
import { prefetchGitHubProfile, updateGitHubData } from "./api/github.js";
import { updateSteamData } from "./api/steam.js";
import { connectLanyard } from "./api/discord.js";
import { loadInstagramData } from "./api/instagram.js";
import { loadFacebookData } from "./api/facebook.js";
import {
  updateDBDData,
  updateValorantData,
  updateApexData,
  fetchOverwatchLiveStats,
} from "./api/games.js";

document.body.classList.add("tabs-hidden");

function preloadAssets() {
  const loadingScreen = document.getElementById("loading-screen");
  const loadingPct = document.getElementById("loading-percentage");
  const loadingBarFill = document.getElementById("loading-bar-fill");
  const enterOverlay = document.getElementById("enter-overlay");

  if (typeof Lenis !== "undefined") {
    const lenis = new Lenis({
      lerp: 0.15,
      wheelMultiplier: 0.9,
      syncTouch: true,
      smoothWheel: true,
      smoothTouch: true,
      autoResize: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }

  if (!loadingScreen || !loadingPct) return;

  let currentVal = 0;
  let targetVal = 0;
  let lastRenderedVal = -1;
  let isLoaded = false;

  const assetsToLoad = [];
  Object.values(profiles).forEach((p) => {
    if (p.avatar) assetsToLoad.push(p.avatar);
  });
  assetsToLoad.push("https://ghchart.rshah.org/ff0000/karlchastin");

  assetsToLoad.push("./assets/Animated Background.gif");

  document.querySelectorAll("img").forEach((img) => {
    if (img.src) assetsToLoad.push(img.src);
  });

  const uniqueAssets = [...new Set(assetsToLoad)];
  let loadedAssets = 0;

  const updateTarget = () => {
    if (uniqueAssets.length > 0) {
      targetVal = Math.floor((loadedAssets / uniqueAssets.length) * 90);
    }
  };

    uniqueAssets.forEach((src) => {
    const img = new Image();
    img.onload = () => {
      let pc = document.getElementById("hidden-preload-container");
      if (!pc) {
        pc = document.createElement("div");
        pc.id = "hidden-preload-container";
        pc.style.position = "absolute"; pc.style.top = "0"; pc.style.left = "0"; pc.style.zIndex = "-9999";
        pc.style.width = "1px";
        pc.style.height = "1px";
        pc.style.overflow = "hidden";
        pc.style.opacity = "0.0001";
        pc.style.pointerEvents = "none";
        document.body.appendChild(pc);
      }
      pc.appendChild(img);
      loadedAssets++;
      updateTarget();
    };
    img.onerror = () => {
      loadedAssets++;
      updateTarget();
    };
    img.src = src;
  });

  const finishLoading = () => {
    isLoaded = true;
    targetVal = 100;
  };

  if (document.readyState === "complete") {
    finishLoading();
  } else {
    window.addEventListener("load", finishLoading);
    setTimeout(finishLoading, 8000);
  }

  const animateLoading = () => {
    const diff = targetVal - currentVal;

    if (diff > 0) {
      currentVal += Math.ceil(diff * 0.15);
    }

    if (currentVal > 100) currentVal = 100;

    if (currentVal !== lastRenderedVal) {
      loadingPct.textContent = `${currentVal}%`;
      if (loadingBarFill) loadingBarFill.style.width = `${currentVal}%`;
      lastRenderedVal = currentVal;
    }

    if (currentVal === 100 && isLoaded) {
      setTimeout(() => {
        loadingScreen.style.opacity = "0";
        loadingScreen.style.filter = "blur(15px)";

        setTimeout(() => {
          loadingScreen.remove();

          if (enterOverlay) {
            enterOverlay.style.opacity = "1";
            enterOverlay.style.filter = "blur(0px)";
          }
        }, 800);
      }, 400);
    } else {
      requestAnimationFrame(animateLoading);
    }
  };

  requestAnimationFrame(animateLoading);
}

let isGlobalEntrance = true;
window.isAppAnimating = () => isTabsAnimating;

function refreshDynamicCard(cardId, targetTab, isActiveGetter) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const activeTabNode = document.querySelector(".tab.active");
  const activeTab = activeTabNode
    ? activeTabNode.getAttribute("data-tab")
    : "home";
  if (activeTab !== targetTab) return;

  const show = !!isActiveGetter();
  const isVisible =
    window.getComputedStyle(card).display !== "none" &&
    !card.classList.contains("hide-card");
  if (show === isVisible) return;

  const contentId = cardId.replace("-container", "-content");
  const contentEl = document.getElementById(contentId);

  if (typeof isGlobalEntrance !== "undefined" && isGlobalEntrance) {
    if (show) {
      card.style.opacity = "";
      card.style.margin = "";
      card.style.padding = "";
      card.style.borderWidth = "";
      card.style.transform = "";

      card.style.display = "block";
      card.classList.remove("hide-card");

      if (contentEl) contentEl.classList.remove("fade-out");

      if (typeof hasEntered !== "undefined" && !hasEntered) {
        card.classList.add("staged-for-drop");
      }

      card.style.height = "auto";
    } else {
      card.style.display = "none";
      card.classList.add("hide-card");
    }
    return;
  }

  if (typeof window.isAppAnimating !== "undefined" && window.isAppAnimating()) {
    setTimeout(
      () => refreshDynamicCard(cardId, targetTab, isActiveGetter),
      100,
    );
    return;
  }

  const smoothTransition =
    "height 0.65s cubic-bezier(0.25, 1, 0.5, 1), margin 0.65s cubic-bezier(0.25, 1, 0.5, 1), padding 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease";

  if (show) {
    card.style.opacity = "";
    card.style.margin = "";
    card.style.padding = "";
    card.style.borderWidth = "";
    card.style.transform = "";

    card.style.transition = "none";
    card.style.display = "block";
    card.classList.add("hide-card");
    card.style.height = "0px";

    if (contentEl) contentEl.classList.remove("fade-out");

    card.style.height = "auto";
    card.classList.remove("hide-card");
    card.style.overflow = "visible";
    const targetHeight = card.offsetHeight;

    card.classList.add("hide-card");
    card.style.height = "0px";
    card.style.overflow = "clip";
    card.style.overflowClipMargin = "150px";
    void card.offsetHeight;

    card.style.transition = smoothTransition;
    card.classList.remove("hide-card");
    card.style.height = targetHeight + "px";

    setTimeout(() => {
      if (isActiveGetter()) {
        card.style.height = "auto";
        card.style.overflow = "visible";
        card.style.overflowClipMargin = "";
      }
    }, 650);
  } else {
    const currentHeight = card.offsetHeight;
    card.style.height = currentHeight + "px";
    card.style.overflow = "clip";
    card.style.overflowClipMargin = "150px";
    card.style.transition = "none";

    void card.offsetHeight;

    card.style.transition = smoothTransition;
    card.classList.add("hide-card");
    card.style.height = "0px";

    setTimeout(() => {
      if (!isActiveGetter()) {
        card.style.display = "none";
        card.classList.remove("hide-card");
      }
    }, 650);
  }
}

window.refreshMusicCard = () =>
  refreshDynamicCard(
    "card-3-container",
    "apple_music",
    () => window.currentMusicActivities,
  );
window.refreshDiscordCard = () =>
  refreshDynamicCard(
    "card-2-container",
    "home",
    () => window.currentDiscordActivities,
  );

let _musicActive = window.currentMusicActivities || false;
if (!_musicActive && profiles.apple_music && profiles.apple_music.layout) {
  profiles.apple_music.layout.showCards =
    profiles.apple_music.layout.showCards.filter(
      (id) => id !== "card-3-container",
    );
}

Object.defineProperty(window, "currentMusicActivities", {
  get: () => _musicActive,
  set: (val) => {
    if (_musicActive !== val) {
      _musicActive = val;

      if (profiles && profiles.apple_music && profiles.apple_music.layout) {
        let showCards = profiles.apple_music.layout.showCards;
        if (val && !showCards.includes("card-3-container")) {
          showCards.push("card-3-container");
        } else if (!val) {
          profiles.apple_music.layout.showCards = showCards.filter(
            (id) => id !== "card-3-container",
          );
        }
      }

      setTimeout(window.refreshMusicCard, 10);
    }
  },
});

let _discordActive = window.currentDiscordActivities ?? true;
Object.defineProperty(window, "currentDiscordActivities", {
  get: () => _discordActive,
  set: (val) => {
    if (_discordActive !== val) {
      _discordActive = val;

      if (profiles && profiles.home && profiles.home.layout) {
        let showCards = profiles.home.layout.showCards;
        if (val && !showCards.includes("card-2-container")) {
          showCards.push("card-2-container");
        } else if (!val) {
          profiles.home.layout.showCards = showCards.filter(
            (id) => id !== "card-2-container",
          );
        }
      }

      setTimeout(window.refreshDiscordCard, 10);
    }
  },
});

function attachGlobalHeightObservers() {
  document.querySelectorAll(".transition-container").forEach((container) => {
    const card = container.closest(".card");
    if (!card) return;

    let isAnimatingHeight = false;
    let animTimeout;
    let debounceTimer;

    const checkAndAnimate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (
          isGlobalEntrance ||
          isTabsAnimating ||
          card.classList.contains("hide-card") ||
          window.getComputedStyle(card).display === "none" ||
          isAnimatingHeight
        )
          return;

        const oldHeight = card.offsetHeight;
        if (oldHeight === 0) return;

        const originalTransition = card.style.transition;

        card.style.transition = "none";
        card.style.height = "auto";
        const newHeight = card.offsetHeight;

        if (Math.abs(oldHeight - newHeight) > 2) {
          isAnimatingHeight = true;
          card.style.height = oldHeight + "px";
          void card.offsetHeight;

          if (originalTransition && originalTransition !== "none") {
            card.style.transition = originalTransition.includes("height")
              ? originalTransition
              : originalTransition +
                ", height 0.4s cubic-bezier(0.25, 1, 0.5, 1)";
          } else {
            card.style.transition = "";
          }

          card.style.height = newHeight + "px";

          clearTimeout(animTimeout);
          animTimeout = setTimeout(() => {
            isAnimatingHeight = false;
            if (card.style.height === newHeight + "px")
              card.style.height = "auto";
          }, 400);
        } else {
          card.style.height = oldHeight + "px";
          void card.offsetHeight;
          card.style.transition = originalTransition;
          card.style.height = "auto";
        }
      }, 10);
    };

    const resizeObserver = new ResizeObserver(checkAndAnimate);
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(checkAndAnimate);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}

function setupPreferencesTabs() {
  const prefTabs = document.querySelectorAll(".pref-tab");
  let isPrefAnimating = false;
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  prefTabs.forEach((tab) => {
    tab.addEventListener("click", async (e) => {
      e.preventDefault();
      if (
        isPrefAnimating ||
        tab.classList.contains("active") ||
        window.isAppAnimating()
      )
        return;
      isPrefAnimating = true;

      const originalIsAppAnimating = window.isAppAnimating;
      window.isAppAnimating = () => true;

      const targetId = "pref-" + tab.dataset.pref;
      const newContent = document.getElementById(targetId);

            const wrapper = tab.closest(".tab-content");
      const oldContent = wrapper ? wrapper.querySelector(".pref-content.active") : document.querySelector(".pref-content.active");
      const oldTab = wrapper ? wrapper.querySelector(".pref-tab.active") : document.querySelector(".pref-tab.active");
      const card = tab.closest(".card");

      let currentHeight = 0;
      if (card) {
        currentHeight = card.offsetHeight;
        card.style.transition = "none";
        card.style.height = currentHeight + "px";
        card.style.overflow = "clip";
        card.style.overflowClipMargin = "150px";
        void card.offsetHeight;
      }

      if (oldContent) {
        oldContent.style.transition = "opacity 0.15s ease";
        oldContent.style.opacity = "0";
      }
      await delay(150);

      if (oldTab) oldTab.classList.remove("active");
      await delay(500);

      if (oldContent) {
        oldContent.classList.remove("active");
        oldContent.style.transition = "";
        oldContent.style.opacity = "";
      }

      newContent.style.opacity = "0";
      newContent.classList.add("active");

      if (card) {
        card.style.height = "auto";
        card.style.overflow = "visible";
        const targetHeight = card.offsetHeight;

        card.style.height = currentHeight + "px";
        card.style.overflow = "clip";
        card.style.overflowClipMargin = "150px";
        void card.offsetHeight;

        tab.classList.add("active");
        card.style.transition =
          "height 0.65s cubic-bezier(0.25, 1, 0.5, 1), margin 0.65s cubic-bezier(0.25, 1, 0.5, 1), padding 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
        card.style.height = targetHeight + "px";
      } else {
        tab.classList.add("active");
      }

      await delay(600);

      newContent.style.transition = "opacity 0.3s ease";
      newContent.style.opacity = "1";
      await delay(300);

      if (card) {
        await delay(150);
        card.style.height = "auto";
        card.style.overflow = "visible";
        card.style.overflowClipMargin = "";
      }
      newContent.style.transition = "";
      newContent.style.opacity = "";

      window.isAppAnimating = originalIsAppAnimating;
      isPrefAnimating = false;
    });
  });

  const subPrefTabs = document.querySelectorAll(".sub-pref-tab");
  let isSubPrefAnimating = false;

  const desktopToggle = document.getElementById("desktop-toggle");
  const desktopSubmenu = document.getElementById("desktop-submenu");
  const desktopChevron = document.getElementById("desktop-chevron");

  let isDesktopSubmenuOpen = true;

  if (desktopToggle && desktopSubmenu) {
    desktopToggle.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.isAppAnimating()) return;

      isDesktopSubmenuOpen = !isDesktopSubmenuOpen;

      if (isDesktopSubmenuOpen) {
        desktopSubmenu.style.maxHeight = desktopSubmenu.scrollHeight + "px";
        desktopSubmenu.style.opacity = "1";
        desktopSubmenu.style.margin = "-5px 0 5px 0";
        if (desktopChevron) desktopChevron.style.transform = "rotate(180deg)";
        desktopToggle.classList.add("active");

        let hasActiveChild = false;
        desktopSubmenu.querySelectorAll(".sub-pref-tab").forEach((t) => {
          if (t.classList.contains("active")) hasActiveChild = true;
        });
        if (!hasActiveChild) {
          const mbTab = desktopSubmenu.querySelector(
            '[data-subpref="motherboard"]',
          );
          if (mbTab) mbTab.click();
        }

        setTimeout(() => {
          if (isDesktopSubmenuOpen) desktopSubmenu.style.maxHeight = "500px";
        }, 500);
      } else {
        desktopSubmenu.style.maxHeight = desktopSubmenu.scrollHeight + "px";
        void desktopSubmenu.offsetWidth;
        desktopSubmenu.style.maxHeight = "0px";
        desktopSubmenu.style.opacity = "0";
        desktopSubmenu.style.margin = "-10px 0 0 0";
        if (desktopChevron) desktopChevron.style.transform = "rotate(0deg)";
        desktopToggle.classList.remove("active");
      }
    });
  }

  subPrefTabs.forEach((tab) => {
    tab.addEventListener("click", async (e) => {
      if (tab.id === "desktop-toggle") return;
      e.preventDefault();
      if (isSubPrefAnimating || tab.classList.contains("active")) return;
      isSubPrefAnimating = true;

      if (desktopSubmenu && desktopToggle) {
        if (!desktopSubmenu.contains(tab)) {
          isDesktopSubmenuOpen = false;
          desktopSubmenu.style.maxHeight = desktopSubmenu.scrollHeight + "px";
          void desktopSubmenu.offsetWidth;
          desktopSubmenu.style.maxHeight = "0px";
          desktopSubmenu.style.opacity = "0";
          desktopSubmenu.style.margin = "-10px 0 0 0";
          if (desktopChevron) desktopChevron.style.transform = "rotate(0deg)";
          desktopToggle.classList.remove("active");
        }
      }

      const parent = tab.closest(".pref-content");
      const targetId = "subpref-" + tab.dataset.subpref;
      const newContent = document.getElementById(targetId);
      const oldContent = parent.querySelector(".sub-pref-content.active");
      const oldTabs = parent.querySelectorAll(".sub-pref-tab.active");

      if (oldContent) {
        oldContent.style.transition = "opacity 0.15s ease";
        oldContent.style.opacity = "0";
      }

      await delay(150);

      oldTabs.forEach((t) => {
        if (t.id !== "desktop-toggle") t.classList.remove("active");
      });
      tab.classList.add("active");

      if (oldContent) {
        oldContent.classList.remove("active");
        oldContent.style.transition = "";
        oldContent.style.opacity = "";
      }

      newContent.style.opacity = "0";
      newContent.classList.add("active");

      void newContent.offsetWidth;

      newContent.style.transition = "opacity 0.25s ease";
      newContent.style.opacity = "1";

      await delay(250);

      newContent.style.transition = "";
      newContent.style.opacity = "";

      isSubPrefAnimating = false;
    });
  });

  let isBiosTabAnimating = false;
  const biosTabs = document.querySelectorAll(".bios-tab-btn");
  biosTabs.forEach((tab) => {
    tab.addEventListener("click", async (e) => {
      e.preventDefault();
      if (tab.classList.contains("active") || isBiosTabAnimating) return;

      isBiosTabAnimating = true;

      const targetId = "bios-tab-" + tab.dataset.biostab;
      const newContent = document.getElementById(targetId);
      const biosContainer = document.getElementById("bios-tab-container");

      let oldContent = null;
      document.querySelectorAll(".bios-tab-content").forEach((content) => {
        if (
          content.classList.contains("active") ||
          content.style.display === "block"
        ) {
          oldContent = content;
        }
      });

      let startHeight = 0;
      if (biosContainer) {
        startHeight = biosContainer.offsetHeight;
        biosContainer.style.height = startHeight + "px";
        biosContainer.style.overflow = "hidden";
      }

      if (oldContent) {
        oldContent.style.transition = "opacity 0.2s ease";
        oldContent.style.opacity = "0";
        await delay(200);

        oldContent.style.display = "none";
        oldContent.classList.remove("active");
        oldContent.style.transition = "";
        oldContent.style.opacity = "";
      }

      biosTabs.forEach((t) => {
        t.classList.remove("active");
      });
      tab.classList.add("active");

      if (newContent && biosContainer) {
        newContent.style.opacity = "0";
        newContent.style.display = "block";
        newContent.classList.add("active");

        biosContainer.style.height = "auto";
        const targetHeight = biosContainer.offsetHeight;

        biosContainer.style.height = startHeight + "px";
        void biosContainer.offsetWidth;

        biosContainer.style.transition =
          "height 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
        biosContainer.style.height = targetHeight + "px";

        await delay(600);

        newContent.style.transition = "opacity 0.3s ease";
        newContent.style.opacity = "1";

        await delay(300);

        newContent.style.transition = "";
        newContent.style.opacity = "";

        biosContainer.style.transition = "";
        biosContainer.style.height = "auto";
        biosContainer.style.overflow = "";
      }

      isBiosTabAnimating = false;
    });
  });
}

try {
  injectIcons();
  preloadAssets();
  renderAllComponents();
  setupTabs();

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setTimeout(() => {
        if (window.refreshMusicCard) window.refreshMusicCard();
        if (window.refreshDiscordCard) window.refreshDiscordCard();
      }, 50);
    });
  });

  setupUIEvents();
  setupPreferencesTabs();
  attachGlobalHeightObservers();
  loadFacebookData();
  initBgEffects();
} catch (e) {
  console.error("UI Initialization Error:", e);
}

const enterBtn = document.getElementById("enter-btn");
const enterOverlay = document.getElementById("enter-overlay");
const mainContent = document.getElementById("content");
const bgAudio = document.getElementById("bg-audio");
const sfxAudio = document.getElementById("sfx-audio");

let hasEntered = false;

if (enterBtn) {
  enterBtn.addEventListener("click", () => {
    if (hasEntered) return;
    hasEntered = true;

    enterBtn.style.opacity = "0";
    enterBtn.style.pointerEvents = "none";
    enterBtn.disabled = true;

    if (window.audioCtx && window.audioCtx.state === "suspended") {
      window.audioCtx.resume();
    }

    if (bgAudio && !window.audioCtx) {
      try {
        window.audioCtx = new (
          window.AudioContext || window.webkitAudioContext
        )();
        window.audioSource = window.audioCtx.createMediaElementSource(bgAudio);

        window.lowpassFilter = window.audioCtx.createBiquadFilter();
        window.lowpassFilter.type = "lowpass";
        window.lowpassFilter.frequency.value = 200;

        window.bassFilter = window.audioCtx.createBiquadFilter();
        window.bassFilter.type = "lowshelf";
        window.bassFilter.frequency.value = 150;
        window.bassFilter.gain.value = 0;

        window.trebleFilter = window.audioCtx.createBiquadFilter();
        window.trebleFilter.type = "highshelf";
        window.trebleFilter.frequency.value = 4000;
        window.trebleFilter.gain.value = 0;

        window.masterGain = window.audioCtx.createGain();
        window.masterGain.gain.value = 1.0;

        window.audioSource.connect(window.bassFilter);
        window.bassFilter.connect(window.trebleFilter);
        window.trebleFilter.connect(window.lowpassFilter);
        window.lowpassFilter.connect(window.masterGain);
        window.masterGain.connect(window.audioCtx.destination);
      } catch (e) {
        console.warn("Audio routing error:", e);
      }
    }

    if (window.audioCtx && window.masterGain) {
      const now = window.audioCtx.currentTime;
      const dropTime = now + 4.4;

      if (window.lowpassFilter) {
        window.lowpassFilter.frequency.cancelScheduledValues(now);
        window.lowpassFilter.frequency.setValueAtTime(200, now);
        window.lowpassFilter.frequency.setTargetAtTime(22050, dropTime, 0.05);
      }
      if (window.bassFilter) {
        window.bassFilter.gain.cancelScheduledValues(now);
        window.bassFilter.gain.setValueAtTime(0, now);
        window.bassFilter.gain.setTargetAtTime(8, dropTime, 0.05);
      }
      if (window.trebleFilter) {
        window.trebleFilter.gain.cancelScheduledValues(now);
        window.trebleFilter.gain.setValueAtTime(0, now);
        window.trebleFilter.gain.setTargetAtTime(8, dropTime, 0.05);
      }

      window.masterGain.gain.cancelScheduledValues(now);
      window.masterGain.gain.setValueAtTime(1.0, now);
      window.masterGain.gain.setValueAtTime(1.0, dropTime);
      window.masterGain.gain.linearRampToValueAtTime(0.35, dropTime + 0.15);
    }

    if (bgAudio) {
      bgAudio.volume = 1.0;
      bgAudio.currentTime = 0;
      const bgPromise = bgAudio.play();
      if (bgPromise !== undefined) bgPromise.catch(() => {});
    }

    if (sfxAudio) {
      sfxAudio.volume = 0.6;
      sfxAudio.currentTime = 0;
      const sfxPromise = sfxAudio.play();
      if (sfxPromise !== undefined) sfxPromise.catch(() => {});
    }

    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100vw";
    flash.style.height = "100vh";
    flash.style.backgroundColor = "#fff";
    flash.style.zIndex = "99999";
    flash.style.pointerEvents = "none";
    flash.style.willChange = "opacity";
    document.body.appendChild(flash);

    flash.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.15 },
        { opacity: 0, offset: 1 },
      ],
      { duration: 400, easing: "ease-out" },
    ).onfinish = () => flash.remove();

    setTimeout(() => {
      if (enterOverlay) {
        enterOverlay.style.pointerEvents = "none";
        enterOverlay.style.transition = "opacity 3s ease-out";
        void enterOverlay.offsetWidth;
        enterOverlay.style.opacity = "0";
      }
    }, 100);

    if (mainContent) {
      mainContent.classList.remove("hidden");
      void mainContent.offsetWidth;

      const activeTabNode = document.querySelector(".tab.active");
      if (activeTabNode) activeTabNode.classList.add("show-text");

      const animTargets = [
        ...document.querySelectorAll(".glass-panel"),
        ...document.querySelectorAll(".tab"),
        ...document.querySelectorAll(".card"),
      ];

      animTargets.forEach((el) => el.classList.add("staged-for-drop"));

      if (typeof syncBackgrounds === "function") syncBackgrounds(0, true);
    }

    setTimeout(() => {
      if (bgAudio) {
        bgAudio.volume = 1.0;
      }

      if (enterOverlay) enterOverlay.style.display = "none";

      if (mainContent) {
        const animTargets = [
          ...document.querySelectorAll(".glass-panel"),
          ...document.querySelectorAll(".tab"),
          ...document.querySelectorAll(".card"),
        ];

        animTargets.forEach((el) => el.classList.add("is-dropping"));

        void mainContent.offsetWidth;

        animTargets.forEach((el) => el.classList.remove("staged-for-drop"));

        setTimeout(() => {
          document.body.classList.add("tabs-reveal-mode");
          document.body.classList.remove("tabs-hidden");

          setTimeout(() => {
            document.body.classList.remove("tabs-reveal-mode");
          }, 1000);
        }, 300);

        setTimeout(() => {
          animTargets.forEach((el) => el.classList.remove("is-dropping"));
          if (typeof isGlobalEntrance !== "undefined") isGlobalEntrance = false;
        }, 800);
      } else {
        if (typeof isGlobalEntrance !== "undefined") isGlobalEntrance = false;
        document.body.classList.remove("tabs-hidden");
      }
    }, 4400);
  });
} else {
  if (typeof isGlobalEntrance !== "undefined") isGlobalEntrance = false;
  document.body.classList.remove("tabs-hidden");
}

try {
  prefetchGitHubProfile();
  updateGitHubData();
  updateSteamData();
  connectLanyard();
  loadInstagramData();

  updateDBDData();
  updateValorantData();
  updateApexData();
  fetchOverwatchLiveStats(
    "https://overwatch.blizzard.com/en-us/career/d156b69ebd3ccaffbfa9%7Cf27cbe61960ce0f2f4d04c2ebe83a618/",
  );

  swapData("home");

  const activeLayout = profiles["home"].layout;
  const targetCards = activeLayout.showCards || [];
  document.querySelectorAll(".card").forEach((card) => {
    if (card.id === "main-profile-card" || targetCards.includes(card.id)) {
      card.style.display = "block";
      card.classList.remove("hide-card");
    } else {
      card.style.display = "none";
      card.classList.add("hide-card");
    }
  });
} catch (e) {
  console.error("Service Initialization Error:", e);
}

setInterval(() => {
  if (document.hidden) return;
  const timeEl = document.getElementById("live-time-text");
  const locTime = document.getElementById("loc-time");
  if (
    timeEl &&
    locTime &&
    window.getComputedStyle(locTime).display !== "none"
  ) {
    const gmt8 = new Date(
      new Date().getTime() +
        new Date().getTimezoneOffset() * 60000 +
        3600000 * 8,
    );
    timeEl.textContent = `${gmt8.toLocaleTimeString("en-US", { hour12: true })} (GMT+8:00)`;
  }
}, 1000);

setInterval(() => {
  if (document.hidden) return;
  const activeTabNode = document.querySelector(".tab.active");
  const activeTab = activeTabNode
    ? activeTabNode.getAttribute("data-tab")
    : null;
  if (activeTab === "steam") {
    fetch(`${WORKER_URL}?route=status`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.stateMessage) {
          const statusEl = document.getElementById("steam-live-status");
          if (statusEl) {
            statusEl.innerHTML = data.stateMessage;
            statusEl.className = `steam-status ${data.onlineState} bg-effect-exclude`;
          }
        }
      })
      .catch(() => {});
  }
}, 5000);

setInterval(() => {
  if (document.hidden) return;
  const activeTabNode = document.querySelector(".tab.active");
  const activeTab = activeTabNode
    ? activeTabNode.getAttribute("data-tab")
    : "home";
  const activeLayout = profiles[activeTab]?.layout || profiles.home.layout;

  if (activeLayout.showGithubStats) updateGitHubData();
  if (activeLayout.showSteamExtra) updateSteamData();
}, 60000);

const initialPath = sessionStorage.getItem('redirectPath') || window.location.pathname.substring(1).replace(/\/$/, "");
if (initialPath) {
  const targetTab = document.querySelector(`.tab[data-tab="${initialPath}"]`);
  if (targetTab) {
    targetTab.click();
  }
}
window.history.replaceState(null, null, "/");

const biosTabs = document.querySelectorAll(".bios-tab");
biosTabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();
    if (tab.classList.contains("active")) return;

    biosTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const panels = document.querySelectorAll(".bios-panel");
    panels.forEach((p) => {
      p.style.display = "none";
      p.classList.remove("active");
    });

    const targetId = "bios-" + tab.dataset.bios;
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.style.display = "block";
      targetPanel.classList.add("active");
    }
  });
});

const accordionHeaders = document.querySelectorAll(".accordion-header");
accordionHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const group = header.closest(".bios-accordion-group");
    const content = group.querySelector(":scope > .accordion-content");
    const chevron = header.querySelector(".accordion-chevron");

    const isOpen = content.classList.contains("show");

    const resetInnerAccordions = (container) => {
      const innerContents = container.querySelectorAll(
        ".accordion-content.show",
      );
      innerContents.forEach((inner) => {
        inner.style.height = "0";
        inner.style.opacity = "0";
        inner.style.display = "none";
        inner.classList.remove("show");
        const innerChevron = inner.parentElement.querySelector(
          ".accordion-header .accordion-chevron",
        );
        if (innerChevron) innerChevron.style.transform = "rotate(0deg)";
      });
    };

    const parentGroup = group.parentElement;
    const siblingGroups = parentGroup.querySelectorAll(
      ":scope > .bios-accordion-group",
    );
    siblingGroups.forEach((sibling) => {
      if (sibling !== group) {
        const siblingContent = sibling.querySelector(
          ":scope > .accordion-content",
        );
        const siblingChevron = sibling.querySelector(
          ".accordion-header .accordion-chevron",
        );
        if (siblingContent && siblingContent.classList.contains("show")) {
          siblingContent.style.height = siblingContent.scrollHeight + "px";
          void siblingContent.offsetHeight;
          siblingContent.style.height = "0";
          siblingContent.style.opacity = "0";
          siblingContent.classList.remove("show");
          if (siblingChevron) siblingChevron.style.transform = "rotate(0deg)";

          resetInnerAccordions(siblingContent);

          setTimeout(() => {
            if (!siblingContent.classList.contains("show")) {
              siblingContent.style.display = "none";
            }
          }, 300);
        }
      }
    });

    if (isOpen) {
      content.style.height = content.scrollHeight + "px";
      void content.offsetHeight;
      content.style.height = "0";
      content.style.opacity = "0";
      content.classList.remove("show");
      if (chevron) chevron.style.transform = "rotate(0deg)";

      resetInnerAccordions(content);

      setTimeout(() => {
        if (!content.classList.contains("show")) {
          content.style.display = "none";
        }
      }, 300);
    } else {
      content.style.display = "block";
      content.classList.add("show");
      const height = content.scrollHeight + "px";
      content.style.height = height;
      content.style.opacity = "1";
      if (chevron) chevron.style.transform = "rotate(180deg)";

      setTimeout(() => {
        if (content.classList.contains("show")) {
          content.style.height = "auto";
        }
      }, 300);
    }
  });
});

