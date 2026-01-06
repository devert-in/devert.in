"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function UiEffects() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const mouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });

            const target = e.target;
            setIsHovering(target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') !== null || target.closest('a') !== null);
        }

        window.addEventListener("mousemove", mouseMove);

        return () => {
            window.removeEventListener("mousemove", mouseMove);
        }
    }, []);

    return (
        <>
            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[3px] bg-neon-cyan origin-left z-50 shadow-[0_0_15px_#00FFFF]"
                style={{ scaleX }}
            />

            {/* Custom Cursor */}
            <motion.div
                className="fixed top-0 left-0 w-10 h-10 rounded-full border border-neon-green/50 pointer-events-none z-[100] hidden md:block mix-blend-difference"
                animate={{
                    x: mousePosition.x - 20,
                    y: mousePosition.y - 20,
                    scale: isHovering ? 2 : 1,
                    borderColor: isHovering ? '#00FFFF' : 'rgba(0, 255, 65, 0.5)'
                }}
                transition={{
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                    mass: 0.5
                }}
            />
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 rounded-full bg-neon-cyan pointer-events-none z-[100] hidden md:block"
                animate={{
                    x: mousePosition.x - 4,
                    y: mousePosition.y - 4,
                }}
                transition={{
                    type: "spring",
                    damping: 50,
                    stiffness: 1000
                }}
            />
        </>
    );
}
