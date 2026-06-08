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
            body.ig-deactivated #loc-instagram,
            body.fb-deactivated #loc-facebook {
                display: none !important;
            }
            
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
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff !important;
                border-radius: 12px;
                font-family: 'Satoshi', sans-serif;
                font-weight: 800;
                font-size: 14px;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: 1px solid var(--primary-glow);
                box-shadow: 0 0 15px rgba(255,0,0,0.2);
                background-color: transparent !important;
                background-image: linear-gradient(to right, rgba(255,0,0,0.8) 50%, rgba(139,0,0,0.5) 50%);
                background-size: 205% 100%;
                background-position: 100% 0;
                background-repeat: no-repeat;
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-position 0.3s ease, box-shadow 0.3s ease;
            }
            .dbg-btn:hover {
                background-position: 0 0;
                transform: scale(1.03);
                box-shadow: 0 0 20px rgba(255,0,0,0.6);
            }
            .dbg-btn:active {
                transform: scale(0.98);
            }

            @keyframes debugShake {
                0% { transform: translate(0, 0); }
                25% { transform: translate(6px, 0); }
                50% { transform: translate(0, 6px); }
                75% { transform: translate(-6px, 0); }
                100% { transform: translate(0, -6px); }
            }
            .debug-shake {
                animation: debugShake 0.05s linear 3;
            }

            @keyframes aftonWordShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-1px) translateY(1px); }
                50% { transform: translateX(1px) translateY(-1px); }
                75% { transform: translateX(-1px) translateY(-1px); }
            }
            .afton-shake {
                display: inline-block;
                font-weight: 900;
                color: #ff3333;
                animation: aftonWordShake 0.15s infinite linear;
                text-shadow: 0 0 8px rgba(255,0,0,0.6);
            }

            @media (max-width: 768px) {
                #loading-percentage {
                    font-size: 3.5rem !important;
                }
                #loading-bar, .loading-bar, #loading-bar-fill {
                    height: 10px !important;
                }
                #enter-overlay h1, #enter-overlay .glitch, #enter-overlay [data-glitch] {
                    font-size: 2.4rem !important;
                    line-height: 1.3 !important;
                }
                #enter-btn {
                    font-size: 1.3rem !important;
                    padding: 16px 42px !important;
                    height: auto !important;
                }
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

    let typedBuffer = "";
    const MAX_BUFFER = 10;
    
    const aftonAssets = {
        beep: './assets/Headlock Beep.mp3',
        loop1: './assets/Headlock Loop 1.mp3',
        loop2: './assets/Headlock Loop 2.mp3',
        outro: './assets/Headlock Loop Outro.mp3',
        keypress: './assets/Keypress.mp3',
        success: './assets/Debug Success.mp3'
    };
    
    const rawAudioData = {};
    const aftonBuffers = {};

    Object.entries(aftonAssets).forEach(async ([key, url]) => {
        try {
            const res = await fetch(url);
            rawAudioData[key] = await res.arrayBuffer();
        } catch(e) {
            console.warn(`Could not preload ${key} - ${url}`);
        }
    });

    async function getDecodedBuffer(key) {
        if(aftonBuffers[key]) return aftonBuffers[key];
        if(rawAudioData[key] && window.audioCtx) {
            const bufferCopy = rawAudioData[key].slice(0);
            aftonBuffers[key] = await window.audioCtx.decodeAudioData(bufferCopy);
            return aftonBuffers[key];
        }
        return null;
    }

    let fnafNode = null;
    function getFNAFNode() {
        if (fnafNode) return fnafNode;
        if (!window.audioCtx) return null;
        
        const bass = window.audioCtx.createBiquadFilter();
        bass.type = "lowshelf";
        bass.frequency.value = window.bassFilter ? window.bassFilter.frequency.value : 250;
        bass.gain.value = 8;
        
        const treble = window.audioCtx.createBiquadFilter();
        treble.type = "highshelf";
        treble.frequency.value = window.trebleFilter ? window.trebleFilter.frequency.value : 4000;
        treble.gain.value = 8;
        
        bass.connect(treble);
        treble.connect(window.audioCtx.destination);
        
        fnafNode = bass;
        return fnafNode;
    }

    let fnafMusicGain = null;
    function getFNAFMusicNode() {
        if (fnafMusicGain) return fnafMusicGain;
        if (!window.audioCtx) return null;
        
        fnafMusicGain = window.audioCtx.createGain();
        fnafMusicGain.gain.value = 0.25; 
        fnafMusicGain.connect(getFNAFNode() || window.audioCtx.destination);
        
        return fnafMusicGain;
    }

    async function playAftonSound(key) {
        if(!window.audioCtx) return null;
        const buf = await getDecodedBuffer(key);
        if(buf) {
            const src = window.audioCtx.createBufferSource();
            src.buffer = buf;
            src.connect(getFNAFMusicNode() || window.audioCtx.destination);
            src.start();
            return src;
        }
        return null;
    }

    let typingBeepTimer = null;
    let typingIdleTimer = null;
    let isBeeping = false;
    let currentSilence = 1.0;
    
    let isAftonSequenceRunning = false;
    let aftonBeeps = [];
    let aftonLoop1Src = null;
    let aftonLoop2Src = null;
    let tLoop1Start = 0;
    let tLoop1End = 0;
    let tLoop2Start = 0;

    function flashFNAF(type) {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0'; 
        flash.style.left = '0';
        flash.style.width = '100vw'; 
        flash.style.height = '100vh';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.3s ease-out';
        flash.style.background = '#ff0000';
        
        if (type === 'bg') {
            flash.style.zIndex = '-1'; 
            flash.style.opacity = '0.5';
        } else if (type === 'full') {
            flash.style.zIndex = '99999999'; 
            flash.style.opacity = '0.8';
        }

        document.body.appendChild(flash);
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 300);
            });
        });
    }

    function applyFNAFDeafen(isActive, fullyMute = false) {
        if (!window.audioCtx || !window.lowpassFilter || !window.masterGain) return;

        const now = window.audioCtx.currentTime;
        const isGloballyDeafened = document.body.classList.contains('is-deafened');

        window.lowpassFilter.frequency.cancelScheduledValues(now);
        window.masterGain.gain.cancelScheduledValues(now);
        
        try {
            window.lowpassFilter.frequency.setValueAtTime(window.lowpassFilter.frequency.value, now);
            window.masterGain.gain.setValueAtTime(window.masterGain.gain.value, now);
        } catch(e) {}

        if (isActive) {
            window.lowpassFilter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
            window.masterGain.gain.linearRampToValueAtTime(fullyMute ? 0.0 : 0.05, now + 0.5);
        } else {
            const targetFreq = isGloballyDeafened ? 200 : 24000;
            const targetVol = isGloballyDeafened ? 1.0 : 0.35;
            
            const currentFreq = Math.max(window.lowpassFilter.frequency.value, 1);
            window.lowpassFilter.frequency.setValueAtTime(currentFreq, now);
            window.lowpassFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + 5.0);
            window.masterGain.gain.linearRampToValueAtTime(targetVol, now + 5.0);
        }
    }

    async function scheduleNextBeep() {
        if (!isBeeping) return;
        const buf = await getDecodedBuffer('beep');
        if(buf && isBeeping) {
            const src = window.audioCtx.createBufferSource();
            src.buffer = buf;
            src.connect(getFNAFMusicNode() || window.audioCtx.destination);
            src.start();
            flashFNAF('bg'); 
            typingBeepTimer = setTimeout(scheduleNextBeep, (buf.duration + currentSilence) * 1000);
        } else {
            typingBeepTimer = setTimeout(scheduleNextBeep, 200);
        }
    }

    function updateFNAFBeep(ratio) {
        if (ratio === 0) {
            if(isBeeping) {
                isBeeping = false;
                clearTimeout(typingBeepTimer);
                applyFNAFDeafen(false); 
            }
            return;
        }
        
        applyFNAFDeafen(true, true); 
        currentSilence = 1.5 - (ratio * (1.5 - 0.360));

        if (!isBeeping) {
            isBeeping = true;
            scheduleNextBeep();
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!window.audioCtx || window.audioCtx.state === 'suspended') return;

        const enterOverlay = document.getElementById('enter-overlay');
        if (enterOverlay && window.getComputedStyle(enterOverlay).display !== 'none') return;
        if (document.querySelector('.staged-for-drop') || document.querySelector('.is-dropping')) return;
        
        if (isAftonSequenceRunning) return;

        const key = e.key.toLowerCase();
        if (key.length !== 1) return; 

        const { isValidMatch, ratio, isComplete, matchedWord } = checkStrictFNAFProgress(typedBuffer, key);

        if (isValidMatch) {
            typedBuffer += key;
            if (typedBuffer.length > MAX_BUFFER) typedBuffer = typedBuffer.slice(-MAX_BUFFER);

            playAftonSound('keypress');

            const contentWrap = $('content');
            if (contentWrap) {
                contentWrap.classList.remove('debug-shake');
                void contentWrap.offsetWidth; 
                contentWrap.classList.add('debug-shake');
            }

            if (isComplete) {
                typedBuffer = ""; 
                clearTimeout(typingIdleTimer);
                
                if (matchedWord === "debug") {
                    playAftonSound('success');
                    injectAndOpenDebugger();
                } else {
                    triggerAftonSequence();
                }
            } else {
                if (matchedWord !== "debug") {
                    updateFNAFBeep(ratio);
                } else {
                    updateFNAFBeep(0);
                }
                
                clearTimeout(typingIdleTimer);
                typingIdleTimer = setTimeout(() => {
                    if (!isAftonSequenceRunning) {
                        typedBuffer = "";
                        updateFNAFBeep(0); 
                    }
                }, 2500);
            }
        } else {
            typedBuffer = "";
            clearTimeout(typingIdleTimer);
            updateFNAFBeep(0);
        }
    });

    function checkStrictFNAFProgress(currentBuffer, newKey) {
        const targets = ["william", "afton", "spring", "debug"];
        let isValidMatch = false;
        let maxRatio = 0;
        let isComplete = false;
        let matchedWord = "";

        if (currentBuffer === "") {
            for (let word of targets) {
                if (word[0] === newKey) {
                    isValidMatch = true;
                    let ratio = 1 / word.length;
                    if (ratio > maxRatio) {
                        maxRatio = ratio;
                        matchedWord = word;
                    }
                }
            }
        } else {
            for (let word of targets) {
                for (let len = currentBuffer.length; len > 0; len--) {
                    let segment = currentBuffer.slice(currentBuffer.length - len);
                    if (word.startsWith(segment)) {
                        if (word[segment.length] === newKey) {
                            isValidMatch = true;
                            let prospectiveLength = segment.length + 1;
                            let ratio = prospectiveLength / word.length;
                            
                            if (ratio > maxRatio) {
                                maxRatio = ratio;
                                matchedWord = word;
                            }
                            if (prospectiveLength === word.length) isComplete = true;
                            break;
                        }
                    }
                }
                if (isValidMatch) break;
            }
        }
        return { isValidMatch, ratio: maxRatio, isComplete, matchedWord };
    }

    async function triggerAftonSequence() {
        isAftonSequenceRunning = true; 
        isBeeping = false;
        clearTimeout(typingBeepTimer);
        applyFNAFDeafen(true, true); 

        const contentWrap = $('content');
        if(contentWrap) {
            contentWrap.classList.remove('debug-shake');
            void contentWrap.offsetWidth;
            contentWrap.classList.add('debug-shake');
        }

        if(!window.audioCtx) {
            finishAftonSequence();
            return;
        }

        const bufBeep = await getDecodedBuffer('beep');
        const bufLoop1 = await getDecodedBuffer('loop1');
        const bufLoop2 = await getDecodedBuffer('loop2');
        await getDecodedBuffer('outro'); 

        let t = window.audioCtx.currentTime;
        let beepDur = bufBeep ? bufBeep.duration : 0.5;
        
        aftonBeeps = [];
        aftonLoop1Src = null;
        aftonLoop2Src = null;
        const targetNode = getFNAFMusicNode() || window.audioCtx.destination;

        for(let i=0; i<5; i++) {
            if(bufBeep) {
                let src = window.audioCtx.createBufferSource();
                src.buffer = bufBeep;
                src.connect(targetNode);
                src.start(t);
                aftonBeeps.push(src);

                let delay = Math.max(0, (t - window.audioCtx.currentTime) * 1000);
                setTimeout(() => flashFNAF('full'), delay);
            }
            t += beepDur + 0.360; 
        }

        tLoop1Start = t;
        if(bufLoop1) {
            let loop1 = window.audioCtx.createBufferSource();
            loop1.buffer = bufLoop1;
            loop1.connect(targetNode);
            loop1.start(tLoop1Start);
            aftonLoop1Src = loop1;
            
            tLoop1End = tLoop1Start + bufLoop1.duration;
            t = tLoop1End;
        } else {
            tLoop1End = tLoop1Start + 2;
            t = tLoop1End;
        }

        tLoop2Start = t;
        if(bufLoop2) {
            aftonLoop2Src = window.audioCtx.createBufferSource();
            aftonLoop2Src.buffer = bufLoop2;
            aftonLoop2Src.loop = true;
            aftonLoop2Src.connect(targetNode);
            aftonLoop2Src.start(tLoop2Start);
        }

        const delayToUI = Math.max(0, (tLoop1Start - window.audioCtx.currentTime) * 1000);
        
        setTimeout(() => {
            showAftonFile();
        }, delayToUI);
    }

    function showAftonFile() {
        document.body.style.overflow = 'hidden';
        const viewWrapper = document.getElementById('view-wrapper') || document.querySelector('.view-wrapper') || document.querySelector('.wrapper');
        if (viewWrapper) {
            viewWrapper.style.pointerEvents = 'none';
            viewWrapper.style.overflow = 'hidden';
        }
        $$('.card, .tabs, .tab, #content, body').forEach(el => {
            el.style.pointerEvents = 'none';
        });

        const modal = document.createElement('div');
        modal.id = 'afton-report-modal';
        modal.style.pointerEvents = 'auto';
        
        modal.innerHTML = `
            <div class="afton-overlay" style="position: fixed; z-index: 9999999; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5,5,5,0.98); display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.4s ease; will-change: opacity; transform: translateZ(0); pointer-events: auto;">
                
                <style>
                    .afton-content-wrapper { flex: 1; min-height: 0; overflow: hidden; pointer-events: auto !important; position: relative; }
                    .afton-scroll-content { padding-right: 20px; padding-bottom: 50px; }
                    
                    .afton-content-wrapper::-webkit-scrollbar { width: 6px; }
                    .afton-content-wrapper::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 4px; }
                    .afton-content-wrapper::-webkit-scrollbar-thumb { background: rgba(255,0,0,0.5); border-radius: 4px; transition: background 0.3s ease; }
                    .afton-content-wrapper::-webkit-scrollbar-thumb:hover { background: rgba(255,0,0,0.9); }

                    .afton-section-title { font-family: 'Onest', sans-serif; font-size: 16px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; }
                    .afton-text { font-family: 'Satoshi', sans-serif; font-size: 14px; color: #ccc; line-height: 1.7; font-weight: 500; }
                    .afton-highlight { color: #fff; font-weight: 800; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
                    
                    .afton-redact { background-color: #3a0000; color: transparent; border-radius: 4px; padding: 0 5px; transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1); user-select: none; display: inline-block; line-height: 1.2; box-shadow: inset 0 0 6px rgba(0,0,0,0.9); cursor: help; border: 1px solid rgba(255,0,0,0.15); }
                    .afton-redact.hoverable:hover { background-color: rgba(255, 0, 0, 0.12); color: #ff5555; box-shadow: none; border-color: rgba(255,0,0,0.4); text-shadow: 0 0 8px rgba(255,0,0,0.6); }
                    
                    .afton-audio-btn { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,0,0,0.15); border: 1px solid rgba(255,0,0,0.5); color: #fff; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease; flex-shrink: 0; }
                    .afton-audio-btn:hover { background: rgba(255,0,0,0.3); transform: scale(1.05); box-shadow: 0 0 10px rgba(255,0,0,0.4); }

                    @keyframes aftonWordShake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-1px) translateY(1px); }
                        50% { transform: translateX(1px) translateY(-1px); }
                        75% { transform: translateX(-1px) translateY(-1px); }
                    }
                    .afton-shake {
                        display: inline-block;
                        font-weight: 900;
                        color: #ff3333;
                        animation: aftonWordShake 0.15s infinite linear;
                        text-shadow: 0 0 8px rgba(255,0,0,0.6);
                    }
                </style>

                <div class="afton-box" style="background: rgba(17,17,17,0.85); border: 5px solid var(--panel-border); width: 90%; max-width: 800px; height: 85vh; padding: 35px; border-radius: 25px; box-shadow: 0 0 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; position: relative; will-change: transform, opacity; transform: translateZ(0); pointer-events: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
                        <div>
                            <h2 style="font-family: 'Onest', sans-serif; font-size: 26px; font-weight: 900; color: #fff; margin: 0; text-shadow: 0 2px 10px rgba(255,0,0,0.4);">WILLIAM AFTON</h2>
                            <p style="font-family: 'Satoshi', sans-serif; font-size: 13px; color: var(--primary); font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px;">PRIME SUSPECT IN THE 1985 MISSING CHILDREN INCIDENT</p>
                        </div>
                    </div>

                    <div class="afton-content-wrapper" style="mask-image: linear-gradient(to bottom, black 90%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 90%, transparent 100%);">
                        <div class="afton-scroll-content">
                            <div style="background: rgba(30,0,0,0.5); border: 1px solid rgba(255,0,0,0.2); padding: 20px; border-radius: 12px; margin-top: 0px; margin-bottom: 10px;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <button id="afton-voice-btn" class="afton-audio-btn">
                                        <svg id="afton-play-icon" style="display: none;" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                        <svg id="afton-pause-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                    </button>
                                    <div style="flex: 1;">
                                        <div style="font-family: 'Onest', sans-serif; font-size: 13px; color: #ff6666; font-weight: 800; letter-spacing: 1px; margin-bottom: 5px;">AUDIO EXHIBIT A: INTERCEPTED VOICEMAIL</div>
                                        <div style="height: 6px; background: rgba(255,0,0,0.15); border-radius: 3px; overflow: hidden; position: relative;">
                                            <div id="afton-voice-progress" style="width: 0%; height: 100%; background: #ff0000; will-change: width;"></div>
                                        </div>
                                    </div>
                                </div>
                                <p class="afton-text" style="font-style: italic; color: #999; font-size: 13px; margin-top: 15px; margin-bottom: 0; padding-left: 55px; border-left: 2px solid rgba(255,0,0,0.3);">
                                    "How could you do that to your own father?! I hate you. I've <span class="afton-shake">ALWAYS</span> hated you. I'm going to kill you, and I'm going to make it <span class="afton-shake">HURT</span>. Oh, how I miss the way you used to cry when I screamed at you. It's going to get so much <span class="afton-shake">WORSE</span>. I'm going to get out... and I'm going to find you... and I'll give you a <span class="afton-shake">REAL</span> reason to cry."
                                </p>
                                <audio id="afton-voice-audio" src="./assets/William Voice.mp3" preload="auto" crossorigin="anonymous"></audio>
                            </div>
                            <p class="afton-text" style="font-size: 12px; color: #777; text-align: right; margin-top: 5px; margin-bottom: 25px;">Intercepted from an encrypted cellular relay; believed to be directed at his eldest son, Michael Afton.</p>

                            <div style="display: flex; gap: 25px; align-items: flex-start; flex-wrap: wrap;">
                                <div style="flex: 0 0 200px;">
                                    <img id="afton-img" src="./assets/William Afton Cosplay.webp" onerror="this.src='./assets/Home Tab Avatar.webp'" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.6); filter: contrast(1.1) brightness(0.9);">
                                </div>
                                
                                <div style="flex: 1; min-width: 250px;">
                                    <p class="afton-text" style="margin-top: 0;"><span class="afton-highlight">William Afton</span>, co-founder of <span class="afton-highlight">Fazbear Entertainment</span> alongside mechanical engineer Henry Emily, remains the singular focal point of a multi-decade investigation. The attached photograph, captured on <span class="afton-highlight">October 20, 2005</span>, was initially filed during a corporate fraud indictment regarding <span class="afton-highlight">Afton Robotics</span> shell companies—long before his true crimes were fully understood by <span class="afton-redact hoverable">Federal Bureau Investigators</span>.</p>
                                    
                                    <div class="afton-section-title">THE MISSING CHILDREN INCIDENT</div>
                                    <p class="afton-text">In 1985, five children vanished from the western branch of Freddy Fazbear's Pizza. Official manifests state that an individual bypassed security protocols using a defunct, experimental <span class="afton-highlight">Spring Bonnie costume</span> to lure the victims into an unmapped <span class="afton-redact hoverable">safe room blind spot</span>. Forensic search reports indicate the physical bodies were never recovered, suspected to have been hidden directly inside the core animatronic hulls to bypass building origin inspections managed by <span class="afton-redact hoverable">Fazbear corporate handlers</span>.</p>
                                </div>
                            </div>

                            <div class="afton-section-title">THE REMNANT OBSESSION & AFTON ROBOTICS</div>
                            <p class="afton-text">Classified schematics recovered from <span class="afton-highlight">Afton Robotics LLC</span> revealed that later animatronic generations—specifically the "Funtime" models—were not designed for entertainment. Documents point to tactical components including internal proximity sensors, voice-mimicking modules, and behavioral programming highly suggestive of kidnapping and extraction protocols. Authorities believe Afton was utilizing these machines to violently harvest a substance he obsessively referred to in his journals as <span class="afton-highlight">"Remnant."</span> <span class="afton-redact hoverable">THIS METALLIC SUBSTANCE IS CLASSIFIED AND CAPABLE OF REANIMATING SOULS INTO DEAD MECHANICAL TISSUE.</span> Operational data was traced back to an underground bunker situated below <span class="afton-redact hoverable">the Afton family residence</span>.</p>

                            <div class="afton-section-title">THE SPRINGLOCK FAULT INDUCTION</div>
                            <p class="afton-text">Following the collapse of the brand, architectural records confirm Afton returned to a decommissioned location to dismantle the physical animatronic assets. Trapped inside the unmapped safe room by what eyewitness accounts describe as psychological anomalies or hallucinations of his victims, Afton donned the unstable Spring Bonnie suit. Structural moisture caused a catastrophic <span class="afton-highlight">springlock failure</span>, collapsing the mechanical endoskeleton directly into his body. The room was bricked over, sealing him inside for years until an unmonitored extraction occurred on <span class="afton-redact hoverable">an undisclosed date</span>.</p>

                            <div class="afton-section-title">SPECULATIONS</div>
                            <p class="afton-text">Following the recovery of this audio fragment, fringe theories and unverified reports have suggested a far more disturbing reality. There are unconfirmed cases in which he had gone through aliases like Dave Miller, Steve Raglan, and Karl Chastin Delfin. Blurry security captures across various urban sectors display a grotesque, decaying rabbit suit moving through the shadows, containing what appears to be a mummified human corpse. While federal agencies dismiss these sightings as hoaxes or copycat criminals, underground communities speculate that Afton survived the springlock failure and is currently operating as the entity dubbed <span class="afton-highlight">"Springtrap"</span>. Until definitive proof is found, his survival remains an unconfirmed, yet terrifying, possibility.</p>
                        </div>
                    </div>

                    <div style="padding-top: 20px; text-align: right; border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                        <button id="afton-close-btn" class="dbg-btn" style="width: auto; padding: 0 32px; display: inline-flex;">CLOSE FILE</button>
                    </div>

                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const contentWrapper = modal.querySelector('.afton-content-wrapper');
        const scrollContent = modal.querySelector('.afton-scroll-content');
        const trapScroll = (e) => e.stopPropagation();
        contentWrapper.addEventListener('wheel', trapScroll, { passive: true });
        contentWrapper.addEventListener('touchmove', trapScroll, { passive: true });

        let aftonLenis = null;
        let isAftonLenisActive = false;

        if (typeof Lenis !== 'undefined') {
            isAftonLenisActive = true;
            aftonLenis = new Lenis({
                wrapper: contentWrapper,
                content: scrollContent,
                lerp: 0.15,
                wheelMultiplier: 0.9,
                smoothWheel: true,
                smoothTouch: false,
            });

            const rafAfton = (time) => {
                if (!isAftonLenisActive) return;
                aftonLenis.raf(time);
                requestAnimationFrame(rafAfton);
            };
            requestAnimationFrame(rafAfton);
        } else {
            contentWrapper.style.overflowY = 'auto';
        }

        const voiceAudio = document.getElementById('afton-voice-audio');
        const voiceBtn = document.getElementById('afton-voice-btn');
        const playIcon = document.getElementById('afton-play-icon');
        const pauseIcon = document.getElementById('afton-pause-icon');
        const voiceProgress = document.getElementById('afton-voice-progress');
        
        if (window.audioCtx && !window.voiceRoutedAfton) {
            try {
                const source = window.audioCtx.createMediaElementSource(voiceAudio);
                source.connect(getFNAFNode() || window.audioCtx.destination);
                window.voiceRoutedAfton = true;
            } catch(e) {}
        }

        voiceAudio.volume = 1.0;
        voiceAudio.isResetting = false;
        voiceAudio.play().catch(e => {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        });

        let progressRaf;
        const updateProgress = () => {
            if (!voiceAudio.isResetting && voiceAudio.duration > 0) {
                const percent = (voiceAudio.currentTime / voiceAudio.duration) * 100;
                voiceProgress.style.width = `${percent}%`;
            }
            if (!voiceAudio.paused && !voiceAudio.ended) {
                progressRaf = requestAnimationFrame(updateProgress);
            }
        };

        voiceBtn.addEventListener('click', () => {
            if (voiceAudio.paused) {
                voiceAudio.play();
            } else {
                voiceAudio.pause();
            }
        });

        voiceAudio.addEventListener('play', () => {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            if (progressRaf) cancelAnimationFrame(progressRaf);
            progressRaf = requestAnimationFrame(updateProgress);
        });

        voiceAudio.addEventListener('pause', () => {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            if (progressRaf) cancelAnimationFrame(progressRaf);
        });

        voiceAudio.addEventListener('ended', () => {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            if (progressRaf) cancelAnimationFrame(progressRaf);
            
            voiceAudio.isResetting = true;
            voiceProgress.style.transition = 'width 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            voiceProgress.style.width = '0%';
            
            setTimeout(() => {
                voiceAudio.currentTime = 0;
                voiceProgress.style.transition = 'none';
                voiceAudio.isResetting = false;
            }, 400);
        });

        setTimeout(() => modal.querySelector('.afton-overlay').style.opacity = '1', 50);

        document.getElementById('afton-close-btn').addEventListener('click', async function() {
            this.style.pointerEvents = 'none';
            this.style.transition = 'opacity 0.2s';
            this.style.opacity = '0';

            if (voiceAudio) {
                voiceAudio.pause();
            }

            const bufOutro = await getDecodedBuffer('outro');
            const outroDur = bufOutro ? bufOutro.duration : 2.0;

            const now = window.audioCtx.currentTime;
            let nextBoundary = now;

            if (now >= tLoop2Start && aftonLoop2Src) {
                const duration = aftonLoop2Src.buffer.duration;
                const elapsed = now - tLoop2Start;
                const loopCount = Math.floor(elapsed / duration);
                nextBoundary = tLoop2Start + ((loopCount + 1) * duration);
            } else if (now >= tLoop1Start && now < tLoop1End && aftonLoop1Src) {
                nextBoundary = tLoop1End;
            } else {
                nextBoundary = now;
            }

            const timeRemainingMs = Math.max(50, (nextBoundary - now) * 1000);

            const textNodes = [];
            const walk = document.createTreeWalker(scrollContent, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while(node = walk.nextNode()) {
                if(node.nodeValue.trim().length > 0) {
                    textNodes.push(node);
                }
            }
            textNodes.reverse(); 

            const totalChars = textNodes.reduce((sum, n) => sum + n.nodeValue.length, 0);
            const deleteDuration = Math.max(16, timeRemainingMs - 50); 
            const startTimestamp = performance.now();
            let charsDeletedSoFar = 0;

            function backspaceFrame(timestamp) {
                let elapsed = timestamp - startTimestamp;
                let progress = Math.min(1, elapsed / deleteDuration);
                let targetCharsDeleted = Math.floor(progress * totalChars);

                let charsToDeleteThisFrame = targetCharsDeleted - charsDeletedSoFar;

                while (charsToDeleteThisFrame > 0 && textNodes.length > 0) {
                    let current = textNodes[0];
                    let currentLen = current.nodeValue.length;
                    
                    if (currentLen > 0) {
                        let toRemove = Math.min(currentLen, charsToDeleteThisFrame);
                        current.nodeValue = current.nodeValue.slice(0, -toRemove);
                        charsToDeleteThisFrame -= toRemove;
                        charsDeletedSoFar += toRemove;
                    }
                    
                    if (current.nodeValue.length === 0) {
                        textNodes.shift();
                    }
                }

                if (progress < 1 && textNodes.length > 0) {
                    requestAnimationFrame(backspaceFrame);
                }
            }
            requestAnimationFrame(backspaceFrame);

            setTimeout(() => {
                const overlay = modal.querySelector('.afton-overlay');
                const box = modal.querySelector('.afton-box');

                box.style.boxShadow = 'none';

                const windowFadeDur = outroDur * 0.5;
                box.style.transition = `transform ${windowFadeDur}s cubic-bezier(0.25, 1, 0.5, 1), opacity ${windowFadeDur}s linear`;
                box.style.transform = 'scale(0.95) translateY(15px)';
                box.style.opacity = '0';
                
                box.style.pointerEvents = 'none';
                overlay.style.pointerEvents = 'none'; 

                triggerAftonOutro(nextBoundary, () => {
                    if (overlay) {
                        overlay.style.transition = 'opacity 1.5s ease';
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            if (aftonLenis) {
                                isAftonLenisActive = false;
                                aftonLenis.destroy();
                            }
                            modal.remove();
                        }, 1500);
                    }
                });

            }, timeRemainingMs);
        });
    }

    function finishAftonSequence(onComplete) {
        applyFNAFDeafen(false);
        isAftonSequenceRunning = false; 
        
        document.body.style.overflow = ''; 
        const viewWrapper = document.getElementById('view-wrapper') || document.querySelector('.view-wrapper') || document.querySelector('.wrapper');
        if (viewWrapper) {
            viewWrapper.style.pointerEvents = '';
            viewWrapper.style.overflow = '';
        }
        $$('.card, .tabs, .tab, #content, body').forEach(el => {
            el.style.pointerEvents = '';
        });

        typedBuffer = "";
        if(onComplete) onComplete();
    }

    async function triggerAftonOutro(fixedBoundary, onComplete) {
        if(!window.audioCtx) {
            finishAftonSequence(onComplete);
            return;
        }

        const bufOutro = await getDecodedBuffer('outro');
        const now = window.audioCtx.currentTime;
        const nextBoundary = fixedBoundary || now;

        if (now >= tLoop2Start && aftonLoop2Src) {
            try { aftonLoop2Src.stop(nextBoundary); } catch(e) {}
        } else if (now >= tLoop1Start && now < tLoop1End && aftonLoop1Src) {
            if (aftonLoop2Src) { try { aftonLoop2Src.stop(0); } catch(e) {} }
        } else {
            aftonBeeps.forEach(src => { try { src.stop(nextBoundary); } catch(e) {} });
            if (aftonLoop1Src) { try { aftonLoop1Src.stop(nextBoundary); } catch(e) {} }
            if (aftonLoop2Src) { try { aftonLoop2Src.stop(nextBoundary); } catch(e) {} }
        }

        if(bufOutro) {
            let outro = window.audioCtx.createBufferSource();
            outro.buffer = bufOutro;
            outro.connect(getFNAFMusicNode() || window.audioCtx.destination);
            outro.start(nextBoundary);

            outro.onended = () => {
                finishAftonSequence(onComplete); 
            };
        } else {
            setTimeout(() => {
                finishAftonSequence(onComplete);
            }, Math.max(0, (nextBoundary - now) * 1000) + 2000);
        }
    }

    const safeDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function applyDebugCardHiding(tabMatch, isDeact) {
        const activeTab = document.body.getAttribute('data-active-tab') || 'home';
        
        if (activeTab === tabMatch) {
            const newLayout = profiles[activeTab]?.layout || profiles.home.layout;
            const targetCards = newLayout.showCards || [];

            const cardsData = ['card-2', 'card-3', 'card-4']
                .map(num => ({
                    id: `${num}-container`,
                    card: document.getElementById(`${num}-container`),
                    content: document.getElementById(`${num}-content`)
                }))
                .filter(obj => obj.card && targetCards.includes(obj.id));

            if (isDeact) {
                cardsData.forEach(({ content }) => {
                    if (content) content.classList.add('fade-out');
                });
                
                await safeDelay(250);
                
                cardsData.forEach(({ card }) => {
                    const parent = card.parentElement;
                    const gap = parent ? (parseFloat(window.getComputedStyle(parent).gap) || 0) : 0;
                    
                    card.style.transition = 'none';
                    const currentHeight = card.offsetHeight;
                    card.style.height = currentHeight + 'px';
                    void card.offsetHeight;
                    
                    card.style.transition = 'height 0.65s cubic-bezier(0.25, 1, 0.5, 1), margin 0.65s cubic-bezier(0.25, 1, 0.5, 1), padding 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
                    card.classList.add('hide-card');
                    card.style.height = '0px';
                    card.style.padding = '0px';
                    card.style.borderWidth = '0px';
                    card.style.marginTop = '0px';
                    card.style.marginBottom = `-${gap}px`;
                    card.style.opacity = '0';
                });
                
                await safeDelay(650);
                
                cardsData.forEach(({ card }) => {
                    if (document.body.classList.contains(tabMatch === 'instagram' ? 'ig-deactivated' : 'fb-deactivated')) {
                        card.style.display = 'none';
                    }
                });
                
            } else {
                cardsData.forEach(({ content }) => {
                    if (content) content.classList.add('fade-out');
                });
                
                const targetHeights = [];
                
                cardsData.forEach(({ card }, i) => {
                    card.style.display = 'block';
                    card.style.transition = 'none';
                    card.classList.remove('hide-card');
                    card.style.height = 'auto';
                    card.style.padding = '';
                    card.style.borderWidth = '';
                    card.style.marginTop = '';
                    card.style.marginBottom = '';
                    card.style.opacity = '0';
                    
                    targetHeights[i] = card.offsetHeight;
                });
                
                cardsData.forEach(({ card }) => {
                    const parent = card.parentElement;
                    const gap = parent ? (parseFloat(window.getComputedStyle(parent).gap) || 0) : 0;
                    
                    card.classList.add('hide-card');
                    card.style.height = '0px';
                    card.style.padding = '0px';
                    card.style.borderWidth = '0px';
                    card.style.marginTop = '0px';
                    card.style.marginBottom = `-${gap}px`;
                    
                    void card.offsetHeight;
                });
                
                cardsData.forEach(({ card }, i) => {
                    card.style.transition = 'height 0.65s cubic-bezier(0.25, 1, 0.5, 1), margin 0.65s cubic-bezier(0.25, 1, 0.5, 1), padding 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
                    card.classList.remove('hide-card');
                    card.style.height = targetHeights[i] + 'px';
                    card.style.padding = '';
                    card.style.borderWidth = '';
                    card.style.marginTop = '';
                    card.style.marginBottom = '';
                    card.style.opacity = '1';
                });
                
                await safeDelay(650);
                
                cardsData.forEach(({ card, content }) => {
                    if (!document.body.classList.contains(tabMatch === 'instagram' ? 'ig-deactivated' : 'fb-deactivated')) {
                        card.style.height = 'auto';
                        if (content) content.classList.remove('fade-out');
                    }
                });
            }
        }
    }

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
                const isDeact = e.target.checked;
                document.body.classList.toggle('ig-deactivated', isDeact);
                document.dispatchEvent(new CustomEvent('toggle-ig-deactivation', { detail: { deactivated: isDeact } }));
                
                applyDebugCardHiding('instagram', isDeact);
            });
            
            $('dbg-fb-toggle').addEventListener('change', (e) => {
                const isDeact = e.target.checked;
                document.body.classList.toggle('fb-deactivated', isDeact);
                document.dispatchEvent(new CustomEvent('toggle-fb-deactivation', { detail: { deactivated: isDeact } }));
                
                applyDebugCardHiding('facebook', isDeact);
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