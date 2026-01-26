"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogIn,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface AccountSectionProps {
  loginCode: string | null;
  accountFlow: "login" | "create" | null;
  accountLoading: boolean;
  accountCodeInput: string;
  accountPassword: string;
  myGroups: any[];
  isLoadingGroups: boolean;
  groupsError: string | null;
  showHistory: boolean;
  currentPage: number;
  itemsPerPage: number;
  onToggleHistory: () => void;
  setCurrentPage: (page: number) => void;
  onLoadGroups: () => void;
  onLogin: () => void;
  onCreateLogin: () => void;
  setAccountFlow: (flow: "login" | "create" | null) => void;
  setAccountCodeInput: (val: string) => void;
  setAccountPassword: (val: string) => void;
  onMenuStateChange?: (isOpen: boolean) => void;
  router: any;
}

export function AccountSection({
  loginCode,
  accountFlow,
  accountLoading,
  accountCodeInput,
  accountPassword,
  myGroups,
  isLoadingGroups,
  groupsError,
  showHistory,
  currentPage,
  itemsPerPage,
  onLoadGroups,
  onLogin,
  onCreateLogin,
  setAccountFlow,
  setAccountCodeInput,
  setAccountPassword,
  onToggleHistory,
  setCurrentPage,
  onMenuStateChange,
  router,
}: AccountSectionProps) {
  const { t } = useLanguage();
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [promoPermissions, setPromoPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const isHistoryView = showHistory;
  const isClaimView = showClaimForm;

  useEffect(() => {
    onMenuStateChange?.(isHistoryView || isClaimView || accountFlow !== null);
  }, [isHistoryView, isClaimView, accountFlow, onMenuStateChange]);

  // Lógica de Paginação interna
  const totalPages = Math.ceil(myGroups.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = myGroups.slice(indexOfFirstItem, indexOfLastItem);

  const handleClaimExclusiveAvatar = async () => {
    // ... (manter lógica igual)
    if (!loginCode) return;
    const trimmedCode = claimCode.trim();
    if (!trimmedCode) {
      setClaimStatus("Digite o codigo.");
      return;
    }
    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const response = await fetch("/api/exclusive-avatars/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginCode: loginCode.trim().toUpperCase(),
          code: trimmedCode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const status = String(data?.status || "");
      if (status === "claimed") {
        setClaimStatus(`Avatar registrado: ${data?.avatar ?? ""}`.trim());
        setClaimCode("");
        return;
      }
      // ... (rest of error handling)
      setClaimStatus("Erro ao registrar.");
    } catch {
      setClaimStatus("Nao foi possivel registrar o avatar.");
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    loadPromoPermissions();
  }, [loginCode]);

  const loadPromoPermissions = async () => {
    if (!loginCode) {
      setPromoPermissions([]);
      return;
    }
    setIsLoadingPermissions(true);
    try {
      const response = await fetch(
        `/api/promo-codes/permissions?loginCode=${encodeURIComponent(
          loginCode.trim().toUpperCase(),
        )}`,
      );
      const data = await response.json().catch(() => ({}));
      const avatars = Array.isArray(data?.avatars) ? data.avatars : [];
      setPromoPermissions(avatars);
    } catch {
      setPromoPermissions([]);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  return (
    <div className="space-y-4">
      {loginCode ? (
        /* SESSÃO: USUÁRIO LOGADO */
        <div className="space-y-3 rounded-2xl border border-muted/60 bg-background/60 p-4">

          {!isClaimView && (
            <Button
              variant="outline"
              className={`w-full h-12 rounded-xl font-semibold transition-all cursor-pointer ${
                isHistoryView ? "bg-muted" : ""
              }`}
              onClick={() => {
                if (isHistoryView) {
                  onToggleHistory();
                  return;
                }
                if (isClaimView) {
                  setShowClaimForm(false);
                }
                onToggleHistory();
              }}
              disabled={isLoadingGroups}
            >
              {isLoadingGroups
                ? t.common.loading
                : isHistoryView
                  ? t.common.back
                  : t.account.view_history}
            </Button>
          )}

          {!isHistoryView && (
            <Button
              variant="outline"
              className={`w-full h-12 rounded-xl font-semibold transition-all ${
                isClaimView ? "bg-muted" : ""
              }`}
              onClick={() => {
                if (isClaimView) {
                  setShowClaimForm(false);
                  return;
                }
                if (isHistoryView) {
                  onToggleHistory();
                }
                setShowClaimForm(true);
                setClaimStatus(null);
              }}
            >
              {isClaimView ? t.common.back : t.account.register_avatar}
            </Button>
          )}

          {isClaimView && (
            <div className="space-y-2 rounded-xl border border-muted/60 bg-background/70 p-3">
              <Label className="text-xs uppercase font-bold text-muted-foreground">
                Codigo de resgate
              </Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  className="h-10"
                  placeholder="EX: BETA-2025-01"
                />
                <Button
                  className="h-10 md:w-40"
                  onClick={handleClaimExclusiveAvatar}
                  disabled={isClaiming}
                >
                  {isClaiming ? "..." : "OK"}
                </Button>
              </div>
              {claimStatus && (
                <p className="text-xs text-muted-foreground font-semibold">
                  {claimStatus}
                </p>
              )}
            </div>
          )}

          {!isHistoryView && !isClaimView && !isLoadingPermissions && promoPermissions.length > 0 && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold"
              onClick={() => router.push("/codigos-promocionais")}
            >
              {t.account.manage_codes}
            </Button>
          )}

          {!isClaimView && groupsError && (
            <p className="text-xs text-red-500 font-semibold">{groupsError}</p>
          )}

          {isHistoryView && !isLoadingGroups && (
            <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {currentItems.length > 0 ? (
                <>
                  {currentItems.map((group: any) => (
                    <button
                      key={group.id}
                      type="button"
                      className="w-full text-left flex flex-wrap items-center justify-between gap-2 rounded-xl border border-muted/60 bg-background/70 px-4 py-3 hover:border-primary/40 transition-colors"
                      onClick={() => router.push(`/sala/${group.room_code}`)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{group.name}</p>
                          {group.is_active ? (
                            <span className="text-[8px] bg-orange-200/60 text-orange-700 px-1.5 py-0.5 rounded uppercase font-black">
                              Em andamento
                            </span>
                          ) : (
                            <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-black">
                              Encerrada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                          <span>
                            {group.items_eaten}{" "}
                            {group.food_type === "pizza"
                              ? "pts"
                              : group.food_type === "sushi"
                                ? "pts"
                                : "pts"}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-primary/80">
                            {group.room_code}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 italic">
                            <Calendar className="h-3 w-3" />
                            {new Date(group.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      </div>
                    </button>
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
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4 italic">
                  {t.account.history_empty}
                </p>
              )}
            </div>
          )}
        </div>
      ) : accountFlow ? (
        /* SESSÃO: LOGIN OU CRIAÇÃO */
        <div className="space-y-4 rounded-2xl border border-muted/60 bg-background/60 p-4">
          {accountFlow === "login" ? (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="accountCode"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  {t.account.username_label}
                </Label>
                <Input
                  id="accountCode"
                  placeholder={t.account.username_placeholder}
                  value={accountCodeInput}
                  onChange={(e) => setAccountCodeInput(e.target.value)}
                  className="h-12 text-lg font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="accountPassword"
                  className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                >
                  {t.account.password_label}
                </Label>
                <Input
                  id="accountPassword"
                  type="password"
                  placeholder={t.account.password_placeholder}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onLogin();
                  }}
                  className="h-12"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={onLogin}
                disabled={accountLoading}
              >
                <LogIn className="mr-2 h-4 w-4" />{" "}
                {accountLoading ? t.common.loading : t.account.login_btn}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                onClick={() => setAccountFlow("create")}
              >
                {t.account.no_account}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="newUsername"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  {t.account.create_username_label}
                </Label>
                <Input
                  id="newUsername"
                  placeholder={t.account.create_username_placeholder}
                  value={accountCodeInput}
                  onChange={(e) => setAccountCodeInput(e.target.value)}
                  className="h-12 text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  {t.account.create_password_label}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t.account.create_password_placeholder}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={onCreateLogin}
                disabled={accountLoading}
              >
                {accountLoading ? t.common.loading : t.account.create_btn}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                onClick={() => setAccountFlow("login")}
              >
                {t.account.have_account}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold cursor-pointer"
            onClick={() => setAccountFlow(null)}
          >
            {t.common.back}
          </Button>
        </div>
      ) : (
        /* BOTÃO INICIAL */
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold"
          onClick={() => setAccountFlow("login")}
        >
          {t.account.enter_btn}
        </Button>
      )}
    </div>
  );
}
