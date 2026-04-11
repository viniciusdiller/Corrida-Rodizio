"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Car, ChevronLeft, ChevronRight, Flag, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { TourDemoRace } from "@/components/tour/tour-demo-race";

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

const copy = {
  pt: {
    button: "Conhecer o app",
    skip: "Pular",
    back: "Voltar",
    next: "Próximo",
    finish: "Finalizar",
    liveBadge: "Primeiros passos",
    progress: "Passo {current} de {total}",
    introTitle: "Bem-vindo ao Rodizio Race",
    introBody:
      "Somos a pista de corrida oficial da comilança competitiva: crie salas, acompanhe a disputa ao vivo e transforme um rodízio em jogo compartilhável.",
    accountTitle: "Crie uma conta quando quiser salvar progresso",
    accountBody:
      "A conta não é obrigatória para entrar numa sala, mas libera recursos como câmera, histórico, recuperação de acesso e atalhos para voltar às suas corridas.",
    createTitle: "Criar sala leva poucos toques",
    createBody:
      "O botão principal abre a criação da corrida. É o ponto de partida para o VIP, que será a pessoa com controle de encerrar e reabrir a disputa.",
    createRoomTitle: "Escolha o tipo de rodízio e os modos da sala",
    createRoomBody:
      "Aqui você define codinome, categoria, equipes e o modo foto. O tipo de rodízio muda o tema da corrida, o contador e o clima do jogo.",
    joinTitle: "Entrar em uma sala é o caminho mais rápido",
    joinBody:
      "Quem recebe um código ou link entra por aqui, com nome próprio ou como espectador. É assim que os amigos chegam à mesma corrida em segundos.",
    demoTitle: "Agora vamos para uma corrida de exemplo",
    demoBody:
      "A partir daqui tudo é simulado para mostrar o que o app sabe fazer sem mexer em dados reais.",
    trackTitle: "A corrida aparece aqui",
    trackBody:
      "Esta é a pista ao vivo da sala. Conforme os jogadores marcam pontos, os avatares avançam e a disputa fica fácil de entender num relance.",
    roomTitle: "Toda sala tem código, status e contexto",
    roomBody:
      "O cabeçalho mostra o tipo de disputa, quantos jogadores estão correndo e o código da sala para compartilhar com a mesa inteira.",
    teamTitle: "No modo times, os pontos ficam aqui",
    teamBody:
      "Quando a corrida usa equipes, este bloco mostra a barra geral, o total de cada time e os jogadores que estão puxando a pontuação.",
    progressTitle: "Cada jogador controla o próprio placar",
    progressBody:
      "O contador pessoal é onde você soma partes, acompanha a pontuação e enxerga se está liderando ou ficando para trás.",
    avatarTitle: "Avatar e nome podem mudar durante a corrida",
    avatarBody:
      "Cada participante pode trocar o avatar e ajustar o codinome sem reiniciar a sala. Isso ajuda a personalizar a experiência na hora.",
    cameraTitle: "Modo câmera registra cada ponto com foto",
    cameraBody:
      "Quando o modo foto está ligado, a câmera entra no fluxo do +1. Esse recurso fica disponível somente para usuários registrados.",
    timelineTitle: "A linha do tempo deixa a corrida mais viva",
    timelineBody:
      "As fotos aparecem em sequência para contar a história da disputa. Enquanto isso, jogadores fictícios seguem marcando pontos em tempo real.",
    vipTitle: "O VIP é quem abriu a corrida",
    vipBody:
      "Esse jogador pode encerrar a sala, gerenciar participantes e, depois, reabrir a disputa se a mesa quiser continuar.",
    hallTitle: "No fim, a corrida vira Hall of Fame",
    hallBody:
      "Quando a disputa fecha, o app mostra um placar final celebrando os vencedores e mantém a opção de restaurar a sala para o VIP.",
    doneTitle: "Tour encerrado",
    doneBody:
      "Você já viu o fluxo completo: criar conta, abrir ou entrar numa sala, jogar ao vivo, usar fotos e fechar a corrida com Hall of Fame.",
  },
  en: {
    button: "Take a tour",
    skip: "Skip",
    back: "Back",
    next: "Next",
    finish: "Finish",
    liveBadge: "Getting started",
    progress: "Step {current} of {total}",
    introTitle: "Welcome to Rodizio Race",
    introBody:
      "We turn all-you-can-eat nights into live games: create rooms, track the race in real time, and make the whole table part of the fun.",
    accountTitle: "Create an account whenever you want to save progress",
    accountBody:
      "An account is optional for joining a room, but it unlocks camera access, history, recovery, and faster returns to your races.",
    createTitle: "Creating a room takes just a few taps",
    createBody:
      "This main action opens the race setup. It is also where the future VIP starts, the player who can close and reopen the race.",
    createRoomTitle: "Pick the rodizio type and room modifiers",
    createRoomBody:
      "Here you choose a codename, food category, team mode, and photo mode. The selected type shapes the whole race vibe.",
    joinTitle: "Joining a room is the fastest path in",
    joinBody:
      "Anyone with a code or invite link joins here, either with a nickname or as a spectator. That keeps the table synced in seconds.",
    demoTitle: "Now let’s enter a sample race",
    demoBody:
      "From here on, everything is simulated so we can show the app’s capabilities without touching real data.",
    trackTitle: "The live race happens here",
    trackBody:
      "This is the room’s live track. As players score, avatars move forward so the race is easy to read at a glance.",
    roomTitle: "Every room shows code, status, and context",
    roomBody:
      "The header tells players what kind of race this is, how many people are inside, and which room code to share.",
    teamTitle: "Team mode points live here",
    teamBody:
      "When the room runs in teams, this section shows the overall bar, each team total, and who is pushing the score.",
    progressTitle: "Each player owns their own score",
    progressBody:
      "Your personal control card is where you add pieces, watch your total, and feel the race pressure in real time.",
    avatarTitle: "Avatar and codename can change mid-race",
    avatarBody:
      "Players can swap avatars and update their display name without resetting the room, which keeps the race personal and playful.",
    cameraTitle: "Camera mode turns every point into proof",
    cameraBody:
      "When photo mode is enabled, the camera becomes part of the +1 flow. This feature is available only for registered users.",
    timelineTitle: "The photo timeline makes the race feel alive",
    timelineBody:
      "Photos stack into a running story of the match while dummy players keep scoring in the background to show the live rhythm.",
    vipTitle: "The VIP is the person who opened the race",
    vipBody:
      "That player can close the room, manage participants, and later restore the race if the table wants another round.",
    hallTitle: "When it ends, the race becomes a Hall of Fame",
    hallBody:
      "Closing the race reveals a celebration screen with the final ranking, while the VIP still gets the power to reopen it.",
    doneTitle: "Tour complete",
    doneBody:
      "You’ve seen the full flow: create an account, open or join a room, play live, use photos, and end with a Hall of Fame.",
  },
  es: {
    button: "Conocer la app",
    skip: "Saltar",
    back: "Volver",
    next: "Siguiente",
    finish: "Finalizar",
    liveBadge: "Primeros pasos",
    progress: "Paso {current} de {total}",
    introTitle: "Bienvenido a Rodizio Race",
    introBody:
      "Convertimos el rodizio en un juego en vivo: crea salas, sigue la carrera en tiempo real y haz que toda la mesa participe.",
    accountTitle: "Crea una cuenta cuando quieras guardar progreso",
    accountBody:
      "La cuenta no es obligatoria para entrar, pero desbloquea cámara, historial, recuperación y regreso rápido a tus carreras.",
    createTitle: "Crear una sala toma pocos toques",
    createBody:
      "Este botón principal abre la configuración de la carrera. También define quién será el VIP con control para cerrar y reabrir.",
    createRoomTitle: "Elige el tipo de rodizio y los modos de la sala",
    createRoomBody:
      "Aquí defines apodo, categoría, equipos y modo foto. El tipo seleccionado cambia el tono completo de la carrera.",
    joinTitle: "Entrar a una sala es el camino más rápido",
    joinBody:
      "Quien tenga código o enlace entra por aquí, con nombre propio o como espectador. Así todos llegan a la misma carrera enseguida.",
    demoTitle: "Ahora entremos a una carrera de ejemplo",
    demoBody:
      "Desde aquí todo es simulado para mostrar lo que la app puede hacer sin tocar datos reales.",
    trackTitle: "La carrera en vivo aparece aquí",
    trackBody:
      "Esta es la pista en vivo de la sala. A medida que los jugadores suman puntos, los avatares avanzan y la carrera se entiende de un vistazo.",
    roomTitle: "Cada sala muestra código, estado y contexto",
    roomBody:
      "La cabecera explica qué tipo de carrera es, cuántas personas están dentro y qué código compartir.",
    teamTitle: "Aquí ves los puntos del modo equipos",
    teamBody:
      "Cuando la carrera usa equipos, este bloque muestra la barra general, el total de cada equipo y quiénes están empujando la puntuación.",
    progressTitle: "Cada jugador controla su propio marcador",
    progressBody:
      "Tu tarjeta personal es donde sumas partes, ves tu total y sientes la presión de la carrera en vivo.",
    avatarTitle: "Avatar y nombre pueden cambiar durante la carrera",
    avatarBody:
      "Los participantes pueden cambiar avatar y apodo sin reiniciar la sala, manteniendo la experiencia flexible y divertida.",
    cameraTitle: "El modo cámara convierte cada punto en prueba",
    cameraBody:
      "Cuando el modo foto está activado, la cámara entra en el flujo del +1. Esta función solo está disponible para usuarios registrados.",
    timelineTitle: "La línea del tiempo hace la carrera más viva",
    timelineBody:
      "Las fotos cuentan la historia de la partida mientras los jugadores ficticios siguen sumando puntos en segundo plano.",
    vipTitle: "El VIP es quien abrió la carrera",
    vipBody:
      "Esa persona puede cerrar la sala, gestionar jugadores y después restaurar la carrera si la mesa quiere seguir.",
    hallTitle: "Al final, la carrera se convierte en Hall of Fame",
    hallBody:
      "Cerrar la carrera muestra una pantalla final para celebrar el ranking y permite que el VIP la reabra.",
    doneTitle: "Tour finalizado",
    doneBody:
      "Ya viste el flujo completo: crear cuenta, abrir o entrar a una sala, jugar en vivo, usar fotos y terminar con Hall of Fame.",
  },
  fr: {
    button: "Decouvrir l'app",
    skip: "Passer",
    back: "Retour",
    next: "Suivant",
    finish: "Terminer",
    liveBadge: "Premiers pas",
    progress: "Étape {current} sur {total}",
    introTitle: "Bienvenue sur Rodizio Race",
    introBody:
      "Nous transformons le rodizio en jeu en direct : créez des salles, suivez la course en temps réel et impliquez toute la table.",
    accountTitle: "Créez un compte quand vous voulez sauver votre progression",
    accountBody:
      "Le compte n’est pas obligatoire pour entrer dans une salle, mais il débloque la caméra, l’historique, la récupération et le retour rapide.",
    createTitle: "Créer une salle prend seulement quelques gestes",
    createBody:
      "Cette action principale ouvre la création de course. C’est aussi là que naît le VIP, la personne qui peut fermer et rouvrir la partie.",
    createRoomTitle: "Choisissez le type de rodizio et les modes de salle",
    createRoomBody:
      "Ici, vous définissez pseudo, catégorie, équipes et mode photo. Le type choisi change toute l’ambiance de la course.",
    joinTitle: "Rejoindre une salle est le chemin le plus rapide",
    joinBody:
      "Toute personne avec un code ou un lien d’invitation entre ici, avec pseudo ou comme spectateur. Toute la table rejoint la même course très vite.",
    demoTitle: "Passons maintenant à une course d’exemple",
    demoBody:
      "À partir d’ici, tout est simulé pour montrer les capacités de l’application sans toucher aux vraies données.",
    trackTitle: "La course en direct se lit ici",
    trackBody:
      "Voici la piste en direct de la salle. Quand les joueurs marquent des points, les avatars avancent et la course devient lisible en un coup d’œil.",
    roomTitle: "Chaque salle montre code, statut et contexte",
    roomBody:
      "L’en-tête indique le type de course, le nombre de joueurs présents et le code à partager.",
    teamTitle: "Les points du mode équipe sont ici",
    teamBody:
      "Quand la course se joue en équipes, ce bloc montre la barre globale, le total de chaque équipe et les joueurs qui tirent le score.",
    progressTitle: "Chaque joueur gère son propre score",
    progressBody:
      "La carte personnelle sert à ajouter des parts, suivre son total et ressentir la pression de la course en direct.",
    avatarTitle: "Avatar et pseudo peuvent changer pendant la course",
    avatarBody:
      "Les participants peuvent modifier leur avatar et leur nom sans réinitialiser la salle, pour une expérience plus personnelle.",
    cameraTitle: "Le mode caméra transforme chaque point en preuve",
    cameraBody:
      "Quand le mode photo est activé, la caméra fait partie du flux du +1. Cette fonction est réservée aux utilisateurs inscrits.",
    timelineTitle: "La timeline photo rend la course plus vivante",
    timelineBody:
      "Les photos racontent la partie pendant que les joueurs fictifs continuent à marquer des points en arrière-plan.",
    vipTitle: "Le VIP est la personne qui a ouvert la course",
    vipBody:
      "Cette personne peut fermer la salle, gérer les participants puis restaurer la course si la table veut continuer.",
    hallTitle: "À la fin, la course devient un Hall of Fame",
    hallBody:
      "La fermeture de la course affiche un classement final prêt à célébrer les gagnants, avec option de réouverture pour le VIP.",
    doneTitle: "Tour terminé",
    doneBody:
      "Vous avez vu tout le parcours : créer un compte, ouvrir ou rejoindre une salle, jouer en direct, utiliser les photos et finir en Hall of Fame.",
  },
} as const;

export function AppTour({
  flow,
  setFlow,
  accountFlow,
  setAccountFlow,
  loginCode,
}: AppTourProps) {
  const { language } = useLanguage();
  const ui = copy[language] ?? copy.pt;
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
    if (!loginCode) {
      setShowButton(true);
      return;
    }

    const seen = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (seen) {
      setShowButton(false);
      return;
    }
    const timer = window.setTimeout(() => setShowButton(true), 700);
    return () => window.clearTimeout(timer);
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
