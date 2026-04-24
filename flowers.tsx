import type { CSSProperties } from "react";

export type FlowerVariant =
  | "coral-long-daisy"
  | "blush-stamen-cup"
  | "sunny-button-daisy"
  | "periwinkle-dot-bloom"
  | "ink-tulip-spray"
  | "blue-round-daisy"
  | "orange-star-lily"
  | "yellow-wide-petal"
  | "tiny-field-cluster"
  | "berry-branch"
  | "leafy-spray"
  | "elegant-bud"
  | "lavender-pinwheel"
  | "cream-layered-rose"
  | "blue-heart-posy"
  | "red-poppy-burst";

export type PaletteName =
  | "cobalt"
  | "periwinkle"
  | "coral"
  | "orange"
  | "blush"
  | "butter"
  | "lavender"
  | "cream";

export type BouquetRole = "hero" | "support" | "filler" | "foliage" | "opening-only";

export type MotionWeight = "heavy" | "medium" | "light";

type Palette = {
  petals: string;
  petalsAlt?: string;
  center: string;
  core: string;
  detail: string;
};

export type FlowerConfig = {
  id: string;
  variant: FlowerVariant;
  palette: PaletteName;
  bouquetRole: BouquetRole;
  motionWeight: MotionWeight;
  size: number;
  startX: number;
  startY: number;
  startRotation: number;
  depth: number;
  bouquetTargetX: number;
  bouquetTargetY: number;
  bouquetRotation: number;
  bouquetLayer: "back" | "mid" | "front";
  bouquetScale?: number;
  clusterTargetX: number;
  clusterTargetY: number;
  clusterRotation: number;
  clusterScale: number;
  showInOpening?: boolean;
  showInBouquet?: boolean;
  showOpeningStem?: boolean;
  isCenterMessage?: boolean;
};

export const palettes: Record<PaletteName, Palette> = {
  cobalt: {
    petals: "#456bdf",
    petalsAlt: "#7ea1f2",
    center: "#ffd842",
    core: "#fff7db",
    detail: "#274cbf",
  },
  periwinkle: {
    petals: "#aeb9ed",
    petalsAlt: "#cbd4ff",
    center: "#f26b44",
    core: "#fff1df",
    detail: "#6f7fd6",
  },
  coral: {
    petals: "#f05436",
    petalsAlt: "#ff7c53",
    center: "#202025",
    core: "#fff6df",
    detail: "#bd3a2e",
  },
  orange: {
    petals: "#ff7c2d",
    petalsAlt: "#ffae45",
    center: "#202025",
    core: "#cbf1e6",
    detail: "#d6512e",
  },
  blush: {
    petals: "#f4a4b6",
    petalsAlt: "#ffd1dc",
    center: "#202025",
    core: "#fff2e8",
    detail: "#cc687f",
  },
  butter: {
    petals: "#f8d72f",
    petalsAlt: "#ffe86e",
    center: "#202025",
    core: "#fff9df",
    detail: "#d9a72a",
  },
  lavender: {
    petals: "#9f94de",
    petalsAlt: "#c8bdf8",
    center: "#ffe47b",
    core: "#fff4d3",
    detail: "#7667bf",
  },
  cream: {
    petals: "#ffe6c8",
    petalsAlt: "#fff2dc",
    center: "#e97055",
    core: "#fffaf0",
    detail: "#d7ad75",
  },
};

export const flowerConfigs: FlowerConfig[] = [
  {
    id: "f-1",
    variant: "coral-long-daisy",
    palette: "coral",
    bouquetRole: "support",
    motionWeight: "medium",
    size: 15,
    startX: 11,
    startY: 12,
    startRotation: -10,
    depth: 0.67,
    bouquetTargetX: -15,
    bouquetTargetY: -4,
    bouquetRotation: -9,
    bouquetLayer: "mid",
    bouquetScale: 0.74,
    clusterTargetX: 34,
    clusterTargetY: 43,
    clusterRotation: -10,
    clusterScale: 0.7,
    showOpeningStem: true,
  },
  {
    id: "f-2",
    variant: "blush-stamen-cup",
    palette: "blush",
    bouquetRole: "filler",
    motionWeight: "light",
    size: 14,
    startX: 27,
    startY: 7,
    startRotation: 8,
    depth: 0.56,
    bouquetTargetX: 12,
    bouquetTargetY: -18,
    bouquetRotation: 8,
    bouquetLayer: "back",
    bouquetScale: 0.68,
    clusterTargetX: 61,
    clusterTargetY: 23,
    clusterRotation: 8,
    clusterScale: 0.56,
    showOpeningStem: true,
  },
  {
    id: "f-3",
    variant: "sunny-button-daisy",
    palette: "butter",
    bouquetRole: "support",
    motionWeight: "medium",
    size: 13,
    startX: 45,
    startY: 11,
    startRotation: -6,
    depth: 0.62,
    bouquetTargetX: -1,
    bouquetTargetY: -20,
    bouquetRotation: -3,
    bouquetLayer: "back",
    bouquetScale: 0.74,
    clusterTargetX: 47,
    clusterTargetY: 20,
    clusterRotation: -3,
    clusterScale: 0.62,
    showOpeningStem: true,
  },
  {
    id: "f-4",
    variant: "periwinkle-dot-bloom",
    palette: "periwinkle",
    bouquetRole: "support",
    motionWeight: "medium",
    size: 15,
    startX: 67,
    startY: 8,
    startRotation: 6,
    depth: 0.66,
    bouquetTargetX: 16,
    bouquetTargetY: -8,
    bouquetRotation: 7,
    bouquetLayer: "mid",
    bouquetScale: 0.78,
    clusterTargetX: 63,
    clusterTargetY: 39,
    clusterRotation: 7,
    clusterScale: 0.68,
    showOpeningStem: true,
  },
  {
    id: "f-5",
    variant: "ink-tulip-spray",
    palette: "butter",
    bouquetRole: "filler",
    motionWeight: "light",
    size: 15,
    startX: 84,
    startY: 18,
    startRotation: -10,
    depth: 0.5,
    bouquetTargetX: 24,
    bouquetTargetY: 1,
    bouquetRotation: 12,
    bouquetLayer: "back",
    bouquetScale: 0.58,
    clusterTargetX: 68,
    clusterTargetY: 31,
    clusterRotation: 12,
    clusterScale: 0.5,
    showOpeningStem: true,
  },
  {
    id: "f-6",
    variant: "blue-round-daisy",
    palette: "cobalt",
    bouquetRole: "support",
    motionWeight: "medium",
    size: 14,
    startX: 14,
    startY: 37,
    startRotation: 10,
    depth: 0.64,
    bouquetTargetX: -23,
    bouquetTargetY: 9,
    bouquetRotation: -12,
    bouquetLayer: "front",
    bouquetScale: 0.72,
    clusterTargetX: 27,
    clusterTargetY: 62,
    clusterRotation: -12,
    clusterScale: 0.66,
    showOpeningStem: true,
  },
  {
    id: "f-7",
    variant: "orange-star-lily",
    palette: "orange",
    bouquetRole: "support",
    motionWeight: "medium",
    size: 14,
    startX: 36,
    startY: 35,
    startRotation: -14,
    depth: 0.7,
    bouquetTargetX: -10,
    bouquetTargetY: 2,
    bouquetRotation: -8,
    bouquetLayer: "front",
    bouquetScale: 0.76,
    clusterTargetX: 37,
    clusterTargetY: 62,
    clusterRotation: -8,
    clusterScale: 0.7,
    showOpeningStem: true,
  },
  {
    id: "f-8",
    variant: "yellow-wide-petal",
    palette: "butter",
    bouquetRole: "hero",
    motionWeight: "heavy",
    size: 15,
    startX: 61,
    startY: 36,
    startRotation: 6,
    depth: 0.84,
    bouquetTargetX: 16,
    bouquetTargetY: -1,
    bouquetRotation: 8,
    bouquetLayer: "front",
    bouquetScale: 0.86,
    clusterTargetX: 62,
    clusterTargetY: 60,
    clusterRotation: 8,
    clusterScale: 0.78,
    showOpeningStem: true,
  },
  {
    id: "f-9",
    variant: "tiny-field-cluster",
    palette: "butter",
    bouquetRole: "filler",
    motionWeight: "light",
    size: 13,
    startX: 80,
    startY: 39,
    startRotation: -4,
    depth: 0.5,
    bouquetTargetX: 27,
    bouquetTargetY: 4,
    bouquetRotation: 13,
    bouquetLayer: "mid",
    bouquetScale: 0.62,
    clusterTargetX: 70,
    clusterTargetY: 56,
    clusterRotation: 11,
    clusterScale: 0.56,
    showOpeningStem: true,
  },
  {
    id: "f-10",
    variant: "berry-branch",
    palette: "cobalt",
    bouquetRole: "foliage",
    motionWeight: "light",
    size: 11,
    startX: 12,
    startY: 62,
    startRotation: -12,
    depth: 0.55,
    bouquetTargetX: -29,
    bouquetTargetY: 9,
    bouquetRotation: -14,
    bouquetLayer: "mid",
    bouquetScale: 0.66,
    clusterTargetX: 18,
    clusterTargetY: 58,
    clusterRotation: -14,
    clusterScale: 0.6,
    showOpeningStem: true,
  },
  {
    id: "f-11",
    variant: "lavender-pinwheel",
    palette: "lavender",
    bouquetRole: "support",
    motionWeight: "medium",
    size: 15,
    startX: 27,
    startY: 59,
    startRotation: 9,
    depth: 0.72,
    bouquetTargetX: -20,
    bouquetTargetY: -16,
    bouquetRotation: -9,
    bouquetLayer: "back",
    bouquetScale: 0.76,
    clusterTargetX: 29,
    clusterTargetY: 37,
    clusterRotation: -8,
    clusterScale: 0.72,
    showOpeningStem: true,
  },
  {
    id: "f-12",
    variant: "elegant-bud",
    palette: "blush",
    bouquetRole: "filler",
    motionWeight: "light",
    size: 14,
    startX: 50,
    startY: 57,
    startRotation: -4,
    depth: 0.58,
    bouquetTargetX: 3,
    bouquetTargetY: -14,
    bouquetRotation: -2,
    bouquetLayer: "back",
    bouquetScale: 0.58,
    clusterTargetX: 53,
    clusterTargetY: 26,
    clusterRotation: -2,
    clusterScale: 0.54,
    showOpeningStem: true,
  },
  {
    id: "f-13",
    variant: "cream-layered-rose",
    palette: "cream",
    bouquetRole: "hero",
    motionWeight: "heavy",
    size: 16,
    startX: 72,
    startY: 60,
    startRotation: 5,
    depth: 0.9,
    bouquetTargetX: -1,
    bouquetTargetY: -14,
    bouquetRotation: 0,
    bouquetLayer: "front",
    bouquetScale: 0.98,
    clusterTargetX: 47,
    clusterTargetY: 46,
    clusterRotation: 0,
    clusterScale: 0.86,
    showOpeningStem: true,
    isCenterMessage: true,
  },
  {
    id: "f-14",
    variant: "blue-heart-posy",
    palette: "cobalt",
    bouquetRole: "filler",
    motionWeight: "light",
    size: 16,
    startX: 82,
    startY: 70,
    startRotation: -8,
    depth: 0.6,
    bouquetTargetX: 9,
    bouquetTargetY: -20,
    bouquetRotation: 8,
    bouquetLayer: "back",
    bouquetScale: 0.6,
    clusterTargetX: 58,
    clusterTargetY: 22,
    clusterRotation: 8,
    clusterScale: 0.56,
    showOpeningStem: true,
  },
  {
    id: "f-15",
    variant: "leafy-spray",
    palette: "butter",
    bouquetRole: "foliage",
    motionWeight: "light",
    size: 12,
    startX: 21,
    startY: 82,
    startRotation: 11,
    depth: 0.57,
    bouquetTargetX: 24,
    bouquetTargetY: 19,
    bouquetRotation: -11,
    bouquetLayer: "back",
    bouquetScale: 0.68,
    clusterTargetX: 68,
    clusterTargetY: 65,
    clusterRotation: -13,
    clusterScale: 0.6,
    showOpeningStem: true,
  },
  {
    id: "f-16",
    variant: "red-poppy-burst",
    palette: "coral",
    bouquetRole: "hero",
    motionWeight: "heavy",
    size: 15,
    startX: 57,
    startY: 82,
    startRotation: -11,
    depth: 0.82,
    bouquetTargetX: -8,
    bouquetTargetY: -8,
    bouquetRotation: -7,
    bouquetLayer: "front",
    bouquetScale: 0.82,
    clusterTargetX: 39,
    clusterTargetY: 68,
    clusterRotation: -7,
    clusterScale: 0.76,
    showOpeningStem: true,
  },
];

export function getFlowerStyle(flower: FlowerConfig): CSSProperties {
  return {
    left: `${flower.startX}%`,
    top: `${flower.startY}%`,
    width: `clamp(88px, ${flower.size}vw, 220px)`,
    zIndex: Math.round(40 + flower.depth * 30),
    "--depth": String(flower.depth),
  } as CSSProperties;
}

function Petals({
  count,
  rx,
  ry,
  fill,
  opacity = 1,
  rotateStep = 0,
  offsetY = -28,
}: {
  count: number;
  rx: number;
  ry: number;
  fill: string;
  opacity?: number;
  rotateStep?: number;
  offsetY?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = (360 / count) * index + rotateStep;

        return (
          <ellipse
            key={`${fill}-${angle}`}
            cx="50"
            cy={50 + offsetY}
            rx={rx}
            ry={ry}
            fill={fill}
            opacity={opacity}
            transform={`rotate(${angle} 50 50)`}
          />
        );
      })}
    </>
  );
}

function PathPetals({
  count,
  d,
  fill,
  opacity = 1,
  rotateStep = 0,
}: {
  count: number;
  d: string;
  fill: string;
  opacity?: number;
  rotateStep?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = (360 / count) * index + rotateStep;

        return <path key={`${fill}-${angle}`} d={d} fill={fill} opacity={opacity} transform={`rotate(${angle} 50 50)`} />;
      })}
    </>
  );
}

function DotRing({
  count,
  radius,
  dotRadius,
  fill,
  centerX = 50,
  centerY = 50,
  rotateStep = 0,
}: {
  count: number;
  radius: number;
  dotRadius: number;
  fill: string;
  centerX?: number;
  centerY?: number;
  rotateStep?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = (360 / count) * index + rotateStep;
        const x = centerX + Math.cos((angle * Math.PI) / 180) * radius;
        const y = centerY + Math.sin((angle * Math.PI) / 180) * radius;

        return <circle key={`${fill}-${angle}`} cx={x} cy={y} r={dotRadius} fill={fill} />;
      })}
    </>
  );
}

function Leaf({
  d,
  fill,
  stroke,
  opacity = 1,
}: {
  d: string;
  fill: string;
  stroke?: string;
  opacity?: number;
}) {
  return <path d={d} fill={fill} stroke={stroke} strokeWidth="1.1" opacity={opacity} />;
}

function VariantShape({
  variant,
  palette,
}: {
  variant: FlowerVariant;
  palette: Palette;
}) {
  const ink = "#202025";
  const warmCream = "#fff7e8";
  const leaf = "#80aa72";
  const leafDark = "#437854";
  const berryBlue = "#7fa1e9";

  switch (variant) {
    case "coral-long-daisy":
      return (
        <>
          <Petals count={12} rx={5.6} ry={25.5} fill={palette.petals} rotateStep={6} offsetY={-27} />
          <Petals count={12} rx={2.4} ry={8} fill={palette.petalsAlt ?? palette.petals} opacity={0.45} rotateStep={6} offsetY={-17} />
          <circle cx="50" cy="50" r="10.5" fill={ink} />
          <circle cx="50" cy="50" r="3.1" fill={palette.core} opacity="0.9" />
        </>
      );
    case "blush-stamen-cup":
      return (
        <>
          {[-44, -22, 0, 22, 44].map((angle) => (
            <path
              key={angle}
              d="M50 58 C39 31 35 13 44 7 C54 12 61 33 50 58 Z"
              fill={angle === 0 ? palette.petals : palette.petalsAlt ?? palette.petals}
              transform={`rotate(${angle} 50 58)`}
            />
          ))}
          <path d="M35 58 C41 67 59 67 65 58 C60 75 40 75 35 58 Z" fill={palette.core} opacity="0.78" />
          <g stroke={ink} strokeWidth="1.8" strokeLinecap="round">
            {[-22, -11, 0, 11, 22].map((angle) => (
              <line
                key={angle}
                x1="50"
                y1="56"
                x2={50 + Math.sin((angle * Math.PI) / 180) * 19}
                y2={25 - Math.abs(angle) * 0.08}
              />
            ))}
          </g>
          <g fill={palette.detail}>
            {[-22, -11, 0, 11, 22].map((angle) => (
              <circle
                key={angle}
                cx={50 + Math.sin((angle * Math.PI) / 180) * 19}
                cy={25 - Math.abs(angle) * 0.08}
                r="3"
              />
            ))}
          </g>
          <circle cx="50" cy="58" r="6.5" fill={ink} />
        </>
      );
    case "sunny-button-daisy":
      return (
        <>
          <Petals count={8} rx={10.5} ry={20} fill={palette.petals} rotateStep={3} offsetY={-24} />
          <circle cx="50" cy="50" r="13.5" fill={palette.core} />
          <g fill={ink}>
            <circle cx="45" cy="49" r="1.9" />
            <circle cx="54" cy="49" r="1.9" />
            <circle cx="50" cy="56" r="1.9" />
          </g>
        </>
      );
    case "periwinkle-dot-bloom":
      return (
        <>
          <Petals count={5} rx={14.5} ry={20.5} fill={palette.petals} rotateStep={18} offsetY={-23} />
          <circle cx="50" cy="50" r="13.5" fill={palette.center} />
          <DotRing count={8} radius={6} dotRadius={1.7} fill={ink} rotateStep={18} />
          <circle cx="50" cy="50" r="2" fill={ink} />
        </>
      );
    case "ink-tulip-spray":
      return (
        <>
          {[
            { x: 28, y: 49, color: palette.petals, scale: 0.75, rotate: -15 },
            { x: 52, y: 39, color: palettes.cobalt.petals, scale: 0.92, rotate: 4 },
            { x: 76, y: 51, color: palettes.butter.petals, scale: 0.78, rotate: 16 },
          ].map((bud) => (
            <g key={`${bud.x}-${bud.y}`} transform={`translate(${bud.x - 50} ${bud.y - 50}) scale(${bud.scale}) rotate(${bud.rotate} 50 50)`}>
              <path d="M50 19 C41 15 33 21 31 33 C33 47 42 56 50 64 C58 56 67 47 69 33 C67 21 59 15 50 19 Z" fill={bud.color} />
              <path d="M50 21 C45 31 43 44 50 62 C57 44 55 31 50 21 Z" fill={warmCream} opacity="0.2" />
              <g stroke={ink} strokeWidth="1.7" strokeLinecap="round">
                <line x1="43" y1="21" x2="40" y2="12" />
                <line x1="50" y1="18" x2="50" y2="9" />
                <line x1="57" y1="21" x2="60" y2="12" />
              </g>
            </g>
          ))}
        </>
      );
    case "blue-round-daisy":
      return (
        <>
          <Petals count={8} rx={9.5} ry={18.5} fill={palette.petalsAlt ?? palette.petals} rotateStep={9} offsetY={-22} />
          <Petals count={8} rx={7.2} ry={15} fill={palette.petals} rotateStep={31} offsetY={-19} opacity={0.82} />
          <circle cx="50" cy="50" r="12" fill={palette.center} />
          <circle cx="50" cy="50" r="5.2" fill={palette.detail} />
        </>
      );
    case "orange-star-lily":
      return (
        <>
          <PathPetals count={6} d="M50 55 C46 29 38 13 29 7 C27 29 35 48 50 55 Z" fill={palette.petals} rotateStep={0} />
          <PathPetals count={6} d="M50 55 C47 37 42 28 37 23 C36 39 41 50 50 55 Z" fill={palette.petalsAlt ?? palette.petals} rotateStep={18} opacity={0.88} />
          <g stroke={palette.detail} strokeWidth="1.3" strokeLinecap="round" opacity="0.6">
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const x = 50 + Math.cos((angle * Math.PI) / 180) * 21;
              const y = 50 + Math.sin((angle * Math.PI) / 180) * 21;

              return <line key={angle} x1="50" y1="50" x2={x} y2={y} />;
            })}
          </g>
          <circle cx="50" cy="50" r="7" fill={warmCream} />
          <DotRing count={6} radius={4.4} dotRadius={1.4} fill="#5aa99a" />
        </>
      );
    case "yellow-wide-petal":
      return (
        <>
          <PathPetals count={5} d="M50 55 C35 35 33 16 46 8 C60 15 64 35 50 55 Z" fill={palette.petals} rotateStep={6} />
          <PathPetals count={5} d="M50 55 C42 38 42 23 49 17 C56 24 58 39 50 55 Z" fill={palette.petalsAlt ?? palette.petals} rotateStep={42} opacity={0.58} />
          <g stroke={ink} strokeWidth="1.6" strokeLinecap="round">
            {[-36, -18, 0, 18, 36].map((angle) => (
              <line
                key={angle}
                x1="50"
                y1="50"
                x2={50 + Math.sin((angle * Math.PI) / 180) * 16}
                y2={35 - Math.abs(angle) * 0.04}
              />
            ))}
          </g>
          <circle cx="50" cy="50" r="7.3" fill={ink} />
          <circle cx="50" cy="50" r="2.4" fill={warmCream} opacity="0.88" />
        </>
      );
    case "tiny-field-cluster":
      return (
        <>
          {[
            { x: 30, y: 40, color: palette.petals, size: 0.8 },
            { x: 56, y: 32, color: palette.petalsAlt ?? palette.petals, size: 0.66 },
            { x: 70, y: 55, color: palettes.coral.petals, size: 0.7 },
            { x: 42, y: 64, color: palettes.cobalt.petalsAlt ?? palettes.cobalt.petals, size: 0.58 },
            { x: 56, y: 55, color: palettes.blush.petals, size: 0.5 },
          ].map((bloom, index) => (
            <g key={`${bloom.x}-${bloom.y}`} transform={`translate(${bloom.x - 50} ${bloom.y - 50}) scale(${bloom.size})`}>
              <Petals count={5} rx={5.8} ry={10.5} fill={bloom.color} rotateStep={index * 13} offsetY={-12} />
              <circle cx="50" cy="50" r="4.5" fill={warmCream} />
              <circle cx="50" cy="50" r="2" fill={palette.detail} opacity="0.65" />
            </g>
          ))}
        </>
      );
    case "berry-branch":
      return (
        <>
          <g fill={berryBlue}>
            <circle cx="50" cy="17" r="7.3" />
            <circle cx="34" cy="29" r="6.6" />
            <circle cx="66" cy="31" r="6.6" />
            <circle cx="25" cy="49" r="6" />
            <circle cx="50" cy="51" r="6.4" />
            <circle cx="75" cy="48" r="6" />
          </g>
          <g fill={palette.detail} opacity="0.74">
            <circle cx="50" cy="17" r="2" />
            <circle cx="34" cy="29" r="1.8" />
            <circle cx="66" cy="31" r="1.8" />
            <circle cx="25" cy="49" r="1.6" />
            <circle cx="50" cy="51" r="1.8" />
            <circle cx="75" cy="48" r="1.6" />
          </g>
        </>
      );
    case "leafy-spray":
      return (
        <>
          <Leaf d="M48 48 C27 28 14 32 10 50 C24 63 39 62 48 48 Z" fill="#99bf85" stroke={leafDark} />
          <Leaf d="M52 47 C71 24 85 29 91 48 C77 60 62 61 52 47 Z" fill="#6da76c" stroke={leafDark} />
          <Leaf d="M47 58 C26 60 17 73 19 88 C34 90 45 77 47 58 Z" fill="#bdd6a8" stroke={leafDark} />
          <Leaf d="M54 60 C70 62 81 75 78 88 C65 89 56 76 54 60 Z" fill="#88b87a" stroke={leafDark} />
          <g fill={warmCream}>
            <circle cx="25" cy="39" r="3.8" />
            <circle cx="78" cy="39" r="3.4" />
            <circle cx="51" cy="52" r="3.2" />
          </g>
        </>
      );
    case "elegant-bud":
      return (
        <>
          <path d="M50 15 C40 18 34 31 38 47 C41 59 48 66 50 70 C52 66 59 59 62 47 C66 31 60 18 50 15 Z" fill={palette.petals} />
          <path d="M50 15 C47 29 47 51 50 69 C55 52 57 32 50 15 Z" fill={palette.petalsAlt ?? palette.petals} opacity="0.7" />
          <path d="M38 47 C43 42 47 36 50 15 C50 41 47 59 50 70 C44 61 40 55 38 47 Z" fill={palette.detail} opacity="0.2" />
          <path d="M63 48 C58 43 53 36 50 15 C51 42 54 59 50 70 C57 61 61 55 63 48 Z" fill={warmCream} opacity="0.17" />
        </>
      );
    case "lavender-pinwheel":
      return (
        <>
          {Array.from({ length: 5 }, (_, index) => {
            const angle = index * 72 - 12;

            return (
              <path
                key={angle}
                d="M50 52 C36 45 29 31 34 20 C49 19 62 34 50 52 Z"
                fill={index % 2 === 0 ? palette.petals : palette.petalsAlt ?? palette.petals}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
          <circle cx="50" cy="50" r="12.5" fill={palette.center} />
          <circle cx="50" cy="50" r="4.4" fill={palette.detail} opacity="0.62" />
        </>
      );
    case "cream-layered-rose":
      return (
        <>
          <PathPetals count={7} d="M50 57 C39 41 38 21 50 11 C62 21 61 41 50 57 Z" fill={palette.petals} rotateStep={8} />
          <PathPetals count={7} d="M50 55 C43 43 43 28 50 20 C57 28 57 43 50 55 Z" fill={palette.petalsAlt ?? palette.petals} rotateStep={33} opacity={0.92} />
          <path d="M36 51 C40 36 57 34 64 48 C59 62 43 65 36 51 Z" fill={palette.core} />
          <path d="M43 50 C46 42 56 42 58 50 C55 58 46 58 43 50 Z" fill={palette.center} opacity="0.8" />
          <circle cx="50" cy="50" r="3.2" fill={warmCream} opacity="0.86" />
        </>
      );
    case "blue-heart-posy":
      return (
        <>
          <g transform="rotate(-12 50 50)">
            <path d="M45 58 C26 46 25 27 39 23 C46 20 51 26 50 35 C56 25 65 23 70 31 C77 43 63 55 45 58 Z" fill={palette.petals} />
            <path d="M57 62 C42 51 42 36 53 32 C60 29 65 35 63 42 C69 35 76 36 80 43 C85 54 72 63 57 62 Z" fill={palettes.butter.petals} />
          </g>
          <g stroke={ink} strokeWidth="1.6" strokeLinecap="round">
            <line x1="43" y1="38" x2="39" y2="29" />
            <line x1="50" y1="36" x2="50" y2="27" />
            <line x1="62" y1="43" x2="67" y2="34" />
          </g>
        </>
      );
    case "red-poppy-burst":
      return (
        <>
          {[
            "M50 50 C30 38 25 20 39 12 C51 17 57 33 50 50 Z",
            "M50 50 C62 31 79 27 86 40 C79 53 63 58 50 50 Z",
            "M50 50 C68 61 70 79 55 87 C45 78 41 62 50 50 Z",
            "M50 50 C35 64 18 61 15 47 C25 38 40 39 50 50 Z",
          ].map((d, index) => (
            <path key={d} d={d} fill={index % 2 === 0 ? palette.petals : palette.petalsAlt ?? palette.petals} />
          ))}
          <circle cx="50" cy="50" r="11.5" fill={ink} />
          <DotRing count={9} radius={6.2} dotRadius={1.45} fill={palette.core} rotateStep={8} />
        </>
      );
  }
}

export function renderStemArt(
  variant: FlowerVariant,
  mode: "opening" | "bouquet",
) {
  const stem = "#5f8654";
  const stemDark = "#3f6646";
  const leaf = "#8dab80";
  const leafDark = "#506d50";
  const leafLight = "#bfd1b1";
  const ink = "#202025";
  const yellow = palettes.butter.petals;
  const coral = palettes.coral.petals;
  const blue = palettes.cobalt.petals;
  const branchOpacity = mode === "opening" ? 0.9 : 1;

  switch (variant) {
    case "coral-long-daisy":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 18 C47 66 51 122 49 176" stroke={stem} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <Leaf d="M49 86 C28 72 15 80 14 105 C32 108 44 99 49 86 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 108 C71 95 83 102 85 126 C67 128 56 121 51 108 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "blush-stamen-cup":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 18 C46 52 51 118 50 176" stroke={stem} strokeWidth="3.9" strokeLinecap="round" fill="none" />
          <path d="M50 68 C63 58 72 51 80 45" stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.76" />
          <Leaf d="M63 58 C76 50 87 54 90 69 C77 74 69 70 63 58 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M48 105 C31 95 19 102 18 124 C35 126 45 118 48 105 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "sunny-button-daisy":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 19 C51 60 47 124 50 176" stroke={stem} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M50 90 C39 82 29 76 20 72" stroke={stemDark} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.76" />
          <Leaf d="M33 80 C18 76 10 84 11 101 C25 103 34 96 33 80 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M52 119 C69 106 81 111 84 133 C68 136 58 130 52 119 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "periwinkle-dot-bloom":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 18 C47 66 52 122 50 176" stroke={stem} strokeWidth="4.3" strokeLinecap="round" fill="none" />
          <path d="M49 84 C39 75 30 68 21 63" stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.72" />
          <path d="M51 99 C62 90 70 82 78 75" stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.72" />
          <Leaf d="M49 116 C30 107 20 116 19 137 C35 139 46 131 49 116 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M64 90 C79 82 89 87 91 105 C76 107 68 102 64 90 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "ink-tulip-spray":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 34 C48 78 51 126 50 176" stroke={stem} strokeWidth="3.8" strokeLinecap="round" fill="none" />
          <g stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.78">
            <path d="M50 58 C38 48 28 40 22 34" />
            <path d="M50 50 C50 35 51 25 52 14" />
            <path d="M50 62 C63 50 72 42 79 36" />
          </g>
          <Leaf d="M49 102 C31 95 20 104 18 126 C34 129 45 121 49 102 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 126 C69 113 81 120 83 144 C66 145 57 139 51 126 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "blue-round-daisy":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 18 C54 58 46 116 50 176" stroke={stem} strokeWidth="4.2" strokeLinecap="round" fill="none" />
          <Leaf d="M48 86 C27 75 15 82 14 105 C32 108 44 100 48 86 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M52 113 C72 101 84 107 86 130 C68 132 58 125 52 113 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "orange-star-lily":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 17 C49 64 50 119 50 176" stroke={stem} strokeWidth="4.4" strokeLinecap="round" fill="none" />
          <Leaf d="M49 91 C28 83 18 93 16 115 C34 117 45 109 49 91 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 118 C70 105 82 111 84 134 C67 137 57 130 51 118 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <path d="M50 25 C57 35 63 45 66 57" stroke={stemDark} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.38" />
        </svg>
      );
    case "yellow-wide-petal":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 18 C50 62 49 121 50 176" stroke={stem} strokeWidth="4.8" strokeLinecap="round" fill="none" />
          <Leaf d="M48 78 C28 67 16 77 15 103 C34 105 45 94 48 78 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M52 98 C73 83 86 91 87 118 C68 121 57 112 52 98 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M50 132 C34 122 25 130 24 150 C38 152 47 145 50 132 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity * 0.82} />
        </svg>
      );
    case "tiny-field-cluster":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 24 C47 75 50 120 50 176" stroke={stem} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <g stroke={stemDark} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.76">
            <path d="M50 58 C39 48 32 41 27 35" />
            <path d="M50 76 C61 62 68 53 73 45" />
            <path d="M50 92 C40 84 32 79 24 76" />
          </g>
          <Leaf d="M49 118 C29 112 19 121 18 140 C34 142 45 135 49 118 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 137 C67 126 78 131 81 151 C66 153 57 147 51 137 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "berry-branch":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 34 C48 82 50 127 50 176" stroke={stem} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <g stroke={stemDark} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.82">
            <path d="M50 34 L50 18" />
            <path d="M50 42 L35 30" />
            <path d="M50 48 L66 31" />
            <path d="M50 60 L26 49" />
            <path d="M50 61 L75 48" />
          </g>
          <g fill={blue} opacity="0.88">
            <circle cx="50" cy="18" r="4" />
            <circle cx="35" cy="30" r="3.6" />
            <circle cx="66" cy="31" r="3.6" />
            <circle cx="26" cy="49" r="3.3" />
            <circle cx="75" cy="48" r="3.3" />
          </g>
          <Leaf d="M49 112 C31 106 20 115 18 136 C34 138 45 132 49 112 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "leafy-spray":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 17 C47 64 50 122 50 176" stroke={stem} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M50 74 C35 58 23 49 13 43" stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.78" />
          <path d="M50 90 C63 74 73 66 84 58" stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.78" />
          <Leaf d="M50 74 C28 62 17 68 12 85 C28 91 42 86 50 74 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M50 90 C67 78 79 82 86 101 C70 105 59 101 50 90 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M49 120 C30 112 20 123 18 143 C34 145 45 136 49 120 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 138 C68 126 79 131 83 152 C67 154 57 149 51 138 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "elegant-bud":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 16 C47 58 52 111 50 176" stroke={stem} strokeWidth="5" strokeLinecap="round" fill="none" />
          <Leaf d="M49 70 C27 63 14 80 16 108 C35 110 47 96 49 70 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M52 97 C72 80 85 90 85 119 C67 121 56 114 52 97 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <path d="M50 27 C49 73 50 124 50 169" stroke={stemDark} strokeWidth="1.4" strokeLinecap="round" opacity="0.28" fill="none" />
        </svg>
      );
    case "lavender-pinwheel":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 20 C47 67 51 120 50 176" stroke={stem} strokeWidth="4.1" strokeLinecap="round" fill="none" />
          <Leaf d="M49 94 C30 87 20 96 18 118 C34 121 45 113 49 94 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 124 C68 112 80 118 83 139 C67 142 57 137 51 124 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "cream-layered-rose":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 18 C49 67 51 121 50 176" stroke={stem} strokeWidth="4.6" strokeLinecap="round" fill="none" />
          <Leaf d="M48 83 C28 70 16 79 15 104 C33 107 45 97 48 83 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M52 107 C72 94 84 101 85 125 C68 128 57 120 52 107 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M49 132 C31 122 22 131 21 150 C36 152 46 145 49 132 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity * 0.72} />
        </svg>
      );
    case "blue-heart-posy":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 30 C47 78 50 123 50 176" stroke={stem} strokeWidth="3.8" strokeLinecap="round" fill="none" />
          <path d="M50 58 C40 47 34 40 29 32" stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M51 66 C63 55 71 48 78 42" stroke={stemDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75" />
          <Leaf d="M49 110 C31 103 20 112 19 133 C35 135 45 128 49 110 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 132 C67 119 79 125 82 146 C66 149 57 143 51 132 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
        </svg>
      );
    case "red-poppy-burst":
      return (
        <svg viewBox="0 0 100 180" role="presentation" aria-hidden="true" className="flower-stem-svg">
          <path d="M50 18 C51 70 48 123 50 176" stroke={stem} strokeWidth="4.4" strokeLinecap="round" fill="none" />
          <Leaf d="M49 88 C31 76 19 84 18 107 C34 110 45 101 49 88 Z" fill={leaf} stroke={leafDark} opacity={branchOpacity} />
          <Leaf d="M51 114 C70 101 82 107 84 130 C67 133 57 126 51 114 Z" fill={leafLight} stroke={leafDark} opacity={branchOpacity} />
          <g fill={ink} opacity="0.86">
            <circle cx="50" cy="18" r="1.8" />
            <circle cx="55" cy="21" r="1.4" />
            <circle cx="45" cy="21" r="1.4" />
          </g>
        </svg>
      );
  }
}

export function shouldShowOpeningStem(flower: FlowerConfig) {
  return Boolean(flower.showOpeningStem);
}

export function renderFlower(
  variant: FlowerVariant,
  paletteName: PaletteName,
) {
  const palette = palettes[paletteName];

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      className="flower-svg"
    >
      <VariantShape variant={variant} palette={palette} />
    </svg>
  );
}
