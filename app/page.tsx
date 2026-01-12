"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pizza,
  Fish,
  Beef,
  Trophy,
  ArrowRight,
  Hash,
  Users2,
} from "lucide-react";
import type { FoodType } from "@/types/database";
import { generateRoomCode } from "@/lib/utils/room-code";
import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { DEFAULT_AVATAR } from "@/lib/avatars";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodType | null>(null);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ESTADOS DO MODO EQUIPE
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A");
  const isMissingColumn = (error: unknown, column: string) => {
    if (!error || typeof error !== "object") return false;
    const maybeError = error as {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
    };
    const haystack = [
      maybeError.message,
      maybeError.details,
      maybeError.hint,
    ].filter(Boolean);
    return (
      maybeError.code === "42703" ||
      haystack.some((text) => text?.includes(column))
    );
  };

  const foodTypes = [
    { type: "pizza" as FoodType, label: "Pizza", icon: Pizza },
    { type: "sushi" as FoodType, label: "Japa", icon: Fish },
    { type: "burger" as FoodType, label: "Burger", icon: Beef },
  ];

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !selectedFood) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const code = generateRoomCode();

      // Criar a corrida com a nova flag is_team_mode
      let teamModeEnabled = isTeamMode;
      let { data: race, error: raceError } = await supabase
        .from("races")
        .insert({
          name: `Sala de ${playerName}`,
          food_type: selectedFood,
          room_code: code,
          is_active: true,
          is_team_mode: isTeamMode,
        })
        .select()
        .single();

      if (raceError && isMissingColumn(raceError, "is_team_mode")) {
        teamModeEnabled = false;
        const fallback = await supabase
          .from("races")
          .insert({
            name: `Sala de ${playerName}`,
            food_type: selectedFood,
            room_code: code,
            is_active: true,
          })
          .select()
          .single();
        race = fallback.data;
        raceError = fallback.error;
        if (isTeamMode) {
          alert(
            "Modo equipes indisponível: coluna 'is_team_mode' não encontrada. Criando sala sem equipes."
          );
        }
      }

      if (raceError) throw raceError;

      let { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          race_id: race.id,
          name: playerName,
          avatar: DEFAULT_AVATAR,
          items_eaten: 0,
          team: teamModeEnabled ? selectedTeam : null,
        })
        .select()
        .single();

      if (participantError) {
        const isMissingTeam = isMissingColumn(participantError, "team");
        const isMissingAvatar = isMissingColumn(participantError, "avatar");
        if (!isMissingTeam && !isMissingAvatar) throw participantError;
        const fallback = await supabase
          .from("participants")
          .insert({
            race_id: race.id,
            name: playerName,
            ...(isMissingAvatar ? {} : { avatar: DEFAULT_AVATAR }),
            items_eaten: 0,
            ...(isMissingTeam
              ? {}
              : { team: teamModeEnabled ? selectedTeam : null }),
          })
          .select()
          .single();
        participant = fallback.data;
        participantError = fallback.error;
        if (teamModeEnabled) {
          alert(
            "Modo equipes indisponível: coluna 'team' não encontrada. Entrando sem time."
          );
        }
      }

      if (participantError) throw participantError;

      if (participant) {
        localStorage.setItem(getParticipantStorageKey(code), participant.id);
      }

      router.push(`/sala/${code}`);
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      alert(
        "Erro ao criar sala. Verifique se o seu Banco de Dados possui as colunas 'is_team_mode' e 'team'."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const normalizedRoomCode = roomCode.toUpperCase();

      const { data: race, error: raceError } = await supabase
        .from("races")
        .select()
        .eq("room_code", normalizedRoomCode)
        .eq("is_active", true)
        .single();

      if (raceError || !race) {
        alert("Sala não encontrada. Verifique o código.");
        setLoading(false);
        return;
      }

      const { data: matchingParticipant, error: matchingParticipantError } =
        await supabase
          .from("participants")
          .select("id")
          .eq("race_id", race.id)
          .eq("name", playerName.trim())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

      if (!matchingParticipantError && matchingParticipant) {
        localStorage.setItem(
          getParticipantStorageKey(normalizedRoomCode),
          matchingParticipant.id
        );
        router.push(`/sala/${normalizedRoomCode}`);
        return;
      }

      const raceIsTeamMode =
        typeof (race as { is_team_mode?: boolean }).is_team_mode === "boolean"
          ? (race as { is_team_mode?: boolean }).is_team_mode
          : false;

      // Adicionar participante com o time selecionado (caso a sala seja modo equipe)
      let { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          race_id: race.id,
          name: playerName,
          avatar: DEFAULT_AVATAR,
          items_eaten: 0,
          team: raceIsTeamMode ? selectedTeam : null,
        })
        .select()
        .single();

      if (participantError) {
        const isMissingTeam = isMissingColumn(participantError, "team");
        const isMissingAvatar = isMissingColumn(participantError, "avatar");
        if (!isMissingTeam && !isMissingAvatar) throw participantError;
        const fallback = await supabase
          .from("participants")
          .insert({
            race_id: race.id,
            name: playerName,
            ...(isMissingAvatar ? {} : { avatar: DEFAULT_AVATAR }),
            items_eaten: 0,
            ...(isMissingTeam
              ? {}
              : { team: raceIsTeamMode ? selectedTeam : null }),
          })
          .select()
          .single();
        participant = fallback.data;
        participantError = fallback.error;
        if (raceIsTeamMode) {
          alert(
            "Modo equipes indisponível: coluna 'team' não encontrada. Entrando sem time."
          );
        }
      }

      if (participantError) throw participantError;

      if (participant) {
        localStorage.setItem(
          getParticipantStorageKey(normalizedRoomCode),
          participant.id
        );
      }

      router.push(`/sala/${normalizedRoomCode}`);
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      alert("Erro ao entrar na sala. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-orange-950/10 p-6 md:p-12 transition-colors duration-500">
      <div className="mx-auto max-w-xl space-y-12">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Rodízio<span className="text-primary">Race</span>
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
              A elite da comilança competitiva
            </p>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
          <CardContent className="pt-8 space-y-8">
            <div className="space-y-3">
              <Label
                htmlFor="playerName"
                className="text-xs uppercase tracking-widest font-bold text-muted-foreground px-1"
              >
                Seu Codinome
              </Label>
              <Input
                id="playerName"
                placeholder="Ex: Predador de Pizza"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-background/50 border-muted focus:ring-primary/20 h-14 text-lg font-medium"
              />
            </div>

            {(isTeamMode || showJoinRoom) && (
              <div className="space-y-3 animate-in fade-in duration-500">
                <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground px-1">
                  Escolha seu Time
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={selectedTeam === "A" ? "default" : "outline"}
                    className={`h-12 rounded-xl font-bold transition-all ${
                      selectedTeam === "A"
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    }`}
                    onClick={() => setSelectedTeam("A")}
                  >
                    Time Alpha
                  </Button>
                  <Button
                    type="button"
                    variant={selectedTeam === "B" ? "destructive" : "outline"}
                    className={`h-12 rounded-xl font-bold transition-all ${
                      selectedTeam === "B"
                        ? "ring-2 ring-destructive ring-offset-2"
                        : ""
                    }`}
                    onClick={() => setSelectedTeam("B")}
                  >
                    Time Beta
                  </Button>
                </div>
                {showJoinRoom && (
                  <p className="text-[10px] text-center text-muted-foreground uppercase font-medium">
                    Nota: Se a sala não for em equipe, seu time será ignorado.
                  </p>
                )}
              </div>
            )}

            {!showJoinRoom ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div
                  onClick={() => setIsTeamMode(!isTeamMode)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isTeamMode
                      ? "bg-primary/5 border-primary/20 shadow-inner"
                      : "bg-background border-muted hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users2
                      className={`h-5 w-5 ${
                        isTeamMode ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="text-left">
                      <p className="text-sm font-bold">Modo Equipes</p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Disputa Coletiva
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      isTeamMode ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
                        isTeamMode ? "left-5" : "left-1"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground px-1">
                    Escolha a Categoria
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {foodTypes.map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => setSelectedFood(type)}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                          selectedFood === type
                            ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                            : "bg-background hover:bg-muted text-muted-foreground border border-transparent hover:border-primary/20"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            selectedFood === type
                              ? "animate-pulse"
                              : "group-hover:text-primary"
                          }`}
                        />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:scale-95"
                    onClick={handleCreateRoom}
                    disabled={!playerName.trim() || !selectedFood || loading}
                  >
                    {loading ? "Preparando Mesa..." : "Criar Competição"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-12 font-semibold text-muted-foreground hover:text-primary"
                    onClick={() => setShowJoinRoom(true)}
                  >
                    Já tem um código? Entrar na sala
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-3">
                  <Label
                    htmlFor="roomCode"
                    className="text-xs uppercase tracking-widest font-bold text-muted-foreground px-1"
                  >
                    Código da Arena
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="roomCode"
                      placeholder="ABCDE"
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(e.target.value.toUpperCase())
                      }
                      className="pl-12 h-14 text-2xl font-black tracking-[0.5em] uppercase border-primary/20"
                      maxLength={5}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]"
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim() || loading}
                  >
                    {loading ? "Localizando..." : "Entrar na Arena"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setShowJoinRoom(false);
                      setRoomCode("");
                    }}
                  >
                    Voltar para criação
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
