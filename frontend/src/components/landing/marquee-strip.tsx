import Image from "next/image";
import { ALL_STICKERS } from "./data";

export function MarqueeStrip() {
  return (
    <section
      aria-hidden
      className="relative overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-bg-sunk)] py-6"
    >
      <div className="marquee-track gap-6 px-6">
        {[...ALL_STICKERS, ...ALL_STICKERS].map((s, i) => (
          <div
            key={i}
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--color-bg-elev)] ring-1 ring-[var(--color-border)] shadow-sm md:h-20 md:w-20"
          >
            <Image
              src={s.src}
              alt=""
              width={96}
              height={96}
              className="h-full w-full object-contain p-1.5"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
