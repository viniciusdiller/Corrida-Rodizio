"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  onLogout: () => void;
  onLoadGroups: () => void;
  onLogin: () => void;
  onCreateLogin: () => void;
  setAccountFlow: (flow: "login" | "create" | null) => void;
  setAccountCodeInput: (val: string) => void;
  setAccountPassword: (val: string) => void;
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
  onLogout,
  onLoadGroups,
  onLogin,
  onCreateLogin,
  setAccountFlow,
  setAccountCodeInput,
  setAccountPassword,
  onToggleHistory,
  setCurrentPage,
  router,
}: AccountSectionProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [promoPermissions, setPromoPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Lógica de Paginação interna
  const totalPages = Math.ceil(myGroups.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = myGroups.slice(indexOfFirstItem, indexOfLastItem);

  const handleChangePassword = async () => {
    if (!loginCode) return;
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmNewPassword.trim();
    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      setPasswordStatus("Preencha todos os campos.");
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setPasswordStatus("As novas senhas nao conferem.");
      return;
    }
    if (trimmedNew.length < 6) {
      setPasswordStatus("A nova senha precisa de pelo menos 6 caracteres.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("change_login_password", {
        p_username: loginCode.trim().toUpperCase(),
        p_old_password: trimmedCurrent,
        p_new_password: trimmedNew,
      });

      if (error || !data) {
        setPasswordStatus("Senha atual incorreta.");
        return;
      }

      setPasswordStatus("Senha atualizada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordForm(false);
    } catch {
      setPasswordStatus("Nao foi possivel atualizar a senha.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClaimExclusiveAvatar = async () => {
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
      if (status === "already_claimed") {
        setClaimStatus("Esse avatar ja esta na sua conta.");
        return;
      }
      if (status === "used_up") {
        setClaimStatus("Codigo ja foi usado.");
        return;
      }
      if (status === "expired") {
        setClaimStatus("Codigo expirado.");
        return;
      }
      if (status === "unknown_user") {
        setClaimStatus("Usuario invalido.");
        return;
      }
      setClaimStatus("Codigo invalido.");
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
          loginCode.trim().toUpperCase()
        )}`
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Nome de Usuário
              </p>
              <p className="text-2xl font-black tracking-wider">{loginCode}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="text-muted-foreground hover:text-primary cursor-pointer"
                onClick={() => {
                  setShowPasswordForm((prev) => !prev);
                  setPasswordStatus(null);
                }}
              >
                Trocar senha
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary cursor-pointer"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          </div>

          {showPasswordForm && (
            <div className="space-y-2 rounded-xl border border-muted/60 bg-background/70 p-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">
                  Senha atual
                </Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-10"
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">
                  Nova senha
                </Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10"
                  placeholder="Digite a nova senha"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">
                  Confirmar nova senha
                </Label>
                <Input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="h-10"
                  placeholder="Digite a nova senha novamente"
                />
              </div>
              {passwordStatus && (
                <p className="text-xs text-muted-foreground font-semibold">
                  {passwordStatus}
                </p>
              )}
              <Button
                className="w-full h-10 rounded-xl font-bold"
                onClick={handleChangePassword}
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className={`w-full h-12 rounded-xl font-semibold transition-all cursor-pointer ${
              showHistory ? "bg-muted" : ""
            }`}
            onClick={onToggleHistory}
            disabled={isLoadingGroups}
          >
            {isLoadingGroups
              ? "Carregando..."
              : showHistory
              ? "Ocultar histórico"
              : "Ver histórico de Competições"}
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold"
            onClick={() => {
              setShowClaimForm((prev) => !prev);
              setClaimStatus(null);
            }}
          >
            Registrar avatar exclusivo
          </Button>

          {showClaimForm && (
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
                  {isClaiming ? "Registrando..." : "Registrar"}
                </Button>
              </div>
              {claimStatus && (
                <p className="text-xs text-muted-foreground font-semibold">
                  {claimStatus}
                </p>
              )}
            </div>
          )}

          {!isLoadingPermissions && promoPermissions.length > 0 && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold"
              onClick={() => router.push("/codigos-promocionais")}
            >
              Gerenciar codigos promocionais
            </Button>
          )}

          {groupsError && (
            <p className="text-xs text-red-500 font-semibold">{groupsError}</p>
          )}

          {showHistory && !isLoadingGroups && (
            <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {currentItems.length > 0 ? (
                <>
                  {currentItems.map((group: any) => (
                    <div
                      key={group.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-muted/60 bg-background/70 px-4 py-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{group.name}</p>
                          {!group.is_active && (
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
                              "pt-BR"
                            )}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={group.is_active ? "ghost" : "outline"}
                        className={
                          group.is_active
                            ? "text-primary font-bold"
                            : "text-xs h-8"
                        }
                        onClick={() => router.push(`/sala/${group.room_code}`)}
                      >
                        {group.is_active ? "Entrar" : "Ver Placar"}
                      </Button>
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
                  Nenhuma competição encontrada.
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
                  Seu Nome de Usuário
                </Label>
                <Input
                  id="accountCode"
                  placeholder="Ex: João Silva"
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
                  Senha
                </Label>
                <Input
                  id="accountPassword"
                  type="password"
                  placeholder="Sua senha"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={onLogin}
                disabled={accountLoading}
              >
                <LogIn className="mr-2 h-4 w-4" />{" "}
                {accountLoading ? "Entrando..." : "Entrar"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setAccountFlow("create")}
              >
                Não tem conta? Criar agora
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="newUsername"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  Escolha seu Nome de Usuário
                </Label>
                <Input
                  id="newUsername"
                  placeholder="Ex: VINECO"
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
                  Defina sua Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
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
                {accountLoading
                  ? "Criando..."
                  : "Criar conta e Salvar Histórico"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setAccountFlow("login")}
              >
                Já tenho conta
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground cursor-pointer"
            onClick={() => setAccountFlow(null)}
          >
            Voltar
          </Button>
        </div>
      ) : (
        /* BOTÃO INICIAL */
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold"
          onClick={() => setAccountFlow("login")}
        >
          Entrar com uma conta
        </Button>
      )}
    </div>
  );
}
