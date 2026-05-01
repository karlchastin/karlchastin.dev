import { $ } from '../utils/dom.js';
import { profiles } from '../config.js';

export async function loadFacebookData() {
    const workerUrl = `https://steam-proxy.karlchastin-personal.workers.dev/?route=facebook&_cb=${Date.now()}`;

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) throw new Error('Failed to fetch FB data from Worker');
        
        const data = await response.json();
        if (data && data.length > 0) updateFacebookUI(data[0]);
    } catch (error) {
        console.error("Facebook API Error:", error);
    }
}

function updateFacebookUI(profile) {
    if (!profiles.facebook) return;
    const fbProfile = profiles.facebook;
    
    if (profile.image) {
        fbProfile.avatar = `https://steam-proxy.karlchastin-personal.workers.dev/?route=image-proxy&url=${encodeURIComponent(profile.image)}`;
        new Image().src = fbProfile.avatar;
    }
    
    if (profile.name) fbProfile.name = profile.name;
    fbProfile.bio = profile.intro ? profile.intro : "No bio available.";

    const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab');
    if (activeTab === 'facebook') {
        const avatarImg = $('avatar-img');
        const profileName = $('profile-name');
        const profileBio = $('profile-bio');
        
        if (avatarImg) avatarImg.src = fbProfile.avatar;
        if (profileName) profileName.textContent = fbProfile.name;
        if (profileBio) profileBio.textContent = fbProfile.bio;
    }

    const followersEl = $('fb-followers');
    if (followersEl && profile.followers !== undefined) {
        followersEl.textContent = profile.followers.toLocaleString();
    }
}