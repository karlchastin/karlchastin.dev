export const DISCORD_ID = "330950042863271936"; 
export const WORKER_URL = 'https://steam-proxy.karlchastin-personal.workers.dev/'; 

export const defaultLayout = {
    showDiscord: false, showGithubStats: false, showLocMusic: false, 
    showGithubContribs: false, showGithubRepos: false, showLocHome: false, 
    showLocGithub: false, showLocSteam: false, showLocDiscord: false, showTimeLoc: false, 
    showEmailActions: false, showSteamExtra: false, showSteamActivity: false, 
    showSteamStats: false, showGithubAchievements: false, showSteamReview: false, 
    showDiscordStatus: false, showSteamStatus: false, showDiscordBadges: false, 
    showDiscordServers: false, showMusicActivity: false, showMusicPlaylists: false, 
    showInstaHighlights: false, showInstaStats: false, showLocInsta: false, showInstaPosts: false, 
    showFacebookStats: false, showLocFacebook: false, showPreferences: false, showCards: []
};

export const profiles = {
    home: {
        avatar: "./assets/Home%20Tab%20Avatar.webp",
        name: "chas", username: "", bio: "Tell me, do gods bleed?",
        layout: { ...defaultLayout, showDiscord: true, showMusic: true, showLocHome: true, showDiscordStatus: true, showCards: ['card-2-container', 'card-3-container'] }
    },
    github: {
        avatar: "https://avatars.githubusercontent.com/u/244555740?v=4", 
        name: "Karl Chastin Delfin", 
        username: "@karlchastin",
        bio: "Loading live GitHub profile...", 
        layout: { ...defaultLayout, showGithubStats: true, showGithubContribs: true, showGithubRepos: true, showLocGithub: true, showGithubAchievements: true, showCards: ['card-2-container', 'card-3-container', 'card-4-container'] }
    },
    email: {
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocKT0TRPKQOi9HhhEUz48ZwapMWtuFTnsCNewew3vTrVOjs3F8jtsA=s1000-c",
        name: "Karl Chastin Delfin", username: "Choose your contact intention",
        bio: "You can hover over your preferred contact method, and select to be redirected to your default email provider.",
        layout: { ...defaultLayout, showTimeLoc: true, showEmailActions: true, showCards: ['card-2-container'] }
    },
    steam: {
        avatar: "./assets/Home%20Tab%20Avatar.webp",
        name: "Loading...", username: "NotChztn",
        bio: "Welcome to my Steam profile. Let's play some games.", 
        layout: { ...defaultLayout, showLocSteam: true, showSteamExtra: true, showSteamActivity: true, showSteamStats: true, showSteamReview: true, showSteamStatus: true, showCards: ['card-2-container', 'card-3-container', 'card-4-container'] }
    },
    discord: {
        avatar: "./assets/Home%20Tab%20Avatar.webp",
        name: "Discord", username: "@chas",
        bio: "i refuse.",
        layout: { ...defaultLayout, showLocDiscord: true, showDiscordStatus: true, showDiscordBadges: true, showDiscordServers: true, showCards: ['card-4-container'] }
    },
    music: {
        avatar: "./assets/Apple%20Music%20Avatar.webp",
        name: "Karl Chastin Delfin", username: "@karlchastin",
        bio: "i am not responsible for these playlist names, they're just funny.",
        layout: { ...defaultLayout, showLocMusic: true, showMusicActivity: true, showMusicPlaylists: true, showCards: ['card-3-container', 'card-4-container'] }
    },
    instagram: {
        avatar: "./assets/Home%20Tab%20Avatar.webp", 
        name: "Loading...", 
        username: "@karlchastin",
        bio: "Loading live Instagram profile...",
        layout: { ...defaultLayout, showLocInsta: true, showInstaStats: true, showInstaHighlights: true, showInstaPosts: true, showCards: ['card-2-container', 'card-3-container', 'card-4-container'] }
    },
    facebook: {
        avatar: "./assets/Home%20Tab%20Avatar.webp", 
        name: "Loading...", 
        username: "Facebook",
        bio: "Loading live Facebook profile...",
        layout: { ...defaultLayout, showLocFacebook: true, showFacebookStats: true, showCards: ['card-3-container'] }
    },
    preferences: {
        avatar: "./assets/Home%20Tab%20Avatar.webp",
        name: "Preferences", username: "System Settings",
        bio: "My per-game preferences, mod configurations, and custom setups.",
        layout: { ...defaultLayout, showPreferences: true, showCards: ['card-2-container'] }
    }
};

export const FATAL_LYRICS = [
    { time: 0.00, text: "(Instrumental)" },
    { time: 18.94, text: "Thoughts manifest in a wink" },
    { time: 22.39, text: "Insanity, it beckons again" },
    { time: 25.49, text: "Is this where the loud part begins?" },
    { time: 28.53, text: "Right in the momentary bliss, in the midst of a toxin" },
    { time: 32.01, text: "I shall be led into temptation" },
    { time: 35.07, text: "Shall not fear, for you're with I" },
    { time: 38.39, text: "We're buried deep in conversation" },
    { time: 41.57, text: "Ask what I'm thinking, and I lie" },
    { time: 45.23, text: "(Instrumental)" },
    { time: 46.19, text: "And while she could give or take" },
    { time: 52.34, text: "I guess that I'm not built that way" },
    { time: 56.90, text: "What if it's fatal, be all and end all?" },
    { time: 60.21, text: "What if the wait was inconsequential?" },
    { time: 63.39, text: "Too late to surface, watching the tide turn" },
    { time: 66.71, text: "Know how it ends, but still feel suspenseful" },
    { time: 71.03, text: "(Instrumental)" },
    { time: 77.02, text: "What would the neighborhood think" },
    { time: 80.00, text: "When the twitching of curtains insist?" },
    { time: 83.63, text: "Empty in your heart that persists through a pinhole" },
    { time: 86.65, text: "A camera obscura perceived on the atrium" },
    { time: 90.00, text: "I know he speaks perfect prose 'cause" },
    { time: 93.02, text: "On Sinai's peak, he took my hand" },
    { time: 96.42, text: "We misheard curse words, a condemnation" },
    { time: 99.55, text: "The only thing he understands" },
    { time: 103.12, text: "(Instrumental)" },
    { time: 104.46, text: "Oh, he understands" },
    { time: 108.02, text: "(Instrumental)" },
    { time: 110.32, text: "And while he could give or take" },
    { time: 116.86, text: "I guess that I'm not built that way" },
    { time: 121.30, text: "What if it's fatal, be all and end all?" },
    { time: 124.69, text: "What if the wait was inconsequential?" },
    { time: 127.95, text: "Too late to surface, watching the tide turn" },
    { time: 131.19, text: "Know how it ends, but still feel suspenseful" },
    { time: 135.41, text: "(Instrumental)" },
    { time: 156.49, text: "Please, can I just take a bit more for myself?" },
    { time: 161.85, text: "An angel or guinea, a year off my health" },
    { time: 166.94, text: "I wish you all could understand the things that I say" },
    { time: 171.54, text: "I'd love to come help you, I'd love to translate" },
    { time: 176.64, text: "Each softly spoken rhyme, sew it right to your tongue" },
    { time: 181.84, text: "Waft the amber rays arranged to your cerebrum" },
    { time: 186.97, text: "You'd come to know exactly what I'd meant to mean" },
    { time: 192.04, text: "We'd make up, we'd cry goodbye, a kiss on the cheek" },
    { time: 197.31, text: "You make it so hard for a boy to believe" },
    { time: 202.27, text: "There's anything beyond what I think and I see" },
    { time: 207.17, text: "You make it so hard for a boy to believe" },
    { time: 212.27, text: "This moment could hurt you, but it won't hurt me" },
    { time: 216.62, text: "(Instrumental)" },
    { time: 228.14, text: "What if it's fatal, be all and end all?" },
    { time: 231.86, text: "What if the wait was inconsequential?" },
    { time: 235.07, text: "Too late to surface, watching the tide turn" },
    { time: 238.69, text: "Know how it ends, but still feel suspenseful" },
    { time: 241.98, text: "What if it's fatal, be all and end all?" },
    { time: 245.02, text: "What if the wait was inconsequential?" },
    { time: 248.12, text: "Too late to surface, watching the tide turn" },
    { time: 251.78, text: "Know how it ends, but still feel suspenseful" },
    { time: 255.08, text: "What if it's fatal, be all and end all?" },
    { time: 258.10, text: "What if the wait was inconsequential?" },
    { time: 261.50, text: "Too late to surface, watching the tide turn" },
    { time: 264.66, text: "Know how it ends, but still feel suspenseful" },
    { time: 268.88, text: "(Instrumental)" },
    { time: 271.83, text: "But darling, it's not your fault" }
];

export const featuredRepos = [
    { name: "Core Handler API", idName: "Core-Handler-API", desc: "An addon used as an API for other addons in Minecraft Bedrock edition.", private: true, banner: "linear-gradient(90deg, #2c3e50, #000)" },
    { name: "Chas' Java Combat Addon", idName: "chas-java-combat-addon", desc: "A project aimed to bring Minecraft Java Edition's combat mechanics to Minecraft Bedrock Edition!", private: false, url: "https://github.com/karlchastin/chas-java-combat-addon", banner: "linear-gradient(90deg, #ff0000, #330000)" },
    { name: "Project Salvation", idName: "Project-Salvation", desc: "\"Project Salvation\" is an independent Roblox passion project, heavily inspired by survival horror pioneers.", private: true, banner: "linear-gradient(90deg, #1a1a1a, #4d0000)" }
];

export const featuredServers = [
    { name: "World Peace Control Organization", desc: "A group from the Roblox game \"SCP: Roleplay\". Chas' main line of work by building in-game headquarters.", url: "https://discord.gg/hDXQuyfsgn", btnText: "JOIN DISCORD SERVER", banner: "linear-gradient(90deg, #1e3c72, #2a5298)" },
    { name: "server ni chas :3c", desc: "[Retired] A server for chas and his friends!", btnText: "NO LONGER AVAILABLE", banner: "linear-gradient(90deg, #4b134f, #c94b4b)" },
    { name: "Project Salvation's Community Server", desc: "A Discord Server for the active development of the Roblox game \"Project Salvation\"", btnText: "PRIVATE SERVER", banner: "linear-gradient(90deg, #1a1a1a, #4d0000)" }
];

export const appleMusicPlaylists = [
    { name: "songs that makes me a white girl.", desc: "there literally isn't a better description here.", url: "https://music.apple.com/ph/playlist/songs-that-makes-me-a-white-girl/pl.u-qxylEMMsd7K3xbN", btnText: "LISTEN ON APPLE MUSIC", banner: "linear-gradient(90deg, #fa243c, #ff5e7e)" },
    { name: "songs i'd fuck you with.", desc: "that's a joke, by the way.", url: "https://music.apple.com/ph/playlist/songs-id-fuck-you-with/pl.u-zPyLl3vu85Xe2RG", btnText: "LISTEN ON APPLE MUSIC", banner: "linear-gradient(90deg, #8e2de2, #4a00e0)" }
];

export const instagramHighlights = [
    { title: "who", url: "https://www.instagram.com/stories/highlights/18111878254779115/", preview: "./assets/Instagram%20Highlight%20Thumbnail%20-%20who.webp" },
    { title: "what", url: "https://www.instagram.com/stories/highlights/18080284970579574/", preview: "./assets/Instagram%20Highlight%20Thumbnail%20-%20what.webp" },
    { title: "where", url: "https://www.instagram.com/stories/highlights/17886587631351183/", preview: "./assets/Instagram%20Highlight%20Thumbnail%20-%20where.webp" }
];

export const emailAvatars = { personal: "https://lh3.googleusercontent.com/a/ACg8ocKT0TRPKQOi9HhhEUz48ZwapMWtuFTnsCNewew3vTrVOjs3F8jtsA=s1000-c", business: "https://lh3.googleusercontent.com/a/ACg8ocJuf1q6J2ASav0wtbSxzLmSrDjZybT3LGBTEtDgQb23oN7r7aJv=s1000-c", school: "https://lh3.googleusercontent.com/a/ACg8ocISwd6aSM0UDXFLqiKEuYtdiKtJw1TNDDA-J2rTI62UO7OGsfvH=s1000-c" };
export const emailBios = { personal: "Reach out here for casual networking, personal inquiries, and general communication.", business: "For professional inquiries, freelance opportunities, and serious collaborations.", school: "Strictly for academic purposes, professor communications, and university matters." };

export const discordBadges = [
    { name: "Nitro Platinum", desc: "Subscriber since 3/12/25", icon: "https://cdn.discordapp.com/badge-icons/0334688279c8359120922938dcb1d6f8.png" },
    { name: "Hypesquad Bravery", icon: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png" },
    { name: "Server Boosting", desc: "Since Mar 31, 2026", icon: "https://cdn.discordapp.com/badge-icons/51040c70d4f20a921ad6674ff86fc95c.png" },
    { name: "Completed a Quest", icon: "https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png" }, 
    { name: "Orbs", desc: "Apprentice", icon: "https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png" } 
];