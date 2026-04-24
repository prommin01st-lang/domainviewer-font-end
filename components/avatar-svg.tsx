"use client";

import { useEffect, useState } from "react";

interface AvatarSVGProps {
  file: string;
  bgColor?: string | null;
  size?: number;
  className?: string;
}

export function AvatarSVG({ file, bgColor, size = 40, className }: AvatarSVGProps) {
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/avatars/${file}`, { signal: controller.signal })
      .then((res) => res.text())
      .then((text) => {
        if (bgColor) {
          text = text.replace(
            /class="avatar-bg"/g,
            `class="avatar-bg" style="fill: ${bgColor}"`
          );
        }
        setSvgContent(text);
      })
      .catch(() => {
        // Ignore abort errors and network failures silently
      });
    return () => controller.abort();
  }, [file, bgColor]);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden ${className || ""}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
