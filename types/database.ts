export type FoodType = "pizza" | "sushi" | "burger"

export interface Race {
  id: string
  name: string
  food_type: FoodType
  room_code: string
  created_at: string
  ended_at: string | null
  is_active: boolean
}

export interface Participant {
  id: string
  race_id: string
  name: string
  items_eaten: number
  created_at: string
  updated_at: string
}
