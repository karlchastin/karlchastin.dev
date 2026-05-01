let syncAnimFrame = null;
const cachedEls = { tabs: null, glassActive: null, glassLeft: null, glassRight: null };

const initCache = () => {
    if (!cachedEls.tabs) {
        cachedEls.tabs = document.querySelectorAll('.tab');
        cachedEls.glassActive = document.getElementById('glass-active');
        cachedEls.glassLeft = document.getElementById('glass-left');
        cachedEls.glassRight = document.getElementById('glass-right');
    }
};

export function startSyncing(getIndexFn) {
    initCache();
    if (!syncAnimFrame) {
        const loop = () => {
            if (document.hidden) { syncAnimFrame = null; return; }
            syncBackgrounds(getIndexFn());
            syncAnimFrame = requestAnimationFrame(loop);
        };
        loop();
    }
}

export function stopSyncing() {
    if (syncAnimFrame) {
        cancelAnimationFrame(syncAnimFrame);
        syncAnimFrame = null;
    }
}

export function syncBackgrounds(currentIndex = 0) {
    initCache();
    const { tabs, glassActive, glassLeft, glassRight } = cachedEls;
    const activeTab = tabs[currentIndex];
    if (!activeTab) return;
    
    const P_ACT = 18, P_UNSEL_OUTER = 18, P_UNSEL_INNER = 18; 
    const activeLeft = activeTab.offsetLeft;
    const activeWidth = activeTab.offsetWidth;
    const firstTab = tabs[0];
    const firstLeft = firstTab.offsetLeft;
    
    const newActiveLeft = `${activeLeft - P_ACT}px`;
    const newActiveWidth = `${activeWidth + (P_ACT * 2)}px`;

    if (glassActive && glassActive.style.left !== newActiveLeft) glassActive.style.left = newActiveLeft;
    if (glassActive && glassActive.style.width !== newActiveWidth) glassActive.style.width = newActiveWidth;

    if (glassLeft) {
        if (currentIndex === 0) {
            if (glassLeft.style.opacity !== '0') glassLeft.style.opacity = '0';
        } else {
            const lastLeftTab = tabs[currentIndex - 1];
            const newLeftWidth = `${(lastLeftTab.offsetLeft + lastLeftTab.offsetWidth + P_UNSEL_INNER) - (firstLeft - P_UNSEL_OUTER)}px`;
            const newLeftLeft = `${firstLeft - P_UNSEL_OUTER}px`;
            if (glassLeft.style.opacity !== '1') glassLeft.style.opacity = '1';
            if (glassLeft.style.left !== newLeftLeft) glassLeft.style.left = newLeftLeft;
            if (glassLeft.style.width !== newLeftWidth) glassLeft.style.width = newLeftWidth;
        }
    }

    if (glassRight) {
        if (currentIndex === 0 && tabs.length === 1 || currentIndex === tabs.length - 1) {
            if (glassRight.style.opacity !== '0') glassRight.style.opacity = '0';
        } else {
            const firstRightTab = tabs[currentIndex + 1];
            const lastTab = tabs[tabs.length - 1];
            const newRightWidth = `${(lastTab.offsetLeft + lastTab.offsetWidth + P_UNSEL_OUTER) - (firstRightTab.offsetLeft - P_UNSEL_INNER)}px`;
            const newRightLeft = `${firstRightTab.offsetLeft - P_UNSEL_INNER}px`;
            if (glassRight.style.opacity !== '1') glassRight.style.opacity = '1';
            if (glassRight.style.left !== newRightLeft) glassRight.style.left = newRightLeft;
            if (glassRight.style.width !== newRightWidth) glassRight.style.width = newRightWidth;
        }
    }
}