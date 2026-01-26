"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Flag, Plus } from "lucide-react";
import confetti from "canvas-confetti";

import { RoomHeader } from "@/components/room/room-header";
import { RoomInfo } from "@/components/room/room-info";
import { PersonalProgress } from "@/components/room/personal-progress";
import { RankingSection } from "@/components/room/ranking-section";
import { HallOfFame } from "@/components/room/hall-of-fame";
import { RaceTrack } from "@/components/room/race-track";
import { LoadingScreen } from "@/components/room/loading-screen";

import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { Button } from "@/components/ui/button";
import type { Race, Participant } from "@/types/database";
import { TeamSelection } from "@/components/room/team-selection";

export default function RoomPage() {
  const LOGIN_STORAGE_KEY = "rodizio-race-login";
  const addCooldownMs = 2_000;
  const cooldownMessages = [
    "Respira campeão, isso não é maratona.",
    "Já pensou em mastigar?",
    "Calma que o garçom não vai fugir.",
    "Isso é rodízio, não último jantar.",
    "Menos garfo, mais dignidade.",
    "Vai devagar antes que dê ruim.",
    "O estômago pediu arrego.",
    "Você não ganha ponto por velocidade.",
    "O prato ainda nem esfriou.",
    "Mastiga ou só engole?",
    "Vai com calma que o banheiro cobra depois.",
    "Isso não é desafio do YouTube.",
    "A comida não vai acabar.",
    "Segura a fome ancestral.",
    "O rodízio confia em você.",
    "Daqui a pouco o corpo desliga.",
    "O fígado está observando.",
    "Você quer comer ou desaparecer?",
    "Dá um tempo pro estômago entender.",
    "Isso não é prova olímpica.",
    "Vai virar estatística.",
    "O garçom já está preocupado.",
    "A cadeira já está rangendo.",
    "Comendo assim nem sente o gosto.",
    "Pausa estratégica, guerreiro.",
    "A digestão também precisa viver.",
    "Já bateu o recorde do exagero.",
    "Calma antes que o arroz volte.",
    "A sobremesa ainda existe.",
    "Isso é jantar, não vingança.",
    "O estômago não é buraco negro.",
    "Vai devagar ou vai chorar depois.",
    "Seu corpo pediu intervalo.",
    "Mastigar é opcional agora?",
    "Já estamos julgando em silêncio.",
    "Isso não é speedrun.",
    "O prato está pedindo socorro.",
    "Menos voracidade, mais classe.",
    "O rodízio não vai te abandonar.",
    "O banheiro está lotado.",
    "Come igual gente, não igual lenda urbana.",
    "Você já venceu, relaxa.",
    "A comida não te deve nada.",
    "Vai com calma antes do arrependimento.",
    "Isso não é teste de resistência.",
    "O estômago está digitando um email.",
    "Já estamos no limite humano.",
    "A próxima mordida pode ser a última.",
    "Dá um tempo pra gravidade agir.",
    "Seu metabolismo não assinou isso.",
    "Você não precisa provar nada.",
    "O corpo já entrou em modo alerta.",
    "Isso não é competição de engolir.",
    "O prato não vai fugir.",
    "Vai virar história triste.",
    "Já passou do ponto gourmet.",
    "Seu estômago pediu trégua.",
    "Isso aí já é ganância.",
    "Come menos, vive mais.",
    "O rodízio agradece a pausa.",
    "Seu corpo está negociando limites.",
    "Isso é fome ou trauma?",
    "Vai devagar que dói menos.",
    "A comida merece respeito.",
    "Já estamos preocupados com você.",
    "Isso não acaba bem.",
    "O estômago já fechou pra balanço.",
    "Respira entre uma garfada e outra.",
    "Isso não é prova eliminatória.",
    "O rodízio não é contra você.",
    "Seu corpo não é triturador.",
    "Já entrou no modo exagero.",
    "Vai com calma que ainda tem tempo.",
    "A próxima garfada é opcional.",
    "Isso já virou abuso gastronômico.",
    "O estômago está cansado.",
    "Você não é uma sucuri.",
    "Come devagar pra não sofrer.",
    "O rodízio não vale internação.",
    "Já deu pra impressionar.",
    "Seu corpo não pediu isso.",
    "Isso é jantar, não desafio mortal.",
    "A digestão não é instantânea.",
    "Vai virar meme interno.",
    "O prato está te julgando.",
    "Isso não é fim do mundo.",
    "Seu estômago está em pânico.",
    "Dá um tempo antes do colapso.",
    "Menos pressa, mais sobrevivência.",
    "Isso já é excesso.",
    "O rodízio continua amanhã.",
    "Vai com calma, herói do garfo.",
  ];

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCodeRaw = params.codigo as string;
  const roomCode = roomCodeRaw.toUpperCase();
  const isSpectator = searchParams.get("spectator") === "1";

  const [race, setRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isPremiumPlayer, setIsPremiumPlayer] = useState(false);
  const [exclusiveAvatars, setExclusiveAvatars] = useState<string[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<
    string | null
  >(null);
  const [showEndRaceToast, setShowEndRaceToast] = useState(false);
  const [cooldownToast, setCooldownToast] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [isAddCooldownActive, setIsAddCooldownActive] = useState(false);
  const lastAddAtRef = useRef<number | null>(null);
  const cooldownToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const addCooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const getItemLabel = (count: number) => {
    if (!race) return "";
    const labels = {
      pizza: count === 1 ? "pedaço" : "pedaços",
      sushi: count === 1 ? "peça" : "peças",
      burger: count === 1 ? "burger" : "burgers",
    };
    return labels[race.food_type as keyof typeof labels] || "unidades";
  };

  const loadRoomData = async () => {
    try {
      const supabase = createClient();
      const { data: raceData } = await supabase
        .from("races")
        .select()
        .eq("room_code", roomCode)
        .single();

      if (!raceData) {
        router.push("/");
        return;
      }

      setRace(raceData);

      const { data: participantsData } = await supabase
        .from("participants")
        .select()
        .eq("race_id", raceData.id)
        .order("items_eaten", { ascending: false });

      if (participantsData) {
        setParticipants(participantsData);
        if (!isSpectator) {
          const storageKey = getParticipantStorageKey(roomCode);
          const storedId = localStorage.getItem(storageKey);
          if (storedId) {
            setCurrentParticipantId(storedId);
          } else {
            const loginCode = localStorage.getItem(LOGIN_STORAGE_KEY);
            const normalizedLogin = loginCode?.trim().toUpperCase();
            if (normalizedLogin) {
              const match = participantsData.find((participant) => {
                const loginMatch = participant.login_code?.trim().toUpperCase();
                const nameMatch = participant.name?.trim().toUpperCase();
                return (
                  loginMatch === normalizedLogin ||
                  nameMatch === normalizedLogin
                );
              });
              if (match) {
                setCurrentParticipantId(match.id);
                localStorage.setItem(storageKey, match.id);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateCount = async (participantId: string, change: number) => {
    if (participantId !== currentParticipantId || !race?.is_active) return;
    const p = participants.find((item) => item.id === participantId);
    if (!p) return;

    const newCount = Math.max(0, p.items_eaten + change);
    await createClient()
      .from("participants")
      .update({ items_eaten: newCount })
      .eq("id", participantId);
  };

  const showCooldownMessage = (event?: MouseEvent<HTMLButtonElement>) => {
    const message =
      cooldownMessages[Math.floor(Math.random() * cooldownMessages.length)];
    const fallbackX = Math.round(window.innerWidth / 2);
    const fallbackY = Math.round(window.innerHeight / 2);
    setCooldownToast({
      text: message,
      x: event?.clientX ?? fallbackX,
      y: event?.clientY ?? fallbackY,
    });
    if (cooldownToastTimeoutRef.current) {
      clearTimeout(cooldownToastTimeoutRef.current);
    }
    cooldownToastTimeoutRef.current = setTimeout(() => {
      setCooldownToast(null);
    }, 1000);
  };

  const handleUpdateCount = async (
    participantId: string,
    change: number,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    if (change > 0) {
      const now = Date.now();
      const lastAddAt = lastAddAtRef.current ?? 0;
      const remaining = addCooldownMs - (now - lastAddAt);
      if (remaining > 0) {
        showCooldownMessage(event);
        return;
      }
      lastAddAtRef.current = now;
      setIsAddCooldownActive(true);
      if (addCooldownTimeoutRef.current) {
        clearTimeout(addCooldownTimeoutRef.current);
      }
      addCooldownTimeoutRef.current = setTimeout(() => {
        setIsAddCooldownActive(false);
      }, addCooldownMs);
    }

    await updateCount(participantId, change);
  };

  const updateAvatar = async (avatar: string) => {
    if (!currentParticipantId || isUpdatingAvatar) return;
    setIsUpdatingAvatar(true);
    try {
      const supabase = createClient();
      await supabase
        .from("participants")
        .update({ avatar })
        .eq("id", currentParticipantId);
      // O Realtime atualizará o estado automaticamente
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const updateTeam = async (teamId: string) => {
    if (!currentParticipantId || isUpdatingAvatar) return;
    setIsUpdatingAvatar(true);
    try {
      const supabase = createClient();
      await supabase
        .from("participants")
        .update({ team: teamId })
        .eq("id", currentParticipantId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const endRace = async () => {
    if (!race) return;
    setIsEnding(true);
    try {
      const supabase = createClient();
      await supabase
        .from("races")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", race.id);

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      await loadRoomData();
    } finally {
      setIsEnding(false);
    }
  };

  const handleEndRace = () => {
    if (isEnding) return;
    setShowEndRaceToast(true);
  };

  const confirmEndRace = async () => {
    if (isEnding) return;
    await endRace();
    setShowEndRaceToast(false);
  };

  useEffect(() => {
    loadRoomData();
    if (isSpectator) {
      setCurrentParticipantId(null);
    } else {
      const storedId = localStorage.getItem(getParticipantStorageKey(roomCode));
      setCurrentParticipantId(storedId);
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => loadRoomData(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "races" },
        () => loadRoomData(),
      )
      .subscribe();

    return () => {
      if (cooldownToastTimeoutRef.current) {
        clearTimeout(cooldownToastTimeoutRef.current);
      }
      if (addCooldownTimeoutRef.current) {
        clearTimeout(addCooldownTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [roomCode, isSpectator]);

  const currentParticipant = participants.find(
    (p) => p.id === currentParticipantId,
  );

  useEffect(() => {
    let isMounted = true;
    const loadPlayerEntitlements = async () => {
      const loginCode = currentParticipant?.login_code?.trim().toUpperCase();
      if (!loginCode) {
        if (isMounted) {
          setIsPremiumPlayer(false);
          setExclusiveAvatars([]);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data: profileData, error: profileError } = await supabase
          .from("player_profiles")
          .select("is_premium")
          .eq("login_code", loginCode)
          .maybeSingle();

        if (!profileError && isMounted) {
          setIsPremiumPlayer(!!profileData?.is_premium);
        }

        const { data: exclusiveData, error: exclusiveError } = await supabase
          .from("exclusive_avatars")
          .select("avatar")
          .eq("login_code", loginCode);

        if (!exclusiveError && isMounted) {
          setExclusiveAvatars(
            Array.isArray(exclusiveData)
              ? exclusiveData.map((row) => row.avatar)
              : [],
          );
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setIsPremiumPlayer(false);
          setExclusiveAvatars([]);
        }
      }
    };

    loadPlayerEntitlements();
    return () => {
      isMounted = false;
    };
  }, [currentParticipant?.login_code]);

  if (loading) return <LoadingScreen />;
  if (!race) return null;

  const maxScore = Math.max(...participants.map((p) => p.items_eaten), 0);

  if (!race.is_active) {
    return (
      <HallOfFame
        race={race}
        participants={participants}
        maxScore={maxScore}
        getItemLabel={getItemLabel}
        onHome={() => router.push("/")}
      />
    );
  }

  return (
    <div className="min-h-screen min-h-[100svh] bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-8 text-[15px] md:text-base">
      <div className="mx-auto max-w-2xl space-y-6">
        <RoomHeader onExit={() => router.push("/")} />

        <RoomInfo
          race={race}
          participantsCount={participants.length}
          roomCode={roomCode}
          copied={copied}
          onCopyCode={() => {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />

        {race.is_team_mode &&
          currentParticipant &&
          !currentParticipant.team && (
            <TeamSelection
              onUpdateTeam={updateTeam}
              isUpdating={isUpdatingAvatar}
            />
          )}

        {currentParticipant && (
          <PersonalProgress
            participant={currentParticipant}
            getItemLabel={getItemLabel}
            onUpdateCount={handleUpdateCount}
            onUpdateAvatar={updateAvatar}
            isUpdatingAvatar={isUpdatingAvatar}
            isAddCooldown={isAddCooldownActive}
            isPremium={isPremiumPlayer}
            exclusiveAvatars={exclusiveAvatars}
          />
        )}

        {participants.length > 0 && (
          <RaceTrack
            participants={participants}
            isTeamMode={race.is_team_mode}
          />
        )}

        <RankingSection
          race={race}
          participants={participants}
          currentParticipantId={currentParticipantId}
          getItemLabel={getItemLabel}
        />

        {currentParticipant?.is_vip && (
          <div className="flex justify-center pt-2">
            <Button
              variant="destructive"
              className="w-full max-w-xs rounded-xl font-bold gap-2 shadow-lg shadow-destructive/20 cursor-pointer transition-all hover:scale-105"
              onClick={handleEndRace}
              disabled={isEnding}
            >
              <Flag className="h-4 w-4" />
              {isEnding ? "Encerrando..." : "Encerrar Competição"}
            </Button>
          </div>
        )}
      </div>

      {currentParticipant && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          <Button
            size="icon"
            className={`h-14 w-14 rounded-full shadow-xl shadow-primary/30 ${
              isAddCooldownActive ? "opacity-50 grayscale" : ""
            }`}
            onClick={(event) =>
              handleUpdateCount(currentParticipant.id, 1, event)
            }
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
      {cooldownToast && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-full bg-amber-100 px-4 py-2 text-center text-sm font-semibold leading-snug text-amber-800 shadow-sm md:text-[11px]"
          style={{ left: cooldownToast.x, top: cooldownToast.y }}
        >
          {cooldownToast.text}
        </div>
      )}
      {showEndRaceToast && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/60 bg-background/95 p-4 shadow-xl backdrop-blur-sm">
            <p className="text-sm font-semibold text-foreground">
              Encerrar competição agora? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowEndRaceToast(false)}
                disabled={isEnding}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEndRace}
                disabled={isEnding}
              >
                {isEnding ? "Encerrando..." : "Encerrar"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
