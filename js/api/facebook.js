import { $ } from '../utils/dom.js';
import { profiles } from '../config.js';

export let cachedFbData = null;

export async function loadFacebookData() {
    const workerUrl = `https://steam-proxy.karlchastin-personal.workers.dev/?route=facebook`;

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) throw new Error('Failed to fetch FB data from Worker');
        
        const data = await response.json();
        if (data && data.length > 0) {
            cachedFbData = data[0];
            updateFacebookUI(cachedFbData);
        }
    } catch (error) {
        console.error("Facebook API Error:", error);
    }
}

document.addEventListener('toggle-fb-deactivation', (e) => {
    if (e.detail.deactivated) {
        updateFacebookUI({ name: "", isDeactivatedMock: true });
    } else if (cachedFbData) {
        updateFacebookUI(cachedFbData);
    }
});

export function updateFacebookUI(profile) {
    if (!profiles.facebook) return;
    const fbProfile = profiles.facebook;
    const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab');

    if (profile.name === "" || profile.name === undefined || profile.isDeactivatedMock) {
        fbProfile.name = "Account Deactivated";
        fbProfile.bio = "This Facebook account is currently deactivated or unavailable.";
        
        document.body.classList.add('fb-deactivated');
        document.dispatchEvent(new CustomEvent('deactivation-state-changed'));

        if (activeTab === 'facebook') {
            const profileName = $('profile-name');
            const profileBio = $('profile-bio');
            
            if (profileName) profileName.textContent = fbProfile.name;
            if (profileBio) profileBio.textContent = fbProfile.bio;
        }

        const followersEl = $('fb-followers');
        if (followersEl) followersEl.textContent = '--';

        return; 
    }

    document.body.classList.remove('fb-deactivated');
    document.dispatchEvent(new CustomEvent('deactivation-state-changed'));

    if (profile.image) {
        fbProfile.avatar = `https://steam-proxy.karlchastin-personal.workers.dev/?route=image-proxy&url=${encodeURIComponent(profile.image)}`;
        new Image().src = fbProfile.avatar;
    }
    
    if (profile.name) fbProfile.name = profile.name;
    fbProfile.bio = profile.intro ? profile.intro : "No bio available.";

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