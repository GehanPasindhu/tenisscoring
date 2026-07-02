export function formatCategory(category: string | null | undefined): string {
  if (!category) return "";
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const slpl_gender_enum : string[] = ["male", "female"];
export const slpl_hand_enum : string[] = ["right", "left", "both"];
export const slpl_court_side_enum : string[] = ["backhand", "forehand", "both"];
export const slpl_match_status_enum : string[] = ["scheduled", "walkover", "live", "completed", "cancelled"];
export const slpl_match_category_enum : string[] = ["intermediate_mens_double", "mens_double", "womens_double", "mixed_double"];