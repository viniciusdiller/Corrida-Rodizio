"use client";

import { useState } from "react";
import {
  ArrowLeft,
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

  if (!open) return null;

  const handleCopyCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode);
      setHasCopiedCode(true);
      setTimeout(() => setHasCopiedCode(false), 2000);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-40 w-[calc(100%-2rem)] max-h-[85vh] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-3 overflow-y-auto rounded-2xl border border-muted/60 bg-background/95 p-4 shadow-xl backdrop-blur">
        <div className="flex items-center justify-start pb-1">
          <Button
            variant="ghost"
            onClick={onClose}
            className="-ml-2 h-auto gap-2 px-2 py-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">{labels.back}</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            {labels.premiumCreditsAvailable}
          </div>

          {invitationCode && (
            <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
              <span className="flex-1 text-center text-xs font-bold uppercase tracking-wide">
                {labels.invitationCodeLabel}: {invitationCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                onClick={handleCopyCode}
                title="Copiar código"
              >
                {hasCopiedCode ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="min-w-[140px] flex-1 gap-2"
            onClick={onTogglePasswordForm}
          >
            <KeyRound className="h-4 w-4" />
            {labels.changePassword}
          </Button>
          <Button
            variant="ghost"
            className="min-w-[120px] flex-1 gap-2"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            {labels.logout}
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onToggleClaimForm}
        >
          {showClaimForm ? (
            <ArrowLeft className="h-4 w-4" />
          ) : (
            <BadgeCheck className="h-4 w-4" />
          )}
          {showClaimForm ? labels.back : labels.registerAvatar}
        </Button>

        {canManageCodes && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onManageCodes}
          >
            <Ticket className="h-4 w-4" />
            {labels.manageCodes}
          </Button>
        )}

        {showAddToHome && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onAddToHome}
          >
            <Smartphone className="h-4 w-4" />
            {labels.addToHome}
          </Button>
        )}

        <div className="space-y-2 rounded-xl border border-muted/60 bg-background/70 p-3">
          <Label className="text-xs font-bold uppercase text-muted-foreground">
            {labels.recoveryEmailLabel}
          </Label>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              type="email"
              value={recoveryEmail.value}
              onChange={(event) => recoveryEmail.onChange(event.target.value)}
              className="h-10"
              placeholder={labels.recoveryEmailPlaceholder}
            />
            <Button
              className="h-10 gap-2 md:w-40"
              onClick={recoveryEmail.onSave}
              disabled={recoveryEmail.isSaving}
            >
              <Mail className="h-4 w-4" />
              <Save className="h-4 w-4" />
              {recoveryEmail.isSaving
                ? labels.loading
                : recoveryEmail.hasSaved
                  ? labels.update
                  : labels.save}
            </Button>
          </div>
          {recoveryEmail.status && (
            <p className="text-xs font-semibold text-muted-foreground">
              {recoveryEmail.status}
            </p>
          )}
        </div>

        {showClaimForm && (
          <div className="space-y-2 rounded-xl border border-muted/60 bg-background/70 p-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              {labels.claimPromptLabel}
            </Label>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                value={claim.value}
                onChange={(event) => claim.onChange(event.target.value)}
                className="h-10"
                placeholder={labels.claimPromptPlaceholder}
              />
              <Button
                className="h-10 gap-2 md:w-40"
                onClick={claim.onSubmit}
                disabled={claim.isSubmitting}
              >
                <Check className="h-4 w-4" />
                {claim.isSubmitting ? labels.loading : labels.claimSubmit}
              </Button>
            </div>
            {claim.status && (
              <p className="text-xs font-semibold text-muted-foreground">
                {claim.status}
              </p>
            )}
          </div>
        )}

        {showPasswordForm && (
          <div className="space-y-2 rounded-xl border border-muted/60 bg-background/70 p-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {labels.currentPassword}
              </Label>
              <Input
                type="password"
                value={password.current}
                onChange={(event) =>
                  password.onCurrentChange(event.target.value)
                }
                className="h-10"
                placeholder="***"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {labels.newPassword}
              </Label>
              <Input
                type="password"
                value={password.newPassword}
                onChange={(event) => password.onNewChange(event.target.value)}
                className="h-10"
                placeholder="***"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {labels.confirmPassword}
              </Label>
              <Input
                type="password"
                value={password.confirm}
                onChange={(event) =>
                  password.onConfirmChange(event.target.value)
                }
                className="h-10"
                placeholder="***"
              />
            </div>
            {password.status && (
              <p className="text-xs font-semibold text-muted-foreground">
                {password.status}
              </p>
            )}
            <Button
              className="h-10 w-full gap-2 rounded-xl font-bold"
              onClick={password.onSubmit}
              disabled={password.isSubmitting}
            >
              <ShieldCheck className="h-4 w-4" />
              {password.isSubmitting
                ? labels.updatingPassword
                : labels.updatePassword}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
