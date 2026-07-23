import { $ } from "../utils/dom.js";
import { profiles, WORKER_URL } from "../config.js";
export let cachedFbData = null;
export async function loadFacebookData() {
  const workerUrl = `${WORKER_URL}?route=facebook`;
  try {
    const response = await fetch(workerUrl);
    if (!response.ok) throw new Error("Failed to fetch FB data from Worker");
    const data = await response.json();
    if (data && data.length > 0) {
      cachedFbData = data[0];
      updateFacebookUI(cachedFbData);
    } else {
      updateFacebookUI({ name: "" });
    }
  } catch (error) {
    console.error("Facebook API Error:", error);
    updateFacebookUI({ name: "" });
  }
}
document.addEventListener("toggle-fb-deactivation", (e) => {
  if (e.detail.deactivated) {
    updateFacebookUI({ name: "" });
  } else if (cachedFbData) {
    updateFacebookUI(cachedFbData);
  }
});
export function updateFacebookUI(profile) {
  if (!profiles.facebook) return;
  const fbProfile = profiles.facebook;
  const activeTab = document
    .querySelector(".tab.active")
    ?.getAttribute("data-tab");
  const animateProfileChange = (avatarUrl, nameText, bioText) => {
    const avatarImg = $("avatar-img");
    const profileName = $("profile-name");
    const profileBio = $("profile-bio");
    const isSameAvatar =
      !avatarImg ||
      !avatarUrl ||
      avatarImg.src === avatarUrl ||
      avatarImg.getAttribute("src") === avatarUrl;
    if (avatarImg && !isSameAvatar) avatarImg.style.opacity = "0";
    if (profileName) {
      profileName.style.transition = "opacity 0.15s ease";
      profileName.style.opacity = "0";
    }
    if (profileBio) {
      profileBio.style.transition = "opacity 0.15s ease";
      profileBio.style.opacity = "0";
    }
    setTimeout(() => {
      if (avatarImg && !isSameAvatar) {
        avatarImg.src = avatarUrl;
        avatarImg.style.opacity = "1";
      }
      if (profileName) {
        profileName.textContent = nameText;
        profileName.style.opacity = "1";
      }
      if (profileBio) {
        profileBio.innerHTML = bioText;
        profileBio.style.opacity = "1";
      }
    }, 150);
  };
  if (!profile || profile.name === "" || profile.name === undefined) {
    fbProfile.name = "Account Deactivated";
    fbProfile.bio =
      "This Facebook account is currently deactivated or unavailable.";
    document.body.classList.add("fb-deactivated");
    document.dispatchEvent(new CustomEvent("deactivation-state-changed"));
    if (activeTab === "facebook") {
      animateProfileChange(null, fbProfile.name, fbProfile.bio);
    }
    const followersEl = $("fb-followers");
    if (followersEl) followersEl.textContent = "--";
    return;
  }
  document.body.classList.remove("fb-deactivated");
  document.dispatchEvent(new CustomEvent("deactivation-state-changed"));
  if (profile.image) {
    fbProfile.avatar = `${WORKER_URL}?route=image-proxy&url=${encodeURIComponent(profile.image)}`;
    new Image().src = fbProfile.avatar;
  }
  if (profile.name) fbProfile.name = profile.name;
  fbProfile.bio =
    profile.intro && profile.intro.trim() !== ""
      ? profile.intro
      : "No bio available.";
  if (activeTab === "facebook") {
    animateProfileChange(fbProfile.avatar, fbProfile.name, fbProfile.bio);
  }
  const followersEl = $("fb-followers");
  if (followersEl && profile.followers !== undefined) {
    let num = parseInt(profile.followers, 10);
    if (!isNaN(num)) {
      if (num >= 1000) {
        followersEl.textContent =
          (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
      } else {
        followersEl.textContent = num.toString();
      }
    } else {
      followersEl.textContent = "--";
    }
  }
}
