"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Flag } from "lucide-react"
import type { Race, Participant } from "@/types/database"
import { ParticipantCard } from "./participant-card"
import { AddParticipantDialog } from "./add-participant-dialog"
import { FoodIcon } from "./food-icon"

interface RaceViewProps {
  race: Race
  onBack: () => void
}

export function RaceView({ race, onBack }: RaceViewProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isEnding, setIsEnding] = useState(false)

  const loadParticipants = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("race_id", race.id)
      .order("items_eaten", { ascending: false })

    if (data) {
      setParticipants(data)
    }
  }

  useEffect(() => {
    loadParticipants()

    const supabase = createClient()
    const channel = supabase
      .channel(`race-${race.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `race_id=eq.${race.id}`,
        },
        () => {
          loadParticipants()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [race.id])

  const endRace = async () => {
    setIsEnding(true)
    const supabase = createClient()
    await supabase.from("races").update({ is_active: false, ended_at: new Date().toISOString() }).eq("id", race.id)

    setIsEnding(false)
    onBack()
  }

  const foodLabels = {
    pizza: "Pizza Slices",
    sushi: "Sushi Pieces",
    burger: "Burgers",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Races
        </Button>
        <Button variant="destructive" size="sm" onClick={endRace} disabled={isEnding} className="gap-2">
          <Flag className="h-4 w-4" />
          {isEnding ? "Ending..." : "End Race"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{race.name}</CardTitle>
              <div className="flex items-center gap-2">
                <FoodIcon type={race.food_type} className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg text-muted-foreground">{foodLabels[race.food_type]}</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {participants.length} {participants.length === 1 ? "participant" : "participants"}
            </p>
            <AddParticipantDialog raceId={race.id} onParticipantAdded={loadParticipants} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {participants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No participants yet. Add someone to get started!</p>
            </CardContent>
          </Card>
        ) : (
          participants.map((participant, index) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              rank={index + 1}
              foodType={race.food_type}
            />
          ))
        )}
      </div>
    </div>
  )
}
