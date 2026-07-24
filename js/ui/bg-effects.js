export function initBgEffects() {
  const overlayContainers = document.querySelectorAll(".card-bg-effect");
  overlayContainers.forEach((container) => {
    const allImages = container.querySelectorAll(".bg-effect-video");
    if (allImages.length === 0) return;
    let currentIndex = 0;
    let isPlaying = false;
    let currentTimeout = null;
    let transitionTimeout = null;
    const urls = Array.from(allImages).map(
      (img) => img.getAttribute("data-src") || img.src,
    );
    const targetTab = container.getAttribute("data-bg-tab");
    const isSingleNative = allImages.length === 1;
    const cardParent = container.closest(".card");
    for (let i = 1; i < allImages.length; i++) {
      allImages[i].remove();
    }
    const mediaEl = allImages[0];
    mediaEl.style.position = "absolute";
    mediaEl.style.objectFit = "cover";
    const getTargetElements = () => {
      if (!cardParent) return [];
      return Array.from(
        cardParent.querySelectorAll(".bg-effect-exclude"),
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" &&
          style.opacity !== "0" &&
          style.visibility !== "hidden"
        );
      });
    };
    const updateMask = () => {
      if (!isPlaying || !cardParent) return;
      const rect = container.getBoundingClientRect();
      const cards = Array.from(document.querySelectorAll(".card")).filter(
        (c) => window.getComputedStyle(c).display !== "none",
      );
      if (cards.length === 0) return;
      const firstCardRect = cards[0].getBoundingClientRect();
      const lastCardRect = cards[cards.length - 1].getBoundingClientRect();
      const columnWidth = firstCardRect.width;
      const columnHeight = lastCardRect.bottom - firstCardRect.top;
      mediaEl.style.width = columnWidth + "px";
      mediaEl.style.height = columnHeight + "px";
      mediaEl.style.maxWidth = "none";
      mediaEl.style.left = -(rect.left - firstCardRect.left) + "px";
      mediaEl.style.top = -(rect.top - firstCardRect.top) + "px";
      mediaEl.style.transform = "none";
      const targets = getTargetElements();
      let maskContent = `<rect width="100%" height="100%" fill="white"/>`;
      targets.forEach((target) => {
        const targetRect = target.getBoundingClientRect();
        const x = targetRect.left - rect.left;
        const y = targetRect.top - rect.top;
        const width = targetRect.width;
        const height = targetRect.height;
        const style = window.getComputedStyle(target);
        let br = parseInt(style.borderRadius) || 0;
        if (style.borderRadius && style.borderRadius.includes("%")) {
          br = width / 2;
        }
        maskContent += `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${br}" ry="${br}" fill="black"/>`;
      });
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}"><mask id="m">${maskContent}</mask><rect width="100%" height="100%" fill="black" mask="url(#m)"/></svg>`;
      const encodedSvg = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}")`;
      container.style.webkitMaskImage = encodedSvg;
      container.style.maskImage = encodedSvg;
      container.style.webkitMaskSize = "100% 100%";
      container.style.maskSize = "100% 100%";
    };
    let resizeObserver = null;
    if (window.ResizeObserver && cardParent) {
      resizeObserver = new ResizeObserver(() => {
        if (isPlaying) {
          setTimeout(updateMask, 10);
        }
      });
      resizeObserver.observe(cardParent);
    }
    const startEffect = () => {
      if (document.body.getAttribute("data-active-tab") !== targetTab) {
        isPlaying = false;
        mediaEl.classList.remove("playing");
        if (!isSingleNative)
          mediaEl.src =
            "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
        return;
      }
      isPlaying = true;
      setTimeout(updateMask, 10);
      if (!isSingleNative) {
        mediaEl.src = urls[currentIndex];
      } else if (mediaEl.tagName === "VIDEO") {
        mediaEl.play().catch(() => {});
      }
      mediaEl.classList.add("playing");
      if (!isSingleNative) {
        currentTimeout = setTimeout(() => {
          mediaEl.classList.remove("playing");
          mediaEl.src =
            "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
          transitionTimeout = setTimeout(() => {
            currentIndex = (currentIndex + 1) % urls.length;
            startEffect();
          }, 3000);
        }, 5100);
      }
    };
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-tab-effect-visible") {
          const isVisible =
            document.body.getAttribute("data-tab-effect-visible") === "true";
          const activeTab = document.body.getAttribute("data-active-tab");
          if (isVisible && activeTab === targetTab) {
            container.classList.add("active");
            if (!isPlaying) {
              currentIndex = 0;
              startEffect();
            }
          } else {
            container.classList.remove("active");
            isPlaying = false;
            clearTimeout(currentTimeout);
            clearTimeout(transitionTimeout);
            mediaEl.classList.remove("playing");
            if (mediaEl.tagName === "VIDEO") mediaEl.pause();
            if (!isSingleNative)
              mediaEl.src =
                "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
          }
        }
      });
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-tab-effect-visible"],
    });
    if (
      document.body.getAttribute("data-tab-effect-visible") === "true" &&
      document.body.getAttribute("data-active-tab") === targetTab
    ) {
      container.classList.add("active");
      startEffect();
    }
  });
}
