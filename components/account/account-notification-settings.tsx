"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { normalizeInviteLanguage } from "@/lib/utils/room-invite";

type AccountNotificationSettingsProps = {
  loginCode: string;
};

type SupportState = "checking" | "ready" | "unsupported" | "unavailable";

const copy = {
  pt: {
    title: "Notificacoes",
    enable: "Ativar",
    disable: "Desativar",
    blocked: "A permissao de notificacao esta bloqueada no navegador.",
    unavailable: "Notificacoes indisponiveis neste ambiente.",
    enabledToast: "Notificacoes ativadas.",
    disabledToast: "Notificacoes desativadas.",
    checking: "Preparando notificacoes...",
  },
  en: {
    title: "Notifications",
    enable: "Enable",
    disable: "Disable",
    blocked: "Notification permission is blocked in the browser.",
    unavailable: "Notifications are unavailable in this environment.",
    enabledToast: "Notifications enabled.",
    disabledToast: "Notifications disabled.",
    checking: "Preparing notifications...",
  },
  es: {
    title: "Notificaciones",
    enable: "Activar",
    disable: "Desactivar",
    blocked: "El permiso de notificaciones esta bloqueado en el navegador.",
    unavailable: "Las notificaciones no estan disponibles en este entorno.",
    enabledToast: "Notificaciones activadas.",
    disabledToast: "Notificaciones desactivadas.",
    checking: "Preparando notificaciones...",
  },
  fr: {
    title: "Notifications",
    enable: "Activer",
    disable: "Desactiver",
    blocked: "L'autorisation de notification est bloquee dans le navigateur.",
    unavailable: "Les notifications ne sont pas disponibles dans cet environnement.",
    enabledToast: "Notifications activees.",
    disabledToast: "Notifications desactivees.",
    checking: "Preparation des notifications...",
  },
} as const;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function AccountNotificationSettings({
  loginCode,
}: AccountNotificationSettingsProps) {
  const { language } = useLanguage();
  const ui = copy[language] ?? copy.pt;
  const [supportState, setSupportState] = useState<SupportState>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [publicKey, setPublicKey] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const canUsePush = useMemo(() => {
    if (typeof window === "undefined") return false;
    const isSecure =
      window.isSecureContext || window.location.hostname === "localhost";
    return (
      isSecure &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }, []);

  const syncSubscription = async (subscription: PushSubscription) => {
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loginCode,
        language: normalizeInviteLanguage(language),
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error("subscribe_failed");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      if (!canUsePush) {
        if (isMounted) setSupportState("unsupported");
        return;
      }

      setPermission(Notification.permission);
      const response = await fetch("/api/notifications/public-key");
      const data = (await response.json().catch(() => ({}))) as {
        available?: boolean;
        publicKey?: string;
      };

      if (!response.ok || !data.available || !data.publicKey) {
        if (isMounted) setSupportState("unavailable");
        return;
      }

      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const currentSubscription = await registration.pushManager.getSubscription();

      if (isMounted) {
        setPublicKey(data.publicKey);
        setSupportState("ready");
        setIsSubscribed(false);
      }

      if (currentSubscription) {
        try {
          await syncSubscription(currentSubscription);
          if (isMounted) {
            setIsSubscribed(true);
          }
        } catch (error) {
          console.error("[notifications:sync]", error);
          if (isMounted) {
            setIsSubscribed(false);
          }
        }
      }
    };

    void boot();

    return () => {
      isMounted = false;
    };
  }, [canUsePush, language, loginCode]);

  const handleEnable = async () => {
    if (!publicKey) {
      toast.error(ui.unavailable);
      return;
    }

    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        toast.error(ui.blocked);
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      await syncSubscription(subscription);
      setIsSubscribed(true);
      toast.success(ui.enabledToast);
    } catch (error) {
      console.error(error);
      setIsSubscribed(false);
      toast.error(ui.unavailable);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async () => {
    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      toast.success(ui.disabledToast);
    } catch (error) {
      console.error(error);
      toast.error(ui.unavailable);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-muted bg-muted/20 p-3 transition-all hover:bg-muted/30">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-foreground shadow-sm">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {ui.title}
            </p>
          </div>
        </div>

        {supportState === "ready" && permission !== "denied" ? (
          isSubscribed ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 rounded-xl px-3 text-xs font-semibold"
              onClick={handleDisable}
              disabled={isBusy}
            >
              <BellOff className="h-4 w-4" />
              {ui.disable}
            </Button>
          ) : (
            <Button
              type="button"
              className="h-9 shrink-0 rounded-xl px-3 text-xs font-semibold"
              onClick={handleEnable}
              disabled={isBusy}
            >
              <Bell className="h-4 w-4" />
              {ui.enable}
            </Button>
          )
        ) : null}
      </div>

      <div className="mt-2">
        {supportState === "checking" ? (
          <span className="text-xs font-medium text-muted-foreground">
            {ui.checking}
          </span>
        ) : supportState !== "ready" ? (
          <span className="text-xs font-medium text-muted-foreground">
            {ui.unavailable}
          </span>
        ) : permission === "denied" ? (
          <span className="text-xs font-medium text-muted-foreground">
            {ui.blocked}
          </span>
        ) : null}
      </div>
    </div>
  );
}
