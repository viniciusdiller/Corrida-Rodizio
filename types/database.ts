export type FoodType = "pizza" | "sushi" | "burger" | "drinks";

/** Core race row mirrored from Supabase. */
export interface Race {
  id: string;
  name: string;
  food_type: FoodType;
  room_code: string;
  created_at: string;
  ended_at: string | null;
  is_active: boolean;
  is_team_mode: boolean;
  photo_mode?: boolean;
  photo_required?: boolean;
}

/**
 * Participant state used by room UI and realtime updates.
 * `items_eaten` is the authoritative score and should never be negative.
 */
export interface Participant {
  id: string;
  race_id: string;
  name: string;
  login_code: string | null;
  avatar: string | null;
  is_vip: boolean | null;
  items_eaten: number;
  team: string | null;
  created_at: string;
  updated_at: string;
}

/** Metadata for photo evidence attached to a participant increment. */
export interface RacePhoto {
  id: string;
  race_id: string;
  participant_id: string;
  item_number: number;
  image_path: string;
  created_at: string;
  expires_at?: string | null;
}
