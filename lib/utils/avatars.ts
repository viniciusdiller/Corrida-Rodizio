export const avatarOptions = ["🍕", "🍣", "🍔", "🌮", "🥟", "🍜", "🍩", "🧁"];

export const defaultAvatar = avatarOptions[0];

export const getAvatar = (avatar?: string | null) => avatar ?? defaultAvatar;
