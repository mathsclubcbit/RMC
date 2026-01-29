"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

// --- Math Constants (Lorenz System) ---
// sigma = 10, rho = 28, beta = 8/3
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const DT = 0.005; // Smaller time step for smoother lines

function LorenzAttractor({ count = 12000 }) {
    const meshRef = useRef();
    const { size } = useThree();
    const isMobile = size.width < 768;

    // Initialize the trail and colors
    const { positions, colors } = useMemo(() => {
        const pts = [];
        const cols = [];
        let x = 0.1, y = 0, z = 0;

        // Colors
        const colorA = new THREE.Color("#2dd4bf"); // Teal
        const colorB = new THREE.Color("#fbbf24"); // Amber/Gold

        // Pre-calculate points
        for (let i = 0; i < count; i++) {
            const dx = SIGMA * (y - x) * DT;
            const dy = (x * (RHO - z) - y) * DT;
            const dz = (x * y - BETA * z) * DT;
            x += dx;
            y += dy;
            z += dz;
            pts.push(x, y, z);

            // Color based on Position (X axis separates the lobes roughly)
            // Normalize X roughly between -20 and 20
            const mixFactor = (x + 20) / 40;
            const clampedMix = Math.max(0, Math.min(1, mixFactor));

            const c = colorA.clone().lerp(colorB, clampedMix);
            cols.push(c.r, c.g, c.b);
        }

        return {
            positions: new Float32Array(pts),
            colors: new Float32Array(cols)
        };
    }, [count]);

    const geometry = useMemo(() => {
        if (!positions) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
    }, [positions, colors]);

    useFrame((state) => {
        if (meshRef.current) {
            // Variable rotation speed with Phase Shift
            // User reported it slows down "too early" (on the left). 
            // We shift the phase by PI/2 so the "slow spot" arrives later in the rotation.
            const angle = meshRef.current.rotation.y;

            // Phase shift of -PI/2 aligns the "Butterfly Face" better with the camera view
            const phaseAdjustedAngle = angle - Math.PI / 2;

            // "Pause and Swoosh" Effect
            const baseSpeed = 0.008 * (1 - 0.95 * Math.cos(phaseAdjustedAngle));

            // Mobile Slowdown: 30% speed on mobile (requested "much more time")
            const mobileFactor = isMobile ? 0.3 : 1.0;

            meshRef.current.rotation.y += baseSpeed * mobileFactor;

            // Gentle sway on Z and X for organic feel
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
        }
    });

    if (!geometry) return null;

    return (
        <points ref={meshRef}>
            <bufferGeometry attach="geometry" {...geometry} />
            <pointsMaterial
                attach="material"
                size={isMobile ? 0.25 : 0.15} // Bigger particles on mobile
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function ResponsiveCamera() {
    const { camera } = useThree();

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;

            if (isMobile) {
                // FOV 50: Balanced perspective
                // Y 0: Perfectly centered
                // eslint-disable-next-line react-hooks/immutability
                camera.fov = 50;
                camera.position.z = 80; // Was 90, now 80 (Closer = Bigger)
                camera.position.y = 0;
            } else {
                // Desktop: Standard Cinematic
                // eslint-disable-next-line react-hooks/immutability
                camera.fov = 40;
                camera.position.z = 60;
                camera.position.y = 8; // Slight lift on desktop
            }
            camera.updateProjectionMatrix();
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [camera]);

    return null;
}

export default function ChaosHero() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <section className="relative w-full h-screen overflow-hidden bg-transparent" style={{ touchAction: 'pan-y' }}>
            {/* 3D Scene */}
            <div
                className="absolute inset-0 z-10 canvas-container"
                style={{ pointerEvents: isMobile ? 'none' : 'auto' }}
            >
                <Canvas camera={{ position: [0, 8, 60], fov: 40 }} gl={{ alpha: true }} onCreated={({ gl }) => gl.setClearColor(new THREE.Color('#020617'), 0)}>
                    {/* <color attach="background" args={['#020617']} /> -- Removed to allow transparency */}
                    {/* Fog should match the background logic, but since it's transparent, fog might hide things locally. 
              Let's keep fog but make it fade to transparent or just keep it dark to blend with fixed bg? 
              If fixed bg is dark, fading to dark is fine. */}
                    <fog attach="fog" args={['#020617', 30, 90]} />

                    <ResponsiveCamera />

                    {!isMobile && (
                        <OrbitControls
                            enableZoom={false}
                            autoRotate={true}
                            autoRotateSpeed={0.5}
                            enablePan={false}
                            maxPolarAngle={Math.PI / 1.5}
                            minPolarAngle={Math.PI / 3}
                        />
                    )}

                    <ambientLight intensity={0.5} />

                    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                        <LorenzAttractor count={12000} />
                    </Float>

                    {/* Stars for depth */}
                    <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
                </Canvas>
            </div>

            {/* Overlay Content - Academic Manuscript Style */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
                <div className="max-w-4xl px-6 text-center">

                    {/* Header Tag */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="mb-10"
                    >
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-teal/20 bg-teal/5 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(45,212,191,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                            <span className="font-[family-name:var(--font-cinzel)] text-teal/90 text-xs tracking-[0.2em] font-bold">
                                EST. MMXVIII
                            </span>
                        </div>
                    </motion.div>

                    {/* Main Title - Serif & Huge */}
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="font-[family-name:var(--font-montserrat)] font-black text-5xl md:text-7xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 tracking-tight leading-none mb-6 uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    >
                        RAMANUJAN <br />
                        <span className="block mt-4 font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl italic text-teal font-light tracking-wide normal-case drop-shadow-none">Maths Club</span>
                    </motion.h1>

                    {/* Subtitle - Definition Style */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="font-serif text-xl md:text-2xl text-white/60 leading-relaxed italic max-w-2xl mx-auto"
                    >
                        Journey to Infinity
                    </motion.div>

                    {/* Math Notation Decoration */}


                </div>
            </div>

            {/* Gradient Vignette for Text Readability */}
            {/* Gradient Vignette for Text Readability - Reduced opacity and blend mode to reveal background */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/60 pointer-events-none z-0" />
        </section>
    );
}
