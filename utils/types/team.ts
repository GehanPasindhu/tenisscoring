export type Team = {
  id: string;
  team_name: string;
  group_id?: string;
  group_name?: string;
  description: string;
  color: string;
  logo?: string;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
};

export const emptyForm = {
  team_name: "",
  group_id: "",
  group_name: "",
  description: "",
  color: "#f97316",
  logo: "",
  website_url: "",
  facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  tiktok_url: "",
  youtube_url: "",
};

export const normalizeColor = (color: string): string => {
  if (!color) return "#cccccc";
  if (color.startsWith("#")) return color;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = color;
      return ctx.fillStyle;
    }
  } catch {
    // ignore
  }
  return "#cccccc";
};
