"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLanguage } from "@/contexts/language-context";
import { getBuildUpdateCopy } from "@/lib/notifications/inbox-copy";

const LOGIN_STORAGE_KEY = "rodizio-race-login";
const NOTIFICATION_STORAGE_KEY = "rodizio-notification-inbox-v1";
const GLOBAL_SCOPE = "global";

type NotificationAction = "open-account" | null;
type NotificationSource = "local" | "server";

export type InboxNotification = {
  action: NotificationAction;
  body: string | null;
  createdAt: string;
  href: string | null;
  id: string;
  isRead: boolean;
  kind: string;
  scope: string;
  source: NotificationSource;
  title: string;
};

type UpsertNotificationInput = {
  action?: NotificationAction;
  body?: string | null;
  createdAt?: string;
  href?: string | null;
  id: string;
  kind: string;
  loginCode?: string | null;
  title: string;
  triggerBrowserNotification?: boolean;
};

type NotificationsContextType = {
  loginCode: string | null;
  markAllAsRead: () => void;
  markAsRead: (
    notificationId: string,
    scope: string,
    source: NotificationSource,
  ) => void;
  notifications: InboxNotification[];
  unreadCount: number;
  removeNotification: (notificationId: string, loginCode?: string | null) => void;
  upsertNotification: (input: UpsertNotificationInput) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined,
);

function normalizeLoginCode(loginCode?: string | null) {
  const normalized = loginCode?.trim().toUpperCase();
  return normalized || null;
}

function resolveScope(loginCode?: string | null) {
  return normalizeLoginCode(loginCode) ?? GLOBAL_SCOPE;
}

function readStoredNotifications() {
  if (typeof window === "undefined") return [] as InboxNotification[];
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InboxNotification[];
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          ...item,
          source: "local" as const,
        }))
      : [];
  } catch {
    return [];
  }
}

function writeStoredNotifications(notifications: InboxNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
}

function canShowBrowserNotification() {
  return typeof window !== "undefined" && "Notification" in window;
}

function showBrowserNotification(title: string, body?: string | null) {
  if (!canShowBrowserNotification() || Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification(title, {
      body: body ?? undefined,
      icon: "/apple-icon.png",
      badge: "/apple-icon.png",
      tag: title,
    });
    window.setTimeout(() => notification.close(), 6000);
  } catch (error) {
    console.error("[notifications:browser]", error);
  }
}

export function NotificationsProvider({
  children,
}: {
  children: import("react").ReactNode;
}) {
  const { language } = useLanguage();
  const [localNotifications, setLocalNotifications] = useState<InboxNotification[]>([]);
  const [remoteNotifications, setRemoteNotifications] = useState<InboxNotification[]>([]);
  const [loginCode, setLoginCode] = useState<string | null>(null);

  const updateLocalNotifications = useCallback(
    (updater: (current: InboxNotification[]) => InboxNotification[]) => {
      setLocalNotifications((current) => {
        const next = updater(current).sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );
        const trimmed = next.slice(0, 40);
        writeStoredNotifications(trimmed);
        return trimmed;
      });
    },
    [],
  );

  const syncLoginCode = useCallback(() => {
    if (typeof window === "undefined") return;
    setLoginCode(normalizeLoginCode(localStorage.getItem(LOGIN_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    setLocalNotifications(readStoredNotifications());
    syncLoginCode();

    window.addEventListener("storage", syncLoginCode);
    window.addEventListener("rodizio-login-updated", syncLoginCode);

    return () => {
      window.removeEventListener("storage", syncLoginCode);
      window.removeEventListener("rodizio-login-updated", syncLoginCode);
    };
  }, [syncLoginCode]);

  const refreshRemoteNotifications = useCallback(async () => {
    if (!loginCode) {
      setRemoteNotifications([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/notifications/inbox?loginCode=${encodeURIComponent(loginCode)}`,
        { cache: "no-store" },
      );
      const data = await response.json().catch(() => ({}));
      const notifications = Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      setRemoteNotifications(
        notifications.map((item) => ({
          action: null,
          body: typeof item?.body === "string" ? item.body : null,
          createdAt: String(item?.created_at ?? new Date().toISOString()),
          href: typeof item?.href === "string" ? item.href : null,
          id: String(item?.id ?? ""),
          isRead: Boolean(item?.is_read),
          kind: typeof item?.kind === "string" ? item.kind : "admin-broadcast",
          scope: loginCode,
          source: "server" as const,
          title: String(item?.title ?? ""),
        })),
      );
    } catch (error) {
      console.error("[notifications:remote]", error);
      setRemoteNotifications([]);
    }
  }, [loginCode]);

  useEffect(() => {
    void refreshRemoteNotifications();
    if (!loginCode) return;
    const intervalId = window.setInterval(() => {
      void refreshRemoteNotifications();
    }, 45000);
    return () => window.clearInterval(intervalId);
  }, [loginCode, refreshRemoteNotifications]);

  const upsertNotification = useCallback(
    ({
      action = null,
      body = null,
      createdAt,
      href = null,
      id,
      kind,
      loginCode: nextLoginCode,
      title,
      triggerBrowserNotification = false,
    }: UpsertNotificationInput) => {
      const scope = resolveScope(nextLoginCode);
      let shouldTriggerBrowserNotification = false;

      updateLocalNotifications((current) => {
        const index = current.findIndex(
          (notification) => notification.id === id && notification.scope === scope,
        );

        if (index >= 0) {
          const existing = current[index];
          const next = [...current];
          next[index] = {
            ...existing,
            action,
            body,
            href,
            kind,
            title,
          };
          return next;
        }

        shouldTriggerBrowserNotification = triggerBrowserNotification;

        return [
          {
            action,
            body,
            createdAt: createdAt ?? new Date().toISOString(),
            href,
            id,
            isRead: false,
            kind,
            scope,
            source: "local",
            title,
          },
          ...current,
        ];
      });

      if (shouldTriggerBrowserNotification) {
        showBrowserNotification(title, body);
      }
    },
    [updateLocalNotifications],
  );

  const removeNotification = useCallback(
    (notificationId: string, nextLoginCode?: string | null) => {
      const scope = resolveScope(nextLoginCode);
      updateLocalNotifications((current) =>
        current.filter(
          (notification) =>
            !(notification.id === notificationId && notification.scope === scope),
        ),
      );
    },
    [updateLocalNotifications],
  );

  const markAsRead = useCallback(
    (notificationId: string, scope: string, source: NotificationSource) => {
      if (source === "server") {
        if (!loginCode) return;
        setRemoteNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId && notification.scope === scope
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
        void fetch("/api/notifications/inbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [notificationId], loginCode }),
        }).catch(() => null);
        return;
      }

      updateLocalNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId && notification.scope === scope
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    },
    [loginCode, updateLocalNotifications],
  );

  const markAllAsRead = useCallback(() => {
    const visibleScopes = new Set([GLOBAL_SCOPE]);
    if (loginCode) {
      visibleScopes.add(loginCode);
    }

    updateLocalNotifications((current) =>
      current.map((notification) =>
        visibleScopes.has(notification.scope)
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
    if (loginCode) {
      setRemoteNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      void fetch("/api/notifications/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginCode, markAll: true }),
      }).catch(() => null);
    }
  }, [loginCode, updateLocalNotifications]);

  useEffect(() => {
    const versionParts = [
      process.env.NEXT_PUBLIC_GIT_BRANCH?.trim(),
      process.env.NEXT_PUBLIC_GIT_SHA?.trim(),
    ].filter(Boolean);

    if (versionParts.length === 0) return;

    const versionLabel = versionParts.join(" · ");
    const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME?.trim();
    const copy = getBuildUpdateCopy(language, versionLabel);

    upsertNotification({
      body: buildTime ? `${copy.body} ${buildTime}`.trim() : copy.body,
      id: `build-update-${process.env.NEXT_PUBLIC_GIT_SHA?.trim() || versionLabel}`,
      kind: "build-update",
      title: copy.title,
      triggerBrowserNotification: true,
    });
  }, [language, upsertNotification]);

  const visibleNotifications = useMemo(() => {
    const activeScopes = new Set([GLOBAL_SCOPE]);
    if (loginCode) {
      activeScopes.add(loginCode);
    }

    return [...remoteNotifications, ...localNotifications]
      .filter((notification) => activeScopes.has(notification.scope))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
  }, [localNotifications, loginCode, remoteNotifications]);

  const unreadCount = useMemo(
    () =>
      visibleNotifications.reduce(
        (count, notification) => count + (notification.isRead ? 0 : 1),
        0,
      ),
    [visibleNotifications],
  );

  return (
    <NotificationsContext.Provider
      value={{
        loginCode,
        markAllAsRead,
        markAsRead,
        notifications: visibleNotifications,
        removeNotification,
        unreadCount,
        upsertNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
