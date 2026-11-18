"use client";

/*
 * Perspective Tunnel Hero — adapted from the 21st.dev component.
 * Changes from the original so it works everywhere:
 *  - Progress follows normal page scroll through a tall sticky section (useScroll), instead of
 *    hijacking the mouse wheel. Touch screens work, and the page never gets trapped.
 *  - Images, copy and accent colours are props; defaults are the Dual Nature brand.
 *  - Pointer parallax only for real mice; reduced motion shows a calm static layout.
 */

import {
    motion,
    useTransform,
    useReducedMotion,
    useMotionValue,
    useSpring,
    useScroll,
    MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TunnelImage {
    src: string;
    title: string;
    alt?: string;
}

interface TunnelCardData {
    item: TunnelImage;
    angleCos: number;
    angleSin: number;
    radiusFactorX: number;
    radiusFactorY: number;
    rotationZ: number;
    index: number;
}

function layout(images: TunnelImage[]): TunnelCardData[] {
    return images.map((item, i) => {
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
            <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-[box-shadow,ring-color] duration-500">
                <img
                    src={card.item.src}
                    alt={card.item.alt ?? card.item.title}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-3 sm:p-5">
                    <span className="font-[family-name:var(--mono)] text-[10px] uppercase tracking-[0.18em] text-white/90 sm:text-xs">
                        {card.item.title}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export interface PerspectiveTunnelHeroProps {
    images: TunnelImage[];
    eyebrow?: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
    prompt?: string;
    /** Scroll length of the sequence in viewport heights. */
    length?: number;
    className?: string;
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
    subtitle = "Scroll to travel through the work.",
    prompt = "Scroll to explore",
    length = 3.2,
    className,
}: PerspectiveTunnelHeroProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const cards = useRef(layout(images)).current;

    const [stage, setStage] = useState<StageDimensions>({ width: 1440, height: 900, isMobile: false });

    useEffect(() => {
        const update = () =>
            setStage({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Progress = how far the page has scrolled through this section. Native scroll, so touch works.
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30, restDelta: 0.0001 });
    const progress = reduce ? scrollYProgress : smoothProgress;

    const pointer = useCameraParallax(!reduce);

    const titleScale = useTransform(progress, [0, 0.5, 1], [0.92, 1, 1.25]);
    const titleOpacity = useTransform(progress, [0, 0.85, 1], [1, 1, 0]);
    const promptOpacity = useTransform(progress, [0, 0.08], [1, 0]);

    return (
        <section
            ref={sectionRef}
            className={cn("relative w-full", className)}
            style={{ height: reduce ? "100svh" : `${length * 100}svh` }}
            aria-label="Introduction"
        >
            <div
                className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden bg-[var(--bg)] text-[var(--fg)] select-none"
                style={{ perspective: stage.isMobile ? "900px" : "1200px", transformStyle: "preserve-3d" }}
            >
                {/* Background grid & glow, in brand colour */}
                <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(140,153,179,0.22)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_55%,transparent_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,160,255,0.12)_0%,transparent_65%)]" />

                {/* Depth ring guides */}
                <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-[var(--blue)]/15" />
                <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-white/10" />

                {/* Central typography */}
                <motion.div
                    style={reduce ? undefined : { scale: titleScale, opacity: titleOpacity }}
                    className="pointer-events-none z-0 flex max-w-xl flex-col items-center px-6 text-center"
                >
                    <p className="mb-4 font-[family-name:var(--mono)] text-[11px] uppercase tracking-[0.4em] text-[var(--amber)]">
                        {eyebrow}
                    </p>
                    <h1 className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text font-[family-name:var(--display)] text-[clamp(3rem,13vw,7rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-transparent">
                        {title}
                    </h1>
                    <p className="mt-5 max-w-[36ch] text-sm font-light text-[var(--muted)] sm:text-base">{subtitle}</p>
                </motion.div>

                {/* Scroll prompt */}
                <motion.div
                    style={{ opacity: promptOpacity }}
                    className="pointer-events-none absolute bottom-[calc(28px+env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-2 font-[family-name:var(--mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]"
                >
                    <span>{prompt}</span>
                    <div className="h-6 w-px bg-gradient-to-b from-[var(--amber)] to-transparent" />
                </motion.div>

                {/* 3D z-space plane */}
                {!reduce && (
                    <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                        {cards.map((card) => (
                            <TunnelCard
                                key={card.index}
                                card={card}
                                progress={progress}
                                pointer={pointer}
                                total={cards.length}
                                stage={stage}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
