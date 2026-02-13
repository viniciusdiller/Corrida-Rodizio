"use client";

import { useState, useRef, useEffect } from "react";
import { toBlob } from "html-to-image";
import { Instagram, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Race, Participant } from "@/types/database";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";

const TEAM_OPTIONS = [
  { id: "AZUL", shortLabel: "Azul", pillClass: "bg-blue-500/20 text-blue-300" },
  {
    id: "VERMELHA",
    shortLabel: "Vermelho",
    pillClass: "bg-red-500/20 text-red-300",
  },
  {
    id: "VERDE",
    shortLabel: "Verde",
    pillClass: "bg-emerald-500/20 text-emerald-300",
  },
  {
    id: "AMARELA",
    shortLabel: "Amarelo",
    pillClass: "bg-yellow-500/20 text-yellow-300",
  },
];

interface ShareStoryButtonProps {
  race: Race;
  participants: Participant[];
  maxScore: number;
  getItemLabel: (count: number) => string;
  className?: string;
}

export function ShareStoryButton({
  race,
  participants,
  maxScore,
  getItemLabel,
  className,
}: ShareStoryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [logoBase64, setLogoBase64] = useState("/logo-big-light.png");
  const storyRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const MOTIVATIONAL_PHRASES = t.hall_of_fame.phrases;

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

  const displayParticipants = participants.slice(0, 8);

  const handleShare = async () => {
    if (!storyRef.current) return;
    setLoading(true);

    try {
      // Pequeno delay para garantir que o DOM esteja estável
      await new Promise((resolve) => setTimeout(resolve, 100));

      const blob = await toBlob(storyRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#09090b",
        width: 450,
        height: 800,
        // Força o carregamento de imagens externas/locais se necessário
        style: {
          visibility: "visible",
          opacity: "1",
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

      {/* ELEMENTO ESCONDIDO (Template do Story) */}
      <div className="fixed top-0 left-[-9999px] opacity-0 pointer-events-none">
        <div
          ref={storyRef}
          className="w-[450px] min-h-[800px] bg-zinc-950 text-white p-6 flex flex-col items-center justify-between relative overflow-hidden font-sans"
        >
          {/* Fundo Decorativo */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_60%)] z-0" />
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.1),transparent_50%)] z-0" />

          {/* CABEÇALHO: Compactado (pt-4, gap-2, logo w-36) */}
          <div className="w-full flex flex-col items-center gap-2 z-10 pt-4">
            {/* Usa o Base64 aqui */}
            <img
              src={logoBase64}
              alt="Rodízio Race"
              className="w-36 object-contain drop-shadow-2xl"
              crossOrigin="anonymous"
            />

            <div className="text-center">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white drop-shadow-md">
                {t.hall_of_fame.title}
              </h2>
              <div className="inline-block mt-1 px-4 py-0.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                <p className="text-orange-400 font-mono text-xs tracking-widest font-bold">
                  SALA: {race.room_code}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full z-10 pb-4 flex flex-col items-center gap-2 mt-2">
            <div className="bg-white text-black px-4 py-0.5 rounded-full font-black text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              rodiziorace.mechama.eu
            </div>
          </div>

          {/* LISTA: Compactado space-y e padding dos cards para caber 8 */}
          <div className="w-full space-y-2 z-10 flex-1 flex flex-col justify-start pb-4">
            {displayParticipants.map((p, i) => {
              const isWinner = p.items_eaten === maxScore && maxScore > 0;
              const team = TEAM_OPTIONS.find((t) => t.id === p.team);

              return (
                <div
                  key={p.id}
                  className={`relative overflow-hidden flex items-center justify-between p-2.5 rounded-xl border-2 shadow-lg ${
                    isWinner
                      ? "border-orange-500 bg-gradient-to-r from-orange-500/20 to-orange-900/20 scale-105 z-20"
                      : "border-white/5 bg-zinc-900/80 backdrop-blur-sm"
                  }`}
                >
                  <div className="flex items-center gap-2.5 z-10">
                    <div className="text-2xl font-black italic w-6 text-center opacity-50">
                      #{i + 1}
                    </div>

                    <div className="relative">
                      {isImageAvatar(p.avatar) ? (
                        <img
                          src={getAvatarUrl(p.avatar)}
                          alt=""
                          className="h-9 w-9 object-contain drop-shadow-md"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span className="inline-block h-9 w-9 rounded-full bg-white/10" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`font-bold text-base leading-tight flex items-center gap-2 ${isWinner ? "text-white" : "text-zinc-200"}`}
                      >
                        {p.name}
                        {race.is_team_mode && team && (
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded uppercase ${team.pillClass}`}
                          >
                            {team.shortLabel}
                          </span>
                        )}
                      </p>
                      <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider max-w-[220px] truncate">
                        {isWinner
                          ? "👑 " + t.hall_of_fame.legendary
                          : MOTIVATIONAL_PHRASES[
                              i % MOTIVATIONAL_PHRASES.length
                            ]}
                      </p>
                    </div>
                  </div>

                  <div className="text-right z-10 pl-2">
                    <p
                      className={`text-xl font-black leading-none ${isWinner ? "text-orange-400" : "text-white"}`}
                    >
                      {p.items_eaten}
                    </p>
                    <p className="text-[7px] uppercase font-bold text-zinc-500 mt-0.5">
                      {getItemLabel(p.items_eaten)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
