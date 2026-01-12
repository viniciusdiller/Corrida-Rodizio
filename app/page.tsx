"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Pizza, Fish, Beef, Utensils, ArrowRight } from "lucide-react"
import type { FoodType } from "@/types/database"
import { generateRoomCode } from "@/lib/utils/room-code"
import { getParticipantStorageKey } from "@/lib/utils/participant-storage"

export default function Home() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [selectedFood, setSelectedFood] = useState<FoodType | null>(null)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [loading, setLoading] = useState(false)

  const foodTypes = [
    { type: "pizza" as FoodType, label: "Pizza", icon: Pizza, emoji: "🍕" },
    { type: "sushi" as FoodType, label: "Japa", icon: Fish, emoji: "🍣" },
    { type: "burger" as FoodType, label: "Hambúrguer", icon: Beef, emoji: "🍔" },
  ]

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !selectedFood) return

    setLoading(true)
    try {
      const supabase = createClient()
      const code = generateRoomCode()

      // Create room
      const { data: race, error: raceError } = await supabase
        .from("races")
        .insert({
          name: `Sala de ${playerName}`,
          food_type: selectedFood,
          room_code: code,
          is_active: true,
        })
        .select()
        .single()

      if (raceError) throw raceError

      // Add creator as first participant
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          race_id: race.id,
          name: playerName,
          items_eaten: 0,
        })
        .select()
        .single()

      if (participantError) throw participantError

      if (participant) {
        localStorage.setItem(getParticipantStorageKey(code), participant.id)
      }

      // Redirect to room
      router.push(`/sala/${code}`)
    } catch (error) {
      console.error("Erro ao criar sala:", error)
      alert("Erro ao criar sala. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Find room by code
      const { data: race, error: raceError } = await supabase
        .from("races")
        .select()
        .eq("room_code", roomCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (raceError || !race) {
        alert("Sala não encontrada. Verifique o código.")
        setLoading(false)
        return
      }

      // Add participant
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          race_id: race.id,
          name: playerName,
          items_eaten: 0,
        })
        .select()
        .single()

      if (participantError) throw participantError

      if (participant) {
        localStorage.setItem(
          getParticipantStorageKey(roomCode.toUpperCase()),
          participant.id
        )
      }

      // Redirect to room
      router.push(`/sala/${roomCode.toUpperCase()}`)
    } catch (error) {
      console.error("Erro ao entrar na sala:", error)
      alert("Erro ao entrar na sala. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mb-4">
            <Utensils className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent text-balance">
            Rodízio Race
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">Compete com seus amigos para ver quem come mais!</p>
        </div>

        {/* Main Form */}
        <Card className="border-2">
          <CardContent className="pt-6 space-y-6">
            {/* Player Name */}
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-base font-semibold">
                🧍 Nome do jogador
              </Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Digite seu nome"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            {!showJoinRoom && (
              <>
                {/* Food Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tipo de rodízio</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {foodTypes.map(({ type, label, icon: Icon, emoji }) => (
                      <Card
                        key={type}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedFood === type ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedFood(type)}
                      >
                        <CardContent className="p-6 text-center space-y-2">
                          <div className="text-4xl">{emoji}</div>
                          <div className="flex items-center justify-center gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="font-semibold">{label}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            {!showJoinRoom ? (
              <div className="space-y-3 pt-4">
                <Button
                  size="lg"
                  className="w-full text-lg h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={handleCreateRoom}
                  disabled={!playerName.trim() || !selectedFood || loading}
                >
                  {loading ? "Criando..." : "Criar Sala"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg h-14 bg-transparent"
                  onClick={() => setShowJoinRoom(true)}
                  disabled={!playerName.trim()}
                >
                  Entrar em Sala
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="roomCode" className="text-base font-semibold">
                    Código da Sala
                  </Label>
                  <Input
                    id="roomCode"
                    type="text"
                    placeholder="Digite o código"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="text-lg h-12 uppercase"
                    maxLength={5}
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full text-lg h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={handleJoinRoom}
                  disabled={!roomCode.trim() || loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowJoinRoom(false)
                    setRoomCode("")
                  }}
                >
                  Voltar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
