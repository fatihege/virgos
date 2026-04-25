import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
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
import flowerImage from "./flower.png";

gsap.registerPlugin(useGSAP);

type Phase = "intro" | "idle" | "arranging" | "clustered" | "finishing" | "bouquet";
type PerformanceProfile = "full" | "balanced" | "light";

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number;
};

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

type Butterfly = {
  id: string;
  left: number;
  top: number;
  size: number;
  rotate: number;
  variant: ButterflyVariant;
  flightX: number;
  flightY: number;
  flightDuration: number;
  driftDuration: number;
  flapDuration: number;
  delay: number;
  scale: number;
};

type ButterflyVariant =
  | "sky-swallowtail"
  | "coral-glow"
  | "pink-ribbon"
  | "orchid-garden"
  | "ruby-drift"
  | "lilac-mist"
  | "violet-velvet"
  | "peach-soft"
  | "teal-bloom";

type ButterflyVisualStyle = {
  wingFill: string;
  wingAccent: string;
  detailStroke: string;
  bodyColor: string;
  antennaColor: string;
  shadowColor: string;
};

type GiftBurstPhase = "idle" | "opening" | "burst" | "poem";

type GiftBurstButterfly = {
  id: string;
  variant: ButterflyVariant;
  size: number;
  rotate: number;
  flightX: number;
  flightY: number;
  flightDuration: number;
  flapDuration: number;
  delay: number;
  scale: number;
};

type GiftBirdPalette = {
  bodyColor: string;
  breastColor: string;
  bellyColor: string;
  wingColor: string;
  tailColor: string;
  beakColor: string;
  outlineColor: string;
  legColor: string;
  shadowColor: string;
};

type GiftBurstBird = {
  id: string;
  left: number;
  top: number;
  size: number;
  rotate: number;
  releaseX: string;
  releaseY: string;
  releaseDuration: number;
  releaseDelay: number;
  driftX: number;
  driftY: number;
  flightDuration: number;
  driftDuration: number;
  wingDuration: number;
  delay: number;
  scale: number;
  palette: GiftBirdPalette;
};

type SecondGiftHintState = "hidden" | "searching" | "found";

type PuzzlePieceState = {
  id: string;
  correctSlot: number;
  x: number;
  y: number;
  placed: boolean;
};

type ActivePuzzleDrag = {
  pieceId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

type SecondGiftKeyAnimationPhase = "hidden" | "reveal" | "travel";

type SecondGiftKeyAnimationGeometry = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type NoteCopy = {
  closedLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  signature: string;
};

type SecretNoteCopy = {
  body: string;
};

type MusicTrack = {
  title: string;
  artist: string;
  src: string;
};

type BouquetStage = "cluster" | "bouquet";

type Point = {
  x: number;
  y: number;
};

type HeartPhaseSettings = {
  opacityMultiplier: number;
  scaleMultiplier: number;
  localOrbitScale: number;
  localSpeedMultiplier: number;
  bouquetOrbitStrength: number;
  bouquetOrbitSpeed: number;
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
const debugPrefix = "[bouquet-debug]";

function debugLog(message: string, details?: Record<string, unknown>) {
  if (details) {
    let serializedDetails = "";

    try {
      serializedDetails = JSON.stringify(details);
    } catch (error) {
      serializedDetails = JSON.stringify({
        serializationError:
          error instanceof Error ? error.message : "unknown serialization error",
      });
    }

    console.log(`${debugPrefix} ${message} ${serializedDetails}`);
    return;
  }

  console.log(`${debugPrefix} ${message}`);
}

function computePerformanceProfile(
  reducedMotion: boolean,
  viewportWidth: number,
  navigatorInfo?: NavigatorWithDeviceMemory,
): PerformanceProfile {
  if (reducedMotion) {
    return "light";
  }

  const hardwareConcurrency = navigatorInfo?.hardwareConcurrency ?? 8;
  const deviceMemory = navigatorInfo?.deviceMemory ?? 8;

  if (viewportWidth <= 768 || hardwareConcurrency <= 4 || deviceMemory <= 4) {
    return "light";
  }

  if (viewportWidth > 1200 && hardwareConcurrency > 8 && deviceMemory > 8) {
    return "full";
  }

  return "balanced";
}

function getPollenCount(profile: PerformanceProfile) {
  return profile === "light" ? 9 : profile === "balanced" ? 14 : 18;
}

function getHeartTargetCount(profile: PerformanceProfile) {
  return profile === "light" ? 25 : profile === "balanced" ? 45 : 75;
}

function getButterflyTargetCount(profile: PerformanceProfile) {
  return profile === "light" ? 8 : profile === "balanced" ? 12 : 16;
}

function pickDistributedItems<T>(items: T[], targetCount: number) {
  if (targetCount >= items.length) {
    return items;
  }

  const lastIndex = items.length - 1;

  return Array.from({ length: targetCount }, (_, index) => {
    const sampleIndex =
      targetCount === 1
        ? 0
        : Math.round((index * lastIndex) / (targetCount - 1));

    return items[sampleIndex];
  });
}

function getHeartPhaseSettings(
  phase: Phase,
  profile: PerformanceProfile,
): HeartPhaseSettings {
  const profileMotionScale =
    profile === "full"
      ? 1
      : profile === "balanced"
        ? 0.86
        : 0.68;

  switch (phase) {
    case "intro":
    case "idle":
      return {
        opacityMultiplier: 0.66,
        scaleMultiplier: 0.84,
        localOrbitScale: 0.84,
        localSpeedMultiplier: 0.54 * profileMotionScale,
        bouquetOrbitStrength: 0,
        bouquetOrbitSpeed: 0,
      };
    case "arranging":
      return {
        opacityMultiplier: 0.74,
        scaleMultiplier: 0.92,
        localOrbitScale: 0.9,
        localSpeedMultiplier: 0.64 * profileMotionScale,
        bouquetOrbitStrength: 0,
        bouquetOrbitSpeed: 0,
      };
    case "clustered":
      return {
        opacityMultiplier: 0.82,
        scaleMultiplier: 0.96,
        localOrbitScale: 0.94,
        localSpeedMultiplier: 0.86 * profileMotionScale,
        bouquetOrbitStrength: 0.72,
        bouquetOrbitSpeed: (2 * Math.PI) / 176,
      };
    case "finishing":
      return {
        opacityMultiplier: 0.88,
        scaleMultiplier: 1,
        localOrbitScale: 0.98,
        localSpeedMultiplier: 0.92 * profileMotionScale,
        bouquetOrbitStrength: 0.86,
        bouquetOrbitSpeed: (2 * Math.PI) / 164,
      };
    case "bouquet":
      return {
        opacityMultiplier: 0.96,
        scaleMultiplier: 1.02,
        localOrbitScale: 1.03,
        localSpeedMultiplier: 1 * profileMotionScale,
        bouquetOrbitStrength: 1,
        bouquetOrbitSpeed: (2 * Math.PI) / 150,
      };
  }
}

const romanticNote: NoteCopy = {
  closedLabel: "a note for you",
  eyebrow: "",
  title: "Happy birthday, Ceren. \u{1F338}",
  body: [
    "I hope your day has been as beautiful as you are.",
    "If this bouquet could speak, it would only say: every beautiful thing in this world deserves to find you.",
    "And I hope this little surprise was worth the excitement. \u{1F49C}",
  ].join("\n"),
  signature: "",
};

const backgroundTrack: MusicTrack = {
  title: "Autumn Leaves",
  artist: "Santec Music Orchestra",
  src: new URL("./Autumn Leaves - Santec Music Orchestra.mp3", import.meta.url).href,
};

const giftPoemLines = [
  "DESEM Kİ",
  "",
  "Desem ki vakitlerden bir Nisan akşamıdır,",
  "Rüzgârların en ferahlatıcısı senden esiyor,",
  "Sende seyrediyorum denizlerin en mavisini,",
  "Ormanların en kuytusunu sende gezmekteyim,",
  "Senden kopardım çiçeklerin en solmazını,",
  "Toprakların en bereketlisini sende sürdüm,",
  "Sende tattım yemişlerin cümlesini.",
  "",
  "Desem ki sen benim için,",
  "Hava kadar lazım,",
  "Ekmek kadar mübarek,",
  "Su gibi aziz bir şeysin;",
  "Nimettensin, nimettensin!",
  "Desem  ki...",
  "İnan bana sevgilim inan,",
  "Evimde şenliksin, bahçemde bahar;",
  "Ve soframda en eski şarap.",
  "Ben sende yaşıyorum,",
  "Sen bende hüküm sürmektesin.",
  "Bırak ben söyleyeyim güzelliğini,",
  "Rüzgârlarla, nehirlerle, kuşlarla beraber.",
  "Günlerden sonra bir gün,",
  "Şayet sesimi farkedemezsen,",
  "Rüzgârların, nehirlerin, kuşların sesinden,",
  "Bil ki ölmüşüm.",
  "Fakat yine üzülme, müsterih ol;",
  "Kabirde böceklere ezberletirim güzelliğini,",
  "Ve neden sonra",
  "Tekrar duyduğun gün sesimi gökkubbede,",
  "Hatırla ki mahşer günüdür",
  "Ortalığa düşmüşüm seni arıyorum.",
] as const;

const giftPoemPreviewLineCount = 7;
const giftPoemPreview = giftPoemLines.slice(0, giftPoemPreviewLineCount).join("\n");
const giftPoemFull = giftPoemLines.join("\n");
const birthdayDayOneCardMessage = "Happy second day of your new year.";
const secondGiftHintMessage = "Kucuk anahtar kuslardan birinde sakli.";
const secondGiftFoundMessage = "Anahtari buldun. Kutu simdi acilabilir.";
const secondGiftPuzzleGridSize = 3;
const secondGiftPuzzleTotalPieces = secondGiftPuzzleGridSize * secondGiftPuzzleGridSize;

const secondGiftScatterSlots = [
  { x: 3, y: 10 },
  { x: 16, y: 3 },
  { x: 76, y: 4 },
  { x: 88, y: 16 },
  { x: 4, y: 38 },
  { x: 84, y: 40 },
  { x: 11, y: 71 },
  { x: 30, y: 79 },
  { x: 68, y: 80 },
  { x: 84, y: 67 },
  { x: 48, y: 2 },
  { x: 58, y: 72 },
] as const;

const secretFlowerId = "f-2";
const secretFlowerNotes: Record<string, SecretNoteCopy> = {
  [secretFlowerId]: {
    body: "You are the most beautiful flower in the world. I know this very well.",
  },
  "f-11": {
    body: "Some flowers bloom only for one person.",
  },
};

const secretNote: SecretNoteCopy = {
  body: "You are the most beautiful flower in the world. I know this very well.",
};

function buildPollen(profile: PerformanceProfile) {
  const pollenCount = getPollenCount(profile);

  return Array.from({ length: pollenCount }, (_, index) => ({
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

function buildBouquetHearts(profile: PerformanceProfile): BouquetHeart[] {
  const palette = [
    "#f06aa2",
    "#f39d42",
    "#f2cf3a",
    "#b974f2",
    "#5b98f2",
    "#f58cb1",
    "#f0b869",
    "#9a7af0",
  ];
  const clusters = [
    {
      count: 5,
      centerLeft: 10,
      centerTop: 12,
      spreadX: 8,
      spreadY: 6,
      radiusX: 48,
      radiusY: 38,
      sizeBase: 18,
      sizeStep: 3,
      opacityBase: 0.15,
      durationBase: 30,
      paletteOffset: 0,
      scaleBase: 0.7,
      wobbleX: 5,
      wobbleY: 4,
      angleOffset: -126,
    },
    {
      count: 5,
      centerLeft: 28,
      centerTop: 17,
      spreadX: 9,
      spreadY: 7,
      radiusX: 52,
      radiusY: 40,
      sizeBase: 20,
      sizeStep: 3,
      opacityBase: 0.17,
      durationBase: 31,
      paletteOffset: 2,
      scaleBase: 0.74,
      wobbleX: 6,
      wobbleY: 4,
      angleOffset: -96,
    },
    {
      count: 5,
      centerLeft: 48,
      centerTop: 14,
      spreadX: 10,
      spreadY: 8,
      radiusX: 56,
      radiusY: 42,
      sizeBase: 21,
      sizeStep: 4,
      opacityBase: 0.18,
      durationBase: 32,
      paletteOffset: 4,
      scaleBase: 0.76,
      wobbleX: 7,
      wobbleY: 5,
      angleOffset: -104,
    },
    {
      count: 5,
      centerLeft: 68,
      centerTop: 17,
      spreadX: 9,
      spreadY: 7,
      radiusX: 54,
      radiusY: 40,
      sizeBase: 20,
      sizeStep: 4,
      opacityBase: 0.18,
      durationBase: 32,
      paletteOffset: 1,
      scaleBase: 0.76,
      wobbleX: 8,
      wobbleY: 6,
      angleOffset: -82,
    },
    {
      count: 5,
      centerLeft: 88,
      centerTop: 13,
      spreadX: 8,
      spreadY: 6,
      radiusX: 50,
      radiusY: 38,
      sizeBase: 18,
      sizeStep: 4,
      opacityBase: 0.16,
      durationBase: 31,
      paletteOffset: 6,
      scaleBase: 0.72,
      wobbleX: 7,
      wobbleY: 5,
      angleOffset: -72,
    },
    {
      count: 5,
      centerLeft: 14,
      centerTop: 34,
      spreadX: 9,
      spreadY: 8,
      radiusX: 60,
      radiusY: 44,
      sizeBase: 20,
      sizeStep: 3,
      opacityBase: 0.17,
      durationBase: 33,
      paletteOffset: 3,
      scaleBase: 0.76,
      wobbleX: 6,
      wobbleY: 4,
      angleOffset: -94,
    },
    {
      count: 5,
      centerLeft: 34,
      centerTop: 38,
      spreadX: 10,
      spreadY: 8,
      radiusX: 64,
      radiusY: 48,
      sizeBase: 21,
      sizeStep: 3,
      opacityBase: 0.18,
      durationBase: 33,
      paletteOffset: 5,
      scaleBase: 0.78,
      wobbleX: 6,
      wobbleY: 4,
      angleOffset: -62,
    },
    {
      count: 6,
      centerLeft: 54,
      centerTop: 36,
      spreadX: 12,
      spreadY: 9,
      radiusX: 70,
      radiusY: 52,
      sizeBase: 23,
      sizeStep: 4,
      opacityBase: 0.19,
      durationBase: 34,
      paletteOffset: 7,
      scaleBase: 0.82,
      wobbleX: 7,
      wobbleY: 5,
      angleOffset: -88,
    },
    {
      count: 5,
      centerLeft: 76,
      centerTop: 35,
      spreadX: 10,
      spreadY: 8,
      radiusX: 62,
      radiusY: 46,
      sizeBase: 21,
      sizeStep: 4,
      opacityBase: 0.18,
      durationBase: 33,
      paletteOffset: 1,
      scaleBase: 0.79,
      wobbleX: 6,
      wobbleY: 5,
      angleOffset: -70,
    },
    {
      count: 5,
      centerLeft: 90,
      centerTop: 34,
      spreadX: 8,
      spreadY: 7,
      radiusX: 52,
      radiusY: 40,
      sizeBase: 19,
      sizeStep: 3,
      opacityBase: 0.16,
      durationBase: 31,
      paletteOffset: 4,
      scaleBase: 0.74,
      wobbleX: 5,
      wobbleY: 4,
      angleOffset: -54,
    },
    {
      count: 5,
      centerLeft: 12,
      centerTop: 58,
      spreadX: 9,
      spreadY: 9,
      radiusX: 58,
      radiusY: 46,
      sizeBase: 20,
      sizeStep: 3,
      opacityBase: 0.17,
      durationBase: 33,
      paletteOffset: 6,
      scaleBase: 0.75,
      wobbleX: 6,
      wobbleY: 4,
      angleOffset: -90,
    },
    {
      count: 6,
      centerLeft: 30,
      centerTop: 60,
      spreadX: 11,
      spreadY: 9,
      radiusX: 66,
      radiusY: 50,
      sizeBase: 22,
      sizeStep: 4,
      opacityBase: 0.18,
      durationBase: 34,
      paletteOffset: 2,
      scaleBase: 0.8,
      wobbleX: 7,
      wobbleY: 5,
      angleOffset: -80,
    },
    {
      count: 6,
      centerLeft: 50,
      centerTop: 64,
      spreadX: 12,
      spreadY: 10,
      radiusX: 72,
      radiusY: 54,
      sizeBase: 24,
      sizeStep: 4,
      opacityBase: 0.19,
      durationBase: 35,
      paletteOffset: 5,
      scaleBase: 0.84,
      wobbleX: 8,
      wobbleY: 6,
      angleOffset: -74,
    },
    {
      count: 6,
      centerLeft: 71,
      centerTop: 62,
      spreadX: 11,
      spreadY: 9,
      radiusX: 68,
      radiusY: 52,
      sizeBase: 22,
      sizeStep: 4,
      opacityBase: 0.18,
      durationBase: 34,
      paletteOffset: 0,
      scaleBase: 0.8,
      wobbleX: 7,
      wobbleY: 5,
      angleOffset: -60,
    },
    {
      count: 5,
      centerLeft: 89,
      centerTop: 58,
      spreadX: 8,
      spreadY: 8,
      radiusX: 56,
      radiusY: 44,
      sizeBase: 20,
      sizeStep: 3,
      opacityBase: 0.17,
      durationBase: 32,
      paletteOffset: 3,
      scaleBase: 0.76,
      wobbleX: 6,
      wobbleY: 4,
      angleOffset: -50,
    },
    {
      count: 5,
      centerLeft: 14,
      centerTop: 84,
      spreadX: 8,
      spreadY: 7,
      radiusX: 50,
      radiusY: 38,
      sizeBase: 18,
      sizeStep: 3,
      opacityBase: 0.15,
      durationBase: 31,
      paletteOffset: 1,
      scaleBase: 0.72,
      wobbleX: 5,
      wobbleY: 4,
      angleOffset: -82,
    },
    {
      count: 5,
      centerLeft: 34,
      centerTop: 86,
      spreadX: 9,
      spreadY: 7,
      radiusX: 54,
      radiusY: 40,
      sizeBase: 19,
      sizeStep: 3,
      opacityBase: 0.16,
      durationBase: 31,
      paletteOffset: 7,
      scaleBase: 0.74,
      wobbleX: 5,
      wobbleY: 4,
      angleOffset: -68,
    },
    {
      count: 5,
      centerLeft: 57,
      centerTop: 86,
      spreadX: 9,
      spreadY: 7,
      radiusX: 56,
      radiusY: 42,
      sizeBase: 20,
      sizeStep: 3,
      opacityBase: 0.17,
      durationBase: 32,
      paletteOffset: 4,
      scaleBase: 0.76,
      wobbleX: 6,
      wobbleY: 4,
      angleOffset: -62,
    },
    {
      count: 5,
      centerLeft: 79,
      centerTop: 85,
      spreadX: 8,
      spreadY: 7,
      radiusX: 52,
      radiusY: 40,
      sizeBase: 19,
      sizeStep: 3,
      opacityBase: 0.16,
      durationBase: 31,
      paletteOffset: 6,
      scaleBase: 0.74,
      wobbleX: 5,
      wobbleY: 4,
      angleOffset: -54,
    },
    {
      count: 5,
      centerLeft: 92,
      centerTop: 84,
      spreadX: 7,
      spreadY: 6,
      radiusX: 48,
      radiusY: 38,
      sizeBase: 18,
      sizeStep: 3,
      opacityBase: 0.15,
      durationBase: 30,
      paletteOffset: 2,
      scaleBase: 0.7,
      wobbleX: 5,
      wobbleY: 4,
      angleOffset: -42,
    },
  ] as const;

  let heartId = 1;

  const allHearts = clusters.flatMap((cluster, clusterIndex) =>
    Array.from({ length: cluster.count }, (_value, index) => {
      const angle =
        cluster.angleOffset +
        (360 / cluster.count) * index +
        ((index + clusterIndex) % 2 === 0 ? -9 : 11);
      const leftJitter = ((index * 7 + clusterIndex * 3) % 9) - 4;
      const topJitter = ((index * 5 + clusterIndex * 4) % 9) - 4;

      return {
        id: `heart-${heartId++}`,
        left: cluster.centerLeft + leftJitter * (cluster.spreadX / 4),
        top: cluster.centerTop + topJitter * (cluster.spreadY / 4),
        size: cluster.sizeBase + (index % 4) * cluster.sizeStep,
        rotate: ((index * 19 + clusterIndex * 23) % 36) - 18,
        opacity: cluster.opacityBase + (index % 3) * 0.022,
        duration: cluster.durationBase + (index % 4) * 1.7,
        delay: index * 0.22 + clusterIndex * 0.11,
        orbitRadiusX: cluster.radiusX + (((index * 3 + clusterIndex) % 7) - 3) * 10,
        orbitRadiusY: cluster.radiusY + ((((index + 2) * 2 + clusterIndex) % 7) - 3) * 8,
        orbitStart: angle,
        orbitDirection: (index + clusterIndex) % 2 === 0 ? 1 : -1,
        wobbleX: cluster.wobbleX + (index % 4) * 2.1,
        wobbleY: cluster.wobbleY + ((index + 1) % 4) * 1.7,
        scale: cluster.scaleBase + (index % 4) * 0.05,
        color: palette[(index + cluster.paletteOffset + clusterIndex) % palette.length],
      };
    }),
  );

  return pickDistributedItems(allHearts, getHeartTargetCount(profile));
}

function buildButterflies(profile: PerformanceProfile): Butterfly[] {
  const butterflies: Butterfly[] = [
    {
      id: "butterfly-1",
      left: 8,
      top: 15,
      size: 34,
      rotate: -8,
      variant: "sky-swallowtail",
      flightX: 16,
      flightY: -4,
      flightDuration: 14.8,
      driftDuration: 4.8,
      flapDuration: 0.96,
      delay: -1.6,
      scale: 0.92,
    },
    {
      id: "butterfly-2",
      left: 21,
      top: 29,
      size: 28,
      rotate: 9,
      variant: "coral-glow",
      flightX: -12,
      flightY: -6,
      flightDuration: 12.6,
      driftDuration: 4.2,
      flapDuration: 0.88,
      delay: -3.1,
      scale: 0.82,
    },
    {
      id: "butterfly-3",
      left: 36,
      top: 18,
      size: 30,
      rotate: -6,
      variant: "pink-ribbon",
      flightX: 13,
      flightY: -5,
      flightDuration: 13.5,
      driftDuration: 4.9,
      flapDuration: 0.9,
      delay: -4.3,
      scale: 0.86,
    },
    {
      id: "butterfly-4",
      left: 51,
      top: 34,
      size: 26,
      rotate: 8,
      variant: "orchid-garden",
      flightX: -14,
      flightY: -4,
      flightDuration: 11.9,
      driftDuration: 3.8,
      flapDuration: 0.8,
      delay: -0.8,
      scale: 0.8,
    },
    {
      id: "butterfly-5",
      left: 72,
      top: 22,
      size: 32,
      rotate: -10,
      variant: "ruby-drift",
      flightX: 12,
      flightY: -7,
      flightDuration: 15.4,
      driftDuration: 4.5,
      flapDuration: 0.94,
      delay: -5.5,
      scale: 0.9,
    },
    {
      id: "butterfly-6",
      left: 89,
      top: 31,
      size: 24,
      rotate: 11,
      variant: "lilac-mist",
      flightX: -11,
      flightY: -5,
      flightDuration: 12.8,
      driftDuration: 4.1,
      flapDuration: 0.84,
      delay: -2.4,
      scale: 0.78,
    },
    {
      id: "butterfly-7",
      left: 9,
      top: 45,
      size: 29,
      rotate: -7,
      variant: "violet-velvet",
      flightX: 18,
      flightY: -8,
      flightDuration: 15.8,
      driftDuration: 5,
      flapDuration: 0.98,
      delay: -4.8,
      scale: 0.84,
    },
    {
      id: "butterfly-8",
      left: 18,
      top: 60,
      size: 23,
      rotate: 10,
      variant: "peach-soft",
      flightX: -10,
      flightY: -7,
      flightDuration: 12.4,
      driftDuration: 3.7,
      flapDuration: 0.82,
      delay: -1.1,
      scale: 0.76,
    },
    {
      id: "butterfly-9",
      left: 31,
      top: 72,
      size: 27,
      rotate: -5,
      variant: "teal-bloom",
      flightX: 11,
      flightY: -6,
      flightDuration: 13.7,
      driftDuration: 4.6,
      flapDuration: 0.9,
      delay: -6.2,
      scale: 0.81,
    },
    {
      id: "butterfly-10",
      left: 44,
      top: 25,
      size: 21,
      rotate: 7,
      variant: "pink-ribbon",
      flightX: -9,
      flightY: -4,
      flightDuration: 10.9,
      driftDuration: 3.9,
      flapDuration: 0.78,
      delay: -3.6,
      scale: 0.74,
    },
    {
      id: "butterfly-11",
      left: 62,
      top: 48,
      size: 25,
      rotate: -9,
      variant: "coral-glow",
      flightX: 10,
      flightY: -5,
      flightDuration: 13.1,
      driftDuration: 4.4,
      flapDuration: 0.86,
      delay: -0.4,
      scale: 0.79,
    },
    {
      id: "butterfly-12",
      left: 78,
      top: 56,
      size: 31,
      rotate: 8,
      variant: "lilac-mist",
      flightX: -13,
      flightY: -6,
      flightDuration: 14.9,
      driftDuration: 4.7,
      flapDuration: 0.95,
      delay: -2.9,
      scale: 0.88,
    },
    {
      id: "butterfly-13",
      left: 91,
      top: 69,
      size: 22,
      rotate: -11,
      variant: "ruby-drift",
      flightX: -12,
      flightY: -8,
      flightDuration: 11.8,
      driftDuration: 3.8,
      flapDuration: 0.8,
      delay: -5.1,
      scale: 0.75,
    },
    {
      id: "butterfly-14",
      left: 73,
      top: 82,
      size: 26,
      rotate: 9,
      variant: "sky-swallowtail",
      flightX: 14,
      flightY: -7,
      flightDuration: 13.9,
      driftDuration: 4.3,
      flapDuration: 0.9,
      delay: -1.9,
      scale: 0.8,
    },
    {
      id: "butterfly-15",
      left: 53,
      top: 79,
      size: 20,
      rotate: -6,
      variant: "peach-soft",
      flightX: -8,
      flightY: -4,
      flightDuration: 10.7,
      driftDuration: 3.6,
      flapDuration: 0.76,
      delay: -4.5,
      scale: 0.72,
    },
    {
      id: "butterfly-16",
      left: 26,
      top: 84,
      size: 24,
      rotate: 8,
      variant: "violet-velvet",
      flightX: 12,
      flightY: -6,
      flightDuration: 12.9,
      driftDuration: 4.1,
      flapDuration: 0.84,
      delay: -2.2,
      scale: 0.78,
    },
  ];

  return pickDistributedItems(butterflies, getButterflyTargetCount(profile));
}

function getButterflyVariantStyle(variant: ButterflyVariant): ButterflyVisualStyle {
  switch (variant) {
    case "sky-swallowtail":
      return {
        wingFill: "#72c7ef",
        wingAccent: "#9de0f7",
        detailStroke: "#4fa7d3",
        bodyColor: "#5c3f67",
        antennaColor: "#b7c4d9",
        shadowColor: "rgba(101, 180, 218, 0.26)",
      };
    case "coral-glow":
      return {
        wingFill: "#ff6f61",
        wingAccent: "#ff8f84",
        detailStroke: "#e9655f",
        bodyColor: "#583f49",
        antennaColor: "#c8b9c7",
        shadowColor: "rgba(255, 123, 103, 0.24)",
      };
    case "pink-ribbon":
      return {
        wingFill: "#e88fc6",
        wingAccent: "#f2abd5",
        detailStroke: "#d774b2",
        bodyColor: "#5a4260",
        antennaColor: "#d8bfd2",
        shadowColor: "rgba(228, 136, 191, 0.24)",
      };
    case "orchid-garden":
      return {
        wingFill: "#ab5bb8",
        wingAccent: "#bf74ca",
        detailStroke: "#8a449a",
        bodyColor: "#57405c",
        antennaColor: "#cab8d3",
        shadowColor: "rgba(159, 82, 175, 0.24)",
      };
    case "ruby-drift":
      return {
        wingFill: "#c64747",
        wingAccent: "#d75d5b",
        detailStroke: "#a93d3e",
        bodyColor: "#57424d",
        antennaColor: "#ccb9c2",
        shadowColor: "rgba(188, 69, 69, 0.24)",
      };
    case "lilac-mist":
      return {
        wingFill: "#d8c3f2",
        wingAccent: "#eadcf9",
        detailStroke: "#baa2df",
        bodyColor: "#53617f",
        antennaColor: "#d7d2e4",
        shadowColor: "rgba(199, 178, 230, 0.24)",
      };
    case "violet-velvet":
      return {
        wingFill: "#8b80ad",
        wingAccent: "#a39ac4",
        detailStroke: "#6f6593",
        bodyColor: "#6d5a49",
        antennaColor: "#c9c3d5",
        shadowColor: "rgba(132, 122, 170, 0.22)",
      };
    case "peach-soft":
      return {
        wingFill: "#ffd1ab",
        wingAccent: "#ffe4c7",
        detailStroke: "#f0b37f",
        bodyColor: "#66506b",
        antennaColor: "#d8c7ce",
        shadowColor: "rgba(255, 198, 146, 0.22)",
      };
    case "teal-bloom":
      return {
        wingFill: "#099d95",
        wingAccent: "#1fb1a8",
        detailStroke: "#0f837c",
        bodyColor: "#4d4b64",
        antennaColor: "#c2d2d2",
        shadowColor: "rgba(18, 147, 140, 0.24)",
      };
  }
}

function renderButterflyVariant(variant: ButterflyVariant, style: ButterflyVisualStyle) {
  const commonWingStrokeProps = {
    fill: "none",
    stroke: style.detailStroke,
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity: 0.42,
  };

  switch (variant) {
    case "sky-swallowtail":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C34 10 17 8 7 18 C7 34 17 42 28 42 C20 52 20 60 26 65 C34 60 39 52 43 44 C45 50 44 57 39 66" fill={style.wingFill} />
            <path d="M45 29 C35 17 22 15 14 22 C15 32 22 37 30 37 C26 43 26 48 29 52 C34 48 39 42 43 36" fill={style.wingAccent} opacity="0.82" />
            <path d="M46 32 C36 23 29 19 20 18" {...commonWingStrokeProps} />
            <path d="M42 37 C34 33 28 33 21 35" {...commonWingStrokeProps} />
            <path d="M42 43 C35 48 32 54 31 61" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C66 10 83 8 93 18 C93 34 83 42 72 42 C80 52 80 60 74 65 C66 60 61 52 57 44 C55 50 56 57 61 66" fill={style.wingFill} />
            <path d="M55 29 C65 17 78 15 86 22 C85 32 78 37 70 37 C74 43 74 48 71 52 C66 48 61 42 57 36" fill={style.wingAccent} opacity="0.82" />
            <path d="M54 32 C64 23 71 19 80 18" {...commonWingStrokeProps} />
            <path d="M58 37 C66 33 72 33 79 35" {...commonWingStrokeProps} />
            <path d="M58 43 C65 48 68 54 69 61" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "coral-glow":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C36 13 20 10 10 18 C11 33 21 41 33 41 C27 48 27 57 34 61 C41 55 44 48 46 40" fill={style.wingFill} />
            <path d="M46 28 C37 18 27 16 19 22 C20 30 27 35 34 35 C31 40 31 45 35 48 C40 44 43 39 45 34" fill={style.wingAccent} opacity="0.84" />
            <path d="M45 31 C38 26 31 22 22 20" {...commonWingStrokeProps} />
            <path d="M43 35 C36 34 29 35 23 39" {...commonWingStrokeProps} />
            <path d="M43 40 C38 45 36 50 36 57" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C64 13 80 10 90 18 C89 33 79 41 67 41 C73 48 73 57 66 61 C59 55 56 48 54 40" fill={style.wingFill} />
            <path d="M54 28 C63 18 73 16 81 22 C80 30 73 35 66 35 C69 40 69 45 65 48 C60 44 57 39 55 34" fill={style.wingAccent} opacity="0.84" />
            <path d="M55 31 C62 26 69 22 78 20" {...commonWingStrokeProps} />
            <path d="M57 35 C64 34 71 35 77 39" {...commonWingStrokeProps} />
            <path d="M57 40 C62 45 64 50 64 57" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "pink-ribbon":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 30 C35 12 18 11 10 21 C11 34 20 41 31 40 C25 48 25 57 31 63 C39 58 43 50 46 41 C45 47 43 55 39 61" fill={style.wingFill} />
            <path d="M45 28 C36 19 25 18 19 24 C20 31 26 35 33 35 C29 40 29 46 33 50 C38 46 41 40 44 34" fill={style.wingAccent} opacity="0.84" />
            <path d="M45 30 C37 24 31 20 22 20" {...commonWingStrokeProps} />
            <path d="M43 35 C35 34 29 36 24 40" {...commonWingStrokeProps} />
            <path d="M43 41 C38 47 36 54 36 60" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 30 C65 12 82 11 90 21 C89 34 80 41 69 40 C75 48 75 57 69 63 C61 58 57 50 54 41 C55 47 57 55 61 61" fill={style.wingFill} />
            <path d="M55 28 C64 19 75 18 81 24 C80 31 74 35 67 35 C71 40 71 46 67 50 C62 46 59 40 56 34" fill={style.wingAccent} opacity="0.84" />
            <path d="M55 30 C63 24 69 20 78 20" {...commonWingStrokeProps} />
            <path d="M57 35 C65 34 71 36 76 40" {...commonWingStrokeProps} />
            <path d="M57 41 C62 47 64 54 64 60" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "orchid-garden":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C35 13 19 10 10 18 C10 32 18 40 29 41 C23 47 23 57 30 62 C38 57 42 49 46 41" fill={style.wingFill} />
            <path d="M46 30 C38 20 28 17 20 22 C21 30 27 35 34 35 C31 40 31 46 35 49 C40 45 43 40 45 35" fill={style.wingAccent} opacity="0.82" />
            <path d="M45 31 C39 25 32 21 23 20" {...commonWingStrokeProps} />
            <path d="M43 36 C36 35 30 36 24 39" {...commonWingStrokeProps} />
            <path d="M43 41 C38 46 36 52 35 58" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C65 13 81 10 90 18 C90 32 82 40 71 41 C77 47 77 57 70 62 C62 57 58 49 54 41" fill={style.wingFill} />
            <path d="M54 30 C62 20 72 17 80 22 C79 30 73 35 66 35 C69 40 69 46 65 49 C60 45 57 40 55 35" fill={style.wingAccent} opacity="0.82" />
            <path d="M55 31 C61 25 68 21 77 20" {...commonWingStrokeProps} />
            <path d="M57 36 C64 35 70 36 76 39" {...commonWingStrokeProps} />
            <path d="M57 41 C62 46 64 52 65 58" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "ruby-drift":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C35 12 18 9 9 19 C10 34 20 41 32 41 C26 47 24 56 31 62 C39 56 43 49 46 41" fill={style.wingFill} />
            <path d="M45 29 C36 18 25 16 18 22 C19 30 26 35 33 35 C29 40 29 46 33 49 C38 45 42 39 44 34" fill={style.wingAccent} opacity="0.68" />
            <path d="M45 31 C37 24 30 20 21 19" {...commonWingStrokeProps} />
            <path d="M43 36 C35 35 29 36 23 40" {...commonWingStrokeProps} />
            <path d="M43 41 C38 46 36 51 35 58" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C65 12 82 9 91 19 C90 34 80 41 68 41 C74 47 76 56 69 62 C61 56 57 49 54 41" fill={style.wingFill} />
            <path d="M55 29 C64 18 75 16 82 22 C81 30 74 35 67 35 C71 40 71 46 67 49 C62 45 58 39 56 34" fill={style.wingAccent} opacity="0.68" />
            <path d="M55 31 C63 24 70 20 79 19" {...commonWingStrokeProps} />
            <path d="M57 36 C65 35 71 36 77 40" {...commonWingStrokeProps} />
            <path d="M57 41 C62 46 64 51 65 58" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "lilac-mist":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C35 13 19 11 11 19 C11 33 19 40 30 41 C24 47 24 56 31 61 C39 56 43 49 46 41" fill={style.wingFill} />
            <path d="M45 29 C37 20 27 18 21 23 C21 30 27 34 33 34 C30 39 30 44 34 47 C39 44 42 39 44 34" fill={style.wingAccent} opacity="0.88" />
            <path d="M45 31 C37 24 30 20 22 20" {...commonWingStrokeProps} />
            <path d="M43 35 C36 34 30 35 24 39" {...commonWingStrokeProps} />
            <path d="M43 40 C38 45 35 50 35 56" {...commonWingStrokeProps} />
            <path d="M31 24 C29 29 29 34 31 39" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C65 13 81 11 89 19 C89 33 81 40 70 41 C76 47 76 56 69 61 C61 56 57 49 54 41" fill={style.wingFill} />
            <path d="M55 29 C63 20 73 18 79 23 C79 30 73 34 67 34 C70 39 70 44 66 47 C61 44 58 39 56 34" fill={style.wingAccent} opacity="0.88" />
            <path d="M55 31 C63 24 70 20 78 20" {...commonWingStrokeProps} />
            <path d="M57 35 C64 34 70 35 76 39" {...commonWingStrokeProps} />
            <path d="M57 40 C62 45 65 50 65 56" {...commonWingStrokeProps} />
            <path d="M69 24 C71 29 71 34 69 39" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "violet-velvet":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C35 12 18 10 9 19 C9 34 19 42 31 41 C25 47 25 56 31 61 C38 57 42 50 46 42" fill={style.wingFill} />
            <path d="M46 30 C38 21 28 18 20 23 C21 30 27 35 34 35 C31 40 31 46 35 49 C40 45 43 40 45 35" fill={style.wingAccent} opacity="0.75" />
            <path d="M45 31 C37 24 30 21 22 20" {...commonWingStrokeProps} />
            <path d="M43 36 C36 35 30 36 24 40" {...commonWingStrokeProps} />
            <path d="M43 42 C38 47 36 52 35 59" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C65 12 82 10 91 19 C91 34 81 42 69 41 C75 47 75 56 69 61 C62 57 58 50 54 42" fill={style.wingFill} />
            <path d="M54 30 C62 21 72 18 80 23 C79 30 73 35 66 35 C69 40 69 46 65 49 C60 45 57 40 55 35" fill={style.wingAccent} opacity="0.75" />
            <path d="M55 31 C63 24 70 21 78 20" {...commonWingStrokeProps} />
            <path d="M57 36 C64 35 70 36 76 40" {...commonWingStrokeProps} />
            <path d="M57 42 C62 47 64 52 65 59" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "peach-soft":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C35 13 20 11 11 20 C12 33 20 40 31 40 C25 47 25 56 31 61 C38 57 42 49 46 41" fill={style.wingFill} />
            <path d="M45 29 C37 20 27 18 20 24 C21 30 27 34 33 34 C30 39 30 45 34 48 C39 44 42 39 44 34" fill={style.wingAccent} opacity="0.94" />
            <path d="M45 31 C37 24 30 20 22 20" {...commonWingStrokeProps} />
            <path d="M43 35 C36 34 30 35 24 39" {...commonWingStrokeProps} />
            <path d="M43 40 C38 45 35 50 35 56" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C65 13 80 11 89 20 C88 33 80 40 69 40 C75 47 75 56 69 61 C62 57 58 49 54 41" fill={style.wingFill} />
            <path d="M55 29 C63 20 73 18 80 24 C79 30 73 34 67 34 C70 39 70 45 66 48 C61 44 58 39 56 34" fill={style.wingAccent} opacity="0.94" />
            <path d="M55 31 C63 24 70 20 78 20" {...commonWingStrokeProps} />
            <path d="M57 35 C64 34 70 35 76 39" {...commonWingStrokeProps} />
            <path d="M57 40 C62 45 65 50 65 56" {...commonWingStrokeProps} />
          </g>
        </>
      );
    case "teal-bloom":
      return (
        <>
          <g className="butterfly__wing butterfly__wing--left">
            <path d="M47 31 C35 12 18 10 9 19 C10 34 20 42 32 42 C26 48 25 58 31 63 C39 57 43 50 46 42" fill={style.wingFill} />
            <path d="M45 29 C36 19 26 17 19 23 C20 31 26 35 33 35 C30 40 30 46 34 50 C39 46 42 40 44 34" fill={style.wingAccent} opacity="0.78" />
            <path d="M45 31 C37 24 30 20 21 19" {...commonWingStrokeProps} />
            <path d="M43 36 C35 35 29 36 23 40" {...commonWingStrokeProps} />
            <path d="M43 42 C38 47 36 53 35 60" {...commonWingStrokeProps} />
          </g>
          <g className="butterfly__wing butterfly__wing--right">
            <path d="M53 31 C65 12 82 10 91 19 C90 34 80 42 68 42 C74 48 75 58 69 63 C61 57 57 50 54 42" fill={style.wingFill} />
            <path d="M55 29 C64 19 74 17 81 23 C80 31 74 35 67 35 C70 40 70 46 66 50 C61 46 58 40 56 34" fill={style.wingAccent} opacity="0.78" />
            <path d="M55 31 C63 24 70 20 79 19" {...commonWingStrokeProps} />
            <path d="M57 36 C65 35 71 36 77 40" {...commonWingStrokeProps} />
            <path d="M57 42 C62 47 64 53 65 60" {...commonWingStrokeProps} />
          </g>
        </>
      );
  }
}

function buildGiftBurstButterflies(): GiftBurstButterfly[] {
  return [
    { id: "gift-butterfly-1", variant: "pink-ribbon", size: 28, rotate: -12, flightX: -7.4, flightY: -10.8, flightDuration: 1.96, flapDuration: 0.86, delay: 0.02, scale: 0.88 },
    { id: "gift-butterfly-2", variant: "sky-swallowtail", size: 31, rotate: 8, flightX: -4.8, flightY: -12.4, flightDuration: 2.08, flapDuration: 0.92, delay: 0.08, scale: 0.94 },
    { id: "gift-butterfly-3", variant: "coral-glow", size: 26, rotate: -5, flightX: -1.9, flightY: -9.8, flightDuration: 1.84, flapDuration: 0.82, delay: 0.12, scale: 0.82 },
    { id: "gift-butterfly-4", variant: "lilac-mist", size: 30, rotate: 10, flightX: 1.8, flightY: -12.8, flightDuration: 2.02, flapDuration: 0.9, delay: 0.16, scale: 0.9 },
    { id: "gift-butterfly-5", variant: "ruby-drift", size: 27, rotate: -8, flightX: 4.9, flightY: -10.6, flightDuration: 1.92, flapDuration: 0.84, delay: 0.2, scale: 0.84 },
    { id: "gift-butterfly-6", variant: "teal-bloom", size: 29, rotate: 12, flightX: 7.3, flightY: -11.4, flightDuration: 2.06, flapDuration: 0.9, delay: 0.26, scale: 0.88 },
    { id: "gift-butterfly-7", variant: "peach-soft", size: 24, rotate: -10, flightX: -5.8, flightY: -8.2, flightDuration: 1.78, flapDuration: 0.8, delay: 0.18, scale: 0.76 },
    { id: "gift-butterfly-8", variant: "violet-velvet", size: 25, rotate: 7, flightX: 5.9, flightY: -8.8, flightDuration: 1.86, flapDuration: 0.82, delay: 0.28, scale: 0.78 },
  ];
}

const giftBirdPalettes: GiftBirdPalette[] = [
  {
    bodyColor: "#b65db5",
    breastColor: "#d97ad7",
    bellyColor: "#f3a5f0",
    wingColor: "#8c3d87",
    tailColor: "#94458d",
    beakColor: "#28253a",
    outlineColor: "#4a2c56",
    legColor: "#55495d",
    shadowColor: "rgba(145, 84, 145, 0.24)",
  },
  {
    bodyColor: "#6b9fcb",
    breastColor: "#78acd4",
    bellyColor: "#9ec3e1",
    wingColor: "#3e6689",
    tailColor: "#49739a",
    beakColor: "#1f2431",
    outlineColor: "#33516d",
    legColor: "#4b5663",
    shadowColor: "rgba(92, 134, 168, 0.22)",
  },
  {
    bodyColor: "#90a85b",
    breastColor: "#9fb86c",
    bellyColor: "#c3d08d",
    wingColor: "#6f7f41",
    tailColor: "#718545",
    beakColor: "#232434",
    outlineColor: "#4d5d36",
    legColor: "#55574f",
    shadowColor: "rgba(116, 139, 71, 0.22)",
  },
  {
    bodyColor: "#e7ba8f",
    breastColor: "#f5d1ac",
    bellyColor: "#ffe7cb",
    wingColor: "#b4865f",
    tailColor: "#c09067",
    beakColor: "#2a2836",
    outlineColor: "#876245",
    legColor: "#655649",
    shadowColor: "rgba(175, 137, 99, 0.22)",
  },
  {
    bodyColor: "#5f88b8",
    breastColor: "#74a1cb",
    bellyColor: "#9ebfde",
    wingColor: "#3d5b84",
    tailColor: "#44658f",
    beakColor: "#232333",
    outlineColor: "#304969",
    legColor: "#4b5561",
    shadowColor: "rgba(89, 122, 166, 0.22)",
  },
];

function buildGiftBurstBirds(): GiftBurstBird[] {
  return [
    { id: "gift-bird-1", left: 14, top: 14, size: 44, rotate: -11, releaseX: "44vw", releaseY: "36vh", releaseDuration: 4.8, releaseDelay: 0.08, driftX: 1.8, driftY: -0.28, flightDuration: 30.4, driftDuration: 7.2, wingDuration: 1.56, delay: -1.6, scale: 0.94, palette: giftBirdPalettes[0] },
    { id: "gift-bird-2", left: 22, top: 20, size: 42, rotate: 7, releaseX: "36vw", releaseY: "32vh", releaseDuration: 5.02, releaseDelay: 0.24, driftX: -1.7, driftY: -0.24, flightDuration: 31.2, driftDuration: 7.8, wingDuration: 1.64, delay: -2.4, scale: 0.92, palette: giftBirdPalettes[1] },
    { id: "gift-bird-3", left: 30, top: 15, size: 43, rotate: -8, releaseX: "30vw", releaseY: "35vh", releaseDuration: 5.18, releaseDelay: 0.42, driftX: 1.95, driftY: -0.3, flightDuration: 32, driftDuration: 7.4, wingDuration: 1.54, delay: -0.8, scale: 0.95, palette: giftBirdPalettes[2] },
    { id: "gift-bird-4", left: 38, top: 21, size: 41, rotate: 6, releaseX: "22vw", releaseY: "31vh", releaseDuration: 5.32, releaseDelay: 0.58, driftX: -1.85, driftY: -0.22, flightDuration: 31.6, driftDuration: 7.9, wingDuration: 1.62, delay: -3.4, scale: 0.92, palette: giftBirdPalettes[3] },
    { id: "gift-bird-5", left: 46, top: 16, size: 45, rotate: -5, releaseX: "15vw", releaseY: "34vh", releaseDuration: 5.46, releaseDelay: 0.74, driftX: 1.7, driftY: -0.26, flightDuration: 30.9, driftDuration: 7.1, wingDuration: 1.5, delay: -1.2, scale: 0.96, palette: giftBirdPalettes[4] },
    { id: "gift-bird-6", left: 54, top: 21, size: 44, rotate: 5, releaseX: "7vw", releaseY: "30vh", releaseDuration: 5.6, releaseDelay: 0.9, driftX: -1.8, driftY: -0.2, flightDuration: 32.4, driftDuration: 8, wingDuration: 1.68, delay: -2.7, scale: 0.95, palette: giftBirdPalettes[1] },
    { id: "gift-bird-7", left: 62, top: 15, size: 42, rotate: -7, releaseX: "0vw", releaseY: "33vh", releaseDuration: 5.72, releaseDelay: 1.06, driftX: 1.9, driftY: -0.28, flightDuration: 31.1, driftDuration: 7.3, wingDuration: 1.56, delay: -0.9, scale: 0.93, palette: giftBirdPalettes[2] },
    { id: "gift-bird-8", left: 70, top: 20, size: 44, rotate: 8, releaseX: "-8vw", releaseY: "29vh", releaseDuration: 5.86, releaseDelay: 1.22, driftX: -2.05, driftY: -0.22, flightDuration: 32.8, driftDuration: 7.9, wingDuration: 1.66, delay: -3.1, scale: 0.96, palette: giftBirdPalettes[0] },
    { id: "gift-bird-9", left: 78, top: 15, size: 43, rotate: -6, releaseX: "-16vw", releaseY: "32vh", releaseDuration: 6.02, releaseDelay: 1.38, driftX: 1.75, driftY: -0.24, flightDuration: 30.7, driftDuration: 7.2, wingDuration: 1.54, delay: -1.8, scale: 0.94, palette: giftBirdPalettes[3] },
    { id: "gift-bird-10", left: 86, top: 20, size: 45, rotate: 7, releaseX: "-24vw", releaseY: "28vh", releaseDuration: 6.18, releaseDelay: 1.54, driftX: -1.9, driftY: -0.2, flightDuration: 31.9, driftDuration: 7.7, wingDuration: 1.62, delay: -4.2, scale: 0.97, palette: giftBirdPalettes[4] },
  ];
}

function buildGiftAmbientButterflies(): Butterfly[] {
  return [
    { id: "gift-ambient-butterfly-1", left: 34, top: 28, size: 27, rotate: -8, variant: "pink-ribbon", flightX: 4.2, flightY: -3.8, flightDuration: 10.4, driftDuration: 3.8, flapDuration: 0.88, delay: -1.6, scale: 0.84 },
    { id: "gift-ambient-butterfly-2", left: 46, top: 21, size: 30, rotate: 6, variant: "sky-swallowtail", flightX: -3.6, flightY: -4.8, flightDuration: 11.2, driftDuration: 4.2, flapDuration: 0.92, delay: -2.4, scale: 0.9 },
    { id: "gift-ambient-butterfly-3", left: 58, top: 32, size: 26, rotate: -10, variant: "violet-velvet", flightX: 3.8, flightY: -3.2, flightDuration: 9.8, driftDuration: 3.5, flapDuration: 0.82, delay: -0.8, scale: 0.82 },
    { id: "gift-ambient-butterfly-4", left: 68, top: 44, size: 28, rotate: 9, variant: "teal-bloom", flightX: -4.5, flightY: -4.1, flightDuration: 10.8, driftDuration: 4.1, flapDuration: 0.88, delay: -3.2, scale: 0.86 },
    { id: "gift-ambient-butterfly-5", left: 50, top: 56, size: 24, rotate: 4, variant: "peach-soft", flightX: 3.2, flightY: -2.8, flightDuration: 9.4, driftDuration: 3.2, flapDuration: 0.8, delay: -1.1, scale: 0.76 },
    { id: "gift-ambient-butterfly-6", left: 61, top: 36, size: 25, rotate: -7, variant: "coral-glow", flightX: -3.8, flightY: -3.4, flightDuration: 10.1, driftDuration: 3.7, flapDuration: 0.84, delay: -2.8, scale: 0.8 },
  ];
}

function renderGiftBird(bird: { palette: GiftBirdPalette }) {
  const { palette } = bird;

  return (
    <svg className="gift-bird__svg" viewBox="0 0 124 92" role="presentation" aria-hidden="true">
      <path
        d="M18 57 C29 50 38 48 47 50 C40 59 30 63 18 57 Z"
        fill={palette.tailColor}
        stroke={palette.outlineColor}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <g className="gift-bird__wings">
        <path
          d="M55 50 C44 33 29 28 18 34 C18 47 32 59 52 58 Z"
          fill={palette.wingColor}
          stroke={palette.outlineColor}
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M49 46 C41 39 32 38 26 41 C30 48 38 53 49 53 Z"
          fill="rgba(255,255,255,0.22)"
          opacity="0.7"
        />
      </g>
      <ellipse
        cx="66"
        cy="54"
        rx="28"
        ry="19"
        fill={palette.bodyColor}
        stroke={palette.outlineColor}
        strokeWidth="2.8"
      />
      <ellipse cx="74" cy="60" rx="17" ry="10.5" fill={palette.bellyColor} />
      <ellipse cx="76" cy="49" rx="17" ry="14" fill={palette.breastColor} />
      <circle
        cx="89"
        cy="38"
        r="13"
        fill={palette.breastColor}
        stroke={palette.outlineColor}
        strokeWidth="2.8"
      />
      <path
        d="M82 26 C85 19 91 16 96 17 C95 22 90 26 84 29 Z"
        fill={palette.bodyColor}
        stroke={palette.outlineColor}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M101 39 L116 35 L102 45 Z"
        fill={palette.beakColor}
        stroke={palette.outlineColor}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="92" cy="37" r="3.1" fill="#ffffff" />
      <circle cx="93" cy="37" r="1.4" fill={palette.outlineColor} />
      <path
        d="M63 70 C61 75 60 79 60 84"
        stroke={palette.legColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M72 70 C70 75 69 79 69 84"
        stroke={palette.legColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M58 84 H54" stroke={palette.legColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M68 84 H72" stroke={palette.legColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GiftBox({
  opened,
  burstPhase,
  reducedMotion,
  burstButterflies,
  onOpen,
  variant = "primary",
  locked = false,
  disabled = false,
  labelClosed = "Open the gift box",
  labelOpened = "Open the poem",
  showBurst = true,
  lockRef,
}: {
  opened: boolean;
  burstPhase: GiftBurstPhase;
  reducedMotion: boolean;
  burstButterflies: GiftBurstButterfly[];
  onOpen: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "second";
  locked?: boolean;
  disabled?: boolean;
  labelClosed?: string;
  labelOpened?: string;
  showBurst?: boolean;
  lockRef?: RefObject<HTMLSpanElement>;
}) {
  return (
    <button
      type="button"
      className={`gift-box gift-box--${variant}`}
      data-open={opened}
      data-phase={burstPhase}
      data-locked={locked}
      aria-label={opened ? labelOpened : labelClosed}
      onClick={onOpen}
      disabled={disabled}
    >
      <span className="gift-box__shadow" aria-hidden="true" />
      <span className="gift-box__glow" aria-hidden="true" />
      {!reducedMotion && showBurst && burstPhase === "burst" ? (
        <span className="gift-box__burst" aria-hidden="true">
          {burstButterflies.map((butterfly) => {
            const butterflyStyle = getButterflyVariantStyle(butterfly.variant);

            return (
              <span
                key={butterfly.id}
                className="gift-burst-butterfly"
                style={
                  {
                    width: `${Math.round(butterfly.size * 1.45)}px`,
                    height: `${Math.round(butterfly.size * 1.16)}px`,
                    "--gift-burst-x": `${butterfly.flightX}rem`,
                    "--gift-burst-y": `${butterfly.flightY}rem`,
                    "--gift-burst-duration": `${butterfly.flightDuration}s`,
                    "--gift-burst-delay": `${butterfly.delay}s`,
                    "--gift-burst-rotate": `${butterfly.rotate}deg`,
                    "--gift-burst-scale": butterfly.scale,
                    "--gift-burst-flap-duration": `${butterfly.flapDuration}s`,
                    "--gift-burst-shadow-color": butterflyStyle.shadowColor,
                  } as CSSProperties
                }
              >
                <span className="gift-burst-butterfly__float">
                  <svg className="gift-burst-butterfly__svg" viewBox="0 0 100 72" role="presentation" aria-hidden="true">
                    {renderButterflyVariant(butterfly.variant, butterflyStyle)}
                    <path
                      className="gift-burst-butterfly__body"
                      d="M49.2 18 C47.2 25 46.8 36 47.7 48 C48.2 56 49 61 50 64 C51 61 51.8 56 52.3 48 C53.2 36 52.8 25 50.8 18 Z"
                      fill={butterflyStyle.bodyColor}
                    />
                    <ellipse cx="50" cy="27" rx="4.2" ry="8.6" fill={butterflyStyle.bodyColor} opacity="0.94" />
                    <path
                      className="gift-burst-butterfly__antenna"
                      d="M49 22 C44.5 14 39.5 11.5 35.5 10.5"
                      stroke={butterflyStyle.antennaColor}
                    />
                    <path
                      className="gift-burst-butterfly__antenna"
                      d="M51 22 C55.5 14 60.5 11.5 64.5 10.5"
                      stroke={butterflyStyle.antennaColor}
                    />
                  </svg>
                </span>
              </span>
            );
          })}
          <span className="gift-box__spark gift-box__spark--one" />
          <span className="gift-box__spark gift-box__spark--two" />
          <span className="gift-box__spark gift-box__spark--three" />
        </span>
      ) : null}
      {locked ? (
        <span className="gift-box__lock" aria-hidden="true" ref={lockRef}>
          <LockIcon className="gift-box__lock-icon" />
        </span>
      ) : null}
      <svg className="gift-box__illustration" viewBox="0 0 160 160" role="presentation" aria-hidden="true">
        <g className="gift-box__base-group">
          <ellipse className="gift-box__base-shadow" cx="80" cy="132" rx="42" ry="12" />
          <rect className="gift-box__base-front" x="34" y="62" width="92" height="64" rx="18" />
          <path className="gift-box__base-side gift-box__base-side--left" d="M34 76 H58 V126 H34 Z" />
          <path className="gift-box__base-side gift-box__base-side--right" d="M102 76 H126 V126 H102 Z" />
          <rect className="gift-box__ribbon-vertical" x="69" y="62" width="22" height="64" rx="10" />
          <rect className="gift-box__ribbon-horizontal" x="34" y="84" width="92" height="17" rx="8.5" />
          <path className="gift-box__base-highlight" d="M45 70 C56 66 66 65 77 66 V120 C66 119 56 117 45 113 Z" />
        </g>
        <g className="gift-box__lid-group">
          <rect className="gift-box__lid-top" x="28" y="44" width="104" height="28" rx="14" />
          <rect className="gift-box__lid-front" x="28" y="52" width="104" height="20" rx="10" />
          <rect className="gift-box__lid-ribbon-vertical" x="69" y="44" width="22" height="28" rx="10" />
          <rect className="gift-box__lid-ribbon-horizontal" x="28" y="51" width="104" height="14" rx="7" />
          <path className="gift-box__bow-loop gift-box__bow-loop--left" d="M79 40 C66 18 44 20 45 37 C45 49 62 51 74 45 Z" />
          <path className="gift-box__bow-loop gift-box__bow-loop--right" d="M81 40 C94 18 116 20 115 37 C115 49 98 51 86 45 Z" />
          <ellipse className="gift-box__bow-knot" cx="80" cy="40" rx="10" ry="8" />
          <path className="gift-box__bow-tail gift-box__bow-tail--left" d="M75 46 C67 54 62 62 63 72 C72 68 76 60 78 51 Z" />
          <path className="gift-box__bow-tail gift-box__bow-tail--right" d="M85 46 C93 54 98 62 97 72 C88 68 84 60 82 51 Z" />
          <path className="gift-box__lid-shine" d="M42 48 C56 44 69 43 80 44 V54 C67 53 54 54 42 58 Z" />
        </g>
      </svg>
    </button>
  );
}

function GiftPoemOverlay({
  visible,
  expanded,
  onToggleExpanded,
  onClose,
}: {
  visible: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="gift-poem-overlay"
      role="presentation"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="gift-poem-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-poem-title"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <button type="button" className="gift-poem-card__close" aria-label="Close the poem" onClick={onClose}>
          Kapat
        </button>
        <span className="gift-poem-card__garland" aria-hidden="true">
          <MiniSparkleIcon className="gift-poem-card__garland-icon gift-poem-card__garland-icon--sparkle" />
          <span className="gift-poem-card__garland-line" />
          <MiniHeartIcon className="gift-poem-card__garland-icon gift-poem-card__garland-icon--heart" />
          <MiniBloomIcon className="gift-poem-card__garland-icon gift-poem-card__garland-icon--flower" centerFill="#fff0a8" />
        </span>
        <span className="gift-poem-card__eyebrow">kutunun içinden dökülen bir şiir</span>
        <h2 id="gift-poem-title" className="gift-poem-card__title">
          Desem ki
        </h2>
        <span className="gift-poem-card__body">{expanded ? giftPoemFull : giftPoemPreview}</span>
        <div className="gift-poem-card__actions">
          <button type="button" className="gift-poem-card__more" onClick={onToggleExpanded}>
            {expanded ? "Daha az göster" : "Devamını oku"}
          </button>
        </div>
      </div>
    </div>
  );
}

function shuffleArray<T>(items: readonly T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

function buildSecondGiftPuzzlePieces(): PuzzlePieceState[] {
  const shuffledSlots = shuffleArray(secondGiftScatterSlots).slice(0, secondGiftPuzzleTotalPieces);

  return Array.from({ length: secondGiftPuzzleTotalPieces }, (_unused, index) => ({
    id: `second-gift-piece-${index + 1}`,
    correctSlot: index,
    x: shuffledSlots[index].x,
    y: shuffledSlots[index].y,
    placed: false,
  }));
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
    flower.bouquetStemAttachY ??
    (flower.bouquetRole === "hero"
      ? 4.8
      : flower.bouquetRole === "support"
        ? 4.2
        : flower.bouquetRole === "foliage"
          ? 3.4
          : 3.7);
  const stemTip = {
    x: crownPoint.x + (flower.bouquetStemAttachX ?? 0),
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
  isSecretFlower = false,
  secretOpen = false,
  secretNoteId,
  onClick,
  onKeyDown,
}: {
  flower: FlowerConfig;
  mode: "opening" | "bouquet";
  isSecretFlower?: boolean;
  secretOpen?: boolean;
  secretNoteId?: string;
  onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
}) {
  const isInteractiveSecret = isSecretFlower && mode === "bouquet";
  const bouquetScale = flower.bouquetScale ?? 1;
  const bouquetSwayDirection = flower.startRotation >= 0 ? 1 : -1;
  const bouquetSwayStrength =
    flower.bouquetLayer === "front"
      ? 1
      : flower.bouquetLayer === "mid"
        ? 0.78
        : 0.56;
  const flowerOrder = Number.parseInt(flower.id.replace("f-", ""), 10) || 0;
  const bouquetWidth = flower.isCenterMessage
    ? `clamp(104px, ${flower.size * bouquetScale}vw, 248px)`
    : `clamp(86px, ${flower.size * bouquetScale * 0.94}vw, 228px)`;
  const bouquetTop = `${bouquetBaseTop[flower.bouquetLayer] + flower.bouquetTargetY}%`;
  const bouquetZ = isInteractiveSecret
    ? 148
    : isSecretFlower
    ? 136
    : flower.isCenterMessage
      ? 96
      : bouquetLayerZ[flower.bouquetLayer] + Math.round(flower.depth * 12);

  return (
    <div
      className={`flower flower--${mode} flower--layer-${flower.bouquetLayer}${
        flower.isCenterMessage ? " flower--message" : ""
      }${
        isSecretFlower ? " flower--secret" : ""
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
      data-center-message={flower.isCenterMessage ? "true" : "false"}
      data-secret-flower={isSecretFlower ? "true" : "false"}
      data-secret-open={secretOpen ? "true" : "false"}
      role={isInteractiveSecret ? "button" : undefined}
      aria-label={isInteractiveSecret ? "Open the secret flower note" : undefined}
      aria-controls={isInteractiveSecret ? secretNoteId : undefined}
      aria-expanded={isInteractiveSecret ? secretOpen : undefined}
      tabIndex={isInteractiveSecret ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={
        mode === "opening"
          ? getFlowerStyle(flower)
          : ({
              left: `${50 + flower.bouquetTargetX}%`,
              top: bouquetTop,
              width: bouquetWidth,
              zIndex: bouquetZ,
              "--bouquet-sway-y-base": `${(0.08 + flower.depth * 0.12) * bouquetSwayStrength}rem`,
              "--bouquet-sway-rotate-base": `${(0.48 + flower.depth * 0.82) * bouquetSwayDirection * bouquetSwayStrength}deg`,
              "--bouquet-sway-duration": `${(
                flower.motionWeight === "heavy"
                  ? 4.8
                  : flower.motionWeight === "medium"
                    ? 5.6
                    : 6.4
              ).toFixed(2)}s`,
              "--bouquet-sway-delay": `${(-flowerOrder * 0.18 - flower.depth * 0.9).toFixed(2)}s`,
            } as CSSProperties)
      }
    >
      <div className="flower__motion">
        {mode === "opening" && shouldShowOpeningStem(flower) ? (
          <span className="flower__stem flower__stem--opening">{renderStemArt(flower.variant, "opening")}</span>
        ) : null}
        <div className="flower__head">
          {renderFlower(flower.variant, flower.palette)}
        </div>
      </div>
    </div>
  );
}

function MiniBloomIcon({
  className,
  centerFill = "#ffe7a3",
}: {
  className?: string;
  centerFill?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="7.8" r="4.9" fill="currentColor" />
      <circle cx="24.2" cy="13.7" r="4.9" fill="currentColor" />
      <circle cx="21.1" cy="23.2" r="4.9" fill="currentColor" />
      <circle cx="10.9" cy="23.2" r="4.9" fill="currentColor" />
      <circle cx="7.8" cy="13.7" r="4.9" fill="currentColor" />
      <circle cx="16" cy="16" r="4.1" fill={centerFill} />
    </svg>
  );
}

function MiniHeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 19.2 5.8 13.3C3.9 11.5 3.8 8.4 5.5 6.6c1.7-1.9 4.6-2 6.4-.3l.1.2.1-.2c1.8-1.7 4.7-1.6 6.4.3 1.7 1.8 1.6 4.9-.3 6.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MiniSparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <path d="M14 2.8 16.9 11.1 25.2 14 16.9 16.9 14 25.2 11.1 16.9 2.8 14 11.1 11.1Z" fill="currentColor" />
      <circle cx="14" cy="14" r="2.2" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <rect x="6.5" y="12" width="15" height="11" rx="3.6" fill="currentColor" />
      <path
        d="M10 12 V9.7 C10 7.1 11.8 5 14 5 C16.2 5 18 7.1 18 9.7 V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="17" r="1.6" fill="rgba(255,255,255,0.86)" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} aria-hidden="true">
      <circle cx="8" cy="12" r="5.2" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <path d="M13.6 12 H28" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M22 12 V16" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M26.6 12 V15" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="8" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function BirthdayDayOneCard() {
  return (
    <div className="birthday-day-card" aria-label={birthdayDayOneCardMessage}>
      <span className="birthday-day-card__eyebrow">for ceren</span>
      <strong className="birthday-day-card__body">{birthdayDayOneCardMessage}</strong>
    </div>
  );
}

function SecondGiftHintCard({
  visible,
  hintState,
}: {
  visible: boolean;
  hintState: SecondGiftHintState;
}) {
  if (!visible || hintState === "hidden") {
    return null;
  }

  return (
    <div className="second-gift-hint-card" data-state={hintState} role="status" aria-live="polite">
      <span className="second-gift-hint-card__eyebrow">locked surprise</span>
      <strong className="second-gift-hint-card__title">
        {hintState === "found" ? secondGiftFoundMessage : secondGiftHintMessage}
      </strong>
    </div>
  );
}

function SecondGiftKeyAnimation({
  phase,
  geometry,
}: {
  phase: SecondGiftKeyAnimationPhase;
  geometry: SecondGiftKeyAnimationGeometry | null;
}) {
  if (phase === "hidden" || !geometry) {
    return null;
  }

  const isTraveling = phase === "travel";

  return (
    <div
      className="second-gift-key-animation"
      data-phase={phase}
      aria-hidden="true"
      style={
        {
          left: `${isTraveling ? geometry.endX : geometry.startX}px`,
          top: `${isTraveling ? geometry.endY : geometry.startY}px`,
        } as CSSProperties
      }
    >
      <span className="second-gift-key-animation__halo" />
      <span className="second-gift-key-animation__icon-shell">
        <KeyIcon className="second-gift-key-animation__icon" />
      </span>
    </div>
  );
}

function SecondGiftPuzzleOverlay({
  visible,
  solved,
  celebrating,
  pieces,
  activePieceId,
  stageRef,
  boardRef,
  onPiecePointerDown,
  onReset,
  onClose,
}: {
  visible: boolean;
  solved: boolean;
  celebrating: boolean;
  pieces: PuzzlePieceState[];
  activePieceId: string | null;
  stageRef: RefObject<HTMLDivElement>;
  boardRef: RefObject<HTMLDivElement>;
  onPiecePointerDown: (event: ReactPointerEvent<HTMLButtonElement>, pieceId: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="second-gift-overlay"
      role="presentation"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="second-gift-overlay__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="second-gift-title"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="second-gift-overlay__actions">
          <button type="button" className="second-gift-overlay__reset" aria-label="Reset the puzzle" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="second-gift-overlay__close" aria-label="Close the puzzle" onClick={onClose}>
            Kapat
          </button>
        </div>
        <span className="second-gift-overlay__eyebrow">a locked gift turned into a tiny puzzle</span>
        {solved ? (
          <h2 id="second-gift-title" className="second-gift-overlay__title" data-visible="true">
            Another bloom for Ceren
          </h2>
        ) : (
          <span id="second-gift-title" className="second-gift-overlay__title-placeholder" aria-hidden="true" />
        )}
        <div className="second-gift-puzzle">
          <div className="second-gift-puzzle__stage" ref={stageRef}>
            <div
              className="second-gift-puzzle__board"
              data-solved={solved}
              data-celebrating={celebrating}
              ref={boardRef}
            >
              <div className="second-gift-puzzle__template" data-hidden={solved} aria-hidden="true">
                {Array.from({ length: secondGiftPuzzleTotalPieces }, (_unused, slotIndex) => (
                  <span key={`second-gift-slot-${slotIndex}`} className="second-gift-puzzle__slot" />
                ))}
              </div>
              {solved ? (
                <span
                  className="second-gift-puzzle__final-image"
                  aria-hidden="true"
                  style={{ backgroundImage: `url("${flowerImage}")` } as CSSProperties}
                />
              ) : null}
              {celebrating ? (
                <span className="second-gift-puzzle__glow" aria-hidden="true">
                  <MiniSparkleIcon className="second-gift-puzzle__glow-icon second-gift-puzzle__glow-icon--one" />
                  <MiniSparkleIcon className="second-gift-puzzle__glow-icon second-gift-puzzle__glow-icon--two" />
                  <MiniBloomIcon className="second-gift-puzzle__glow-icon second-gift-puzzle__glow-icon--three" centerFill="#fff2aa" />
                </span>
              ) : null}
            </div>
            {!solved
              ? pieces.map((piece) => {
              const column = piece.correctSlot % secondGiftPuzzleGridSize;
              const row = Math.floor(piece.correctSlot / secondGiftPuzzleGridSize);

              return (
                <button
                  key={piece.id}
                  type="button"
                  className="second-gift-puzzle__piece"
                  data-placed={piece.placed}
                  data-active={activePieceId === piece.id}
                  data-solved={solved}
                  onPointerDown={(event) => {
                    onPiecePointerDown(event, piece.id);
                  }}
                  disabled={piece.placed}
                  aria-label={piece.placed ? "Puzzle piece placed" : "Drag puzzle piece into place"}
                  style={
                    {
                      left: `${piece.x}%`,
                      top: `${piece.y}%`,
                      backgroundImage: `url("${flowerImage}")`,
                      backgroundPosition: `${column * 50}% ${row * 50}%`,
                    } as CSSProperties
                  }
                />
              );
            })
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SecretFlowerNote({
  noteId,
  flower,
  open,
  note,
}: {
  noteId: string;
  flower: FlowerConfig;
  open: boolean;
  note: SecretNoteCopy;
}) {
  const left = `${50 + flower.bouquetTargetX + 5.5}%`;
  const top = `${bouquetBaseTop[flower.bouquetLayer] + flower.bouquetTargetY + 5.5}%`;

  return (
    <div
      id={noteId}
      className="secret-flower-note"
      data-open={open}
      aria-hidden={!open}
      style={
        {
          left,
          top,
        } as CSSProperties
      }
    >
      <span className="secret-flower-note__paper">
        <span className="secret-flower-note__ornaments" aria-hidden="true">
          <span className="secret-flower-note__ornament secret-flower-note__ornament--flower secret-flower-note__ornament--top-left">
            <MiniBloomIcon className="secret-flower-note__icon" centerFill="#ffe7a3" />
          </span>
          <span className="secret-flower-note__ornament secret-flower-note__ornament--heart secret-flower-note__ornament--top-right">
            <MiniHeartIcon className="secret-flower-note__icon" />
          </span>
          <span className="secret-flower-note__ornament secret-flower-note__ornament--heart secret-flower-note__ornament--left-mid">
            <MiniHeartIcon className="secret-flower-note__icon" />
          </span>
          <span className="secret-flower-note__ornament secret-flower-note__ornament--flower secret-flower-note__ornament--bottom-right">
            <MiniBloomIcon className="secret-flower-note__icon" centerFill="#fff1ae" />
          </span>
          <span className="secret-flower-note__ornament secret-flower-note__ornament--sparkle secret-flower-note__ornament--top-center">
            <MiniSparkleIcon className="secret-flower-note__icon" />
          </span>
          <span className="secret-flower-note__ornament secret-flower-note__ornament--flower secret-flower-note__ornament--right-mid">
            <MiniBloomIcon className="secret-flower-note__icon" centerFill="#fff5b8" />
          </span>
          <span className="secret-flower-note__ornament secret-flower-note__ornament--sparkle secret-flower-note__ornament--bottom-left">
            <MiniSparkleIcon className="secret-flower-note__icon" />
          </span>
        </span>
        <span className="secret-flower-note__spark" aria-hidden="true" />
        <span className="secret-flower-note__garland" aria-hidden="true">
          <MiniSparkleIcon className="secret-flower-note__garland-icon secret-flower-note__garland-icon--sparkle" />
          <span className="secret-flower-note__garland-line" />
          <MiniHeartIcon className="secret-flower-note__garland-icon secret-flower-note__garland-icon--heart" />
          <MiniBloomIcon className="secret-flower-note__garland-icon secret-flower-note__garland-icon--flower" centerFill="#fff0a8" />
        </span>
        <span className="secret-flower-note__body">{note.body}</span>
      </span>
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
      <div className="bouquet-wrap__dedication" data-wrap-piece>
        <span className="bouquet-wrap__dedication-text">
          <span className="bouquet-wrap__dedication-line">Happy Birthday</span>
          <span className="bouquet-wrap__dedication-line">Ceren</span>
        </span>
      </div>
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

function NoteCardContents({
  note,
  open,
  glowRef,
}: {
  note: NoteCopy;
  open: boolean;
  glowRef?: RefObject<HTMLSpanElement>;
}) {
  return (
    <>
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
          <span className="note-card__sheet-garland" aria-hidden="true">
            <MiniBloomIcon className="note-card__sheet-garland-icon note-card__sheet-garland-icon--flower" centerFill="#fff1a8" />
            <span className="note-card__sheet-garland-line" />
            <MiniHeartIcon className="note-card__sheet-garland-icon note-card__sheet-garland-icon--heart" />
            <MiniSparkleIcon className="note-card__sheet-garland-icon note-card__sheet-garland-icon--sparkle" />
          </span>
          {note.eyebrow ? <span className="note-card__eyebrow">{note.eyebrow}</span> : null}
          <span className="note-card__title">{note.title}</span>
          <span className="note-card__body">{note.body}</span>
          {note.signature ? <span className="note-card__signature">{note.signature}</span> : null}
        </span>
        {open ? (
          <span className="note-card__paper-blooms" aria-hidden="true">
            <span className="note-card__paper-bloom note-card__paper-bloom--top-right-flower">
              <MiniBloomIcon className="note-card__paper-bloom-icon" centerFill="#fff0ad" />
            </span>
            <span className="note-card__paper-bloom note-card__paper-bloom--top-right-heart">
              <MiniHeartIcon className="note-card__paper-bloom-icon" />
            </span>
            <span className="note-card__paper-bloom note-card__paper-bloom--bottom-left-sparkle">
              <MiniSparkleIcon className="note-card__paper-bloom-icon" />
            </span>
            <span className="note-card__paper-bloom note-card__paper-bloom--bottom-right-flower">
              <MiniBloomIcon className="note-card__paper-bloom-icon" centerFill="#fff6c3" />
            </span>
          </span>
        ) : null}
      </span>
      <span className="note-card__ornaments" aria-hidden="true">
        <span className="note-card__ornament note-card__ornament--flower note-card__ornament--top-left">
          <MiniBloomIcon className="note-card__ornament-icon" centerFill="#fff0a8" />
        </span>
        <span className="note-card__ornament note-card__ornament--heart note-card__ornament--top-right">
          <MiniHeartIcon className="note-card__ornament-icon" />
        </span>
        <span className="note-card__ornament note-card__ornament--sparkle note-card__ornament--left-mid">
          <MiniSparkleIcon className="note-card__ornament-icon" />
        </span>
        <span className="note-card__ornament note-card__ornament--flower note-card__ornament--bottom-right">
          <MiniBloomIcon className="note-card__ornament-icon" centerFill="#fff7bf" />
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
    </>
  );
}

function NoteCard({
  noteRef,
  glowRef,
  hidden,
  note,
  onClick,
}: {
  noteRef: RefObject<HTMLButtonElement>;
  glowRef: RefObject<HTMLSpanElement>;
  hidden: boolean;
  note: NoteCopy;
  onClick: () => void;
}) {
  return (
    <button
      ref={noteRef}
      type="button"
      className="note-card note-card--trigger"
      data-open="false"
      data-overlay-open={hidden ? "true" : "false"}
      aria-expanded={false}
      aria-hidden={hidden}
      aria-label="Open the romantic note"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <NoteCardContents note={note} open={false} glowRef={glowRef} />
    </button>
  );
}

function ExpandedNoteCard({
  note,
  onClose,
}: {
  note: NoteCopy;
  onClose: () => void;
}) {
  return (
    <div
      className="note-card-overlay"
      role="presentation"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <span className="note-card-overlay__ornaments" aria-hidden="true">
        <span className="note-card-overlay__ornament note-card-overlay__ornament--top-left">
          <MiniBloomIcon className="note-card-overlay__icon" centerFill="#fff3ae" />
        </span>
        <span className="note-card-overlay__ornament note-card-overlay__ornament--top-right">
          <MiniHeartIcon className="note-card-overlay__icon" />
        </span>
        <span className="note-card-overlay__ornament note-card-overlay__ornament--bottom-left">
          <MiniSparkleIcon className="note-card-overlay__icon" />
        </span>
        <span className="note-card-overlay__ornament note-card-overlay__ornament--bottom-right">
          <MiniBloomIcon className="note-card-overlay__icon" centerFill="#fff8c8" />
        </span>
      </span>
      <button
        type="button"
        className="note-card note-card--expanded"
        data-open="true"
        aria-expanded="true"
        aria-label="Close the romantic note"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        <NoteCardContents note={note} open={true} />
      </button>
    </div>
  );
}

export default function App() {
  const getInitialReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const getInitialProfile = () =>
    computePerformanceProfile(
      getInitialReducedMotion(),
      typeof window !== "undefined" ? window.innerWidth : 1440,
      typeof navigator !== "undefined" ? (navigator as NavigatorWithDeviceMemory) : undefined,
    );
  const root = useRef<HTMLDivElement>(null);
  const openingSceneRef = useRef<HTMLDivElement>(null);
  const bouquetRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLButtonElement>(null);
  const noteCardRef = useRef<HTMLButtonElement>(null);
  const noteGlowRef = useRef<HTMLSpanElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const secondGiftLockRef = useRef<HTMLSpanElement>(null);
  const secondGiftPuzzleStageRef = useRef<HTMLDivElement>(null);
  const secondGiftPuzzleBoardRef = useRef<HTMLDivElement>(null);
  const activePuzzleDragRef = useRef<ActivePuzzleDrag | null>(null);
  const musicAutoplayArmedRef = useRef(true);
  const noteReadyRef = useRef(false);
  const noteAnimatingRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [isInteractive, setIsInteractive] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [activeSecretFlowerId, setActiveSecretFlowerId] = useState<string | null>(null);
  const [giftBoxOpened, setGiftBoxOpened] = useState(false);
  const [giftBurstPhase, setGiftBurstPhase] = useState<GiftBurstPhase>("idle");
  const [poemVisible, setPoemVisible] = useState(false);
  const [poemExpanded, setPoemExpanded] = useState(false);
  const [secondGiftHintState, setSecondGiftHintState] = useState<SecondGiftHintState>("hidden");
  const [secondGiftUnlocked, setSecondGiftUnlocked] = useState(false);
  const [secondGiftOpened, setSecondGiftOpened] = useState(false);
  const [secondGiftPuzzleVisible, setSecondGiftPuzzleVisible] = useState(false);
  const [secondGiftPuzzleSolved, setSecondGiftPuzzleSolved] = useState(false);
  const [secondGiftPuzzleCelebrating, setSecondGiftPuzzleCelebrating] = useState(false);
  const [secondGiftKeyAnimationPhase, setSecondGiftKeyAnimationPhase] =
    useState<SecondGiftKeyAnimationPhase>("hidden");
  const [secondGiftKeyAnimationGeometry, setSecondGiftKeyAnimationGeometry] =
    useState<SecondGiftKeyAnimationGeometry | null>(null);
  const [secondGiftPuzzlePieces, setSecondGiftPuzzlePieces] = useState<PuzzlePieceState[]>(() =>
    buildSecondGiftPuzzlePieces(),
  );
  const [activePuzzlePieceId, setActivePuzzlePieceId] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const [musicError, setMusicError] = useState(false);
  const [openingStageSize, setOpeningStageSize] = useState({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [performanceProfile, setPerformanceProfile] = useState<PerformanceProfile>(getInitialProfile);
  const previousPhaseRef = useRef(phase);
  const previousInteractiveRef = useRef(isInteractive);
  const previousNoteOpenRef = useRef(noteOpen);
  const previousActiveSecretFlowerIdRef = useRef<string | null>(activeSecretFlowerId);
  const previousReducedMotionRef = useRef(reducedMotion);
  const previousPerformanceProfileRef = useRef(performanceProfile);
  const previousOpeningStageSizeRef = useRef(openingStageSize);

  const pollen = useMemo(() => buildPollen(performanceProfile), [performanceProfile]);
  const butterflies = useMemo(() => buildButterflies(performanceProfile), [performanceProfile]);
  const giftBurstButterflies = useMemo(() => buildGiftBurstButterflies(), []);
  const giftAmbientButterflies = useMemo(() => buildGiftAmbientButterflies(), []);
  const giftBirds = useMemo(() => buildGiftBurstBirds(), []);
  const hiddenKeyBirdId = useMemo(
    () => giftBirds[Math.floor(Math.random() * giftBirds.length)]?.id ?? giftBirds[0]?.id ?? null,
    [giftBirds],
  );
  const giftBirdReleaseWindow = useMemo(
    () =>
      giftBirds.reduce(
        (maxDuration, bird) => Math.max(maxDuration, bird.releaseDelay + bird.releaseDuration),
        0,
      ),
    [giftBirds],
  );
  const bouquetHearts = useMemo(() => buildBouquetHearts(performanceProfile), [performanceProfile]);
  const bouquetGlints = useMemo(() => buildBouquetGlints(), []);
  const openingFlowerConfigs = useMemo(
    () => flowerConfigs.filter((flower) => flower.showInOpening !== false),
    [],
  );
  const bouquetFlowerConfigs = useMemo(
    () => flowerConfigs.filter((flower) => flower.showInBouquet !== false),
    [],
  );
  const secretFlowerConfigs = useMemo(
    () => bouquetFlowerConfigs.filter((flower) => flower.id in secretFlowerNotes),
    [bouquetFlowerConfigs],
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
  const showButterflies =
    phase === "arranging" || phase === "clustered" || phase === "bouquet";
  const giftCreaturesReleased =
    giftBoxOpened && (reducedMotion || giftBurstPhase === "burst" || giftBurstPhase === "poem");
  const showGiftBirds =
    phase === "bouquet" && giftBoxOpened && (reducedMotion || giftBurstPhase === "burst" || giftBurstPhase === "poem");
  const secondGiftSearchActive =
    phase === "bouquet" &&
    giftBoxOpened &&
    secondGiftHintState === "searching" &&
    !secondGiftUnlocked &&
    secondGiftKeyAnimationPhase === "hidden";
  const visibleButterflies = useMemo(
    () => (giftCreaturesReleased ? [...butterflies, ...giftAmbientButterflies] : butterflies),
    [butterflies, giftAmbientButterflies, giftCreaturesReleased],
  );
  const openingStageStyle =
    openingStageSize.width > 0 && openingStageSize.height > 0
      ? ({
          width: openingStageSize.width,
          height: openingStageSize.height,
        } as CSSProperties)
      : undefined;

  useEffect(() => {
    debugLog("app mounted", {
      initialPhase: phase,
      reducedMotion,
      performanceProfile,
      openingFlowers: openingFlowerConfigs.length,
      bouquetFlowers: bouquetFlowerConfigs.length,
      pollenCount: pollen.length,
      heartCount: bouquetHearts.length,
      butterflyCount: butterflies.length,
      strictMode: true,
    });
  }, []);

  useEffect(() => {
    debugLog("phase changed", {
      from: previousPhaseRef.current,
      to: phase,
    });
    previousPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    debugLog("interactivity changed", {
      from: previousInteractiveRef.current,
      to: isInteractive,
      phase,
    });
    previousInteractiveRef.current = isInteractive;
  }, [isInteractive, phase]);

  useEffect(() => {
    debugLog("noteOpen changed", {
      from: previousNoteOpenRef.current,
      to: noteOpen,
      phase,
      noteReady: noteReadyRef.current,
      noteAnimating: noteAnimatingRef.current,
    });
    previousNoteOpenRef.current = noteOpen;
  }, [noteOpen, phase]);

  useEffect(() => {
    debugLog("activeSecretFlowerId changed", {
      from: previousActiveSecretFlowerIdRef.current,
      to: activeSecretFlowerId,
      phase,
    });
    previousActiveSecretFlowerIdRef.current = activeSecretFlowerId;
  }, [activeSecretFlowerId, phase]);

  useEffect(() => {
    debugLog("reducedMotion changed", {
      from: previousReducedMotionRef.current,
      to: reducedMotion,
    });
    previousReducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    debugLog("performance profile changed", {
      from: previousPerformanceProfileRef.current,
      to: performanceProfile,
      pollenCount: pollen.length,
      heartCount: bouquetHearts.length,
    });
    previousPerformanceProfileRef.current = performanceProfile;
  }, [performanceProfile, pollen.length, bouquetHearts.length]);

  useEffect(() => {
    debugLog("opening stage size changed", {
      from: previousOpeningStageSizeRef.current,
      to: openingStageSize,
    });
    previousOpeningStageSizeRef.current = openingStageSize;
  }, [openingStageSize]);

  useEffect(() => {
    if (phase === "bouquet") {
      return;
    }

    setGiftBoxOpened(false);
    setGiftBurstPhase("idle");
    setPoemVisible(false);
    setPoemExpanded(false);
    setSecondGiftHintState("hidden");
    setSecondGiftUnlocked(false);
    setSecondGiftOpened(false);
    setSecondGiftPuzzleVisible(false);
    setSecondGiftPuzzleSolved(false);
    setSecondGiftPuzzleCelebrating(false);
    setSecondGiftKeyAnimationPhase("hidden");
    setSecondGiftKeyAnimationGeometry(null);
    setSecondGiftPuzzlePieces(buildSecondGiftPuzzlePieces());
    setActivePuzzlePieceId(null);
    activePuzzleDragRef.current = null;
  }, [phase]);

  useEffect(() => {
    if (!giftBoxOpened || reducedMotion) {
      return undefined;
    }

    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (giftBurstPhase === "opening") {
      timerId = setTimeout(() => {
        setGiftBurstPhase("burst");
      }, 520);
    } else if (giftBurstPhase === "burst") {
      timerId = setTimeout(() => {
        setGiftBurstPhase("poem");
        setPoemVisible(true);
      }, Math.round((giftBirdReleaseWindow + 0.48) * 1000));
    } else if (giftBurstPhase === "poem") {
      setPoemVisible(true);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [giftBirdReleaseWindow, giftBoxOpened, giftBurstPhase, reducedMotion]);

  useEffect(() => {
    if (secondGiftKeyAnimationPhase === "hidden") {
      return undefined;
    }

    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (secondGiftKeyAnimationPhase === "reveal") {
      timerId = setTimeout(() => {
        setSecondGiftKeyAnimationPhase("travel");
      }, reducedMotion ? 220 : 620);
    } else if (secondGiftKeyAnimationPhase === "travel") {
      timerId = setTimeout(() => {
        setSecondGiftKeyAnimationPhase("hidden");
        setSecondGiftKeyAnimationGeometry(null);
        setSecondGiftUnlocked(true);
        setSecondGiftHintState("hidden");
      }, reducedMotion ? 280 : 860);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [reducedMotion, secondGiftKeyAnimationPhase]);

  useEffect(() => {
    if (!secondGiftPuzzleCelebrating) {
      return undefined;
    }

    const timerId = setTimeout(() => {
      setSecondGiftPuzzleCelebrating(false);
    }, reducedMotion ? 600 : 2400);

    return () => {
      clearTimeout(timerId);
    };
  }, [reducedMotion, secondGiftPuzzleCelebrating]);

  useEffect(() => {
    if (secondGiftPuzzleSolved || secondGiftPuzzlePieces.length === 0) {
      return;
    }

    if (secondGiftPuzzlePieces.every((piece) => piece.placed)) {
      setSecondGiftPuzzleSolved(true);
      setSecondGiftPuzzleCelebrating(true);
    }
  }, [secondGiftPuzzlePieces, secondGiftPuzzleSolved]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = activePuzzleDragRef.current;

      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      const stageRect = secondGiftPuzzleStageRef.current?.getBoundingClientRect();

      if (!stageRect) {
        return;
      }

      const nextX = clamp(event.clientX - stageRect.left - drag.offsetX, 0, Math.max(0, stageRect.width - drag.width));
      const nextY = clamp(event.clientY - stageRect.top - drag.offsetY, 0, Math.max(0, stageRect.height - drag.height));

      setSecondGiftPuzzlePieces((currentPieces) =>
        currentPieces.map((piece) =>
          piece.id === drag.pieceId
            ? {
                ...piece,
                x: (nextX / stageRect.width) * 100,
                y: (nextY / stageRect.height) * 100,
              }
            : piece,
        ),
      );
    };

    const finishDrag = (event: PointerEvent) => {
      const drag = activePuzzleDragRef.current;

      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      const stageRect = secondGiftPuzzleStageRef.current?.getBoundingClientRect();
      const boardRect = secondGiftPuzzleBoardRef.current?.getBoundingClientRect();
      let solvedAfterDrop = false;

      if (stageRect && boardRect) {
        setSecondGiftPuzzlePieces((currentPieces) => {
          return currentPieces.map((piece) => {
            if (piece.id !== drag.pieceId || piece.placed) {
              return piece;
            }

            const pieceLeft = (piece.x / 100) * stageRect.width;
            const pieceTop = (piece.y / 100) * stageRect.height;
            const pieceCenterX = pieceLeft + drag.width / 2;
            const pieceCenterY = pieceTop + drag.height / 2;
            const cellSize = boardRect.width / secondGiftPuzzleGridSize;
            const targetColumn = piece.correctSlot % secondGiftPuzzleGridSize;
            const targetRow = Math.floor(piece.correctSlot / secondGiftPuzzleGridSize);
            const targetLeft = boardRect.left - stageRect.left + targetColumn * cellSize;
            const targetTop = boardRect.top - stageRect.top + targetRow * cellSize;
            const targetCenterX = targetLeft + cellSize / 2;
            const targetCenterY = targetTop + cellSize / 2;
            const shouldSnap = Math.hypot(pieceCenterX - targetCenterX, pieceCenterY - targetCenterY) <= cellSize * 0.42;

            if (!shouldSnap) {
              return piece;
            }

            return {
              ...piece,
              x: (targetLeft / stageRect.width) * 100,
              y: (targetTop / stageRect.height) * 100,
              placed: true,
            };
          });
        });
      }

      activePuzzleDragRef.current = null;
      setActivePuzzlePieceId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      debugLog("background track setup skipped because audio ref is missing");
      return undefined;
    }

    audio.volume = 0.22;
    audio.loop = true;
    void audio.play().catch((error) => {
      debugLog("background track initial autoplay failed", {
        message: error instanceof Error ? error.message : "unknown initial autoplay failure",
      });
    });

    return () => {
      audio.pause();
    };
  }, []);

  useEffect(() => {
    const tryAutoplay = () => {
      if (!musicAutoplayArmedRef.current || musicPlaying || musicError) {
        return;
      }

      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      void audio.play().catch((error) => {
        debugLog("background track autoplay failed", {
          message: error instanceof Error ? error.message : "unknown autoplay failure",
        });
      });
    };

    window.addEventListener("pointerdown", tryAutoplay, true);

    return () => {
      window.removeEventListener("pointerdown", tryAutoplay, true);
    };
  }, [musicError, musicPlaying]);

  useLayoutEffect(() => {
    const sceneElement = openingSceneRef.current;

    if (!sceneElement) {
      debugLog("fitOpeningStage skipped because opening scene ref is missing");
      return undefined;
    }

    const fitOpeningStage = () => {
      const { width: sceneWidth, height: sceneHeight } = sceneElement.getBoundingClientRect();

      if (!sceneWidth || !sceneHeight) {
        debugLog("fitOpeningStage skipped because scene has no measurable size", {
          sceneWidth,
          sceneHeight,
        });
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
          : (() => {
              debugLog("fitOpeningStage updated stage dimensions", {
                sceneWidth,
                sceneHeight,
                width: roundedWidth,
                height: roundedHeight,
              });
              return { width: roundedWidth, height: roundedHeight };
            })(),
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

  useEffect(() => {
    if (typeof window === "undefined") {
      debugLog("runtime profile effect skipped because window is undefined");
      return undefined;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const navigatorInfo =
      typeof navigator !== "undefined"
        ? (navigator as NavigatorWithDeviceMemory)
        : undefined;

    const updateRuntimeProfile = () => {
      const nextReducedMotion = motionQuery.matches;
      const nextProfile = computePerformanceProfile(
        nextReducedMotion,
        window.innerWidth,
        navigatorInfo,
      );

      debugLog("runtime profile recalculated", {
        width: window.innerWidth,
        reducedMotion: nextReducedMotion,
        performanceProfile: nextProfile,
        hardwareConcurrency: navigatorInfo?.hardwareConcurrency ?? null,
        deviceMemory: navigatorInfo?.deviceMemory ?? null,
      });

      setReducedMotion((current) =>
        current === nextReducedMotion ? current : nextReducedMotion,
      );
      setPerformanceProfile((current) =>
        current === nextProfile ? current : nextProfile,
      );
    };

    updateRuntimeProfile();

    const handleMotionChange = () => {
      updateRuntimeProfile();
    };

    motionQuery.addEventListener?.("change", handleMotionChange);
    motionQuery.addListener?.(handleMotionChange);
    window.addEventListener("resize", updateRuntimeProfile);

    return () => {
      motionQuery.removeEventListener?.("change", handleMotionChange);
      motionQuery.removeListener?.(handleMotionChange);
      window.removeEventListener("resize", updateRuntimeProfile);
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
      const sitewideHeartLayer = root.current?.querySelector<HTMLElement>(".bouquet-hearts--sitewide");
      const bouquetFlowersFrame = root.current?.querySelector<HTMLElement>(".bouquet-flowers");
      const bouquetBounds = bouquetFlowersFrame?.getBoundingClientRect();

      debugLog("useGSAP init", {
        openingFlowers: openingFlowers.length,
        bouquetFlowers: bouquetFlowers.length,
        clusterBotanicalPieces: clusterBotanicalPieces.length,
        finalBotanicalPieces: finalBotanicalPieces.length,
        impactRings: impactRings.length,
        wrapPieces: wrapPieces.length,
        haloEls: haloEls.length,
        heartEls: heartEls.length,
        glintEls: glintEls.length,
        hasHeartLayer: Boolean(sitewideHeartLayer),
        hasBouquetFrame: Boolean(bouquetFlowersFrame),
        bouquetBounds: bouquetBounds
          ? {
              width: Math.round(bouquetBounds.width),
              height: Math.round(bouquetBounds.height),
            }
          : null,
      });

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
      if (sitewideHeartLayer) {
        gsap.set(sitewideHeartLayer, { rotate: 0, xPercent: 0, yPercent: 0 });
      }
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
          debugLog("intro animation completed");
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
    if (phase !== "bouquet") {
      debugLog("closing secret note because phase is not bouquet", { phase });
      setActiveSecretFlowerId(null);
    }
  }, [phase]);

  useEffect(() => {
    const sceneRoot = root.current;
    const heartEls = gsap.utils.toArray<HTMLElement>(".bouquet-heart");

    if (!sceneRoot || !heartEls.length) {
      debugLog("heart animation effect skipped", {
        hasSceneRoot: Boolean(sceneRoot),
        heartCount: heartEls.length,
      });
      return undefined;
    }

    const heartPhaseSettings = getHeartPhaseSettings(phase, performanceProfile);
    const profileMotionScale =
      performanceProfile === "full"
        ? 1
        : performanceProfile === "balanced"
          ? 0.82
          : 0.64;
    const metrics = {
      width: 0,
      height: 0,
      bouquetCenterX: 0,
      bouquetCenterY: 0,
    };
    const phaseCenterYRatio =
      phase === "bouquet" || phase === "finishing"
        ? 0.585
        : phase === "clustered"
          ? 0.58
          : 0.54;

    const updateMetrics = () => {
      const rect = sceneRoot.getBoundingClientRect();

      metrics.width = rect.width;
      metrics.height = rect.height;
      metrics.bouquetCenterX = rect.width / 2;
      metrics.bouquetCenterY = rect.height * phaseCenterYRatio;
    };

    updateMetrics();

    debugLog("heart animation effect started", {
      phase,
      reducedMotion,
      performanceProfile,
      heartCount: heartEls.length,
      phaseCenterYRatio,
    });

    const heartState = heartEls.map((heart) => ({
      baseLeft: Number(heart.dataset.baseLeft ?? 50),
      baseTop: Number(heart.dataset.baseTop ?? 50),
      rotate: getHeartRotate(heart),
      opacity: getHeartOpacity(heart),
      duration: getHeartDuration(heart),
      delay: getHeartDelay(heart),
      orbitRadiusX: getHeartOrbitRadiusX(heart),
      orbitRadiusY: getHeartOrbitRadiusY(heart),
      orbitStart: getHeartOrbitStart(heart),
      orbitDirection: getHeartOrbitDirection(heart),
      wobbleX: getHeartWobbleX(heart),
      wobbleY: getHeartWobbleY(heart),
      scale: getHeartScale(heart),
      currentX: Number(gsap.getProperty(heart, "x")) || 0,
      currentY: Number(gsap.getProperty(heart, "y")) || 0,
      currentScale: Number(gsap.getProperty(heart, "scale")) || 0.82,
      currentRotate: Number(gsap.getProperty(heart, "rotation")) || getHeartRotate(heart),
      currentOpacity: Number(gsap.getProperty(heart, "opacity")) || 0,
      setX: gsap.quickSetter(heart, "x", "px"),
      setY: gsap.quickSetter(heart, "y", "px"),
      setScale: gsap.quickSetter(heart, "scale"),
      setRotate: gsap.quickSetter(heart, "rotation", "deg"),
      setOpacity: gsap.quickSetter(heart, "opacity"),
    }));

    if (reducedMotion) {
      debugLog("heart animation using reduced motion branch", {
        heartCount: heartState.length,
      });
      heartState.forEach((heart) => {
        const basePoint = {
          x: (metrics.width * heart.baseLeft) / 100 - metrics.bouquetCenterX,
          y: (metrics.height * heart.baseTop) / 100 - metrics.bouquetCenterY,
        };
        const localRadians = (heart.orbitStart * Math.PI) / 180;
        const localWave = (heart.orbitStart * Math.PI) / 90;
        const targetX =
          Math.cos(localRadians) * heart.orbitRadiusX * heartPhaseSettings.localOrbitScale +
          Math.sin(localWave) * heart.wobbleX +
          basePoint.x * 0.06 * heartPhaseSettings.bouquetOrbitStrength;
        const targetY =
          Math.sin(localRadians) * heart.orbitRadiusY * heartPhaseSettings.localOrbitScale +
          Math.cos(localWave * 0.86) * heart.wobbleY +
          basePoint.y * 0.06 * heartPhaseSettings.bouquetOrbitStrength;

        heart.setX(targetX);
        heart.setY(targetY);
        heart.setScale(heart.scale * heartPhaseSettings.scaleMultiplier);
        heart.setRotate(heart.rotate);
        heart.setOpacity(heart.opacity * heartPhaseSettings.opacityMultiplier);
      });

      return undefined;
    }

    let previousTime = performance.now() / 1000;

    const tick = () => {
      const currentTime = performance.now() / 1000;
      const deltaTime = Math.min(currentTime - previousTime, 0.05);
      const motionEase = 1 - Math.exp(-deltaTime * 6.2);
      const opacityEase = 1 - Math.exp(-deltaTime * 4.4);
      const bouquetOrbitAngle = currentTime * heartPhaseSettings.bouquetOrbitSpeed;

      previousTime = currentTime;

      heartState.forEach((heart, index) => {
        const localDuration = heart.duration / Math.max(heartPhaseSettings.localSpeedMultiplier, 0.16);
        const angleDegrees =
          heart.orbitStart +
          (((currentTime + heart.delay * 0.8) * 360) / localDuration) * heart.orbitDirection;
        const radians = (angleDegrees * Math.PI) / 180;
        const wave = (angleDegrees * Math.PI) / 90;
        const localX =
          Math.cos(radians) * heart.orbitRadiusX * heartPhaseSettings.localOrbitScale +
          Math.sin(wave) * heart.wobbleX;
        const localY =
          Math.sin(radians) * heart.orbitRadiusY * heartPhaseSettings.localOrbitScale +
          Math.cos(wave * 0.86) * heart.wobbleY;
        const baseX = (metrics.width * heart.baseLeft) / 100;
        const baseY = (metrics.height * heart.baseTop) / 100;
        const baseDx = baseX - metrics.bouquetCenterX;
        const baseDy = baseY - metrics.bouquetCenterY;
        const cosOrbit = Math.cos(bouquetOrbitAngle);
        const sinOrbit = Math.sin(bouquetOrbitAngle);
        const rotatedDx = baseDx * cosOrbit - baseDy * sinOrbit;
        const rotatedDy = baseDx * sinOrbit + baseDy * cosOrbit;
        const bouquetOrbitX =
          (rotatedDx - baseDx) * heartPhaseSettings.bouquetOrbitStrength;
        const bouquetOrbitY =
          (rotatedDy - baseDy) * heartPhaseSettings.bouquetOrbitStrength;
        const shimmer = Math.sin(radians + index * 0.12);
        const targetX = localX + bouquetOrbitX;
        const targetY = localY + bouquetOrbitY;
        const targetScale =
          heart.scale *
          heartPhaseSettings.scaleMultiplier *
          (1 + shimmer * 0.03 * profileMotionScale);
        const targetRotate = heart.rotate + shimmer * (phase === "bouquet" ? 5.2 : 4.1);
        const targetOpacity =
          heart.opacity *
          heartPhaseSettings.opacityMultiplier *
          (0.94 + shimmer * 0.04 * profileMotionScale);

        heart.currentX = lerp(heart.currentX, targetX, motionEase);
        heart.currentY = lerp(heart.currentY, targetY, motionEase);
        heart.currentScale = lerp(heart.currentScale, targetScale, motionEase);
        heart.currentRotate = lerp(heart.currentRotate, targetRotate, motionEase);
        heart.currentOpacity = lerp(heart.currentOpacity, targetOpacity, opacityEase);

        heart.setX(heart.currentX);
        heart.setY(heart.currentY);
        heart.setScale(heart.currentScale);
        heart.setRotate(heart.currentRotate);
        heart.setOpacity(heart.currentOpacity);
      });
    };

    window.addEventListener("resize", updateMetrics);
    tick();
    gsap.ticker.add(tick);

    return () => {
      debugLog("heart animation effect cleanup", {
        phase,
        heartCount: heartEls.length,
      });
      window.removeEventListener("resize", updateMetrics);
      gsap.ticker.remove(tick);
    };
  }, [phase, reducedMotion, performanceProfile, bouquetHearts]);

  useEffect(() => {
    const noteCard = noteCardRef.current;
    const noteGlow = noteGlowRef.current;

    if (phase !== "bouquet") {
      debugLog("note card reset because phase is not bouquet", {
        phase,
        hasNoteCard: Boolean(noteCard),
        hasNoteGlow: Boolean(noteGlow),
      });
      noteReadyRef.current = false;
      noteAnimatingRef.current = false;
      setNoteOpen(false);
      if (noteCard && noteGlow) {
        gsap.set(noteCard, {
          opacity: 0,
          x: 0,
          y: 20,
          scale: 0.82,
          rotate: -22,
        });
        gsap.set(noteGlow, { opacity: 0, scale: 0.8 });
      }
      return;
    }

    if (!noteCard || !noteGlow) {
      debugLog("note card effect skipped because refs are missing", {
        hasNoteCard: Boolean(noteCard),
        hasNoteGlow: Boolean(noteGlow),
      });
      return;
    }

    gsap.killTweensOf([noteCard, noteGlow]);

    if (reducedMotion) {
      debugLog("note card using reduced motion branch");
      gsap.set(noteCard, { opacity: 1, x: 0, y: 0, scale: 1, rotate: -18 });
      gsap.set(noteGlow, { opacity: 0.26, scale: 1 });
      noteReadyRef.current = true;
      return;
    }

    noteAnimatingRef.current = true;
    debugLog("note card reveal animation started");

    gsap
      .timeline({
        defaults: { ease: motion.easeSettle },
        onComplete: () => {
          debugLog("note card reveal animation completed");
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

  const toggleNoteCard = () => {
    if (phase !== "bouquet" || !noteReadyRef.current || noteAnimatingRef.current) {
      debugLog("toggleNoteCard blocked", {
        phase,
        noteReady: noteReadyRef.current,
        noteAnimating: noteAnimatingRef.current,
      });
      return;
    }

    const nextOpen = !noteOpen;
    debugLog("toggleNoteCard proceeding", {
      currentOpen: noteOpen,
      nextOpen,
    });
    if (nextOpen) {
      setActiveSecretFlowerId(null);
    }
    setNoteOpen(nextOpen);
  };

  const toggleSecretFlowerNote = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    debugLog("secret flower clicked", {
      phase,
      targetFlowerId: event.currentTarget.dataset.flowerId ?? null,
    });

    if (phase !== "bouquet") {
      debugLog("secret flower click ignored because phase is not bouquet", { phase });
      return;
    }

    const targetFlowerId = event.currentTarget.dataset.flowerId ?? null;

    setActiveSecretFlowerId((current) =>
      current === targetFlowerId ? null : targetFlowerId,
    );
  };

  const handleSecretFlowerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    debugLog("secret flower keyboard toggle requested", {
      key: event.key,
      phase,
      targetFlowerId: event.currentTarget.dataset.flowerId ?? null,
    });

    if (phase !== "bouquet") {
      debugLog("secret flower keyboard toggle ignored because phase is not bouquet", { phase });
      return;
    }

    const targetFlowerId = event.currentTarget.dataset.flowerId ?? null;

    setActiveSecretFlowerId((current) =>
      current === targetFlowerId ? null : targetFlowerId,
    );
  };

  const toggleBackgroundTrack = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const audio = audioRef.current;

    if (!audio || musicError) {
      return;
    }

    musicAutoplayArmedRef.current = false;

    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
      return;
    }

    void audio.play().catch((error) => {
      debugLog("background track manual play failed", {
        message: error instanceof Error ? error.message : "unknown play failure",
      });
      setMusicPlaying(false);
    });
  };

  const openGiftBox = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (phase !== "bouquet") {
      return;
    }

    setNoteOpen(false);
    setActiveSecretFlowerId(null);
    setPoemVisible(false);
    setPoemExpanded(false);

    if (giftBoxOpened) {
      setGiftBurstPhase("poem");
      setPoemVisible(true);
      return;
    }

    setGiftBoxOpened(true);

    if (reducedMotion) {
      setGiftBurstPhase("poem");
      setPoemVisible(true);
      return;
    }

    setGiftBurstPhase("opening");
  };

  const openSecondGiftBox = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (phase !== "bouquet" || !giftBoxOpened) {
      return;
    }

    setNoteOpen(false);
    setActiveSecretFlowerId(null);
    setPoemVisible(false);
    setPoemExpanded(false);

    if (secondGiftUnlocked) {
      setSecondGiftOpened(true);
      setSecondGiftPuzzleVisible(true);
      return;
    }

    setSecondGiftHintState("searching");
  };

  const closeSecondGiftPuzzle = () => {
    activePuzzleDragRef.current = null;
    setActivePuzzlePieceId(null);
    setSecondGiftPuzzleVisible(false);
  };

  const resetSecondGiftPuzzle = () => {
    activePuzzleDragRef.current = null;
    setActivePuzzlePieceId(null);
    setSecondGiftPuzzleSolved(false);
    setSecondGiftPuzzleCelebrating(false);
    setSecondGiftPuzzlePieces(buildSecondGiftPuzzlePieces());
  };

  const handleGiftBirdClick = (event: ReactMouseEvent<HTMLButtonElement>, birdId: string) => {
    event.stopPropagation();
    event.preventDefault();

    if (!secondGiftSearchActive || birdId !== hiddenKeyBirdId) {
      return;
    }

    const lockRect = secondGiftLockRef.current?.getBoundingClientRect();
    const startX = window.innerWidth * 0.5;
    const startY = window.innerHeight * 0.46;
    const endX = lockRect ? lockRect.left + lockRect.width / 2 : window.innerWidth * 0.24;
    const endY = lockRect ? lockRect.top + lockRect.height / 2 : window.innerHeight * 0.72;

    if (reducedMotion) {
      setSecondGiftKeyAnimationGeometry({
        startX,
        startY,
        endX,
        endY,
      });
      setSecondGiftKeyAnimationPhase("travel");
      return;
    }

    setSecondGiftKeyAnimationGeometry({
      startX,
      startY,
      endX,
      endY,
    });
    setSecondGiftKeyAnimationPhase("reveal");
  };

  const handlePuzzlePiecePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    pieceId: string,
  ) => {
    const piece = secondGiftPuzzlePieces.find((currentPiece) => currentPiece.id === pieceId);

    if (!piece || piece.placed || secondGiftPuzzleSolved) {
      return;
    }

    event.stopPropagation();

    const target = event.currentTarget;
    const pieceRect = target.getBoundingClientRect();

    activePuzzleDragRef.current = {
      pieceId,
      pointerId: event.pointerId,
      offsetX: event.clientX - pieceRect.left,
      offsetY: event.clientY - pieceRect.top,
      width: pieceRect.width,
      height: pieceRect.height,
    };

    setActivePuzzlePieceId(pieceId);
    target.setPointerCapture(event.pointerId);
  };

  const closeGiftPoem = () => {
    setPoemVisible(false);
    setPoemExpanded(false);
  };

  const runArrangeSequence = () => {
    const openingFlowers = gsap.utils.toArray<HTMLElement>(".flower--opening");
    const openingFlowerParts = gsap.utils.toArray<HTMLElement>(".flower--opening .flower__motion");
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
      debugLog("runArrangeSequence aborted because bouquet frame is missing");
      return;
    }

    const bouquetBounds = bouquetFlowersFrame.getBoundingClientRect();

    debugLog("runArrangeSequence started", {
      reducedMotion,
      openingFlowers: openingFlowers.length,
      openingFlowerParts: openingFlowerParts.length,
      bouquetBackFlowers: bouquetBackFlowers.length,
      bouquetMidFlowers: bouquetMidFlowers.length,
      bouquetFrontFlowers: bouquetFrontFlowers.length,
      clusterBotanicalPieces: clusterBotanicalPieces.length,
      finalBotanicalPieces: finalBotanicalPieces.length,
      impactRings: impactRings.length,
      haloEls: haloEls.length,
      heartEls: heartEls.length,
      bouquetBounds: {
        width: Math.round(bouquetBounds.width),
        height: Math.round(bouquetBounds.height),
      },
    });

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
            debugLog("runArrangeSequence completed in reduced motion mode");
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

    debugLog("runArrangeSequence convergence prepared", {
      totalFlowers: convergence.length,
      movingFlowers: convergence.filter((entry) => entry.travel > 0).length,
      hiddenAfterCluster: convergence.filter((entry) => !entry.showInBouquet).length,
      maxTravel: Math.round(
        convergence.reduce((max, entry) => Math.max(max, entry.travel), 0),
      ),
    });

    const timeline = gsap.timeline({
      defaults: { ease: motion.easeSettle },
      onComplete: () => {
        debugLog("runArrangeSequence completed");
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
    const heartEls = gsap.utils.toArray<HTMLElement>(".bouquet-heart");
    const glintEls = gsap.utils.toArray<HTMLElement>(".bouquet-glint");

    debugLog("runCompleteSequence started", {
      reducedMotion,
      bouquetFlowers: bouquetFlowers.length,
      bouquetBackFlowers: bouquetBackFlowers.length,
      bouquetMidFlowers: bouquetMidFlowers.length,
      bouquetFrontFlowers: bouquetFrontFlowers.length,
      clusterBotanicalPieces: clusterBotanicalPieces.length,
      finalBotanicalPieces: finalBotanicalPieces.length,
      wrapPieces: wrapPieces.length,
      haloEls: haloEls.length,
      heartEls: heartEls.length,
      glintEls: glintEls.length,
    });

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
          onComplete: () => {
            debugLog("runCompleteSequence completed in reduced motion mode");
            setPhase("bouquet");
          },
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
        onComplete: () => {
          debugLog("runCompleteSequence completed");
          setPhase("bouquet");
        },
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
      debugLog("triggerSequence ignored because app is not interactive", { phase });
      return;
    }

    if (phase === "idle") {
      debugLog("triggerSequence routing to arrange");
      runArrangeSequence();
      return;
    }

    if (phase === "clustered") {
      debugLog("triggerSequence routing to complete");
      runCompleteSequence();
      return;
    }

    debugLog("triggerSequence received click in unsupported phase", { phase });
  };

  return (
      <div
        className={`site phase-${phase}`}
        data-interactive={isInteractive}
        data-performance-profile={performanceProfile}
        ref={root}
        onClick={(event) => {
          const target = event.target;

          if (
            target instanceof HTMLElement &&
            target.closest(
              "button, [role='button'], [role='dialog'], .gift-poem-overlay, .second-gift-overlay, .note-card-overlay, .secret-flower-note, .second-gift-hint-card",
            )
          ) {
            return;
          }

          debugLog("site root clicked", { phase, isInteractive });
          triggerSequence();
        }}
        role="presentation"
      >
      <audio
        ref={audioRef}
        src={backgroundTrack.src}
        autoPlay
        preload="auto"
        onCanPlay={() => {
          setMusicReady(true);
          setMusicError(false);
          if (musicAutoplayArmedRef.current && !musicPlaying) {
            const audio = audioRef.current;

            if (audio) {
              void audio.play().catch((error) => {
                debugLog("background track ready autoplay failed", {
                  message: error instanceof Error ? error.message : "unknown ready autoplay failure",
                });
              });
            }
          }
        }}
        onPlay={() => {
          musicAutoplayArmedRef.current = false;
          setMusicPlaying(true);
        }}
        onPause={() => {
          setMusicPlaying(false);
        }}
        onError={() => {
          debugLog("background track failed to load", {
            src: backgroundTrack.src,
          });
          setMusicError(true);
          setMusicReady(false);
          setMusicPlaying(false);
        }}
      />

      <div className="music-card">
        <div className="music-card__copy">
          <span className="music-card__eyebrow">Now Playing</span>
          <strong className="music-card__title">{backgroundTrack.title}</strong>
          <span className="music-card__artist">{backgroundTrack.artist}</span>
          <span className="music-card__status">
            {musicError
              ? "Track unavailable"
              : musicReady
                ? musicPlaying
                  ? "Playing"
                  : "Paused"
                : "Loading..."}
          </span>
        </div>
        <button
          type="button"
          className="music-card__button"
          onClick={toggleBackgroundTrack}
          disabled={musicError || !musicReady}
        >
          {musicPlaying ? "Pause" : "Play"}
        </button>
      </div>

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

      {showButterflies ? (
        <div className="butterfly-layer" aria-hidden="true">
          {visibleButterflies.map((butterfly) => (
            (() => {
              const butterflyStyle = getButterflyVariantStyle(butterfly.variant);

              return (
                <span
                  key={butterfly.id}
                  className="butterfly"
                  style={
                    {
                      left: `${butterfly.left}%`,
                      top: `${butterfly.top}%`,
                      width: `${Math.round(butterfly.size * 1.5)}px`,
                      height: `${Math.round(butterfly.size * 1.2)}px`,
                      "--butterfly-rotate": `${butterfly.rotate}deg`,
                      "--butterfly-scale": butterfly.scale,
                      "--butterfly-flight-x": `${butterfly.flightX}vw`,
                      "--butterfly-flight-y": `${butterfly.flightY}vh`,
                      "--butterfly-flight-duration": `${butterfly.flightDuration}s`,
                      "--butterfly-drift-duration": `${butterfly.driftDuration}s`,
                      "--butterfly-flap-duration": `${butterfly.flapDuration}s`,
                      "--butterfly-delay": `${butterfly.delay}s`,
                      "--butterfly-shadow-color": butterflyStyle.shadowColor,
                    } as CSSProperties
                  }
                >
                  <span className="butterfly__float">
                    <svg
                      className="butterfly__svg"
                      viewBox="0 0 100 72"
                      role="presentation"
                      aria-hidden="true"
                    >
                      {renderButterflyVariant(butterfly.variant, butterflyStyle)}
                      <path
                        className="butterfly__body"
                        d="M49.2 18 C47.2 25 46.8 36 47.7 48 C48.2 56 49 61 50 64 C51 61 51.8 56 52.3 48 C53.2 36 52.8 25 50.8 18 Z"
                        fill={butterflyStyle.bodyColor}
                      />
                      <ellipse
                        className="butterfly__thorax"
                        cx="50"
                        cy="27"
                        rx="4.2"
                        ry="8.6"
                        fill={butterflyStyle.bodyColor}
                      />
                      <path
                        className="butterfly__antenna"
                        d="M49 22 C44.5 14 39.5 11.5 35.5 10.5"
                        stroke={butterflyStyle.antennaColor}
                      />
                      <path
                        className="butterfly__antenna"
                        d="M51 22 C55.5 14 60.5 11.5 64.5 10.5"
                        stroke={butterflyStyle.antennaColor}
                      />
                    </svg>
                  </span>
                </span>
              );
            })()
          ))}
        </div>
      ) : null}

      <div className="bouquet-hearts bouquet-hearts--sitewide" aria-hidden="true">
        {bouquetHearts.map((heart) => (
          <span
            key={heart.id}
            className="bouquet-heart"
            data-base-left={heart.left}
            data-base-top={heart.top}
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
                width: `${heart.size * 1.12}px`,
                height: `${heart.size * 1.12}px`,
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
        {phase === "bouquet" ? <BirthdayDayOneCard /> : null}
        {phase === "bouquet" ? (
          <SecondGiftHintCard
            visible={giftBoxOpened && secondGiftHintState !== "hidden"}
            hintState={secondGiftHintState}
          />
        ) : null}
        <SecondGiftKeyAnimation
          phase={secondGiftKeyAnimationPhase}
          geometry={secondGiftKeyAnimationGeometry}
        />
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
        {showGiftBirds ? (
          <div className="gift-bird-layer" data-interactive={secondGiftSearchActive}>
            {giftBirds.map((bird) => (
              <button
                key={bird.id}
                type="button"
                className="gift-bird gift-bird--ambient"
                data-stage={reducedMotion || giftBurstPhase === "poem" ? "ambient" : "release"}
                data-searching={secondGiftSearchActive}
                data-key-found={secondGiftUnlocked && bird.id === hiddenKeyBirdId}
                onClick={(event) => {
                  handleGiftBirdClick(event, bird.id);
                }}
                disabled={!secondGiftSearchActive}
                aria-label={
                  secondGiftSearchActive
                    ? "Check this bird for the hidden key"
                    : "Bird circling above the bouquet"
                }
                style={
                  {
                    left: `${bird.left}%`,
                    top: `${bird.top}%`,
                    width: `${bird.size}px`,
                    height: `${Math.round(bird.size * 0.78)}px`,
                    "--gift-bird-rotate": `${bird.rotate}deg`,
                    "--gift-bird-scale": bird.scale,
                    "--gift-bird-release-x": bird.releaseX,
                    "--gift-bird-release-y": bird.releaseY,
                    "--gift-bird-release-duration": `${bird.releaseDuration}s`,
                    "--gift-bird-release-delay": `${bird.releaseDelay}s`,
                    "--gift-bird-flight-x": `${bird.driftX}vw`,
                    "--gift-bird-flight-y": `${bird.driftY}vh`,
                    "--gift-bird-flight-duration": `${bird.flightDuration}s`,
                    "--gift-bird-drift-duration": `${bird.driftDuration}s`,
                    "--gift-bird-wing-duration": `${bird.wingDuration}s`,
                    "--gift-bird-delay": `${bird.delay}s`,
                    "--gift-bird-shadow-color": bird.palette.shadowColor,
                  } as CSSProperties
                }
              >
                <span className="gift-bird__motion">
                  <span className="gift-bird__float">{renderGiftBird(bird)}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="bouquet-flowers">
          <BouquetBotanicalLayer flowers={bouquetFlowerConfigs} stage="cluster" />
          <BouquetBotanicalLayer flowers={bouquetFlowerConfigs} stage="bouquet" />
          {bouquetFlowerConfigs.map((flower) => {
            const isSecretTarget = phase === "bouquet" && flower.id in secretFlowerNotes;

            return (
              <Flower
                key={`bouquet-${flower.id}`}
                flower={flower}
                mode="bouquet"
                isSecretFlower={isSecretTarget}
                secretOpen={isSecretTarget && activeSecretFlowerId === flower.id}
                secretNoteId={isSecretTarget ? `secret-flower-note-${flower.id}` : undefined}
                onClick={isSecretTarget ? toggleSecretFlowerNote : undefined}
                onKeyDown={isSecretTarget ? handleSecretFlowerKeyDown : undefined}
              />
            );
          })}
        </div>
        {secretFlowerConfigs.map((flower) => (
          <SecretFlowerNote
            key={`secret-note-${flower.id}`}
            noteId={`secret-flower-note-${flower.id}`}
            flower={flower}
            open={phase === "bouquet" && activeSecretFlowerId === flower.id}
            note={secretFlowerNotes[flower.id]}
          />
        ))}
        {phase === "bouquet" ? (
          <GiftBox
            opened={giftBoxOpened}
            burstPhase={giftBurstPhase}
            reducedMotion={reducedMotion}
            burstButterflies={giftBurstButterflies}
            onOpen={openGiftBox}
          />
        ) : null}
        {phase === "bouquet" ? (
          <GiftBox
            opened={secondGiftOpened}
            burstPhase={secondGiftOpened ? "burst" : "idle"}
            reducedMotion={reducedMotion}
            burstButterflies={giftBurstButterflies}
            onOpen={openSecondGiftBox}
            variant="second"
            locked={!secondGiftUnlocked}
            disabled={!giftBoxOpened}
            labelClosed="Open the locked gift box"
            labelOpened="Open the flower puzzle"
            showBurst={false}
            lockRef={secondGiftLockRef}
          />
        ) : null}
        <NoteCard
          noteRef={noteCardRef}
          glowRef={noteGlowRef}
          hidden={phase === "bouquet" && noteOpen}
          note={romanticNote}
          onClick={toggleNoteCard}
        />
        {phase === "bouquet" && noteOpen ? (
          <ExpandedNoteCard
            note={romanticNote}
            onClose={toggleNoteCard}
          />
        ) : null}
        <BouquetWrap />
      </div>

      <GiftPoemOverlay
        visible={poemVisible}
        expanded={poemExpanded}
        onToggleExpanded={() => {
          setPoemExpanded((current) => !current);
        }}
        onClose={closeGiftPoem}
      />
      <SecondGiftPuzzleOverlay
        visible={secondGiftPuzzleVisible}
        solved={secondGiftPuzzleSolved}
        celebrating={secondGiftPuzzleCelebrating}
        pieces={secondGiftPuzzlePieces}
        activePieceId={activePuzzlePieceId}
        stageRef={secondGiftPuzzleStageRef}
        boardRef={secondGiftPuzzleBoardRef}
        onPiecePointerDown={handlePuzzlePiecePointerDown}
        onReset={resetSecondGiftPuzzle}
        onClose={closeSecondGiftPuzzle}
      />

      <button
        type="button"
        className="trigger-cue"
        ref={cueRef}
        onClick={(event) => {
          event.stopPropagation();
          debugLog("trigger cue clicked", { phase, isInteractive });
          triggerSequence();
        }}
        disabled={!isInteractive}
      >
        {cueLabel}
      </button>
    </div>
  );
}
