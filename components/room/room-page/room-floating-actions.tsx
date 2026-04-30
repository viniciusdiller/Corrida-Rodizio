import type { ChangeEvent, CSSProperties, MouseEvent, RefObject } from "react";
import { Camera, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Participant } from "@/types/database";

type RoomFloatingActionsProps = {
  currentParticipant: Participant | undefined;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isAddCooldownActive: boolean;
  isUploadingPhoto: boolean;
  isPhotoRequired: boolean;
  addCooldownMs: number;
  t: any;
  onExit: () => void;
  onPhotoSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhotoIncrement: (
    participantId: string,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
  onUpdateCount: (
    participantId: string,
    change: number,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
};

export function RoomFloatingActions({
  currentParticipant,
  fileInputRef,
  isAddCooldownActive,
  isUploadingPhoto,
  isPhotoRequired,
  addCooldownMs,
  t,
  onExit,
  onPhotoSelected,
  onPhotoIncrement,
  onUpdateCount,
}: RoomFloatingActionsProps) {
  return (
    <div className="sticky bottom-4 sm:bottom-6 z-40 mt-10 flex w-full items-end justify-between pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-auto">
        <Button
          variant="outline"
          onClick={onExit}
          className="rounded-xl font-semibold gap-2 shadow-sm bg-background/90 backdrop-blur"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.common.exit}
        </Button>
      </div>

      {currentParticipant && (
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPhotoSelected}
          />
          <Button
            size="icon"
            className={`relative h-14 w-14 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/90 via-primary to-primary/70 text-white shadow-[0_16px_35px_rgba(0,0,0,0.22)] backdrop-blur transition-all duration-200 hover:scale-105 active:scale-95 ${
              isAddCooldownActive || isUploadingPhoto
                ? "opacity-50 grayscale"
                : ""
            }`}
            onClick={(event) =>
              isPhotoRequired
                ? onPhotoIncrement(currentParticipant.id, event)
                : onUpdateCount(currentParticipant.id, 1, event)
            }
            disabled={isUploadingPhoto}
          >
            {isAddCooldownActive && (
              <span
                className="pointer-events-none absolute inset-0 bg-white/20 cooldown-fill"
                style={
                  {
                    "--cooldown-duration": `${addCooldownMs}ms`,
                  } as CSSProperties
                }
              />
            )}
            {isPhotoRequired ? (
              <div className="relative z-10 flex flex-col items-center leading-none">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-black">+1</span>
              </div>
            ) : (
              <span className="relative z-10 text-lg font-black leading-none">
                +1
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
