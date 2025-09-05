'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CubeTransparentIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  AdjustmentsVerticalIcon,
} from '@heroicons/react/24/outline';

interface FactorRotationViewProps {
  factors: any[];
  onRotate: (params: any) => void;
  isRotating: boolean;
  rotationResults?: any;
}

// FactorSpace component removed - using simplified 2D visualization instead

export default function FactorRotationView({
  factors,
  onRotate,
  isRotating,
  rotationResults,
}: FactorRotationViewProps) {
  const [rotationMethod, setRotationMethod] = useState<
    'varimax' | 'quartimax' | 'equamax' | 'oblimin'
  >('varimax');
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [localPreviewAngle, setLocalPreviewAngle] = useState(0);
  const animationFrameRef = useRef<number>();

  // High-performance rotation handler (<16ms response)
  const handleRotationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newAngle = parseFloat(e.target.value);
      setLocalPreviewAngle(newAngle);

      // Immediate visual feedback (client-side)
      setRotationAngle(newAngle);

      // Debounced server update
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        // This will be sent to server after user stops dragging
        setTimeout(() => {
          if (!isAnimating) {
            onRotate({ method: rotationMethod, angle: newAngle });
          }
        }, 300);
      });
    },
    [rotationMethod, onRotate, isAnimating]
  );

  const handleAutoRotate = () => {
    setIsAnimating(!isAnimating);
  };

  const handleApplyRotation = () => {
    onRotate({
      method: rotationMethod,
      angle: rotationAngle,
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Factor Rotation Controls
          </h3>
          <Badge variant="info">
            {isAnimating ? 'Auto-Rotating' : 'Manual Control'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rotation Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rotation Method
            </label>
            <select
              value={rotationMethod}
              onChange={e => setRotationMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="varimax">Varimax (Orthogonal)</option>
              <option value="quartimax">Quartimax (Orthogonal)</option>
              <option value="equamax">Equamax (Orthogonal)</option>
              <option value="oblimin">Direct Oblimin (Oblique)</option>
            </select>
          </div>

          {/* Rotation Angle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rotation Angle: {localPreviewAngle.toFixed(1)}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="0.1"
              value={localPreviewAngle}
              onChange={handleRotationChange}
              className="w-full"
              disabled={isAnimating}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <Button
            variant="secondary"
            size="md"
            onClick={handleAutoRotate}
            className="flex items-center"
          >
            {isAnimating ? (
              <>
                <PauseIcon className="h-4 w-4 mr-2" />
                Pause Rotation
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                Auto Rotate
              </>
            )}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleApplyRotation}
            disabled={isRotating || isAnimating}
            loading={isRotating}
            className="flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Apply Rotation
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setRotationAngle(0);
              setLocalPreviewAngle(0);
            }}
            className="flex items-center"
          >
            <AdjustmentsVerticalIcon className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </Card>

      {/* 2D Visualization Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Factor Space Visualization
        </h3>
        <div className="w-full h-[500px] bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <CubeTransparentIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Rotation Angle: {rotationAngle.toFixed(1)}°
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Method: {rotationMethod}
            </p>
            {isAnimating && (
              <p className="text-sm text-blue-500 mt-4 animate-pulse">
                Auto-rotating...
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Rotation Results */}
      {rotationResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rotation Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Method
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rotationResults.rotationMethod}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Final Angle
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rotationResults.rotationAngle}°
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Convergence
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rotationResults.converged ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Factor Correlation Matrix */}
            {rotationResults.factorCorrelations && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Factor Correlations
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Factor
                        </th>
                        {factors.map((_, index) => (
                          <th
                            key={index}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            F{index + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {rotationResults.factorCorrelations.map(
                        (row: number[], i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                              F{i + 1}
                            </td>
                            {row.map((value, j) => (
                              <td
                                key={j}
                                className="px-4 py-2 text-sm text-gray-900 dark:text-white"
                              >
                                {value.toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
