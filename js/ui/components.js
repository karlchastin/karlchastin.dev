import { $ } from "../utils/dom.js";
import {
  featuredRepos,
  featuredServers,
  appleMusicPlaylists,
  instagramHighlights,
} from "../config.js";
const renderList = (id, data, mapper) => {
  const el = $(id);
  if (el) el.innerHTML = data.map(mapper).join("");
};
const createGenericCard = (
  item,
  fallbackPublic = "View Entry",
  fallbackPrivate = "Private Entry",
) => `
    <div class="featured-card bg-effect-exclude">
        <div class="featured-banner" style="background: ${item.banner}"></div>
        <div class="featured-content">
            <div class="featured-name">${item.name}</div>
            ${item.idName ? `<div class="featured-id">${item.idName}</div>` : ""}
            <div class="featured-desc">${item.desc}</div>
            ${
              item.private || !item.url
                ? `<div class="featured-btn btn-private">${item.btnText || fallbackPrivate}</div>`
                : `<a href="${item.url}" target="_blank" class="featured-btn btn-view">${item.btnText || fallbackPublic}</a>`
            }
        </div>
    </div>`;
export function renderAllComponents() {
  renderList("featured-repo-list", featuredRepos, (item) =>
    createGenericCard(item, "View Repository", "Private Repository"),
  );
  renderList("featured-server-list", featuredServers, (item) =>
    createGenericCard(item, "Join Server", "Private Server"),
  );
  renderList("apple-music-playlists", appleMusicPlaylists, (item) =>
    createGenericCard(item, "View Playlist", "Private Playlist"),
  );
  renderList(
    "ig-highlights-list",
    instagramHighlights,
    (h) => `
        <a href="${h.url}" target="_blank" class="ig-highlight-item">
            <div class="ig-highlight-ring"><img src="${h.preview}" loading="lazy" class="ig-highlight-img" alt="${h.title}" referrerpolicy="no-referrer"></div>
            <span class="ig-highlight-title">${h.title}</span>
        </a>`,
  );
}
