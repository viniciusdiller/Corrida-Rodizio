import { Pizza, Fish, Beef } from "lucide-react"
import type { FoodType } from "@/types/database"

interface FoodIconProps {
  type: FoodType
  className?: string
}

export function FoodIcon({ type, className }: FoodIconProps) {
  const icons = {
    pizza: Pizza,
    sushi: Fish,
    burger: Beef,
  }

  const Icon = icons[type]
  return <Icon className={className} />
}
