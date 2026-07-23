import { WORKER_URL } from "../config.js";
function getTimeAgoString(isoDate) {
  const past = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - past) / 1000));
  if (diff < 60) return "Just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} minute${m !== 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return `${d} day${d !== 1 ? "s" : ""} ago`;
  }
  if (diff < 2592000) {
    const w = Math.floor(diff / 604800);
    return `${w} week${w !== 1 ? "s" : ""} ago`;
  }
  if (diff < 31536000) {
    const mo = Math.floor(diff / 2592000);
    return `${mo} month${mo !== 1 ? "s" : ""} ago`;
  }
  const yr = Math.floor(diff / 31536000);
  return `${yr} year${yr !== 1 ? "s" : ""} ago`;
}
function startLiveTimer(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const updateTime = el.getAttribute("data-last-update");
  if (!updateTime) return;
  const updateText = () => {
    el.textContent = `Refreshed ${getTimeAgoString(updateTime)}`;
  };
  updateText();
  setInterval(updateText, 60000);
}
export async function updateValorantData() {
  startLiveTimer("val-last-updated");
}
export async function updateApexData() {
  startLiveTimer("apex-last-updated");
}
export async function updateDBDData() {
  try {
    const res = await fetch(`${WORKER_URL}?route=dbd-bhvr`);
    const dbd = await res.json();
    if (dbd && dbd.data && dbd.data["all-time"]) {
      const allTime = dbd.data["all-time"];
      const globalSurv = allTime.global.survivors;
      const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };
      const updateDBDTime = () => {
        const now = new Date();
        let lastUpdate = new Date();
        lastUpdate.setUTCHours(10, 30, 0, 0);
        if (now < lastUpdate) {
          lastUpdate.setUTCDate(lastUpdate.getUTCDate() - 1);
        }
        const diffMs = now - lastUpdate;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);
        let timeString = `${diffHrs} hour${diffHrs !== 1 ? "s" : ""} ago`;
        if (diffHrs === 0) {
          timeString = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
        }
        setText("dbd-last-updated", `Refreshed ${timeString}`);
      };
      updateDBDTime();
      setInterval(updateDBDTime, 60000);
      setText("dbd-hours", globalSurv.totalHoursPlayed.toFixed(1) + " hrs");
      setText("dbd-matches", globalSurv.totalMatchesPlayed.toLocaleString());
      setText(
        "dbd-escape-rate",
        (globalSurv.escapeRate * 100).toFixed(1) + "%",
      );
      setText("dbd-escapes", globalSurv.matchesEscaped.toLocaleString());
      setText("dbd-total-bp", globalSurv.bpEarnedThroughMatch.toLocaleString());
      setText(
        "dbd-avg-bp",
        Math.floor(globalSurv.avgBPEarnedPerMatch).toLocaleString(),
      );
      setText(
        "dbd-heals",
        globalSurv.survivorSuccessfullyHealed.toLocaleString(),
      );
      setText(
        "dbd-times-hooked",
        globalSurv.survivorTimesHooked.toLocaleString(),
      );
      setText("dbd-avg-hooks", globalSurv.avgTimesHooked.toFixed(2));
      setText("dbd-chases-won", globalSurv.survivorChasesWon.toLocaleString());
      setText(
        "dbd-longest-chase",
        globalSurv.survivorLongestChaseTimeInSeconds.toFixed(1) + "s",
      );
    }
  } catch (error) {
    console.error("Failed to fetch Dead By Daylight stats:", error);
  }
}
export async function fetchOverwatchLiveStats(profileUrl) {
  try {
    const res = await fetch(
      `${WORKER_URL}?route=proxy&url=${encodeURIComponent(profileUrl)}`,
    );
    if (!res.ok) throw new Error("Proxy fetch failed");
    const htmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const quickPlaySection = doc.querySelector(".stats.quickPlay-view");
    let searchContext = doc;
    if (quickPlaySection) {
      const targetHeroOption = Array.from(
        quickPlaySection.querySelectorAll(
          'select[data-js="hero-select"] option',
        ),
      ).find((opt) => opt.getAttribute("option-id") === "ALL HEROES");
      if (targetHeroOption) {
        const val = targetHeroOption.value;
        const container = quickPlaySection.querySelector(
          `.stats-container.option-${val}`,
        );
        if (container) searchContext = container;
      }
    }
    const extractStat = (labelRegex) => {
      const nameNodes = Array.from(
        searchContext.querySelectorAll(".stat-item .name"),
      );
      const targetNode = nameNodes.find((node) =>
        labelRegex.test(node.textContent.trim()),
      );
      if (
        targetNode &&
        targetNode.nextElementSibling &&
        targetNode.nextElementSibling.classList.contains("value")
      ) {
        return targetNode.nextElementSibling.textContent.trim();
      }
      return "--";
    };
    const rawTime = extractStat(/^Time Played$/i);
    let hours = "--";
    if (rawTime !== "--") {
      const parts = rawTime.split(":");
      if (parts.length === 3) {
        hours = parts[0];
      } else if (parts.length === 2) {
        hours = "0";
      } else {
        hours = rawTime.replace(/[^0-9]/g, "");
      }
    }
    document.getElementById("ow-hours").textContent =
      hours !== "" ? hours : "0";
    const wonStr = extractStat(/^Games Won$/i).replace(/,/g, "");
    const lostStr = extractStat(/^Games Lost$/i).replace(/,/g, "");
    let winRate = "--";
    const won = parseInt(wonStr, 10);
    const lost = parseInt(lostStr, 10);
    if (!isNaN(won) && !isNaN(lost)) {
      const total = won + lost;
      if (total > 0) {
        winRate = Math.round((won / total) * 100) + "%";
      } else {
        winRate = "0%";
      }
    }
    document.getElementById("ow-win").textContent = winRate;
    const formatHP = (val) => (val !== "--" ? `${val} HP` : "--");
    document.getElementById("ow-total-heals").textContent = formatHP(
      extractStat(/^Healing Done$/i),
    );
    document.getElementById("ow-avg-heals").textContent = formatHP(
      extractStat(/^Healing Done - Avg per 10 Min$/i),
    );
    document.getElementById("ow-most-heals").textContent = formatHP(
      extractStat(/^Healing Done - Most in Game$/i),
    );
    document.getElementById("ow-assists").textContent =
      extractStat(/^Assists$/i);
    document.getElementById("ow-obj-time").textContent =
      extractStat(/^Objective Time$/i);
    document.getElementById("ow-deaths").textContent = extractStat(/^Deaths$/i);
    document.getElementById("ow-games-played").textContent =
      extractStat(/^Games Played$/i);
    const rankWrapper = doc.querySelector(
      ".Profile-playerSummary--rankImageWrapper",
    );
    if (rankWrapper) {
      const rankImages = rankWrapper.querySelectorAll(
        "img.Profile-playerSummary--rank",
      );
      if (rankImages.length >= 2) {
        const tierSrc = rankImages[0].getAttribute("src");
        const divSrc = rankImages[1].getAttribute("src");
        document.getElementById("ow-rank-tier-icon").src = tierSrc;
        document.getElementById("ow-rank-div-icon").src = divSrc;
        let tierName = "Unranked";
        let divNumber = "";
        const tierMatch = tierSrc.match(/Rank_([A-Za-z]+)Tier/i);
        if (tierMatch) tierName = tierMatch[1];
        const divMatch = divSrc.match(/TierDivision_(\d+)/i);
        if (divMatch) divNumber = divMatch[1];
        document.getElementById("ow-rank-name").textContent =
          `${tierName} ${divNumber}`.trim();
      }
    } else {
      document.getElementById("ow-rank-name").textContent = "Unranked";
      document.getElementById("ow-rank-tier-icon").style.display = "none";
      document.getElementById("ow-rank-div-icon").style.display = "none";
    }
    document.getElementById("ow-last-updated").textContent =
      "Live stats synced";
  } catch (error) {
    console.error("Failed to fetch Overwatch stats:", error);
    document.getElementById("ow-last-updated").textContent = "Failed to sync";
  }
}
