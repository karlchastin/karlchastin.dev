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

    
    const warningEl = $('email-night-warning');
    if (warningEl) {
        const now = new Date();
        let phtHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false }).format(now));
        if (phtHour === 24) phtHour = 0;

        if (phtHour >= 22 || phtHour < 7 || localStorage.getItem('testEmailWarning') === 'true') {
            const phtOffset = 8 * 60 * 60 * 1000;
            const nowPHT = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + phtOffset);
            const targetPHT = new Date(nowPHT);
            targetPHT.setHours(10, 0, 0, 0); 
            if (nowPHT.getHours() >= 22) targetPHT.setDate(targetPHT.getDate() + 1); 
            
            const targetLocalTime = new Date(targetPHT.getTime() - phtOffset - (new Date().getTimezoneOffset() * 60000));
            
            let timeText = "It is currently late at night.";
            if (phtHour >= 0 && phtHour < 7) {
                timeText = "It is currently early in the morning.";
            }

            warningEl.innerHTML = `<div style="background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); color: #ffa500; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span>${timeText} Expect replies as early as <strong>${targetLocalTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</strong> in your local time.</span></div>`;
            warningEl.style.display = 'block';
        }
    }

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

        document.addEventListener('mousemove', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                tooltipEl.innerHTML = target.getAttribute('data-tooltip'); 
                tooltipEl.classList.add('show');
                
                let x = e.clientX + 15;
                let y = e.clientY + 15;
                
                const tooltipRect = tooltipEl.getBoundingClientRect();
                
                if (x + tooltipRect.width > window.innerWidth - 10) x = e.clientX - tooltipRect.width - 15;
                if (y + tooltipRect.height > window.innerHeight - 10) y = e.clientY - tooltipRect.height - 15;
                
                tooltipEl.style.transform = `translate(${x}px, ${y}px)`;
            } else {
                tooltipEl.classList.remove('show');
            }
        });
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
    let volumeTween; 

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

            const startVol = bgAudio.volume;
            
            const targetVol = isDeafened ? 1 : 0.35; 
            
            const duration = 800; 
            const startTime = performance.now();

            cancelAnimationFrame(volumeTween);

            function animateVolume(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const ease = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                bgAudio.volume = startVol + (targetVol - startVol) * ease;
                
                if (progress < 1) {
                    volumeTween = requestAnimationFrame(animateVolume);
                }
            }
            
            volumeTween = requestAnimationFrame(animateVolume);
        });
    }
}