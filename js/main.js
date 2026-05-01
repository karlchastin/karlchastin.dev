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
    Object.values(profiles).forEach(p => {
        if (p.avatar) {
            const img = new Image();
            img.src = p.avatar;
        }
    });
    const ghChart = new Image();
    ghChart.src = "https://ghchart.rshah.org/ff0000/karlchastin";
}

let isGlobalEntrance = true; 
window.isAppAnimating = () => isTabsAnimating;

function refreshDynamicCard(cardId, targetTab, isActiveGetter) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab');
    if (activeTab !== targetTab) return;

    const show = !!isActiveGetter();
    const isVisible = window.getComputedStyle(card).display !== 'none' && !card.classList.contains('hide-card');
    if (show === isVisible) return; 

    if (show) {
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
        
        card.style.transition = ''; 
        card.classList.remove('hide-card');
        card.style.height = targetHeight + 'px';
        
        setTimeout(() => {
            if (isActiveGetter()) {
                card.style.height = 'auto';
                card.style.overflow = 'visible';
                card.style.overflowClipMargin = '';
            }
        }, 450);
    } else {
        const currentHeight = card.offsetHeight;
        card.style.height = currentHeight + 'px';
        card.style.overflow = 'clip';
        card.style.overflowClipMargin = '150px';
        card.style.transition = 'none';
        
        void card.offsetHeight; 
        
        card.style.transition = '';
        card.classList.add('hide-card');
        card.style.height = '0px';
        
        setTimeout(() => {
            if (!isActiveGetter()) {
                card.style.display = 'none';
                card.classList.remove('hide-card');
            }
        }, 450);
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
    const prefContents = document.querySelectorAll('.pref-content');

    prefTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            prefTabs.forEach(t => t.classList.remove('active'));
            prefContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = document.getElementById('pref-' + tab.dataset.pref);
            if (target) {
                target.classList.add('active');
                const card = target.closest('.card');
                if (card && !isTabsAnimating) {
                    card.style.height = 'auto';
                }
            }
        });
    });

    const subPrefTabs = document.querySelectorAll('.sub-pref-tab');
    const subPrefContents = document.querySelectorAll('.sub-pref-content');

    subPrefTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const parent = tab.closest('.pref-content');
            parent.querySelectorAll('.sub-pref-tab').forEach(t => t.classList.remove('active'));
            parent.querySelectorAll('.sub-pref-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = document.getElementById('subpref-' + tab.dataset.subpref);
            if (target) {
                target.classList.add('active');
                const card = target.closest('.card');
                if (card && !isTabsAnimating) {
                    card.style.height = 'auto';
                }
            }
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

let audioCtx, sourceNode, biquadFilter;

if (enterBtn) {
    enterBtn.addEventListener('click', () => {
        
        if (bgAudio && !audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            sourceNode = audioCtx.createMediaElementSource(bgAudio);
            biquadFilter = audioCtx.createBiquadFilter();

            biquadFilter.type = "lowpass";
            biquadFilter.frequency.value = 300; 

            sourceNode.connect(biquadFilter);
            biquadFilter.connect(audioCtx.destination);
        }
        
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        enterBtn.style.opacity = '0';

        setTimeout(() => {
            if (bgAudio) { 
                bgAudio.volume = 0.45; 
                bgAudio.currentTime = 13.035;
                bgAudio.play().catch(() => {}); 
                
                if (audioCtx && biquadFilter) {
                    biquadFilter.frequency.setValueAtTime(300, audioCtx.currentTime);
                    biquadFilter.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 6.35);
                }
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
                enterOverlay.style.transition = 'opacity 6s ease-in-out'; 
                void enterOverlay.offsetWidth;
                enterOverlay.style.opacity = '0';
            }
        }, 150);
        
        setTimeout(() => { 
            if (audioCtx && biquadFilter) {
                biquadFilter.frequency.cancelScheduledValues(audioCtx.currentTime);
                biquadFilter.frequency.setValueAtTime(1800, audioCtx.currentTime);
                biquadFilter.frequency.exponentialRampToValueAtTime(22050, audioCtx.currentTime + 0.5);
            }

            if (enterOverlay) enterOverlay.style.display = 'none';
            
            if (mainContent) {
                mainContent.classList.remove('hidden');
                
                const animTargets = [
                    ...document.querySelectorAll('.glass-panel'), 
                    ...document.querySelectorAll('.tab'), 
                    ...document.querySelectorAll('.card')
                ];
                
                animTargets.forEach(el => {
                    if(el) {
                        el.style.opacity = '0';
                        el.style.transform = 'scale(0.96) translateY(20px)'; 
                        el.style.transition = 'none';
                    }
                });
                
                void mainContent.offsetWidth; 
                
                animTargets.forEach(el => {
                    if(el) {
                        el.style.transition = `opacity 0.4s ease, transform 0.65s cubic-bezier(0.25, 1, 0.5, 1), height 0.65s cubic-bezier(0.25, 1, 0.5, 1)`;
                        el.style.opacity = '1';
                        el.style.transform = 'scale(1) translateY(0)';
                    }
                });

                setTimeout(() => {
                    animTargets.forEach(el => {
                        if (el) {
                            el.style.transition = ''; 
                            el.style.transform = '';
                            
                            if (!el.classList.contains('glass-panel') || el.id === 'glass-active') {
                                el.style.opacity = ''; 
                            }
                        }
                    });
                    isGlobalEntrance = false; 
                }, 800);
            } else {
                isGlobalEntrance = false;
            }
            syncBackgrounds(0); 
        }, 6500); 
    });
} else {
    isGlobalEntrance = false;
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