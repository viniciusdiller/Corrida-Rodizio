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
  Camera,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { sanitizeAlphanumeric } from "@/lib/utils/username-validation";

interface AccountSectionProps {
  loginCode: string | null;
  accountFlow: "login" | "create" | "reset" | null;
  accountLoading: boolean;
  accountCodeInput: string;
  accountPassword: string;
  accountConfirmPassword: string;
  accountEmail: string;
  acceptTerms: boolean;
  setAcceptTerms: (val: boolean) => void;
  roomsWithPhotos: string[];
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
  setAccountFlow: (flow: "login" | "create" | "reset" | null) => void;
  setAccountCodeInput: (val: string) => void;
  setAccountPassword: (val: string) => void;
  setAccountConfirmPassword: (val: string) => void;
  setAccountEmail: (val: string) => void;
  onRequestPasswordReset: (username: string, email: string) => void;
  onConfirmPasswordReset: (payload: {
    username: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
  passwordResetLoading: boolean;
  passwordResetStatus: string | null;
  onMenuStateChange?: (isOpen: boolean) => void;
  router: any;
}

export function AccountSection({
  loginCode,
  accountFlow,
  accountLoading,
  accountCodeInput,
  accountPassword,
  accountConfirmPassword,
  accountEmail,
  acceptTerms,
  setAcceptTerms,
  roomsWithPhotos,
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
  setAccountConfirmPassword,
  setAccountEmail,
  onRequestPasswordReset,
  onConfirmPasswordReset,
  passwordResetLoading,
  passwordResetStatus,
  onToggleHistory,
  setCurrentPage,
  onMenuStateChange,
  router,
}: AccountSectionProps) {
  const { t } = useLanguage();
  const isHistoryView = showHistory;
  const [usernameAvailability, setUsernameAvailability] = useState<
    "checking" | "available" | "unavailable" | null
  >(null);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  useEffect(() => {
    if (accountFlow !== "create") {
      setUsernameAvailability(null);
      return;
    }

    const normalizedUsername = accountCodeInput.trim().toUpperCase();
    if (normalizedUsername.length < 3) {
      setUsernameAvailability(null);
      return;
    }

    setUsernameAvailability("checking");
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/account/availability?username=${encodeURIComponent(
            normalizedUsername,
          )}`,
        );
        if (!response.ok) {
          setUsernameAvailability(null);
          return;
        }
        const data = await response.json().catch(() => ({}));
        setUsernameAvailability(data?.available ? "available" : "unavailable");
      } catch {
        setUsernameAvailability(null);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [accountCodeInput, accountFlow]);

  useEffect(() => {
    onMenuStateChange?.(isHistoryView || accountFlow !== null);
  }, [isHistoryView, accountFlow, onMenuStateChange]);

  useEffect(() => {
    if (accountFlow !== "reset") {
      setResetCodeSent(false);
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
    }
  }, [accountFlow]);

  // Lógica de Paginação interna
  const totalPages = Math.ceil(myGroups.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = myGroups.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-4">
      {loginCode ? (
        /* SESSÃO: USUÁRIO LOGADO */
        <div className="space-y-3 rounded-2xl border border-muted/60 bg-background/60 p-4">

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

          {groupsError && (
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
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem(
                            `rodizio-join-prompt-${group.room_code}`,
                            "1",
                          );
                        }
                        router.push(`/sala/${group.room_code}`);
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{group.name}</p>
                          {group.is_active ? (
                            <span className="text-[8px] bg-orange-200/60 text-orange-700 dark:bg-purple-500/30 dark:text-purple-200 px-1.5 py-0.5 rounded uppercase font-black">
                              {t.room.status_in_progress}
                            </span>
                          ) : (
                            <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-black">
                              {t.room.status_closed}
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
                            {group.photo_mode &&
                              roomsWithPhotos.includes(group.room_code) && (
                                <Camera className="h-3 w-3 text-orange-500" />
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
                          {t.account?.page_of
                            ? t.account.page_of
                                .replace("{current}", String(currentPage))
                                .replace("{total}", String(totalPages))
                            : `Página ${currentPage} de ${totalPages}`}
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
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500">*</span> {t.account.required_fields_hint}
              </p>
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
                  onChange={(e) => setAccountCodeInput(sanitizeAlphanumeric(e.target.value))}
                  maxLength={20}
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
                variant="link"
                className="h-auto px-0 text-xs"
                onClick={() => {
                  setAccountFlow("reset");
                }}
              >
                {t.account.forgot_password}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                onClick={() => {
                  setAcceptTerms(false);
                  setAccountConfirmPassword("");
                  setAccountFlow("create");
                }}
              >
                {t.account.no_account}
              </Button>
            </>
          ) : accountFlow === "create" ? (
            <>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500">*</span> {t.account.required_fields_hint}
              </p>
              <div className="space-y-2">
                <Label
                  htmlFor="newUsername"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  {t.account.create_username_label} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newUsername"
                  placeholder={t.account.create_username_placeholder}
                  value={accountCodeInput}
                  onChange={(e) => setAccountCodeInput(sanitizeAlphanumeric(e.target.value))}
                  maxLength={20}
                  className="h-12 text-lg font-bold"
                />
                {usernameAvailability && (
                  <p
                    className={`text-xs font-semibold ${
                      usernameAvailability === "available"
                        ? "text-emerald-600"
                        : usernameAvailability === "unavailable"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {usernameAvailability === "checking"
                      ? t.account.username_checking
                      : usernameAvailability === "available"
                        ? t.account.username_available
                        : t.account.username_not_available}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="newRecoveryEmail"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  {t.account.recovery_email_optional_label}
                </Label>
                <Input
                  id="newRecoveryEmail"
                  type="email"
                  placeholder={t.account.recovery_email_placeholder}
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  {t.account.create_password_label} <span className="text-red-500">*</span>
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
              <div className="space-y-2">
                <Label
                  htmlFor="confirmNewPassword"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  {t.account.create_confirm_password_label} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  placeholder={t.account.create_confirm_password_placeholder}
                  value={accountConfirmPassword}
                  onChange={(e) => setAccountConfirmPassword(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  id="account-terms"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="account-terms" className="leading-tight">
                  <span className="text-red-500">*</span>{" "}
                  {t.common.terms_pre_link}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    {t.common.terms_link}
                  </a>
                  {t.common.privacy_connector}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    {t.common.privacy_link}
                  </a>
                  {t.common.terms_post_link}
                </label>
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={onCreateLogin}
                disabled={
                  accountLoading ||
                  usernameAvailability === "unavailable" ||
                  !accountConfirmPassword.trim()
                }
              >
                {accountLoading ? t.common.loading : t.account.create_btn}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                onClick={() => {
                  setAcceptTerms(false);
                  setAccountConfirmPassword("");
                  setAccountFlow("login");
                }}
              >
                {t.account.have_account}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">
                  {t.account.reset_username_label}
                </Label>
                <Input
                  placeholder={t.account.username_placeholder}
                  value={accountCodeInput}
                  onChange={(e) =>
                    setAccountCodeInput(sanitizeAlphanumeric(e.target.value))
                  }
                  maxLength={20}
                  className="h-12 text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">
                  {t.account.recovery_email_label}
                </Label>
                <Input
                  type="email"
                  placeholder={t.account.recovery_email_placeholder}
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => {
                  onRequestPasswordReset(accountCodeInput, accountEmail);
                  setResetCodeSent(true);
                }}
                disabled={passwordResetLoading}
              >
                {passwordResetLoading ? t.common.loading : t.account.send_reset_code_btn}
              </Button>

              {resetCodeSent && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">
                      {t.account.reset_code_label}
                    </Label>
                    <Input
                      value={resetCode}
                      onChange={(e) =>
                        setResetCode(sanitizeAlphanumeric(e.target.value))
                      }
                      maxLength={6}
                      className="h-12 text-lg font-bold tracking-[0.3em]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">
                      {t.account.reset_new_password_label}
                    </Label>
                    <Input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">
                      {t.account.reset_confirm_password_label}
                    </Label>
                    <Input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <Button
                    className="w-full h-12 rounded-xl font-bold"
                    onClick={() =>
                      onConfirmPasswordReset({
                        username: accountCodeInput,
                        code: resetCode,
                        newPassword: resetNewPassword,
                        confirmPassword: resetConfirmPassword,
                      })
                    }
                    disabled={passwordResetLoading}
                  >
                    {passwordResetLoading
                      ? t.common.loading
                      : t.account.reset_password_btn}
                  </Button>
                </>
              )}
              {passwordResetStatus && (
                <p className="text-xs font-semibold text-muted-foreground">
                  {passwordResetStatus}
                </p>
              )}
            </>
          )}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold cursor-pointer"
            onClick={() => {
              setAcceptTerms(false);
              setAccountConfirmPassword("");
              setAccountFlow(null);
            }}
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
