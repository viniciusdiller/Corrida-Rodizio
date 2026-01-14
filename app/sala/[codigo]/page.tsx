"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import confetti from "canvas-confetti";

import { RoomHeader } from "@/components/room/room-header";
import { RoomInfo } from "@/components/room/room-info";
import { PersonalProgress } from "@/components/room/personal-progress";
import { RankingSection } from "@/components/room/ranking-section";
import { HallOfFame } from "@/components/room/hall-of-fame";
import { TeamSelection } from "@/components/room/team-selection";
import { LoadingScreen } from "@/components/room/loading-screen";

import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { Button } from "@/components/ui/button";
import type { Race, Participant } from "@/types/database";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCodeRaw = params.codigo as string;
  const roomCode = roomCodeRaw.toUpperCase();

  const [race, setRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<
    string | null
  >(null);

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

      if (participantsData) setParticipants(participantsData);
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

  useEffect(() => {
    loadRoomData();
    const storedId = localStorage.getItem(getParticipantStorageKey(roomCode));
    setCurrentParticipantId(storedId);

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

  if (loading) return <LoadingScreen />;
  if (!race) return null;

  const currentParticipant = participants.find(
    (p) => p.id === currentParticipantId
  );
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <RoomHeader
          roomCode={roomCode}
          canEndRace={!!currentParticipant?.is_vip}
          isEnding={isEnding}
          copied={copied}
          onExit={() => router.push("/")}
          onEndRace={endRace}
          onCopyCode={() => {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />

        <RoomInfo race={race} participantsCount={participants.length} />

        {currentParticipant && (
          <PersonalProgress
            participant={currentParticipant}
            getItemLabel={getItemLabel}
            onUpdateCount={updateCount}
            onUpdateAvatar={updateAvatar}
            isUpdatingAvatar={isUpdatingAvatar}
          />
        )}

        <RankingSection
          race={race}
          participants={participants}
          currentParticipantId={currentParticipantId}
          getItemLabel={getItemLabel}
        />
      </div>

      {currentParticipant && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl shadow-primary/30"
          onClick={() => updateCount(currentParticipant.id, 1)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
