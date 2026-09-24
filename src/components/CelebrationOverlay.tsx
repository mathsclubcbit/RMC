// src/components/CelebrationOverlay.tsx
import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Star, Sparkles, Crown } from "lucide-react";

interface CelebrationOverlayProps {
  type: "four" | "six" | "wicket" | "toss" | "win" | null;
  visible: boolean;
  onDone: () => void;
  winnerName?: string;
  winningTeam?: "A" | "B";
  customTitle?: string;
  customSubtitle?: string;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  type,
  visible,
  onDone,
  winnerName,
  winningTeam,
  customTitle,
  customSubtitle,
}) => {
  useEffect(() => {
    if (!visible || !type) return;

    const fireConfetti = () => {
      const duration = 3000; // 3 seconds for all celebrations
      const end = Date.now() + duration;
      
      // Team-specific colors for win celebration
      const colors = type === "win" 
        ? winningTeam === "A"
          ? ["#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#1D4ED8"] // Blue shades for Team A
          : ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#EA580C"] // Orange shades for Team B
        : type === "six"
        ? ["#FF0000", "#FF4500", "#FFD700", "#FFA500"]
        : ["#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];

      (function frame() {
        confetti({
          particleCount: type === "win" ? 3 : 4, // Reduced particles for win
          angle: 60,
          spread: type === "win" ? 130 : 110,
          origin: { x: 0 },
          colors,
          gravity: type === "win" ? 0.5 : 0.9, // Slower fall for win
          scalar: type === "win" ? 0.9 : 1.1, // Smaller particles for win
          ticks: type === "win" ? 400 : 300, // Longer lasting for win
          shapes: ['circle', 'square'],
          drift: type === "win" ? 0.3 : 0,
        });
        confetti({
          particleCount: type === "win" ? 3 : 4, // Reduced particles for win
          angle: 120,
          spread: type === "win" ? 130 : 110,
          origin: { x: 1 },
          colors,
          gravity: type === "win" ? 0.5 : 0.9,
          scalar: type === "win" ? 0.9 : 1.1,
          ticks: type === "win" ? 400 : 300,
          shapes: ['circle', 'square'],
          drift: type === "win" ? -0.3 : 0,
        });
        
        // Extra center burst for win - more dramatic but fewer particles
        if (type === "win" && Math.random() > 0.7) { // Less frequent bursts
          confetti({
            particleCount: 8, // Reduced from 15
            angle: 90,
            spread: 360,
            origin: { x: 0.5, y: 0.4 },
            colors,
            gravity: 0.3, // Even slower for dramatic effect
            scalar: 1.2, // Smaller particles
            ticks: 500,
          });
        }

        // Additional confetti bursts for six
        if (type === "six" && Math.random() > 0.5) {
          confetti({
            particleCount: 8,
            angle: 90,
            spread: 180,
            origin: { x: 0.5, y: 0.3 },
            colors,
            gravity: 0.6,
            scalar: 1.3,
          });
        }
        
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    };

    // Play the same sound for all celebrations (only first 3 seconds)
    const audio = new Audio("/sounds/IPL Ringtone 2023.mp3");
    audio.play().catch(() => {});
    
    // Stop audio after 3 seconds
    const audioTimer = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 3000);
    
    fireConfetti();
    
    const timer = setTimeout(() => {
      setTimeout(onDone, 400);
    }, 3000); // 3 seconds for all celebrations
    
    return () => {
      clearTimeout(timer);
      clearTimeout(audioTimer);
      audio.pause();
    };
  }, [visible, type, onDone, winningTeam]);

  if (!visible) return null;

  const getContent = () => {
    switch (type) {
      case "four":
        return {
          icon: <Zap className="h-20 w-20 sm:h-28 sm:w-28" />,
          title: customTitle || "FOUR!",
          subtitle: customSubtitle || "What a shot!",
          emoji: "🏏",
          gradient: "from-blue-400 via-cyan-400 to-teal-400",
          bgGradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
          glow: "shadow-[0_0_100px_rgba(34,211,238,0.9)]",
          ringColor: "rgba(34,211,238,0.6)",
        };
      case "six":
        return {
          icon: <Star className="h-24 w-24 sm:h-36 sm:w-36" />,
          title: customTitle || "IT'S A SIX!",
          subtitle: customSubtitle || "Out of the park!",
          emoji: "🚀",
          gradient: "from-red-400 via-orange-400 to-yellow-400",
          bgGradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20",
          glow: "shadow-[0_0_120px_rgba(251,146,60,1)]",
          ringColor: "rgba(251,146,60,0.7)",
        };
      case "wicket":
        return {
          icon: <Zap className="h-20 w-20 sm:h-28 sm:w-28" />,
          title: customTitle || "WICKET!",
          subtitle: customSubtitle || "What a delivery!",
          emoji: "🔥",
          gradient: "from-rose-400 via-red-400 to-orange-400",
          bgGradient: "from-rose-500/20 via-red-500/20 to-orange-500/20",
          glow: "shadow-[0_0_100px_rgba(244,63,94,0.85)]",
          ringColor: "rgba(244,63,94,0.7)",
        };
      case "toss":
        return {
          icon: <Sparkles className="h-20 w-20 sm:h-28 sm:w-28" />,
          title: customTitle || "TOSS WON!",
          subtitle: customSubtitle || "Your team gets first choice.",
          emoji: "🪙",
          gradient: "from-teal-300 via-cyan-300 to-blue-400",
          bgGradient: "from-teal-500/20 via-cyan-500/20 to-blue-500/20",
          glow: "shadow-[0_0_100px_rgba(45,212,191,0.85)]",
          ringColor: "rgba(45,212,191,0.7)",
        };
      case "win":
        return {
          icon: <Trophy className="h-28 w-28 sm:h-36 sm:w-36 lg:h-44 lg:w-44" />,
          title: customTitle || winnerName || "CHAMPIONS!",
          subtitle: customSubtitle || (winnerName ? "WINS THE MATCH!" : "Victory is yours!"),
          emoji: "",
          gradient: winningTeam === "A" 
            ? "from-blue-400 via-blue-500 to-blue-600" // Blue gradient for Team A
            : "from-orange-400 via-orange-500 to-orange-600", // Orange gradient for Team B
          bgGradient: winningTeam === "A"
            ? "from-blue-500/20 via-blue-600/20 to-blue-700/20"
            : "from-orange-500/20 via-orange-600/20 to-orange-700/20",
          glow: winningTeam === "A"
            ? "shadow-[0_0_150px_rgba(59,130,246,1)]" // Blue glow
            : "shadow-[0_0_150px_rgba(249,115,22,1)]", // Orange glow
          ringColor: winningTeam === "A"
            ? "rgba(59,130,246,0.8)"
            : "rgba(249,115,22,0.8)",
        };
      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-black/80 via-black/70 to-black/80 px-4 py-5 backdrop-blur-md sm:px-6"
        >
          {/* Different background animation for win vs others */}
          {type === "win" ? (
            // Win celebration: Multiple rotating gradient layers
            <>
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.3, 1],
                }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
                className={`absolute inset-0 bg-gradient-to-br ${content.bgGradient} blur-3xl opacity-60`}
              />
              <motion.div
                animate={{ 
                  rotate: [360, 0],
                  scale: [1.2, 1, 1.2],
                }}
                transition={{ 
                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
                className={`absolute inset-0 bg-gradient-to-tl ${content.bgGradient} blur-3xl opacity-50`}
              />
            </>
          ) : (
            // Regular celebration: Simple pulsing background
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 bg-gradient-to-br ${content.bgGradient} blur-3xl`}
            />
          )}

          <motion.div
            initial={{ scale: 0, rotate: type === "win" ? 0 : -180, opacity: 0 }}
            animate={{ 
              scale: 1,
              rotate: 0,
              opacity: 1,
            }}
            exit={{ 
              scale: 0.8,
              opacity: 0,
            }}
            transition={type === "win" ? {
              scale: { type: "spring", stiffness: 100, damping: 10, duration: 0.8 },
              opacity: { duration: 0.4 },
            } : {
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.6,
            }}
            className="relative z-10 flex max-h-[calc(100dvh-2.5rem)] w-full max-w-5xl flex-col items-center justify-center gap-4 overflow-visible text-center sm:gap-8"
          >
            {/* Win celebration: Simplified floating sparkles */}
            {type === "win" && [...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1, 0],
                  opacity: [0, 1, 0.8, 0],
                  x: Math.cos(i * Math.PI / 4) * 200,
                  y: Math.sin(i * Math.PI / 4) * 200,
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut",
                }}
                className="absolute"
              >
                <Star className="w-5 h-5 text-white fill-white" />
              </motion.div>
            ))}

            {/* Trophy/Icon - New win animation style */}
            <motion.div
              animate={type === "win" ? {
                y: [0, -20, 0],
                rotate: [0, -5, 5, -5, 0],
              } : { 
                scale: [1, 1.15, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={type === "win" ? {
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
              } : { 
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              {/* Animated glow rings for win */}
              {type === "win" && [...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ 
                    scale: [1, 2.5, 3],
                    opacity: [0.8, 0.3, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut",
                  }}
                  className={`absolute inset-0 rounded-full border-4 ${content.glow}`}
                  style={{ borderColor: content.ringColor }}
                />
              ))}
              
              {/* Icon with dramatic glow */}
              <motion.div
                animate={type === "win" ? {
                  filter: [
                    'drop-shadow(0 0 20px rgba(255,255,255,0.8))',
                    'drop-shadow(0 0 40px rgba(255,255,255,1))',
                    'drop-shadow(0 0 20px rgba(255,255,255,0.8))',
                  ]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`text-white relative z-10`}
              >
                {content.icon}
              </motion.div>
              
              {/* Emoji badge with bounce */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: 0.3,
                  type: "spring",
                  stiffness: 500,
                  damping: 10,
                }}
                className="absolute -bottom-3 -right-3 text-4xl sm:-bottom-4 sm:-right-4 sm:text-6xl"
              >
                {content.emoji}
              </motion.div>
            </motion.div>

            {/* Title with completely new animation for win */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.2, 
                type: type === "win" ? "spring" : "spring",
                stiffness: type === "win" ? 80 : 150,
                damping: type === "win" ? 12 : 20,
              }}
              className="text-center relative"
            >
              {/* Crown above team name for win celebration */}
              {type === "win" && (
                <motion.div
                  initial={{ y: -30, opacity: 0, scale: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1, 
                    scale: 1,
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{ 
                    y: { delay: 0.5, type: "spring", stiffness: 200 },
                    opacity: { delay: 0.5, duration: 0.5 },
                    scale: { delay: 0.5, type: "spring", stiffness: 200 },
                    rotate: { delay: 1, duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="absolute -top-4 right-8 md:-top-6 md:right-12 lg:-top-8 lg:right-16 z-20"
                >
                  <Crown 
                    className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-yellow-400 fill-yellow-400" 
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.9)) drop-shadow(0 0 40px rgba(250, 204, 21, 0.6))',
                    }}
                  />
                </motion.div>
              )}
              
              {/* Win: Animated split text effect */}
              <motion.h1
                animate={type === "win" ? {
                  textShadow: [
                    '0 0 30px rgba(255,255,255,0.5)',
                    '0 0 60px rgba(255,255,255,0.9)',
                    '0 0 30px rgba(255,255,255,0.5)',
                  ],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`relative ${
                    type === "win" && winnerName
                    ? "max-w-[92vw] text-4xl sm:text-6xl md:text-8xl lg:text-[12rem]"
                    : "max-w-[92vw] text-5xl sm:text-7xl md:text-8xl"
                } font-black bg-gradient-to-r ${content.gradient} bg-clip-text text-transparent`}
                style={{
                  WebkitTextStroke: type === "win" ? "clamp(1px, 0.35vw, 5px) rgba(255,255,255,0.6)" : "clamp(1px, 0.2vw, 3px) rgba(255,255,255,0.4)",
                  letterSpacing: type === "win" ? "0.1em" : "0.05em",
                }}
              >
                {content.title}
              </motion.h1>
              
              {/* Subtitle with slide and fade */}
              <motion.p
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  delay: 0.5, 
                  type: "spring",
                  stiffness: 100,
                }}
                className={`relative mt-3 max-w-[88vw] text-lg font-bold text-white sm:mt-8 sm:text-3xl md:text-5xl ${type === "win" ? "sm:text-5xl md:text-7xl" : ""}`}
                style={{
                  textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 0 50px rgba(255,255,255,0.4)",
                }}
              >
                {content.subtitle}
              </motion.p>

              {/* Win: Animated underline with sweep effect */}
              {type === "win" && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: [0, 1, 1, 0] }}
                  transition={{ 
                    duration: 3,
                    times: [0, 0.3, 0.7, 1],
                    repeat: Infinity,
                  }}
                  className="h-3 mt-8 mx-auto rounded-full bg-gradient-to-r from-transparent via-white to-transparent"
                  style={{
                    width: '80%',
                    boxShadow: `0 0 40px ${content.ringColor}`,
                  }}
                />
              )}
            </motion.div>

            {/* Removed old duplicate code - using new win animation above */}

            {/* Pulsing rings for non-win celebrations only */}
            {type !== "win" && [...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 2.5 + i * 0.5, 3.5 + i * 0.5],
                  opacity: [0.7, 0.4, 0],
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full border-4"
                style={{ 
                  borderColor: content.ringColor,
                  boxShadow: `0 0 30px ${content.ringColor}`,
                }}
              />
            ))}
            
            {type === "win" && (
              <>
                {/* Extra sparkle burst for win - reduced particles */}
                {[...Array(8)].map((_, i) => ( // Reduced from 16 to 8
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.2, 0],
                      opacity: [0, 1, 0],
                      x: Math.cos(i * Math.PI / 4) * 250, // Adjusted for 8 particles
                      y: Math.sin(i * Math.PI / 4) * 250,
                      rotate: [0, 180, 360],
                    }}
                    transition={{ 
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.16, // Increased delay for less overlap
                      ease: "easeOut",
                    }}
                    className="absolute w-5 h-5 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full"
                    style={{ 
                      filter: 'blur(1px)',
                      boxShadow: '0 0 15px rgba(251,191,36,0.8)',
                    }}
                  />
                ))}
              </>
            )}

            {type === "six" && (
              <>
                {/* Extra flame effect for six */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.5, 0],
                      opacity: [0, 0.9, 0],
                      y: [0, -150, -250],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeOut",
                    }}
                    className="absolute w-8 h-8 bg-gradient-to-t from-red-500 via-orange-500 to-yellow-400 rounded-full"
                    style={{ 
                      filter: 'blur(4px)',
                      left: `${40 + i * 4}%`,
                      bottom: '-50px',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
