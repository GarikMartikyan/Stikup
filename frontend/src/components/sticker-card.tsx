import Image from "next/image";
import { Lock } from "lucide-react";

type StickerCardProps = {
  src: string;
  alt: string;
  locked?: boolean;
  rotate?: number; // deg
  delay?: number; // ms
  size?: number; // px (used by Image for sizing hint)
  className?: string;
  popIn?: boolean;
  floating?: boolean;
};

export function StickerCard({
  src,
  alt,
  locked = false,
  rotate = 0,
  delay = 0,
  size = 256,
  className = "",
  popIn = false,
  floating = false,
}: StickerCardProps) {
  const animations: string[] = [];
  if (popIn)
    animations.push(`pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`);
  if (floating)
    animations.push(`float-soft 6s ease-in-out ${0.2 + delay / 1000}s infinite`);

  return (
    <div
      className={`group relative aspect-square select-none ${className}`}
      style={
        {
          "--r": `${rotate}deg`,
          animation: animations.length ? animations.join(", ") : undefined,
        } as React.CSSProperties
      }
    >
      <div
        className={`relative h-full w-full rounded-[18%] bg-[var(--color-bg-elev)] ring-1 ring-[var(--color-border)] shadow-[var(--shadow-sticker)] transition-transform duration-300 ${
          locked ? "" : "group-hover:-translate-y-1 group-hover:scale-[1.04]"
        }`}
      >
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-contain p-2"
          draggable={false}
        />

        {locked && (
          <div className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] shadow-md ring-2 ring-[var(--color-bg-elev)]">
            <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
}
