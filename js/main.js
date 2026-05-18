import { injectIcons } from './ui/icons.js';
import { WORKER_URL, profiles } from './config.js';
import { setupTabs, swapData, isAnimating as isTabsAnimating } from './ui/tabs.js';
import { syncBackgrounds } from './ui/animations.js';
import { setupUIEvents } from './ui/events.js';
import { renderAllComponents } from './ui/components.js';
import { prefetchGitHubProfile, updateGitHubData } from './api/github.js';
import { updateSteamData } from './api/steam.js';
import { connectLanyard } from './api/discord.js';
import { loadInstagramData } from './api/instagram.js';
import { loadFacebookData } from './api/facebook.js';
import { updateDBDData, updateValorantData, updateApexData, fetchOverwatchLiveStats } from './api/games.js';

function preloadAssets() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingPct = document.getElementById('loading-percentage');
    const loadingBarFill = document.getElementById('loading-bar-fill'); 
    const enterOverlay = document.getElementById('enter-overlay');
    
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
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
    Object.values(profiles).forEach(p => { if (p.avatar) assetsToLoad.push(p.avatar); });
    assetsToLoad.push("https://ghchart.rshah.org/ff0000/karlchastin");
    document.querySelectorAll('img').forEach(img => { if (img.src) assetsToLoad.push(img.src); });

    const uniqueAssets = [...new Set(assetsToLoad)];
    let loadedAssets = 0;

    const updateTarget = () => {
        if (uniqueAssets.length > 0) {
            targetVal = Math.floor((loadedAssets / uniqueAssets.length) * 90);
        }
    };

    uniqueAssets.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loadedAssets++;
            updateTarget();
        };
        img.src = src;
    });

    const finishLoading = () => {
        isLoaded = true;
        targetVal = 100;
    };

    if (document.readyState === 'complete') {
        finishLoading();
    } else {
        window.addEventListener('load', finishLoading);
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
                
                loadingScreen.style.opacity = '0';
                loadingScreen.style.filter = 'blur(15px)';
                
                setTimeout(() => {
                    loadingScreen.remove(); 
                    
                    if (enterOverlay) {
                        enterOverlay.style.opacity = '1';
                        enterOverlay.style.filter = 'blur(0px)';
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
    
    const activeTabNode = document.querySelector('.tab.active');
    const activeTab = activeTabNode ? activeTabNode.getAttribute('data-tab') : 'home';
    if (activeTab !== targetTab) return;

    const show = !!isActiveGetter();
    const isVisible = window.getComputedStyle(card).display !== 'none' && !card.classList.contains('hide-card');
    if (show === isVisible) return; 

    if (typeof isGlobalEntrance !== 'undefined' && isGlobalEntrance) {
        if (show) {
            card.style.opacity = '';
            card.style.margin = '';
            card.style.padding = '';
            card.style.borderWidth = '';
            card.style.transform = '';
            
            card.style.display = 'block';
            card.classList.remove('hide-card');
            card.classList.add('staged-for-drop');
            card.style.height = 'auto';
        } else {
            card.style.display = 'none';
            card.classList.add('hide-card');
        }
        return;
    }

    if (typeof window.isTabsAnimating !== 'undefined' && window.isTabsAnimating) {
        setTimeout(() => refreshDynamicCard(cardId, targetTab, isActiveGetter), 100);
        return;
    }

    const smoothTransition = 'height 0.65s cubic-bezier(0.25, 1, 0.5, 1), margin 0.65s cubic-bezier(0.25, 1, 0.5, 1), padding 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';

    if (show) {
        card.style.opacity = '';
        card.style.margin = '';
        card.style.padding = '';
        card.style.borderWidth = '';
        card.style.transform = '';
        
        card.style.transition = 'none';
        card.style.display = 'block';
        card.classList.add('hide-card');
        card.style.height = '0px';
        
        card.style.height = 'auto';
        card.classList.remove('hide-card');
        card.style.overflow = 'visible';
        const targetHeight = card.offsetHeight;
        
        card.classList.add('hide-card');
        card.style.height = '0px';
        card.style.overflow = 'clip';
        card.style.overflowClipMargin = '150px';
        void card.offsetHeight; 
        
        card.style.transition = smoothTransition; 
        card.classList.remove('hide-card');
        card.style.height = targetHeight + 'px';
        
        setTimeout(() => {
            if (isActiveGetter()) {
                card.style.height = 'auto';
                card.style.overflow = 'visible';
                card.style.overflowClipMargin = '';
            }
        }, 650);
    } else {
        const currentHeight = card.offsetHeight;
        card.style.height = currentHeight + 'px';
        card.style.overflow = 'clip';
        card.style.overflowClipMargin = '150px';
        card.style.transition = 'none';
        
        void card.offsetHeight; 
        
        card.style.transition = smoothTransition;
        card.classList.add('hide-card');
        card.style.height = '0px';
        
        setTimeout(() => {
            if (!isActiveGetter()) {
                card.style.display = 'none';
                card.classList.remove('hide-card');
            }
        }, 650);
    }
}

window.refreshMusicCard = () => refreshDynamicCard('card-3-container', 'music', () => window.currentMusicActivities);
window.refreshDiscordCard = () => refreshDynamicCard('card-2-container', 'home', () => window.currentDiscordActivities);

let _musicActive = window.currentMusicActivities || false;
Object.defineProperty(window, 'currentMusicActivities', {
    get: () => _musicActive,
    set: (val) => {
        if (_musicActive !== val) {
            _musicActive = val;
            setTimeout(window.refreshMusicCard, 10); 
        }
    }
});

let _discordActive = window.currentDiscordActivities ?? true;
Object.defineProperty(window, 'currentDiscordActivities', {
    get: () => _discordActive,
    set: (val) => {
        if (_discordActive !== val) {
            _discordActive = val;
            setTimeout(window.refreshDiscordCard, 10); 
        }
    }
});

function attachGlobalHeightObservers() {
    document.querySelectorAll('.transition-container').forEach(container => {
        const card = container.closest('.card');
        if (!card) return;

        let isAnimatingHeight = false;
        let animTimeout;
        let debounceTimer;

        const checkAndAnimate = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (isGlobalEntrance || isTabsAnimating || card.classList.contains('hide-card') || window.getComputedStyle(card).display === 'none' || isAnimatingHeight) return;
                
                const oldHeight = card.offsetHeight;
                if (oldHeight === 0) return;
                
                const originalTransition = card.style.transition;
                
                card.style.transition = 'none';
                card.style.height = 'auto';
                const newHeight = card.offsetHeight;
                
                if (Math.abs(oldHeight - newHeight) > 2) {
                    isAnimatingHeight = true;
                    card.style.height = oldHeight + 'px';
                    void card.offsetHeight; 
                    
                    if (originalTransition && originalTransition !== 'none') {
                        card.style.transition = originalTransition.includes('height') 
                            ? originalTransition 
                            : originalTransition + ', height 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                    } else {
                        card.style.transition = ''; 
                    }
                    
                    card.style.height = newHeight + 'px';
                    
                    clearTimeout(animTimeout);
                    animTimeout = setTimeout(() => {
                        isAnimatingHeight = false;
                        if (card.style.height === newHeight + 'px') card.style.height = 'auto';
                    }, 400);
                } else {
                    card.style.height = oldHeight + 'px';
                    void card.offsetHeight;
                    card.style.transition = originalTransition;
                    card.style.height = 'auto';
                }
            }, 10);
        };

        const resizeObserver = new ResizeObserver(checkAndAnimate);
        resizeObserver.observe(container);
        
        const mutationObserver = new MutationObserver(checkAndAnimate);
        mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });
    });
}

function setupPreferencesTabs() {
    const prefTabs = document.querySelectorAll('.pref-tab');
    let isPrefAnimating = false;
    const delay = ms => new Promise(res => setTimeout(res, ms));

    prefTabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            if (isPrefAnimating || tab.classList.contains('active') || window.isAppAnimating()) return;
            isPrefAnimating = true;

            const originalIsAppAnimating = window.isAppAnimating;
            window.isAppAnimating = () => true; 

            const targetId = 'pref-' + tab.dataset.pref;
            const newContent = document.getElementById(targetId);
            const oldContent = document.querySelector('.pref-content.active');
            const oldTab = document.querySelector('.pref-tab.active');
            const card = document.getElementById('card-2-container');

            const currentHeight = card.offsetHeight;
            card.style.transition = 'none';
            card.style.height = currentHeight + 'px';
            card.style.overflow = 'clip';
            card.style.overflowClipMargin = '150px';
            void card.offsetHeight;

            if (oldContent) {
                oldContent.style.transition = 'opacity 0.15s ease';
                oldContent.style.opacity = '0';
            }
            await delay(150);

            if (oldTab) oldTab.classList.remove('active');
            await delay(500);

            if (oldContent) {
                oldContent.classList.remove('active');
                oldContent.style.transition = '';
                oldContent.style.opacity = '';
            }
            
            newContent.style.opacity = '0';
            newContent.classList.add('active');

            card.style.height = 'auto';
            card.style.overflow = 'visible';
            const targetHeight = card.offsetHeight;
            
            card.style.height = currentHeight + 'px';
            card.style.overflow = 'clip';
            card.style.overflowClipMargin = '150px';
            void card.offsetHeight;

            tab.classList.add('active');
            card.style.transition = 'height 0.65s cubic-bezier(0.25, 1, 0.5, 1), margin 0.65s cubic-bezier(0.25, 1, 0.5, 1), padding 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
            card.style.height = targetHeight + 'px';

            await delay(600);

            newContent.style.transition = 'opacity 0.3s ease';
            newContent.style.opacity = '1';
            await delay(300);

            card.style.transition = '';
            card.style.height = 'auto';
            card.style.overflow = 'visible';
            card.style.overflowClipMargin = '';
            newContent.style.transition = '';
            newContent.style.opacity = '';
            
            window.isAppAnimating = originalIsAppAnimating;
            isPrefAnimating = false;
        });
    });

    const subPrefTabs = document.querySelectorAll('.sub-pref-tab');
    let isSubPrefAnimating = false;

    subPrefTabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            if (isSubPrefAnimating || tab.classList.contains('active')) return;
            isSubPrefAnimating = true;

            const parent = tab.closest('.pref-content');
            const targetId = 'subpref-' + tab.dataset.subpref;
            const newContent = document.getElementById(targetId);
            const oldContent = parent.querySelector('.sub-pref-content.active');
            const oldTab = parent.querySelector('.sub-pref-tab.active');

            if (oldContent) {
                oldContent.style.transition = 'opacity 0.15s ease';
                oldContent.style.opacity = '0';
            }
            
            await delay(150);

            if (oldTab) oldTab.classList.remove('active');
            tab.classList.add('active');

            if (oldContent) {
                oldContent.classList.remove('active');
                oldContent.style.transition = '';
                oldContent.style.opacity = '';
            }

            newContent.style.opacity = '0';
            newContent.classList.add('active');

            void newContent.offsetWidth;

            newContent.style.transition = 'opacity 0.25s ease';
            newContent.style.opacity = '1';

            await delay(250);

            newContent.style.transition = '';
            newContent.style.opacity = '';

            isSubPrefAnimating = false;
        });
    });
}

try {
    injectIcons(); 
    preloadAssets();
    renderAllComponents(); 
    setupTabs();
    setupUIEvents();
    setupPreferencesTabs();
    attachGlobalHeightObservers();
    loadFacebookData();
} catch (e) {
    console.error("UI Initialization Error:", e);
}

const enterBtn = document.getElementById('enter-btn');
const enterOverlay = document.getElementById('enter-overlay');
const mainContent = document.getElementById('content');
const bgAudio = document.getElementById('bg-audio');

let hasEntered = false; 

if (enterBtn) {
    enterBtn.addEventListener('click', () => {
        if (hasEntered) return; 
        hasEntered = true;

        enterBtn.style.opacity = '0';
        enterBtn.style.pointerEvents = 'none';
        enterBtn.disabled = true;

        if (bgAudio) bgAudio.load();
        const sfxAudio = document.getElementById('sfx-audio');
        if (sfxAudio) sfxAudio.load();

        if (bgAudio && !window.audioCtx) {
            try {
                window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                window.audioSource = window.audioCtx.createMediaElementSource(bgAudio);
                window.lowpassFilter = window.audioCtx.createBiquadFilter();
                
                window.lowpassFilter.type = 'lowpass';
                window.lowpassFilter.frequency.value = 350; 
                
                window.audioSource.connect(window.lowpassFilter);
                window.lowpassFilter.connect(window.audioCtx.destination);
            } catch (e) {
                console.warn("Audio routing error:", e);
            }
        } else if (window.lowpassFilter) {
            window.lowpassFilter.frequency.value = 350; 
        }

        if (window.audioCtx && window.audioCtx.state === 'suspended') {
            window.audioCtx.resume();
        }

        setTimeout(() => {
            if (bgAudio) { 
                bgAudio.volume = 0.45; 
                bgAudio.currentTime = 0;
                bgAudio.play().catch(() => {}); 
            }

            const sfxAudio = document.getElementById('sfx-audio');
            if (sfxAudio) { 
                sfxAudio.volume = 0.6; 
                sfxAudio.play().catch(() => {}); 
            }

            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100vw';
            flash.style.height = '100vh';
            flash.style.backgroundColor = '#fff';
            flash.style.zIndex = '99999';
            flash.style.pointerEvents = 'none';
            document.body.appendChild(flash);
            
            flash.animate([
                { opacity: 1, offset: 0 },
                { opacity: 0, offset: 1 }
            ], { duration: 800, easing: 'ease-out' }).onfinish = () => flash.remove();

            if (enterOverlay) {
                enterOverlay.style.pointerEvents = 'none'; 
                enterOverlay.style.transition = 'opacity 1.5s ease-out'; 
                void enterOverlay.offsetWidth;
                enterOverlay.style.opacity = '0';
            }

            if (mainContent) {
                mainContent.classList.remove('hidden'); 
                void mainContent.offsetWidth;
                
                const animTargets = [
                    ...document.querySelectorAll('.glass-panel'),
                    ...document.querySelectorAll('.tab'),
                    ...document.querySelectorAll('.card')
                ];
                
                animTargets.forEach(el => el.classList.add('staged-for-drop'));
                
                if (typeof syncBackgrounds === 'function') syncBackgrounds(0); 
            }
        }, 150);
        
        setTimeout(() => { 
            
            if (window.lowpassFilter && window.audioCtx) {
                window.lowpassFilter.frequency.setTargetAtTime(24000, window.audioCtx.currentTime, 0.05);
            }

            if (enterOverlay) enterOverlay.style.display = 'none';

            if (!window.location.hash) {
                window.history.replaceState(null, null, '#home');
            }
            
            if (mainContent) {
                const animTargets = [
                    ...document.querySelectorAll('.glass-panel'),
                    ...document.querySelectorAll('.tab'),
                    ...document.querySelectorAll('.card')
                ];
                
                animTargets.forEach(el => el.classList.add('is-dropping'));
                
                void mainContent.offsetWidth;
                
                animTargets.forEach(el => el.classList.remove('staged-for-drop'));

                setTimeout(() => {
                    animTargets.forEach(el => el.classList.remove('is-dropping'));
                    if (typeof isGlobalEntrance !== 'undefined') isGlobalEntrance = false; 
                }, 800);
            } else {
                if (typeof isGlobalEntrance !== 'undefined') isGlobalEntrance = false; 
            }
        }, 4500); 
    });
} else {
    if (typeof isGlobalEntrance !== 'undefined') isGlobalEntrance = false; 
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
    fetchOverwatchLiveStats('https://overwatch.blizzard.com/en-us/career/d156b69ebd3ccaffbfa9%7Cf27cbe61960ce0f2f4d04c2ebe83a618/');

    swapData('home'); 
    
    const activeLayout = profiles['home'].layout;
    const targetCards = activeLayout.showCards || [];
    document.querySelectorAll('.card').forEach(card => {
        if (card.id === 'main-profile-card' || targetCards.includes(card.id)) {
            card.style.display = 'block';
            card.classList.remove('hide-card');
        } else {
            card.style.display = 'none';
            card.classList.add('hide-card');
        }
    });
} catch (e) {
    console.error("Service Initialization Error:", e);
}

setInterval(() => {
    if (document.hidden) return;
    const timeEl = document.getElementById('live-time-text');
    const locTime = document.getElementById('loc-time');
    if (timeEl && locTime && window.getComputedStyle(locTime).display !== 'none') {
        const gmt8 = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 8));
        timeEl.textContent = `${gmt8.toLocaleTimeString('en-US', { hour12: true })} (GMT+8:00)`;
    }
}, 1000);

setInterval(() => {
    if (document.hidden) return;
    const activeTabNode = document.querySelector('.tab.active');
    const activeTab = activeTabNode ? activeTabNode.getAttribute('data-tab') : null;
    if(activeTab === 'steam') {
        fetch(`${WORKER_URL}?route=status`)
            .then(res => res.json())
            .then(data => {
                if (!data.error && data.stateMessage) {
                    const statusEl = document.getElementById('steam-live-status');
                    if (statusEl) { 
                        statusEl.innerHTML = data.stateMessage; 
                        statusEl.className = `steam-status ${data.onlineState}`; 
                    }
                }
            }).catch(() => {});
    }
}, 5000);

setInterval(() => {
    if (document.hidden) return;
    const activeTabNode = document.querySelector('.tab.active');
    const activeTab = activeTabNode ? activeTabNode.getAttribute('data-tab') : 'home';
    const activeLayout = profiles[activeTab]?.layout || profiles.home.layout;
    
    if (activeLayout.showGithubStats) updateGitHubData();
    if (activeLayout.showSteamExtra) updateSteamData();
}, 60000);

const initialHash = window.location.hash.substring(1);
if (initialHash) {
    const targetTab = document.querySelector(`.tab[data-tab="${initialHash}"]`);
    if (targetTab) {
        targetTab.click();
    }
}