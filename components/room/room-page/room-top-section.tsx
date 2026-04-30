import { Settings, UserPlus } from "lucide-react";
import { RoomHeader } from "@/components/room/room-header";
import { RoomInfo } from "@/components/room/room-info";
import type { Race, Participant } from "@/types/database";

type RoomTopSectionProps = {
  race: Race;
  participants: Participant[];
  totalItemsEaten: number;
  roomCode: string;
  copied: boolean;
  loggedUsername: string | null;
  t: any;
  onExit: () => void;
  onCopyCode: () => void;
  onOpenQrPage: () => void;
  onToggleAccountOverlay: () => void;
  onOpenConnectOverlay: () => void;
  formatAccountLabel: (value: string) => string;
};

export function RoomTopSection({
  race,
  participants,
  totalItemsEaten,
  roomCode,
  copied,
  loggedUsername,
  t,
  onExit,
  onCopyCode,
  onOpenQrPage,
  onToggleAccountOverlay,
  onOpenConnectOverlay,
  formatAccountLabel,
}: RoomTopSectionProps) {
  return (
    <>
      <RoomHeader
        onExit={onExit}
        onOpenAccountMenu={
          loggedUsername ? onToggleAccountOverlay : undefined
        }
        accountPill={
          loggedUsername ? (
            <button
              type="button"
              onClick={onToggleAccountOverlay}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/90 px-3 text-xs font-bold text-foreground shadow-sm backdrop-blur transition hover:bg-accent/30 whitespace-nowrap"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              {formatAccountLabel(loggedUsername)}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenConnectOverlay}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/90 px-3 text-xs font-bold text-foreground shadow-sm backdrop-blur transition hover:bg-accent/30"
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              {t.account.connect_pill}
            </button>
          )
        }
      />

      <RoomInfo
        race={race}
        participantsCount={participants.length}
        totalItems={totalItemsEaten}
        roomCode={roomCode}
        copied={copied}
        onCopyCode={onCopyCode}
        onOpenQrCode={onOpenQrPage}
      />
    </>
  );
}
