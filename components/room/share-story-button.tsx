"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { toBlob } from "html-to-image";
import { Instagram, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Race, Participant } from "@/types/database";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";

type HallOfFameViewMode = "big" | "compact";

const TEAM_OPTIONS = [
  { id: "AZUL", nameClass: "text-blue-300" },
  { id: "VERMELHA", nameClass: "text-red-300" },
  { id: "VERDE", nameClass: "text-emerald-300" },
  { id: "AMARELA", nameClass: "text-yellow-300" },
];

interface ShareStoryButtonProps {
  race: Race;
  participants: Participant[];
  maxScore: number;
  getItemLabel: (count: number) => string;
  viewMode: HallOfFameViewMode;
  className?: string;
}

export function ShareStoryButton({
  race,
  participants,
  maxScore,
  getItemLabel,
  viewMode,
  className,
}: ShareStoryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [logoBase64, setLogoBase64] = useState("/logo-big-light.png");
  const storyRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const MOTIVATIONAL_PHRASES =
    race.food_type === "drinks"
      ? (t.hall_of_fame.drinks_phrases ?? t.hall_of_fame.phrases)
      : t.hall_of_fame.phrases;

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch("/logo-big-light.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setLogoBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Erro ao carregar logo para share", e);
      }
    };
    loadLogo();
  }, []);

  const displayParticipants = useMemo(
    () => participants.slice(0, viewMode === "compact" ? 10 : 7),
    [participants, viewMode],
  );

  const waitForImages = async (node: HTMLElement) => {
    const images = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const finish = () => resolve();
            img.addEventListener("load", finish, { once: true });
            img.addEventListener("error", finish, { once: true });
          }),
      ),
    );
  };

  const handleShare = async () => {
    if (!storyRef.current) return;
    setLoading(true);

    try {
      await waitForImages(storyRef.current);
      await new Promise((resolve) => setTimeout(resolve, 120));

      const blob = await toBlob(storyRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#09090b",
        width: 450,
        height: 800,
        fetchRequestInit: { mode: "cors", credentials: "omit" },
        style: {
          width: "450px",
          height: "800px",
          visibility: "visible",
          opacity: "1",
          overflow: "hidden",
        },
      });

      if (!blob) throw new Error("Falha ao gerar imagem");

      const file = new File([blob], "hall-of-fame.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Hall of Fame - Rodízio Race",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "hall-of-fame.png";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={loading}
        className={`w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Instagram className="h-4 w-4" />
        )}
        {loading ? "Gerando Story..." : t.hall_of_fame.share}
      </Button>

      <div className="fixed top-0 left-[-9999px] opacity-0 pointer-events-none">
        <div
          ref={storyRef}
          className={`w-[450px] h-[800px] bg-zinc-950 text-white flex flex-col items-center relative overflow-hidden font-sans ${
            viewMode === "compact" ? "px-4 py-5" : "px-6 py-6"
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_60%)] z-0" />
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.1),transparent_50%)] z-0" />

          <div className={`w-full flex flex-col items-center z-10 ${viewMode === "compact" ? "gap-1 pt-2" : "gap-2 pt-3"}`}>
            <Trophy className={viewMode === "compact" ? "h-5 w-5 text-orange-400" : "h-7 w-7 text-orange-400"} />
            <img
              src={logoBase64}
              alt="Rodízio Race"
              className={viewMode === "compact" ? "w-32 object-contain drop-shadow-2xl" : "w-36 object-contain drop-shadow-2xl"}
              crossOrigin="anonymous"
            />

            <div className="text-center">
              <h2 className={`${viewMode === "compact" ? "text-xl" : "text-2xl"} font-black italic tracking-tighter uppercase text-white drop-shadow-md`}>
                {t.hall_of_fame.title}
              </h2>
              <div className="inline-block mt-1 px-4 py-0.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                <p className="text-orange-400 font-mono text-xs tracking-widest font-bold">
                  SALA: {race.room_code}
                </p>
              </div>
            </div>
          </div>

          <div className={`w-full z-10 flex-1 flex flex-col ${viewMode === "compact" ? "gap-1.5 mt-2" : "gap-2 mt-4"}`}>
            {displayParticipants.map((p, i) => {
              const isWinner = p.items_eaten === maxScore && maxScore > 0;
              const team = TEAM_OPTIONS.find((t) => t.id === p.team);

              return (
                <div
                  key={p.id}
                  className={`relative overflow-hidden flex items-center justify-between rounded-xl border-2 shadow-lg ${
                    viewMode === "compact" ? "px-2 py-1.5" : "px-3 py-2.5"
                  } ${
                    isWinner
                      ? "border-orange-500 bg-gradient-to-r from-orange-500/20 to-orange-900/20"
                      : "border-white/5 bg-zinc-900/80 backdrop-blur-sm"
                  }`}
                >
                  <div className={`flex items-center z-10 ${viewMode === "compact" ? "gap-2" : "gap-2.5"}`}>
                    <div className={`${viewMode === "compact" ? "text-lg w-5" : "text-2xl w-6"} font-black italic text-center opacity-50`}>
                      #{i + 1}
                    </div>

                    <div className="relative">
                      {p.avatar && isImageAvatar(p.avatar) ? (
                        <img
                          src={getAvatarUrl(p.avatar)}
                          alt=""
                          className={viewMode === "compact" ? "h-7 w-7 object-contain drop-shadow-md" : "h-9 w-9 object-contain drop-shadow-md"}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className={viewMode === "compact" ? "inline-block h-7 w-7 rounded-full bg-white/10" : "inline-block h-9 w-9 rounded-full bg-white/10"} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`font-bold leading-tight truncate ${
                          viewMode === "compact" ? "text-[13px] max-w-[230px]" : "text-base max-w-[220px]"
                        } ${isWinner ? "text-white" : "text-zinc-200"} ${
                          race.is_team_mode && team ? team.nameClass : ""
                        }`}
                      >
                        {p.name}
                      </p>
                      <p className={`${viewMode === "compact" ? "text-[7px] max-w-[235px]" : "text-[8px] max-w-[220px]"} text-zinc-400 uppercase font-bold tracking-wider truncate`}>
                        {isWinner
                          ? "👑 " + t.hall_of_fame.legendary
                          : MOTIVATIONAL_PHRASES[i % MOTIVATIONAL_PHRASES.length]}
                      </p>
                    </div>
                  </div>

                  <div className="text-right z-10 pl-2 shrink-0">
                    <p className={`${viewMode === "compact" ? "text-lg" : "text-xl"} font-black leading-none ${isWinner ? "text-orange-400" : "text-white"}`}>
                      {p.items_eaten}
                    </p>
                    <p className={`${viewMode === "compact" ? "text-[6px]" : "text-[7px]"} uppercase font-bold text-zinc-500 mt-0.5`}>
                      {getItemLabel(p.items_eaten)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`w-full z-10 flex flex-col items-center ${viewMode === "compact" ? "gap-1 mt-2" : "gap-2 mt-3"}`}>
            <div className={`${viewMode === "compact" ? "text-xs" : "text-sm"} bg-white text-black px-4 py-0.5 rounded-full font-black tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.3)]`}>
              rodiziorace.mechama.eu
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
