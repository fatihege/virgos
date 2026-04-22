import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { flowerConfigs, getFlowerStyle, renderFlower } from "./flowers";

gsap.registerPlugin(useGSAP);

type Phase = "intro" | "idle" | "collapsing" | "warping" | "bouquet";

type BurstParticle = {
  id: string;
  dx: number;
  dy: number;
  size: number;
  spin: number;
  duration: number;
  color: string;
};

type BouquetGlint = {
  id: string;
  left: number;
  top: number;
  size: number;
  rotate: number;
};

const warpSliceCount = 11;
const bouquetBaseTop = {
  back: 36,
  mid: 44,
  front: 50,
} as const;
const bouquetLayerZ = {
  back: 54,
  mid: 68,
  front: 82,
} as const;

function buildPollen() {
  return Array.from({ length: 18 }, (_, index) => ({
    id: `pollen-${index}`,
    left: 4 + ((index * 13) % 92),
    top: 6 + ((index * 17) % 88),
    size: 0.18 + ((index % 4) * 0.09),
    duration: 12 + (index % 5) * 2.4,
    delay: (index % 6) * -1.3,
  }));
}

function buildSlices() {
  return Array.from({ length: warpSliceCount }, (_, index) => ({
    id: `slice-${index}`,
    left: index * (100 / warpSliceCount),
    width: 11 + (index % 3) * 2,
    rotate: (index % 2 === 0 ? -1 : 1) * (4 + index),
    clip: [
      `polygon(${3 + (index % 3) * 3}% 0%, 100% 0%, ${95 - index}% 100%, 0% 100%)`,
      `polygon(0% 0%, ${94 - index}% 0%, 100% 100%, ${6 + (index % 2) * 5}% 100%)`,
      `polygon(${index % 2 === 0 ? 0 : 7}% 0%, 100% 0%, ${86 - index}% 100%, 0% 100%)`,
    ][index % 3],
  }));
}

function buildBurstParticles(): BurstParticle[] {
  const colors = ["#ffd362", "#ffb16a", "#ff8a7c", "#fff0b4", "#f9cce6"];

  return Array.from({ length: 22 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 22 + (index % 2 === 0 ? -0.08 : 0.08);
    const distance = 70 + (index % 5) * 18;
    return {
      id: `burst-${index}`,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 10 + (index % 4) * 3,
      spin: (index % 2 === 0 ? -1 : 1) * (55 + index * 7),
      duration: 0.38 + (index % 3) * 0.05,
      color: colors[index % colors.length],
    };
  });
}

function buildBouquetGlints(): BouquetGlint[] {
  return [
    { id: "glint-1", left: 28, top: 20, size: 18, rotate: -12 },
    { id: "glint-2", left: 66, top: 15, size: 14, rotate: 9 },
    { id: "glint-3", left: 21, top: 44, size: 12, rotate: -6 },
    { id: "glint-4", left: 73, top: 40, size: 16, rotate: 11 },
    { id: "glint-5", left: 49, top: 10, size: 11, rotate: 0 },
  ];
}

function Flower({
  flower,
  mode,
}: {
  flower: (typeof flowerConfigs)[number];
  mode: "opening" | "bouquet";
}) {
  const centerContent = flower.isCenterMessage && mode === "bouquet" ? "you" : undefined;
  const openingWidth = `clamp(74px, ${flower.size * 0.84}vw, 188px)`;
  const bouquetScale = flower.bouquetScale ?? 1;
  const bouquetWidth = flower.isCenterMessage
    ? `clamp(104px, ${flower.size * bouquetScale}vw, 248px)`
    : `clamp(86px, ${flower.size * bouquetScale * 0.94}vw, 228px)`;
  const bouquetTop = `${bouquetBaseTop[flower.bouquetLayer] + flower.bouquetTargetY}%`;
  const bouquetZ = flower.isCenterMessage
    ? 96
    : bouquetLayerZ[flower.bouquetLayer] + Math.round(flower.depth * 12);

  return (
    <div
      className={`flower flower--${mode} flower--layer-${flower.bouquetLayer}${
        flower.isCenterMessage ? " flower--message" : ""
      }`}
      data-flower-id={flower.id}
      data-rotation={flower.startRotation}
      data-bouquet-rotation={flower.bouquetRotation}
      data-layer={flower.bouquetLayer}
      style={
        mode === "opening"
          ? ({
              ...getFlowerStyle(flower),
              width: openingWidth,
            } as CSSProperties)
          : ({
              left: `${50 + flower.bouquetTargetX}%`,
              top: bouquetTop,
              width: bouquetWidth,
              zIndex: bouquetZ,
            } as CSSProperties)
      }
    >
      <div className="flower__head">{renderFlower(flower.variant, flower.palette)}</div>
      {centerContent ? <span className="flower__label">{centerContent}</span> : null}
      {mode === "bouquet" ? <span className="flower__stem" /> : null}
    </div>
  );
}

function BouquetWrap() {
  return (
    <div className="bouquet-wrap" aria-hidden="true">
      <div className="bouquet-wrap__glow" data-wrap-piece />
      <svg
        className="bouquet-wrap-svg"
        viewBox="0 0 260 330"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="wrapPaper" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e3cba5" />
            <stop offset="28%" stopColor="#f8ecd8" />
            <stop offset="56%" stopColor="#fffcf1" />
            <stop offset="100%" stopColor="#dec29a" />
          </linearGradient>
          <linearGradient id="wrapEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(177,136,86,0.2)" />
          </linearGradient>
          <linearGradient id="innerTissue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffef8" />
            <stop offset="100%" stopColor="#f4ead4" />
          </linearGradient>
          <linearGradient id="ribbonPink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5bfd0" />
            <stop offset="100%" stopColor="#cc5b7b" />
          </linearGradient>
          <linearGradient id="ribbonTail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dd6b8d" />
            <stop offset="100%" stopColor="#be4566" />
          </linearGradient>
        </defs>

        <g data-wrap-piece className="bouquet-wrap__paper-group">
          <path
            className="bouquet-wrap__sheet bouquet-wrap__sheet--left"
            d="M28 64 Q58 40 132 62 L95 288 L34 238 Z"
            fill="#e7d2ad"
          />
          <path
            className="bouquet-wrap__sheet bouquet-wrap__sheet--right"
            d="M132 62 Q204 38 232 64 L176 238 L139 288 Z"
            fill="#dec29a"
          />
          <path
            className="bouquet-wrap__sheet bouquet-wrap__sheet--front"
            d="M56 62 Q130 44 204 62 L160 282 Q130 316 98 282 Z"
            fill="url(#wrapPaper)"
          />
          <path
            className="bouquet-wrap__sheet bouquet-wrap__sheet--inner"
            d="M82 76 Q130 58 178 76 L160 258 Q130 274 102 258 Z"
            fill="url(#innerTissue)"
            opacity="0.92"
          />
          <path
            d="M56 62 Q130 44 204 62"
            stroke="#b89163"
            strokeWidth="2"
            fill="none"
            opacity="0.45"
          />
          <path
            d="M56 62 Q130 56 204 62"
            stroke="url(#wrapEdge)"
            strokeWidth="20"
            fill="none"
            opacity="0.15"
          />
          <path d="M130 62 L130 284" stroke="#d6bc8f" strokeWidth="1" opacity="0.36" />
          <path d="M92 74 L108 272" stroke="#d9c39c" strokeWidth="0.8" opacity="0.18" />
          <path d="M168 74 L152 272" stroke="#d9c39c" strokeWidth="0.8" opacity="0.18" />
        </g>

        <g data-wrap-piece className="bouquet-ribbon">
          <ellipse cx="92" cy="214" rx="28" ry="14" fill="url(#ribbonPink)" transform="rotate(-24 92 214)" />
          <ellipse cx="168" cy="214" rx="28" ry="14" fill="url(#ribbonPink)" transform="rotate(24 168 214)" />
          <ellipse cx="130" cy="220" rx="14" ry="12" fill="#cc5b7b" />
          <ellipse cx="130" cy="218" rx="7.5" ry="6.5" fill="#f5a1ba" opacity="0.55" />
          <path d="M120 226 L111 310 L120 313 L126 228 Z" fill="url(#ribbonTail)" />
          <path d="M136 228 L143 313 L152 310 L142 226 Z" fill="url(#ribbonTail)" />
        </g>
      </svg>
      <div className="bouquet-wrap__shadow" data-wrap-piece />
    </div>
  );
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const bouquetRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLButtonElement>(null);
  const seamFlashRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [isInteractive, setIsInteractive] = useState(false);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const pollen = useMemo(() => buildPollen(), []);
  const slices = useMemo(() => buildSlices(), []);
  const burstParticles = useMemo(() => buildBurstParticles(), []);
  const bouquetGlints = useMemo(() => buildBouquetGlints(), []);

  useEffect(() => {
    if (reducedMotion || phase !== "idle") {
      setPointerOffset({ x: 0, y: 0 });
      return undefined;
    }

    const handleMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 18;
      const y = (event.clientY / window.innerHeight - 0.5) * 14;
      setPointerOffset({ x, y });
    };

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [phase, reducedMotion]);

  useGSAP(
    () => {
      const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
      const bouquetBackFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="back"]');
      const bouquetMidFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="mid"]');
      const bouquetFrontFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="front"]');
      const bouquetStems = gsap.utils.toArray<HTMLElement>(".flower--bouquet .flower__stem");
      const slicesEls = gsap.utils.toArray<HTMLElement>(".warp-slice");
      const impactRings = gsap.utils.toArray<HTMLElement>(".impact-ring");
      const burstParticlesEls = gsap.utils.toArray<HTMLElement>(".burst-particle");
      const wrapPieces = gsap.utils.toArray<HTMLElement>("[data-wrap-piece]");
      const haloEls = gsap.utils.toArray<HTMLElement>(".bouquet-halo, .bouquet-mist");
      const glintEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");

      gsap.set(openingFlowers, {
        opacity: 0,
        scale: 0.34,
        yPercent: 18,
        rotate: (_index, target) => Number(target.dataset.rotation ?? 0) - 12,
      });

      gsap.set(bouquetRef.current, {
        opacity: 0,
        scale: 0.84,
        yPercent: 8,
        filter: "blur(16px)",
      });
      gsap.set(bouquetBackFlowers, { opacity: 0, scale: 0.8, yPercent: 18, xPercent: -6 });
      gsap.set(bouquetMidFlowers, { opacity: 0, scale: 0.84, yPercent: 14, xPercent: 4 });
      gsap.set(bouquetFrontFlowers, { opacity: 0, scale: 0.88, yPercent: 18, xPercent: -3 });
      gsap.set(bouquetStems, { scaleY: 0, opacity: 0, transformOrigin: "50% 0%" });
      gsap.set(wrapPieces, { opacity: 0, yPercent: 18, scaleY: 0.92, transformOrigin: "50% 100%" });
      gsap.set(slicesEls, { opacity: 0, scaleY: 0, yPercent: -12, transformOrigin: "50% 0%" });
      gsap.set(centerGlowRef.current, { opacity: 0, scale: 0.2 });
      gsap.set(impactRings, { opacity: 0, scale: 0.45 });
      gsap.set(burstParticlesEls, { opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 });
      gsap.set(haloEls, { opacity: 0, scale: 0.62 });
      gsap.set(glintEls, { opacity: 0, scale: 0.3 });
      gsap.set(seamFlashRef.current, { opacity: 0, scaleY: 0, transformOrigin: "50% 50%" });
      gsap.set(cueRef.current, { opacity: 0, y: 28 });

      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          setPhase("idle");
          setIsInteractive(true);
        },
      });

      intro
        .to(
          openingFlowers,
          {
            opacity: 1,
            scale: 1,
            yPercent: 0,
            rotate: (_index, target) => Number(target.dataset.rotation ?? 0),
            duration: 0.9,
            stagger: 0.045,
            ease: "back.out(1.45)",
          },
          0,
        )
        .to(
          cueRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          0.95,
        );

      openingFlowers.forEach((flower, index) => {
        const depth = Number(flower.style.getPropertyValue("--depth") || 1);
        gsap.to(flower, {
          yPercent: `+=${(index % 2 === 0 ? 1 : -1) * (2 + depth * 2.2)}`,
          xPercent: `+=${(index % 2 === 0 ? -1 : 1) * (0.8 + depth * 1.4)}`,
          rotate: `+=${index % 2 === 0 ? -2 : 2}`,
          duration: 4 + (1 - depth) * 2.2 + index * 0.1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.1 + index * 0.06,
        });
      });
    },
    { scope: root },
  );

  useEffect(() => {
    if (phase !== "idle" || reducedMotion) {
      return;
    }

    const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
    openingFlowers.forEach((flower) => {
      const depth = Number(flower.style.getPropertyValue("--depth") || 1);
      gsap.to(flower, {
        x: pointerOffset.x * depth * 0.9,
        y: pointerOffset.y * depth * 0.75,
        duration: 0.9,
        ease: "power2.out",
      });
    });
  }, [phase, pointerOffset, reducedMotion]);

  useEffect(() => {
    if (phase !== "bouquet" || reducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
      const bouquetGlintsEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");

      bouquetFlowers.forEach((flower, index) => {
        const layer = flower.dataset.layer ?? "mid";
        const amplitude = layer === "back" ? 1.2 : layer === "mid" ? 1.7 : 2.1;

        gsap.to(flower, {
          yPercent: `+=${index % 2 === 0 ? -amplitude : amplitude}`,
          rotate: `+=${index % 2 === 0 ? -(amplitude * 0.8) : amplitude * 0.8}`,
          duration: 3.8 + index * 0.18,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      gsap.to(".bouquet-halo", {
        scale: 1.04,
        opacity: 0.86,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".bouquet-mist", {
        scale: 1.08,
        opacity: 0.58,
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".bouquet-wrap", {
        yPercent: -1.2,
        duration: 4.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      bouquetGlintsEls.forEach((glint, index) => {
        gsap.to(glint, {
          opacity: 0.85,
          scale: 1,
          duration: 0.4,
          repeat: -1,
          repeatDelay: 2.1 + index * 0.28,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.34,
        });
      });
    }, root);

    return () => ctx.revert();
  }, [phase, reducedMotion]);

  const triggerSequence = () => {
    if (!isInteractive) {
      return;
    }

    const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
    const bouquetBackFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="back"]');
    const bouquetMidFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="mid"]');
    const bouquetFrontFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="front"]');
    const bouquetStems = gsap.utils.toArray<HTMLElement>(".flower--bouquet .flower__stem");
    const slicesEls = gsap.utils.toArray<HTMLElement>(".warp-slice");
    const wrapPieces = gsap.utils.toArray<HTMLElement>("[data-wrap-piece]");
    const burstParticlesEls = gsap.utils.toArray<HTMLElement>(".burst-particle");
    const impactRings = gsap.utils.toArray<HTMLElement>(".impact-ring");
    const haloEls = gsap.utils.toArray<HTMLElement>(".bouquet-halo, .bouquet-mist");
    const glintEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");

    setIsInteractive(false);
    setPhase("collapsing");

    gsap.killTweensOf(openingFlowers);

    if (reducedMotion) {
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          onComplete: () => setPhase("bouquet"),
        })
        .to(cueRef.current, { opacity: 0, y: 18, duration: 0.2 }, 0)
        .to(".flower--opening", { opacity: 0, duration: 0.3, stagger: 0.03 }, 0)
        .to(bouquetRef.current, { opacity: 1, scale: 1, yPercent: 0, filter: "blur(0px)", duration: 0.45 }, 0.12)
        .to(haloEls, { opacity: 0.7, scale: 1, duration: 0.4 }, 0.18)
        .to(bouquetBackFlowers, { opacity: 1, scale: 1, yPercent: 0, duration: 0.45, stagger: 0.03 }, 0.2)
        .to(bouquetMidFlowers, { opacity: 1, scale: 1, yPercent: 0, duration: 0.45, stagger: 0.03 }, 0.26)
        .to(bouquetFrontFlowers, { opacity: 1, scale: 1, yPercent: 0, duration: 0.45, stagger: 0.03 }, 0.32)
        .to(bouquetStems, { scaleY: 1, opacity: 0.75, duration: 0.3, stagger: 0.02 }, 0.32)
        .to(wrapPieces, { opacity: 1, yPercent: 0, scaleY: 1, duration: 0.45, stagger: 0.03 }, 0.36)
        .to(glintEls, { opacity: 0.7, scale: 1, duration: 0.25, stagger: 0.04 }, 0.54);
      return;
    }

    const convergence = openingFlowers.map((flower, index) => {
      const rect = flower.getBoundingClientRect();
      const currentX = Number(gsap.getProperty(flower, "x")) || 0;
      const currentY = Number(gsap.getProperty(flower, "y")) || 0;
      const flowerCenterX = rect.left + rect.width / 2;
      const flowerCenterY = rect.top + rect.height / 2;
      const dx = window.innerWidth / 2 - flowerCenterX;
      const dy = window.innerHeight / 2 - flowerCenterY;
      const distance = Math.hypot(dx, dy);
      const normalX = dx / Math.max(distance, 1);
      const normalY = dy / Math.max(distance, 1);
      const tangentX = -normalY;
      const tangentY = normalX;
      const swirl = (index - (openingFlowers.length - 1) / 2) * 7;

      return {
        anticipationX: currentX - dx * 0.05,
        anticipationY: currentY - dy * 0.05,
        targetX: currentX + dx * 0.98 + tangentX * swirl,
        targetY: currentY + dy * 0.98 + tangentY * swirl,
        targetScale: 0.18 + (distance / Math.max(window.innerWidth, window.innerHeight)) * 0.12,
        finalRotate: Number(flower.dataset.rotation ?? 0) * 0.24 + (index % 2 === 0 ? -9 : 9),
      };
    });

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => setPhase("bouquet"),
    });

    tl.to(cueRef.current, { opacity: 0, y: 18, duration: 0.22 }, 0)
      .to(
        openingFlowers,
        {
          x: (index) => convergence[index].anticipationX,
          y: (index) => convergence[index].anticipationY,
          scale: 1.03,
          duration: 0.16,
          stagger: { each: 0.012, from: "center" },
          ease: "power1.out",
        },
        0,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 0.75,
          scale: 1.1,
          duration: 0.48,
          ease: "power2.out",
        },
        0.08,
      )
      .to(
        impactRings,
        {
          opacity: (_index) => (_index === 0 ? 0.5 : 0.34),
          scale: (index) => (index === 0 ? 1.1 : 1.6),
          duration: 0.52,
          stagger: 0.05,
          ease: "expo.out",
        },
        0.18,
      )
      .to(
        openingFlowers,
        {
          x: (index) => convergence[index].targetX,
          y: (index) => convergence[index].targetY,
          scale: (index) => convergence[index].targetScale,
          rotate: (index) => convergence[index].finalRotate,
          duration: 1.02,
          stagger: { each: 0.018, from: "edges" },
          ease: "expo.in",
        },
        0.12,
      )
      .to(
        openingFlowers,
        {
          keyframes: [
            {
              x: (index) => convergence[index].targetX + (index % 2 === 0 ? 8 : -8),
              y: (index) => convergence[index].targetY + (index % 3 === 0 ? -7 : 7),
              rotate: (index) => convergence[index].finalRotate + (index % 2 === 0 ? -10 : 10),
            },
            {
              x: (index) => convergence[index].targetX + (index % 2 === 0 ? -4 : 4),
              y: (index) => convergence[index].targetY + (index % 2 === 0 ? 4 : -4),
              rotate: (index) => convergence[index].finalRotate + (index % 2 === 0 ? 4 : -4),
            },
            {
              x: (index) => convergence[index].targetX,
              y: (index) => convergence[index].targetY,
              rotate: (index) => convergence[index].finalRotate,
            },
          ],
          duration: 0.24,
          stagger: 0.008,
          ease: "none",
        },
        0.9,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 1,
          scale: 2.9,
          filter: "blur(2px)",
          duration: 0.28,
        },
        0.96,
      )
      .to(
        seamFlashRef.current,
        {
          opacity: 1,
          scaleY: 1,
          duration: 0.18,
          ease: "power1.out",
        },
        0.98,
      )
      .to(
        burstParticlesEls,
        {
          opacity: 1,
          scale: 1,
          duration: 0.06,
          stagger: 0.004,
        },
        1,
      )
      .to(
        burstParticlesEls,
        {
          x: (_index, target) => Number(target.dataset.dx ?? 0),
          y: (_index, target) => Number(target.dataset.dy ?? 0),
          rotate: (_index, target) => Number(target.dataset.spin ?? 0),
          opacity: 0,
          scale: 0.3,
          duration: (_index, target) => Number(target.dataset.duration ?? 0.4),
          stagger: 0.008,
          ease: "power2.out",
        },
        1.02,
      )
      .to(
        openingFlowers,
        {
          opacity: 0,
          scale: 0.08,
          duration: 0.18,
          stagger: 0.012,
          ease: "power2.in",
        },
        1.01,
      )
      .add(() => setPhase("warping"), 1.06)
      .to(
        slicesEls,
        {
          opacity: 1,
          scaleY: 1,
          yPercent: 0,
          rotate: (_index, target) => Number(target.dataset.rotate ?? 0),
          duration: 0.24,
          stagger: 0.022,
          ease: "steps(5)",
        },
        1.06,
      )
      .to(
        slicesEls,
        {
          xPercent: (index) => (index % 2 === 0 ? 18 + index * 1.2 : -(18 + index * 1.2)),
          scaleY: 1.08,
          duration: 0.22,
          stagger: 0.016,
          ease: "steps(4)",
        },
        1.28,
      )
      .to(
        bouquetRef.current,
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          filter: "blur(0px)",
          duration: 0.46,
          ease: "power2.out",
        },
        1.18,
      )
      .to(
        haloEls,
        {
          opacity: (_index) => (_index === 0 ? 0.82 : 0.48),
          scale: 1,
          duration: 0.48,
          stagger: 0.06,
          ease: "power2.out",
        },
        1.28,
      )
      .to(
        slicesEls,
        {
          opacity: 0,
          scaleY: 0,
          yPercent: -12,
          duration: 0.2,
          stagger: { each: 0.016, from: "end" },
          ease: "steps(4)",
        },
        1.45,
      )
      .to(
        bouquetBackFlowers,
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          xPercent: 0,
          rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
          duration: 0.56,
          stagger: 0.05,
          ease: "back.out(1.2)",
        },
        1.3,
      )
      .to(
        bouquetMidFlowers,
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          xPercent: 0,
          rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
          duration: 0.6,
          stagger: 0.05,
          ease: "back.out(1.35)",
        },
        1.44,
      )
      .to(
        bouquetFrontFlowers,
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          xPercent: 0,
          rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
          duration: 0.66,
          stagger: 0.04,
          ease: "back.out(1.55)",
        },
        1.58,
      )
      .to(
        bouquetStems,
        {
          scaleY: 1,
          opacity: 0.72,
          duration: 0.34,
          stagger: { each: 0.018, from: "center" },
          ease: "power2.out",
        },
        1.56,
      )
      .to(
        wrapPieces,
        {
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          duration: 0.52,
          stagger: 0.04,
          ease: "back.out(1.08)",
        },
        1.68,
      )
      .to(
        glintEls,
        {
          opacity: 1,
          scale: 1,
          duration: 0.26,
          stagger: 0.05,
          ease: "back.out(2.6)",
        },
        1.94,
      )
      .to(
        seamFlashRef.current,
        {
          opacity: 0,
          scaleY: 1.35,
          duration: 0.34,
          ease: "power2.out",
        },
        1.34,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 0,
          scale: 3.7,
          duration: 0.72,
          ease: "power2.out",
        },
        1.62,
      );
  };

  return (
    <div className={`site phase-${phase}`} ref={root} onClick={triggerSequence} role="presentation">
      <div className="backdrop">
        <div className="backdrop__gradient" />
        <div className="backdrop__grain" />
        <div className="backdrop__wash backdrop__wash--left" />
        <div className="backdrop__wash backdrop__wash--right" />
        {pollen.map((particle) => (
          <span
            key={particle.id}
            className="pollen"
            style={
              {
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.size}rem`,
                height: `${particle.size}rem`,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="center-glow" ref={centerGlowRef} />

      <div className="fx-layer" aria-hidden="true">
        <div className="impact-ring impact-ring--one" />
        <div className="impact-ring impact-ring--two" />
        <div className="seam-flash" ref={seamFlashRef} />
        {burstParticles.map((particle) => (
          <span
            key={particle.id}
            className="burst-particle"
            data-dx={particle.dx}
            data-dy={particle.dy}
            data-spin={particle.spin}
            data-duration={particle.duration}
            style={
              {
                width: `${particle.size}px`,
                height: `${particle.size * 0.52}px`,
                background: particle.color,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="opening-scene">
        {flowerConfigs.map((flower) => (
          <Flower key={flower.id} flower={flower} mode="opening" />
        ))}
      </div>

      <div className="warp-layer" aria-hidden="true">
        {slices.map((slice) => (
          <span
            key={slice.id}
            className="warp-slice"
            data-rotate={slice.rotate}
            style={
              {
                left: `${slice.left}%`,
                width: `${slice.width}%`,
                clipPath: slice.clip,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="bouquet-scene" ref={bouquetRef}>
        <div className="bouquet-halo" />
        <div className="bouquet-mist" />
        <div className="bouquet-glints" aria-hidden="true">
          {bouquetGlints.map((glint) => (
            <span
              key={glint.id}
              className="bouquet-glint"
              style={
                {
                  left: `${glint.left}%`,
                  top: `${glint.top}%`,
                  width: `${glint.size}px`,
                  height: `${glint.size}px`,
                  rotate: `${glint.rotate}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="bouquet-flowers">
          {flowerConfigs.map((flower) => (
            <Flower key={`bouquet-${flower.id}`} flower={flower} mode="bouquet" />
          ))}
        </div>
        <BouquetWrap />
      </div>

      <div className="overlay-copy">
        <p className="eyebrow">everything finds you</p>
        <h1>Tap once, and the whole field gathers into a bouquet for you.</h1>
      </div>

      <button
        type="button"
        className="trigger-cue"
        ref={cueRef}
        onClick={(event) => {
          event.stopPropagation();
          triggerSequence();
        }}
        disabled={!isInteractive}
      >
        tap anywhere
      </button>
    </div>
  );
}
