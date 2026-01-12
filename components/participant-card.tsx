"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Minus, Plus } from "lucide-react"
import type { Participant } from "@/types/database"
import { FoodIcon } from "./food-icon"
import type { FoodType } from "@/types/database"
import { getAvatar } from "@/lib/utils/avatars"

interface ParticipantCardProps {
  participant: Participant
  rank: number
  foodType: FoodType
  leaderItems: number
}

export function ParticipantCard({ participant, rank, foodType, leaderItems }: ParticipantCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateCount = async (increment: boolean) => {
    setIsUpdating(true)
    const supabase = createClient()
    const newCount = Math.max(0, participant.items_eaten + (increment ? 1 : -1))

    await supabase.from("participants").update({ items_eaten: newCount }).eq("id", participant.id)

    setIsUpdating(false)
  }

  const isWinner = rank === 1 && participant.items_eaten > 0
  const avatar = getAvatar(participant.avatar)
  const progressRatio = leaderItems > 0 ? participant.items_eaten / leaderItems : rank === 1 ? 1 : 0
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRatio * 100)))

  return (
    <Card
      className={`transition-all ${
        isWinner
          ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
          : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                isWinner ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {isWinner ? <Trophy className="h-5 w-5" /> : rank}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl" aria-hidden="true">
                  {avatar}
                </span>
                <h3 className="font-semibold text-lg leading-none">{participant.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FoodIcon type={foodType} className="h-4 w-4" />
                <span className="text-sm">{participant.items_eaten} eaten</span>
              </div>
              <div className="mt-3">
                <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <span
                    className="absolute -top-5 text-lg transition-all duration-700 ease-out"
                    style={{ left: progressPercent === 0 ? "0%" : `calc(${progressPercent}% - 0.6rem)` }}
                    aria-hidden="true"
                  >
                    {avatar}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                  <span>Largada</span>
                  <span>Chegada</span>
                </div>
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
            <div className="text-3xl font-bold min-w-12 text-center text-primary">{participant.items_eaten}</div>
            <Button size="icon" variant="outline" onClick={() => updateCount(true)} disabled={isUpdating}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
