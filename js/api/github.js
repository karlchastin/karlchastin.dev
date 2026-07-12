import { $ } from "../utils/dom.js";
import { profiles } from "../config.js";

const GITHUB_API_URL = "https://api.github.com/users/karlchastin";

const fetchUser = async () => {
  const res = await fetch(GITHUB_API_URL);
  if (!res.ok) throw new Error("Failed to fetch GitHub profile");
  return await res.json();
};

export async function prefetchGitHubProfile() {
  try {
    const user = await fetchUser();
    profiles.github.name = user.name || user.login;
    profiles.github.avatar = user.avatar_url;
    profiles.github.bio = user.bio || "No bio available.";

    const ghchartImg = new Image();
    ghchartImg.src = "https://ghchart.rshah.org/ff0000/karlchastin";
    const badgeImg = new Image();
    badgeImg.src = "https://github.githubassets.com/images/modules/profile/achievements/public-sponsor-default.png";
  } catch (e) {
    console.error("Prefetch Error:", e);
  }
}

export async function updateGitHubData() {
  const githubStats = $("github-stats-wrapper");
  const cachedHTML = localStorage.getItem("githubData");

  if (cachedHTML && !githubStats.innerHTML.includes("github-stats")) {
    githubStats.innerHTML = cachedHTML;
  } else if (!cachedHTML && !githubStats.innerHTML.includes("github-stats")) {
    githubStats.innerHTML =
      '<div style="text-align:center; padding: 20px; color: #888; font-weight: 700;">Fetching live stats...</div>';
  }

  try {
    const user = await fetchUser();

    const stats = [
      {
        url: "https://github.com/karlchastin?tab=followers",
        icon: `<svg width="48" height="48" viewBox="0 0 328 328" fill="currentColor"><path d="M177.75,64.001C177.75,29.4,149.601,1.25,115,1.25c-34.602,0-62.75,28.15-62.75,62.751S80.398,126.75,115,126.75C149.601,126.75,177.75,98.602,177.75,64.001z"/><path d="M228.606,181.144c-5.858-5.857-15.355-5.858-21.214-0.001c-5.857,5.857-5.857,15.355,0,21.214l19.393,19.396l-19.393,19.391c-5.857,5.857-5.857,15.355,0,21.214c2.93,2.929,6.768,4.394,10.607,4.394c3.838,0,7.678-1.465,10.605-4.393l30-29.998c2.813-2.814,4.395-6.629,4.395-10.607c0-3.978-1.58-7.793-4.394-10.607L228.606,181.144z"/><path d="M223,116.75c-34.488,0-65.145,16.716-84.298,42.47c-7.763-1.628-15.694-2.47-23.702-2.47c-63.412,0-115,51.589-115,115c0,8.284,6.715,15,15,15h125.596c19.246,24.348,49.03,40,82.404,40c57.896,0,105-47.103,105-105C328,163.854,280.896,116.75,223,116.75z M223,296.75c-41.356,0-75-33.645-75-75s33.644-75,75-75c41.354,0,75,33.645,75,75S264.354,296.75,223,296.75z"/></svg>`,
        value: user.followers,
        label: "Followers",
      },
      {
        url: "https://github.com/karlchastin?tab=following",
        icon: `<svg width="48" height="48" viewBox="0 0 328 328" fill="currentColor"><path d="M52.25,64.001c0,34.601,28.149,62.749,62.75,62.749c34.602,0,62.751-28.148,62.751-62.749S149.602,1.25,115,1.25C80.399,1.25,52.25,29.4,52.25,64.001z"/><path d="M217.394,262.357c2.929,2.928,6.768,4.393,10.606,4.393c3.839,0,7.678-1.465,10.607-4.394c5.857-5.858,5.857-15.356-0.001-21.214l-19.393-19.391l19.395-19.396c5.857-5.858,5.857-15.356-0.001-21.214c-5.858-5.857-15.356-5.856-21.214,0.001l-30,30.002c-2.813,2.814-4.393,6.629-4.393,10.607c0,3.979,1.58,7.794,4.394,10.607L217.394,262.357z"/><path d="M15,286.75h125.596c19.246,24.348,49.031,40,82.404,40c57.896,0,105-47.103,105-105c0-57.896-47.104-105-105-105c-34.488,0-65.145,16.716-84.297,42.47c-7.764-1.628-15.695-2.47-23.703-2.47c-63.411,0-115,51.589-115,115C0,280.034,6.716,286.75,15,286.75z M223,146.75c41.355,0,75,33.645,75,75s-33.645,75-75,75s-75-33.645-75-75S181.644,146.75,223,146.75z"/></svg>`,
        value: user.following,
        label: "Following",
      },
      {
        url: "https://github.com/karlchastin?tab=repositories&q=&type=public&language=&sort=stargazers",
        icon: `<svg width="48" height="48" viewBox="0 0 512 512" fill="currentColor"><path d="M503.58,126.2a16.85,16.85,0,0,0-27.07-4.55L425.36,172.8h0a11.15,11.15,0,0,1-15.66,0l-22.48-22.48a11.17,11.17,0,0,1,0-15.67L438.1,83.76a16.85,16.85,0,0,0-5.27-27.4c-39.71-17-89.08-7.45-120,23.29-26.81,26.61-34.83,68-22,113.7a11,11,0,0,1-3.16,11.1L114.77,365.1a56.76,56.76,0,1,0,80.14,80.18L357,272.08a11,11,0,0,1,10.9-3.17c45,12,86,4,112.43-22,15.2-15,25.81-36.17,29.89-59.71C514.05,165,511.63,142.76,503.58,126.2Z"/><path d="M437.33,378.41c-13.94-11.59-43.72-38.4-74.07-66.22L297.19,382.8c28.24,30,53.8,57.85,65,70.88l.07.08A30,30,0,0,0,383.72,464l1.1,0a30.11,30.11,0,0,0,21-8.62l.07-.07,33.43-33.37a29.46,29.46,0,0,0-2-43.53Z"/><path d="M118.54,214.55a20.48,20.48,0,0,0-3-10.76,2.76,2.76,0,0,1,2.62-4.22h.06c.84.09,5.33.74,11.7,4.61,4.73,2.87,18.23,12.08,41.73,35.54a34.23,34.23,0,0,0,7.22,22.12l66.23-61.55a33.73,33.73,0,0,0-21.6-9.2,2.65,2.65,0,0,1-.21-.26l-.65-.69L198.1,156.3a28.45,28.45,0,0,1-4-26.11,35.23,35.23,0,0,1,11.78-16.35c5.69-4.41,18.53-9.72,29.44-10.62a52.92,52.92,0,0,1,15.19.94,65.57,65.57,0,0,1,7.06,2.13,15.46,15.46,0,0,0,2.15.63,16,16,0,0,0,16.38-25.06c-.26-.35-1.32-1.79-2.89-3.73a91.85,91.85,0,0,0-9.6-10.36c-8.15-7.36-29.27-19.77-57-19.77a123.13,123.13,0,0,0-46.3,9C121.94,72.45,96.84,93.58,85.3,104.79l-.09.09A222.14,222.14,0,0,0,63.7,129.5,27,27,0,0,0,59,141.27a7.33,7.33,0,0,1-7.71,6.17c-.36,0-.73,0-1.09,0a20.65,20.65,0,0,0-14.59,5.9L6.16,182.05l-.32.32a20.89,20.89,0,0,0-.24,28.72c.19.2.37.39.57.58L53.67,258A21,21,0,0,0,68.32,264a20.65,20.65,0,0,0,14.59-5.9l29.46-28.79A20.51,20.51,0,0,0,118.54,214.55Z"/></svg>`,
        value: "4",
        label: "Active<br>Repositories",
      },
      {
        url: "https://github.com/karlchastin?tab=repositories&q=&type=private&language=&sort=stargazers",
        icon: `<svg width="48" height="48" viewBox="0 0 64 64" fill="currentColor"><path d="M52,24h-4v-8c0-8.836-7.164-16-16-16S16,7.164,16,16v8h-4c-2.211,0-4,1.789-4,4v32c0,2.211,1.789,4,4,4h40c2.211,0,4-1.789,4-4V28C56,25.789,54.211,24,52,24z M32,48c-2.211,0-4-1.789-4-4s1.789-4,4-4s4,1.789,4,4S34.211,48,32,48z M40,24H24v-8c0-4.418,3.582-8,8-8s8,3.582,8,8V24z"/></svg>`,
        value: "26",
        label: "Private<br>Repositories",
      },
    ];

    const htmlString = `
            <div class="github-stats">
                ${stats
                  .map(
                    (s) => `
                    <a href="${s.url}" target="_blank" class="stat-box">
                        ${s.icon}
                        <span class="stat-value">${s.value}</span>
                        <span class="stat-label">${s.label}</span>
                    </a>
                `,
                  )
                  .join("")}
            </div>`;

    githubStats.innerHTML = htmlString;
    localStorage.setItem("githubData", htmlString);
  } catch (e) {
    console.error("GitHub Sync Error:", e);
  }
}
