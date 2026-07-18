import { formatElapsed } from "../utils/core.js";
import { createScrollText, scrollObserver } from "../ui/scroll.js";
import { DISCORD_ID, discordBadges, profiles } from "../config.js";

let activeTimers = [];
let lanyardWs;
let heartbeatInterval;
let reconnectAttempts = 0;
let lastKnownStatusState = "";

export function connectLanyard() {
  if (DISCORD_ID === "YOUR_18_DIGIT_ID_HERE") return;

  if (
    lanyardWs &&
    (lanyardWs.readyState === WebSocket.OPEN ||
      lanyardWs.readyState === WebSocket.CONNECTING)
  )
    return;

  lanyardWs = new WebSocket("wss://api.lanyard.rest/socket");

  lanyardWs.onopen = () => {
    reconnectAttempts = 0;
  };

  lanyardWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.op === 1) {
      lanyardWs.send(
        JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }),
      );

      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        if (lanyardWs.readyState === WebSocket.OPEN)
          lanyardWs.send(JSON.stringify({ op: 3 }));
      }, msg.d.heartbeat_interval);
    } else if (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE") {
      updateDiscordUI(msg.d);
    }
  };

  lanyardWs.onclose = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    const delay =
      reconnectAttempts === 0
        ? 500
        : Math.min(10000, 1000 * Math.pow(2, reconnectAttempts));
    reconnectAttempts++;
    setTimeout(connectLanyard, delay);
  };
}

document.addEventListener("visibilitychange", () => {
  if (
    !document.hidden &&
    lanyardWs &&
    lanyardWs.readyState !== WebSocket.OPEN &&
    lanyardWs.readyState !== WebSocket.CONNECTING
  ) {
    connectLanyard();
  }
});

function updateDiscordUI(data) {
  if (window.isAppAnimating && window.isAppAnimating()) {
    setTimeout(() => updateDiscordUI(data), 150);
    return;
  }

  activeTimers = [];
  const user = data.discord_user;

  let avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${user.discriminator === "0" || user.discriminator === "0000" ? Number(BigInt(user.id) >> 22n) % 6 : parseInt(user.discriminator) % 5}.png`;

  profiles.discord.avatar = avatarUrl;
  profiles.discord.name = user.global_name || user.username;
  profiles.discord.username = `@${user.username}`;

  if (
    document.querySelector(".tab.active")?.getAttribute("data-tab") ===
    "discord"
  ) {
    const avatarImg = document.getElementById("avatar-img");
    const profileName = document.getElementById("profile-name");
    const profileUsername = document.getElementById("profile-username");
    if (avatarImg) avatarImg.src = avatarUrl;
    if (profileName) profileName.textContent = profiles.discord.name;
    if (profileUsername)
      profileUsername.textContent = profiles.discord.username;
  }

  const badgeContainer = document.getElementById("discord-badges-container");
  if (badgeContainer) {
    badgeContainer.innerHTML = discordBadges
      .map((b) => {
        let tt = b.name;
        if (b.desc) tt += `<span class='tt-desc'>${b.desc}</span>`;
        return `<div class="achievement-badge bg-effect-exclude" data-tooltip="${tt.replace(/"/g, "&quot;")}"><img src="${b.icon}" alt="${b.name.replace(/"/g, "&quot;")}" onerror="this.style.display='none'"></div>`;
      })
      .join("");
  }

  let baseStatus = data.discord_status || "offline";
  let isMobile =
    data.active_on_discord_mobile &&
    !data.active_on_discord_desktop &&
    !data.active_on_discord_web;
  let statusText =
    {
      online: isMobile ? "Active on Mobile" : "Online",
      idle: isMobile ? "Idle from Mobile" : "Idle",
      dnd: "Do Not Disturb",
      offline: "Offline",
    }[baseStatus] || "Offline";

  let discordSvg = `<svg viewBox="0 0 1765 280" fill="currentColor" style="height: 0.8em; width: auto; vertical-align: -0.03em; margin: 0 0.2em; overflow: visible;"><path d="M230.069 32.2449C206.29 21.5492 177.259 16.2013 142.88 16.2013H0.397217V272.04H132.662C169.906 272.04 201.134 266.31 226.345 254.85C249.36 245.301 268.937 229.066 282.689 208.247C295.008 188.575 301.406 165.751 301.12 142.545C301.502 119.434 295.39 96.706 283.357 76.9379C270.561 56.9789 251.938 41.3172 230.069 32.1494V32.2449ZM184.612 189.625C172.198 201.181 154.435 207.006 131.229 207.006H91.7886V81.3308H136.386C158.733 81.3308 175.54 86.9652 186.713 97.9474C198.078 109.789 204.094 125.833 203.33 142.354C204.19 160.116 197.409 177.306 184.708 189.721L184.612 189.625ZM669.455 161.358C681.106 171.767 686.931 187.047 687.026 207.197C687.408 228.684 676.331 248.834 657.899 260.007C638.704 272.899 611.201 279.393 575.485 279.298C554.953 279.298 534.516 276.719 514.653 271.658C495.84 266.978 477.886 259.434 461.27 249.407V188.766C475.785 199.271 492.02 207.006 509.305 211.59C528.214 217.32 547.886 220.376 567.654 220.471C574.435 220.853 581.31 219.612 587.613 217.033C592.102 214.741 594.298 211.781 594.298 208.82C594.393 205.382 593.057 202.136 590.669 199.653C586.467 196.501 581.597 194.305 576.44 193.445L532.607 183.609C507.491 177.784 489.633 169.666 479.128 159.352C468.432 148.561 462.702 133.759 463.466 118.575C463.275 105.014 468.241 91.8356 477.313 81.7128C488.104 70.2531 501.761 61.9448 516.754 57.4564C536.14 51.3445 556.385 48.4796 576.726 48.8616C595.73 48.6706 614.639 50.867 632.975 55.4509C647.872 58.9843 662.101 64.6187 675.376 72.2585V129.653C662.961 122.49 649.591 116.951 635.744 113.418C620.656 109.407 605.089 107.306 589.523 107.306C566.604 107.306 555.144 111.222 555.144 118.957C555.144 122.49 557.149 125.737 560.396 127.17C566.699 129.844 573.193 131.754 579.878 132.804L616.454 139.393C640.137 143.595 657.899 150.853 669.55 161.358H669.455ZM912.019 203.568C922.715 200.512 932.933 196.119 942.483 190.58V255.328C914.216 271.753 881.937 280.157 849.277 279.489C823.111 280.157 797.04 274.905 773.261 264.018C753.684 255.041 737.258 240.526 725.894 222.286C715.294 204.332 709.85 183.895 710.232 163.077C709.946 142.258 715.676 121.822 726.658 104.25C738.404 86.2967 755.212 72.163 774.884 63.5682C798.854 53.159 824.734 48.0976 850.901 48.7661C887.476 48.7661 917.749 56.4059 941.91 71.781V138.725C932.742 132.518 922.715 127.743 912.115 124.496C900.273 120.771 887.954 118.957 875.539 119.052C852.906 119.052 835.143 123.159 822.347 131.467C804.393 141.494 797.899 164.223 807.927 182.272C811.174 188.097 816.044 192.968 821.774 196.406C834.189 204.809 852.238 209.011 875.826 209.011C888.049 209.011 900.177 207.292 911.828 203.759L912.019 203.568ZM1182.56 63.4727C1134.53 43.9912 1080.76 43.9912 1032.73 63.4727C1013.15 72.0675 996.535 86.1057 984.693 103.868C973.52 121.44 967.694 141.781 968.076 162.599C967.79 183.609 973.615 204.332 984.693 222.19C996.439 240.43 1013.25 254.946 1033.01 263.923C1080.76 284.264 1134.72 284.264 1182.47 263.827C1202.14 254.85 1218.85 240.335 1230.5 222.095C1241.49 204.141 1247.22 183.513 1246.93 162.504C1247.31 141.685 1241.58 121.249 1230.5 103.677C1218.76 86.0102 1202.14 71.972 1182.66 63.4727H1182.56ZM1143.98 199.08C1134.15 208.343 1120.97 213.213 1107.41 212.354C1093.94 213.022 1080.76 208.247 1070.83 199.08C1061.76 189.625 1056.89 176.924 1057.56 163.745C1056.89 150.758 1061.76 138.152 1070.83 128.889C1080.76 119.816 1093.94 115.233 1107.41 115.901C1120.87 115.137 1134.05 119.816 1143.98 128.889C1153.15 138.152 1158.02 150.758 1157.35 163.745C1157.93 176.829 1153.15 189.625 1143.98 199.08ZM1433.25 53.3499C1444.9 53.0635 1456.45 56.0239 1466.48 62.1357V141.208C1455.59 134.714 1442.99 131.563 1430.29 132.04C1410.8 132.04 1395.81 137.961 1385.31 149.803C1374.9 161.644 1369.64 179.98 1369.64 204.809V272.04H1280.07V58.2203H1367.73V126.119C1372.61 101.29 1380.44 82.9543 1391.32 71.1126C1402.02 59.3663 1417.2 52.8725 1433.06 53.3499H1433.25ZM1674.47 8.84799V104.155C1659.86 67.1016 1631.21 48.5751 1588.62 48.5751C1569.14 48.2886 1549.94 53.4455 1533.23 63.5682C1517 73.691 1503.91 88.1111 1495.61 105.301C1486.53 124.114 1482.05 144.741 1482.71 165.56C1482.33 185.71 1486.53 205.573 1494.94 223.909C1502.58 240.43 1514.8 254.564 1530.08 264.496C1545.93 274.523 1564.36 279.68 1583.08 279.298C1603.04 279.871 1622.71 275 1640 265.069C1655.66 255.423 1667.79 241.003 1674.57 223.909V271.944H1764.15V8.84799H1674.57H1674.47ZM1661.3 197.838C1651.36 207.006 1638.18 211.685 1624.72 210.921C1611.54 211.59 1598.65 206.815 1588.91 197.838C1579.74 188.957 1574.77 176.542 1575.25 163.745C1574.77 151.044 1579.64 138.82 1588.81 129.939C1609.92 112.75 1640.19 112.75 1661.3 129.939C1670.46 138.534 1675.43 150.662 1675.05 163.268C1675.52 176.16 1670.56 188.766 1661.3 197.838ZM421.256 40.9352C421.256 63.0907 401.297 81.0443 376.659 81.0443C352.02 81.0443 332.061 63.0907 332.061 40.9352C332.061 18.7798 352.02 0.826172 376.659 0.826172C401.297 0.826172 421.256 18.7798 421.256 40.9352ZM421.256 108.643V273.186H331.966V108.643C360.519 120.676 392.702 120.676 421.256 108.643Z"/></svg>`;

  let tooltipText = "";
  if (baseStatus === "dnd") {
    tooltipText = `Casual conversations will not be entertained.<span class='tt-desc'>Work, academic, and emergency related matters will be prioritized.</span>`;
  } else if (baseStatus === "idle") {
    tooltipText = `Notifications and updates are received.<span class='tt-desc'>Will be entertained as soon as possible.</span>`;
  } else if (baseStatus === "online" && isMobile) {
    tooltipText = `Actively checking messages on ${discordSvg}.`;
  }

  let currentStateString = baseStatus + isMobile + tooltipText;
  if (
    lastKnownStatusState !== "" &&
    lastKnownStatusState !== currentStateString
  ) {
    const tooltip = document.getElementById("custom-tooltip");
    if (tooltip) tooltip.classList.remove("show");
  }
  lastKnownStatusState = currentStateString;

  let overrideCircle =
    baseStatus === "dnd" || (isMobile && baseStatus !== "offline");

  let iconHTML = "";
  if (baseStatus === "dnd") {
    iconHTML = `<span style="display: flex; align-items: center; justify-content: center; width: 10px; height: 10px; flex-shrink: 0;"><svg viewBox="0 0 20 20" fill="currentColor" style="width: 100%; height: 100%;"><defs><mask id="svg-mask-status-dnd"><rect width="20" height="20" fill="white"></rect><rect width="12" height="4" x="4" y="8" fill="black" rx="2"></rect></mask></defs><rect width="20" height="20" fill="currentColor" mask="url(#svg-mask-status-dnd)" rx="10"></rect></svg></span>`;
  } else if (overrideCircle) {
    iconHTML = `<span style="display: flex; align-items: center; justify-content: center; width: 10px; height: 10px; flex-shrink: 0;"><svg viewBox="0 0 20 30" fill="currentColor" style="width: 10px; height: auto; overflow: visible;"><defs><mask id="svg-mask-status-online-mobile"><rect width="20" height="30" fill="white"></rect><rect width="14" height="18" x="3" y="4" fill="black" rx="1"></rect><circle cx="10" cy="26" r="1.5" fill="black"></circle></mask></defs><rect width="20" height="30" fill="currentColor" mask="url(#svg-mask-status-online-mobile)" rx="4"></rect></svg></span>`;
  }

  let safeTooltipHTML = tooltipText.replace(/"/g, "&quot;");

  let questionMarkHTML =
    tooltipText !== ""
      ? `<svg data-tooltip="${safeTooltipHTML}" class="status-tooltip-icon" height="28" viewBox="0 0 24 24" fill="#ff0000" style="cursor: help; flex-shrink: 0; display: block; opacity: 0.8; transition: opacity 0.2s;"><g><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a3.5 3.5 0 0 0-3.5 3.5 1 1 0 0 0 2 0A1.5 1.5 0 1 1 12 11a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-1.16A3.49 3.49 0 0 0 12 6z"/><circle cx="12" cy="17" r="1"/></g></svg>`
      : "";

  ["discord-live-status"].forEach((id) => {
    const statusEl = document.getElementById(id);
    if (!statusEl) return;
    const rowEl = statusEl.parentElement;
    rowEl.style.alignItems = "center";
    rowEl.style.gap = "8px";

    statusEl.innerHTML = overrideCircle
      ? `${iconHTML}<span>${statusText}</span>`
      : `<span>${statusText}</span>`;
    statusEl.className = `discord-status ${baseStatus} ${overrideCircle ? "mobile-status" : ""} bg-effect-exclude`;

    const oldQm = rowEl.querySelector(".status-tooltip-icon");
    if (questionMarkHTML) {
      if (oldQm) oldQm.setAttribute("data-tooltip", tooltipText);
      else rowEl.insertAdjacentHTML("beforeend", questionMarkHTML);
    } else if (oldQm) {
      oldQm.remove();
    }
  });

  let activitiesList = [];
  if (data.activities) {
    data.activities
      .filter((a) => a.type !== 4)
      .forEach((activity, i) => {
        let isAppleMusic = activity.name === "Apple Music";
        let isSpotify = activity.name === "Spotify" || activity.id === "spotify";
        let isListening = activity.type === 2 || isAppleMusic || isSpotify;
        let isWatching = activity.type === 3;
        
        let typeCategory = "playing";
        if (isListening) typeCategory = "listening";
        else if (isWatching) typeCategory = "watching";

        let title = "PLAYING";
        if (typeCategory === "listening") {
          title = `LISTENING TO`;
        } else if (typeCategory === "watching") {
          title = `WATCHING`;
        } else {
          title = `PLAYING`;
        }
        let titleColor = "#ff0000";

        let largeImgTooltip = activity.assets?.large_text
          ? `data-tooltip="${activity.assets.large_text.replace(/"/g, "&quot;")}"`
          : activity.name
            ? `data-tooltip="${activity.name.replace(/"/g, "&quot;")}"`
            : "";

        let fallbackSvg =
          "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23888888' fill-rule='evenodd' clip-rule='evenodd' d='M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5Zm6.81 7c-.54 0-1 .26-1.23.61A1 1 0 0 1 8.92 8.5 3.49 3.49 0 0 1 11.82 7c1.81 0 3.43 1.38 3.43 3.25 0 1.45-.98 2.61-2.27 3.06a1 1 0 0 1-1.96.37l-.19-1a1 1 0 0 1 .98-1.18c.87 0 1.44-.63 1.44-1.25S12.68 9 11.81 9ZM13 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm7-10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM7 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5.5 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'/%3E%3C/svg%3E";
        let largeImgHTML = `<div ${largeImgTooltip} style="width:100%; height:100%; background: rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; cursor:default;"><img src="${fallbackSvg}" style="width:50%; height:50%; opacity:0.8; object-fit:cover;"></div>`;

        let smallImgHTML = typeCategory === "listening"
          ? `<div style="position:absolute; bottom:-4px; right:-4px; width:28px; height:28px; border-radius:50%; border:3px solid #1e1e1e; background:#fa243c; display:flex; align-items:center; justify-content:center; pointer-events:auto; cursor:default; z-index:10;"><svg width="50%" height="50%" viewBox="0 0 24 24" fill="#fff"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>`
          : "";

        let imgUrl = null;
        if (data.spotify && activity.name === "Spotify") {
          imgUrl = data.spotify.album_art_url;
        } else if (activity.assets && activity.assets.large_image) {
          imgUrl = activity.assets.large_image.startsWith("mp:")
            ? `https://media.discordapp.net/${activity.assets.large_image.replace("mp:", "")}`
            : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
        } else if (activity.application_id) {
          imgUrl = `https://dcdn.dstn.to/app-icons/${activity.application_id}?size=256`;
        }

        if (imgUrl) {
          largeImgHTML = `<img src="${imgUrl}" ${largeImgTooltip} style="width:100%; height:100%; object-fit:cover; opacity:0; cursor:default;">`;
        }

        if (activity.assets?.small_image) {
          let smallUrl = activity.assets.small_image.startsWith("mp:")
            ? `https://media.discordapp.net/${activity.assets.small_image.replace("mp:", "")}`
            : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`;
          let smallImgTooltip = activity.assets.small_text
            ? `data-tooltip="${activity.assets.small_text.replace(/"/g, "&quot;")}"`
            : "";
          smallImgHTML = `<img src="${smallUrl}" ${smallImgTooltip} style="position:absolute; bottom:-4px; right:-4px; width:28px; height:28px; border-radius:50%; border:3px solid #1e1e1e; background:#1e1e1e; opacity:0; pointer-events:auto; cursor:default; object-fit:cover; z-index:10;">`;
        }

        let timeNode = "";
        let timeHash = "none";
        const safeId = activity.id
          ? activity.id.toString().replace(/[^a-zA-Z0-9]/g, "-")
          : i;
        const tId = `timer-${safeId}`;

        if (activity.timestamps) {
          const now = Date.now();
          if (activity.timestamps.end) {
            const elapsedMs = Math.max(0, now - activity.timestamps.start);
            const totalMs = activity.timestamps.end - activity.timestamps.start;
            const perc = Math.min(100, (elapsedMs / totalMs) * 100);

            timeNode = `
                        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                            <span class="${tId}-elapsed" style="font-size:11px; color:#aaa; font-family:monospace; font-weight:600;">${formatElapsed(elapsedMs)}</span>
                            <div style="flex:1; height:4px; background:rgba(255,255,255,0.2); border-radius:2px; overflow:hidden;"><div class="${tId}-bar" style="width:${perc}%; height:100%; background:${titleColor};"></div></div>
                            <span class="${tId}-total" style="font-size:11px; color:#aaa; font-family:monospace; font-weight:600;">${formatElapsed(totalMs)}</span>
                        </div>`;
            activeTimers.push({
              id: tId,
              start: activity.timestamps.start,
              end: activity.timestamps.end,
              type: "progress",
              els: null,
            });
            timeHash =
              activity.timestamps.start + "-" + activity.timestamps.end;
          } else {
            let iconPath = `<path fill-rule="evenodd" clip-rule="evenodd" d="M20.97 4.06c0 .18.08.35.24.43.55.28.9.82 1.04 1.42.3 1.24.75 3.7.75 7.09v4.91a3.09 3.09 0 0 1-5.85 1.38l-1.76-3.51a1.09 1.09 0 0 0-1.23-.55c-.57.13-1.36.27-2.16.27s-1.6-.14-2.16-.27c-.49-.11-1 .1-1.23.55l-1.76 3.51A3.09 3.09 0 0 1 1 17.91V13c0-3.38.46-5.85.75-7.1.15-.6.49-1.13 1.04-1.4a.47.47 0 0 0 .24-.44c0-.7.48-1.32 1.2-1.47l2.93-.62c.5-.1 1 .06 1.36.4.35.34.78.71 1.28.68a42.4 42.4 0 0 1 4.4 0c.5.03.93-.34 1.28-.69.35-.33.86-.5 1.36-.39l2.94.62c.7.15 1.19.78 1.19 1.47ZM20 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.5 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 7a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2H7v1a1 1 0 1 1-2 0v-1H4a1 1 0 1 1 0-2h1V7Z"/>`;
            if (typeCategory === "listening") {
              iconPath = `<path fill="#45a366" d="M8.65 1.51A2 2 0 0 0 6 3.41v9.88A3.98 3.98 0 0 0 4.5 13C2.57 13 1 14.34 1 16s1.57 3 3.5 3S8 17.66 8 16V5.4l11 3.81v7.08a3.98 3.98 0 0 0-1.5-.29c-1.93 0-3.5 1.34-3.5 3s1.57 3 3.5 3 3.5-1.34 3.5-3V7.03c0-.74-.47-1.4-1.18-1.65L8.65 1.51Z" class=""></path>`;
            } else if (typeCategory === "watching") {
              iconPath = `<path fill="var(--text-feedback-positive)" d="M4 3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H4ZM6 20a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H6Z" class=""></path>`;
            }
            timeNode = `
                        <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="color: #23a559; flex-shrink: 0;">${iconPath}</svg>
                            <span class="${tId}-elapsed" style="font-size:12px; color:#23a559; font-weight:800;">${formatElapsed(Math.max(0, now - activity.timestamps.start))} elapsed</span>
                        </div>`;
            activeTimers.push({
              id: tId,
              start: activity.timestamps.start,
              type: "elapsed",
              els: null,
            });
            timeHash = activity.timestamps.start.toString();
          }
        }

        let actName =
          activity.name === "Spotify" && data.spotify
            ? data.spotify.song
            : activity.name;
        let lines =
          activity.name === "Spotify" && data.spotify
            ? [data.spotify.artist, data.spotify.album]
            : [
                activity.details,
                activity.state,
                activity.assets?.large_text,
              ].filter(Boolean);

        let textHTML = `${createScrollText(title, 1, titleColor)}${createScrollText(actName, 2, "")}${lines.map((line) => createScrollText(line, 0, "")).join("")}${timeNode}`;
        let textHash = title + actName + lines.join("|") + timeHash + tId;

        activitiesList.push({
          typeCategory,
          isAppleMusic,
          title,
          actName,
          lines,
          largeImgHTML,
          smallImgHTML,
          textHTML,
          textHash,
          timeNode,
          titleColor,
        });
      });
  }

  activitiesList.sort((a, b) => (a.typeCategory === "playing" ? -1 : 1));

  const preloadAndSwap = (wrap, html) => {
    if (wrap.getAttribute("data-hash") === html) return;
    const imgMatch = html.match(/src="([^"]+)"/);
    if (imgMatch) {
      const tempImg = new Image();
      tempImg.onload = tempImg.onerror = () => {
        if (wrap.getAttribute("data-next-hash") === html) {
          wrap.setAttribute("data-hash", html);
          wrap.innerHTML = html;
          wrap.querySelectorAll("img").forEach((i) => {
            i.style.animation = "none";
            void i.offsetWidth;
            i.style.animation = "lanyardImageFadeIn 0.8s ease forwards";
          });
        }
      };
      wrap.setAttribute("data-next-hash", html);
      tempImg.src = imgMatch[1];
    } else {
      wrap.setAttribute("data-hash", html);
      wrap.innerHTML = html;
    }
  };

  const renderSingleBox = (slot, act) => {
    if (!slot || !act) return;
    let box = slot.querySelector(".activity-box");
    if (!box) {
      box = document.createElement("div");
      box.className = "activity-box";
      box.style.cssText =
        "background: rgba(0,0,0,0.2); padding: 16px; border-radius: 16px; display:flex; gap: 16px; align-items:center; width: 100%; height: 100%; box-sizing: border-box;";
      slot.appendChild(box);
    }

    let imgContainer = box.querySelector(".img-container");
    if (!imgContainer) {
      imgContainer = document.createElement("div");
      imgContainer.className = "img-container";
      imgContainer.style.cssText =
        "flex-shrink:0; position:relative; width:84px; height:84px;";
      imgContainer.innerHTML = `<div class="large-img-wrap" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 12px; overflow: hidden;"></div><div class="small-img-wrap" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></div>`;
      box.appendChild(imgContainer);
    }

    preloadAndSwap(
      imgContainer.querySelector(".large-img-wrap"),
      act.largeImgHTML,
    );
    preloadAndSwap(
      imgContainer.querySelector(".small-img-wrap"),
      act.smallImgHTML,
    );

    let textContainer = box.querySelector(".text-container");
    if (!textContainer) {
      textContainer = document.createElement("div");
      textContainer.className = "text-container";
      textContainer.style.cssText =
        "display:flex; flex-direction:column; justify-content:center; overflow: hidden; flex: 1; min-width: 0;";
      box.appendChild(textContainer);
    }

    if (textContainer.getAttribute("data-hash") !== act.textHash) {
      textContainer.innerHTML = act.textHTML;
      textContainer.setAttribute("data-hash", act.textHash);

      activeTimers.forEach((t) => (t.els = null));
    }
  };

  const homeEl = document.getElementById("discord-dynamic-content");
  if (homeEl) {
    const gameAct = activitiesList.find((a) => a.typeCategory === "playing");
    const listeningAct = activitiesList.find((a) => a.typeCategory === "listening");
    const watchingAct = activitiesList.find((a) => a.typeCategory === "watching");
    
    let leftAct = gameAct;
    let rightAct = listeningAct || watchingAct;

    if (!gameAct && watchingAct && listeningAct) {
      leftAct = watchingAct;
      rightAct = listeningAct;
    }

    let currentState =
      leftAct && rightAct
        ? "both"
        : leftAct
          ? "game"
          : rightAct
            ? "music"
            : "none";

    let transitionClass = window.lastHomeState
      ? "from-" + window.lastHomeState
      : "";
    window.lastHomeState = currentState;

    if (currentState === "none") {
      homeEl.innerHTML = `<div style="text-align:center; padding: 25px 20px; color: #888; font-weight: 700; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); border-radius: 16px;"><span>No activity on ${discordSvg}.</span></div>`;
    } else {
      let flexGrid = homeEl.querySelector(".home-activities-wrapper");
      if (!flexGrid) {
        homeEl.innerHTML = `
                    <style>
                        .home-activities-wrapper { display: flex; gap: 15px; width: 100%; align-items: stretch; transition: gap 0.6s 0.4s; }
                        .home-activities-wrapper.state-none { gap: 0px; }
                        .act-slot { flex: 0 0 auto; width: 0px; overflow: hidden; transition: width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.4s, margin 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.4s; border-radius: 16px; transform: translateZ(0); will-change: width, margin; }
                        .act-slot .activity-box { width: 100%; height: 100%; min-width: 320px; }
                        .act-slot .activity-box > * { opacity: 0; transition: opacity 0.3s ease 0s; transform: translateZ(0); will-change: opacity; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
                        .state-both #home-game-slot, .state-both #home-music-slot { width: calc(50% - 7.5px); margin: 0; }
                        .state-game #home-game-slot, .state-music #home-music-slot { width: 100%; margin: 0; }
                        .state-game #home-game-slot, .state-music #home-music-slot, .state-both #home-game-slot, .state-both #home-music-slot { transition: width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0s, margin 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0s; }
                        .from-both.state-game #home-game-slot, .from-both.state-music #home-music-slot, .from-game.state-music #home-music-slot, .from-music.state-game #home-game-slot { transition: width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.4s, margin 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.4s; }
                        .state-game #home-game-slot .activity-box > *, .state-music #home-music-slot .activity-box > *, .state-both #home-game-slot .activity-box > *, .state-both #home-music-slot .activity-box > * { opacity: 1; transition: opacity 0.4s ease 0.6s; }
                        .from-both.state-game #home-game-slot .activity-box > *, .from-both.state-music #home-music-slot .activity-box > *, .from-game.state-music #home-music-slot .activity-box > *, .from-music.state-game #home-game-slot .activity-box > * { transition: opacity 0.4s ease 1.0s; }
                        .state-game #home-music-slot { margin-left: -15px; }
                        .state-music #home-game-slot { margin-right: -15px; }
                    </style>
                    <div class="home-activities-wrapper state-${currentState} ${transitionClass}">
                        <div id="home-game-slot" class="act-slot"></div>
                        <div id="home-music-slot" class="act-slot"></div>
                    </div>`;
        flexGrid = homeEl.querySelector(".home-activities-wrapper");
        void flexGrid.offsetWidth;
      } else {
        flexGrid.className = `home-activities-wrapper state-${currentState} ${transitionClass}`;
      }

      if (leftAct)
        renderSingleBox(homeEl.querySelector("#home-game-slot"), leftAct);
      if (rightAct)
        renderSingleBox(homeEl.querySelector("#home-music-slot"), rightAct);
    }
  }

  const appleMusicActs = activitiesList.filter((a) => a.isAppleMusic);
  window.currentMusicActivities = appleMusicActs.length > 0;

  window.currentDiscordActivities = baseStatus !== "offline";

  const musicEl = document.getElementById("apple-music-dynamic-content");
  if (musicEl) {
    if (appleMusicActs.length > 0) {
      let flexGrid = musicEl.querySelector(".discord-activities-flex");
      if (!flexGrid) {
        musicEl.innerHTML = `<div class="discord-activities-flex" style="display: flex; gap: 15px; width: 100%;"><div id="apple-music-slot" style="flex: 1; min-width: 0; max-width: 100%;"></div></div>`;
      }
      renderSingleBox(musicEl.querySelector("#apple-music-slot"), appleMusicActs[0]);
    } else {
      musicEl.innerHTML = `<div style="text-align:center; padding: 25px 20px; color: #888; font-weight: 700; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); border-radius: 16px;"><span>No activity on Apple Music.</span></div>`;
    }
  }

  scrollObserver.disconnect();
  document
    .querySelectorAll(".scroll-wrapper")
    .forEach((el) => scrollObserver.observe(el));
}

setInterval(() => {
  const now = Date.now();
  activeTimers.forEach((t) => {
    if (!t.els) {
      t.els = {
        elapsed: document.querySelectorAll(`.${t.id}-elapsed`),
        total:
          t.type === "progress"
            ? document.querySelectorAll(`.${t.id}-total`)
            : null,
        bar:
          t.type === "progress"
            ? document.querySelectorAll(`.${t.id}-bar`)
            : null,
      };
    }

    if (t.els.elapsed.length === 0) return;

    if (t.type === "progress") {
      const elapsedMs = Math.max(0, now - t.start);
      const totalMs = t.end - t.start;
      const perc = Math.min(100, (elapsedMs / totalMs) * 100);

      const elapsedStr = formatElapsed(elapsedMs);
      const totalStr = formatElapsed(totalMs);

      t.els.elapsed.forEach((el) => (el.textContent = elapsedStr));
      t.els.total.forEach((el) => (el.textContent = totalStr));
      t.els.bar.forEach((el) => (el.style.width = `${perc}%`));
    } else {
      const elapsedStr = `${formatElapsed(Math.max(0, now - t.start))} elapsed`;
      t.els.elapsed.forEach((el) => (el.textContent = elapsedStr));
    }
  });
}, 1000);
