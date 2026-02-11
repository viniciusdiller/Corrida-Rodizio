"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Participant } from "@/types/database";
import { Card } from "@/components/ui/card";
import { getAvatarUrl, isGifAvatar, isImageAvatar } from "@/lib/utils/avatars";
import { Trophy, Zap, ZapOff } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const TEAM_COLORS: Record<string, string> = {
  AZUL: "text-blue-400",
  VERMELHA: "text-red-400",
  VERDE: "text-emerald-400",
  AMARELA: "text-yellow-400",
};

// Opções de emojis para as partículas
const DASH_PARTICLES_OPTIONS = ["💨", "🔥", "✨", "⚡", "🌟", "💥"];

// Tipo para armazenar os dados fixos da animação
type BurstEffect = {
  ts: number;
  diff: number;
  particles: Array<{
    emoji: string;
    yDir: number;
    rotDir: number;
    delay: number;
  }>;
};

interface RaceTrackProps {
  participants: Participant[];
  isTeamMode: boolean;
  viewerLoginCode?: string | null;
}

const LOGIN_STORAGE_KEY = "rodizio-race-login";
const ANIMATIONS_STORAGE_PREFIX = "rodizio-race:animations";
const GUEST_ANIMATIONS_KEY = `${ANIMATIONS_STORAGE_PREFIX}:guest`;

const getAnimationsStorageKey = (viewerLoginCode?: string | null) => {
  const normalizedViewer = viewerLoginCode?.trim().toUpperCase();
  if (normalizedViewer) {
    return `${ANIMATIONS_STORAGE_PREFIX}:user:${normalizedViewer}`;
  }

  if (typeof window !== "undefined") {
    const storedLogin = localStorage.getItem(LOGIN_STORAGE_KEY);
    const normalizedStoredLogin = storedLogin?.trim().toUpperCase();
    if (normalizedStoredLogin) {
      return `${ANIMATIONS_STORAGE_PREFIX}:user:${normalizedStoredLogin}`;
    }
  }

  return GUEST_ANIMATIONS_KEY;
};

function AvatarImage({
  avatar,
  enableAnimations,
}: {
  avatar: string;
  enableAnimations: boolean;
}) {
  const isGif = isGifAvatar(avatar);
  const [staticGifFrame, setStaticGifFrame] = useState<string | null>(null);

  useEffect(() => {
    if (!isGif || staticGifFrame) {
      return;
    }

    const image = new Image();
    image.src = getAvatarUrl(avatar);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      setStaticGifFrame(canvas.toDataURL("image/png"));
    };
  }, [avatar, isGif, staticGifFrame]);

  const avatarSrc =
    !enableAnimations && isGif && staticGifFrame
      ? staticGifFrame
      : getAvatarUrl(avatar);

  return (
    <img
      src={avatarSrc}
      alt=""
      className="block h-12 md:h-14 w-auto max-w-none object-contain"
    />
  );
}

export function RaceTrack({
  participants,
  isTeamMode,
  viewerLoginCode,
}: RaceTrackProps) {
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [isPreferenceReady, setIsPreferenceReady] = useState(false);
  const [preferenceKey, setPreferenceKey] = useState<string | null>(null);
  const { t } = useLanguage();

  // Armazena timestamp e as partículas geradas
  const [effectTrigger, setEffectTrigger] = useState<
    Record<string, BurstEffect>
  >({});

  const prevScoresRef = useRef<Record<string, number>>({});
  const hasInitializedRef = useRef(false);

  const scores = participants.map((p) => p.items_eaten);
  const currentMax = scores.length > 0 ? Math.max(...scores) : 0;
  const currentMin = scores.length > 0 ? Math.min(...scores) : 0;
  const range = currentMax - currentMin || 1;

  const sortedByEntry = [...participants].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    const fallbackScores: Record<string, number> = {};
    participants.forEach((participant) => {
      fallbackScores[participant.id] = participant.items_eaten;
    });
    prevScoresRef.current = fallbackScores;

    hasInitializedRef.current = true;
  }, [participants]);

  // Lógica de detecção de pontos
  useEffect(() => {
    const newTriggers: Record<string, BurstEffect> = {};
    let hasChanges = false;

    participants.forEach((p) => {
      const prevScore = prevScoresRef.current[p.id] ?? 0;

      if (p.items_eaten > prevScore) {
        const diff = p.items_eaten - prevScore;

        // Só dispara animação se já tiver comido algo
        if (prevScore > 0 || (p.items_eaten > 0 && prevScore === 0)) {
          // GERA AS PARTÍCULAS
          const particleCount = 4;
          const particles = Array.from({ length: particleCount }).map(
            (_, i) => ({
              emoji:
                DASH_PARTICLES_OPTIONS[
                  Math.floor(Math.random() * DASH_PARTICLES_OPTIONS.length)
                ],
              yDir: (i % 2 === 0 ? -1 : 1) * (10 + Math.random() * 20),
              rotDir: Math.random() * 360,
              delay: Math.random() * 0.2,
            }),
          );

          newTriggers[p.id] = {
            ts: Date.now(),
            diff,
            particles,
          };
          hasChanges = true;
        }
      }
      prevScoresRef.current[p.id] = p.items_eaten;
    });

    if (hasChanges) {
      setEffectTrigger((prev) => ({ ...prev, ...newTriggers }));
      const timer = setTimeout(() => {
        setEffectTrigger((prev) => {
          const clean = { ...prev };
          Object.keys(newTriggers).forEach((k) => delete clean[k]);
          return clean;
        });
      }, 1000); // Duração suficiente para a animação terminar
      return () => clearTimeout(timer);
    }
  }, [participants]);

  // Configurações da pista
  const baseSpeed = 1.9;
  const maxSpeedFactor = 2.0;
  const progressToTen = Math.min(currentMax, 10) / 10;
  const speedFactor = 1 + progressToTen * (maxSpeedFactor - 1);
  const trackSpeed = baseSpeed / speedFactor;
  const tailProgress = Math.min(1, Math.max(0, (currentMax - 3) / 7));
  const showTails = currentMax >= 3;

  const [scrollX, setScrollX] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [runnerWidths, setRunnerWidths] = useState<Record<string, number>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);
  const runnerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const pixelsPerSecond = 1400 / (trackSpeed * 11);
    targetSpeedRef.current = pixelsPerSecond;
  }, [trackSpeed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsPreferenceReady(false);
    const storageKey = getAnimationsStorageKey(viewerLoginCode);
    setPreferenceKey(storageKey);
    const storedPreference = localStorage.getItem(storageKey);
    if (storedPreference === "0") {
      setEnableAnimations(false);
    } else if (storedPreference === "1") {
      setEnableAnimations(true);
    } else {
      setEnableAnimations(true);
    }
    setIsPreferenceReady(true);
  }, [viewerLoginCode]);

  useEffect(() => {
    if (!isPreferenceReady || !preferenceKey || typeof window === "undefined") {
      return;
    }
    localStorage.setItem(preferenceKey, enableAnimations ? "1" : "0");
  }, [enableAnimations, isPreferenceReady, preferenceKey]);

  useEffect(() => {
    if (!enableAnimations) {
      lastFrameRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (time: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = time;
        raf = requestAnimationFrame(tick);
        return;
      }
      const delta = (time - lastFrameRef.current) / 1000;
      lastFrameRef.current = time;
      const targetSpeed = targetSpeedRef.current;
      speedRef.current += (targetSpeed - speedRef.current) * 0.08;
      setScrollX((prev) => {
        const next = prev + speedRef.current * delta;
        return next % 1400;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enableAnimations]);

  useEffect(() => {
    const trackElement = trackRef.current;
    if (!trackElement) return;

    const measure = () => {
      setTrackWidth(trackElement.clientWidth);
      const widths: Record<string, number> = {};

      participants.forEach((participant) => {
        const element = runnerRefs.current[participant.id];
        if (element) {
          widths[participant.id] = element.offsetWidth;
        }
      });

      setRunnerWidths(widths);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(trackElement);

    participants.forEach((participant) => {
      const element = runnerRefs.current[participant.id];
      if (element) {
        observer.observe(element);
      }
    });

    measure();

    return () => observer.disconnect();
  }, [participants, enableAnimations]);

  const maxRunnerWidth = useMemo(() => {
    const widths = Object.values(runnerWidths);
    if (widths.length === 0) return 0;
    return Math.max(...widths);
  }, [runnerWidths]);

  const minProgressOffset =
    trackWidth > 0 ? Math.min((maxRunnerWidth / trackWidth) * 100, 100) : 0;

  return (
    <div className="space-y-3 w-full overflow-hidden">
      <style jsx global>{`
        @keyframes road-scroll {
          from {
            background-position: 0 var(--dot-offset, 0px);
          }
          to {
            background-position: -1400px var(--dot-offset, 0px);
          }
        }
        .animate-road {
          animation: road-scroll 1s linear infinite;
        }

        @keyframes run-bounce {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-3px) rotate(3deg);
          }
        }
        .animate-avatar {
          animation: run-bounce 0.6s infinite ease-in-out;
        }

        @keyframes speed-streak {
          0% {
            opacity: 0.2;
            transform: translateX(0) scaleX(0.6);
          }
          50% {
            opacity: 0.6;
            transform: translateX(-6px) scaleX(1);
          }
          100% {
            opacity: 0.2;
            transform: translateX(-10px) scaleX(0.6);
          }
        }
        @keyframes streak-wave {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .animate-streak {
          animation:
            speed-streak 0.7s infinite ease-in-out,
            streak-wave 0.6s infinite ease-in-out;
        }

        /* animate-glow (A BOLHA) FOI REMOVIDA DAQUI */

        /* Partículas Voando (Dash) */
        @keyframes particle-fly {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0.5) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(-60px, var(--y-dir)) scale(1.5)
              rotate(var(--rot-dir));
          }
        }
        .animate-particle {
          animation: particle-fly 0.8s ease-out forwards;
        }

        /* Floating Number (+1) */
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-10px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(1);
          }
        }
        .animate-float {
          animation: float-up 0.8s ease-out forwards;
        }

        /* Shake/Pop Effect (Mantido!) */
        @keyframes pop-shake {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.3) rotate(-5deg);
          }
          60% {
            transform: scale(1.3) rotate(5deg);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-pop {
          animation: pop-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        /* Dust at feet (Poeira contínua) */
        @keyframes dust-puff {
          0% {
            opacity: 0;
            transform: translateX(0) scale(0.5);
          }
          50% {
            opacity: 0.5;
            transform: translateX(-10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-20px) scale(0.2);
          }
        }
        .animate-dust {
          animation: dust-puff 0.5s infinite linear;
        }
      `}</style>

      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setEnableAnimations(!enableAnimations)}
          className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
        >
          {enableAnimations ? (
            <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          ) : (
            <ZapOff className="h-3 w-3" />
          )}
          {enableAnimations
            ? t.room.animations_enabled
            : t.room.animations_disabled}
        </button>

        <div className="text-[9px] font-bold text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded-full">
          Lider: {currentMax}
        </div>
      </div>

      <Card className="relative overflow-hidden border-none shadow-xl bg-[#1a1a1a]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_8px,#fff_8px,#fff_16px)] opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_8px,#fff_8px,#fff_16px)] opacity-30" />

        <div
          ref={trackRef}
          className="py-6 pl-2 pr-12 space-y-1 relative min-h-[160px] bg-[#222]"
          style={{
            ["--dot-offset" as any]: "20px",
            backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
            backgroundSize: "15px 15px",
            backgroundPosition: `${-scrollX}px var(--dot-offset)`,
          }}
        >
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-white/10 z-0" />

          <div
            className="absolute right-0 top-0 bottom-0 w-8 md:w-12 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `conic-gradient(#fff 0.25turn, #000 0.25turn 0.5turn, #fff 0.5turn 0.75turn, #000 0.75turn)`,
              backgroundSize: "12px 12px",
            }}
          />

          {sortedByEntry.map((participant, index) => {
            const relativeScore = participant.items_eaten - currentMin;
            const progress = Math.min(
              100,
              Math.max(0, (relativeScore / range) * 100),
            );
            const isLeader =
              participant.items_eaten === currentMax && currentMax > 0;
            const namePart = participant.name.split(" ")[0];
            const nameLength = namePart.length;
            const nameFontSize = Math.max(7, 12 - Math.floor(nameLength / 5));

            const burstData = effectTrigger[participant.id];
            const burstTimestamp = burstData?.ts;
            const diffValue = burstData?.diff || 0;
            const anchoredProgress =
              minProgressOffset + (progress / 100) * (100 - minProgressOffset);

            return (
              <div
                key={participant.id}
                className="relative h-16 md:h-20 flex items-center"
              >
                <div
                  ref={(el) => {
                    runnerRefs.current[participant.id] = el;
                  }}
                  className={`absolute flex items-center gap-1 ${
                    enableAnimations
                      ? "transition-all duration-1000 ease-in-out"
                      : ""
                  }`}
                  style={{
                    left: `${anchoredProgress}%`,
                    transform: "translateX(-100%)",
                    zIndex: isLeader ? 20 : 10,
                  }}
                >
                  <div className="flex flex-col p-1 text-right text-white">
                    <span
                      className="font-black uppercase leading-tight max-w-[100px] md:max-w-[140px] whitespace-normal break-words"
                      style={{ fontSize: `${nameFontSize}px` }}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {isLeader && (
                          <Trophy className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {participant.is_vip && (
                          <span className="text-[11px]" aria-hidden="true">
                            💎
                          </span>
                        )}
                        <span
                          className={
                            isTeamMode && participant.team
                              ? (TEAM_COLORS[participant.team] ?? "")
                              : ""
                          }
                        >
                          {namePart}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`text-[12px] font-black italic leading-tight ${
                        isTeamMode ? "" : "text-primary"
                      }`}
                    >
                      {participant.items_eaten}pts
                    </span>
                  </div>

                  <div
                    className={`relative shrink-0 w-fit h-12 md:h-14 flex items-center justify-start ${
                      enableAnimations ? "animate-avatar" : ""
                    }`}
                    style={{
                      animationDelay: `${index * 0.15}s`,
                    }}
                  >
                    {/* ANIMAÇÃO 1: Poeira */}
                    {enableAnimations && (
                      <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-white/20 blur-[2px] animate-dust" />
                    )}

                    {/* ANIMAÇÃO 2: Floating Numbers (+1) */}
                    {enableAnimations && burstTimestamp && (
                      <span
                        key={`float-${burstTimestamp}`}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-float z-50 pointer-events-none"
                      >
                        +{diffValue}
                      </span>
                    )}

                    {/* ANIMAÇÃO 3: Partículas Fixas */}
                    {enableAnimations && burstData && burstData.particles && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        {burstData.particles.map((p, i) => (
                          <span
                            key={`part-${burstTimestamp}-${i}`}
                            className="absolute text-sm animate-particle"
                            style={{
                              ["--y-dir" as any]: `${p.yDir}px`,
                              ["--rot-dir" as any]: `${p.rotDir}deg`,
                              animationDelay: `${p.delay}s`,
                              left: "20%",
                            }}
                          >
                            {p.emoji}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cauda de Velocidade */}
                    {enableAnimations && showTails && (
                      <>
                        <span
                          className={`pointer-events-none absolute right-full top-[35%] h-2 translate-x-4 rounded-full bg-gradient-to-l ${
                            isLeader
                              ? "from-orange-400/70 via-orange-200/30"
                              : "from-white/40 via-white/10"
                          } to-transparent md:h-2.5 animate-streak -z-10`}
                          style={{ width: `${40 + tailProgress * 60}px` }}
                        />
                        <span
                          className={`pointer-events-none absolute right-full top-1/2 h-1.5 -translate-y-1/2 translate-x-5 rounded-full bg-gradient-to-l ${
                            isLeader
                              ? "from-orange-300/60 via-orange-200/25"
                              : "from-white/30 via-white/10"
                          } to-transparent md:h-2 animate-streak delay-150 -z-10`}
                          style={{ width: `${30 + tailProgress * 50}px` }}
                        />
                        <span
                          className={`pointer-events-none absolute right-full top-[65%] h-1 translate-x-6 rounded-full bg-gradient-to-l ${
                            isLeader
                              ? "from-orange-300/50 via-orange-200/20"
                              : "from-white/20 via-white/10"
                          } to-transparent md:h-1.5 animate-streak delay-300 -z-10`}
                          style={{ width: `${22 + tailProgress * 40}px` }}
                        />
                      </>
                    )}

                    {/* AVATAR COM animate-pop, MAS SEM O GLOW (BOLHA) */}
                    <div
                      key={`${participant.id}-${participant.items_eaten}`}
                      // AQUI: Só usa animate-pop se estiver no momento do burst. Se não, nenhuma animação de classe.
                      className={`z-10 ${enableAnimations && burstTimestamp ? "animate-pop" : ""}`}
                    >
                      {isImageAvatar(participant.avatar) ? (
                        <AvatarImage
                          avatar={participant.avatar}
                          enableAnimations={enableAnimations}
                        />
                      ) : (
                        <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-full bg-white/10 px-2 text-lg md:h-14 md:min-w-14" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
