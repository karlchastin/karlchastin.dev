export function initBgEffects() {
  const originalContainers = document.querySelectorAll(".card-bg-effect");
  const uniqueTabs = new Set();
  
  
  originalContainers.forEach(c => uniqueTabs.add(c.getAttribute("data-bg-tab")));
  
  if (uniqueTabs.size === 0) return;

  const mainContent = document.querySelector(".main-content") || document.body;
  
  
  const masterContainers = {};

  uniqueTabs.forEach(targetTab => {
    
    const firstContainer = document.querySelector(`.card-bg-effect[data-bg-tab="${targetTab}"]`);
    if (!firstContainer) return;
    
    const allImages = firstContainer.querySelectorAll(".bg-effect-video");
    if (allImages.length === 0) return;
    
    
    const masterContainer = document.createElement("div");
    masterContainer.className = "master-card-bg-effect";
    masterContainer.setAttribute("data-bg-tab", targetTab);
    masterContainer.style.position = "absolute";
    masterContainer.style.top = "0";
    masterContainer.style.left = "0";
    masterContainer.style.width = "100%";
    masterContainer.style.height = "100%";
    masterContainer.style.pointerEvents = "none";
    masterContainer.style.zIndex = "-1";
    masterContainer.style.opacity = "0";

    const bgLayer = document.createElement("div");
    bgLayer.className = "master-bg-layer";
    bgLayer.style.position = "absolute";
    bgLayer.style.top = "0";
    bgLayer.style.left = "0";
    bgLayer.style.width = "100%";
    bgLayer.style.height = "100%";

    const mediaWrapper = document.createElement("div");
    mediaWrapper.style.position = "absolute";
    mediaWrapper.style.top = "0";
    mediaWrapper.style.left = "0";
    mediaWrapper.style.width = "100%";
    mediaWrapper.style.height = "100%";
    mediaWrapper.style.opacity = "0";
    mediaWrapper.style.transition = "opacity 0.5s ease";
    
    
    if (mainContent !== document.body) {
      if (window.getComputedStyle(mainContent).position === "static") {
        mainContent.style.position = "relative";
      }
    }
    mainContent.insertBefore(masterContainer, mainContent.firstChild);
    
    let currentIndex = 0;
    let isPlaying = false;
    let currentTimeout = null;
    let transitionTimeout = null;
    let stopTimeout = null;
    
    const urls = Array.from(allImages).map(img => img.getAttribute("data-src") || img.src);
    const isSingleNative = allImages.length === 1;
    
    const mediaEl = allImages[0].cloneNode(true);
    mediaEl.style.position = "absolute";
    mediaEl.style.objectFit = "cover";
    mediaEl.style.objectPosition = "top center";
    mediaEl.style.width = "100%";
    mediaEl.style.height = "100%";
    mediaEl.style.top = "0";
    mediaEl.style.left = "0";
    
    mediaWrapper.appendChild(mediaEl);
    masterContainer.appendChild(bgLayer);
    masterContainer.appendChild(mediaWrapper);
    masterContainers[targetTab] = masterContainer;

    const getTargetElements = () => {
      const cards = Array.from(document.querySelectorAll(".card")).filter(
        (c) => window.getComputedStyle(c).display !== "none"
      );
      
      let targets = [];
      cards.forEach(card => {
        targets.push(...Array.from(card.querySelectorAll(".bg-effect-exclude")).filter((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== "none" && style.opacity !== "0" && style.visibility !== "hidden";
        }));
      });
      return targets;
    };

    const updateMask = () => {
      if (!isPlaying) return;
      const rect = masterContainer.getBoundingClientRect();
      const cards = Array.from(document.querySelectorAll(".card")).filter(
        (c) => window.getComputedStyle(c).display !== "none"
      );
      if (cards.length === 0) return;
      
      const firstCardRect = cards[0].getBoundingClientRect();
      const lastCardRect = cards[cards.length - 1].getBoundingClientRect();
      const columnWidth = firstCardRect.width;
      const columnHeight = lastCardRect.bottom - firstCardRect.top;
      
      
      masterContainer.style.width = columnWidth + "px";
      masterContainer.style.height = columnHeight + "px";
      
      
      
      
      const mainContentRect = mainContent.getBoundingClientRect();
      masterContainer.style.top = (firstCardRect.top - mainContentRect.top) + "px";
      masterContainer.style.left = (firstCardRect.left - mainContentRect.left) + "px";

      
      const updatedRect = masterContainer.getBoundingClientRect();

      function getRoundedRectPath(x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        if (r <= 0) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
        return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
      }

      let pathString = "";
      
      
      bgLayer.innerHTML = "";
      
      
      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const x = cardRect.left - updatedRect.left;
        const y = cardRect.top - updatedRect.top;
        const width = cardRect.width;
        const height = cardRect.height;
        const style = window.getComputedStyle(card);
        let br = parseInt(style.borderRadius) || 20; 
        
        pathString += getRoundedRectPath(x, y, width, height, br) + " ";
        
        
        const frostyDiv = document.createElement("div");
        frostyDiv.className = "master-frosty-div";
        frostyDiv.style.position = "absolute";
        frostyDiv.style.left = x + "px";
        frostyDiv.style.top = y + "px";
        frostyDiv.style.width = width + "px";
        frostyDiv.style.height = height + "px";
        frostyDiv.style.borderRadius = br + "px";
        bgLayer.appendChild(frostyDiv);
      });

      
      const targets = getTargetElements();
      targets.forEach((target) => {
        const targetRect = target.getBoundingClientRect();
        const x = targetRect.left - updatedRect.left;
        const y = targetRect.top - updatedRect.top;
        const width = targetRect.width;
        const height = targetRect.height;
        const style = window.getComputedStyle(target);
        let br = parseInt(style.borderRadius) || 0;
        if (style.borderRadius && style.borderRadius.includes("%")) {
          br = width / 2;
        }
        
        pathString += getRoundedRectPath(x, y, width, height, br) + " ";
      });

      mediaWrapper.style.clipPath = `path(evenodd, "${pathString.trim()}")`;
      mediaWrapper.style.webkitClipPath = `path(evenodd, "${pathString.trim()}")`;
      
      
      mediaWrapper.style.maskImage = "";
      mediaWrapper.style.webkitMaskImage = "";
    };

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (isPlaying) {
          setTimeout(updateMask, 10);
        }
      });
      resizeObserver.observe(mainContent);
    }

    const stopEffect = () => {
      mediaWrapper.style.opacity = "0";
      isPlaying = false;
      clearTimeout(currentTimeout);
      clearTimeout(transitionTimeout);
      
      stopTimeout = setTimeout(() => {
        if (isPlaying) return;
        masterContainer.style.opacity = "0";
        document.body.classList.remove(`master-effect-active-${targetTab}`);
        mediaEl.classList.remove("playing");
        if (mediaEl.tagName === "VIDEO") mediaEl.pause();
        if (!isSingleNative)
          mediaEl.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      }, 500);
    };

    const startEffect = () => {
      isPlaying = true;
      clearTimeout(stopTimeout);
      
      setTimeout(() => {
        if (!isPlaying) return;
        
        updateMask();
        
        masterContainer.style.opacity = "1";
        mediaWrapper.style.opacity = "1";
        document.body.classList.add(`master-effect-active-${targetTab}`);
        
        if (!isSingleNative) {
          mediaEl.src = urls[currentIndex];
        } else if (mediaEl.tagName === "VIDEO") {
          mediaEl.play().catch(() => {});
        }
        mediaEl.classList.add("playing");
        
        if (!isSingleNative) {
          currentTimeout = setTimeout(() => {
            mediaEl.classList.remove("playing");
            mediaEl.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
            transitionTimeout = setTimeout(() => {
              currentIndex = (currentIndex + 1) % urls.length;
              if (isPlaying) startEffect();
            }, 3000);
          }, 5100);
        }
      }, 50);
    };

    const checkStateAndPlay = () => {
      const isVisible = document.body.getAttribute("data-tab-effect-visible") === "true";
      const activeTab = document.body.getAttribute("data-active-tab");

      if (isVisible && activeTab === targetTab) {
        if (!isPlaying) {
          currentIndex = 0;
          startEffect();
        } else {
          updateMask();
        }
      } else {
        if (isPlaying) stopEffect();
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "data-tab-effect-visible" ||
          mutation.attributeName === "data-active-tab"
        ) {
          checkStateAndPlay();
        }
      });
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-tab-effect-visible", "data-active-tab"],
    });

    
    const cards = document.querySelectorAll(".card");
    const cardObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "style" || mutation.attributeName === "class") {
          checkStateAndPlay();
        }
      });
    });
    cards.forEach(card => cardObserver.observe(card, { attributes: true, attributeFilter: ["style", "class"] }));

    checkStateAndPlay();
  });

  
  originalContainers.forEach(c => c.remove());
}
