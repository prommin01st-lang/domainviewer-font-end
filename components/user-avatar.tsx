"use client";

import { AVATAR_LIST } from "@/lib/avatars";
import { AvatarSVG } from "./avatar-svg";

function getAvatarFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_LIST.length;
  return AVATAR_LIST[index];
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  bgColor?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, avatarUrl, bgColor, size = 40, className }: UserAvatarProps) {
  const avatarFile = avatarUrl || getAvatarFromName(name);

  return (
    <AvatarSVG file={avatarFile} bgColor={bgColor} size={size} className={className} />
  );
}
