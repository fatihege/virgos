import type { CSSProperties } from "react";

export type FlowerVariant =
  | "round-daisy"
  | "teardrop-daisy"
  | "cosmos"
  | "sun-pop"
  | "ruffle"
  | "starburst"
  | "buttercup"
  | "windmill"
  | "soft-lotus"
  | "tiny-clover";

export type PaletteName =
  | "cobalt"
  | "periwinkle"
  | "coral"
  | "orange"
  | "blush"
  | "butter"
  | "lavender"
  | "cream";

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
  isCenterMessage?: boolean;
};

export const palettes: Record<PaletteName, Palette> = {
  cobalt: {
    petals: "#5067e8",
    petalsAlt: "#7086f1",
    center: "#ffd93d",
    core: "#fff8de",
    detail: "#3050d1",
  },
  periwinkle: {
    petals: "#b7b8f8",
    petalsAlt: "#d4d8ff",
    center: "#f9b1d6",
    core: "#fff3ff",
    detail: "#8e91e9",
  },
  coral: {
    petals: "#fb6840",
    petalsAlt: "#ff8e67",
    center: "#f8c249",
    core: "#fff1c2",
    detail: "#bf4731",
  },
  orange: {
    petals: "#ff890b",
    petalsAlt: "#ffae3a",
    center: "#b52d6d",
    core: "#bfeaff",
    detail: "#ff5c00",
  },
  blush: {
    petals: "#d55899",
    petalsAlt: "#ef83b6",
    center: "#ffb027",
    core: "#ffd2e6",
    detail: "#a52d67",
  },
  butter: {
    petals: "#fff4b3",
    petalsAlt: "#ffe79b",
    center: "#ff9a1f",
    core: "#b5ecff",
    detail: "#f0d789",
  },
  lavender: {
    petals: "#b7a0f5",
    petalsAlt: "#d5c3ff",
    center: "#ffe08d",
    core: "#fff5d0",
    detail: "#8d6be2",
  },
  cream: {
    petals: "#fff2d5",
    petalsAlt: "#ffe7b8",
    center: "#ffb64b",
    core: "#ffc7a0",
    detail: "#d8b871",
  },
};

export const flowerConfigs: FlowerConfig[] = [
  {
    id: "f-1",
    variant: "round-daisy",
    palette: "periwinkle",
    size: 12,
    startX: 8,
    startY: 12,
    startRotation: -12,
    depth: 0.72,
    bouquetTargetX: -16,
    bouquetTargetY: -7,
    bouquetRotation: -8,
    bouquetLayer: "back",
    bouquetScale: 1.06,
  },
  {
    id: "f-2",
    variant: "teardrop-daisy",
    palette: "cobalt",
    size: 16,
    startX: 29,
    startY: 8,
    startRotation: 9,
    depth: 0.6,
    bouquetTargetX: -2,
    bouquetTargetY: -11,
    bouquetRotation: 7,
    bouquetLayer: "back",
    bouquetScale: 1.18,
  },
  {
    id: "f-3",
    variant: "cosmos",
    palette: "blush",
    size: 16,
    startX: 63,
    startY: 7,
    startRotation: -7,
    depth: 0.67,
    bouquetTargetX: 14,
    bouquetTargetY: -8,
    bouquetRotation: -5,
    bouquetLayer: "back",
    bouquetScale: 1.12,
  },
  {
    id: "f-4",
    variant: "sun-pop",
    palette: "orange",
    size: 13,
    startX: 89,
    startY: 21,
    startRotation: -4,
    depth: 0.82,
    bouquetTargetX: 24,
    bouquetTargetY: -1,
    bouquetRotation: 8,
    bouquetLayer: "front",
    bouquetScale: 1.24,
  },
  {
    id: "f-5",
    variant: "ruffle",
    palette: "coral",
    size: 15,
    startX: 12,
    startY: 45,
    startRotation: 10,
    depth: 0.75,
    bouquetTargetX: -17,
    bouquetTargetY: -1,
    bouquetRotation: -13,
    bouquetLayer: "mid",
    bouquetScale: 1.02,
  },
  {
    id: "f-6",
    variant: "starburst",
    palette: "coral",
    size: 14,
    startX: 49,
    startY: 47,
    startRotation: -6,
    depth: 0.7,
    bouquetTargetX: 6,
    bouquetTargetY: 0,
    bouquetRotation: 11,
    bouquetLayer: "mid",
    bouquetScale: 0.98,
  },
  {
    id: "f-7",
    variant: "buttercup",
    palette: "butter",
    size: 14,
    startX: 84,
    startY: 46,
    startRotation: 3,
    depth: 0.84,
    bouquetTargetX: -24,
    bouquetTargetY: 8,
    bouquetRotation: -9,
    bouquetLayer: "front",
    bouquetScale: 1.14,
  },
  {
    id: "f-8",
    variant: "windmill",
    palette: "orange",
    size: 16,
    startX: 36,
    startY: 76,
    startRotation: -15,
    depth: 0.8,
    bouquetTargetX: 0,
    bouquetTargetY: 2,
    bouquetRotation: 3,
    bouquetLayer: "front",
    bouquetScale: 1.16,
    isCenterMessage: true,
  },
  {
    id: "f-9",
    variant: "soft-lotus",
    palette: "lavender",
    size: 17,
    startX: 62,
    startY: 80,
    startRotation: 8,
    depth: 0.63,
    bouquetTargetX: 16,
    bouquetTargetY: 8,
    bouquetRotation: -10,
    bouquetLayer: "mid",
    bouquetScale: 1.04,
  },
  {
    id: "f-10",
    variant: "tiny-clover",
    palette: "butter",
    size: 13,
    startX: 5,
    startY: 79,
    startRotation: -9,
    depth: 0.9,
    bouquetTargetX: -12,
    bouquetTargetY: 12,
    bouquetRotation: 7,
    bouquetLayer: "front",
    bouquetScale: 0.84,
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

function VariantShape({
  variant,
  palette,
}: {
  variant: FlowerVariant;
  palette: Palette;
}) {
  switch (variant) {
    case "round-daisy":
      return (
        <>
          <Petals count={6} rx={13} ry={23} fill={palette.petals} rotateStep={6} />
          <Petals count={10} rx={4} ry={6} fill={palette.petalsAlt ?? palette.petals} opacity={0.15} offsetY={-3} />
          <circle cx="50" cy="50" r="19" fill={palette.core} />
          <circle cx="50" cy="50" r="11" fill={palette.center} />
        </>
      );
    case "teardrop-daisy":
      return (
        <>
          <Petals count={8} rx={12} ry={28} fill={palette.petals} rotateStep={12} />
          <circle cx="50" cy="50" r="17" fill={palette.center} />
          <g fill={palette.core}>
            {Array.from({ length: 12 }, (_, index) => {
              const angle = (360 / 12) * index;
              const x = 50 + Math.cos((angle * Math.PI) / 180) * 7;
              const y = 50 + Math.sin((angle * Math.PI) / 180) * 7;
              return <circle key={angle} cx={x} cy={y} r="1.35" />;
            })}
          </g>
        </>
      );
    case "cosmos":
      return (
        <>
          <Petals count={6} rx={14} ry={24} fill={palette.petals} rotateStep={3} />
          <g stroke={palette.detail} strokeWidth="1.4" strokeLinecap="round" opacity="0.55">
            {Array.from({ length: 6 }, (_, index) => {
              const angle = (360 / 6) * index;
              const x = 50 + Math.cos((angle * Math.PI) / 180) * 22;
              const y = 50 + Math.sin((angle * Math.PI) / 180) * 22;
              return <line key={angle} x1="50" y1="50" x2={x} y2={y} />;
            })}
          </g>
          <circle cx="50" cy="50" r="12" fill={palette.center} />
        </>
      );
    case "sun-pop":
      return (
        <>
          <Petals count={5} rx={14} ry={25} fill={palette.petals} />
          <circle cx="50" cy="50" r="16" fill={palette.core} />
        </>
      );
    case "ruffle":
      return (
        <>
          <Petals count={7} rx={14} ry={24} fill={palette.petals} rotateStep={8} />
          <g stroke={palette.detail} strokeWidth="1.2" strokeLinecap="round" opacity="0.45">
            {Array.from({ length: 8 }, (_, index) => {
              const angle = (360 / 8) * index + 8;
              const x = 50 + Math.cos((angle * Math.PI) / 180) * 23;
              const y = 50 + Math.sin((angle * Math.PI) / 180) * 23;
              return <line key={angle} x1="50" y1="50" x2={x} y2={y} />;
            })}
          </g>
          <circle cx="50" cy="50" r="10.5" fill={palette.center} />
        </>
      );
    case "starburst":
      return (
        <>
          <Petals count={6} rx={12} ry={24} fill={palette.petalsAlt ?? palette.petals} rotateStep={10} />
          <g fill={palette.detail} opacity="0.55">
            {Array.from({ length: 6 }, (_, index) => {
              const angle = (360 / 6) * index;
              return (
                <polygon
                  key={angle}
                  points="50,22 55,50 50,78 45,50"
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}
          </g>
          <circle cx="50" cy="50" r="10" fill={palette.center} />
        </>
      );
    case "buttercup":
      return (
        <>
          <Petals count={5} rx={16} ry={24} fill={palette.petals} rotateStep={4} />
          <circle cx="50" cy="50" r="14" fill={palette.core} />
          <g fill={palette.center}>
            <circle cx="50" cy="50" r="8" />
            <circle cx="50" cy="35" r="3.2" />
            <circle cx="64" cy="50" r="3.2" />
            <circle cx="50" cy="64" r="3.2" />
            <circle cx="36" cy="50" r="3.2" />
          </g>
        </>
      );
    case "windmill":
      return (
        <>
          <Petals count={5} rx={14} ry={27} fill={palette.petals} />
          <Petals count={5} rx={8} ry={12} fill={palette.core} rotateStep={18} offsetY={-10} />
          <circle cx="50" cy="50" r="10" fill={palette.center} />
        </>
      );
    case "soft-lotus":
      return (
        <>
          {Array.from({ length: 6 }, (_, index) => {
            const angle = (360 / 6) * index - 15;
            return (
              <path
                key={angle}
                d="M50 52 C46 16, 36 9, 28 9 C22 27, 30 46, 50 52 Z"
                fill={palette.petals}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
          <circle cx="50" cy="50" r="11" fill={palette.center} />
        </>
      );
    case "tiny-clover":
      return (
        <>
          <Petals count={4} rx={15} ry={22} fill={palette.petals} rotateStep={45} />
          <Petals count={4} rx={9} ry={13} fill={palette.petalsAlt ?? palette.petals} rotateStep={0} />
          <circle cx="50" cy="50" r="10" fill={palette.core} />
        </>
      );
  }
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
