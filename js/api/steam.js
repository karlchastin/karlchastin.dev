import { $ } from '../utils/dom.js';
import { getCache, setCache } from '../utils/core.js';
import { fetchHtmlWithWorker, parseSteamDate } from '../utils/api.js';
import { WORKER_URL, profiles } from '../config.js';

const extractImageSrcs = (imgEl) => {
    const srcs = [];
    if (!imgEl) return srcs;
    if (imgEl.getAttribute('src')) srcs.push(imgEl.getAttribute('src'));
    if (imgEl.getAttribute('srcset')) {
        srcs.push(...imgEl.getAttribute('srcset').split(',').map(s => s.trim().split(' ')[0]));
    }
    return srcs;
};

export async function fetchSteamReview(url) {
    try {
        const htmlText = await fetchHtmlWithWorker(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        let gameName = "Unknown Game";
        const titleTag = doc.querySelector('title');
        if (titleTag && titleTag.textContent) {
            const match = titleTag.textContent.match(/Review for (.+)/i);
            if (match) {
                gameName = match[1].trim();
            } else {
                const parts = titleTag.textContent.split('::').map(s => s.trim());
                if (parts.length > 2) gameName = parts[2];
            }
        }
        if (gameName === "Unknown Game" || gameName.toLowerCase() === 'review') {
            const appNameEl = doc.querySelector('.apphub_AppName') || doc.querySelector('h1');
            if (appNameEl) gameName = appNameEl.textContent.trim();
        }
        
        let gameBannerUrl = null;
        const appIdMatch = url.match(/\/recommended\/([0-9]+)/);
        if (appIdMatch && appIdMatch[1]) {
            gameBannerUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appIdMatch[1]}/header.jpg`;
        }

        let postedDate = "";
        let rawDateString = "";
        const dateEl = doc.querySelector('.postedDate') || doc.querySelector('.posted');
        if (dateEl) {
            rawDateString = dateEl.textContent.replace('Posted:', '').replace(/Updated:.*/i, '').trim();
        } else {
            const dMatch = htmlText.match(/(\d{1,2}\s+[A-Za-z]{3}(?:,\s+\d{4})?\s+@\s+\d{1,2}:\d{2}[ap]m)/i) || htmlText.match(/([A-Za-z]{3}\s+\d{1,2}(?:,\s+\d{4})?\s+@\s+\d{1,2}:\d{2}[ap]m)/i);
            if (dMatch) rawDateString = dMatch[1];
        }

        if (rawDateString) {
            postedDate = parseSteamDate(rawDateString, true);
        }

        let helpful = "0", funny = "0";
        const flatText = doc.body.textContent.replace(/\s+/g, ' ').toLowerCase(); 
        const hMatch = flatText.match(/([0-9,]+)\s*people found this review helpful/i);
        if (hMatch) helpful = hMatch[1];
        const fMatch = flatText.match(/([0-9,]+)\s*people found this review funny/i);
        if (fMatch) funny = fMatch[1];

        const awards = [];
        doc.querySelectorAll('.review_award').forEach(el => {
            const htmlStr = el.innerHTML.toLowerCase();
            const textStr = el.textContent.toLowerCase();
            
            if (el.classList.contains('add_award') || htmlStr.includes('reward_icon') || htmlStr.includes('.svg') || textStr.includes('give an award')) return;
            
            const img = el.querySelector('img');
            if (!img || !img.getAttribute('src')) return;
            
            let count = "1";
            const countEl = el.querySelector('.review_award_count');
            if (countEl) {
                count = countEl.textContent.replace(/[^\d]/g, '');
            } else {
                const m = el.textContent.match(/\(([0-9,]+)\)/);
                if (m) count = m[1];
            }
            
            let src = img.getAttribute('src');
            if (src && src.startsWith('//')) src = 'https:' + src;
            awards.push({ src: src || img.src, count });
        });

        const reviewContentEl = doc.querySelector('.rightbox_content_base .content') || doc.querySelector('[id^="ReviewText"]');
        let reviewText = reviewContentEl ? reviewContentEl.innerHTML.trim() : "No review text found.";
        
        const comments = [];
        doc.querySelectorAll('.commentthread_comment').forEach(comment => {
            let author = "Unknown User";
            const bdi = comment.querySelector('bdi');
            if (bdi) {
                author = bdi.textContent.trim();
            } else {
                const link = comment.querySelector('.commentthread_author_link') || comment.querySelector('.commentthread_comment_author a');
                if (link) author = link.textContent.trim();
            }
            
            let avatar = null, frame = null;
            const avatarEl = comment.querySelector('.commentthread_comment_avatar');
            if (avatarEl) {
                const frameImg = avatarEl.querySelector('.profile_avatar_frame img');
                let frameSrcs = extractImageSrcs(frameImg);
                let bestFrame = frameSrcs.find(s => s.includes('/animated/') || s.endsWith('.gif')) || frameSrcs[0];
                if (bestFrame) {
                    if (bestFrame.startsWith('//')) bestFrame = 'https:' + bestFrame;
                    else if (bestFrame.startsWith('/')) bestFrame = 'https://steamcommunity.com' + bestFrame;
                    frame = bestFrame;
                }

                const avatarImgTags = Array.from(avatarEl.querySelectorAll('img')).filter(img => !img.closest('.profile_avatar_frame'));
                let rawAvatarSrcs = avatarImgTags.flatMap(extractImageSrcs);
                let bestAvatar = rawAvatarSrcs.find(s => s.endsWith('.gif') || s.includes('/animated/')) || rawAvatarSrcs[0];
                if (bestAvatar) {
                    if (bestAvatar.startsWith('//')) bestAvatar = 'https:' + bestAvatar;
                    else if (bestAvatar.startsWith('/')) bestAvatar = 'https://steamcommunity.com' + bestAvatar;
                    avatar = bestAvatar;
                }
            }

            const textEl = comment.querySelector('.commentthread_comment_text');
            const text = textEl ? textEl.innerHTML.trim() : "";
            
            const dateEl = comment.querySelector('.commentthread_comment_timestamp');
            let date = dateEl ? dateEl.textContent.trim() : "";
            
            if (date) {
                date = parseSteamDate(date, false);
            }
            
            if (text) comments.push({ author, avatar, frame, text, date });
        });

        return { gameName, gameBannerUrl, postedDate, helpful, funny, awards, reviewText, comments };
    } catch (e) {
        console.error("Failed to fetch steam review", e);
        return null;
    }
}

export const applyReviewCache = (data) => {
    if(!data) return;
    $('steam-review-loading').style.display = 'none';
    $('steam-review-card').style.display = 'flex';
    
    const bannerBgEl = $('steam-review-banner-bg');
    bannerBgEl.style.backgroundImage = data.gameBannerUrl ? `url(${data.gameBannerUrl})` : 'none';
    bannerBgEl.style.display = data.gameBannerUrl ? 'block' : 'none';

    $('steam-review-game').textContent = data.gameName;
    $('steam-review-helpful').textContent = `${data.helpful} people found this review helpful`;
    $('steam-review-funny').textContent = `${data.funny} people found this review funny`;
    $('steam-review-helpful').parentElement.style.display = 'flex'; 
    $('steam-review-funny').parentElement.style.display = 'flex';
    $('steam-review-text').innerHTML = data.reviewText;
    $('steam-review-date').textContent = data.postedDate ? `Posted: ${data.postedDate}` : "";

    const awardsContainer = $('steam-review-awards');
    if(data.awards?.length) {
        awardsContainer.innerHTML = data.awards.map(a => `
            <div class="award-item"><img src="${a.src}" loading="lazy" class="award-icon" alt="Award"><span class="award-count">${a.count}</span></div>
        `).join('');
        awardsContainer.style.display = 'flex';
    } else {
        awardsContainer.style.display = 'none';
    }
    
    const commentsContainer = $('steam-review-comments');
    if(data.comments?.length) {
        commentsContainer.innerHTML = data.comments.map(c => `
            <div class="comment-item">
                <div class="comment-avatar-wrapper">
                    ${c.frame ? `<img src="${c.frame}" loading="lazy" class="comment-avatar-frame" alt="Frame">` : ''}
                    <img src="${c.avatar}" loading="lazy" class="comment-avatar-img" alt="Avatar">
                </div>
                <div class="comment-content">
                    <div class="comment-author-row"><span class="comment-author">${c.author}</span><span class="comment-date">${c.date}</span></div>
                    <div class="comment-text">${c.text}</div>
                </div>
            </div>
        `).join('');
    } else {
        commentsContainer.innerHTML = `<div style="font-size:12px; color:#888; font-style:italic; padding-left: 5px;">No comments visible.</div>`;
    }
};

export async function updateSteamData() {
    let cache = getCache('steamCache');
    const reviewCache = getCache('steamReviewCache');
    
    const applyCache = (newData, isHtmlScrape = false) => {
        if (isHtmlScrape) newData.fromHtml = true;
        if (cache.fromHtml && !isHtmlScrape) ['gamesCount', 'dlcCount', 'reviewsCount'].forEach(k => delete newData[k]);

        cache = { ...cache, ...newData };
        setCache('steamCache', cache);

        if(cache.name) profiles.steam.name = cache.name;
        if(cache.avatar) profiles.steam.avatar = cache.avatar;
        if(cache.bio) profiles.steam.bio = cache.bio;
        if(cache.level) profiles.steam.level = cache.level;

        const activeTabNode = document.querySelector('.tab.active') || document.querySelector('.tab.show-text');
        const activeTab = activeTabNode ? activeTabNode.getAttribute('data-tab') : 'home';

        if (activeTab === 'steam') {
            $('profile-name').textContent = cache.name || 'Loading...';
            if(cache.avatar) $('avatar-img').src = cache.avatar;
            $('profile-bio').textContent = cache.bio || 'Welcome to my Steam profile.';
        }

        const elLevel = $('steam-live-level');
        const elLevelDisplay = $('steam-level-display');
        if(elLevel && cache.level && cache.level !== "--") {
            const lvlNum = parseInt(cache.level, 10);
            const lvlColor = isNaN(lvlNum) ? 0 : Math.floor(lvlNum / 10) * 10;
            elLevel.textContent = cache.level;
            elLevel.className = `lvl-circle lvl-${lvlColor > 90 ? lvlColor % 100 : lvlColor}`;
            if (activeTab === 'steam') elLevelDisplay.style.display = 'flex';
        } else if (elLevelDisplay) {
            elLevelDisplay.style.display = 'none';
        }

        if(cache.hours) {
            const elHours = $('steam-live-hours');
            if (elHours) elHours.textContent = cache.hours;
            const recentDisplay = $('steam-recent-display');
            if (recentDisplay) recentDisplay.style.display = cache.hours.includes('0 hours') ? 'none' : 'flex';
        }
        
        ['games', 'dlc', 'badges', 'friends', 'reviews'].forEach(stat => {
            const el = $(`steam-live-${stat}`);
            if (el && cache[`${stat}Count`] !== undefined) el.textContent = cache[`${stat}Count`];
        });

        const badgeContainer = $('steam-badge-container');
        if(badgeContainer && cache.badgeSrc) {
            $('steam-live-badge').src = cache.badgeSrc;
            $('steam-badge-title').textContent = cache.badgeName || "";
            $('steam-badge-xp').textContent = cache.badgeXp || "";
            badgeContainer.style.display = 'flex';
        } else if (badgeContainer) badgeContainer.style.display = 'none';

        const statusEl = $('steam-live-status');
        if(statusEl && cache.statusMsg && cache.statusClass) {
            statusEl.innerHTML = cache.statusMsg;
            statusEl.className = `steam-status ${cache.statusClass}`;
        }
    };

    applyCache({});
    if(Object.keys(reviewCache).length > 0) applyReviewCache(reviewCache);

    Promise.all([
        fetch(`${WORKER_URL}?route=core`).then(res => res.json()),
        fetch(`${WORKER_URL}?route=stats`).then(res => res.json())
    ]).then(([coreData, statsData]) => {
        if (!coreData.error) applyCache({ name: coreData.name, avatar: coreData.avatar, level: coreData.level, hours: coreData.hours, statusMsg: coreData.stateMessage, statusClass: coreData.onlineState });
        if (!statsData.error) applyCache({ gamesCount: statsData.gamesCount, badgesCount: statsData.badgesCount, friendsCount: statsData.friendsCount });
    }).catch(e => {
        if (!cache.statusMsg) applyCache({ statusMsg: "Live status unavailable", statusClass: "offline" });
    });

    const hideReviewLoading = (errorMsg = false) => {
        const loadingEl = $('steam-review-loading');
        if (loadingEl) loadingEl.innerHTML = errorMsg ? '<div style="color: #ff4444; font-size: 13px; font-weight: 700;">Failed to fetch Featured Review.</div>' : '';
    };

    fetchHtmlWithWorker(`https://steamcommunity.com/profiles/76561198810914938/`).then(htmlText => {
        const doc = new DOMParser().parseFromString(htmlText, "text/html");
        const dlcEl = Array.from(doc.querySelectorAll('.showcase_stat')).find(el => 
            el.querySelector('.label')?.textContent.trim().includes('DLC Owned')
        );

        let safeOverrides = {
            level: doc.querySelector('.friendPlayerLevelNum')?.textContent || "--",
            bio: doc.querySelector('.profile_summary')?.textContent?.trim(),
            hours: doc.querySelector('.recentgame_recentplaytime h2')?.textContent?.trim(),
            dlcCount: dlcEl ? dlcEl.querySelector('.value')?.textContent.trim().replace(/,/g, '') : "0",
            reviewsCount: doc.querySelector('a[href*="/recommended/"] .profile_count_link_total')?.textContent?.trim().replace(/,/g, '') || "0"
        };
        
        const badgeEl = doc.querySelector('.favorite_badge');
        if (badgeEl) {
            safeOverrides.badgeSrc = badgeEl.querySelector('.favorite_badge_icon img')?.getAttribute('src');
            safeOverrides.badgeName = badgeEl.querySelector('.favorite_badge_description .name')?.textContent?.trim() || badgeEl.querySelector('.name')?.textContent?.trim() || "";
            safeOverrides.badgeXp = badgeEl.querySelector('.favorite_badge_description .xp')?.textContent?.trim() || "";
        }

        applyCache(safeOverrides, true);

        const reviewLink = Array.from(doc.querySelectorAll('a[href*="/recommended/"]')).find(link => link.href.match(/\/recommended\/[0-9]+/));
        if (reviewLink) {
            fetchSteamReview(reviewLink.href).then(data => {
                if(data) { setCache('steamReviewCache', data); applyReviewCache(data); } else hideReviewLoading(true);
            }).catch(() => hideReviewLoading(true));
        } else hideReviewLoading(false);
    }).catch(() => hideReviewLoading(true));
}