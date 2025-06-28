// Centralized platform assets and utilities
// Consolidates duplicate getPlatformIcon and PLATFORMS implementations

export interface Platform {
  id: string;
  name: string;
  icon: any; // Asset require() type
  color?: string;
}

export function getPlatformIcon(platform: string) {
  switch (platform?.toLowerCase()) {
    case "instagram":
      return require("@/assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png");
    case "youtube":
      return require("@/assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png");
    case "tiktok":
      return require("@/assets/tiktok-icon.png");
    case "facebook":
      return require("@/assets/facebook-icon.png");
    case "twitter":
      return require("@/assets/1707226109newtwitterlogopng-1.png");
    case "twitch":
      return require("@/assets/twitchlogotwitchlogotransparenttwitchicontransparentfreefreepng-1.png");
    default:
      return require("@/assets/letter-s.png");
  }
}

export const PLATFORMS: Platform[] = [
  { 
    id: "youtube", 
    name: "YouTube",
    icon: getPlatformIcon("youtube"),
    color: "#FF0000"
  },
  { 
    id: "instagram", 
    name: "Instagram",
    icon: getPlatformIcon("instagram"),
    color: "#E4405F"
  },
  { 
    id: "twitter", 
    name: "Twitter",
    icon: getPlatformIcon("twitter"),
    color: "#1DA1F2"
  },
  { 
    id: "facebook", 
    name: "Facebook",
    icon: getPlatformIcon("facebook"),
    color: "#1877F2"
  },
  { 
    id: "tiktok", 
    name: "TikTok",
    icon: getPlatformIcon("tiktok"),
    color: "#000000"
  },
  { 
    id: "twitch", 
    name: "Twitch",
    icon: getPlatformIcon("twitch"),
    color: "#9146FF"
  },
];

export function getPlatformById(id: string): Platform | undefined {
  return PLATFORMS.find(platform => platform.id.toLowerCase() === id.toLowerCase());
}

export function getPlatformByName(name: string): Platform | undefined {
  return PLATFORMS.find(platform => platform.name.toLowerCase() === name.toLowerCase());
}

export function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function validateHandle(handle: string): string[] {
  const errors: string[] = [];

  if (handle.length < 3) {
    errors.push("At least 3 characters");
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_\.]*$/.test(handle)) {
    errors.push("Only letters, numbers, dots, and underscores");
    errors.push("Cannot start with a number");
  }

  if (handle.includes(" ")) {
    errors.push("No spaces allowed");
  }

  return errors;
}