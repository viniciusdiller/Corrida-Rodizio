export type FoodType = "pizza" | "sushi" | "burger";

export interface Race {
  id: string;
  name: string;
  food_type: FoodType;
  room_code: string;
  created_at: string;
  ended_at: string | null;
  is_active: boolean;
  is_team_mode: boolean;
}

export interface Participant {
  id: string;
  race_id: string;
  name: string;
  avatar: string | null;
  is_vip: boolean | null;
  items_eaten: number;
  team: string | null;
  created_at: string;
  updated_at: string;
}
