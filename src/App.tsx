import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  flowerConfigs,
  getFlowerStyle,
  renderFlower,
  type FlowerConfig,
} from "./flowers";

gsap.registerPlugin(useGSAP);

type Phase = "intro" | "idle" | "collapsing" | "warping" | "bouquet";

const warpSliceCount = 9;

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
    width: 12 + (index % 3) * 2,
    clip: [
      `polygon(${3 + (index % 3) * 3}% 0%, 100% 0%, ${94 - index}% 100%, 0% 100%)`,
      `polygon(0% 0%, ${95 - index}% 0%, 100% 100%, ${5 + (index % 2) * 4}% 100%)`,
      `polygon(${index % 2 === 0 ? 0 : 8}% 0%, 100% 0%, ${86 - index}% 100%, 0% 100%)`,
    ][index % 3],
  }));
}

function Flower({
  flower,
  mode,
}: {
  flower: FlowerConfig;
  mode: "opening" | "bouquet";
}) {
  const centerContent = flower.isCenterMessage && mode === "bouquet" ? "you" : undefined;
  const width =
    mode === "opening"
      ? `clamp(72px, ${flower.size * 0.82}vw, 184px)`
      : flower.isCenterMessage
        ? `clamp(98px, ${flower.size * 1.08}vw, 236px)`
        : `clamp(86px, ${flower.size * 0.98}vw, 214px)`;
  const bouquetTop = `${(flower.isCenterMessage ? 37 : 42) + flower.bouquetTargetY}%`;

  return (
    <div
      className={`flower flower--${mode}${flower.isCenterMessage ? " flower--message" : ""}`}
      data-flower-id={flower.id}
      data-rotation={flower.startRotation}
      data-bouquet-rotation={flower.bouquetRotation}
      style={
        mode === "opening"
          ? ({
              ...getFlowerStyle(flower),
              width,
            } as CSSProperties)
          : ({
              left: `${50 + flower.bouquetTargetX}%`,
              top: bouquetTop,
              width,
              zIndex: flower.isCenterMessage ? 90 : Math.round(50 + flower.depth * 20),
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
      <svg
        className="bouquet-wrap-svg"
        viewBox="0 0 200 260"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="bwConeH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dfc8a4" />
            <stop offset="28%" stopColor="#f8edd8" />
            <stop offset="50%" stopColor="#fffcf3" />
            <stop offset="72%" stopColor="#f4e5cc" />
            <stop offset="100%" stopColor="#dfc8a4" />
          </linearGradient>
          <linearGradient id="bwConeV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(160,120,70,0.1)" />
          </linearGradient>
          <linearGradient id="bwBow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f9c4d4" />
            <stop offset="100%" stopColor="#cf5878" />
          </linearGradient>
          <linearGradient id="bwTail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#df7090" />
            <stop offset="100%" stopColor="#bf4868" />
          </linearGradient>
        </defs>

        {/* back depth shadow */}
        <polygon points="82,0 118,0 107,210 93,210" fill="#c8a070" opacity="0.28" />
        {/* left wing */}
        <polygon points="18,0 82,0 93,210 56,175" fill="#e6d0a8" />
        {/* main face */}
        <polygon points="36,0 164,0 115,210 85,210" fill="url(#bwConeH)" />
        {/* right wing */}
        <polygon points="118,0 182,0 144,175 107,210" fill="#dfc09a" />
        {/* shading overlay */}
        <polygon points="36,0 164,0 115,210 85,210" fill="url(#bwConeV)" />
        {/* top opening edge */}
        <line x1="18" y1="0.5" x2="182" y2="0.5" stroke="#b89060" strokeWidth="1.5" opacity="0.4" />
        {/* centre crease */}
        <line x1="100" y1="0" x2="100" y2="210" stroke="#d8c090" strokeWidth="0.7" opacity="0.25" />
        {/* fold texture lines */}
        <line x1="58" y1="0" x2="76" y2="210" stroke="#d0b880" strokeWidth="0.5" opacity="0.15" />
        <line x1="142" y1="0" x2="124" y2="210" stroke="#d0b880" strokeWidth="0.5" opacity="0.15" />

        {/* ribbon bow at ~74% down the cone */}
        <ellipse cx="74" cy="152" rx="24" ry="11" fill="url(#bwBow)" transform="rotate(-28 74 152)" />
        <ellipse cx="126" cy="152" rx="24" ry="11" fill="url(#bwBow)" transform="rotate(28 126 152)" />
        <ellipse cx="100" cy="157" rx="11" ry="9" fill="#cf5878" />
        <ellipse cx="100" cy="156" rx="6.5" ry="5" fill="#f5a0b8" opacity="0.5" />
        {/* tails hang straight down */}
        <path d="M94,163 L86,228 L92,230 L99,165 Z" fill="url(#bwTail)" />
        <path d="M101,165 L108,230 L114,228 L106,163 Z" fill="url(#bwTail)" />
      </svg>
      <div className="bouquet-wrap__shadow" />
    </div>
  );
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const openingFlowersRef = useRef<HTMLDivElement>(null);
  const bouquetRef = useRef<HTMLDivElement>(null);
  const bouquetFlowersRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLButtonElement>(null);
  const slicesRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [isInteractive, setIsInteractive] = useState(false);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const pollen = useMemo(() => buildPollen(), []);
  const slices = useMemo(() => buildSlices(), []);

  useEffect(() => {
    if (reducedMotion || phase !== "idle") {
      setPointerOffset({ x: 0, y: 0 });
      return undefined;
    }

    const handleMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 22;
      const y = (event.clientY / window.innerHeight - 0.5) * 18;
      setPointerOffset({ x, y });
    };

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [phase, reducedMotion]);

  useGSAP(
    () => {
      const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
      const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
      const stems = gsap.utils.toArray<HTMLElement>(".flower--bouquet .flower__stem");
      const wrapPieces = gsap.utils.toArray<HTMLElement>(".bouquet-wrap > *");
      const slicesEls = gsap.utils.toArray<HTMLElement>(".warp-slice");

      gsap.set(openingFlowers, {
        opacity: 0,
        scale: 0.5,
        yPercent: 10,
        rotate: (_index, target) => Number(target.dataset.rotation ?? 0) - 10,
      });

      gsap.set(".flower--opening .flower__stem", {
        transformOrigin: "50% 0%",
        scaleY: 0.4,
        opacity: 0,
      });

      gsap.set(bouquetRef.current, { opacity: 0, scale: 0.82, yPercent: 10, filter: "blur(10px)" });
      gsap.set(bouquetFlowers, { opacity: 0, scale: 0.8, yPercent: 12 });
      gsap.set(stems, { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(wrapPieces, { opacity: 0, yPercent: 14, rotate: (_index) => (_index % 2 === 0 ? -6 : 6) });
      gsap.set(slicesEls, { opacity: 0, scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(centerGlowRef.current, { opacity: 0, scale: 0.25 });
      gsap.set(cueRef.current, { opacity: 0, y: 24 });

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
            duration: 0.95,
            stagger: 0.045,
          },
          0,
        )
        .to(
          ".flower--opening .flower__stem",
          {
            opacity: 0.75,
            scaleY: 1,
            duration: 0.7,
            stagger: 0.04,
          },
          0.28,
        )
        .to(
          cueRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
          },
          0.95,
        );

      openingFlowers.forEach((flower, index) => {
        const depth = Number(flower.style.getPropertyValue("--depth") || 1);
        gsap.to(flower, {
          yPercent: `+=${(index % 2 === 0 ? 1 : -1) * (2.5 + depth * 2.5)}`,
          xPercent: `+=${(index % 2 === 0 ? -1 : 1) * (1.1 + depth * 1.8)}`,
          rotate: `+=${index % 2 === 0 ? -2.5 : 2.5}`,
          duration: 4.5 + (1 - depth) * 2.5 + index * 0.12,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.4 + index * 0.07,
        });
      });

      bouquetFlowers.forEach((flower, index) => {
        gsap.to(flower, {
          yPercent: `+=${index % 2 === 0 ? -1.8 : 1.6}`,
          rotate: `+=${index % 2 === 0 ? -1.6 : 1.6}`,
          duration: 3.9 + index * 0.15,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          paused: false,
        });
      });

      timelineRef.current = intro;
    },
    { scope: root },
  );

  useEffect(() => {
    if (phase !== "idle" || reducedMotion) {
      return;
    }

    gsap.to(".flower--opening", {
      x: pointerOffset.x,
      y: pointerOffset.y,
      duration: 0.9,
      ease: "power2.out",
      stagger: {
        each: 0.01,
        from: "center",
      },
    });
  }, [phase, pointerOffset, reducedMotion]);

  const triggerSequence = () => {
    if (!isInteractive) {
      return;
    }

    setIsInteractive(false);
    setPhase("collapsing");

    if (reducedMotion) {
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          onComplete: () => {
            setPhase("bouquet");
          },
        })
        .to(cueRef.current, { opacity: 0, y: 16, duration: 0.2 }, 0)
        .to(".flower--opening", { opacity: 0, duration: 0.35, stagger: 0.03 }, 0)
        .to(
          bouquetRef.current,
          { opacity: 1, scale: 1, yPercent: 0, filter: "blur(0px)", duration: 0.55 },
          0.18,
        )
        .to(
          ".flower--bouquet",
          { opacity: 1, scale: 1, yPercent: 0, duration: 0.55, stagger: 0.03 },
          0.25,
        )
        .to(".flower--bouquet .flower__stem", { scaleY: 1, duration: 0.35, stagger: 0.02 }, 0.25)
        .to(".bouquet-wrap > *", { opacity: 1, yPercent: 0, rotate: 0, duration: 0.45, stagger: 0.05 }, 0.3);
      return;
    }

    const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
    const openingStems = gsap.utils.toArray<HTMLElement>(".flower--opening .flower__stem");
    const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
    const bouquetStems = gsap.utils.toArray<HTMLElement>(".flower--bouquet .flower__stem");
    const slicesEls = gsap.utils.toArray<HTMLElement>(".warp-slice");
    const wrapPieces = gsap.utils.toArray<HTMLElement>(".bouquet-wrap > *");

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        setPhase("bouquet");
      },
    });

    tl.to(cueRef.current, { opacity: 0, y: 18, duration: 0.24 }, 0)
      .to(
        centerGlowRef.current,
        {
          opacity: 0.85,
          scale: 1.2,
          duration: 0.65,
          ease: "power2.out",
        },
        0.08,
      )
      .to(
        openingFlowers,
        {
          left: "50%",
          top: "50%",
          xPercent: (_index, target) => {
            const rect = target.getBoundingClientRect();
            return -50 + ((window.innerWidth / 2 - (rect.left + rect.width / 2)) / rect.width) * 100;
          },
          yPercent: (_index, target) => {
            const rect = target.getBoundingClientRect();
            return -50 + ((window.innerHeight / 2 - (rect.top + rect.height / 2)) / rect.height) * 100;
          },
          scale: (_index, target) => {
            const rect = target.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = centerX - window.innerWidth / 2;
            const dy = centerY - window.innerHeight / 2;
            const distance = Math.hypot(dx, dy);
            return 0.28 + distance / Math.max(window.innerWidth, window.innerHeight) * 0.18;
          },
          rotate: (_index, target) => Number(target.dataset.rotation ?? 0) * 0.4,
          duration: 1.25,
          stagger: 0.03,
          ease: "power4.in",
        },
        0,
      )
      .to(
        openingFlowers,
        {
          x: "random(-14, 14, 1)",
          y: "random(-14, 14, 1)",
          rotate: "random(-12, 12, 1)",
          duration: 0.13,
          repeat: 6,
          yoyo: true,
          ease: "steps(2)",
          stagger: 0.015,
        },
        0.72,
      )
      .to(
        openingStems,
        {
          scaleY: 0.15,
          opacity: 0.12,
          duration: 0.45,
          stagger: 0.02,
        },
        0.38,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 1,
          scale: 2.6,
          filter: "blur(1px)",
          duration: 0.38,
        },
        1.02,
      )
      .to(
        openingFlowers,
        {
          opacity: 0,
          scale: 0.1,
          duration: 0.26,
          stagger: 0.02,
        },
        1.06,
      )
      .add(() => setPhase("warping"), 1.08)
      // slices drop down from top, covering the scene like paper sheets
      .to(
        slicesEls,
        {
          opacity: 1,
          scaleY: 1,
          transformOrigin: "50% 0%",
          duration: 0.3,
          stagger: { each: 0.04, from: "start" },
          ease: "steps(4)",
        },
        1.1,
      )
      // bouquet fades in behind the paper curtain
      .to(
        bouquetRef.current,
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          filter: "blur(0px)",
          duration: 0.45,
          ease: "power2.out",
        },
        1.5,
      )
      // slices retract upward (fold back from bottom), revealing bouquet
      .to(
        slicesEls,
        {
          opacity: 0,
          scaleY: 0,
          transformOrigin: "50% 0%",
          duration: 0.3,
          stagger: { each: 0.03, from: "end" },
          ease: "steps(4)",
        },
        1.65,
      )
      .to(
        bouquetFlowers,
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
          duration: 0.7,
          stagger: 0.05,
          ease: "back.out(1.6)",
        },
        1.62,
      )
      .to(
        bouquetStems,
        {
          scaleY: 1,
          duration: 0.5,
          stagger: 0.03,
          ease: "power2.out",
        },
        1.7,
      )
      .to(
        wrapPieces,
        {
          opacity: 1,
          yPercent: 0,
          rotate: 0,
          duration: 0.62,
          stagger: 0.05,
          ease: "back.out(1.4)",
        },
        1.8,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 0,
          scale: 3.2,
          duration: 0.55,
        },
        1.95,
      );
  };

  return (
    <div
      className={`site phase-${phase}`}
      ref={root}
      onClick={triggerSequence}
      role="presentation"
    >
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

      <div className="opening-scene" ref={openingFlowersRef}>
        {flowerConfigs.map((flower) => (
          <div key={flower.id} className="flower-shell">
            <Flower flower={flower} mode="opening" />
          </div>
        ))}
      </div>

      <div className="warp-layer" ref={slicesRef} aria-hidden="true">
        {slices.map((slice) => (
          <span
            key={slice.id}
            className="warp-slice"
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
        <div className="bouquet-cloud" />
        <div className="bouquet-flowers" ref={bouquetFlowersRef}>
          {flowerConfigs.map((flower) => (
            <div key={`bouquet-${flower.id}`} className="flower-shell">
              <Flower flower={flower} mode="bouquet" />
            </div>
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
