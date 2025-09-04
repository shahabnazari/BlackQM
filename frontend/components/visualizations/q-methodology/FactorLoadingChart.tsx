import React, { useState, useMemo } from 'react';
import { scaleLinear, scaleOrdinal, scaleSqrt } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { motion } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface ParticipantLoading {
  participant: string;
  x: number; // Factor 1 loading
  y: number; // Factor 2 loading
  z?: number; // Factor 3 loading (for 3D effect)
  loadingStrength: number; // Combined loading magnitude
  definingFactor?: string;
  allLoadings: { factor: string; value: number }[];
}

interface FactorLoadingChartProps {
  data: ParticipantLoading[];
  factors: string[];
  width?: number;
  height?: number;
  significanceThreshold?: number;
  show3D?: boolean;
}

export const FactorLoadingChart: React.FC<FactorLoadingChartProps> = ({
  data,
  factors,
  width = 900,
  height = 500,
  significanceThreshold = 0.4,
  show3D = false
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<ParticipantLoading>();

  // Chart dimensions
  const margin = { top: 60, right: 60, bottom: 80, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Process data for 3D factor space
  const processedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      // Apply 3D perspective transformation if enabled
      displayX: show3D && d.z !== undefined ? d.x + (d.z * 0.3) : d.x,
      displayY: show3D && d.z !== undefined ? d.y + (d.z * 0.2) : d.y,
    }));
  }, [data, show3D]);

  // Scales
  const xScale = scaleLinear({
    domain: [-1, 1],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [-1, 1],
    range: [innerHeight, 0],
  });

  // Bubble size scale based on loading strength
  const radiusScale = scaleSqrt({
    domain: [0, Math.max(...data.map(d => d.loadingStrength))],
    range: [4, 25],
  });

  const colorScale = scaleOrdinal({
    domain: factors.concat(['undefined']),
    range: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#00C7BE', '#8E8E93'],
  });

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title={`3D Factor Space Visualization${show3D ? ' (3D View)' : ''}`}
        subtitle={`Bubble sizes represent loading strength • Threshold: ±${significanceThreshold}`}
      >
        {/* Grid */}
        <GridRows
          scale={yScale}
          width={innerWidth}
          strokeDasharray="3 3"
          stroke="rgba(0, 0, 0, 0.1)"
        />
        <GridColumns
          scale={xScale}
          height={innerHeight}
          strokeDasharray="3 3"
          stroke="rgba(0, 0, 0, 0.1)"
        />

        {/* Significance threshold circles */}
        <circle
          cx={xScale(0)}
          cy={yScale(0)}
          r={xScale(significanceThreshold) - xScale(0)}
          fill="none"
          stroke="#FF9500"
          strokeWidth={2}
          strokeDasharray="5 5"
          opacity={0.5}
        />

        {/* Quadrant labels */}
        <text x={xScale(0.7)} y={yScale(0.7)} fontSize={10} fontFamily="-apple-system" fill="#666" textAnchor="middle">
          High F1 & F2
        </text>
        <text x={xScale(-0.7)} y={yScale(0.7)} fontSize={10} fontFamily="-apple-system" fill="#666" textAnchor="middle">
          Low F1, High F2
        </text>
        <text x={xScale(-0.7)} y={yScale(-0.7)} fontSize={10} fontFamily="-apple-system" fill="#666" textAnchor="middle">
          Low F1 & F2
        </text>
        <text x={xScale(0.7)} y={yScale(-0.7)} fontSize={10} fontFamily="-apple-system" fill="#666" textAnchor="middle">
          High F1, Low F2
        </text>

        {/* Axes */}
        <AxisLeft
          scale={yScale}
          label={factors[1] || 'Factor 2'}
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          label={factors[0] || 'Factor 1'}
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
        />

        {/* Participant bubbles */}
        <Group>
          {processedData.map((participant, i) => {
            const x = xScale(participant.displayX);
            const y = yScale(participant.displayY);
            const radius = radiusScale(participant.loadingStrength);
            const isSignificant = participant.loadingStrength >= significanceThreshold;
            const isSelected = selectedParticipant === participant.participant;
            const bubbleColor = participant.definingFactor 
              ? colorScale(participant.definingFactor) 
              : colorScale('undefined');

            return (
              <motion.g
                key={participant.participant}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isSelected || !selectedParticipant ? 1 : 0.4,
                  scale: isSelected ? 1.2 : 1
                }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              >
                {/* 3D shadow effect */}
                {show3D && participant.z !== undefined && (
                  <circle
                    cx={x + 2}
                    cy={y + 2}
                    r={radius}
                    fill="rgba(0, 0, 0, 0.2)"
                    opacity={0.3}
                  />
                )}
                
                {/* Main bubble */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={bubbleColor}
                  opacity={isSignificant ? 0.8 : 0.4}
                  stroke={isSelected ? '#000' : isSignificant ? '#fff' : 'none'}
                  strokeWidth={isSelected ? 3 : 2}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => {
                    showTooltip({
                      tooltipData: participant,
                      tooltipLeft: x + margin.left,
                      tooltipTop: y + margin.top,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                  onClick={() => setSelectedParticipant(
                    selectedParticipant === participant.participant ? null : participant.participant
                  )}
                />
                
                {/* Participant label */}
                <text
                  x={x}
                  y={y + 3}
                  fontSize={Math.min(8, radius / 2)}
                  fontWeight="600"
                  fill={isSignificant ? 'white' : '#666'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="-apple-system"
                  pointerEvents="none"
                  style={{ userSelect: 'none' }}
                >
                  {participant.participant.substring(0, 3)}
                </text>
                
                {/* Loading strength indicator */}
                {isSelected && (
                  <text
                    x={x}
                    y={y + radius + 15}
                    fontSize={10}
                    fontWeight="600"
                    fill={bubbleColor}
                    textAnchor="middle"
                    fontFamily="-apple-system"
                    pointerEvents="none"
                  >
                    {participant.loadingStrength.toFixed(2)}
                  </text>
                )}
              </motion.g>
            );
          })}
        </Group>

        {/* Legend */}
        <Group top={innerHeight + 20} left={20}>
          <text x={0} y={0} fontSize={11} fontFamily="-apple-system" fontWeight="600" fill="#333">
            Legend:
          </text>
          {factors.map((factor, i) => (
            <Group key={factor} left={i * 80} top={15}>
              <circle
                cx={6}
                cy={6}
                r={6}
                fill={colorScale(factor)}
                opacity={0.8}
              />
              <text
                x={18}
                y={10}
                fontSize={10}
                fontFamily="-apple-system"
                fill="#333"
              >
                {factor}
              </text>
            </Group>
          ))}
          {/* Bubble size legend */}
          <Group top={35}>
            <text x={0} y={0} fontSize={9} fontFamily="-apple-system" fill="#666">
              Bubble size = Loading strength
            </text>
            <circle cx={10} cy={15} r={4} fill="#007AFF" opacity={0.5} />
            <text x={20} y={18} fontSize={8} fontFamily="-apple-system" fill="#666">Weak</text>
            <circle cx={60} cy={15} r={8} fill="#007AFF" opacity={0.8} />
            <text x={75} y={18} fontSize={8} fontFamily="-apple-system" fill="#666">Strong</text>
          </Group>
        </Group>
      </BaseChart>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            ...defaultStyles,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '280px'
          }}
        >
          <div style={{ fontFamily: '-apple-system', fontSize: '12px' }}>
            <strong>{tooltipData.participant}</strong>
            <div style={{ marginTop: '6px', fontSize: '11px' }}>
              <div>Loading Strength: <span style={{ fontWeight: '600', color: '#007AFF' }}>
                {tooltipData.loadingStrength.toFixed(3)}
              </span></div>
              <div style={{ marginTop: '2px' }}>Position: ({tooltipData.x.toFixed(2)}, {tooltipData.y.toFixed(2)})</div>
              {show3D && tooltipData.z !== undefined && (
                <div>Z-axis: {tooltipData.z.toFixed(2)}</div>
              )}
              {tooltipData.definingFactor && (
                <div style={{ marginTop: '4px' }}>Defining Factor: <span style={{
                  color: colorScale(tooltipData.definingFactor),
                  fontWeight: '600'
                }}>{tooltipData.definingFactor}</span></div>
              )}
            </div>
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#666' }}>
              Factor Loadings:
              {tooltipData.allLoadings.map((loading, idx) => (
                <div key={idx} style={{ marginLeft: '8px' }}>
                  {loading.factor}: {loading.value.toFixed(3)}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '4px', fontSize: '10px', color: tooltipData.loadingStrength >= significanceThreshold ? '#34C759' : '#FF9500' }}>
              {tooltipData.loadingStrength >= significanceThreshold ? '✓ Significant' : '⚠ Below threshold'}
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};