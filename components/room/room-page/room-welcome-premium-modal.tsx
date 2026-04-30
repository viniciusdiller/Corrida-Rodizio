import { Button } from "@/components/ui/button";

type RoomWelcomePremiumModalProps = {
  open: boolean;
  isLoading: boolean;
  isClaiming: boolean;
  options: string[];
  error: string | null;
  pendingAvatar: string | null;
  premiumClaimedCount: number;
  premiumClaimCredits: number;
  t: any;
  tx: (key: any) => string;
  onSelect: (avatar: string) => void;
  onChooseLater: () => void;
  onCancelConfirm: () => void;
  onClaim: (avatar: string) => void;
};

export function RoomWelcomePremiumModal({
  open,
  isLoading,
  isClaiming,
  options,
  error,
  pendingAvatar,
  premiumClaimedCount,
  premiumClaimCredits,
  t,
  tx,
  onSelect,
  onChooseLater,
  onCancelConfirm,
  onClaim,
}: RoomWelcomePremiumModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 p-4">
      <div className="mx-auto flex h-full w-full max-w-2xl items-center justify-center">
        <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-muted/60 bg-background/95 shadow-2xl">
          <div className="space-y-1 border-b border-muted/50 bg-background/95 p-5">
            <h2 className="text-xl font-black">
              {tx("welcome_premium_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tx("welcome_premium_claimed_prefix")}: {premiumClaimedCount}/
              {premiumClaimCredits}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                {t.common.loading}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {options.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className="rounded-xl border border-muted/60 bg-card/70 p-2 transition hover:border-primary"
                    onClick={() => onSelect(avatar)}
                    disabled={isClaiming}
                  >
                    <img
                      src={`/avatars/${avatar}`}
                      alt={avatar}
                      className="mx-auto h-16 w-16 object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          </div>

          <div className="border-t border-muted/50 p-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onChooseLater}
              disabled={isClaiming}
            >
              {tx("welcome_premium_choose_later")}
            </Button>
          </div>

          {pendingAvatar && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 p-4">
              <div className="w-full max-w-sm rounded-xl border border-muted/60 bg-background p-4 shadow-2xl">
                <h3 className="text-sm font-black uppercase tracking-wide">
                  {tx("welcome_premium_confirm_title")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tx("welcome_premium_confirm_message")}
                </p>
                <div className="mt-3 flex justify-center">
                  <img
                    src={`/avatars/${pendingAvatar}`}
                    alt=""
                    className="h-24 w-24 rounded-lg border border-muted/60 bg-card/70 p-2 object-contain"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancelConfirm}
                    disabled={isClaiming}
                  >
                    {tx("welcome_premium_confirm_cancel")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onClaim(pendingAvatar)}
                    disabled={isClaiming}
                  >
                    {tx("welcome_premium_confirm_unlock")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
