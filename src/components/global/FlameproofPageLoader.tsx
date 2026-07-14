import Image from "next/image";
import { Bebas_Neue, Space_Mono } from "next/font/google";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });

type FlameproofPageLoaderProps = {
  label?: string;
};

export function FlameproofPageLoader({
  label = "Loading flameproof systems...",
}: FlameproofPageLoaderProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={label}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#04121b]"
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] [background-size:72px_72px]" />

      {/* Radial orange glow from center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_50%,rgba(228,100,20,0.11),transparent_70%)]" />

      {/* Horizontal sweep line */}
      <div className="fp-sweep-y pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#E46414]/50 to-transparent" />

      {/* Corner targeting brackets */}
      <div className="absolute left-5 top-5 h-10 w-10 border-l-2 border-t-2 border-[#E46414]/50 sm:left-9 sm:top-9 sm:h-14 sm:w-14" />
      <div className="absolute right-5 top-5 h-10 w-10 border-r-2 border-t-2 border-[#E46414]/50 sm:right-9 sm:top-9 sm:h-14 sm:w-14" />
      <div className="absolute bottom-5 left-5 h-10 w-10 border-b-2 border-l-2 border-[#E46414]/50 sm:bottom-9 sm:left-9 sm:h-14 sm:w-14" />
      <div className="absolute bottom-5 right-5 h-10 w-10 border-b-2 border-r-2 border-[#E46414]/50 sm:bottom-9 sm:right-9 sm:h-14 sm:w-14" />

      {/* Rotating SVG rings */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 w-[min(520px,88vw)] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 520 520"
        fill="none"
        aria-hidden="true"
      >
        {/* Outermost ring — counter-clockwise, very slow */}
        <circle
          cx="260" cy="260" r="248"
          stroke="#E46414" strokeWidth="0.8" strokeOpacity="0.18"
          strokeDasharray="6 20"
          className="fp-ring-ccw"
        />
        {/* Middle ring — clockwise, medium */}
        <circle
          cx="260" cy="260" r="194"
          stroke="#E46414" strokeWidth="1" strokeOpacity="0.3"
          strokeDasharray="4 13"
          className="fp-ring-cw-med"
        />
        {/* Inner ring — clockwise, fast */}
        <circle
          cx="260" cy="260" r="146"
          stroke="#F17D1E" strokeWidth="1.5" strokeOpacity="0.42"
          strokeDasharray="20 7"
          className="fp-ring-cw-fast"
        />
        {/* Static detail rings */}
        <circle cx="260" cy="260" r="106" stroke="white" strokeWidth="0.7" strokeOpacity="0.07" />
        <circle cx="260" cy="260" r="74"  stroke="white" strokeWidth="0.7" strokeOpacity="0.11" />
      </svg>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center text-center">

        {/* Logo with pulsing glow */}
        <div className="relative mb-9">
          <div className="fp-pulse-glow absolute -inset-10 rounded-full bg-[#E46414]/10 blur-2xl" />
          <div className="fp-pulse-glow absolute -inset-5 rounded-full bg-[#E46414]/07 blur-xl [animation-delay:0.7s]" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#E46414]/38 bg-[#061d2b] shadow-[0_0_0_1px_rgba(228,100,20,0.1),0_0_55px_rgba(228,100,20,0.3),inset_0_0_28px_rgba(0,0,0,0.55)]">
            <Image
              src="/asset/shortLogo.png"
              alt=""
              width={56}
              height={56}
              priority
              className="h-14 w-14 object-contain"
            />
          </div>
        </div>

        {/* EXEC display wordmark */}
        <div className={`${bebas.className} text-5xl leading-none tracking-widest text-white sm:text-6xl`}>
          EXEC
        </div>

        {/* Tagline */}
        <div className={`${spaceMono.className} mt-2.5 text-[9px] uppercase tracking-[0.32em] text-[#F17D1E] sm:text-[10px]`}>
          Explosion Proof · Electrical Control
        </div>

        {/* Divider with diamond */}
        <div className="my-7 flex w-52 items-center gap-3 sm:my-8 sm:w-64">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
          <div className="h-1.5 w-1.5 rotate-45 border border-[#E46414]/70 bg-[#E46414]/30" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
        </div>

        {/* Progress bar */}
        <div className="h-[2px] w-52 overflow-hidden bg-white/8 sm:w-64">
          <div className="fp-bar h-full w-1/2 bg-gradient-to-r from-transparent via-[#E46414] to-transparent" />
        </div>

        {/* Label */}
        <div className={`${spaceMono.className} mt-5 text-[9px] uppercase tracking-[0.22em] text-white/35`}>
          {label}
        </div>

        {/* Animated dots */}
        <div className="mt-3.5 flex items-center gap-2">
          <span className="fp-dot block h-1 w-1 rounded-full bg-[#E46414]" />
          <span className="fp-dot block h-1 w-1 rounded-full bg-[#E46414] [animation-delay:0.25s]" />
          <span className="fp-dot block h-1 w-1 rounded-full bg-[#E46414] [animation-delay:0.5s]" />
        </div>
      </div>

      {/* Bottom certification line */}
      <div className={`${spaceMono.className} absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] uppercase tracking-[0.2em] text-white/20 sm:bottom-9 sm:text-[9px]`}>
        Ex d IIA · IIB · IIC &nbsp;/&nbsp; IP-66 &nbsp;/&nbsp; CIMFR &amp; PESO · Est. 1996
      </div>
    </section>
  );
}
