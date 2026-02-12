const PARTICIPANT_STORAGE_PREFIX = "rodizio-race:participant";

const normalizeStorageSegment = (value: string | null | undefined) =>
  value?.trim().toUpperCase() || "GUEST";

export const getParticipantStorageKey = (
  roomCode: string,
  loginCode?: string | null,
) =>
  `${PARTICIPANT_STORAGE_PREFIX}:${roomCode.toUpperCase()}:${normalizeStorageSegment(
    loginCode,
  )}`;

export const getLegacyParticipantStorageKey = (roomCode: string) =>
  `${PARTICIPANT_STORAGE_PREFIX}:${roomCode.toUpperCase()}`;
