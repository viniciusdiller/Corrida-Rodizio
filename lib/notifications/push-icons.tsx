import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Crown,
  Flame,
  Flag,
  Gift,
  HeartHandshake,
  Mail,
  Medal,
  Megaphone,
  MessageCircle,
  PartyPopper,
  Pizza,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

export type PushIconName =
  | "bell"
  | "megaphone"
  | "gift"
  | "sparkles"
  | "calendar-days"
  | "mail"
  | "party-popper"
  | "pizza"
  | "trophy"
  | "crown"
  | "users"
  | "rocket"
  | "flag"
  | "flame"
  | "medal"
  | "message-circle"
  | "circle-alert"
  | "heart-handshake"
  | "star"
  | "book-open";

type PushIconOption = {
  icon: LucideIcon;
  label: string;
  path: string;
  value: PushIconName;
};

export const pushIconOptions: PushIconOption[] = [
  {
    value: "bell",
    label: "Bell",
    icon: Bell,
    path: "M10.268 21a2 2 0 0 0 3.464 0M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.674C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
  },
  {
    value: "megaphone",
    label: "Megaphone",
    icon: Megaphone,
    path: "m3 11 18-5v12L3 14v-3zm0 0v8m0-8H2m1 8H2m11-5a4 4 0 0 1 0-8m0 8a4 4 0 0 0 0-8m-4 13v-5a2 2 0 0 1 2-2h1",
  },
  {
    value: "gift",
    label: "Gift",
    icon: Gift,
    path: "M20 12v10H4V12M2 7h20v5H2zm10 0v15m0-15H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z",
  },
  {
    value: "sparkles",
    label: "Sparkles",
    icon: Sparkles,
    path: "M9.937 15.5A2 2 0 0 0 8.5 14.063L2 12l6.5-2.063A2 2 0 0 0 9.937 8.5L12 2l2.063 6.5A2 2 0 0 0 15.5 9.937L22 12l-6.5 2.063A2 2 0 0 0 14.063 15.5L12 22zM20 3v4M22 5h-4M4 17v2M5 18H3",
  },
  {
    value: "calendar-days",
    label: "Calendar",
    icon: CalendarDays,
    path: "M8 2v4M16 2v4M3 10h18M6 14h.01M10 14h.01M14 14h.01M18 14h.01M6 18h.01M10 18h.01M14 18h.01M5 22h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z",
  },
  {
    value: "mail",
    label: "Mail",
    icon: Mail,
    path: "m4 4 16 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2 8 6 8-6",
  },
  {
    value: "party-popper",
    label: "Celebration",
    icon: PartyPopper,
    path: "M5.8 11.3 2 22l10.7-3.79M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2 6-6-2 2-6zM9 13l-6 6M14.5 17.5 4.5 15M12 22v-5M19 14l-3 3",
  },
  {
    value: "pizza",
    label: "Pizza",
    icon: Pizza,
    path: "m12 2-8.5 20a1 1 0 0 0 1.31 1.31L22 16.5ZM12 2l6 6M12 2v8m4 8c-.55 0-1-.45-1-1m-3 1c-.55 0-1-.45-1-1m-3 1c-.55 0-1-.45-1-1",
  },
  {
    value: "trophy",
    label: "Trophy",
    icon: Trophy,
    path: "M6 9H4a2 2 0 0 1-2-2V4h4M18 9h2a2 2 0 0 0 2-2V4h-4M4 22h16M10 14.66V17a2 2 0 0 1-2 2h0M14 14.66V17a2 2 0 0 0 2 2h0M18 2H6v7a6 6 0 0 0 12 0V2z",
  },
  {
    value: "crown",
    label: "Crown",
    icon: Crown,
    path: "m2 4 3 12h14l3-12-5.5 5L12 4 7.5 9 2 4zm3 16h14",
  },
  {
    value: "users",
    label: "Users",
    icon: Users,
    path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    value: "rocket",
    label: "Rocket",
    icon: Rocket,
    path: "M4.5 16.5c-1.5 1.26-2 4.19-2 5.5 1.31 0 4.24-.5 5.5-2L20 8c1.17-1.17 1.17-3.07 0-4.24L19.24 3c-1.17-1.17-3.07-1.17-4.24 0zM12 15l-3-3m9-9 3 3",
  },
  {
    value: "flag",
    label: "Flag",
    icon: Flag,
    path: "M4 22V4m0 0c1.5-2 5.5-2 7 0 1.5 2 5.5 2 7 0v10c-1.5 2-5.5 2-7 0-1.5-2-5.5-2-7 0",
  },
  {
    value: "flame",
    label: "Flame",
    icon: Flame,
    path: "M8.5 14.5A4.5 4.5 0 0 0 13 19a4.5 4.5 0 0 0 4.5-4.5c0-1.61-.69-2.96-1.76-4.27L12 4l-3.74 6.23C7.19 11.54 6.5 12.89 6.5 14.5A6.5 6.5 0 1 0 19.5 14c0-3.35-1.39-6.38-3.62-8.65L12 1 8.12 5.35C5.89 7.62 4.5 10.65 4.5 14A8.5 8.5 0 1 0 21.5 14",
  },
  {
    value: "medal",
    label: "Medal",
    icon: Medal,
    path: "M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0 3.09 6.26a1 1 0 0 0 1.34.45l2.57-1.29a1 1 0 0 0 .45-1.34L16.36 13m-4.36 2-3.09 6.26a1 1 0 0 1-1.34.45L5 20.42a1 1 0 0 1-.45-1.34L7.64 13",
  },
  {
    value: "message-circle",
    label: "Message",
    icon: MessageCircle,
    path: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  },
  {
    value: "circle-alert",
    label: "Alert",
    icon: CircleAlert,
    path: "M12 8v4m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  },
  {
    value: "heart-handshake",
    label: "Community",
    icon: HeartHandshake,
    path: "M19.414 5.586a2 2 0 0 0-2.828 0L12 10.172 7.414 5.586a2 2 0 0 0-2.828 2.828l1.586 1.586M7 13l2.18 2.18a2 2 0 0 0 2.83 0L14 13l4.18 4.18a2 2 0 1 1-2.83 2.83L12 16.66l-2.35 2.35a2 2 0 1 1-2.83-2.83L9 14",
  },
  {
    value: "star",
    label: "Star",
    icon: Star,
    path: "m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z",
  },
  {
    value: "book-open",
    label: "Guide",
    icon: BookOpen,
    path: "M12 7v14M3 18a2 2 0 0 1 2-2h7M21 18a2 2 0 0 0-2-2h-7M5 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm14 0h-7a2 2 0 0 0-2 2",
  },
];

function escapeSvg(value: string) {
  return value
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "'")
    .replace(/\s+/g, " ");
}

export function buildPushIconDataUri(iconName?: string | null) {
  const option =
    pushIconOptions.find((item) => item.value === iconName) ?? pushIconOptions[0];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
      <rect width="96" height="96" rx="24" fill="#ffedd5"/>
      <rect x="6" y="6" width="84" height="84" rx="20" fill="#fed7aa"/>
      <path d="${option.path}" stroke="#7c2d12" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" transform="translate(24 24) scale(2)" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${escapeSvg(svg)}`;
}
