export const getParticipantStorageKey = (roomCode: string) =>
  `rodizio-race:participant:${roomCode.toUpperCase()}`
