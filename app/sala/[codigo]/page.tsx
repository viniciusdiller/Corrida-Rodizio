"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Copy,
  Trophy,
  Users,
  Plus,
  Minus,
  Check,
  Flag,
  Instagram,
  Home,
  Users2,
  Sword,
} from "lucide-react";
import type { Race, Participant, FoodType } from "@/types/database";
import { FoodIcon } from "@/components/food-icon";
import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { AVATAR_OPTIONS, DEFAULT_AVATAR } from "@/lib/utils/avatars";
import confetti from "canvas-confetti";
import { ThemeToggle } from "@/components/theme-toggle";

const MOTIVATIONAL_PHRASES = [
  "O importante é que a barriga está cheia!",
  "Na próxima você pede reforço!",
  "Faltou um espacinho para a sobremesa?",
  "O estômago é o limite, mas hoje você parou antes!",
  "O vice-campeão também ganha... a conta!",
  "Treino é treino, rodízio é jogo!",
  "Guerreiro(a), mas o estômago não ajudou!",
  "A vitória escapou, mas a conta chegou igual!",
  "Hoje o campeão foi o garçom!",
  "Faltou gás no final, mas o começo foi histórico!",
  "Seu estômago entrou em modo economia de energia!",
  "A competição acabou, a digestão começou!",
  "Não foi derrota, foi estratégia de sobrevivência!",
  "Seu limite foi atingido antes do garçom!",
  "O campeão come mais, mas você comeu bem!",
  "Derrota honrosa: saiu andando, não rolando!",
];

const TEAM_OPTIONS = [
  {
    id: "AZUL",
    label: "Time Azul",
    shortLabel: "Azul",
    badgeClass: "border-blue-500/40 text-blue-500",
    pillClass: "bg-blue-500/20 text-blue-300",
    cardClass: "border-l-4 border-l-blue-500 bg-blue-500/5",
    scoreClass: "text-blue-500",
  },
  {
    id: "VERMELHA",
    label: "Time Vermelho",
    shortLabel: "Vermelho",
    badgeClass: "border-red-500/40 text-red-500",
    pillClass: "bg-red-500/20 text-red-300",
    cardClass: "border-l-4 border-l-red-500 bg-red-500/5",
    scoreClass: "text-red-500",
  },
  {
    id: "VERDE",
    label: "Time Verde",
    shortLabel: "Verde",
    badgeClass: "border-emerald-500/40 text-emerald-400",
    pillClass: "bg-emerald-500/20 text-emerald-300",
    cardClass: "border-l-4 border-l-emerald-500 bg-emerald-500/5",
    scoreClass: "text-emerald-400",
  },
  {
    id: "AMARELA",
    label: "Time Amarelo",
    shortLabel: "Amarelo",
    badgeClass: "border-yellow-500/40 text-yellow-400",
    pillClass: "bg-yellow-500/20 text-yellow-300",
    cardClass: "border-l-4 border-l-yellow-500 bg-yellow-500/5",
    scoreClass: "text-yellow-400",
  },
] as const;

type TeamId = (typeof TEAM_OPTIONS)[number]["id"];

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.codigo as string;

  const [race, setRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<
    string | null
  >(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);

  const getItemLabel = (foodType: FoodType, count: number) => {
    const labels = {
      pizza: count === 1 ? "pedaço" : "pedaços",
      sushi: count === 1 ? "peça" : "peças",
      burger: count === 1 ? "burger" : "burgers",
    };
    return labels[foodType];
  };

  const getAvatar = (participant: Participant) =>
    participant.avatar || DEFAULT_AVATAR;

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const loadRoomData = async () => {
    try {
      const supabase = createClient();
      const { data: raceData, error: raceError } = await supabase
        .from("races")
        .select()
        .eq("room_code", roomCode.toUpperCase())
        .single();

      if (raceError || !raceData) {
        router.push("/");
        return;
      }

      if (race && race.is_active && !raceData.is_active) {
        triggerConfetti();
      }

      setRace(raceData);

      const { data: participantsData } = await supabase
        .from("participants")
        .select()
        .eq("race_id", raceData.id)
        .order("items_eaten", { ascending: false });

      if (participantsData) setParticipants(participantsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateCount = async (participantId: string, change: number) => {
    if (participantId !== currentParticipantId || !race?.is_active) return;
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;

    const newCount = Math.max(0, participant.items_eaten + change);
    try {
      const supabase = createClient();
      await supabase
        .from("participants")
        .update({ items_eaten: newCount })
        .eq("id", participantId);
    } catch (error) {
      console.error(error);
    }
  };

  const updateAvatar = async (avatar: string) => {
    if (!currentParticipantId || isUpdatingAvatar) return;
    setIsUpdatingAvatar(true);
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === currentParticipantId
          ? { ...participant, avatar }
          : participant
      )
    );
    try {
      const supabase = createClient();
      await supabase
        .from("participants")
        .update({ avatar })
        .eq("id", currentParticipantId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const updateTeam = async (team: TeamId) => {
    if (!currentParticipantId || isUpdatingTeam || !race?.is_team_mode) return;
    setIsUpdatingTeam(true);
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === currentParticipantId
          ? { ...participant, team }
          : participant
      )
    );
    try {
      const supabase = createClient();
      await supabase
        .from("participants")
        .update({ team })
        .eq("id", currentParticipantId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const endRace = async () => {
    if (!race || !currentParticipant?.is_vip) return;
    setIsEnding(true);
    try {
      const supabase = createClient();
      await supabase
        .from("races")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", race.id);

      triggerConfetti();
      await loadRoomData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsEnding(false);
    }
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    loadRoomData();
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => loadRoomData()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "races" },
        () => loadRoomData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  useEffect(() => {
    setCurrentParticipantId(
      localStorage.getItem(getParticipantStorageKey(roomCode))
    );
  }, [roomCode]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Sintonizando arena...
          </span>
        </div>
      </div>
    );

  if (!race) return null;

  // CALCULOS DE EQUIPE E RANKING
  const teamScores = TEAM_OPTIONS.map((team) => ({
    ...team,
    score: participants
      .filter((p) => p.team === team.id)
      .reduce((acc, p) => acc + p.items_eaten, 0),
  }));
  const teamRankings = TEAM_OPTIONS.map((team) => {
    const members = participants
      .filter((participant) => participant.team === team.id)
      .sort((a, b) => b.items_eaten - a.items_eaten);
    const topScore = members[0]?.items_eaten ?? 0;
    return {
      ...team,
      total: members.reduce(
        (acc, participant) => acc + participant.items_eaten,
        0
      ),
      members,
      topScore,
    };
  });
  const unassignedMembers = participants
    .filter((participant) => !participant.team)
    .sort((a, b) => b.items_eaten - a.items_eaten);
  const unassignedTopScore = unassignedMembers[0]?.items_eaten ?? 0;
  const maxScore =
    participants.length > 0
      ? Math.max(...participants.map((p) => p.items_eaten))
      : 0;

  // VIEW: TELA DE RESULTADOS (HALL OF FAME)
  if (!race.is_active) {
    const highestTeamScore = Math.max(...teamScores.map((team) => team.score));
    const winningTeams = teamScores.filter(
      (team) => team.score === highestTeamScore && highestTeamScore > 0
    );
    const winningTeam = winningTeams.length === 1 ? winningTeams[0] : null;

    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center animate-in fade-in duration-1000">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block p-3 bg-orange-500 rounded-2xl rotate-3 shadow-2xl shadow-orange-500/20">
              <Trophy className="h-10 w-10 text-zinc-950" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                Hall of Fame
              </h1>
              <p className="text-orange-500 font-mono text-sm tracking-widest">
                SALA: {race.room_code}
              </p>
            </div>
          </div>

          {/* ANÚNCIO DE EQUIPE VENCEDORA */}
          {race.is_team_mode && (
            <Card
              className={`border-none ${
                winningTeam ? "bg-primary/20" : "bg-muted/20"
              }`}
            >
              <CardContent className="p-6 text-center space-y-2 text-white">
                <Badge
                  variant="outline"
                  className="uppercase font-black tracking-widest text-[10px]"
                >
                  Resultado por Equipe
                </Badge>
                <h2 className="text-2xl font-black italic ">
                  {winningTeam
                    ? `TIME ${winningTeam.shortLabel.toUpperCase()} VENCEU!`
                    : "EMPATE TÉCNICO!"}
                </h2>
                <div className="flex flex-wrap justify-center gap-4 text-sm font-bold opacity-70">
                  {teamScores.map((team) => (
                    <span key={team.id}>
                      {team.shortLabel.toUpperCase()}: {team.score}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {participants.map((p, i) => {
              const isWinner = p.items_eaten === maxScore && maxScore > 0;
              return (
                <div
                  key={p.id}
                  className={`relative overflow-hidden flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                    isWinner
                      ? "border-orange-500 bg-orange-500/10 scale-105 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                      : "border-white/5 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-4 z-10">
                    <div className="text-3xl">{getAvatar(p)}</div>
                    <span
                      className={`text-2xl font-black ${
                        isWinner ? "text-orange-500" : "text-zinc-700"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-xl leading-tight flex items-center gap-2">
                        {p.name}
                        {p.is_vip && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 uppercase font-black tracking-widest">
                            VIP
                          </span>
                        )}
                        {race.is_team_mode && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              TEAM_OPTIONS.find((team) => team.id === p.team)
                                ?.pillClass ??
                              "bg-muted/30 text-muted-foreground"
                            }`}
                          >
                            {TEAM_OPTIONS.find((team) => team.id === p.team)
                              ?.shortLabel ?? "Sem time"}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        {isWinner
                          ? "🏆 Lendário Comilão"
                          : MOTIVATIONAL_PHRASES[
                              i % MOTIVATIONAL_PHRASES.length
                            ]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right z-10">
                    <p className="text-3xl font-black leading-none">
                      {p.items_eaten}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">
                      {getItemLabel(race.food_type, p.items_eaten)}
                    </p>
                  </div>
                  {isWinner && (
                    <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12">
                      <Trophy size={100} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-zinc-500 animate-bounce">
              <Instagram className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Print & Post
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4 mr-2" /> Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: SALA ATIVA
  const currentParticipant = participants.find(
    (p) => p.id === currentParticipantId
  );
  const canEndRace = Boolean(currentParticipant?.is_vip);

  const renderParticipantCard = (
    participant: Participant,
    index: number,
    isPersonal = false
  ) => {
    const isLeader = index === 0 && participant.items_eaten > 0;
    const avatar = getAvatar(participant);
    return (
      <Card
        className={`overflow-hidden border-none transition-all duration-300 ${
          isPersonal
            ? "ring-2 ring-primary shadow-xl scale-[1.02]"
            : "shadow-md bg-card/60"
        } ${
          isLeader ? "bg-gradient-to-r from-yellow-500/5 to-orange-500/5" : ""
        }`}
      >
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-xl font-black ${
                  isLeader
                    ? "bg-yellow-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isLeader ? <Trophy className="h-4 w-4" /> : index + 1}
              </div>
              <div className="text-2xl">{avatar}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    {participant.name}
                  </span>
                  {participant.is_vip && (
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-none text-[9px] h-4 uppercase">
                      VIP
                    </Badge>
                  )}
                  {race.is_team_mode && participant.team && (
                    <Badge
                      variant="outline"
                      className={`text-[9px] h-4 px-1.5 ${
                        TEAM_OPTIONS.find(
                          (team) => team.id === participant.team
                        )?.badgeClass ?? "border-muted text-muted-foreground"
                      }`}
                    >
                      {TEAM_OPTIONS.find((team) => team.id === participant.team)
                        ?.shortLabel ?? "Sem time"}
                    </Badge>
                  )}
                  {participant.id === currentParticipantId && !isPersonal && (
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] h-5 uppercase">
                      Você
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                  {participant.items_eaten}{" "}
                  {getItemLabel(race.food_type, participant.items_eaten)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {participant.id === currentParticipantId && (
                <div className="flex items-center gap-1 bg-background/50 p-1 rounded-2xl border border-muted">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => updateCount(participant.id, -1)}
                    disabled={participant.items_eaten === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-10 text-center text-xl font-black">
                    {participant.items_eaten}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                    onClick={() => updateCount(participant.id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {participant.id !== currentParticipantId && (
                <div className="text-2xl font-black text-muted-foreground/30 pr-1">
                  {participant.items_eaten}
                </div>
              )}
            </div>
          </div>
          {isPersonal && participant.id === currentParticipantId && (
            <div className="pt-4 border-t border-muted/40 mt-4 space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Escolha seu avatar
              </Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((option) => {
                  const isSelected = option === avatar;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateAvatar(option)}
                      className={`w-10 h-10 rounded-xl border transition-all text-lg flex items-center justify-center ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 bg-primary/10"
                          : "border-muted hover:border-primary/40"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Sair
          </Button>

          {canEndRace && (
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl font-bold gap-2 shadow-lg shadow-destructive/20"
              onClick={endRace}
              disabled={isEnding}
            >
              <Flag className="h-4 w-4" />{" "}
              {isEnding ? "Encerrando..." : "Encerrar Competição"}
            </Button>
          )}

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Sala
              </p>
              <p className="font-mono font-bold text-base sm:text-lg leading-none">
                {race.room_code}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={copyRoomCode}
              className="h-10 w-10 rounded-xl"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-card shadow-xl border border-muted mb-2">
            <FoodIcon
              type={race.food_type}
              className="h-10 w-10 text-primary"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">
              Competição de
            </h2>
            <h1 className="text-4xl font-black capitalize">
              {race.food_type === "sushi" ? "Rodízio Japa" : race.food_type}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 text-muted-foreground font-bold text-xs uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {participants.length} Jogadores
            </span>
            <span className="w-1 h-1 bg-muted rounded-full" />
            <span className="text-primary animate-pulse">● Ao Vivo</span>
          </div>
        </div>

        {race.is_team_mode &&
          currentParticipant &&
          !currentParticipant.team && (
            <Card className="border-none shadow-lg shadow-black/5 bg-card/70">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Escolha seu time
                  </Label>
                  <p className="text-sm font-medium text-muted-foreground">
                    Entre no placar selecionando seu time agora.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TEAM_OPTIONS.map((team) => (
                    <Button
                      key={team.id}
                      type="button"
                      variant="outline"
                      className={`h-11 rounded-xl font-bold ${team.badgeClass}`}
                      onClick={() => updateTeam(team.id)}
                      disabled={isUpdatingTeam}
                    >
                      {team.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {currentParticipant && (
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">
              Seu Progresso
            </Label>
            {renderParticipantCard(
              currentParticipant,
              participants.findIndex((p) => p.id === currentParticipantId),
              true
            )}
          </div>
        )}

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {race.is_team_mode ? "Ranking por Time" : "Ranking Geral"}
            </Label>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {participants.length <= 1 && (
              <div className="py-12 text-center bg-card/40 rounded-3xl border border-dashed border-muted">
                <p className="text-sm font-medium text-muted-foreground italic">
                  Aguardando rivais entrarem...
                </p>
              </div>
            )}
            {race.is_team_mode ? (
              <div className="space-y-4">
                {teamRankings.map((team, teamIndex) => (
                  <Card
                    key={team.id}
                    className={`overflow-hidden border-none shadow-md ${team.cardClass}`}
                    style={{ animationDelay: `${teamIndex * 60}ms` }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex items-center gap-2 ${team.scoreClass}`}
                        >
                          <Sword className="h-4 w-4" />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {team.label}
                          </span>
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                          Total {team.total}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {team.members.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-muted/60 p-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Sem jogadores
                          </div>
                        ) : (
                          team.members.map((member, memberIndex) => {
                            const isMvp =
                              team.topScore > 0 &&
                              member.items_eaten === team.topScore;
                            return (
                              <div
                                key={member.id}
                                className="flex items-center justify-between rounded-2xl bg-background/70 px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {getAvatar(member)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                      {member.name}
                                    </span>
                                    {member.id === currentParticipantId && (
                                      <Badge className="bg-primary/10 text-primary border-none text-[9px] h-4 uppercase">
                                        Você
                                      </Badge>
                                    )}
                                    {isMvp && (
                                      <Badge className="bg-yellow-500/20 text-yellow-700 border-none text-[9px] h-4 uppercase">
                                        MVP
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm font-black text-muted-foreground">
                                  {member.items_eaten}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {unassignedMembers.length > 0 && (
                  <Card className="overflow-hidden border-none shadow-md bg-muted/40">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users2 className="h-4 w-4" />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            Sem time
                          </span>
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                          Total{" "}
                          {unassignedMembers.reduce(
                            (acc, participant) => acc + participant.items_eaten,
                            0
                          )}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {unassignedMembers.map((member) => {
                          const isMvp =
                            unassignedTopScore > 0 &&
                            member.items_eaten === unassignedTopScore;
                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between rounded-2xl bg-background/70 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {getAvatar(member)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">
                                    {member.name}
                                  </span>
                                  {member.id === currentParticipantId && (
                                    <Badge className="bg-primary/10 text-primary border-none text-[9px] h-4 uppercase">
                                      Você
                                    </Badge>
                                  )}
                                  {isMvp && (
                                    <Badge className="bg-yellow-500/20 text-yellow-700 border-none text-[9px] h-4 uppercase">
                                      MVP
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-black text-muted-foreground">
                                {member.items_eaten}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {renderParticipantCard(participant, index)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {currentParticipant && (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl shadow-primary/30"
          onClick={() => updateCount(currentParticipant.id, 1)}
          aria-label="Adicionar item ao contador"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
