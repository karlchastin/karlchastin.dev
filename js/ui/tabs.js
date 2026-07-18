import { $, $$ } from '../utils/dom.js';
import { profiles, defaultLayout } from "../config.js";
import { syncBackgrounds } from "./animations.js";

export let isAnimating = false;
export let currentIndex = 0;

const safeDelay = (ms) =>
  new Promise((resolve) => {
    if (document.hidden) return resolve();
    let resolved = false;
    const timer = setTimeout(() => {
      resolved = true;
      document.removeEventListener("visibilitychange", onHide);
      resolve();
    }, ms);
    const onHide = () => {
      if (document.hidden && !resolved) {
        resolved = true;
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onHide);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onHide);
  });

export async function swapData(tabName) {
  const profileData = profiles[tabName] || profiles.home;
  const newLayout = { ...defaultLayout, ...(profileData.layout || {}) };

  const isIgDeact = document.body.classList.contains("ig-deactivated");
  const isFbDeact = document.body.classList.contains("fb-deactivated");

  const avatarImg = document.getElementById("avatar-img");
  const profileName = document.getElementById("profile-name");
  const profileUsername = document.getElementById("profile-username");
  const profileBio = document.getElementById("profile-bio");

  if (avatarImg) { avatarImg.src = profileData.avatar; avatarImg.decode().catch(() => { }); }
  if (profileName) profileName.textContent = profileData.name;
  if (profileUsername) profileUsername.textContent = profileData.username;
  if (profileBio) {
    profileBio.innerHTML = profileData.bio;
    profileBio.style.minHeight = "";
  }

  const displayMap = {
    "home-discord": { show: newLayout.showDiscord, type: "block" },
    "github-stats-wrapper": { show: newLayout.showGithubStats, type: "block" },
    "music-player": { show: newLayout.showMusic, type: "flex" },
    "github-contributions-wrapper": {
      show: newLayout.showGithubContribs,
      type: "block",
    },
    "email-actions-wrapper": {
      show: newLayout.showEmailActions,
      type: "block",
    },
    "loc-home": { show: newLayout.showLocHome, type: "flex" },
    "loc-github": { show: newLayout.showLocGithub, type: "inline-flex" },
    "loc-steam": { show: newLayout.showLocSteam, type: "inline-flex" },
    "loc-discord": { show: newLayout.showLocDiscord, type: "inline-flex" },
    "loc-music": { show: newLayout.showLocMusic, type: "inline-flex" },
    "loc-instagram": { show: newLayout.showLocInsta, type: "inline-flex" },
    "loc-facebook": { show: newLayout.showLocFacebook, type: "inline-flex" },
    "loc-time": { show: newLayout.showTimeLoc, type: "flex" },
    "github-achievements-wrapper": {
      show: newLayout.showGithubAchievements,
      type: "block",
    },
    "steam-activity-wrapper": {
      show: newLayout.showSteamActivity,
      type: "flex",
    },
    "steam-stats-wrapper": { show: newLayout.showSteamStats, type: "block" },
    "github-repos": { show: newLayout.showGithubRepos, type: "block" },
    "steam-review-wrapper": { show: newLayout.showSteamReview, type: "block" },
    "discord-status-wrapper": {
      show: newLayout.showDiscordStatus,
      type: "flex",
    },
    "steam-status-wrapper": { show: newLayout.showSteamStatus, type: "flex" },
    "discord-badges-wrapper": {
      show: newLayout.showDiscordBadges,
      type: "block",
    },
    "discord-servers-wrapper": {
      show: newLayout.showDiscordServers,
      type: "block",
    },
    "apple-music-activity-wrapper": {
      show: newLayout.showMusicActivity,
      type: "block",
    },
    "music-playlists-wrapper": {
      show: newLayout.showMusicPlaylists,
      type: "block",
    },
    "instagram-highlights-wrapper": {
      show: newLayout.showInstaHighlights,
      type: "block",
    },
    "instagram-stats-wrapper": {
      show: newLayout.showInstaStats,
      type: "block",
    },
    "instagram-posts-wrapper": {
      show: newLayout.showInstaPosts,
      type: "block",
    },
    "facebook-stats-wrapper": {
      show: newLayout.showFacebookStats,
      type: "block",
    },
    "gaming-rig-wrapper": { show: newLayout.showGamingRig, type: "block" },
    "game-stats-wrapper": { show: newLayout.showGameStats, type: "block" },
    "tiktok-wrapper": { show: newLayout.showTiktok, type: "flex", flexDirection: "column" },
  };

  for (const [id, config] of Object.entries(displayMap)) {
    const el = document.getElementById(id);
    if (el) {
      let shouldShow = config.show;

      if (tabName === "instagram" && isIgDeact && id.includes("instagram"))
        shouldShow = false;
      if (tabName === "facebook" && isFbDeact && id.includes("facebook"))
        shouldShow = false;

      el.style.display = shouldShow ? config.type : "none";
    }
  }

  const elLevelDisplay = document.getElementById("steam-level-display");
  if (elLevelDisplay) {
    let cache = JSON.parse(localStorage.getItem("steamCache") || "{}");
    elLevelDisplay.style.display =
      tabName === "steam" && cache.level && cache.level !== "--"
        ? "flex"
        : "none";
  }
}

export function setupTabs() {
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(
      () => requestAnimationFrame(() => syncBackgrounds(currentIndex, false)),
      50,
    );
  });

  const tabs = document.querySelectorAll(".tab");

  if (window.ResizeObserver) {
    let roTimer = null;
    const track = document.querySelector(".tabs-track");
    const observer = new ResizeObserver(() => {
      if (!isAnimating) {
        requestAnimationFrame(() => syncBackgrounds(currentIndex, true));

        clearTimeout(roTimer);
        roTimer = setTimeout(() => {
          if (!isAnimating)
            requestAnimationFrame(() => syncBackgrounds(currentIndex, false));
        }, 50);
      }
    });

    if (track) observer.observe(track);
    tabs.forEach((t) => observer.observe(t));
  }

  if (document.fonts) {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => syncBackgrounds(currentIndex, true));
    });
  }

  tabs.forEach((link, idx) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      if (isAnimating || link.classList.contains("active")) return;
      isAnimating = true;
      window.isTabsAnimating = true;

      const glassLeft = document.getElementById("glass-left");
      const glassActive = document.getElementById("glass-active");
      const glassRight = document.getElementById("glass-right");
      if (glassLeft) glassLeft.classList.add("sliding");
      if (glassActive) glassActive.classList.add("sliding");
      if (glassRight) glassRight.classList.add("sliding");

      const oldTab = document.querySelector(".tab.active");
      if (oldTab) oldTab.classList.remove("text-visible");
      document.body.removeAttribute("data-tab-effect-visible");

      const allCards = document.querySelectorAll(".card");

      allCards.forEach((card) => {
        if (window.getComputedStyle(card).display !== "none") {
          const h = card.offsetHeight;
          card.style.height = h + "px";
          card.style.overflow = "clip";
          card.style.overflowClipMargin = "150px";
          card.style.transition = "none";
        }
      });

      void document.body.offsetHeight;
      allCards.forEach((card) => (card.style.transition = ""));

      const avatarImg = document.getElementById("avatar-img");
      const locContainer = document.getElementById("location-container");
      if (avatarImg) {
        avatarImg.parentElement.style.transition = "opacity 0.25s ease";
        avatarImg.parentElement.style.opacity = "0";
      }
      if (locContainer) locContainer.style.opacity = "0";

      document
        .querySelectorAll(".transition-container")
        .forEach((c) => c.classList.add("fade-out"));

      await safeDelay(300);

      if (oldTab) {
        oldTab.classList.remove("text-visible");
        oldTab.classList.remove("active");
        oldTab.classList.remove("show-text");
      }
      syncBackgrounds(currentIndex);

      const tabName = link.getAttribute("data-tab");
      window.history.pushState(null, null, `#${tabName}`);
      document.body.setAttribute('data-active-tab', tabName);

      if (tabName === "gaming_rig" && typeof window.resetPrefToSetup === "function") {
        window.resetPrefToSetup(true);
      }
      if (tabName === "game_statistics" && typeof window.resetGameStats === "function") {
        window.resetGameStats(true);
      }

      const newLayout = profiles[tabName]?.layout || profiles.home.layout;
      const targetCards = newLayout.showCards || [];

      const cardVisibility = new Map();
      const isIgDeact = document.body.classList.contains("ig-deactivated");
      const isFbDeact = document.body.classList.contains("fb-deactivated");

      allCards.forEach((card) => {
        const shouldShow =
          card.id === "main-profile-card" || targetCards.includes(card.id);

        let finalShow = shouldShow;

        if (
          tabName === "instagram" &&
          isIgDeact &&
          card.id !== "main-profile-card"
        )
          finalShow = false;
        if (
          tabName === "facebook" &&
          isFbDeact &&
          card.id !== "main-profile-card"
        )
          finalShow = false;

        if (
          tabName === "music" &&
          card.id === "card-3-container" &&
          !window.currentMusicActivities
        )
          finalShow = false;
        if (
          tabName === "home" &&
          card.id === "card-2-container" &&
          !window.currentDiscordActivities
        )
          finalShow = false;

        cardVisibility.set(card, finalShow);
      });

      await swapData(tabName);

      allCards.forEach((card) => {
        const finalShow = cardVisibility.get(card);
        const isCurrentlyVisible =
          window.getComputedStyle(card).display !== "none";

        if (finalShow) {
          if (!isCurrentlyVisible) {
            card.style.transition = "none";
            card.style.display = "block";
            card.classList.add("hide-card");
            card.style.height = "0px";
          } else {
            card.classList.remove("hide-card");
          }
        }
      });

      const targetHeights = new Map();

      allCards.forEach((card) => {
        const finalShow = cardVisibility.get(card);

        if (finalShow) {
          const hadHideCard = card.classList.contains("hide-card");
          card.dataset.hadHideCard = hadHideCard ? "true" : "false";
          card.dataset.tempHeight = card.style.height;
          card.dataset.tempOverflow = card.style.overflow;
          card.dataset.tempMargin = card.style.overflowClipMargin;
          card.dataset.tempTransition = card.style.transition;

          card.style.transition = "none";
          if (hadHideCard) card.style.opacity = "0";
          card.classList.remove("hide-card");

          card.style.margin = "";
          card.style.padding = "";
          card.style.borderWidth = "";
          card.style.opacity = "";
          card.style.transform = "";

          card.style.height = "auto";
          card.style.overflow = "visible";
          card.style.overflowClipMargin = "";
        }
      });

      allCards.forEach((card) => {
        const finalShow = cardVisibility.get(card);

        if (finalShow) {
          targetHeights.set(card, card.offsetHeight);

          if (card.dataset.hadHideCard === "true") {
            card.style.opacity = "";
            card.classList.add("hide-card");
          }
          card.style.overflow = card.dataset.tempOverflow;
          card.style.overflowClipMargin = card.dataset.tempMargin;
          card.style.height = card.dataset.tempHeight;
          void card.offsetHeight;
          card.style.transition = card.dataset.tempTransition;
        }
      });

      void document.body.offsetHeight;

      allCards.forEach((card) => {
        const finalShow = cardVisibility.get(card);

        card.style.transition =
          "height 0.65s cubic-bezier(0.25, 1, 0.5, 1), margin 0.65s cubic-bezier(0.25, 1, 0.5, 1), padding 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease";

        if (finalShow) {
          card.classList.remove("hide-card");
          card.style.height = targetHeights.get(card) + "px";
          card.style.margin = "";
          card.style.padding = "";
          card.style.borderWidth = "";
        } else {
          const parent = card.parentElement;
          const gap = parent
            ? parseFloat(window.getComputedStyle(parent).rowGap) || parseFloat(window.getComputedStyle(parent).gap) || 15
            : 0;

          card.classList.add("hide-card");
          card.style.height = "0px";
          card.style.padding = "0px";
          card.style.borderWidth = "0px";
          card.style.marginTop = "0px";
          card.style.marginBottom = `-${gap}px`;
          card.style.opacity = "0";
        }
      });

      await safeDelay(650);

      currentIndex = idx;
      syncBackgrounds(currentIndex);

            const allTabEffects = document.querySelectorAll('#glass-active .tab-bg-effect');
      allTabEffects.forEach(effect => {
        if (effect.getAttribute('data-bg-tab') === tabName) {
          effect.classList.add('active');
        } else {
          effect.classList.remove('active');
        }
      });
      await safeDelay(350);

      link.classList.add("active");
      link.classList.add("show-text");
      syncBackgrounds(currentIndex);
      await safeDelay(350);
      link.classList.add("text-visible");
      document.body.setAttribute("data-tab-effect-visible", "true");
      if (avatarImg) avatarImg.parentElement.style.opacity = "1";
      if (locContainer) locContainer.style.opacity = "1";

      const dynamicInfo = document.getElementById("dynamic-info");
      if (dynamicInfo) dynamicInfo.classList.remove("fade-out");

      ["card-2", "card-3", "card-4"].forEach((num) => {
        if (newLayout.showCards?.includes(`${num}-container`)) {
          const contentEl = document.getElementById(`${num}-content`);
          if (contentEl) contentEl.classList.remove("fade-out");
        }
      });

      await safeDelay(300);

      allCards.forEach((card) => {
        const finalShow = cardVisibility.get(card);

        if (finalShow) {
          card.style.height = "auto";
          card.style.overflow = "visible";
          card.style.overflowClipMargin = "";
        } else {
          card.style.display = "none";
          card.classList.remove("hide-card");

          card.style.margin = "";
          card.style.padding = "";
          card.style.borderWidth = "";
        }
      });

      syncBackgrounds(currentIndex);
      if (glassLeft) glassLeft.classList.remove("sliding");
      if (glassActive) glassActive.classList.remove("sliding");
      if (glassRight) glassRight.classList.remove("sliding");
      isAnimating = false;
      window.isTabsAnimating = false;
    });
  });

  window.addEventListener("popstate", () => {
    const hash = window.location.hash.substring(1) || "home";
    const targetTab = document.querySelector(`.tab[data-tab="${hash}"]`);
    if (targetTab && !targetTab.classList.contains("active")) {
      targetTab.click();
    }
  });

  setTimeout(() => {
    const initialHash = window.location.hash.substring(1);
    if (initialHash && initialHash !== "home") {
      const targetTab = document.querySelector(
        `.tab[data-tab="${initialHash}"]`,
      );
      if (targetTab) {
        targetTab.click();
      } else {
        document.body.setAttribute('data-active-tab', 'home');
      }
    } else {
      document.body.setAttribute('data-active-tab', 'home');
    }
  }, 500);
}










