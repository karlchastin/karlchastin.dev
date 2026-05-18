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
    
    const P_ACT = 18, P_UNSEL = 18, GAP = 10; 
    const firstTab = tabs[0];
    const lastTab = tabs[tabs.length - 1];
    
    const activeLeft = activeTab.offsetLeft;
    const activeWidth = activeTab.offsetWidth;
    const activeRight = activeLeft + activeWidth;
    
    let gLeft = activeLeft - P_ACT;
    let gRight = activeRight + P_ACT;

    const shifts = new Array(tabs.length).fill(0);
    let activeShift = 0;

    if (currentIndex === 1) {
        const requiredLRight = firstTab.offsetLeft + firstTab.offsetWidth + P_UNSEL;
        const idealLRight = gLeft - GAP;
        if (idealLRight < requiredLRight) {
            activeShift = requiredLRight - idealLRight;
        }
    }

    if (currentIndex === tabs.length - 2) {
        const requiredRLeft = lastTab.offsetLeft - P_UNSEL;
        const idealRLeft = gRight + activeShift + GAP; 
        if (idealRLeft > requiredRLeft) {
            activeShift = requiredRLeft - (gRight + GAP);
        }
    }

    gLeft += activeShift;
    gRight += activeShift;
    shifts[currentIndex] = activeShift;

    if (glassLeft) {
        if (currentIndex === 0) {
            glassLeft.style.opacity = '0';
        } else {
            const idealLPanelRight = gLeft - GAP;
            const lastLeftTab = tabs[currentIndex - 1];
            const requiredMinRightEdge = lastLeftTab.offsetLeft + lastLeftTab.offsetWidth + P_UNSEL;

            if (idealLPanelRight < requiredMinRightEdge && currentIndex > 1) {
                const requiredSquish = requiredMinRightEdge - idealLPanelRight;
                for (let i = 1; i < currentIndex; i++) {
                    const ratio = i / (currentIndex - 1);
                    shifts[i] = -requiredSquish * ratio;
                }
            }

            const lPanelLeft = firstTab.offsetLeft - P_UNSEL; 
            glassLeft.style.opacity = '1';
            glassLeft.style.left = `${lPanelLeft}px`;
            glassLeft.style.width = `${idealLPanelRight - lPanelLeft}px`;
        }
    }

    if (glassRight) {
        if (currentIndex === 0 && tabs.length === 1 || currentIndex === tabs.length - 1) {
            glassRight.style.opacity = '0';
        } else {
            const idealRPanelLeft = gRight + GAP;
            const firstRightTab = tabs[currentIndex + 1];
            const requiredMaxLeftEdge = firstRightTab.offsetLeft - P_UNSEL;

            if (idealRPanelLeft > requiredMaxLeftEdge && currentIndex < tabs.length - 2) {
                const requiredSquish = idealRPanelLeft - requiredMaxLeftEdge;
                const numRightTabs = (tabs.length - 1) - currentIndex;
                for (let i = currentIndex + 1; i < tabs.length - 1; i++) {
                    const rightIndex = i - (currentIndex + 1); 
                    const ratio = 1 - (rightIndex / (numRightTabs - 1));
                    shifts[i] = requiredSquish * ratio;
                }
            }

            const rPanelRight = lastTab.offsetLeft + lastTab.offsetWidth + P_UNSEL; 
            glassRight.style.opacity = '1';
            glassRight.style.left = `${idealRPanelLeft}px`;
            glassRight.style.width = `${rPanelRight - idealRPanelLeft}px`;
        }
    }

    if (glassActive) {
        glassActive.style.left = `${gLeft}px`;
        glassActive.style.width = `${gRight - gLeft}px`;
    }

    tabs.forEach((t, i) => {
        t.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'; 
        t.style.translate = `${shifts[i]}px 0px`;
    });
}