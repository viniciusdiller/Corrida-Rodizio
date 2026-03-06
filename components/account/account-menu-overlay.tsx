"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  BadgeCheck,
  Check,
  Copy,
  KeyRound,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Smartphone,
  Ticket,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AccountMenuLabels {
  addToHome: string;
  back: string;
  changePassword: string;
  claimPromptLabel: string;
  claimPromptPlaceholder: string;
  claimSubmit: string;
  currentPassword: string;
  loading: string;
  logout: string;
  manageCodes: string;
  newPassword: string;
  recoveryEmailLabel: string;
  recoveryEmailPlaceholder: string;
  registerAvatar: string;
  save: string;
  update: string;
  updatePassword: string;
  updatingPassword: string;
  confirmPassword: string;
  premiumCreditsAvailable: string;
  invitationCodeLabel: string;
}

interface RecoveryEmailState {
  hasSaved: boolean;
  isSaving: boolean;
  status: string | null;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

interface ClaimState {
  isSubmitting: boolean;
  status: string | null;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

interface PasswordState {
  confirm: string;
  current: string;
  isSubmitting: boolean;
  newPassword: string;
  status: string | null;
  onConfirmChange: (value: string) => void;
  onCurrentChange: (value: string) => void;
  onNewChange: (value: string) => void;
  onSubmit: () => void;
}

interface AccountMenuOverlayProps {
  invitationCode: string | null;
  canManageCodes: boolean;
  claim: ClaimState;
  labels: AccountMenuLabels;
  onAddToHome: () => void;
  onClose: () => void;
  onLogout: () => void;
  onManageCodes: () => void;
  onToggleClaimForm: () => void;
  onTogglePasswordForm: () => void;
  open: boolean;
  password: PasswordState;
  recoveryEmail: RecoveryEmailState;
  showAddToHome: boolean;
  showClaimForm: boolean;
  showPasswordForm: boolean;
}

export function AccountMenuOverlay({
  open,
  onClose,
  labels,
  showPasswordForm,
  onTogglePasswordForm,
  showClaimForm,
  onToggleClaimForm,
  onLogout,
  canManageCodes,
  onManageCodes,
  showAddToHome,
  onAddToHome,
  recoveryEmail,
  claim,
  password,
  invitationCode,
}: AccountMenuOverlayProps) {
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  if (!open && !mounted) return null;

  const handleCopyCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode);
      setHasCopiedCode(true);
      setTimeout(() => setHasCopiedCode(false), 2000);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Overlay com fade e blur */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div
        className={`relative z-50 flex w-full flex-col overflow-hidden bg-background shadow-2xl transition-transform duration-300 ease-out 
          max-h-[85dvh] sm:max-h-[85dvh]
          sm:max-w-md sm:rounded-2xl sm:border sm:border-muted/60
          rounded-t-[2rem] border-t border-muted/50
          ${open ? "translate-y-0 sm:scale-100" : "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"}
        `}
      >
        {/* Puxador (Drag Handle) apenas no mobile - FIXO */}
        <div className="shrink-0 flex w-full justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-muted/60" />
        </div>

        {/* Header Fixo */}
        <div className="shrink-0 flex items-center justify-between px-4 pb-2 pt-1 sm:pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="-ml-2 h-10 gap-2 px-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-semibold text-base">{labels.back}</span>
          </Button>
        </div>

        {/* Conteúdo COM SCROLL flex-1 overflow-y-auto */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-12 sm:pb-6 space-y-5 custom-scrollbar">
          {/* Status e Infos da Conta */}
          <div className="space-y-3">
            <div className="w-full rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 flex items-center justify-center shadow-inner">
              <span className="flex items-center gap-2 text-center text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <BadgeCheck className="h-4 w-4" />
                {labels.premiumCreditsAvailable}
              </span>
            </div>

            {invitationCode && (
              <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-2 pl-4 shadow-sm">
                <span className="flex-1 text-sm font-semibold tracking-wide text-primary">
                  {labels.invitationCodeLabel}:{" "}
                  <span className="font-bold">{invitationCode}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 shrink-0 rounded-xl transition-all ${
                    hasCopiedCode
                      ? "bg-green-500/10 text-green-600 hover:text-green-600 hover:bg-green-500/20"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                  onClick={handleCopyCode}
                  title="Copiar código"
                >
                  {hasCopiedCode ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-border/50" />

          {/* Seções Primárias */}
          <div className="space-y-3">
            {/* Email de Recuperação */}
            <div className="space-y-3 rounded-2xl border border-muted bg-muted/20 p-4 transition-all focus-within:border-primary/50 focus-within:bg-muted/40 hover:bg-muted/30">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {labels.recoveryEmailLabel}
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  value={recoveryEmail.value}
                  onChange={(event) =>
                    recoveryEmail.onChange(event.target.value)
                  }
                  className="h-11 rounded-xl bg-background shadow-sm"
                  placeholder={labels.recoveryEmailPlaceholder}
                />
                <Button
                  className="h-11 min-w-[120px] gap-2 rounded-xl sm:w-auto font-semibold"
                  onClick={recoveryEmail.onSave}
                  disabled={recoveryEmail.isSaving}
                  variant={recoveryEmail.hasSaved ? "secondary" : "default"}
                >
                  <Save className="h-4 w-4" />
                  {recoveryEmail.isSaving
                    ? labels.loading
                    : recoveryEmail.hasSaved
                      ? labels.update
                      : labels.save}
                </Button>
              </div>
              {recoveryEmail.status && (
                <p
                  className={`text-xs font-medium ${recoveryEmail.hasSaved ? "text-green-500" : "text-muted-foreground"}`}
                >
                  {recoveryEmail.status}
                </p>
              )}
            </div>

            {/* Accordion: Alterar Senha */}
            <div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${showPasswordForm ? "border-primary/30 bg-primary/5" : "border-muted bg-background hover:bg-muted/30"}`}
            >
              <button
                onClick={onTogglePasswordForm}
                className="flex w-full items-center justify-between p-4 focus:outline-none"
              >
                <div className="flex items-center gap-3 font-semibold text-sm">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${showPasswordForm ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                  >
                    <KeyRound className="h-4 w-4" />
                  </div>
                  {labels.changePassword}
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${showPasswordForm ? "rotate-180 text-primary" : ""}`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${showPasswordForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <div className="p-4 pt-0 space-y-3">
                    <div className="h-px w-full bg-border/50 mb-4" />
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground ml-1">
                        {labels.currentPassword}
                      </Label>
                      <Input
                        type="password"
                        value={password.current}
                        onChange={(e) =>
                          password.onCurrentChange(e.target.value)
                        }
                        className="h-11 rounded-xl bg-background"
                        placeholder="***"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground ml-1">
                        {labels.newPassword}
                      </Label>
                      <Input
                        type="password"
                        value={password.newPassword}
                        onChange={(e) => password.onNewChange(e.target.value)}
                        className="h-11 rounded-xl bg-background"
                        placeholder="***"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground ml-1">
                        {labels.confirmPassword}
                      </Label>
                      <Input
                        type="password"
                        value={password.confirm}
                        onChange={(e) =>
                          password.onConfirmChange(e.target.value)
                        }
                        className="h-11 rounded-xl bg-background"
                        placeholder="***"
                      />
                    </div>
                    {password.status && (
                      <p className="text-xs font-medium text-muted-foreground pt-1">
                        {password.status}
                      </p>
                    )}
                    <Button
                      className="h-11 w-full gap-2 rounded-xl mt-4 font-bold"
                      onClick={password.onSubmit}
                      disabled={password.isSubmitting}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {password.isSubmitting
                        ? labels.updatingPassword
                        : labels.updatePassword}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion: Resgatar Avatar */}
            <div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${showClaimForm ? "border-primary/30 bg-primary/5" : "border-muted bg-background hover:bg-muted/30"}`}
            >
              <button
                onClick={onToggleClaimForm}
                className="flex w-full items-center justify-between p-4 focus:outline-none"
              >
                <div className="flex items-center gap-3 font-semibold text-sm">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${showClaimForm ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                  >
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  {labels.registerAvatar}
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${showClaimForm ? "rotate-180 text-primary" : ""}`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${showClaimForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <div className="p-4 pt-0 space-y-3">
                    <div className="h-px w-full bg-border/50 mb-4" />
                    <Label className="text-xs font-semibold text-muted-foreground ml-1">
                      {labels.claimPromptLabel}
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={claim.value}
                        onChange={(e) => claim.onChange(e.target.value)}
                        className="h-11 rounded-xl bg-background"
                        placeholder={labels.claimPromptPlaceholder}
                      />
                      <Button
                        className="h-11 gap-2 rounded-xl sm:w-auto font-semibold"
                        onClick={claim.onSubmit}
                        disabled={claim.isSubmitting}
                      >
                        <Check className="h-4 w-4" />
                        {claim.isSubmitting
                          ? labels.loading
                          : labels.claimSubmit}
                      </Button>
                    </div>
                    {claim.status && (
                      <p className="text-xs font-medium text-muted-foreground pt-1">
                        {claim.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-border/50 my-2" />

          {/* Outras Ações */}
          <div className="space-y-2">
            {canManageCodes && (
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3 rounded-xl border-muted/60 bg-background hover:bg-muted/50 font-medium text-sm"
                onClick={onManageCodes}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded bg-muted/50 text-foreground">
                  <Ticket className="h-4 w-4" />
                </div>
                {labels.manageCodes}
              </Button>
            )}

            {showAddToHome && (
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3 rounded-xl border-muted/60 bg-background hover:bg-muted/50 font-medium text-sm"
                onClick={onAddToHome}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded bg-muted/50 text-foreground">
                  <Smartphone className="h-4 w-4" />
                </div>
                {labels.addToHome}
              </Button>
            )}

            <Button
              variant="ghost"
              className="h-12 w-full justify-start gap-3 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 font-medium text-sm"
              onClick={onLogout}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10">
                <LogOut className="h-4 w-4" />
              </div>
              {labels.logout}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
