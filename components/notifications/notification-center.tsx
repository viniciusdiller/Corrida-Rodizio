"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Megaphone,
  MailWarning,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";
import {
  type InboxNotification,
  useNotifications,
} from "@/contexts/notifications-context";

type NotificationCenterProps = {
  onOpenAccountMenu?: () => void;
};

const copy = {
  pt: {
    empty: "Nada novo por aqui.",
    markAll: "Lido",
    title: "Central",
  },
  en: {
    empty: "Nothing new here.",
    markAll: "Mark all",
    title: "Inbox",
  },
  es: {
    empty: "No hay nada nuevo por aqui.",
    markAll: "Marcar todo",
    title: "Bandeja",
  },
  fr: {
    empty: "Rien de nouveau ici.",
    markAll: "Tout lire",
    title: "Boite",
  },
} as const;

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getNotificationIcon(kind: string) {
  if (kind === "promo") {
    return <Megaphone className="h-4 w-4" />;
  }
  if (kind === "recovery-email") {
    return <MailWarning className="h-4 w-4" />;
  }
  if (kind === "build-update") {
    return <Wrench className="h-4 w-4" />;
  }
  return <Sparkles className="h-4 w-4" />;
}

export function NotificationCenter({
  onOpenAccountMenu,
}: NotificationCenterProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const ui = copy[language] ?? copy.pt;
  const { markAllAsRead, markAsRead, notifications, unreadCount } =
    useNotifications();

  const badgeLabel = useMemo(() => {
    if (unreadCount <= 0) return "";
    if (unreadCount > 9) return "9+";
    return String(unreadCount);
  }, [unreadCount]);

  const handleNotificationClick = (notification: InboxNotification) => {
    markAsRead(notification.id, notification.scope, notification.source);

    if (notification.action === "open-account" && onOpenAccountMenu) {
      onOpenAccountMenu();
      return;
    }

    if (notification.href) {
      router.push(notification.href);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={ui.title}
          className="relative rounded-full border-border bg-background/90 shadow-sm hover:bg-accent/30"
        >
          <Bell className="h-5 w-5" />
          {badgeLabel ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground shadow-sm">
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(92vw,24rem)] rounded-2xl border border-border/80 p-0 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-muted-foreground">
              {ui.title}
            </p>
          </div>
          {notifications.length > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-primary transition hover:opacity-80"
            >
              {ui.markAll}
            </button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">{ui.empty}</div>
        ) : (
          <div className="max-h-[24rem] space-y-2 overflow-y-auto p-3">
            {notifications.map((notification) => (
              <button
                key={`${notification.scope}-${notification.id}`}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  notification.isRead
                    ? "border-border/60 bg-background hover:bg-muted/40"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    notification.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {getNotificationIcon(notification.kind)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">
                      {notification.title}
                    </p>
                    {!notification.isRead ? (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  {notification.body ? (
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {notification.body}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
