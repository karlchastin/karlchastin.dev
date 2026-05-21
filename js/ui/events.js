import { $, $$ } from '../utils/dom.js';
import { formatTime } from '../utils/core.js';
import { profiles, emailAvatars, emailBios, GREEDY_LYRICS } from '../config.js';
import { startSyncing, stopSyncing, syncBackgrounds } from './animations.js';
import { isAnimating, currentIndex } from './tabs.js';

export function setupUIEvents() {
    Object.values(emailAvatars).forEach(src => {
        const img = new Image();
        img.src = src;
    });

    if (!$('dynamic-injected-css')) {
        const style = document.createElement('style');
        style.id = 'dynamic-injected-css';
        style.textContent = `
            /* Smoothly hide cards by mimicking the native .hide-card class for zero-flicker animations */
            body.ig-deactivated[data-active-tab="instagram"] #card-2-container,
            body.ig-deactivated[data-active-tab="instagram"] #card-3-container,
            body.ig-deactivated[data-active-tab="instagram"] #card-4-container,
            body.fb-deactivated[data-active-tab="facebook"] #card-2-container,
            body.fb-deactivated[data-active-tab="facebook"] #card-3-container,
            body.fb-deactivated[data-active-tab="facebook"] #card-4-container {
                opacity: 0 !important;
                transform: scale(0.95) translateY(-10px) !important;
                height: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                margin-top: -15px !important;
                margin-bottom: 0 !important;
                border-width: 0 !important;
                overflow: clip !important;
                overflow-clip-margin: 150px !important;
                pointer-events: none !important;
            }
            
            body.ig-deactivated #loc-instagram,
            body.fb-deactivated #loc-facebook {
                display: none !important;
            }
            
            /* Smooth Transition for Email Warning */
            #email-night-warning {
                transition: opacity 0.5s ease, max-height 0.5s ease, margin-bottom 0.5s ease !important;
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                margin-bottom: 0;
            }
            #email-night-warning.is-visible {
                max-height: 150px;
                opacity: 1;
                margin-bottom: 15px;
            }

            /* --- CUSTOM DEBUGGER UI STYLES --- */
            .dbg-toggle {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
                flex-shrink: 0;
            }
            .dbg-toggle input { opacity: 0; width: 0; height: 0; }
            .dbg-slider {
                position: absolute; cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: rgba(0,0,0,0.5);
                transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .dbg-slider:before {
                position: absolute; content: "";
                height: 16px; width: 16px;
                left: 3px; bottom: 3px;
                background-color: #aaa;
                transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 50%;
            }
            .dbg-toggle input:checked + .dbg-slider {
                background-color: rgba(255,0,0,0.25);
                border-color: rgba(255,0,0,0.5);
            }
            .dbg-toggle input:checked + .dbg-slider:before {
                transform: translateX(20px);
                background-color: #fff;
                box-shadow: 0 0 8px rgba(255,0,0,0.8);
            }
            
            .dbg-select {
                appearance: none;
                -webkit-appearance: none;
                width: 100%;
                background: rgba(0,0,0,0.4) url('data:image/svg+xml;utf8,<svg fill="%23aaaaaa" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>') no-repeat right 10px center;
                color: #fff;
                border: 1px solid rgba(255,255,255,0.1);
                padding: 12px 14px;
                border-radius: 12px;
                font-family: 'Satoshi', sans-serif;
                font-size: 13px;
                font-weight: 700;
                outline: none;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .dbg-select:hover, .dbg-select:focus {
                border-color: rgba(255,255,255,0.25);
                background-color: rgba(0,0,0,0.6);
            }
            .dbg-select option {
                background: #111;
                color: #fff;
                font-weight: 600;
            }

            .dbg-btn {
                width: 100%;
                background: rgba(255,0,0,0.15);
                color: #fff;
                border: 1px solid rgba(255,0,0,0.4);
                padding: 12px;
                border-radius: 12px;
                font-family: 'Satoshi', sans-serif;
                font-weight: 800;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .dbg-btn:hover {
                background: rgba(255,0,0,0.3);
                border-color: rgba(255,0,0,0.7);
                box-shadow: 0 0 15px rgba(255,0,0,0.3);
                transform: scale(1.03);
            }
        `;
        document.head.appendChild(style);
    }

    function updateEmailWarningState(forceMode = 'auto') {
        const warningEl = $('email-night-warning');
        if (!warningEl) return;

        const now = new Date();
        let phtHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false }).format(now));
        if (phtHour === 24) phtHour = 0;

        let isNight = (phtHour >= 22 || phtHour < 7);
        if (forceMode === 'night') isNight = true;
        if (forceMode === 'morning') isNight = true;
        if (forceMode === 'off') isNight = false;

        const isCurrentlyVisible = warningEl.classList.contains('is-visible');
        if (forceMode === 'auto') {
            if (isNight && isCurrentlyVisible) return; 
            if (!isNight && !isCurrentlyVisible) return;
        }

        if (isNight || localStorage.getItem('testEmailWarning') === 'true') {
            const phtOffset = 8 * 60 * 60 * 1000;
            const nowPHT = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + phtOffset);
            const targetPHT = new Date(nowPHT);
            targetPHT.setHours(10, 0, 0, 0); 
            if (nowPHT.getHours() >= 22) targetPHT.setDate(targetPHT.getDate() + 1); 
            
            const targetLocalTime = new Date(targetPHT.getTime() - phtOffset - (new Date().getTimezoneOffset() * 60000));
            
            let timeText = "It is currently late at night.";
            if ((phtHour >= 0 && phtHour < 7) || forceMode === 'morning') {
                timeText = "It is currently early in the morning.";
            }
            if (forceMode === 'night') timeText = "It is currently late at night.";

            warningEl.innerHTML = `<div style="background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); color: #ffa500; padding: 12px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span>${timeText} Expect replies as early as <strong>${targetLocalTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</strong> in your local time.</span></div>`;
            
            warningEl.style.display = 'block';
            void warningEl.offsetWidth;
            warningEl.classList.add('is-visible');
        } else {
            warningEl.classList.remove('is-visible');
            setTimeout(() => {
                if (!warningEl.classList.contains('is-visible')) {
                    warningEl.style.display = 'none';
                    warningEl.innerHTML = '';
                }
            }, 500); 
        }
    }
    
    updateEmailWarningState();
    setInterval(() => updateEmailWarningState('auto'), 60000);
    document.addEventListener('debug-email-warning', (e) => updateEmailWarningState(e.detail.mode));

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const gl = $('glass-left'), ga = $('glass-active'), gr = $('glass-right');
            
            if (gl) gl.style.transition = 'none';
            if (ga) ga.style.transition = 'none';
            if (gr) gr.style.transition = 'none';
            
            requestAnimationFrame(() => {
                syncBackgrounds(currentIndex);
                
                if (gl) gl.style.transition = '';
                if (ga) ga.style.transition = '';
                if (gr) gr.style.transition = '';
                
                if (isAnimating) startSyncing(() => currentIndex);
            });
        } else {
            stopSyncing();
        }
    });

    const locHome = $('loc-home'), locationText = $('location-text');
    if(locHome && locationText) {
        locHome.addEventListener('mouseenter', () => { locationText.textContent = "Bacoor, Cavite, Philippines"; locationText.style.color = "#ffffff"; locationText.classList.remove('always-glitch'); });
        locHome.addEventListener('mouseleave', () => { locationText.textContent = "END OF TIME?"; locationText.style.color = ""; locationText.classList.add('always-glitch'); locationText.setAttribute('data-glitch', "END OF TIME?"); });
    }

    const tooltipEl = $('custom-tooltip');
    if(tooltipEl) {
        tooltipEl.style.left = '0px';
        tooltipEl.style.top = '0px';

        let tooltipRAF;
        let isTooltipVisible = false;

        document.addEventListener('mousemove', (e) => {
            const target = e.target.closest('[data-tooltip]');
            
            if (target) {
                if (!isTooltipVisible || tooltipEl.innerHTML !== target.getAttribute('data-tooltip')) {
                    tooltipEl.innerHTML = target.getAttribute('data-tooltip');
                    tooltipEl.classList.add('show');
                    isTooltipVisible = true;
                }
                
                let x = e.clientX + 15;
                let y = e.clientY + 15;
                
                if (!tooltipRAF) {
                    tooltipRAF = requestAnimationFrame(() => {
                        const tooltipRect = tooltipEl.getBoundingClientRect();
                        
                        if (x + tooltipRect.width > window.innerWidth - 10) x = e.clientX - tooltipRect.width - 15;
                        if (y + tooltipRect.height > window.innerHeight - 10) y = e.clientY - tooltipRect.height - 15;
                        
                        tooltipEl.style.transform = `translate(${x}px, ${y}px)`;
                        tooltipRAF = null;
                    });
                }
            } else if (isTooltipVisible) {
                tooltipEl.classList.remove('show');
                isTooltipVisible = false;
                if (tooltipRAF) {
                    cancelAnimationFrame(tooltipRAF);
                    tooltipRAF = null;
                }
            }
        }, { passive: true });
    }

    let hoverAnimTimeout;
    const updateProfileView = (avatar, username, bio) => {
        const usernameEl = $('profile-username');
        const bioEl = $('profile-bio');
        const avatarImgEl = $('avatar-img');

        const currentSrc = avatarImgEl.getAttribute('src');
        const isSameAvatar = currentSrc === avatar || avatarImgEl.src === avatar;

        usernameEl.style.opacity = '0';
        bioEl.style.opacity = '0';
        
        if (!isSameAvatar) {
            avatarImgEl.style.opacity = '0';
        }

        hoverAnimTimeout = setTimeout(() => {
            if (!isSameAvatar) {
                avatarImgEl.src = avatar;
            }
            usernameEl.textContent = username;
            bioEl.textContent = bio;

            usernameEl.style.opacity = '1';
            bioEl.style.opacity = '1';
            
            avatarImgEl.style.opacity = '1';
        }, 150);
    };

    $$('.email-btn').forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            const type = e.target.getAttribute('data-type');
            clearTimeout(hoverAnimTimeout);
            updateProfileView(emailAvatars[type], e.target.getAttribute('data-email'), emailBios[type]);
        });
        btn.addEventListener('mouseleave', () => {
            clearTimeout(hoverAnimTimeout);
            const defaultProfile = profiles[document.querySelector('.tab.active')?.getAttribute('data-tab') || 'home'];
            updateProfileView(defaultProfile.avatar, defaultProfile.username, defaultProfile.bio);
        });
    });

    const bgAudio = $('bg-audio'), durationEl = $('duration'), currentTimeEl = $('current-time'), progressFill = document.querySelector('.progress-fill');
    if(bgAudio) {
        const updateDuration = () => { 
            if(durationEl && !isNaN(bgAudio.duration)) durationEl.textContent = formatTime(bgAudio.duration); 
        };
        
        if (bgAudio.readyState >= 1) updateDuration();
        bgAudio.addEventListener('loadedmetadata', updateDuration);
        
        let audioFrame;
        let currentLyricIndex = 0;

        bgAudio.addEventListener('timeupdate', () => {
            cancelAnimationFrame(audioFrame);
            audioFrame = requestAnimationFrame(() => {
                if(currentTimeEl) currentTimeEl.textContent = formatTime(bgAudio.currentTime);
                if (progressFill && bgAudio.duration > 0) progressFill.style.width = `${(bgAudio.currentTime / bgAudio.duration) * 100}%`;

                const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab');
                if (activeTab === 'home') {
                    
                    while (currentLyricIndex < GREEDY_LYRICS.length - 1 && bgAudio.currentTime >= GREEDY_LYRICS[currentLyricIndex + 1].time) {
                        currentLyricIndex++;
                    }

                    while (currentLyricIndex > 0 && bgAudio.currentTime < GREEDY_LYRICS[currentLyricIndex].time) {
                        currentLyricIndex--;
                    }

                    const currentLyric = GREEDY_LYRICS[currentLyricIndex];
                    
                    if (currentLyric) {
                        const bioEl = $('profile-bio');
                        if (bioEl && bioEl.dataset.targetTime !== currentLyric.time.toString()) {
                            bioEl.dataset.targetTime = currentLyric.time.toString(); 
                            
                            bioEl.style.opacity = '0';
                            
                            setTimeout(() => {
                                bioEl.textContent = currentLyric.text;
                                bioEl.style.opacity = '1';
                            }, 100); 
                        }
                    }
                }
            });
        });
    }

    const deafenBtn = $('deafen-btn');
    let isDeafened = false;

    if (deafenBtn) {
        deafenBtn.addEventListener('click', () => {
            if (!bgAudio || !window.audioCtx || !window.lowpassFilter) return;

            isDeafened = !isDeafened;
            deafenBtn.classList.toggle('is-deafened', isDeafened);
            document.body.classList.toggle('is-deafened', isDeafened); 

            const newTooltipText = isDeafened ? "Undeafen" : "Deafen";
            deafenBtn.setAttribute('data-tooltip', newTooltipText);
            
            if (tooltipEl && tooltipEl.classList.contains('show')) {
                tooltipEl.innerHTML = newTooltipText;
            }

            const targetFreq = isDeafened ? 200 : 24000;
            window.lowpassFilter.frequency.cancelScheduledValues(window.audioCtx.currentTime);
            window.lowpassFilter.frequency.setValueAtTime(window.lowpassFilter.frequency.value, window.audioCtx.currentTime);
            window.lowpassFilter.frequency.exponentialRampToValueAtTime(targetFreq, window.audioCtx.currentTime + 0.8);
            
            if (window.bassFilter) {
                const targetBass = isDeafened ? 0 : 8; 
                window.bassFilter.gain.cancelScheduledValues(window.audioCtx.currentTime);
                window.bassFilter.gain.setValueAtTime(window.bassFilter.gain.value, window.audioCtx.currentTime);
                window.bassFilter.gain.linearRampToValueAtTime(targetBass, window.audioCtx.currentTime + 0.8);
            }

            if (window.trebleFilter) {
                const targetTreble = isDeafened ? 0 : 8; 
                window.trebleFilter.gain.cancelScheduledValues(window.audioCtx.currentTime);
                window.trebleFilter.gain.setValueAtTime(window.trebleFilter.gain.value, window.audioCtx.currentTime);
                window.trebleFilter.gain.linearRampToValueAtTime(targetTreble, window.audioCtx.currentTime + 0.8);
            }

            if (window.masterGain) {
                const targetVol = isDeafened ? 1.0 : 0.35; 
                
                window.masterGain.gain.cancelScheduledValues(window.audioCtx.currentTime);
                window.masterGain.gain.setValueAtTime(window.masterGain.gain.value, window.audioCtx.currentTime);
                window.masterGain.gain.linearRampToValueAtTime(targetVol, window.audioCtx.currentTime + 0.8);
            }
        });
    }

    const syncActiveTabAttr = (tabName) => {
        if (tabName) {
            document.body.setAttribute('data-active-tab', tabName);
        } else {
            const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab') || 'home';
            document.body.setAttribute('data-active-tab', activeTab);
        }
    };

    $$('.tab').forEach(t => t.addEventListener('click', (e) => {
        syncActiveTabAttr(e.currentTarget.getAttribute('data-tab'));
    }));
    
    syncActiveTabAttr();

    let debugSequence = ['d', 'e', 'b', 'u', 'g'];
    let currentDbgIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key.toLowerCase() === debugSequence[currentDbgIndex]) {
            currentDbgIndex++;
            
            const contentWrap = $('content');
            if (contentWrap) {
                contentWrap.classList.remove('debug-shake');
                void contentWrap.offsetWidth; 
                contentWrap.classList.add('debug-shake');
            }

            if (currentDbgIndex === debugSequence.length) {
                injectAndOpenDebugger();
                currentDbgIndex = 0; 
            }
        } else {
            currentDbgIndex = 0;
        }
    });

    function injectAndOpenDebugger() {
        let dbgUI = $('dev-debugger');
        
        if (!dbgUI) {
            dbgUI = document.createElement('div');
            dbgUI.id = 'dev-debugger';
            
            dbgUI.innerHTML = `
                <div class="debugger-wrapper" style="position: fixed; top: 20px; right: 20px; background: var(--panel-bg); border: 5px solid var(--panel-border); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); padding: 25px; border-radius: 25px; z-index: 9999999; color: #fff; font-family: 'Satoshi', sans-serif; box-shadow: 0 0 30px rgba(0,0,0,0.5); width: 280px; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: scale(0.95);">
                    <h3 style="color: var(--primary); margin-top: 0; margin-bottom: 20px; font-size: 18px; font-family: 'Onest', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> 
                        Debugger
                    </h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 700; font-size: 14px; color: #eee;">
                            <span>Instagram Deactivated</span>
                            <div class="dbg-toggle">
                                <input type="checkbox" id="dbg-ig-toggle">
                                <span class="dbg-slider"></span>
                            </div>
                        </label>
                        
                        <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 700; font-size: 14px; color: #eee;">
                            <span>Facebook Deactivated</span>
                            <div class="dbg-toggle">
                                <input type="checkbox" id="dbg-fb-toggle">
                                <span class="dbg-slider"></span>
                            </div>
                        </label>
                    </div>
                    
                    <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 20px 0;"></div>
                    
                    <p style="margin: 0 0 10px 0; font-size: 11px; color: #aaa; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Email Warning Override</p>
                    <select id="dbg-email-select" class="dbg-select">
                        <option value="auto">Auto (Live Time)</option>
                        <option value="off">Force Off</option>
                        <option value="morning">Force Morning</option>
                        <option value="night">Force Night</option>
                    </select>
                    
                    <button id="dbg-close-btn" class="dbg-btn" style="margin-top: 25px;">Close Debugger</button>
                </div>
            `;
            document.body.appendChild(dbgUI);

            $('dbg-ig-toggle').addEventListener('change', (e) => {
                document.dispatchEvent(new CustomEvent('toggle-ig-deactivation', { detail: { deactivated: e.target.checked } }));
            });
            
            $('dbg-fb-toggle').addEventListener('change', (e) => {
                document.dispatchEvent(new CustomEvent('toggle-fb-deactivation', { detail: { deactivated: e.target.checked } }));
            });

            $('dbg-email-select').addEventListener('change', (e) => {
                document.dispatchEvent(new CustomEvent('debug-email-warning', { detail: { mode: e.target.value } }));
            });

            $('dbg-close-btn').addEventListener('click', () => {
                const wrapper = dbgUI.querySelector('.debugger-wrapper');
                wrapper.style.opacity = '0';
                wrapper.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    dbgUI.style.display = 'none';
                }, 300);
            });
        }

        $('dbg-ig-toggle').checked = document.body.classList.contains('ig-deactivated');
        $('dbg-fb-toggle').checked = document.body.classList.contains('fb-deactivated');
        
        dbgUI.style.display = 'block';
        
        const wrapper = dbgUI.querySelector('.debugger-wrapper');
        void wrapper.offsetWidth; 
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'scale(1)';
    }
}