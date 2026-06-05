import { profiles, WORKER_URL } from '../config.js';
import { $, $$ } from '../utils/dom.js';

export let cachedIgData = null;

export async function loadInstagramData() {
    const workerUrl = `${WORKER_URL}?route=instagram`;

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) throw new Error('Failed to fetch IG data from Worker');
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            cachedIgData = data[0];
            updateInstagramUI(cachedIgData);
        } else {
            updateInstagramUI({ error: "not_found" });
        }
    } catch (error) {
        console.error("Instagram API Error:", error);
        updateInstagramUI({ error: "not_found" });
    }
}

document.addEventListener('toggle-ig-deactivation', (e) => {
    if (e.detail.deactivated) {
        updateInstagramUI({ error: "not_found" });
    } else if (cachedIgData) {
        updateInstagramUI(cachedIgData);
    }
});

export function updateInstagramUI(profile) {
    const igProfile = profiles.instagram;
    const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab');

    const animateProfileChange = (avatarUrl, nameText, bioText) => {
        const avatarImg = $('avatar-img');
        const profileName = $('profile-name');
        const profileBio = $('profile-bio');
        
        const isSameAvatar = !avatarImg || !avatarUrl || avatarImg.src === avatarUrl || avatarImg.getAttribute('src') === avatarUrl;

        if (avatarImg && !isSameAvatar) avatarImg.style.opacity = '0';
        if (profileName) {
            profileName.style.transition = 'opacity 0.15s ease';
            profileName.style.opacity = '0';
        }
        if (profileBio) {
            profileBio.style.transition = 'opacity 0.15s ease';
            profileBio.style.opacity = '0';
        }

        setTimeout(() => {
            if (avatarImg && !isSameAvatar) {
                avatarImg.src = avatarUrl;
                avatarImg.style.opacity = '1';
            }
            if (profileName) {
                profileName.textContent = nameText;
                profileName.style.opacity = '1';
            }
            if (profileBio) {
                profileBio.textContent = bioText;
                profileBio.style.opacity = '1';
            }
        }, 150);
    };

    if (!profile || profile.error === "not_found" || profile.error) {
        igProfile.name = "Account Deactivated";
        igProfile.bio = "This Instagram account is currently deactivated or unavailable.";
        
        document.body.classList.add('ig-deactivated');
        document.dispatchEvent(new CustomEvent('deactivation-state-changed'));
        
        if (activeTab === 'instagram') {
            animateProfileChange(null, igProfile.name, igProfile.bio);
        }

        const statsMap = { 'ig-posts': '--', 'ig-followers': '--', 'ig-following': '--' };
        for (const [id, value] of Object.entries(statsMap)) {
            const el = $(id);
            if (el) el.textContent = value;
        }

        const postsGrid = document.querySelector('.ig-posts-grid');
        if (postsGrid) {
            postsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #888; font-weight: 600; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 14px;">
                    No posts to show. Account is currently deactivated.
                </div>`;
        }
        return; 
    }

    document.body.classList.remove('ig-deactivated');
    document.dispatchEvent(new CustomEvent('deactivation-state-changed'));
    
    if (profile.profilePicUrlHD) {
        igProfile.avatar = `${WORKER_URL}?route=image-proxy&url=${encodeURIComponent(profile.profilePicUrlHD)}`;
        new Image().src = igProfile.avatar;
    }
    
    igProfile.bio = (profile.biography && profile.biography.trim() !== '') ? profile.biography : "No bio available.";
    igProfile.name = (profile.fullName && profile.fullName.trim() !== '') ? profile.fullName : (profile.username ? profile.username.replace(/^@/, '') : "Instagram Profile");

    if (activeTab === 'instagram') {
        animateProfileChange(igProfile.avatar, igProfile.name, igProfile.bio);
    }

    const statsMap = {
        'ig-posts': profile.postsCount,
        'ig-followers': profile.followersCount,
        'ig-following': profile.followsCount
    };

    for (const [id, value] of Object.entries(statsMap)) {
        const el = $(id);
        if (el) el.textContent = value ?? '--';
    }

    const postsGrid = document.querySelector('.ig-posts-grid');
    if (postsGrid && profile.latestPosts) {
        postsGrid.innerHTML = profile.latestPosts.slice(0, 6).map(post => {
            const proxyImageUrl = `${WORKER_URL}?route=image-proxy&url=${encodeURIComponent(post.displayUrl)}`;
            const dateStr = post.timestamp ? new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "";
            
            let snippet = post.caption ? post.caption.trim() : '';
            if (snippet.length > 40) snippet = snippet.substring(0, 40).trim() + '...';
            if (!snippet) snippet = 'Instagram Post';

            return `
                <a href="${post.url}" target="_blank" class="ig-post-item" style="display: block; position: relative; overflow: hidden; border-radius: 8px; aspect-ratio: 1/1; text-decoration: none; background: #111;">
                    <img src="${proxyImageUrl}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block; border: none; padding: 0; margin: 0;" alt="Instagram Post">
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 30px 12px 10px; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%); color: white; font-size: 11px; display: flex; flex-direction: column; gap: 3px; box-sizing: border-box; pointer-events: none;">
                        ${dateStr ? `<span style="opacity: 0.7; font-weight: 600; font-size: 10px; letter-spacing: 0.5px;">${dateStr.toUpperCase()}</span>` : ''}
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0px 1px 2px rgba(0,0,0,0.8);">${snippet}</span>
                    </div>
                    <div class="ig-post-overlay" style="opacity: 0; transition: opacity 0.2s ease-in-out; background: rgba(0,0,0,0.65); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); width: 100%; height: 100%; position: absolute; top: 0; left: 0; display: flex; align-items: center; justify-content: center; gap: 15px; color: white; font-weight: bold; font-size: 14px;">
                        <span>🤍 ${post.likesCount || 0}</span>
                        <span>💬 ${post.commentsCount || 0}</span>
                    </div>
                </a>`;
        }).join('');

        $$('.ig-post-item').forEach(item => {
            item.addEventListener('mouseenter', e => e.currentTarget.querySelector('.ig-post-overlay').style.opacity = '1');
            item.addEventListener('mouseleave', e => e.currentTarget.querySelector('.ig-post-overlay').style.opacity = '0');
        });
    }
}