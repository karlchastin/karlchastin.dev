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

export const GREEDY_LYRICS = [
    { time: 0.00, text: "(Instrumental)" },
    { time: 4.15, text: "He said, \"Are you serious?" },
    { time: 6.30, text: "I've tried, but I can't figure out" },
    { time: 8.65, text: "I've been next to you all night" },
    { time: 10.85, text: "And still don't know what you're about" },
    { time: 13.10, text: "You keep ta-ta-ta-talking" },
    { time: 15.15, text: "But not much coming out your mouth" },
    { time: 17.35, text: "Can't you tell that I want you?\"" },
    { time: 19.45, text: "I say, yeah" },
    { time: 20.35, text: "I would want myself" },
    { time: 22.10, text: "Baby, please believe me" },
    { time: 23.65, text: "(Instrumental)" },
    { time: 24.60, text: "I'll put you through hell" },
    { time: 26.10, text: "Just to know me" },
    { time: 27.15, text: "Yeah-yeah" },
    { time: 28.25, text: "(Instrumental)" },
    { time: 29.10, text: "So sure of yourself" },
    { time: 30.65, text: "Baby, don't get greedy" },
    { time: 32.35, text: "(Instrumental)" },
    { time: 33.15, text: "That shit won't end well" },
    { time: 35.75, text: "End well" },
    { time: 37.00, text: "(Instrumental)" },
    { time: 41.10, text: "I see you eyeing me down" },
    { time: 42.90, text: "But you'll never know much past my name" },
    { time: 45.35, text: "Or how I'm running this room around" },
    { time: 47.75, text: "And that I'm still half your age" },
    { time: 49.95, text: "Yeah, you're l-l-l-looking at me" },
    { time: 52.15, text: "Like I'm some sweet escape" },
    { time: 54.35, text: "Obvious that you want me, but I said" },
    { time: 57.00, text: "I would want myself" },
    { time: 58.75, text: "Baby, please believe me" },
    { time: 60.30, text: "(Instrumental)" },
    { time: 61.25, text: "I'll put you through hell" },
    { time: 62.75, text: "Just to know me" },
    { time: 63.80, text: "Yeah-yeah" },
    { time: 64.90, text: "(Instrumental)" },
    { time: 65.75, text: "So sure of yourself" },
    { time: 67.30, text: "Baby, don't get greedy" },
    { time: 69.00, text: "(Instrumental)" },
    { time: 69.80, text: "That shit won't end well" },
    { time: 72.40, text: "End well" },
    { time: 73.65, text: "(Instrumental)" },
    { time: 76.10, text: "He said, \"I'm just curious, is this for real or just an act?" },
    { time: 80.20, text: "Can't tell if you love or hate me" },
    { time: 82.45, text: "Never met someone like that" },
    { time: 84.80, text: "Drive me so-so-so crazy" },
    { time: 86.40, text: "Did you know you got that effect?\"" },
    { time: 89.05, text: "I said, \"Lemme check\"" },
    { time: 91.31, text: "Yeah" },
    { time: 91.75, text: "I would want myself" },
    { time: 93.50, text: "Baby, please believe me" },
    { time: 95.05, text: "(Instrumental)" },
    { time: 96.00, text: "I'll put you through hell" },
    { time: 97.50, text: "Just to know me" },
    { time: 98.55, text: "Yeah-yeah" },
    { time: 99.65, text: "(Instrumental)" },
    { time: 100.35, text: "So sure of yourself" },
    { time: 102.05, text: "Baby, don't get greedy" },
    { time: 103.75, text: "(Instrumental)" },
    { time: 104.55, text: "That shit won't end well" },
    { time: 107.15, text: "End well" },
    { time: 108.50, text: "(Instrumental)" },
    { time: 110.23, text: "I would want myself" },
    { time: 114.53, text: "I would want myself" },
    { time: 117.83, text: "I would want myself" },
    { time: 118.82, text: "I would want myself" },
    { time: 123.11, text: "I would want myself" }
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