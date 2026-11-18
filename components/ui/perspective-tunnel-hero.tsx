"use client";

/*
 * Perspective Tunnel — scroll-driven 3D corridor of cards.
 *  - Progress follows normal page scroll through a tall sticky section, so touch works and the
 *    page is never trapped.
 *  - Cards can be photos, fact cards or line-art.
 *  - An optional finale: the last card flies forward and expands to fill the screen, becoming the
 *    background for copy that reveals line by line.
 *  - Pointer parallax only for real mice; reduced motion gets a calm static layout.
 */

import {
    motion,
    useTransform,
    useMotionValue,
    useSpring,
    useScroll,
    MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";

export type TunnelItem =
    | { kind?: "image"; src: string; title: string; alt?: string }
    | { kind: "fact"; big: string; title: string; tone?: "blue" | "amber" | "fg" }
    | { kind: "art"; art: "gauge" | "aero" | "booth"; title: string };

/** Back-compat alias */
export type TunnelImage = TunnelItem;

interface TunnelCardData {
    item: TunnelItem;
    angleCos: number;
    angleSin: number;
    radiusFactorX: number;
    radiusFactorY: number;
    rotationZ: number;
    index: number;
}

function layout(items: TunnelItem[]): TunnelCardData[] {
    return items.map((item, i) => {
        const goldenAngle = i * 137.5 * (Math.PI / 180);
        return {
            item,
            angleCos: Math.cos(goldenAngle),
            angleSin: Math.sin(goldenAngle),
            radiusFactorX: 0.28 + (i % 3) * 0.08,
            radiusFactorY: 0.26 + (i % 2) * 0.09,
            rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
            index: i,
        };
    });
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
    width: number;
    height: number;
    isMobile: boolean;
}

function useCameraParallax(enabled: boolean) {
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const x = useSpring(rawX, SPRING_CONFIG);
    const y = useSpring(rawY, SPRING_CONFIG);

    useEffect(() => {
        if (!enabled) return;
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
            rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [enabled, rawX, rawY]);

    return { x, y };
}

function LineArt({ art }: { art: "gauge" | "aero" | "booth" }) {
    return (
        <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden>
            {art === "gauge" && (
                <g fill="none" stroke="currentColor" strokeWidth="1.2">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <rect key={i} x={40 + i * 6} y={40 + i * 2} width="110" height="10" rx="2" transform={`rotate(${-20 + i * 10} 46 118)`} />
                    ))}
                    <circle cx="46" cy="118" r="5" stroke="var(--amber)" />
                </g>
            )}
            {art === "aero" && (
                <g fill="none" strokeWidth="1.2">
                    <path stroke="currentColor" d="M14 104 C44 82,94 72,154 76 L190 86 L190 98 L22 110Z" />
                    <path stroke="var(--amber)" strokeDasharray="3 5" d="M4 60 C64 50,124 48,196 56M4 78 C64 66,124 62,196 70M4 128 C64 130,124 128,196 122" />
                </g>
            )}
            {art === "booth" && (
                <g fill="none" strokeWidth="1.2">
                    <ellipse stroke="currentColor" cx="100" cy="112" rx="72" ry="20" />
                    <ellipse stroke="currentColor" cx="100" cy="112" rx="40" ry="11" />
                    <path stroke="var(--amber)" d="M100 112V44M90 44h20v12H90z" />
                    <circle fill="var(--amber)" cx="172" cy="112" r="4" />
                </g>
            )}
        </svg>
    );
}

function CardFace({ item }: { item: TunnelItem }) {
    if (item.kind === "fact") {
        const tone = item.tone === "amber" ? "text-[var(--amber)]" : item.tone === "blue" ? "text-[var(--blue)]" : "text-[var(--fg)]";
        return (
            <div className="flex h-full w-full flex-col justify-between bg-[var(--card)] p-4 sm:p-5">
                <span className="font-[family-name:var(--mono)] text-[9px] uppercase tracking-[0.2em] text-[var(--fine)]">Dual Nature</span>
                <div>
                    <div className={cn("font-[family-name:var(--display)] text-[clamp(1.9rem,4.4vw,3rem)] font-medium leading-none tracking-[-0.05em]", tone)}>{item.big}</div>
                    <div className="mt-2 text-[12px] leading-snug text-[var(--muted)] sm:text-[13px]">{item.title}</div>
                </div>
            </div>
        );
    }
    if (item.kind === "art") {
        return (
            <div className="flex h-full w-full flex-col bg-[var(--card)] p-4 text-[var(--fg)] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:18px_18px] sm:p-5">
                <div className="min-h-0 flex-1 opacity-80"><LineArt art={item.art} /></div>
                <span className="font-[family-name:var(--mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{item.title}</span>
            </div>
        );
    }
    return (
        <>
            <Image src={item.src} alt={item.alt ?? item.title} fill sizes="(max-width: 768px) 40vw, 270px" draggable={false} className="object-cover" />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-3 sm:p-5">
                <span className="font-[family-name:var(--mono)] text-[10px] uppercase tracking-[0.18em] text-white/90 sm:text-xs">{item.title}</span>
            </div>
        </>
    );
}

interface TunnelCardProps {
    card: TunnelCardData;
    progress: MotionValue<number>;
    pointer: { x: MotionValue<number>; y: MotionValue<number> };
    total: number;
    stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
    const staggerSpan = 0.55;
    const start = (card.index / total) * (1 - staggerSpan);
    const end = start + staggerSpan;

    const localProgress = useTransform(progress, [start, end], [0, 1]);

    const farZ = stage.isMobile ? -1200 : -1700;
    const nearZ = stage.isMobile ? 350 : 500;
    const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

    const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

    const cardWidth = stage.isMobile
        ? Math.max(130, Math.min(180, stage.width * 0.38))
        : Math.max(180, Math.min(270, stage.width * 0.18));

    const baseX = card.angleCos * (stage.width * card.radiusFactorX);
    const baseY = card.angleSin * (stage.height * card.radiusFactorY);
    const panStrength = stage.isMobile ? 20 : 45;

    const transform = useTransform(
        [z, pointer.x, pointer.y],
        ([currZ, px, py]: number[]) => {
            const offsetX = baseX - px * panStrength;
            const offsetY = baseY - py * panStrength;
            return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
        }
    );

    return (
        <motion.div
            style={{ width: cardWidth, transform, opacity, zIndex: card.index + 1 }}
            className="absolute left-1/2 top-1/2 aspect-[4/5] will-change-transform select-none"
        >
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl shadow-black/50 ring-1 ring-[var(--line2)]">
                <CardFace item={card.item} />
            </div>
        </motion.div>
    );
}

export interface TunnelFinale {
    src: string;
    alt: string;
    /** Darken the image so copy reads on top (0–1). */
    dim?: number;
    /** Copy that reveals line by line over the expanded image. */
    lines?: ReactNode[];
    eyebrow?: ReactNode;
    /** Small caption pinned to the corner (e.g. a photo credit line). */
    caption?: ReactNode;
}

export interface PerspectiveTunnelHeroProps {
    images: TunnelItem[];
    eyebrow?: ReactNode;
    title?: ReactNode;
    titleAs?: "h1" | "h2";
    subtitle?: ReactNode;
    prompt?: string;
    /** Scroll length of the sequence in viewport heights. */
    length?: number;
    finale?: TunnelFinale;
    id?: string;
    className?: string;
}

function FinaleLine({ children, progress, at }: { children: ReactNode; progress: MotionValue<number>; at: number }) {
    const y = useTransform(progress, [at, at + 0.05], ["105%", "0%"]);
    const o = useTransform(progress, [at, at + 0.04], [0, 1]);
    return (
        <span className="block overflow-hidden pb-[0.06em]">
            <motion.span className="block" style={{ y, opacity: o }}>{children}</motion.span>
        </span>
    );
}

export default function PerspectiveTunnelHero({
    images,
    eyebrow = "About Dual Nature",
    title = (
        <>
            BOTH,
            <br />
            AT ONCE.
        </>
    ),
    titleAs = "h1",
    subtitle = "Scroll to travel through the work.",
    prompt = "Scroll to explore",
    length = 3.2,
    finale,
    id,
    className,
}: PerspectiveTunnelHeroProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotionSafe();
    const cards = useRef(layout(images)).current;
    const Title = titleAs;

    const [stage, setStage] = useState<StageDimensions>({ width: 1440, height: 900, isMobile: false });

    useEffect(() => {
        const update = () =>
            setStage({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30, restDelta: 0.0001 });
    const progress = reduce ? scrollYProgress : smoothProgress;

    // with a finale, the corridor finishes by 78% and the last stretch belongs to the finale
    const cardEnd = finale ? 0.72 : 1;
    const cardProgress = useTransform(progress, [0, cardEnd], [0, 1]);

    const pointer = useCameraParallax(!reduce);

    const titleScale = useTransform(progress, [0, 0.5 * cardEnd, cardEnd], [0.92, 1, 1.25]);
    const titleOpacity = useTransform(progress, [0, 0.82 * cardEnd, cardEnd], [1, 1, 0]);
    const promptOpacity = useTransform(progress, [0, 0.06], [1, 0]);
    const barScale = useTransform(progress, [0, 1], [0, 1]);

    // finale: a card-sized frame grows from the centre to cover the stage
    const fStart = cardEnd - 0.04;
    const fFull = cardEnd + 0.1;
    const fScale = useTransform(progress, [fStart, fFull], [0.18, 1]);
    const fRadius = useTransform(progress, [fStart, fFull], [24, 0]);
    const fOpacity = useTransform(progress, [fStart, fStart + 0.03], [0, 1]);
    const fDim = useTransform(progress, [fFull - 0.04, fFull + 0.06], [0, finale?.dim ?? 0.6]);
    const fImgScale = useTransform(progress, [fStart, 1], [1.25, 1.02]);
    const fEyebrow = useTransform(progress, [fFull, fFull + 0.04], [0, 1]);
    // every line is fully in by ~95%, leaving a short hold before the section releases
    const lineStart = fFull - 0.02;
    const lineStep = finale?.lines?.length ? Math.min(0.045, (0.86 - lineStart) / Math.max(1, finale.lines.length - 1)) : 0.05;

    const TitleBlock = (
        <>
            <p className="mb-4 font-[family-name:var(--mono)] text-[11px] uppercase tracking-[0.4em] text-[var(--amber)]">{eyebrow}</p>
            <Title className="bg-gradient-to-b from-[var(--fg)] via-[var(--fg)] to-[color-mix(in_srgb,var(--fg)_40%,transparent)] bg-clip-text font-[family-name:var(--display)] text-[clamp(3rem,13vw,7rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-transparent">
                {title}
            </Title>
            <p className="mt-5 max-w-[36ch] text-sm font-light text-[var(--muted)] sm:text-base">{subtitle}</p>
        </>
    );

    const FinaleCopy = finale && (finale.lines?.length || finale.eyebrow) ? (
        <div className="absolute inset-0 z-[3] flex items-end">
            <div className="mx-auto w-full max-w-[1280px] px-[var(--gut)] pb-[clamp(80px,17vh,170px)]">
                {finale.eyebrow ? (
                    <motion.p style={reduce ? undefined : { opacity: fEyebrow }} className="mb-5 flex items-center gap-3 font-[family-name:var(--mono)] text-[11px] uppercase tracking-[0.18em] text-white/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
                        {finale.eyebrow}
                    </motion.p>
                ) : null}
                <p className="max-w-[15ch] font-[family-name:var(--display)] text-[clamp(2.2rem,6vw,5.4rem)] font-medium leading-[1.02] tracking-[-0.05em] text-white">
                    {finale.lines?.map((l, i) =>
                        reduce ? <span key={i} className="block">{l}</span> : <FinaleLine key={i} progress={progress} at={lineStart + i * lineStep}>{l}</FinaleLine>
                    )}
                </p>
            </div>
        </div>
    ) : null;

    if (reduce) {
        return (
            <section id={id} className={cn("relative w-full", className)} aria-label="Introduction">
                <div className="relative flex min-h-[100svh] w-full items-center justify-center bg-[var(--bg)] text-[var(--fg)]">
                    <div className="flex max-w-xl flex-col items-center px-6 text-center">{TitleBlock}</div>
                </div>
                {finale && (
                    <div className="relative h-[100svh] w-full overflow-hidden">
                        <Image src={finale.src} alt={finale.alt} fill sizes="100vw" className="object-cover" />
                        <div className="absolute inset-0" style={{ background: `rgba(4,6,10,${finale.dim ?? 0.6})` }} />
                        {FinaleCopy}
                    </div>
                )}
            </section>
        );
    }

    return (
        <section
            ref={sectionRef}
            id={id}
            className={cn("relative w-full", className)}
            style={{ height: `${length * 100}svh` }}
            aria-label="Introduction"
        >
            <div
                className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden bg-[var(--bg)] text-[var(--fg)] select-none"
                style={{ perspective: stage.isMobile ? "900px" : "1200px", transformStyle: "preserve-3d" }}
            >
                {/* background grid & glow */}
                <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(140,153,179,0.22)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_55%,transparent_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,160,255,0.12)_0%,transparent_65%)]" />

                {/* depth ring guides */}
                <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-[var(--blue)]/15" />
                <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-[var(--line2)]" />

                {/* central typography */}
                <motion.div style={{ scale: titleScale, opacity: titleOpacity }} className="pointer-events-none z-0 flex max-w-xl flex-col items-center px-6 text-center">
                    {TitleBlock}
                </motion.div>

                {/* scroll prompt */}
                <motion.div
                    style={{ opacity: promptOpacity }}
                    className="pointer-events-none absolute bottom-[calc(28px+env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-2 font-[family-name:var(--mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]"
                >
                    <span>{prompt}</span>
                    <div className="h-6 w-px bg-gradient-to-b from-[var(--amber)] to-transparent" />
                </motion.div>

                {/* 3D z-space plane */}
                <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                    {cards.map((card) => (
                        <TunnelCard key={card.index} card={card} progress={cardProgress} pointer={pointer} total={cards.length} stage={stage} />
                    ))}
                </div>

                {/* finale: the last card arrives and fills the screen */}
                {finale && (
                    <motion.div
                        className="absolute inset-0 z-[2] overflow-hidden will-change-transform"
                        style={{ scale: fScale, borderRadius: fRadius, opacity: fOpacity }}
                    >
                        <motion.div className="absolute inset-0" style={{ scale: fImgScale }}>
                            <Image src={finale.src} alt={finale.alt} fill sizes="100vw" className="object-cover" />
                        </motion.div>
                        <motion.div className="absolute inset-0 bg-[#04060a]" style={{ opacity: fDim }} />
                        <div className="absolute inset-x-0 bottom-0 h-[10vh] bg-gradient-to-b from-transparent to-[var(--bg)]" />
                        {FinaleCopy}
                        {finale.caption ? (
                            <motion.div style={{ opacity: fEyebrow }} className="absolute right-[var(--gut)] top-[calc(var(--hdr)+18px)] z-[3] text-right font-[family-name:var(--mono)] text-[10px] uppercase tracking-[0.18em] text-white/80">
                                {finale.caption}
                            </motion.div>
                        ) : null}
                    </motion.div>
                )}

                {/* progress line */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-px bg-[var(--line)]">
                    <motion.div className="h-full origin-left bg-gradient-to-r from-[var(--blue)] via-[var(--violet)] to-[var(--amber)]" style={{ scaleX: barScale }} />
                </div>
            </div>
        </section>
    );
}
