"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PromoCode = {
  id: string;
  avatar: string;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  created_at: string;
};

const LOGIN_STORAGE_KEY = "rodizio-race-login";

export default function PromoCodesPage() {
  const router = useRouter();
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [maxUsesInput, setMaxUsesInput] = useState("1");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState<Record<string, string>>(
    {}
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const stored = localStorage.getItem(LOGIN_STORAGE_KEY);
    setLoginCode(stored);
  }, []);

  const loadData = async (code: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const permResponse = await fetch(
        `/api/promo-codes/permissions?loginCode=${encodeURIComponent(code)}`
      );
      const permData = await permResponse.json().catch(() => ({}));
      const avatars = Array.isArray(permData?.avatars)
        ? permData.avatars
        : [];
      setPermissions(avatars);

      const codesResponse = await fetch(
        `/api/promo-codes?loginCode=${encodeURIComponent(code)}`
      );
      const codesData = await codesResponse.json().catch(() => ({}));
      setCodes(Array.isArray(codesData?.codes) ? codesData.codes : []);
    } catch {
      setStatusMessage("Nao foi possivel carregar os codigos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loginCode) return;
    loadData(loginCode.trim().toUpperCase());
  }, [loginCode]);

  const createCode = async (avatar: string) => {
    if (!loginCode) return;
    setIsCreating(true);
    setGeneratedCode(null);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginCode: loginCode.trim().toUpperCase(),
          avatar,
          expiresInDays: Number(expiresInDays) || 7,
          maxUses: Number(maxUsesInput) || 1,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "created") {
        setStatusMessage("Nao foi possivel criar o codigo.");
        return;
      }
      setGeneratedCode(data?.code ?? null);
      await loadData(loginCode.trim().toUpperCase());
    } catch {
      setStatusMessage("Nao foi possivel criar o codigo.");
    } finally {
      setIsCreating(false);
    }
  };

  const revealCode = async (codeId: string) => {
    if (!loginCode) return;
    try {
      const response = await fetch("/api/promo-codes/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginCode: loginCode.trim().toUpperCase(),
          codeId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "ok" || !data?.code) {
        setStatusMessage("Nao foi possivel mostrar o codigo.");
        return;
      }
      setRevealedCodes((prev) => ({ ...prev, [codeId]: data.code }));
    } catch {
      setStatusMessage("Nao foi possivel mostrar o codigo.");
    }
  };

  const disableCode = async (codeId: string) => {
    if (!loginCode) return;
    setStatusMessage(null);
    try {
      const response = await fetch("/api/promo-codes/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginCode: loginCode.trim().toUpperCase(),
          codeId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "disabled") {
        setStatusMessage("Nao foi possivel desativar o codigo.");
        return;
      }
      await loadData(loginCode.trim().toUpperCase());
    } catch {
      setStatusMessage("Nao foi possivel desativar o codigo.");
    }
  };


  const codesWithStatus = useMemo(() => {
    return codes.map((code) => {
      const now = Date.now();
      const expiresAt = code.expires_at
        ? new Date(code.expires_at).getTime()
        : null;
      const isExpired = expiresAt !== null && expiresAt < now;
      const isUsedUp = code.uses >= code.max_uses;
      return {
        ...code,
        status: isExpired ? "expirado" : isUsedUp ? "usado" : "ativo",
      };
    });
  }, [codes]);

  const totalPages = Math.max(
    1,
    Math.ceil(codesWithStatus.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedCodes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return codesWithStatus.slice(start, start + ITEMS_PER_PAGE);
  }, [codesWithStatus, currentPage]);
  if (!loginCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Faca login para gerenciar codigos promocionais.
            </p>
            <Button onClick={() => router.push("/")}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black px-6 pb-12 pt-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Gerenciar codigos promocionais
            </p>
            <p className="text-lg font-black">{loginCode}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Voltar
          </Button>
        </div>

        <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
          <CardContent className="pt-6 space-y-4">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Criar codigo (uso unico)
            </Label>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="md:max-w-[160px]"
                placeholder="Dias para expirar"
              />
              <span className="text-xs text-muted-foreground">
                Dias ate expirar
              </span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                value={maxUsesInput}
                onChange={(e) => setMaxUsesInput(e.target.value)}
                className="md:max-w-[160px]"
                placeholder="Numero de usos"
              />
              <span className="text-xs text-muted-foreground">
                Limite de usos
              </span>
            </div>
            {permissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Voce nao tem permissao para criar codigos.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {permissions.map((avatar) => (
                  <Button
                    key={avatar}
                    variant="outline"
                    onClick={() => createCode(avatar)}
                    disabled={isCreating}
                  >
                    Criar para {avatar}
                  </Button>
                ))}
              </div>
            )}
            {generatedCode && (
              <div className="rounded-xl border border-muted/60 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">
                  Codigo gerado (copie agora):
                </p>
                <p className="text-lg font-black tracking-widest">
                  {generatedCode}
                </p>
              </div>
            )}
            {statusMessage && (
              <p className="text-xs text-muted-foreground">{statusMessage}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
          <CardContent className="pt-6 space-y-4">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Codigos criados
            </Label>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : codesWithStatus.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum codigo criado.
              </p>
            ) : (
              <div className="space-y-2">
                {pagedCodes.map((code) => (
                  <div
                    key={code.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-muted/60 bg-background/70 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{code.avatar}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {code.status} | Usos: {code.uses}/
                        {code.max_uses}
                      </p>
                      {code.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expira em{" "}
                          {new Date(code.expires_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      )}
                      {revealedCodes[code.id] && (
                        <p className="text-sm font-semibold tracking-widest">
                          {revealedCodes[code.id]}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {code.status === "ativo" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disableCode(code.id)}
                        >
                          Desativar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revealCode(code.id)}
                      >
                        Mostrar codigo
                      </Button>
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-2 border-t border-muted/30 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Pagina {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Proxima
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
