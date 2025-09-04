/**
 * Empty State Illustrations
 * Animated SVG illustrations for various empty states
 * Phase 5 - Day 12 Implementation
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * No Studies Illustration
 */
export const NoStudiesIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background Circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#gradient1)"
          opacity="0.1"
        />
        
        {/* Document Stack */}
        <motion.rect
          x="60"
          y="50"
          width="80"
          height="100"
          rx="4"
          fill="#E5E7EB"
          initial={{ y: 60 }}
          animate={{ y: 50 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
        />
        <motion.rect
          x="65"
          y="55"
          width="70"
          height="90"
          rx="4"
          fill="#F3F4F6"
          initial={{ y: 65 }}
          animate={{ y: 55 }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
        />
        <motion.rect
          x="70"
          y="60"
          width="60"
          height="80"
          rx="4"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="2"
          initial={{ y: 70 }}
          animate={{ y: 60 }}
          transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
        />
        
        {/* Plus Icon */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3, type: 'spring' }}
        >
          <circle cx="120" cy="120" r="15" fill="#007AFF" />
          <path
            d="M120 113 L120 127 M113 120 L127 120"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>
        
        {/* Lines on Document */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <line x1="80" y1="75" x2="120" y2="75" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="85" x2="110" y2="85" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="95" x2="115" y2="95" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      </motion.g>
      
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="100%" stopColor="#5856D6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * No Data Illustration
 */
export const NoDataIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Chart Axes */}
        <motion.path
          d="M40 160 L40 40 L160 160"
          stroke="#E5E7EB"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Grid Lines */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[60, 80, 100, 120, 140].map((y, i) => (
            <line
              key={i}
              x1="40"
              y1={y}
              x2="160"
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="2,4"
            />
          ))}
          {[60, 80, 100, 120, 140].map((x, i) => (
            <line
              key={i}
              x1={x}
              y1="40"
              x2={x}
              y2="160"
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="2,4"
            />
          ))}
        </motion.g>
        
        {/* Empty Bar Placeholders */}
        <motion.g>
          {[60, 85, 110, 135].map((x, i) => (
            <motion.rect
              key={i}
              x={x}
              y="140"
              width="15"
              height="20"
              fill="#F3F4F6"
              rx="2"
              initial={{ height: 0, y: 160 }}
              animate={{ height: 20, y: 140 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
            />
          ))}
        </motion.g>
        
        {/* Question Mark */}
        <motion.g
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.9, duration: 0.5, type: 'spring' }}
        >
          <circle cx="100" cy="90" r="20" fill="#007AFF" opacity="0.1" />
          <text
            x="100"
            y="98"
            fontSize="24"
            fontWeight="bold"
            fill="#007AFF"
            textAnchor="middle"
          >
            ?
          </text>
        </motion.g>
      </motion.g>
    </svg>
  );
};

/**
 * No Participants Illustration
 */
export const NoParticipantsIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* People Silhouettes */}
        <motion.g
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <circle cx="60" cy="70" r="15" fill="#E5E7EB" />
          <ellipse cx="60" cy="110" rx="20" ry="30" fill="#E5E7EB" />
        </motion.g>
        
        <motion.g
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 0.3 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <circle cx="100" cy="70" r="15" fill="#E5E7EB" />
          <ellipse cx="100" cy="110" rx="20" ry="30" fill="#E5E7EB" />
        </motion.g>
        
        <motion.g
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 0.3 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <circle cx="140" cy="70" r="15" fill="#E5E7EB" />
          <ellipse cx="140" cy="110" rx="20" ry="30" fill="#E5E7EB" />
        </motion.g>
        
        {/* Plus Button */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3, type: 'spring' }}
        >
          <circle cx="100" cy="140" r="20" fill="#007AFF" />
          <path
            d="M100 130 L100 150 M90 140 L110 140"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
        
        {/* Connection Lines */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <line x1="60" y1="90" x2="100" y2="90" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="3,3" />
          <line x1="100" y1="90" x2="140" y2="90" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="3,3" />
        </motion.g>
      </motion.g>
    </svg>
  );
};

/**
 * Session Expired Illustration
 */
export const SessionExpiredIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Clock Circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="50"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        
        {/* Clock Face */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <circle cx="100" cy="100" r="46" fill="#F3F4F6" />
          
          {/* Hour Markers */}
          {[0, 90, 180, 270].map((angle, i) => (
            <motion.line
              key={i}
              x1={100 + 38 * Math.cos((angle - 90) * Math.PI / 180)}
              y1={100 + 38 * Math.sin((angle - 90) * Math.PI / 180)}
              x2={100 + 42 * Math.cos((angle - 90) * Math.PI / 180)}
              y2={100 + 42 * Math.sin((angle - 90) * Math.PI / 180)}
              stroke="#9CA3AF"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
            />
          ))}
        </motion.g>
        
        {/* Clock Hands */}
        <motion.g>
          {/* Hour Hand */}
          <motion.line
            x1="100"
            y1="100"
            x2="100"
            y2="75"
            stroke="#6B7280"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ rotate: 0 }}
            animate={{ rotate: 150 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{ transformOrigin: '100px 100px' }}
          />
          
          {/* Minute Hand */}
          <motion.line
            x1="100"
            y1="100"
            x2="100"
            y2="65"
            stroke="#4B5563"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ rotate: 0 }}
            animate={{ rotate: 240 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{ transformOrigin: '100px 100px' }}
          />
        </motion.g>
        
        {/* Center Dot */}
        <circle cx="100" cy="100" r="4" fill="#4B5563" />
        
        {/* Expired Badge */}
        <motion.g
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.3, type: 'spring' }}
        >
          <rect x="70" y="140" width="60" height="20" rx="10" fill="#EF4444" />
          <text
            x="100"
            y="154"
            fontSize="10"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            EXPIRED
          </text>
        </motion.g>
      </motion.g>
    </svg>
  );
};

/**
 * 404 Not Found Illustration
 */
export const NotFoundIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 404 Text */}
        <motion.text
          x="100"
          y="80"
          fontSize="48"
          fontWeight="bold"
          fill="#E5E7EB"
          textAnchor="middle"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 80, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          404
        </motion.text>
        
        {/* Magnifying Glass */}
        <motion.g
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
        >
          <circle
            cx="85"
            cy="120"
            r="25"
            fill="none"
            stroke="#007AFF"
            strokeWidth="4"
          />
          <line
            x1="103"
            y1="138"
            x2="125"
            y2="160"
            stroke="#007AFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Question mark inside */}
          <text
            x="85"
            y="130"
            fontSize="20"
            fontWeight="bold"
            fill="#007AFF"
            textAnchor="middle"
          >
            ?
          </text>
        </motion.g>
        
        {/* Scattered dots */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {[[40, 140], [160, 140], [50, 40], [150, 40], [30, 90], [170, 90]].map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#E5E7EB"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05, duration: 0.2 }}
            />
          ))}
        </motion.g>
      </motion.g>
    </svg>
  );
};

/**
 * Error Illustration
 */
export const ErrorIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Warning Triangle */}
        <motion.path
          d="M100 40 L160 140 L40 140 Z"
          fill="#FEF2F2"
          stroke="#EF4444"
          strokeWidth="3"
          strokeLinejoin="round"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        />
        
        {/* Exclamation Mark */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <line
            x1="100"
            y1="70"
            x2="100"
            y2="100"
            stroke="#EF4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="100" cy="115" r="3" fill="#EF4444" />
        </motion.g>
        
        {/* Glitch Effect Lines */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 0.6, duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <rect x="70" y="85" width="60" height="2" fill="#EF4444" opacity="0.3" />
          <rect x="80" y="95" width="40" height="2" fill="#EF4444" opacity="0.3" />
        </motion.g>
        
        {/* Decorative Elements */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <circle cx="50" cy="50" r="4" fill="#FCA5A5" />
          <circle cx="150" cy="50" r="4" fill="#FCA5A5" />
          <circle cx="30" cy="150" r="4" fill="#FCA5A5" />
          <circle cx="170" cy="150" r="4" fill="#FCA5A5" />
        </motion.g>
      </motion.g>
    </svg>
  );
};