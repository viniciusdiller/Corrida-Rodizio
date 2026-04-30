"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Car, ChevronLeft, ChevronRight, Flag, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { TourDemoRace } from "@/components/tour/tour-demo-race";
import { tourCopy } from "@/components/tour/tour-copy";

type HomeFlow = "create" | "join" | null;
type AccountFlow = "login" | "create" | "reset" | null;

type AppTourProps = {
  flow: HomeFlow;
  setFlow: (flow: HomeFlow) => void;
  accountFlow: AccountFlow;
  setAccountFlow: (flow: AccountFlow) => void;
  loginCode: string | null;
};

type TourStep = {
  id: string;
  target?: string;
  title: string;
  body: string;
};

type RectState = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type BubbleStyle = {
  left: number;
  top: number;
  width: number;
};

type BubblePlacement = "right" | "left" | "bottom" | "top" | "floating";

const TOUR_STORAGE_KEY = "rodizio-app-tour-v1";

export function AppTour({
  flow,
  setFlow,
  accountFlow,
  setAccountFlow,
  loginCode,
}: AppTourProps) {
  const { language } = useLanguage();
  const ui = tourCopy[language] ?? tourCopy.pt;
  const [showButton, setShowButton] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<RectState | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState(260);
  const initialStateRef = useRef<{
    flow: HomeFlow;
    accountFlow: AccountFlow;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const finishCelebrationPlayedRef = useRef(false);

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: "intro",
        title: ui.introTitle,
        body: ui.introBody,
      },
      {
        id: "account",
        target: loginCode ? "home-account-pill" : "home-account-create",
        title: ui.accountTitle,
        body: ui.accountBody,
      },
      {
        id: "create-entry",
        target: "home-start-actions",
        title: ui.createTitle,
        body: ui.createBody,
      },
      {
        id: "create-room",
        target: "home-create-form",
        title: ui.createRoomTitle,
        body: ui.createRoomBody,
      },
      {
        id: "join-room",
        target: "home-join-form",
        title: ui.joinTitle,
        body: ui.joinBody,
      },
      {
        id: "demo-intro",
        target: "tour-demo-track",
        title: ui.trackTitle,
        body: ui.trackBody,
      },
      {
        id: "demo-room-info",
        target: "tour-demo-room-info",
        title: ui.roomTitle,
        body: ui.roomBody,
      },
      {
        id: "demo-team-points",
        target: "tour-demo-team-points",
        title: ui.teamTitle,
        body: ui.teamBody,
      },
      {
        id: "demo-progress",
        target: "tour-demo-progress",
        title: ui.progressTitle,
        body: ui.progressBody,
      },
      {
        id: "demo-avatar",
        target: "tour-demo-avatar",
        title: ui.avatarTitle,
        body: ui.avatarBody,
      },
      {
        id: "demo-camera",
        target: "tour-demo-camera",
        title: ui.cameraTitle,
        body: ui.cameraBody,
      },
      {
        id: "demo-timeline",
        target: "tour-demo-timeline",
        title: ui.timelineTitle,
        body: ui.timelineBody,
      },
      {
        id: "demo-vip",
        target: "tour-demo-vip",
        title: ui.vipTitle,
        body: ui.vipBody,
      },
      {
        id: "demo-hall-of-fame",
        target: "tour-demo-hof",
        title: ui.hallTitle,
        body: ui.hallBody,
      },
      {
        id: "done",
        title: ui.doneTitle,
        body: ui.doneBody,
      },
    ],
    [loginCode, ui],
  );

  const step = steps[stepIndex];
  const showDemo = step?.id.startsWith("demo-");
  const forceBottomDialog = step?.id === "demo-hall-of-fame";

  const getBubbleLayout = (): {
    style: BubbleStyle;
    placement: BubblePlacement;
  } => {
    if (typeof window === "undefined") {
      return {
        style: {
          left: 12,
          top: 12,
          width: 320,
        },
        placement: "floating",
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 18;
    const width = Math.min(380, viewportWidth - 24);
    const measuredHeight = Math.max(220, bubbleHeight);

    if (forceBottomDialog) {
      return {
        style: {
          left: Math.max(12, (viewportWidth - width) / 2),
          top: Math.max(12, viewportHeight - measuredHeight - 16),
          width,
        },
        placement: "floating",
      };
    }

    if (!spotlightRect) {
      return {
        style: {
          left: Math.max(12, (viewportWidth - width) / 2),
          top: Math.max(12, viewportHeight - measuredHeight - 16),
          width,
        },
        placement: "floating",
      };
    }

    const anchorCenterY = spotlightRect.top + spotlightRect.height / 2;
    const anchorCenterX = spotlightRect.left + spotlightRect.width / 2;

    const clampTop = (value: number) =>
      Math.max(12, Math.min(value, viewportHeight - measuredHeight - 12));
    const clampLeft = (value: number) =>
      Math.max(12, Math.min(value, viewportWidth - width - 12));

    if (
      spotlightRect.left + spotlightRect.width + gap + width <=
      viewportWidth - 12
    ) {
      return {
        style: {
          left: spotlightRect.left + spotlightRect.width + gap,
          top: clampTop(anchorCenterY - measuredHeight / 2),
          width,
        },
        placement: "right",
      };
    }

    if (spotlightRect.left - gap - width >= 12) {
      return {
        style: {
          left: spotlightRect.left - gap - width,
          top: clampTop(anchorCenterY - measuredHeight / 2),
          width,
        },
        placement: "left",
      };
    }

    if (
      spotlightRect.top + spotlightRect.height + gap + measuredHeight <=
      viewportHeight - 12
    ) {
      return {
        style: {
          left: clampLeft(anchorCenterX - width / 2),
          top: spotlightRect.top + spotlightRect.height + gap,
          width,
        },
        placement: "bottom",
      };
    }

    return {
      style: {
        left: clampLeft(anchorCenterX - width / 2),
        top: clampTop(spotlightRect.top - measuredHeight - gap),
        width,
      },
      placement: "top",
    };
  };

  useEffect(() => {
    if (!isRunning || !bubbleRef.current || typeof window === "undefined") return;

    const element = bubbleRef.current;
    const updateHeight = () => {
      setBubbleHeight(element.offsetHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [isRunning, stepIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loginCode) {
      setShowButton(false);
      return;
    }
    setShowButton(true);
  }, [loginCode]);

  useEffect(() => {
    if (!isRunning || typeof document === "undefined") return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousTourRunning = document.body.dataset.tourRunning;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.dataset.tourRunning = "true";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (previousTourRunning) {
        document.body.dataset.tourRunning = previousTourRunning;
      } else {
        delete document.body.dataset.tourRunning;
      }
    };
  }, [isRunning]);

  useLayoutEffect(() => {
    if (!isRunning || !step) return;

    if (step.id === "account") {
      setFlow(null);
      setAccountFlow(loginCode ? null : "create");
      return;
    }

    if (step.id === "create-entry") {
      setFlow(null);
      setAccountFlow(null);
      return;
    }

    if (step.id === "create-room") {
      setFlow("create");
      setAccountFlow(null);
      return;
    }

    if (step.id === "join-room") {
      setFlow("join");
      setAccountFlow(null);
      return;
    }

    if (showDemo || step.id === "intro" || step.id === "done") {
      setFlow(null);
      setAccountFlow(null);
    }
  }, [isRunning, step, showDemo, setFlow, setAccountFlow, loginCode]);

  useLayoutEffect(() => {
    if (!isRunning || !step) {
      setSpotlightRect(null);
      return;
    }

    let raf = 0;

    const updateSpotlight = (shouldScroll = false) => {
      if (!step.target) {
        setSpotlightRect(null);
        return false;
      }

      const target = document.querySelector<HTMLElement>(
        `[data-tour="${step.target}"]`,
      );

      if (!target) {
        return false;
      }

      const rect = target.getBoundingClientRect();
      const padding = 12;

      setSpotlightRect({
        top: Math.max(12, rect.top - padding),
        left: Math.max(12, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      if (shouldScroll) {
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
        });
      }
      return true;
    };

    const syncUntilReady = () => {
      const found = updateSpotlight(false);
      if (!found) {
        raf = window.requestAnimationFrame(syncUntilReady);
      }
    };

    updateSpotlight(true);
    const handleViewportChange = () => updateSpotlight(false);
    raf = window.requestAnimationFrame(syncUntilReady);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isRunning, step]);

  useEffect(() => {
    if (!isRunning) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose("dismissed");
        return;
      }

      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        handleNext();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, stepIndex, steps.length]);

  useEffect(() => {
    if (!isRunning || step?.id !== "done" || finishCelebrationPlayedRef.current) {
      return;
    }

    finishCelebrationPlayedRef.current = true;

    const bursts = [
      window.setTimeout(() => {
        confetti({
          particleCount: 110,
          angle: 60,
          spread: 72,
          origin: { x: 0.12, y: 0.72 },
          startVelocity: 48,
          colors: ["#f97316", "#fb923c", "#fbbf24", "#fff7ed"],
        });
      }, 0),
      window.setTimeout(() => {
        confetti({
          particleCount: 110,
          angle: 120,
          spread: 72,
          origin: { x: 0.88, y: 0.72 },
          startVelocity: 48,
          colors: ["#f97316", "#fb923c", "#fbbf24", "#fff7ed"],
        });
      }, 140),
      window.setTimeout(() => {
        confetti({
          particleCount: 140,
          spread: 95,
          origin: { x: 0.5, y: 0.45 },
          startVelocity: 40,
          scalar: 1.05,
          colors: ["#f97316", "#fb923c", "#fbbf24", "#fff7ed"],
        });
      }, 280),
    ];

    return () => {
      bursts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [isRunning, step?.id]);

  const persistTourState = (value: "dismissed" | "completed") => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOUR_STORAGE_KEY, value);
  };

  const restoreHomeState = () => {
    const snapshot = initialStateRef.current;
    if (!snapshot) return;
    setFlow(snapshot.flow);
    setAccountFlow(snapshot.accountFlow);
  };

  const handleStart = () => {
    initialStateRef.current = { flow, accountFlow };
    finishCelebrationPlayedRef.current = false;
    setShowButton(false);
    setIsRunning(true);
    setStepIndex(0);
  };

  const handleClose = (status: "dismissed" | "completed") => {
    persistTourState(status);
    setIsRunning(false);
    setSpotlightRect(null);
    restoreHomeState();
  };

  const handleNext = () => {
    if (stepIndex === steps.length - 1) {
      handleClose("completed");
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  if (!showButton && !isRunning) return null;

  const bubbleLayout = getBubbleLayout();
  const bubbleStyle = bubbleLayout.style;
  const progressPercent = ((stepIndex + 1) / steps.length) * 100;
  const arrowBaseClass =
    "pointer-events-none absolute h-4 w-4 rotate-45 border border-orange-200 bg-[linear-gradient(135deg,rgb(58,26,10),rgb(120,53,15))]";
  const arrowClass =
    bubbleLayout.placement === "right"
      ? `${arrowBaseClass} -left-2 top-1/2 -translate-y-1/2 border-r-0 border-t-0`
      : bubbleLayout.placement === "left"
        ? `${arrowBaseClass} -right-2 top-1/2 -translate-y-1/2 border-l-0 border-b-0`
        : bubbleLayout.placement === "bottom"
          ? `${arrowBaseClass} -top-2 left-1/2 -translate-x-1/2 border-r-0 border-b-0`
          : bubbleLayout.placement === "top"
            ? `${arrowBaseClass} -bottom-2 left-1/2 -translate-x-1/2 border-l-0 border-t-0`
            : "hidden";

  return (
    <>
      {showButton && !isRunning && (
        <div className="fixed bottom-6 right-4 z-[55] sm:right-6">
          <Button
            type="button"
            onClick={handleStart}
            className="h-14 rounded-full bg-gradient-to-r from-primary via-orange-500 to-amber-500 px-5 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_20px_50px_rgba(234,88,12,0.35)] animate-bounce"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {ui.button}
          </Button>
        </div>
      )}

      {isRunning && step && (
        <>
          {spotlightRect ? (
            <>
              <div
                className="fixed z-[58] bg-slate-950/72"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: spotlightRect.top,
                }}
              />
              <div
                className="fixed z-[58] bg-slate-950/72"
                style={{
                  top: spotlightRect.top,
                  left: 0,
                  width: spotlightRect.left,
                  height: spotlightRect.height,
                }}
              />
              <div
                className="fixed z-[58] bg-slate-950/72"
                style={{
                  top: spotlightRect.top,
                  left: spotlightRect.left + spotlightRect.width,
                  right: 0,
                  height: spotlightRect.height,
                }}
              />
              <div
                className="fixed z-[58] bg-slate-950/72"
                style={{
                  top: spotlightRect.top + spotlightRect.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            </>
          ) : (
            <div className="fixed inset-0 z-[58] bg-slate-950/72" />
          )}

          {showDemo && <TourDemoRace active={showDemo} stepId={step.id} />}

          <div
            aria-hidden="true"
            className="fixed inset-0 z-[74]"
          />

          {spotlightRect && (
            <div
              className="pointer-events-none fixed z-[72] rounded-[32px] border border-white/70"
              style={{
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
              }}
            >
              <div className="h-full w-full rounded-[32px] border border-primary/60 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_0_8px_rgba(249,115,22,0.14)]" />
            </div>
          )}

          <div
            className="fixed z-[80]"
            style={bubbleStyle}
          >
            <div
              ref={bubbleRef}
              className="relative rounded-[32px] border border-orange-200 bg-[linear-gradient(135deg,rgb(58,26,10),rgb(120,53,15))] p-5 text-white shadow-[0_28px_90px_rgba(120,53,15,0.42)]"
            >
              <div className={arrowClass} />
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-orange-200/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-50/90">
                      {ui.liveBadge}
                    </span>
                  </div>
                  <h3 className="text-xl font-black sm:text-2xl">{step.title}</h3>
                  <p className="text-sm leading-6 text-white/78">{step.body}</p>
                </div>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleClose("dismissed")}
                  className="h-10 w-10 shrink-0 rounded-full text-white/70 hover:bg-white/12 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative mt-4 px-1">
                <div className="absolute right-0 top-1/2 z-[1] -translate-y-1/2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200 bg-[rgb(88,36,12)] text-amber-100 shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                    <Flag className="h-4 w-4" />
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full border border-orange-200/30 bg-black/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-orange-400 to-amber-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 z-[2] -translate-y-1/2 text-white"
                  style={{
                    left: `clamp(0px, calc(${progressPercent}% - 14px), calc(100% - 28px))`,
                  }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200 bg-[rgb(88,36,12)] text-white shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                    <Car className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                {stepIndex === steps.length - 1 ? (
                  <div />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                    disabled={stepIndex === 0}
                    className={cn(
                      "rounded-2xl text-white hover:bg-white/10 hover:text-white",
                      stepIndex === 0 && "opacity-40",
                    )}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {ui.back}
                  </Button>
                )}

                <div className="flex items-center">
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="rounded-2xl px-5 font-bold"
                  >
                    {stepIndex === steps.length - 1 ? ui.finish : ui.next}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
