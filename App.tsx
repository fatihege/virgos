import {
  useEffect,
  useLayoutEffect,
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

type BouquetHeart = {
  id: string;
  left: number;
  top: number;
  size: number;
  rotate: number;
  opacity: number;
  duration: number;
  delay: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  orbitStart: number;
  orbitDirection: number;
  wobbleX: number;
  wobbleY: number;
  scale: number;
  color: string;
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

const openingStageAspectRatio = 2;

const romanticNote: NoteCopy = {
  closedLabel: "a note for you",
  eyebrow: "with tenderness",
  title: "For you, always",
  body:
    "If this bouquet could speak, it would only say what my heart already knows: every soft and beautiful thing still finds its way back to you.",
  signature: "With all my love",
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

function buildBouquetHearts(): BouquetHeart[] {
  const palette = [
    "#f7a9c4",
    "#ffc68c",
    "#ffe89f",
    "#d8b8ff",
    "#a8c4ff",
    "#ffd3de",
    "#ffdfb3",
    "#c8b8ff",
  ];
  const rings = [
    {
      count: 9,
      centerLeft: 49.8,
      centerTop: 47.2,
      radiusX: 116,
      radiusY: 64,
      sizeBase: 24,
      sizeStep: 4,
      opacityBase: 0.16,
      durationBase: 28,
      paletteOffset: 0,
      scaleBase: 0.76,
      wobbleX: 6,
      wobbleY: 4,
      angleOffset: -112,
    },
    {
      count: 8,
      centerLeft: 50.6,
      centerTop: 48.1,
      radiusX: 156,
      radiusY: 92,
      sizeBase: 30,
      sizeStep: 4,
      opacityBase: 0.19,
      durationBase: 32,
      paletteOffset: 3,
      scaleBase: 0.84,
      wobbleX: 8,
      wobbleY: 6,
      angleOffset: -84,
    },
    {
      count: 8,
      centerLeft: 49.2,
      centerTop: 49.4,
      radiusX: 204,
      radiusY: 122,
      sizeBase: 34,
      sizeStep: 5,
      opacityBase: 0.22,
      durationBase: 36,
      paletteOffset: 5,
      scaleBase: 0.92,
      wobbleX: 10,
      wobbleY: 8,
      angleOffset: -58,
    },
  ] as const;

  let heartId = 1;

  return rings.flatMap((ring, ringIndex) =>
    Array.from({ length: ring.count }, (_value, index) => {
      const angle = ring.angleOffset + (360 / ring.count) * index + ((index % 2) === 0 ? -6 : 7);

      return {
        id: `heart-${heartId++}`,
        left: ring.centerLeft + ((index % 3) - 1) * 1.4 + (ringIndex - 1) * 0.35,
        top: ring.centerTop + (((index + ringIndex) % 3) - 1) * 1.15,
        size: ring.sizeBase + (index % 4) * ring.sizeStep,
        rotate: ((index * 21 + ringIndex * 17) % 34) - 17,
        opacity: ring.opacityBase + (index % 3) * 0.024,
        duration: ring.durationBase + (index % 4) * 1.8,
        delay: index * 0.28 + ringIndex * 0.16,
        orbitRadiusX: ring.radiusX + ((index % 4) - 1.5) * 14,
        orbitRadiusY: ring.radiusY + (((index + 1) % 4) - 1.5) * 10,
        orbitStart: angle,
        orbitDirection: (index + ringIndex) % 2 === 0 ? 1 : -1,
        wobbleX: ring.wobbleX + (index % 3) * 1.8,
        wobbleY: ring.wobbleY + ((index + 1) % 3) * 1.4,
        scale: ring.scaleBase + (index % 4) * 0.055,
        color: palette[(index + ring.paletteOffset) % palette.length],
      };
    }),
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
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

function getHeartOpacity(target: HTMLElement, multiplier = 1) {
  return Number(target.dataset.opacity ?? 0.24) * multiplier;
}

function getHeartScale(target: HTMLElement, multiplier = 1) {
  return Number(target.dataset.scale ?? 1) * multiplier;
}

function getHeartRotate(target: HTMLElement) {
  return Number(target.dataset.rotate ?? 0);
}

function getHeartOrbitRadiusX(target: HTMLElement) {
  return Number(target.dataset.orbitRadiusX ?? 140);
}

function getHeartOrbitRadiusY(target: HTMLElement) {
  return Number(target.dataset.orbitRadiusY ?? 88);
}

function getHeartOrbitStart(target: HTMLElement) {
  return Number(target.dataset.orbitStart ?? 0);
}

function getHeartOrbitDirection(target: HTMLElement) {
  return Number(target.dataset.orbitDirection ?? 1);
}

function getHeartWobbleX(target: HTMLElement) {
  return Number(target.dataset.wobbleX ?? 8);
}

function getHeartWobbleY(target: HTMLElement) {
  return Number(target.dataset.wobbleY ?? 6);
}

function getHeartDuration(target: HTMLElement) {
  return Number(target.dataset.duration ?? 32);
}

function getHeartDelay(target: HTMLElement) {
  return Number(target.dataset.delay ?? 0);
}

function getHeartOrbitPoint(
  target: HTMLElement,
  orbitScale = 1,
  angleOffset = 0,
): Point {
  const angleDegrees = getHeartOrbitStart(target) + angleOffset * getHeartOrbitDirection(target);
  const radians = (angleDegrees * Math.PI) / 180;
  const wave = (angleDegrees * Math.PI) / 90;

  return {
    x:
      Math.cos(radians) * getHeartOrbitRadiusX(target) * orbitScale +
      Math.sin(wave) * getHeartWobbleX(target),
    y:
      Math.sin(radians) * getHeartOrbitRadiusY(target) * orbitScale +
      Math.cos(wave * 0.86) * getHeartWobbleY(target),
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
          ? getFlowerStyle(flower)
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
                d="M12 19.2 5.8 13.3C3.9 11.5 3.8 8.4 5.5 6.6c1.7-1.9 4.6-2 6.4-.3l.1.2.1-.2c1.8-1.7 4.7-1.6 6.4.3 1.7 1.8 1.6 4.9-.3 6.7Z"
                fill="currentColor"
              />
              <path
                d="M8.9 9.2c.9-1 2.2-1.2 3.2-.6"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeLinecap="round"
                strokeWidth="0.95"
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
      <span className="note-card__occlusion note-card__occlusion--upper" aria-hidden="true">
        <svg viewBox="0 0 36 36" className="note-card__occlusion-svg">
          <path d="M11 34 C10 24 12 14 18 4" className="note-card__occlusion-stem" />
          <path d="M17 13 C9 8 5 12 5 20 C12 21 16 18 17 13 Z" className="note-card__occlusion-leaf note-card__occlusion-leaf--sage" />
          <path d="M18 18 C27 12 31 16 30 23 C23 25 19 23 18 18 Z" className="note-card__occlusion-leaf note-card__occlusion-leaf--moss" />
        </svg>
      </span>
      <span className="note-card__occlusion note-card__occlusion--lower" aria-hidden="true">
        <svg viewBox="0 0 40 28" className="note-card__occlusion-svg">
          <path d="M4 22 C15 18 24 16 36 10" className="note-card__occlusion-stem note-card__occlusion-stem--soft" />
          <path d="M16 18 C9 14 6 18 6 24 C12 24 15 22 16 18 Z" className="note-card__occlusion-leaf note-card__occlusion-leaf--olive" />
          <path d="M27 14 C33 9 37 12 36 18 C30 19 27 18 27 14 Z" className="note-card__occlusion-leaf note-card__occlusion-leaf--sage" />
        </svg>
      </span>
    </button>
  );
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const openingSceneRef = useRef<HTMLDivElement>(null);
  const bouquetRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLButtonElement>(null);
  const noteCardRef = useRef<HTMLButtonElement>(null);
  const noteGlowRef = useRef<HTMLSpanElement>(null);
  const noteBaseRef = useRef<{ width: number; height: number; rotate: number } | null>(null);
  const noteReadyRef = useRef(false);
  const noteAnimatingRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [isInteractive, setIsInteractive] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [openingStageSize, setOpeningStageSize] = useState({ width: 0, height: 0 });
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const pollen = useMemo(() => buildPollen(), []);
  const bouquetHearts = useMemo(() => buildBouquetHearts(), []);
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
  const cueLabel =
    phase === "clustered"
      ? "tap to wrap"
      : phase === "arranging"
        ? "arranging..."
        : phase === "finishing"
          ? "wrapping..."
          : "tap to arrange";
  const openingStageStyle =
    openingStageSize.width > 0 && openingStageSize.height > 0
      ? ({
          width: openingStageSize.width,
          height: openingStageSize.height,
        } as CSSProperties)
      : undefined;

  useLayoutEffect(() => {
    const sceneElement = openingSceneRef.current;

    if (!sceneElement) {
      return undefined;
    }

    const fitOpeningStage = () => {
      const { width: sceneWidth, height: sceneHeight } = sceneElement.getBoundingClientRect();

      if (!sceneWidth || !sceneHeight) {
        return;
      }

      let nextWidth = sceneWidth;
      let nextHeight = nextWidth / openingStageAspectRatio;

      if (nextHeight > sceneHeight) {
        nextHeight = sceneHeight;
        nextWidth = nextHeight * openingStageAspectRatio;
      }

      const roundedWidth = Math.round(nextWidth * 100) / 100;
      const roundedHeight = Math.round(nextHeight * 100) / 100;

      setOpeningStageSize((current) =>
        current.width === roundedWidth && current.height === roundedHeight
          ? current
          : { width: roundedWidth, height: roundedHeight },
      );
    };

    fitOpeningStage();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fitOpeningStage);

      return () => {
        window.removeEventListener("resize", fitOpeningStage);
      };
    }

    const observer = new ResizeObserver(() => {
      fitOpeningStage();
    });

    observer.observe(sceneElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
      const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
      const clusterBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="cluster"] [data-stem-piece]');
      const finalBotanicalPieces = gsap.utils.toArray<SVGElement>('[data-botanical-stage="bouquet"] [data-stem-piece]');
      const impactRings = gsap.utils.toArray<HTMLElement>(".impact-ring");
      const wrapPieces = gsap.utils.toArray<HTMLElement>("[data-wrap-piece]");
      const haloEls = gsap.utils.toArray<HTMLElement>(".bouquet-halo, .bouquet-mist");
      const heartEls = gsap.utils.toArray<HTMLElement>(".bouquet-heart");
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
      gsap.set(heartEls, {
        opacity: 0,
        x: (_index, target) => getHeartOrbitPoint(target, 0.9).x,
        y: (_index, target) => getHeartOrbitPoint(target, 0.9).y + 18,
        scale: (_index, target) => getHeartScale(target, 0.72),
        rotate: (_index, target) => getHeartRotate(target),
      });
      gsap.set(glintEls, { opacity: 0, scale: 0.3 });
      gsap.set(cueRef.current, { opacity: 0, y: 28 });
      gsap.set(noteCardRef.current, {
        opacity: 0,
        x: 0,
        y: 20,
        scale: 0.82,
        rotate: -22,
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
    },
    { scope: root },
  );

  useEffect(() => {
    if (phase !== "clustered" && phase !== "bouquet") {
      return;
    }

    const ctx = gsap.context(() => {
      const bouquetFlowers = gsap.utils.toArray<HTMLElement>(".flower--bouquet");
      const bouquetHeartEls = gsap.utils.toArray<HTMLElement>(".bouquet-heart");
      const bouquetGlintsEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");
      const isFinal = phase === "bouquet";

      if (reducedMotion) {
        gsap.set(bouquetHeartEls, {
          opacity: (_index, target) => getHeartOpacity(target, isFinal ? 1.08 : 0.9),
          x: (_index, target) => getHeartOrbitPoint(target, isFinal ? 1.04 : 0.92).x,
          y: (_index, target) => getHeartOrbitPoint(target, isFinal ? 1.04 : 0.92).y,
          scale: (_index, target) => getHeartScale(target, isFinal ? 1.06 : 0.98),
          rotate: (_index, target) => getHeartRotate(target),
        });
        return;
      }

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

      bouquetHeartEls.forEach((heart, index) => {
        const duration = getHeartDuration(heart) + (isFinal ? 0 : 4);
        const baseRotate = getHeartRotate(heart);
        const orbitScale = isFinal ? 1.04 : 0.92;
        const orbitSteps = [60, 120, 180, 240, 300, 360];
        const startPoint = getHeartOrbitPoint(heart, orbitScale);

        gsap.set(heart, {
          x: startPoint.x,
          y: startPoint.y,
          rotate: baseRotate,
          scale: getHeartScale(heart, isFinal ? 1.02 : 0.94),
          opacity: getHeartOpacity(heart, isFinal ? 0.98 : 0.82),
        });

        const orbitTimeline = gsap.timeline({
          repeat: -1,
          delay: getHeartDelay(heart),
          defaults: { ease: "none" },
        });

        orbitSteps.forEach((angleOffset, stepIndex) => {
          const point = getHeartOrbitPoint(heart, orbitScale, angleOffset);
          const shimmer = Math.sin((angleOffset * Math.PI) / 180);

          orbitTimeline.to(heart, {
            x: point.x,
            y: point.y,
            rotate:
              baseRotate +
              shimmer * (isFinal ? 7 : 5.5) +
              stepIndex * 0.45 * getHeartOrbitDirection(heart),
            scale: getHeartScale(heart, (isFinal ? 1.03 : 0.95) + shimmer * 0.05),
            opacity: getHeartOpacity(heart, (isFinal ? 1 : 0.86) + shimmer * 0.05),
            duration: duration / orbitSteps.length,
          });
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
        rotate: -22,
        width: "",
        height: "",
      });
      gsap.set(noteGlow, { opacity: 0, scale: 0.8 });
      return;
    }

    gsap.killTweensOf([noteCard, noteGlow]);

    if (reducedMotion) {
      gsap.set(noteCard, { opacity: 1, x: 0, y: 0, scale: 1, rotate: -18 });
      gsap.set(noteGlow, { opacity: 0.26, scale: 1 });
      noteBaseRef.current = {
        width: noteCard.getBoundingClientRect().width,
        height: noteCard.getBoundingClientRect().height,
        rotate: -18,
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
          rotate: -18,
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
    const heartEls = gsap.utils.toArray<HTMLElement>(".bouquet-heart");
    const bouquetFlowersFrame = root.current?.querySelector<HTMLElement>(".bouquet-flowers");

    if (!bouquetFlowersFrame) {
      return;
    }

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
    gsap.killTweensOf(heartEls);
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
          heartEls,
          {
            opacity: (_index, target) => getHeartOpacity(target, 0.84),
            x: (_index, target) => getHeartOrbitPoint(target, 0.92).x,
            y: (_index, target) => getHeartOrbitPoint(target, 0.92).y,
            scale: (_index, target) => getHeartScale(target, 0.98),
            rotate: (_index, target) => getHeartRotate(target),
            duration: 0.26,
            stagger: 0.018,
          },
          0.18,
        )
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
          heartEls,
          {
            opacity: (_index, target) => getHeartOpacity(target, 0.88),
            x: (_index, target) => getHeartOrbitPoint(target, 0.92).x,
            y: (_index, target) => getHeartOrbitPoint(target, 0.92).y,
            scale: (_index, target) => getHeartScale(target, 1.02),
            rotate: (_index, target) => getHeartRotate(target),
            duration: 0.62,
            stagger: { each: 0.03, from: "random" },
            ease: motion.easeReveal,
          },
          0.54,
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
    const heartEls = gsap.utils.toArray<HTMLElement>(".bouquet-heart");
    const glintEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");

    setIsInteractive(false);
    setPhase("finishing");

    gsap.killTweensOf(bouquetFlowers);
    gsap.killTweensOf(clusterBotanicalPieces);
    gsap.killTweensOf(finalBotanicalPieces);
    gsap.killTweensOf(wrapPieces);
    gsap.killTweensOf(haloEls);
    gsap.killTweensOf(heartEls);
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
        .to(
          heartEls,
          {
            opacity: (_index, target) => getHeartOpacity(target, 1),
            x: (_index, target) => getHeartOrbitPoint(target, 1.04).x,
            y: (_index, target) => getHeartOrbitPoint(target, 1.04).y,
            scale: (_index, target) => getHeartScale(target, 1.06),
            rotate: (_index, target) => getHeartRotate(target),
            duration: 0.26,
            stagger: 0.016,
          },
          0.12,
        )
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
          heartEls,
          {
            opacity: (_index, target) => getHeartOpacity(target, 1.02),
            x: (_index, target) => getHeartOrbitPoint(target, 1.04).x,
            y: (_index, target) => getHeartOrbitPoint(target, 1.04).y,
            scale: (_index, target) => getHeartScale(target, 1.08),
            rotate: (_index, target) => getHeartRotate(target) + (_index % 2 === 0 ? -3 : 3),
            duration: 0.52,
            stagger: 0.03,
            ease: motion.easeReveal,
          },
          0.2,
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

      <div className="opening-scene" ref={openingSceneRef}>
        <div className="opening-scene__stage" style={openingStageStyle}>
          {openingFlowerConfigs.map((flower) => (
            <Flower key={flower.id} flower={flower} mode="opening" />
          ))}
        </div>
      </div>

      <div className="bouquet-scene" ref={bouquetRef}>
        <div className="bouquet-halo" />
        <div className="bouquet-mist" />
        <div className="bouquet-hearts" aria-hidden="true">
          {bouquetHearts.map((heart) => (
            <span
              key={heart.id}
              className="bouquet-heart"
              data-opacity={heart.opacity}
              data-scale={heart.scale}
              data-rotate={heart.rotate}
              data-orbit-radius-x={heart.orbitRadiusX}
              data-orbit-radius-y={heart.orbitRadiusY}
              data-orbit-start={heart.orbitStart}
              data-orbit-direction={heart.orbitDirection}
              data-wobble-x={heart.wobbleX}
              data-wobble-y={heart.wobbleY}
              data-duration={heart.duration}
              data-delay={heart.delay}
              style={
                {
                  left: `${heart.left}%`,
                  top: `${heart.top}%`,
                  width: `${heart.size}px`,
                  height: `${heart.size}px`,
                  color: heart.color,
                  "--heart-glow-color": heart.color,
                } as CSSProperties
              }
            >
              <svg className="bouquet-heart__svg" viewBox="0 0 100 90" role="presentation" aria-hidden="true">
                <path d="M50 86 C46 83 40 78 35 73 C16 56 4 43 4 26 C4 11 15 0 30 0 C39 0 46 4 50 12 C54 4 61 0 70 0 C85 0 96 11 96 26 C96 43 84 56 65 73 C60 78 54 83 50 86 Z" fill="currentColor" />
              </svg>
            </span>
          ))}
        </div>
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
