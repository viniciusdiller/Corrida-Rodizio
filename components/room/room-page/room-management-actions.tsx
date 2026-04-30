import { CircleX, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Participant } from "@/types/database";

type RoomManagementActionsProps = {
  currentParticipant: Participant | undefined;
  currentParticipantId: string | null;
  participants: Participant[];
  showManageMenu: boolean;
  isEnding: boolean;
  t: any;
  onToggleManageMenu: () => void;
  onCloseManageMenu: () => void;
  onEndRace: () => void;
  onRemoveTarget: (participant: Participant) => void;
};

export function RoomManagementActions({
  currentParticipant,
  currentParticipantId,
  participants,
  showManageMenu,
  isEnding,
  t,
  onToggleManageMenu,
  onCloseManageMenu,
  onEndRace,
  onRemoveTarget,
}: RoomManagementActionsProps) {
  if (!currentParticipant?.is_vip) {
    return (
      <div className="flex justify-center">
        <p className="text-xs font-semibold text-primary/80">
          {t.room.vip_only_end}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="relative flex w-full gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-xl font-bold shadow-lg cursor-pointer transition-all hover:scale-105"
          onClick={onToggleManageMenu}
        >
          {t.room.manage_players ?? "Gerenciar jogadores"}
          <Menu className="ml-2 h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          className="flex-1 rounded-xl font-bold shadow-lg shadow-destructive/20 cursor-pointer transition-all hover:scale-105"
          onClick={onEndRace}
          disabled={isEnding}
        >
          {isEnding ? t.room.ending : t.room.end_race}
          <CircleX className="ml-2 h-4 w-4" />
        </Button>
        {showManageMenu && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30"
              onClick={onCloseManageMenu}
              aria-label="Close"
            />
            <div className="absolute left-0 right-0 top-full z-40 mt-2 w-full rounded-2xl border border-muted/60 bg-background/95 p-3 shadow-xl">
              <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t.common.players ?? "Jogadores"}
              </p>
              <div className="max-h-64 overflow-auto space-y-1">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1 text-xs"
                  >
                    <span className="font-semibold truncate">{p.name}</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-[10px] font-black uppercase"
                      onClick={() => {
                        onCloseManageMenu();
                        onRemoveTarget(p);
                      }}
                      disabled={p.id === currentParticipantId}
                    >
                      {t.room.remove_player ?? "Remover"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
