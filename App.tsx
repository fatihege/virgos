import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  flowerConfigs,
  getFlowerStyle,
  renderFlower,
  renderStemArt,
  shouldShowOpeningStem,
  type FlowerConfig,
} from "./flowers";

gsap.registerPlugin(useGSAP);

type Phase = "intro" | "idle" | "arranging" | "clustered" | "finishing" | "bouquet";

type BouquetGlint = {
  id: string;
  left: number;
  top: number;
  size: number;
  rotate: number;
};

type GuidanceCopy = {
  eyebrow: string;
  title: string;
  body: string;
};

type NoteCopy = {
  closedLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  signature: string;
};

type BouquetStage = "cluster" | "bouquet";

type Point = {
  x: number;
  y: number;
};

type FlowerInteractionItem = {
  root: HTMLElement;
  head: HTMLElement | null;
  bloom: SVGElement | null;
  stem: HTMLElement | null;
  centerX: number;
  centerY: number;
  radius: number;
  depth: number;
  seed: number;
  speed: number;
  response: number;
  motionScale: number;
  phase: number;
  angle: number;
  x: number;
  y: number;
  headX: number;
  headY: number;
  headRotate: number;
  bloomRotate: number;
  stemX: number;
  stemRotate: number;
};

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

const motion = {
  easeReveal: "expo.out",
  easeSettle: "power2.out",
  easeGather: "expo.inOut",
  easeGatherLift: "sine.out",
  easeGatherDrift: "sine.inOut",
  easeGatherSettle: "power2.out",
  easeGatherBloom: "power1.out",
  easeAccent: "back.out(1.06)",
  easeFloat: "sine.inOut",
  intro: 1,
  quick: 0.26,
  medium: 0.5,
  long: 0.72,
} as const;

const motionWeightDuration = {
  heavy: 1.18,
  medium: 1.04,
  light: 0.92,
} as const;

const motionWeightDelayBias = {
  heavy: 0.06,
  medium: 0,
  light: -0.03,
} as const;

const motionWeightArcBias = {
  heavy: 0.84,
  medium: 1,
  light: 1.12,
} as const;

const romanticNote: NoteCopy = {
  closedLabel: "a note for you",
  eyebrow: "with tenderness",
  title: "For you, always",
  body:
    "If this bouquet could speak, it would only say what my heart already knows: every soft and beautiful thing still finds its way back to you.",
  signature: "With all my love",
};

const guidanceByPhase: Record<Phase, GuidanceCopy> = {
  intro: {
    eyebrow: "everything finds you",
    title: "Two taps turn the field into a bouquet.",
    body: "First the flowers gather into place. Then the paper rises and completes the arrangement.",
  },
  idle: {
    eyebrow: "step 1 of 2",
    title: "Tap once to gather them into a hand-arranged bouquet.",
    body: "They drift inward and settle softly before the wrap arrives.",
  },
  arranging: {
    eyebrow: "step 1 of 2",
    title: "The flowers are drifting into place.",
    body: "Each bloom is being arranged gently in the air.",
  },
  clustered: {
    eyebrow: "step 2 of 2",
    title: "Tap again to lift the wrap.",
    body: "The bouquet is set and ready to be finished.",
  },
  finishing: {
    eyebrow: "step 2 of 2",
    title: "The wrap is rising and the bouquet is tightening softly.",
    body: "Everything is settling into its final, polished composition.",
  },
  bouquet: {
    eyebrow: "for you",
    title: "The bouquet is complete.",
    body: "Wrapped, centered, and resting with a note tucked beside it.",
  },
};

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

function buildBouquetGlints(): BouquetGlint[] {
  return [
    { id: "glint-1", left: 28, top: 20, size: 18, rotate: -12 },
    { id: "glint-2", left: 66, top: 15, size: 14, rotate: 9 },
    { id: "glint-3", left: 21, top: 44, size: 12, rotate: -6 },
    { id: "glint-4", left: 73, top: 40, size: 16, rotate: 11 },
    { id: "glint-5", left: 49, top: 10, size: 11, rotate: 0 },
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function hashFlowerId(id: string) {
  let hash = 2166136261;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function cubicPoint(progress: number, p0: Point, p1: Point, p2: Point, p3: Point) {
  const inverse = 1 - progress;
  const inverseSquared = inverse * inverse;
  const progressSquared = progress * progress;

  return {
    x:
      inverseSquared * inverse * p0.x +
      3 * inverseSquared * progress * p1.x +
      3 * inverse * progressSquared * p2.x +
      progressSquared * progress * p3.x,
    y:
      inverseSquared * inverse * p0.y +
      3 * inverseSquared * progress * p1.y +
      3 * inverse * progressSquared * p2.y +
      progressSquared * progress * p3.y,
  };
}

function getFlowerStagePercentPoint(
  flower: FlowerConfig,
  stage: BouquetStage,
) {
  if (stage === "cluster") {
    return {
      x: flower.clusterTargetX,
      y: flower.clusterTargetY,
    };
  }

  return {
    x: 50 + flower.bouquetTargetX,
    y: bouquetBaseTop[flower.bouquetLayer] + flower.bouquetTargetY,
  };
}

function getFlowerStagePoint(
  flower: FlowerConfig,
  bounds: DOMRect,
  stage: BouquetStage,
) {
  const point = getFlowerStagePercentPoint(flower, stage);

  return {
    x: bounds.left + (bounds.width * point.x) / 100,
    y: bounds.top + (bounds.height * point.y) / 100,
  };
}

function getClusterTransform(
  flower: FlowerConfig,
  bounds: DOMRect,
) {
  const bouquetPoint = getFlowerStagePoint(flower, bounds, "bouquet");
  const clusterPoint = getFlowerStagePoint(flower, bounds, "cluster");

  return {
    x: clusterPoint.x - bouquetPoint.x,
    y: clusterPoint.y - bouquetPoint.y,
  };
}

function getBundleAnchor(stage: BouquetStage): Point {
  return stage === "cluster"
    ? { x: 50, y: 84 }
    : { x: 50, y: 79.5 };
}

function getLeafPath(
  origin: Point,
  angleDegrees: number,
  length: number,
  width: number,
) {
  const radians = (angleDegrees * Math.PI) / 180;
  const leftRadians = radians - 1.12;
  const rightRadians = radians + 1.12;
  const tip = {
    x: origin.x + Math.cos(radians) * length,
    y: origin.y + Math.sin(radians) * length,
  };
  const leftBase = {
    x: origin.x + Math.cos(leftRadians) * width,
    y: origin.y + Math.sin(leftRadians) * width,
  };
  const rightBase = {
    x: origin.x + Math.cos(rightRadians) * width,
    y: origin.y + Math.sin(rightRadians) * width,
  };
  const leftTip = {
    x: origin.x + Math.cos(radians) * length * 0.72 + Math.cos(leftRadians) * width * 0.48,
    y: origin.y + Math.sin(radians) * length * 0.72 + Math.sin(leftRadians) * width * 0.48,
  };
  const rightTip = {
    x: origin.x + Math.cos(radians) * length * 0.72 + Math.cos(rightRadians) * width * 0.48,
    y: origin.y + Math.sin(radians) * length * 0.72 + Math.sin(rightRadians) * width * 0.48,
  };

  return `M ${origin.x} ${origin.y} C ${leftBase.x} ${leftBase.y} ${leftTip.x} ${leftTip.y} ${tip.x} ${tip.y} C ${rightTip.x} ${rightTip.y} ${rightBase.x} ${rightBase.y} ${origin.x} ${origin.y} Z`;
}

function buildBackdropLeafSet(stage: BouquetStage) {
  const bundle = getBundleAnchor(stage);

  if (stage === "cluster") {
    return [
      {
        id: "left-outer",
        stemPath: `M ${bundle.x - 2.8} ${bundle.y - 0.8} C 43.2 68.8 37.6 58.2 34.2 49.6`,
        stemWidth: 1.02,
        leafPath: getLeafPath({ x: 34.8, y: 50.4 }, 232, 15.8, 5.2),
        fill: "#bccfb1",
      },
      {
        id: "right-outer",
        stemPath: `M ${bundle.x + 2.4} ${bundle.y - 0.8} C 55.8 68.6 61.8 58.8 65.2 49.8`,
        stemWidth: 1.04,
        leafPath: getLeafPath({ x: 64.6, y: 50.6 }, -50, 15.5, 5.3),
        fill: "#b6c9ac",
      },
      {
        id: "center-rear",
        stemPath: `M ${bundle.x} ${bundle.y - 0.8} C 49.8 66.4 50 55.6 50.8 43.8`,
        stemWidth: 0.96,
        leafPath: getLeafPath({ x: 51.2, y: 45 }, -78, 12.8, 4.3),
        fill: "#cfd9c5",
      },
    ];
  }

  return [
    {
      id: "left-outer",
      stemPath: `M ${bundle.x - 3.2} ${bundle.y - 0.8} C 42.5 66.4 36.8 54.8 33.2 45.8`,
      stemWidth: 1.14,
      leafPath: getLeafPath({ x: 33.6, y: 46.4 }, 236, 18.6, 6.4),
      fill: "#b9cdb0",
    },
    {
      id: "left-shoulder",
      stemPath: `M ${bundle.x - 1.8} ${bundle.y - 0.8} C 45.2 64.4 40.8 50.8 39.2 37.8`,
      stemWidth: 1.08,
      leafPath: getLeafPath({ x: 39.8, y: 38.8 }, 246, 15.2, 5.1),
      fill: "#c8d6bf",
    },
    {
      id: "center-tall",
      stemPath: `M ${bundle.x} ${bundle.y - 0.6} C 49.6 63.8 49 46.5 49.2 28.8`,
      stemWidth: 1.02,
      leafPath: getLeafPath({ x: 49.8, y: 31.2 }, -92, 15.6, 5.2),
      fill: "#d3decb",
    },
    {
      id: "right-shoulder",
      stemPath: `M ${bundle.x + 1.4} ${bundle.y - 0.8} C 53.8 64.8 57.4 51.4 60.2 38.8`,
      stemWidth: 1.08,
      leafPath: getLeafPath({ x: 60.4, y: 39.2 }, -68, 15, 5.1),
      fill: "#c4d4bb",
    },
    {
      id: "right-outer",
      stemPath: `M ${bundle.x + 3.1} ${bundle.y - 0.8} C 56.8 66.2 63 56 67.2 45.6`,
      stemWidth: 1.16,
      leafPath: getLeafPath({ x: 66.6, y: 46.2 }, -48, 18.2, 6.5),
      fill: "#b7c9ae",
    },
  ];
}

function buildBotanicalGeometry(
  flower: FlowerConfig,
  stage: BouquetStage,
  index: number,
  count: number,
) {
  const bundle = getBundleAnchor(stage);
  const crownPoint = getFlowerStagePercentPoint(flower, stage);
  const spreadStep = stage === "bouquet" ? 0.54 : 0.72;
  const spreadClamp = stage === "bouquet" ? 3.25 : 4.2;
  const bundleSpread = clamp((index - (count - 1) / 2) * spreadStep, -spreadClamp, spreadClamp);
  const stemBase = {
    x: bundle.x + bundleSpread,
    y: bundle.y,
  };
  const anchorOffset =
    flower.bouquetRole === "hero"
      ? 4.8
      : flower.bouquetRole === "support"
        ? 4.2
        : flower.bouquetRole === "foliage"
          ? 3.4
          : 3.7;
  const stemTip = {
    x: crownPoint.x,
    y: crownPoint.y + anchorOffset,
  };
  const side = crownPoint.x < bundle.x ? -1 : 1;
  const arcBias = motionWeightArcBias[flower.motionWeight];
  const stageArc = stage === "bouquet" ? 1.16 : 1;
  const firstControl = {
    x: lerp(stemBase.x, stemTip.x, 0.24) + side * 2.8 * arcBias * stageArc,
    y: stemBase.y - (stage === "bouquet" ? 12.2 : 9.8) - Math.abs(bundleSpread) * 0.14,
  };
  const secondControl = {
    x: lerp(stemBase.x, stemTip.x, 0.76) + side * 5.6 * arcBias * stageArc,
    y: stemTip.y - (stage === "bouquet" ? 14.2 : 11.4) - Math.abs(stemTip.x - stemBase.x) * 0.08,
  };
  const lowerPoint = cubicPoint(0.3, stemBase, firstControl, secondControl, stemTip);
  const middlePoint = cubicPoint(0.48, stemBase, firstControl, secondControl, stemTip);
  const upperPoint = cubicPoint(0.62, stemBase, firstControl, secondControl, stemTip);
  const shoulderPoint = cubicPoint(0.72, stemBase, firstControl, secondControl, stemTip);
  const leafScale =
    flower.bouquetRole === "hero"
      ? 1.18
      : flower.bouquetRole === "support"
        ? 1
        : flower.bouquetRole === "foliage"
          ? 0.96
          : 0.82;
  const stageLeafScale = stage === "bouquet" ? 1.12 : 1;
  const jitter = ((index % 3) - 1) * 6;
  const lowerLength = (flower.bouquetRole === "hero" ? 9.2 : 7.8) * leafScale * stageLeafScale;
  const middleLength = (flower.bouquetRole === "foliage" ? 8.2 : 6.8) * leafScale * stageLeafScale;
  const lowerWidth = (flower.bouquetRole === "hero" ? 4.1 : 3.4) * leafScale * stageLeafScale;
  const middleWidth = 3.2 * leafScale * stageLeafScale;
  const leaves = [
    {
      path: getLeafPath(lowerPoint, side < 0 ? 214 + jitter : -34 + jitter, lowerLength, lowerWidth),
      fill: index % 2 === 0 ? "#94b384" : "#b9ceb0",
    },
    {
      path: getLeafPath(middlePoint, side < 0 ? -20 - jitter : 200 - jitter, middleLength, middleWidth),
      fill: index % 2 === 0 ? "#b9ceb0" : "#8cae7f",
    },
  ];

  if (flower.bouquetRole === "foliage" || flower.bouquetRole === "filler") {
    leaves.push({
      path: getLeafPath(upperPoint, side < 0 ? 222 : -42, 5.6 * leafScale, 2.6 * leafScale),
      fill: "#7f9f72",
    });
  }

  if (stage === "bouquet") {
    leaves.push({
      path: getLeafPath(
        shoulderPoint,
        side < 0 ? 232 + jitter * 0.5 : -54 + jitter * 0.5,
        (flower.bouquetRole === "hero" ? 7.4 : 6.2) * leafScale,
        2.9 * leafScale,
      ),
      fill: flower.bouquetRole === "foliage" ? "#88a877" : "#a8c197",
    });
  }

  return {
    stemPath: `M ${stemBase.x} ${stemBase.y} C ${firstControl.x} ${firstControl.y} ${secondControl.x} ${secondControl.y} ${stemTip.x} ${stemTip.y}`,
    stemWidth:
      (flower.bouquetRole === "hero"
        ? 1.7
        : flower.bouquetRole === "support"
          ? 1.45
          : flower.bouquetRole === "foliage"
            ? 1.28
            : 1.18) + (stage === "bouquet" ? 0.16 : 0),
    leaves,
  };
}

function Flower({
  flower,
  mode,
}: {
  flower: FlowerConfig;
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
      data-role={flower.bouquetRole}
      data-motion-weight={flower.motionWeight}
      data-rotation={flower.startRotation}
      data-bouquet-rotation={flower.bouquetRotation}
      data-cluster-target-x={flower.clusterTargetX}
      data-cluster-target-y={flower.clusterTargetY}
      data-cluster-rotation={flower.clusterRotation}
      data-cluster-scale={flower.clusterScale}
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
      {mode === "opening" && shouldShowOpeningStem(flower) ? (
        <span className="flower__stem flower__stem--opening">{renderStemArt(flower.variant, "opening")}</span>
      ) : null}
      <div className="flower__head">{renderFlower(flower.variant, flower.palette)}</div>
      {centerContent ? <span className="flower__label">{centerContent}</span> : null}
    </div>
  );
}

function BouquetBotanicalLayer({
  flowers,
  stage,
}: {
  flowers: FlowerConfig[];
  stage: BouquetStage;
}) {
  const orderedFlowers = [...flowers].sort((left, right) => {
    const leftPoint = getFlowerStagePercentPoint(left, stage);
    const rightPoint = getFlowerStagePercentPoint(right, stage);

    return leftPoint.x - rightPoint.x;
  });
  const backdropLeaves = buildBackdropLeafSet(stage);

  return (
    <div className={`bouquet-botanicals bouquet-botanicals--${stage}`} data-botanical-stage={stage} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {backdropLeaves.map((leaf) => (
          <g
            key={`${stage}-backdrop-${leaf.id}`}
            className="bouquet-botanical-piece bouquet-botanical-piece--backdrop"
            data-stem-piece
            data-role="backdrop"
          >
            <path
              className="bouquet-botanical-stem bouquet-botanical-stem--backdrop"
              d={leaf.stemPath}
              strokeWidth={leaf.stemWidth}
            />
            <path
              className="bouquet-botanical-leaf bouquet-botanical-leaf--backdrop"
              d={leaf.leafPath}
              fill={leaf.fill}
            />
          </g>
        ))}
        {orderedFlowers.map((flower, index) => {
          const geometry = buildBotanicalGeometry(flower, stage, index, orderedFlowers.length);

          return (
            <g
              key={`${stage}-${flower.id}`}
              className="bouquet-botanical-piece"
              data-stem-piece
              data-role={flower.bouquetRole}
            >
              <path className="bouquet-botanical-stem" d={geometry.stemPath} strokeWidth={geometry.stemWidth} />
              {geometry.leaves.map((leaf, leafIndex) => (
                <path
                  key={`${flower.id}-leaf-${leafIndex}`}
                  className="bouquet-botanical-leaf"
                  d={leaf.path}
                  fill={leaf.fill}
                />
              ))}
            </g>
          );
        })}
      </svg>
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
            d="M42 78 Q82 54 130 72 L102 296 L52 248 Z"
            fill="#e7d2ad"
          />
          <path
            className="bouquet-wrap__sheet bouquet-wrap__sheet--right"
            d="M130 72 Q178 54 218 78 L208 248 L158 296 Z"
            fill="#dec29a"
          />
          <path
            className="bouquet-wrap__sheet bouquet-wrap__sheet--front"
            d="M62 74 Q130 56 198 74 L164 292 Q130 320 96 292 Z"
            fill="url(#wrapPaper)"
          />
          <path
            className="bouquet-wrap__sheet bouquet-wrap__sheet--inner"
            d="M88 84 Q130 70 172 84 L156 262 Q130 278 104 262 Z"
            fill="url(#innerTissue)"
            opacity="0.92"
          />
          <path
            d="M62 74 Q130 56 198 74"
            stroke="#b89163"
            strokeWidth="2"
            fill="none"
            opacity="0.45"
          />
          <path
            d="M62 76 Q130 68 198 76"
            stroke="url(#wrapEdge)"
            strokeWidth="20"
            fill="none"
            opacity="0.15"
          />
          <path d="M130 76 L130 292" stroke="#d6bc8f" strokeWidth="1" opacity="0.36" />
          <path d="M94 86 L108 274" stroke="#d9c39c" strokeWidth="0.8" opacity="0.18" />
          <path d="M166 86 L152 274" stroke="#d9c39c" strokeWidth="0.8" opacity="0.18" />
        </g>

        <g data-wrap-piece className="bouquet-ribbon">
          <ellipse cx="101" cy="226" rx="27" ry="13.5" fill="url(#ribbonPink)" transform="rotate(-18 101 226)" />
          <ellipse cx="159" cy="226" rx="27" ry="13.5" fill="url(#ribbonPink)" transform="rotate(18 159 226)" />
          <ellipse cx="130" cy="232" rx="13.5" ry="12" fill="#cc5b7b" />
          <ellipse cx="130" cy="230" rx="7" ry="6" fill="#f5a1ba" opacity="0.55" />
          <path d="M121 238 L113 316 L122 319 L127 239 Z" fill="url(#ribbonTail)" />
          <path d="M139 238 L147 316 L138 319 L133 239 Z" fill="url(#ribbonTail)" />
        </g>
      </svg>
      <div className="bouquet-wrap__shadow" data-wrap-piece />
    </div>
  );
}

function NoteCard({
  noteRef,
  glowRef,
  open,
  note,
  onClick,
}: {
  noteRef: RefObject<HTMLButtonElement>;
  glowRef: RefObject<HTMLSpanElement>;
  open: boolean;
  note: NoteCopy;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      ref={noteRef}
      type="button"
      className="note-card"
      data-open={open}
      aria-expanded={open}
      aria-label={open ? "Close the romantic note" : "Open the romantic note"}
      onClick={onClick}
    >
      <span className="note-card__glow" ref={glowRef} aria-hidden="true" />
      <span className="note-card__tuck" aria-hidden="true" />
      <span className="note-card__paper">
        <span className="note-card__mini" aria-hidden={open}>
          <span className="note-card__mini-label">{note.closedLabel}</span>
          <span className="note-card__heart-shell">
            <svg className="note-card__heart" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 20.6 4.7 13.9A4.8 4.8 0 0 1 11.8 7l.2.2.2-.2a4.8 4.8 0 0 1 7.1 6.9Z"
                fill="rgba(255,255,255,0.92)"
              />
            </svg>
          </span>
        </span>
        <span className="note-card__sheet">
          <span className="note-card__eyebrow">{note.eyebrow}</span>
          <span className="note-card__title">{note.title}</span>
          <span className="note-card__body">{note.body}</span>
          <span className="note-card__signature">{note.signature}</span>
        </span>
      </span>
    </button>
  );
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const bouquetRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLButtonElement>(null);
  const noteCardRef = useRef<HTMLButtonElement>(null);
  const noteGlowRef = useRef<HTMLSpanElement>(null);
  const noteBaseRef = useRef<{ width: number; height: number; rotate: number } | null>(null);
  const noteReadyRef = useRef(false);
  const noteAnimatingRef = useRef(false);
  const flowerInteractionPausedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [isInteractive, setIsInteractive] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const pollen = useMemo(() => buildPollen(), []);
  const bouquetGlints = useMemo(() => buildBouquetGlints(), []);
  const openingFlowerConfigs = useMemo(
    () => flowerConfigs.filter((flower) => flower.showInOpening !== false),
    [],
  );
  const bouquetFlowerConfigs = useMemo(
    () => flowerConfigs.filter((flower) => flower.showInBouquet !== false),
    [],
  );
  const flowerConfigById = useMemo(
    () => new Map(flowerConfigs.map((flower) => [flower.id, flower])),
    [],
  );
  const getElementClusterTransform = (target: HTMLElement, bounds: DOMRect) => {
    const flowerId = target.dataset.flowerId ?? "";
    const config = flowerConfigById.get(flowerId);

    return config ? getClusterTransform(config, bounds) : { x: 0, y: 0 };
  };
  const guidance = guidanceByPhase[phase];
  const cueLabel =
    phase === "clustered"
      ? "tap to wrap"
      : phase === "arranging"
        ? "arranging..."
        : phase === "finishing"
          ? "wrapping..."
          : "tap to arrange";

  useEffect(() => {
    if (phase !== "idle" || reducedMotion || !root.current) {
      return undefined;
    }

    const rootElement = root.current;
    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      active: false,
    };
    let frameId = 0;
    let flowers: FlowerInteractionItem[] = [];
    flowerInteractionPausedRef.current = false;

    const readFlowers = () => {
      const previousItems = new Map(flowers.map((flower) => [flower.root, flower]));
      const flowerElements = Array.from(rootElement.querySelectorAll<HTMLElement>(".flower--opening"));

      flowers = flowerElements.map((flower, index) => {
        const rect = flower.getBoundingClientRect();
        const existing = previousItems.get(flower);
        const depth = Number(flower.style.getPropertyValue("--depth") || 1);
        const flowerId = flower.dataset.flowerId ?? `flower-${index}`;
        const seed = hashFlowerId(flowerId);
        const motionWeight = flower.dataset.motionWeight ?? "medium";
        const motionScale =
          motionWeight === "heavy"
            ? 1.08
            : motionWeight === "light"
              ? 0.84
              : 0.96;
        const currentX = existing?.x ?? (Number(gsap.getProperty(flower, "x")) || 0);
        const currentY = existing?.y ?? (Number(gsap.getProperty(flower, "y")) || 0);
        const head = flower.querySelector<HTMLElement>(".flower__head");
        const bloom = flower.querySelector<SVGElement>(".flower-svg");
        const stem = flower.querySelector<HTMLElement>(".flower__stem--opening");
        const movingParts = [head, bloom, stem].filter(
          (part): part is HTMLElement | SVGElement => part !== null,
        );

        gsap.set(movingParts, { willChange: "transform" });

        if (head) {
          gsap.set(head, { transformOrigin: "50% 64%" });
        }

        if (bloom) {
          gsap.set(bloom, { transformOrigin: "50% 50%" });
        }

        if (stem) {
          gsap.set(stem, { transformOrigin: "50% 100%" });
        }

        return {
          root: flower,
          head,
          bloom,
          stem,
          centerX: rect.left + rect.width / 2 - currentX,
          centerY: rect.top + rect.height / 2 - currentY,
          radius: clamp(rect.width * (1.28 + seed * 0.34), 126, 224),
          depth,
          seed,
          speed: 0.72 + seed * 0.54,
          response: 0.075 + seed * 0.045,
          motionScale,
          phase: seed * Math.PI * 2 + index * 0.31,
          angle: seed * Math.PI * 2,
          x: existing?.x ?? currentX,
          y: existing?.y ?? currentY,
          headX: existing?.headX ?? 0,
          headY: existing?.headY ?? 0,
          headRotate: existing?.headRotate ?? 0,
          bloomRotate: existing?.bloomRotate ?? 0,
          stemX: existing?.stemX ?? 0,
          stemRotate: existing?.stemRotate ?? 0,
        };
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const animate = (time: number) => {
      const seconds = time / 1000;

      if (flowerInteractionPausedRef.current) {
        frameId = window.requestAnimationFrame(animate);
        return;
      }

      flowers.forEach((flower) => {
        const dx = flower.centerX - pointer.x;
        const dy = flower.centerY - pointer.y;
        const distance = Math.hypot(dx, dy);
        const directionX = distance > 0.01 ? dx / distance : Math.cos(flower.angle);
        const directionY = distance > 0.01 ? dy / distance : Math.sin(flower.angle);
        const proximity = pointer.active
          ? Math.pow(clamp(1 - distance / flower.radius, 0, 1), 2.15) * flower.motionScale
          : 0;
        const wave = Math.sin(seconds * flower.speed + flower.phase);
        const counterWave = Math.cos(seconds * (flower.speed * 0.78) + flower.phase * 0.74);
        const breath = Math.sin(seconds * (flower.speed * 1.34) + flower.phase + 1.1);
        const rootDrift = (5.2 + flower.depth * 4.8) * proximity;
        const targetX = directionX * rootDrift + wave * proximity * (1.3 + flower.seed * 1.2);
        const targetY =
          directionY * (2.2 + flower.depth * 2.8) * proximity -
          proximity * (0.7 + flower.depth * 0.7) +
          counterWave * proximity * 0.82;
        const targetHeadX = directionX * proximity * (1.1 + flower.depth);
        const targetHeadY = -proximity * (0.9 + flower.depth * 0.8) + counterWave * proximity * 0.42;
        const targetHeadRotate =
          (-directionX * (5.4 + flower.depth * 2.8) + wave * (1.8 + flower.seed * 1.4)) * proximity;
        const targetBloomRotate =
          (directionX * (1.8 + flower.seed * 1.7) + breath * (1.2 + flower.seed * 1.4)) * proximity;
        const targetStemX = -targetX * 0.16;
        const targetStemRotate =
          (directionX * (2.8 + flower.depth * 2.1) + wave * 0.86) * proximity;
        const response = pointer.active ? flower.response : flower.response * 0.68;

        flower.x = lerp(flower.x, targetX, response);
        flower.y = lerp(flower.y, targetY, response);
        flower.headX = lerp(flower.headX, targetHeadX, response);
        flower.headY = lerp(flower.headY, targetHeadY, response);
        flower.headRotate = lerp(flower.headRotate, targetHeadRotate, response);
        flower.bloomRotate = lerp(flower.bloomRotate, targetBloomRotate, response * 0.86);
        flower.stemX = lerp(flower.stemX, targetStemX, response * 0.72);
        flower.stemRotate = lerp(flower.stemRotate, targetStemRotate, response * 0.72);

        gsap.set(flower.root, { x: flower.x, y: flower.y });

        if (flower.head) {
          gsap.set(flower.head, {
            x: flower.headX,
            y: flower.headY,
            rotate: flower.headRotate,
          });
        }

        if (flower.bloom) {
          gsap.set(flower.bloom, { rotate: flower.bloomRotate });
        }

        if (flower.stem) {
          gsap.set(flower.stem, {
            x: flower.stemX,
            rotate: flower.stemRotate,
          });
        }
      });

      frameId = window.requestAnimationFrame(animate);
    };

    readFlowers();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    rootElement.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);
    window.addEventListener("resize", readFlowers);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      rootElement.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      window.removeEventListener("resize", readFlowers);
      flowers.forEach((flower) => {
        const movingParts = [flower.head, flower.bloom, flower.stem].filter(
          (part): part is HTMLElement | SVGElement => part !== null,
        );

        gsap.set(movingParts, {
          x: 0,
          y: 0,
          rotate: 0,
          clearProps: "willChange",
        });
      });
    };
  }, [phase, reducedMotion]);

  useGSAP(
    () => {
      const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
      const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
      const clusterBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="cluster"] [data-stem-piece]');
      const finalBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="bouquet"] [data-stem-piece]');
      const impactRings = gsap.utils.toArray<HTMLElement>(".impact-ring");
      const wrapPieces = gsap.utils.toArray<HTMLElement>("[data-wrap-piece]");
      const haloEls = gsap.utils.toArray<HTMLElement>(".bouquet-halo, .bouquet-mist");
      const glintEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");
      const bouquetFlowersFrame = root.current?.querySelector<HTMLElement>(".bouquet-flowers");
      const bouquetBounds = bouquetFlowersFrame?.getBoundingClientRect();

      gsap.set(openingFlowers, {
        opacity: 0,
        scale: 0.34,
        yPercent: 18,
        rotate: (_index, target) => Number(target.dataset.rotation ?? 0) - 12,
      });

      gsap.set(bouquetRef.current, {
        opacity: 0,
        scale: 0.96,
        yPercent: 8,
      });

      gsap.set(bouquetFlowers, {
        opacity: 0,
        x: (_index, target) => (bouquetBounds ? getElementClusterTransform(target, bouquetBounds).x : 0),
        y: (_index, target) => (bouquetBounds ? getElementClusterTransform(target, bouquetBounds).y + 22 : 22),
        scale: (_index, target) => Number(target.dataset.clusterScale ?? 1) * 0.86,
        rotate: (_index, target) => Number(target.dataset.clusterRotation ?? 0) * 1.08,
      });

      gsap.set(clusterBotanicalPieces, { scaleY: 0.72, opacity: 0, y: 16 });
      gsap.set(finalBotanicalPieces, { scaleY: 0.66, opacity: 0, y: 12 });
      gsap.set(wrapPieces, { opacity: 0, yPercent: 18, scaleY: 0.92, transformOrigin: "50% 100%" });
      gsap.set(centerGlowRef.current, { opacity: 0, scale: 0.72 });
      gsap.set(impactRings, { opacity: 0, scale: 0.96 });
      gsap.set(haloEls, { opacity: 0, scale: 0.86 });
      gsap.set(glintEls, { opacity: 0, scale: 0.3 });
      gsap.set(cueRef.current, { opacity: 0, y: 28 });
      gsap.set(noteCardRef.current, {
        opacity: 0,
        x: 0,
        y: 20,
        scale: 0.82,
        rotate: -12,
      });
      gsap.set(noteGlowRef.current, { opacity: 0, scale: 0.8 });

      const intro = gsap.timeline({
        defaults: { ease: motion.easeReveal },
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
            duration: motion.intro,
            stagger: 0.05,
            ease: "back.out(1.18)",
          },
          0,
        )
        .to(
          cueRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.76,
          },
          1.02,
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
          ease: motion.easeFloat,
          delay: 1.1 + index * 0.06,
        });
      });
    },
    { scope: root },
  );

  useEffect(() => {
    if ((phase !== "clustered" && phase !== "bouquet") || reducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
      const bouquetGlintsEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");
      const isFinal = phase === "bouquet";

      bouquetFlowers.forEach((flower, index) => {
        const layer = flower.dataset.layer ?? "mid";
        const amplitude = isFinal
          ? layer === "back"
            ? 1.2
            : layer === "mid"
              ? 1.7
              : 2.1
          : layer === "back"
            ? 0.65
            : layer === "mid"
              ? 0.9
              : 1.15;

        gsap.to(flower, {
          yPercent: `+=${index % 2 === 0 ? -amplitude : amplitude}`,
          rotate: `+=${index % 2 === 0 ? -(amplitude * 0.75) : amplitude * 0.75}`,
          duration: (isFinal ? 3.8 : 4.6) + index * 0.18,
          repeat: -1,
          yoyo: true,
          ease: motion.easeFloat,
        });
      });

      gsap.to(".bouquet-halo", {
        scale: isFinal ? 1.04 : 1.018,
        opacity: isFinal ? 0.86 : 0.64,
        duration: isFinal ? 4.2 : 4.8,
        repeat: -1,
        yoyo: true,
        ease: motion.easeFloat,
      });

      gsap.to(".bouquet-mist", {
        scale: isFinal ? 1.08 : 1.04,
        opacity: isFinal ? 0.58 : 0.36,
        duration: isFinal ? 4.8 : 5.3,
        repeat: -1,
        yoyo: true,
        ease: motion.easeFloat,
      });

      if (isFinal) {
        gsap.to(".bouquet-wrap", {
          yPercent: -1.2,
          duration: 4.6,
          repeat: -1,
          yoyo: true,
          ease: motion.easeFloat,
        });

        bouquetGlintsEls.forEach((glint, index) => {
          gsap.to(glint, {
            opacity: 0.85,
            scale: 1,
            duration: 0.4,
            repeat: -1,
            repeatDelay: 2.1 + index * 0.28,
            yoyo: true,
            ease: motion.easeFloat,
            delay: index * 0.34,
          });
        });
      }
    }, root);

    return () => ctx.revert();
  }, [phase, reducedMotion]);

  useEffect(() => {
    const noteCard = noteCardRef.current;
    const noteGlow = noteGlowRef.current;

    if (!noteCard || !noteGlow) {
      return;
    }

    if (phase !== "bouquet") {
      noteReadyRef.current = false;
      noteAnimatingRef.current = false;
      noteBaseRef.current = null;
      setNoteOpen(false);
      gsap.set(noteCard, {
        opacity: 0,
        x: 0,
        y: 20,
        scale: 0.82,
        rotate: -12,
        width: "",
        height: "",
      });
      gsap.set(noteGlow, { opacity: 0, scale: 0.8 });
      return;
    }

    gsap.killTweensOf([noteCard, noteGlow]);

    if (reducedMotion) {
      gsap.set(noteCard, { opacity: 1, x: 0, y: 0, scale: 1, rotate: -7 });
      gsap.set(noteGlow, { opacity: 0.26, scale: 1 });
      noteBaseRef.current = {
        width: noteCard.getBoundingClientRect().width,
        height: noteCard.getBoundingClientRect().height,
        rotate: -7,
      };
      noteReadyRef.current = true;
      return;
    }

    noteAnimatingRef.current = true;

    gsap
      .timeline({
        defaults: { ease: motion.easeSettle },
        onComplete: () => {
          noteBaseRef.current = {
            width: noteCard.getBoundingClientRect().width,
            height: noteCard.getBoundingClientRect().height,
            rotate: Number(gsap.getProperty(noteCard, "rotate")) || -7,
          };
          noteReadyRef.current = true;
          noteAnimatingRef.current = false;
        },
      })
      .to(
        noteCard,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: -7,
          duration: 0.74,
          delay: 0.28,
          ease: motion.easeAccent,
        },
        0,
      )
      .to(
        noteGlow,
        {
          opacity: 0.46,
          scale: 1,
          duration: motion.medium,
        },
        0.36,
      )
      .to(
        noteGlow,
        {
          opacity: 0.12,
          duration: motion.medium,
        },
        0.92,
      );
  }, [phase, reducedMotion]);

  const animateNoteCard = (open: boolean) => {
    const noteCard = noteCardRef.current;
    const noteGlow = noteGlowRef.current;

    if (!noteCard || !noteGlow) {
      return;
    }

    gsap.killTweensOf([noteCard, noteGlow]);

    const currentX = Number(gsap.getProperty(noteCard, "x")) || 0;
    const currentY = Number(gsap.getProperty(noteCard, "y")) || 0;
    const currentRect = noteCard.getBoundingClientRect();
    const base = noteBaseRef.current ?? {
      width: currentRect.width,
      height: currentRect.height,
      rotate: Number(gsap.getProperty(noteCard, "rotate")) || -7,
    };
    const targetWidth = Math.min(window.innerWidth - 32, 420);
    const targetHeight = Math.min(window.innerHeight * 0.56, 320);
    const targetCenterX = window.innerWidth / 2;
    const targetCenterY = window.innerHeight * 0.57;
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const currentCenterY = currentRect.top + currentRect.height / 2;
    const deltaX = targetCenterX - currentCenterX;
    const deltaY = targetCenterY - currentCenterY;

    noteAnimatingRef.current = true;

    const timeline = gsap.timeline({
      defaults: { ease: motion.easeGather },
      onComplete: () => {
        noteAnimatingRef.current = false;
      },
    });

    if (open) {
      timeline
        .to(
          noteGlow,
          {
            opacity: 0.34,
            scale: 1.12,
            duration: 0.34,
            ease: motion.easeReveal,
          },
          0,
        )
        .to(
          noteCard,
          {
            x: currentX + deltaX,
            y: currentY + deltaY,
            width: targetWidth,
            height: targetHeight,
            rotate: -1.5,
            duration: reducedMotion ? 0.01 : 0.84,
          },
          0,
        )
        .to(
          noteGlow,
          {
            opacity: 0.18,
            scale: 1.04,
            duration: 0.46,
          },
          0.38,
        );
      return;
    }

    timeline
      .to(
        noteGlow,
        {
          opacity: 0.28,
          scale: 1,
          duration: motion.quick,
          ease: motion.easeReveal,
        },
        0,
      )
      .to(
        noteCard,
        {
          x: 0,
          y: 0,
          width: base.width,
          height: base.height,
          rotate: base.rotate,
          duration: reducedMotion ? 0.01 : 0.74,
        },
        0,
      )
      .to(
        noteGlow,
        {
          opacity: 0.12,
          duration: 0.38,
        },
        0.24,
      );
  };

  const toggleNoteCard = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (phase !== "bouquet" || !noteReadyRef.current || noteAnimatingRef.current) {
      return;
    }

    const nextOpen = !noteOpen;
    setNoteOpen(nextOpen);
    animateNoteCard(nextOpen);
  };

  const runArrangeSequence = () => {
    const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
    const openingFlowerParts = gsap.utils.toArray<HTMLElement | SVGElement>(
      ".flower--opening .flower__head, .flower--opening .flower-svg, .flower--opening .flower__stem--opening",
    );
    const bouquetBackFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="back"]');
    const bouquetMidFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="mid"]');
    const bouquetFrontFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="front"]');
    const clusterBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="cluster"] [data-stem-piece]');
    const finalBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="bouquet"] [data-stem-piece]');
    const impactRings = gsap.utils.toArray<HTMLElement>(".impact-ring");
    const haloEls = gsap.utils.toArray<HTMLElement>(".bouquet-halo, .bouquet-mist");
    const bouquetFlowersFrame = root.current?.querySelector<HTMLElement>(".bouquet-flowers");

    if (!bouquetFlowersFrame) {
      return;
    }

    flowerInteractionPausedRef.current = true;

    const bouquetBounds = bouquetFlowersFrame.getBoundingClientRect();

    setIsInteractive(false);
    setPhase("arranging");

    gsap.killTweensOf(openingFlowers);
    gsap.killTweensOf(openingFlowerParts);
    gsap.set(openingFlowerParts, { x: 0, y: 0, rotate: 0, clearProps: "willChange" });
    gsap.killTweensOf(bouquetBackFlowers);
    gsap.killTweensOf(bouquetMidFlowers);
    gsap.killTweensOf(bouquetFrontFlowers);
    gsap.killTweensOf(clusterBotanicalPieces);
    gsap.killTweensOf(finalBotanicalPieces);
    gsap.killTweensOf(impactRings);
    gsap.killTweensOf(haloEls);
    gsap.killTweensOf(centerGlowRef.current);

    if (reducedMotion) {
      gsap
        .timeline({
          defaults: { ease: motion.easeSettle },
          onComplete: () => {
            setPhase("clustered");
            setIsInteractive(true);
            gsap.to(cueRef.current, { opacity: 1, y: 0, duration: 0.48, ease: motion.easeReveal });
          },
        })
        .to(cueRef.current, { opacity: 0, y: 18, duration: motion.quick }, 0)
        .to(bouquetRef.current, { opacity: 1, scale: 1, yPercent: 0, duration: 0.32 }, 0.08)
        .to(centerGlowRef.current, { opacity: 0.12, scale: 0.92, duration: 0.22 }, 0.1)
        .to(haloEls, { opacity: (_index) => (_index === 0 ? 0.5 : 0.2), scale: 1, duration: 0.32 }, 0.12)
        .to(
          openingFlowers,
          {
            opacity: 0,
            scale: 0.9,
            duration: 0.34,
            stagger: 0.012,
          },
          0.14,
        )
        .to(
          clusterBotanicalPieces,
          {
            opacity: 0.88,
            scaleY: 1,
            y: 0,
            duration: 0.28,
            stagger: 0.01,
          },
          0.16,
        )
        .to(
          bouquetBackFlowers,
          {
            opacity: 1,
            x: (_index, target) => getElementClusterTransform(target, bouquetBounds).x,
            y: (_index, target) => getElementClusterTransform(target, bouquetBounds).y,
            scale: (_index, target) => Number(target.dataset.clusterScale ?? 1),
            rotate: (_index, target) => Number(target.dataset.clusterRotation ?? 0),
            duration: 0.38,
            stagger: 0.03,
          },
          0.18,
        )
        .to(
          bouquetMidFlowers,
          {
            opacity: 1,
            x: (_index, target) => getElementClusterTransform(target, bouquetBounds).x,
            y: (_index, target) => getElementClusterTransform(target, bouquetBounds).y,
            scale: (_index, target) => Number(target.dataset.clusterScale ?? 1),
            rotate: (_index, target) => Number(target.dataset.clusterRotation ?? 0),
            duration: 0.4,
            stagger: 0.03,
          },
          0.24,
        )
        .to(
          bouquetFrontFlowers,
          {
            opacity: 1,
            x: (_index, target) => getElementClusterTransform(target, bouquetBounds).x,
            y: (_index, target) => getElementClusterTransform(target, bouquetBounds).y,
            scale: (_index, target) => Number(target.dataset.clusterScale ?? 1),
            rotate: (_index, target) => Number(target.dataset.clusterRotation ?? 0),
            duration: 0.42,
            stagger: 0.03,
          },
          0.3,
        )
        .to(centerGlowRef.current, { opacity: 0, scale: 1.04, duration: 0.24 }, 0.42);
      return;
    }

    const convergence = openingFlowers.map((flower, index) => {
      const flowerId = flower.dataset.flowerId ?? "";
      const config = flowerConfigById.get(flowerId);
      const rect = flower.getBoundingClientRect();
      const currentX = Number(gsap.getProperty(flower, "x")) || 0;
      const currentY = Number(gsap.getProperty(flower, "y")) || 0;
      const currentScale = Number(gsap.getProperty(flower, "scale")) || 1;
      const startRotation = Number(flower.dataset.rotation ?? 0);
      const flowerCenterX = rect.left + rect.width / 2;
      const flowerCenterY = rect.top + rect.height / 2;

      if (!config) {
        return {
          flower,
          currentScale,
          startRotation,
          motionWeight: "light" as const,
          showInBouquet: false,
          travel: 0,
          preliftX: currentX,
          preliftY: currentY,
          waypointX: currentX,
          waypointY: currentY,
          targetX: currentX,
          targetY: currentY,
          targetScale: 0.82,
          waypointRotate: startRotation * 0.55,
          targetRotate: startRotation,
        };
      }

      const targetPoint = getFlowerStagePoint(config, bouquetBounds, "cluster");
      const dx = targetPoint.x - flowerCenterX;
      const dy = targetPoint.y - flowerCenterY;
      const travel = Math.hypot(dx, dy);
      const direction = dx === 0 ? (index % 2 === 0 ? -1 : 1) : Math.sign(dx);
      const arcBias = motionWeightArcBias[config.motionWeight];
      const lift = clamp(travel * 0.08, 12, 26) * arcBias;
      const drift = clamp(travel * 0.06, 10, 22) * direction * arcBias;
      const preliftY = currentY - clamp(6 + travel * 0.02, 6, 10) * arcBias;
      const preliftX = currentX + dx * 0.05;
      const waypointX = currentX + dx * 0.42 + drift;
      const waypointY = currentY + dy * 0.38 - lift;
      const waypointProgress =
        config.motionWeight === "heavy"
          ? 0.42
          : config.motionWeight === "medium"
            ? 0.54
            : 0.66;

      return {
        flower,
        currentScale,
        startRotation,
        motionWeight: config.motionWeight,
        showInBouquet: config.showInBouquet !== false,
        travel,
        preliftX,
        preliftY,
        waypointX,
        waypointY,
        targetX: currentX + dx,
        targetY: currentY + dy,
        targetScale: config.clusterScale,
        waypointRotate: startRotation + (config.clusterRotation - startRotation) * waypointProgress,
        targetRotate: config.clusterRotation,
      };
    });

    const orderedConvergence = [...convergence].sort((left, right) => right.travel - left.travel);
    const movementRank = new Map(orderedConvergence.map((entry, order) => [entry.flower, order]));

    const timeline = gsap.timeline({
      defaults: { ease: motion.easeSettle },
      onComplete: () => {
        setPhase("clustered");
        setIsInteractive(true);
        gsap.to(cueRef.current, { opacity: 1, y: 0, duration: 0.46, ease: motion.easeReveal });
      },
    });

    timeline
      .to(cueRef.current, { opacity: 0, y: 18, duration: motion.quick }, 0)
      .to(
        bouquetRef.current,
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          duration: 0.56,
          ease: motion.easeReveal,
        },
        0.18,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 0.16,
          scale: 0.94,
          duration: 0.42,
          ease: motion.easeGatherBloom,
        },
        0.14,
      )
      .to(
        impactRings,
        {
          opacity: 0.035,
          scale: 1.02,
          duration: 0.34,
          ease: motion.easeReveal,
        },
        0.24,
      )
      .to(
        haloEls,
        {
          opacity: (_index) => (_index === 0 ? 0.52 : 0.22),
          scale: 1,
          duration: 0.62,
          stagger: 0.05,
          ease: motion.easeReveal,
        },
        0.4,
      )
      .to(
        clusterBotanicalPieces,
        {
          opacity: 0.9,
          scaleY: 1,
          y: 0,
          duration: 0.56,
          stagger: { each: 0.014, from: "center" },
          ease: motion.easeGatherBloom,
        },
        0.46,
      )
      .to(
        finalBotanicalPieces,
        {
          opacity: 0,
          duration: 0.12,
        },
        0,
      )
      .to(
        bouquetBackFlowers,
        {
          opacity: 1,
          x: (_index, target) => getElementClusterTransform(target, bouquetBounds).x,
          y: (_index, target) => getElementClusterTransform(target, bouquetBounds).y,
          scale: (_index, target) => Number(target.dataset.clusterScale ?? 1),
          rotate: (_index, target) => Number(target.dataset.clusterRotation ?? 0),
          duration: 0.7,
          stagger: 0.04,
          ease: motion.easeGatherBloom,
        },
        0.42,
      )
      .to(
        bouquetMidFlowers,
        {
          opacity: 1,
          x: (_index, target) => getElementClusterTransform(target, bouquetBounds).x,
          y: (_index, target) => getElementClusterTransform(target, bouquetBounds).y,
          scale: (_index, target) => Number(target.dataset.clusterScale ?? 1),
          rotate: (_index, target) => Number(target.dataset.clusterRotation ?? 0),
          duration: 0.76,
          stagger: 0.035,
          ease: motion.easeGatherBloom,
        },
        0.5,
      )
      .to(
        bouquetFrontFlowers,
        {
          opacity: 1,
          x: (_index, target) => getElementClusterTransform(target, bouquetBounds).x,
          y: (_index, target) => getElementClusterTransform(target, bouquetBounds).y,
          scale: (_index, target) => Number(target.dataset.clusterScale ?? 1),
          rotate: (_index, target) => Number(target.dataset.clusterRotation ?? 0),
          duration: 0.82,
          stagger: 0.03,
          ease: motion.easeAccent,
        },
        0.58,
      )
      .to(
        impactRings,
        {
          opacity: 0,
          scale: 1.06,
          duration: 0.26,
          ease: motion.easeSettle,
        },
        0.56,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 0,
          scale: 1.06,
          duration: 0.34,
          ease: motion.easeSettle,
        },
        1.14,
      );

    convergence.forEach((entry) => {
      const order = movementRank.get(entry.flower) ?? 0;
      const bias = motionWeightDelayBias[entry.motionWeight];
      const startTime = Math.max(0, order * 0.004 + bias * 0.8);
      const driftStart = startTime + 0.1;
      const settleStart = driftStart + motionWeightDuration[entry.motionWeight] - 0.08;
      const finalSettleStart = driftStart + motionWeightDuration[entry.motionWeight] + 0.02;
      const fadeStart = Math.max(0.96 + order * 0.003, finalSettleStart + 0.02);
      const fadeScale = entry.targetScale * (entry.showInBouquet ? 0.94 : 0.88);

      timeline
        .to(
          entry.flower,
          {
            x: entry.preliftX,
            y: entry.preliftY,
            scale: entry.currentScale + 0.01,
            rotate: entry.startRotation * 0.25,
            duration: 0.22,
            ease: motion.easeGatherLift,
          },
          startTime,
        )
        .to(
          entry.flower,
          {
            x: entry.waypointX,
            y: entry.waypointY,
            scale: entry.targetScale * 1.02,
            rotate: entry.waypointRotate,
            duration: motionWeightDuration[entry.motionWeight],
            ease: motion.easeGatherDrift,
          },
          driftStart,
        )
        .to(
          entry.flower,
          {
            x: entry.targetX,
            y: entry.targetY + 4,
            scale: entry.targetScale * 1.02,
            rotate: entry.targetRotate,
            duration: 0.18,
            ease: motion.easeGatherSettle,
          },
          settleStart,
        )
        .to(
          entry.flower,
          {
            y: entry.targetY,
            scale: entry.targetScale,
            duration: 0.12,
            ease: motion.easeSettle,
          },
          finalSettleStart,
        )
        .to(
          entry.flower,
          {
            opacity: 0,
            scale: fadeScale,
            duration: entry.showInBouquet ? 0.2 : 0.18,
            ease: motion.easeSettle,
          },
          fadeStart,
        );
    });
  };

  const runCompleteSequence = () => {
    const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
    const bouquetBackFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="back"]');
    const bouquetMidFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="mid"]');
    const bouquetFrontFlowers = gsap.utils.toArray<HTMLElement>('.flower--bouquet[data-layer="front"]');
    const clusterBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="cluster"] [data-stem-piece]');
    const finalBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="bouquet"] [data-stem-piece]');
    const wrapPieces = gsap.utils.toArray<HTMLElement>("[data-wrap-piece]");
    const haloEls = gsap.utils.toArray<HTMLElement>(".bouquet-halo, .bouquet-mist");
    const glintEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");

    setIsInteractive(false);
    setPhase("finishing");

    gsap.killTweensOf(bouquetFlowers);
    gsap.killTweensOf(clusterBotanicalPieces);
    gsap.killTweensOf(finalBotanicalPieces);
    gsap.killTweensOf(wrapPieces);
    gsap.killTweensOf(haloEls);
    gsap.killTweensOf(glintEls);
    gsap.killTweensOf(centerGlowRef.current);

    if (reducedMotion) {
      gsap
        .timeline({
          defaults: { ease: motion.easeSettle },
          onComplete: () => setPhase("bouquet"),
        })
        .to(cueRef.current, { opacity: 0, y: 18, duration: motion.quick }, 0)
        .to(bouquetRef.current, { opacity: 1, scale: 1, yPercent: 0, duration: 0.24 }, 0)
        .to(centerGlowRef.current, { opacity: 0.1, scale: 0.92, duration: 0.18 }, 0.05)
        .to(haloEls, { opacity: (_index) => (_index === 0 ? 0.56 : 0.22), scale: 1, duration: 0.3 }, 0.04)
        .to(clusterBotanicalPieces, { opacity: 0, scaleY: 0.96, y: 4, duration: 0.22, stagger: 0.01 }, 0.08)
        .to(finalBotanicalPieces, { opacity: 0.92, scaleY: 1, y: 0, duration: 0.28, stagger: 0.01 }, 0.12)
        .to(
          bouquetBackFlowers,
          {
            x: 0,
            y: 0,
            scale: 1,
            rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
            duration: 0.38,
            stagger: 0.03,
          },
          0.1,
        )
        .to(
          bouquetMidFlowers,
          {
            x: 0,
            y: 0,
            scale: 1,
            rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
            duration: 0.4,
            stagger: 0.03,
          },
          0.14,
        )
        .to(
          bouquetFrontFlowers,
          {
            x: 0,
            y: 0,
            scale: 1,
            rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
            duration: 0.42,
            stagger: 0.03,
          },
          0.18,
        )
        .to(wrapPieces, { opacity: 1, yPercent: 0, scaleY: 1, duration: 0.34, stagger: 0.03 }, 0.2)
        .to(glintEls, { opacity: 0.46, scale: 0.9, duration: motion.quick, stagger: 0.04 }, 0.3)
        .to(centerGlowRef.current, { opacity: 0, scale: 1.04, duration: 0.22 }, 0.34);
      return;
    }

    gsap
      .timeline({
        defaults: { ease: motion.easeSettle },
        onComplete: () => setPhase("bouquet"),
      })
      .to(cueRef.current, { opacity: 0, y: 18, duration: motion.quick }, 0)
      .to(
        centerGlowRef.current,
        {
          opacity: 0.16,
          scale: 0.9,
          duration: 0.22,
        },
        0.06,
      )
      .to(
        haloEls,
        {
          opacity: (_index) => (_index === 0 ? 0.66 : 0.28),
          scale: (_index) => (_index === 0 ? 1.03 : 1.04),
          duration: 0.46,
          stagger: 0.05,
        },
        0.18,
      )
      .to(
        clusterBotanicalPieces,
        {
          opacity: 0,
          scaleY: 0.96,
          y: 6,
          duration: 0.34,
          stagger: { each: 0.01, from: "center" },
          ease: motion.easeSettle,
        },
        0.18,
      )
      .to(
        finalBotanicalPieces,
        {
          opacity: 0.94,
          scaleY: 1,
          y: 0,
          duration: 0.56,
          stagger: { each: 0.014, from: "center" },
          ease: motion.easeGatherBloom,
        },
        0.24,
      )
      .to(
        bouquetBackFlowers,
        {
          x: 0,
          y: 0,
          scale: 1,
          rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
          duration: 0.6,
          stagger: 0.035,
          ease: motion.easeSettle,
        },
        0.16,
      )
      .to(
        bouquetMidFlowers,
        {
          x: 0,
          y: 0,
          scale: 1,
          rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
          duration: 0.64,
          stagger: 0.035,
          ease: motion.easeSettle,
        },
        0.22,
      )
      .to(
        bouquetFrontFlowers,
        {
          x: 0,
          y: 0,
          scale: 1,
          rotate: (_index, target) => Number(target.dataset.bouquetRotation ?? 0),
          duration: 0.68,
          stagger: 0.035,
          ease: motion.easeAccent,
        },
        0.28,
      )
      .to(
        wrapPieces,
        {
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          duration: 0.56,
          stagger: 0.035,
          ease: motion.easeSettle,
        },
        0.34,
      )
      .to(
        glintEls,
        {
          opacity: 0.46,
          scale: 0.9,
          duration: motion.quick,
          stagger: 0.04,
          ease: motion.easeReveal,
        },
        0.62,
      )
      .to(
        centerGlowRef.current,
        {
          opacity: 0,
          scale: 1.18,
          duration: 0.36,
        },
        0.46,
      );
  };

  const triggerSequence = () => {
    if (!isInteractive) {
      return;
    }

    if (phase === "idle") {
      runArrangeSequence();
      return;
    }

    if (phase === "clustered") {
      runCompleteSequence();
    }
  };

  const stepOneActive = phase === "arranging" || phase === "clustered" || phase === "finishing" || phase === "bouquet";
  const stepTwoActive = phase === "finishing" || phase === "bouquet";
  const stepOneCurrent = phase === "idle" || phase === "arranging";
  const stepTwoCurrent = phase === "clustered" || phase === "finishing";

  return (
    <div
      className={`site phase-${phase}`}
      data-interactive={isInteractive}
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

      <div className="fx-layer" aria-hidden="true">
        <div className="impact-ring impact-ring--one" />
      </div>

      <div className="opening-scene">
        {openingFlowerConfigs.map((flower) => (
          <Flower key={flower.id} flower={flower} mode="opening" />
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
          <BouquetBotanicalLayer flowers={bouquetFlowerConfigs} stage="cluster" />
          <BouquetBotanicalLayer flowers={bouquetFlowerConfigs} stage="bouquet" />
          {bouquetFlowerConfigs.map((flower) => (
            <Flower key={`bouquet-${flower.id}`} flower={flower} mode="bouquet" />
          ))}
        </div>
        <NoteCard
          noteRef={noteCardRef}
          glowRef={noteGlowRef}
          open={noteOpen}
          note={romanticNote}
          onClick={toggleNoteCard}
        />
        <BouquetWrap />
      </div>

      {phase !== "bouquet" ? (
        <div className="overlay-copy" aria-live="polite">
          <div className="overlay-copy__content" key={phase}>
            <p className="eyebrow">{guidance.eyebrow}</p>
            <div className="guidance-steps" aria-hidden="true">
              <span
                className={`guidance-step${stepOneActive ? " is-active" : ""}${stepOneCurrent ? " is-current" : ""}`}
              >
                arrange
              </span>
              <span
                className={`guidance-step${stepTwoActive ? " is-active" : ""}${stepTwoCurrent ? " is-current" : ""}`}
              >
                wrap
              </span>
            </div>
            <h1>{guidance.title}</h1>
            <p className="overlay-copy__body">{guidance.body}</p>
          </div>
        </div>
      ) : null}

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
        {cueLabel}
      </button>
    </div>
  );
}
