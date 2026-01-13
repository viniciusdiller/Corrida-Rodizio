"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Minus, Plus } from "lucide-react"
import type { Participant } from "@/types/database"
import { FoodIcon } from "./food-icon"
import type { FoodType } from "@/types/database"

interface ParticipantCardProps {
  participant: Participant
  rank: number
  foodType: FoodType
}

export function ParticipantCard({ participant, rank, foodType }: ParticipantCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateCount = async (increment: boolean) => {
    setIsUpdating(true)
    const supabase = createClient()
    const newCount = Math.max(0, participant.items_eaten + (increment ? 1 : -1))

    await supabase.from("participants").update({ items_eaten: newCount }).eq("id", participant.id)

    setIsUpdating(false)
  }

  const isWinner = rank === 1 && participant.items_eaten > 0

  return (
    <Card
      className={`transition-all ${
        isWinner
          ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
          : ""
      }`}
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-bold ${
                isWinner ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {isWinner ? <Trophy className="h-4 w-4" /> : rank}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base leading-none mb-1">{participant.name}</h3>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FoodIcon type={foodType} className="h-4 w-4" />
                <span className="text-xs">{participant.items_eaten} eaten</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => updateCount(false)}
              disabled={isUpdating || participant.items_eaten === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-2xl font-bold min-w-10 text-center text-primary">{participant.items_eaten}</div>
            <Button size="icon" variant="outline" onClick={() => updateCount(true)} disabled={isUpdating}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
