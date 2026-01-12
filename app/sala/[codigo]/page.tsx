"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Trophy, Users, Plus, Minus, Check } from "lucide-react"
import type { Race, Participant, FoodType } from "@/types/database"
import { FoodIcon } from "@/components/food-icon"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.codigo as string

  const [race, setRace] = useState<Race | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const getItemLabel = (foodType: FoodType, count: number) => {
    const labels = {
      pizza: count === 1 ? "pedaço" : "pedaços",
      sushi: count === 1 ? "peça" : "peças",
      burger: count === 1 ? "hambúrguer" : "hambúrgueres",
    }
    return labels[foodType]
  }

  const loadRoomData = async () => {
    try {
      const supabase = createClient()

      // Load race
      const { data: raceData, error: raceError } = await supabase
        .from("races")
        .select()
        .eq("room_code", roomCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (raceError || !raceData) {
        alert("Sala não encontrada")
        router.push("/")
        return
      }

      setRace(raceData)

      // Load participants
      const { data: participantsData } = await supabase
        .from("participants")
        .select()
        .eq("race_id", raceData.id)
        .order("items_eaten", { ascending: false })

      if (participantsData) {
        setParticipants(participantsData)
      }
    } catch (error) {
      console.error("Erro ao carregar sala:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateCount = async (participantId: string, change: number) => {
    const participant = participants.find((p) => p.id === participantId)
    if (!participant) return

    const newCount = Math.max(0, participant.items_eaten + change)

    try {
      const supabase = createClient()
      await supabase.from("participants").update({ items_eaten: newCount }).eq("id", participantId)

      // Optimistically update UI
      setParticipants((prev) =>
        prev
          .map((p) => (p.id === participantId ? { ...p, items_eaten: newCount } : p))
          .sort((a, b) => b.items_eaten - a.items_eaten),
      )
    } catch (error) {
      console.error("Erro ao atualizar:", error)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode.toUpperCase())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    loadRoomData()

    // Subscribe to real-time updates
    const supabase = createClient()
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
        },
        () => {
          loadRoomData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 flex items-center justify-center">
        <div className="text-2xl font-semibold text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!race) return null

  const leader = participants[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Room Header */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <FoodIcon type={race.food_type} className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl capitalize">
                    {race.food_type === "pizza" ? "Pizza" : race.food_type === "sushi" ? "Japa" : "Hambúrguer"}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{participants.length} participantes</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
                    {race.room_code}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={copyRoomCode}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">Envie este código para seus amigos</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Participants List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Ranking
          </h2>

          {participants.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Aguardando participantes...</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <Card
                  key={participant.id}
                  className={`transition-all ${
                    index === 0
                      ? "border-yellow-500 border-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
                      : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-muted-foreground">{index + 1}º</span>
                          {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                        </div>
                        <div>
                          <div className="text-xl font-semibold">{participant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {participant.items_eaten} {getItemLabel(race.food_type, participant.items_eaten)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => updateCount(participant.id, -1)}
                          disabled={participant.items_eaten === 0}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <div className="w-16 text-center">
                          <span className="text-3xl font-bold">{participant.items_eaten}</span>
                        </div>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                          onClick={() => updateCount(participant.id, 1)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
