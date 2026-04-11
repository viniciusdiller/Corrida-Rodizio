"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Copy, ExternalLink, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildRoomInviteUrl } from "@/lib/utils/room-invite";

type RoomQrPageProps = {
  roomCode: string;
};

const copy = {
  pt: {
    eyebrow: "Entrada por QR",
    title: "Escaneie para entrar na sala",
    body: "Abra a camera do celular, leia o QR code e entre direto na corrida.",
    room: "Sala",
    back: "Voltar para a sala",
    copy: "Copiar link",
    copied: "Link copiado",
    open: "Abrir link",
  },
  en: {
    eyebrow: "QR entry",
    title: "Scan to join the room",
    body: "Open your phone camera, scan the QR code, and jump straight into the race.",
    room: "Room",
    back: "Back to room",
    copy: "Copy link",
    copied: "Link copied",
    open: "Open link",
  },
  es: {
    eyebrow: "Entrada por QR",
    title: "Escanea para entrar en la sala",
    body: "Abre la camara del celular, escanea el codigo QR y entra directo en la carrera.",
    room: "Sala",
    back: "Volver a la sala",
    copy: "Copiar enlace",
    copied: "Enlace copiado",
    open: "Abrir enlace",
  },
  fr: {
    eyebrow: "Entree QR",
    title: "Scannez pour rejoindre la salle",
    body: "Ouvrez la camera du telephone, scannez le QR code et entrez directement dans la course.",
    room: "Salle",
    back: "Retour a la salle",
    copy: "Copier le lien",
    copied: "Lien copie",
    open: "Ouvrir le lien",
  },
} as const;

export function RoomQrPage({ roomCode }: RoomQrPageProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const ui = copy[language] ?? copy.pt;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const roomHref = `/sala/${roomCode.toUpperCase()}`;

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return buildRoomInviteUrl(window.location.origin, roomCode, language);
  }, [language, roomCode]);

  useEffect(() => {
    if (!inviteUrl) return;

    let cancelled = false;
    void QRCode.toDataURL(inviteUrl, {
      width: 720,
      margin: 1,
      color: {
        dark: "#2b1206",
        light: "#fff7ed",
      },
    }).then((dataUrl) => {
      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleOpenInvite = () => {
    const targetUrl = inviteUrl || roomHref;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="rounded-2xl"
            onClick={() => router.push(roomHref)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {ui.back}
          </Button>

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-900">
            <QrCode className="h-3.5 w-3.5" />
            {ui.eyebrow}
          </div>
        </div>

        <Card className="overflow-hidden rounded-[32px] border-orange-200/70 bg-[linear-gradient(180deg,#fff8f1,#fff2e2)] shadow-[0_24px_80px_rgba(120,53,15,0.16)]">
          <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div className="order-1 flex items-center justify-center md:order-2">
              <div className="rounded-[36px] border border-orange-200 bg-white p-5 shadow-[0_20px_50px_rgba(120,53,15,0.12)]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`${ui.title}: ${roomCode.toUpperCase()}`}
                    className="h-[280px] w-[280px] rounded-[24px] sm:h-[320px] sm:w-[320px]"
                  />
                ) : (
                  <div className="flex h-[280px] w-[280px] items-center justify-center rounded-[24px] bg-orange-50 text-sm font-semibold text-orange-800 sm:h-[320px] sm:w-[320px]">
                    QR...
                  </div>
                )}
              </div>
            </div>

            <div className="order-2 space-y-4 md:order-1">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-700">
                  {ui.eyebrow}
                </p>
                <h1 className="text-3xl font-black tracking-tight text-orange-950 sm:text-4xl">
                  {ui.title}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-orange-950/72">
                  {ui.body}
                </p>
              </div>

              <div className="rounded-[28px] border border-orange-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-700">
                  {ui.room}
                </p>
                <p className="mt-2 font-mono text-3xl font-black tracking-[0.18em] text-orange-950">
                  {roomCode.toUpperCase()}
                </p>
                <p className="mt-3 break-all text-sm text-orange-950/70">
                  {inviteUrl}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCopy} className="rounded-2xl font-bold">
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? ui.copied : ui.copy}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl font-bold"
                  onClick={handleOpenInvite}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {ui.open}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
