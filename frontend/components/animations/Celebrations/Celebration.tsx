/**
 * Celebration Components
 * Confetti, success animations, and milestone celebrations
 * Phase 5 - Day 13 Implementation
 */

import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';
import { CELEBRATION_CONFIG, ANIMATION_TIMING } from '@/lib/animations/constants';

interface CelebrationProps {
  trigger?: boolean;
  duration?: number;
  message?: string;
  onComplete?: () => void;
}

/**
 * Confetti Celebration Component
 */
export const ConfettiCelebration: React.FC<{
  trigger?: boolean;
  duration?: number;
  particleCount?: number;
  spread?: number;
  colors?: string[];
  onComplete?: () => void;
}> = ({
  trigger = false,
  duration = 5000,
  particleCount = CELEBRATION_CONFIG.confettiCount,
  spread = CELEBRATION_CONFIG.confettiSpread,
  colors = CELEBRATION_CONFIG.confettiColors,
  onComplete,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Set window dimensions
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (trigger) {
      setShowConfetti(true);
      
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [trigger, duration, onComplete]);

  if (!showConfetti) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        numberOfPieces={particleCount}
        recycle={false}
        gravity={CELEBRATION_CONFIG.confettiGravity}
        initialVelocityY={CELEBRATION_CONFIG.confettiVelocity}
        colors={colors as string[]}
        opacity={0.8}
        wind={0.05}
        friction={0.99}
      />
    </div>
  );
};

/**
 * Success Check Animation
 */
export const SuccessCheckmark: React.FC<{
  show?: boolean;
  size?: number;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}> = ({
  show = false,
  size = 120,
  message,
  duration = 2000,
  onComplete,
}) => {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="relative"
              style={{ width: size, height: size }}
            >
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
              >
                {/* Circle Background */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                
                {/* Checkmark */}
                <motion.path
                  d="M30 50 L45 65 L70 35"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>
            
            {message && (
              <motion.p
                className="mt-4 text-lg font-medium text-gray-800 dark:text-gray-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Milestone Badge Animation
 */
export const MilestoneBadge: React.FC<{
  milestone: string;
  description?: string;
  icon?: React.ReactNode;
  show?: boolean;
  position?: 'top' | 'center' | 'bottom';
  duration?: number;
  onComplete?: () => void;
}> = ({
  milestone,
  description,
  icon,
  show = false,
  position = 'top',
  duration = 3000,
  onComplete,
}) => {
  const positionClasses = {
    top: 'top-20',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-20',
  };

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'fixed left-1/2 -translate-x-1/2 z-50',
            positionClasses[position]
          )}
          initial={{ scale: 0, y: -50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: 50, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full px-8 py-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              {icon && (
                <motion.div
                  initial={{ rotate: -360 }}
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {icon}
                </motion.div>
              )}
              <div>
                <h3 className="text-xl font-bold">{milestone}</h3>
                {description && (
                  <p className="text-sm opacity-90">{description}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Sparkles */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Progress Complete Animation
 */
export const ProgressComplete: React.FC<{
  show?: boolean;
  progress?: number;
  message?: string;
  showConfetti?: boolean;
}> = ({
  show = false,
  progress = 100,
  message = 'Complete!',
  showConfetti = true,
}) => {
  return (
    <>
      {showConfetti && <ConfettiCelebration trigger={show && progress === 100} />}
      
      <AnimatePresence>
        {show && (
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 min-w-[300px]">
              {/* Progress Ring */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="#10B981"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 60}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 60 * (1 - progress / 100),
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                
                {/* Percentage Text */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  <span className="text-3xl font-bold text-green-500">
                    {progress}%
                  </span>
                </motion.div>
              </div>
              
              <motion.p
                className="text-center text-lg font-medium text-gray-800 dark:text-gray-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {message}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * Floating Hearts Animation
 */
export const FloatingHearts: React.FC<{
  trigger?: boolean;
  count?: number;
  duration?: number;
}> = ({
  trigger = false,
  count = 10,
  duration = 3000,
}) => {
  const [hearts, setHearts] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      setHearts(Array.from({ length: count }, (_, i) => i));
      
      const timer = setTimeout(() => {
        setHearts([]);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [trigger, count, duration]);

  return (
    <AnimatePresence>
      {hearts.map((heart) => (
        <motion.div
          key={heart}
          className="fixed bottom-20 left-1/2 pointer-events-none z-50"
          initial={{
            x: (Math.random() - 0.5) * 200,
            y: 0,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: -500,
            opacity: 0,
            scale: [0, 1.5, 1],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2 + Math.random(),
            delay: heart * 0.1,
            ease: 'easeOut',
          }}
        >
          <span className="text-4xl">❤️</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

/**
 * Star Burst Animation
 */
export const StarBurst: React.FC<{
  trigger?: boolean;
  x?: number;
  y?: number;
}> = ({ trigger = false, x = 50, y = 50 }) => {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i * Math.PI) / 4) * 100,
                y: Math.sin((i * Math.PI) / 4) * 100,
                opacity: 0,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};