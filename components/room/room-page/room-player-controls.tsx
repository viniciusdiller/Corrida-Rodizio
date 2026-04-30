import type { MouseEvent } from "react";
import { PersonalProgress } from "@/components/room/personal-progress";
import { TeamSelection } from "@/components/room/team-selection";
import type { Participant, Race } from "@/types/database";

type RoomPlayerControlsProps = {
  race: Race;
  currentParticipant: Participant | undefined;
  loggedUsername: string | null;
  isUpdatingAvatar: boolean;
  isUpdatingName: boolean;
  isAddCooldownActive: boolean;
  isUploadingPhoto: boolean;
  isPhotoModeEnabled: boolean;
  isPhotoRequired: boolean;
  isPremiumPlayer: boolean;
  addCooldownMs: number;
  nameStatus: string | null;
  photoSendStatus: "success" | "error" | null;
  unlockedPremiumAvatars: string[];
  exclusiveAvatars: string[];
  getItemLabel: (count: number) => string;
  onUpdateTeam: (teamId: string) => void;
  onUpdateCount: (
    participantId: string,
    change: number,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
  onUpdateAvatar: (avatar: string) => void;
  onUpdateName: (nextName: string) => void;
  onPhotoIncrement: (
    participantId: string,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
};

export function RoomPlayerControls({
  race,
  currentParticipant,
  loggedUsername,
  isUpdatingAvatar,
  isUpdatingName,
  isAddCooldownActive,
  isUploadingPhoto,
  isPhotoModeEnabled,
  isPhotoRequired,
  isPremiumPlayer,
  addCooldownMs,
  nameStatus,
  photoSendStatus,
  unlockedPremiumAvatars,
  exclusiveAvatars,
  getItemLabel,
  onUpdateTeam,
  onUpdateCount,
  onUpdateAvatar,
  onUpdateName,
  onPhotoIncrement,
}: RoomPlayerControlsProps) {
  return (
    <>
      {race.is_team_mode && currentParticipant && !currentParticipant.team && (
        <TeamSelection
          onUpdateTeam={onUpdateTeam}
          isUpdating={isUpdatingAvatar}
        />
      )}

      {currentParticipant && (
        <PersonalProgress
          participant={currentParticipant}
          getItemLabel={getItemLabel}
          onUpdateCount={onUpdateCount}
          onUpdateAvatar={onUpdateAvatar}
          onUpdateName={onUpdateName}
          nameStatus={nameStatus}
          isUpdatingName={isUpdatingName}
          isUpdatingAvatar={isUpdatingAvatar}
          isAddCooldown={isAddCooldownActive}
          isUploadingPhoto={isUploadingPhoto}
          photoSendStatus={photoSendStatus}
          photoModeEnabled={isPhotoModeEnabled}
          photoRequired={isPhotoRequired}
          addCooldownMs={addCooldownMs}
          onPhotoIncrement={onPhotoIncrement}
          isLoggedIn={!!loggedUsername}
          isPremium={isPremiumPlayer}
          unlockedPremiumAvatars={unlockedPremiumAvatars}
          exclusiveAvatars={exclusiveAvatars}
        />
      )}
    </>
  );
}
