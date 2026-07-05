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

const createGenericCard = (item) => `
    <div class="repo-card">
        <div class="repo-banner" style="background: ${item.banner}"></div>
        <div class="repo-content">
            <div class="repo-name">${item.name}</div>
            ${item.idName ? `<div class="repo-id">${item.idName}</div>` : ""}
            <div class="repo-desc">${item.desc}</div>
            ${
              item.private || !item.url
                ? `<div class="repo-btn btn-private">${item.btnText || "Private Repository"}</div>`
                : `<a href="${item.url}" target="_blank" class="repo-btn btn-view">${item.btnText || "View Repository"}</a>`
            }
        </div>
    </div>`;

export function renderAllComponents() {
  renderList("featured-repo-list", featuredRepos, createGenericCard);
  renderList("featured-server-list", featuredServers, createGenericCard);
  renderList("apple-music-playlists", appleMusicPlaylists, createGenericCard);

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
