export const AVATAR_OPTIONS: string[] = [];

export const DEFAULT_AVATAR: string | null = null;

const IMAGE_AVATAR_PATTERN = /\.(png|jpe?g|webp|gif)$/i;
const PREMIUM_AVATAR_PATTERN = /^avatar-premium/i;
const EXCLUSIVE_AVATAR_PATTERN = /^avatar-exclusive/i;

export const isVehicleAvatar = (_avatar?: string | null) => false;

export const isImageAvatar = (avatar?: string | null) =>
  !!avatar && IMAGE_AVATAR_PATTERN.test(avatar);

export const isPremiumAvatar = (avatar?: string | null) =>
  !!avatar && PREMIUM_AVATAR_PATTERN.test(avatar);

export const isExclusiveAvatar = (avatar?: string | null) =>
  !!avatar && EXCLUSIVE_AVATAR_PATTERN.test(avatar);

export const getAvatarUrl = (avatar: string) => `/avatars/${avatar}`;
