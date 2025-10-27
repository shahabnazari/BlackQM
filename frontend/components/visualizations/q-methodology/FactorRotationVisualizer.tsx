import React, { useState, useCallback, useRef, useEffect } from 'react';
import { scaleLinear } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { motion } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface FactorLoadingPoint {
  participant: string;
  originalLoadings: { [factor: string]: number };
  rotatedLoadings: { [factor: string]: number };
  communality: number;
  definingFactor?: string;
}

interface RotationMatrix {
  angle: number;
  matrix: number[][];
}

interface FactorRotationVisualizerProps {
  data: FactorLoadingPoint[];
  factors: string[];
  width?: number;
  height?: number;
  enableVarimax?: boolean;
  significanceThreshold?: number;
}

export const FactorRotationVisualizer: React.FC<
  FactorRotationVisualizerProps
> = ({
  data,
  factors,
  width = 800,
  height = 800,
  enableVarimax = true,
  significanceThreshold = 0.4,
}) => {
  const [rotationAngles, setRotationAngles] = useState<{
    [key: string]: number;
  }>({});
  const [selectedFactors, setSelectedFactors] = useState<[string, string]>([
    factors[0] || 'F1',
    factors[1] || 'F2',
  ]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [animateRotation, setAnimateRotation] = useState(false);
  const [rotationHistory, setRotationHistory] = useState<RotationMatrix[]>([]);

  const rotationRef = useRef<SVGGElement>(null);
  const isDragging = useRef(false);

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{
    participant: string;
    loadings: { [factor: string]: number };
    communality: number;
  }>();

  // Chart dimensions
  const margin = { top: 80, right: 40, bottom: 80, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const centerX = innerWidth / 2;
  const centerY = innerHeight / 2;

  // Calculate rotation matrix for two factors
  const getRotationMatrix = (angle: number): number[][] => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [
      [cos, -sin],
      [sin, cos],
    ];
  };

  // Apply rotation to loadings
  const applyRotation = useCallback(
    (
      loadings: { [factor: string]: number },
      angle: number = 0
    ): { [factor: string]: number } => {
      const [factor1, factor2] = selectedFactors;
      const matrix = getRotationMatrix(angle);

      const originalF1 = loadings[factor1] || 0;
      const originalF2 = loadings[factor2] || 0;

      const rotatedF1 =
        (matrix[0]?.[0] || 0) * originalF1 + (matrix[0]?.[1] || 0) * originalF2;
      const rotatedF2 =
        (matrix[1]?.[0] || 0) * originalF1 + (matrix[1]?.[1] || 0) * originalF2;

      return {
        ...loadings,
        [factor1]: rotatedF1,
        [factor2]: rotatedF2,
      };
    },
    [selectedFactors]
  );

  // Varimax rotation calculation (simplified)
  const calculateVarimaxRotation = useCallback((): number => {
    if (!enableVarimax) return 0;

    const [factor1, factor2] = selectedFactors;
    const loadings = data.map((d: any) => [
      d.originalLoadings[factor1] || 0,
      d.originalLoadings[factor2] || 0,
    ]);

    // Simplified varimax objective function
    let bestAngle = 0;
    let maxVariance = -Infinity;

    for (let angle = -180; angle <= 180; angle += 1) {
      const matrix = getRotationMatrix(angle);
      let varianceSum = 0;

      for (const [f1, f2] of loadings) {
        const rotF1 = (matrix[0]?.[0] || 0) * f1 + (matrix[0]?.[1] || 0) * f2;
        const rotF2 = (matrix[1]?.[0] || 0) * f1 + (matrix[1]?.[1] || 0) * f2;

        // Maximize variance of squared loadings
        varianceSum += Math.pow(rotF1, 4) + Math.pow(rotF2, 4);
      }

      if (varianceSum > maxVariance) {
        maxVariance = varianceSum;
        bestAngle = angle;
      }
    }

    return bestAngle;
  }, [data, selectedFactors, enableVarimax]);

  // Scales
  const maxLoading = Math.max(
    ...data.flatMap(d =>
      Object.values(showOriginal ? d.originalLoadings : d.rotatedLoadings).map(
        Math.abs
      )
    )
  );
  const loadingScale = Math.max(1.2, maxLoading);

  const xScale = scaleLinear({
    domain: [-loadingScale, loadingScale],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [-loadingScale, loadingScale],
    range: [innerHeight, 0],
  });

  // Get current rotation angle
  const currentRotation =
    rotationAngles[`${selectedFactors[0]}-${selectedFactors[1]}`] || 0;

  // Get rotated data
  const displayData = data.map((d: any) => ({
    ...d,
    currentLoadings: showOriginal
      ? d.originalLoadings
      : applyRotation(d.originalLoadings, currentRotation),
  }));

  // Handle drag for manual rotation
  useEffect(() => {
    if (!rotationRef.current) return;

    const dragHandler = drag<SVGGElement, unknown>()
      .on('start', () => {
        isDragging.current = true;
      })
      .on('drag', (event: any) => {
        const rect = rotationRef.current!.getBoundingClientRect();
        const centerXPage = rect.left + rect.width / 2;
        const centerYPage = rect.top + rect.height / 2;

        const angle = Math.atan2(
          event.sourceEvent.clientY - centerYPage,
          event.sourceEvent.clientX - centerXPage
        );
        const degrees = (angle * 180) / Math.PI;

        setRotationAngles(prev => ({
          ...prev,
          [`${selectedFactors[0]}-${selectedFactors[1]}`]: degrees,
        }));
      })
      .on('end', () => {
        isDragging.current = false;
      });

    select(rotationRef.current).call(dragHandler);
  }, [selectedFactors]);

  const handleVarimaxRotation = () => {
    const optimalAngle = calculateVarimaxRotation();
    setAnimateRotation(true);

    // Add to rotation history
    setRotationHistory(prev => [
      ...prev,
      {
        angle: optimalAngle,
        matrix: getRotationMatrix(optimalAngle),
      },
    ]);

    // Animate to optimal angle
    const startAngle = currentRotation;
    const steps = 60;
    const angleStep = (optimalAngle - startAngle) / steps;

    let step = 0;
    const animate = () => {
      if (step < steps) {
        const currentAngle = startAngle + angleStep * step;
        setRotationAngles(prev => ({
          ...prev,
          [`${selectedFactors[0]}-${selectedFactors[1]}`]: currentAngle,
        }));
        step++;
        requestAnimationFrame(animate);
      } else {
        setAnimateRotation(false);
      }
    };

    animate();
  };

  const resetRotation = () => {
    setRotationAngles(prev => ({
      ...prev,
      [`${selectedFactors[0]}-${selectedFactors[1]}`]: 0,
    }));
    setRotationHistory([]);
  };

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title="Interactive Factor Rotation"
        subtitle={`Rotating ${selectedFactors[0]} vs ${selectedFactors[1]} (${currentRotation.toFixed(1)}°)`}
      >
        {/* Control panel */}
        <Group top={-60}>
          {/* Factor pair selector */}
          <Group>
            <text
              x={0}
              y={-5}
              fontSize={12}
              fontWeight="600"
              fontFamily="-apple-system"
              fill="#333"
            >
              Factor Pair:
            </text>
            {factors.slice(0, -1).map((factor1, i) =>
              factors.slice(i + 1).map((factor2, j) => {
                const key = `${factor1}-${factor2}`;
                const isSelected =
                  selectedFactors[0] === factor1 &&
                  selectedFactors[1] === factor2;

                return (
                  <motion.g
                    key={key}
                    transform={`translate(${100 + (i * factors.length + j) * 80}, 0)`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <rect
                      x={0}
                      y={-20}
                      width={70}
                      height={30}
                      fill={isSelected ? '#007AFF' : 'rgba(255, 255, 255, 0.8)'}
                      stroke="#007AFF"
                      strokeWidth={1}
                      rx={8}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedFactors([factor1, factor2])}
                    />
                    <text
                      x={35}
                      y={0}
                      fontSize={11}
                      fontWeight="600"
                      fill={isSelected ? 'white' : '#007AFF'}
                      textAnchor="middle"
                      fontFamily="-apple-system"
                      pointerEvents="none"
                    >
                      {factor1}×{factor2}
                    </text>
                  </motion.g>
                );
              })
            )}
          </Group>

          {/* Action buttons */}
          <Group left={400}>
            <motion.g whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <rect
                x={0}
                y={-20}
                width={100}
                height={30}
                fill="#34C759"
                rx={8}
                style={{ cursor: 'pointer' }}
                onClick={handleVarimaxRotation}
              />
              <text
                x={50}
                y={0}
                fontSize={11}
                fontWeight="600"
                fill="white"
                textAnchor="middle"
                fontFamily="-apple-system"
                pointerEvents="none"
              >
                Varimax
              </text>
            </motion.g>

            <motion.g
              transform="translate(110, 0)"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <rect
                x={0}
                y={-20}
                width={60}
                height={30}
                fill="#FF9500"
                rx={8}
                style={{ cursor: 'pointer' }}
                onClick={resetRotation}
              />
              <text
                x={30}
                y={0}
                fontSize={11}
                fontWeight="600"
                fill="white"
                textAnchor="middle"
                fontFamily="-apple-system"
                pointerEvents="none"
              >
                Reset
              </text>
            </motion.g>

            <motion.g
              transform="translate(180, 0)"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <rect
                x={0}
                y={-20}
                width={80}
                height={30}
                fill={showOriginal ? '#5856D6' : 'rgba(255, 255, 255, 0.8)'}
                stroke="#5856D6"
                strokeWidth={1}
                rx={8}
                style={{ cursor: 'pointer' }}
                onClick={() => setShowOriginal(!showOriginal)}
              />
              <text
                x={40}
                y={0}
                fontSize={11}
                fontWeight="600"
                fill={showOriginal ? 'white' : '#5856D6'}
                textAnchor="middle"
                fontFamily="-apple-system"
                pointerEvents="none"
              >
                Original
              </text>
            </motion.g>
          </Group>
        </Group>

        {/* Grid */}
        <GridRows
          scale={yScale}
          width={innerWidth}
          strokeDasharray="2 2"
          stroke="rgba(0, 0, 0, 0.1)"
        />
        <GridColumns
          scale={xScale}
          height={innerHeight}
          strokeDasharray="2 2"
          stroke="rgba(0, 0, 0, 0.1)"
        />

        {/* Axes through center */}
        <line
          x1={0}
          x2={innerWidth}
          y1={yScale(0)}
          y2={yScale(0)}
          stroke="#333"
          strokeWidth={1}
        />
        <line
          x1={xScale(0)}
          x2={xScale(0)}
          y1={0}
          y2={innerHeight}
          stroke="#333"
          strokeWidth={1}
        />

        {/* Significance threshold circles */}
        <circle
          cx={xScale(0)}
          cy={yScale(0)}
          r={Math.abs(xScale(significanceThreshold) - xScale(0))}
          fill="none"
          stroke="#FF9500"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />

        {/* Rotation visualization */}
        <Group ref={rotationRef}>
          {/* Rotation axes (shows original factor axes) */}
          {!showOriginal && (
            <motion.g
              animate={{ rotate: -currentRotation }}
              transition={{ duration: animateRotation ? 1 : 0 }}
              style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            >
              <line
                x1={centerX - 100}
                x2={centerX + 100}
                y1={centerY}
                y2={centerY}
                stroke="#007AFF"
                strokeWidth={2}
                strokeDasharray="8 4"
                opacity={0.6}
              />
              <line
                x1={centerX}
                x2={centerX}
                y1={centerY - 100}
                y2={centerY + 100}
                stroke="#34C759"
                strokeWidth={2}
                strokeDasharray="8 4"
                opacity={0.6}
              />

              {/* Axis labels */}
              <text
                x={centerX + 110}
                y={centerY + 5}
                fontSize={12}
                fontWeight="600"
                fill="#007AFF"
                fontFamily="-apple-system"
              >
                {selectedFactors[0]} (original)
              </text>
              <text
                x={centerX + 5}
                y={centerY - 110}
                fontSize={12}
                fontWeight="600"
                fill="#34C759"
                fontFamily="-apple-system"
              >
                {selectedFactors[1]} (original)
              </text>
            </motion.g>
          )}

          {/* Participant points */}
          {displayData.map((participant, index) => {
            const x1Loading =
              participant.currentLoadings[selectedFactors[0]] || 0;
            const x2Loading =
              participant.currentLoadings[selectedFactors[1]] || 0;
            const px = xScale(x1Loading);
            const py = yScale(x2Loading);

            const isSignificant =
              Math.abs(x1Loading) >= significanceThreshold ||
              Math.abs(x2Loading) >= significanceThreshold;
            const communality = participant.communality;

            return (
              <motion.g
                key={participant.participant}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.4 }}
              >
                {/* Connection line to origin */}
                <line
                  x1={xScale(0)}
                  y1={yScale(0)}
                  x2={px}
                  y2={py}
                  stroke={isSignificant ? '#333' : '#999'}
                  strokeWidth={isSignificant ? 1 : 0.5}
                  strokeDasharray={isSignificant ? 'none' : '2 2'}
                  opacity={0.4}
                />

                {/* Participant point */}
                <circle
                  cx={px}
                  cy={py}
                  r={4 + communality * 3} // Size based on communality
                  fill={isSignificant ? '#007AFF' : '#8E8E93'}
                  stroke="white"
                  strokeWidth={2}
                  opacity={0.8}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => {
                    showTooltip({
                      tooltipData: {
                        participant: participant.participant,
                        loadings: participant.currentLoadings,
                        communality: participant.communality,
                      },
                      tooltipLeft: px + margin.left,
                      tooltipTop: py + margin.top,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                />

                {/* Participant label */}
                <text
                  x={px}
                  y={py - 10}
                  fontSize={9}
                  fontWeight="500"
                  fill="#333"
                  textAnchor="middle"
                  fontFamily="-apple-system"
                  pointerEvents="none"
                >
                  {participant.participant}
                </text>
              </motion.g>
            );
          })}
        </Group>

        {/* Axes labels */}
        <AxisLeft
          scale={yScale}
          label={`${selectedFactors[1]}${showOriginal ? '' : ' (rotated)'}`}
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          label={`${selectedFactors[0]}${showOriginal ? '' : ' (rotated)'}`}
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
        />

        {/* Rotation angle indicator */}
        <Group top={20} left={20}>
          <rect
            x={-10}
            y={-15}
            width={120}
            height={60}
            fill="rgba(255, 255, 255, 0.95)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth={1}
            rx={8}
          />
          <text
            x={0}
            y={0}
            fontSize={11}
            fontWeight="600"
            fontFamily="-apple-system"
            fill="#333"
          >
            Rotation Angle
          </text>
          <text
            x={0}
            y={16}
            fontSize={20}
            fontWeight="700"
            fontFamily="-apple-system"
            fill="#007AFF"
          >
            {currentRotation.toFixed(1)}°
          </text>
          <text
            x={0}
            y={32}
            fontSize={9}
            fontFamily="-apple-system"
            fill="#666"
          >
            Drag to rotate manually
          </text>
        </Group>

        {/* Statistics panel */}
        <Group top={innerHeight - 80} left={innerWidth - 180}>
          <rect
            x={-10}
            y={-20}
            width={190}
            height={90}
            fill="rgba(255, 255, 255, 0.95)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth={1}
            rx={8}
          />
          <text
            x={0}
            y={0}
            fontSize={11}
            fontWeight="600"
            fontFamily="-apple-system"
            fill="#333"
          >
            Factor Statistics
          </text>
          <text
            x={0}
            y={18}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Participants: {data.length}
          </text>
          <text
            x={0}
            y={32}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Significant (≥{significanceThreshold}):{' '}
            {
              displayData.filter((d: any) => {
                const x1 = d.currentLoadings[selectedFactors[0]] || 0;
                const x2 = d.currentLoadings[selectedFactors[1]] || 0;
                return (
                  Math.abs(x1) >= significanceThreshold ||
                  Math.abs(x2) >= significanceThreshold
                );
              }).length
            }
          </text>
          <text
            x={0}
            y={46}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Mean Communality:{' '}
            {(
              data.reduce((sum, d) => sum + d.communality, 0) / data.length
            ).toFixed(3)}
          </text>
          <text
            x={0}
            y={60}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Rotations: {rotationHistory.length}
          </text>
        </Group>
      </BaseChart>

      {/* Tooltip */}
      {tooltipOpen &&
        tooltipData &&
        tooltipLeft !== undefined &&
        tooltipTop !== undefined && (
          <TooltipWithBounds
            left={tooltipLeft}
            top={tooltipTop}
            style={{
              ...defaultStyles,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ fontFamily: '-apple-system', fontSize: '12px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}
              >
                {tooltipData.participant}
              </div>
              <div style={{ marginBottom: '4px' }}>
                {selectedFactors[0]}:{' '}
                <span style={{ fontWeight: '600' }}>
                  {tooltipData.loadings[selectedFactors[0]]?.toFixed(3) ||
                    '0.000'}
                </span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                {selectedFactors[1]}:{' '}
                <span style={{ fontWeight: '600' }}>
                  {tooltipData.loadings[selectedFactors[1]]?.toFixed(3) ||
                    '0.000'}
                </span>
              </div>
              <div
                style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}
              >
                Communality: {tooltipData.communality.toFixed(3)}
              </div>
            </div>
          </TooltipWithBounds>
        )}
    </>
  );
};
