import React from 'react';
import { scaleBand } from '@visx/scale';
import { scaleSequential } from 'd3-scale';
import { interpolateRdBu } from 'd3-scale-chromatic';
import { Group } from '@visx/group';
import { AxisLeft, AxisTop } from '@visx/axis';
import { motion } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface CorrelationData {
  participant1: string;
  participant2: string;
  correlation: number;
}

interface CorrelationHeatmapProps {
  data: CorrelationData[];
  participants: string[];
  width?: number;
  height?: number;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  data,
  participants,
  width = 800,
  height = 800
}) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<CorrelationData>();

  // Chart dimensions
  const margin = { top: 100, right: 40, bottom: 40, left: 100 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = scaleBand({
    domain: participants,
    range: [0, innerWidth],
    padding: 0.05,
  });

  const yScale = scaleBand({
    domain: participants,
    range: [0, innerHeight],
    padding: 0.05,
  });

  const colorScale = scaleSequential(interpolateRdBu).domain([-1, 1]);

  // Helper to get correlation value
  const getCorrelation = (p1: string, p2: string) => {
    const item = data.find(
      d => (d.participant1 === p1 && d.participant2 === p2) ||
           (d.participant1 === p2 && d.participant2 === p1)
    );
    return item ? item.correlation : p1 === p2 ? 1 : 0;
  };

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title="Participant Correlation Matrix"
        subtitle="Inter-participant Q-sort correlations"
      >
        {/* Axes */}
        <AxisTop
          scale={xScale}
          tickLabelProps={() => ({
            fontSize: 10,
            fontFamily: '-apple-system',
            textAnchor: 'start',
            angle: -45,
            dx: -8,
            dy: -4,
          })}
        />
        <AxisLeft
          scale={yScale}
          tickLabelProps={() => ({
            fontSize: 10,
            fontFamily: '-apple-system',
            textAnchor: 'end',
          })}
        />

        {/* Heatmap cells */}
        <Group>
          {participants.map((p1, i) =>
            participants.map((p2, j) => {
              const correlation = getCorrelation(p1, p2);
              const cellX = xScale(p2) ?? 0;
              const cellY = yScale(p1) ?? 0;
              const cellWidth = xScale.bandwidth();
              const cellHeight = yScale.bandwidth();

              return (
                <motion.g
                  key={`${p1}-${p2}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: (i * participants.length + j) * 0.002,
                    duration: 0.3,
                  }}
                >
                  <rect
                    x={cellX}
                    y={cellY}
                    width={cellWidth}
                    height={cellHeight}
                    fill={colorScale(correlation)}
                    stroke="white"
                    strokeWidth={0.5}
                    rx={2}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => {
                      showTooltip({
                        tooltipData: {
                          participant1: p1,
                          participant2: p2,
                          correlation,
                        },
                        tooltipLeft: cellX + cellWidth / 2 + margin.left,
                        tooltipTop: cellY + cellHeight / 2 + margin.top,
                      });
                    }}
                    onMouseLeave={hideTooltip}
                  />
                  {/* Show correlation value for high correlations */}
                  {Math.abs(correlation) >= 0.5 && p1 !== p2 && (
                    <text
                      x={cellX + cellWidth / 2}
                      y={cellY + cellHeight / 2}
                      fontSize={9}
                      fontWeight="600"
                      fill={Math.abs(correlation) > 0.7 ? 'white' : '#333'}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="-apple-system"
                      pointerEvents="none"
                    >
                      {correlation.toFixed(2)}
                    </text>
                  )}
                </motion.g>
              );
            })
          )}
        </Group>

        {/* Color scale legend */}
        <defs>
          <linearGradient id="colorLegend" x1="0%" y1="0%" x2="100%" y2="0%">
            {Array.from({ length: 21 }, (_, i) => {
              const value = -1 + (i / 10);
              return (
                <stop
                  key={i}
                  offset={`${i * 5}%`}
                  stopColor={colorScale(value)}
                />
              );
            })}
          </linearGradient>
        </defs>

        {/* Legend */}
        <Group top={innerHeight + 20}>
          <rect
            x={innerWidth / 2 - 100}
            y={0}
            width={200}
            height={15}
            fill="url(#colorLegend)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth={1}
            rx={2}
          />
          <text
            x={innerWidth / 2 - 110}
            y={10}
            fontSize={10}
            fontFamily="-apple-system"
            textAnchor="end"
            dominantBaseline="middle"
          >
            -1.0
          </text>
          <text
            x={innerWidth / 2 + 110}
            y={10}
            fontSize={10}
            fontFamily="-apple-system"
            textAnchor="start"
            dominantBaseline="middle"
          >
            1.0
          </text>
          <text
            x={innerWidth / 2}
            y={10}
            fontSize={10}
            fontFamily="-apple-system"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            0.0
          </text>
        </Group>
      </BaseChart>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && tooltipLeft !== undefined && tooltipTop !== undefined && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            ...defaultStyles,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ fontFamily: '-apple-system', fontSize: '12px' }}>
            <strong>Correlation</strong>
            <div style={{ marginTop: '4px' }}>
              {tooltipData.participant1} ↔ {tooltipData.participant2}
            </div>
            <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '600' }}>
              <span style={{ 
                color: tooltipData.correlation > 0 ? '#007AFF' : '#FF3B30' 
              }}>
                {tooltipData.correlation.toFixed(3)}
              </span>
            </div>
            <div style={{ marginTop: '2px', fontSize: '10px', color: '#666' }}>
              {Math.abs(tooltipData.correlation) >= 0.7 ? 'Strong' :
               Math.abs(tooltipData.correlation) >= 0.4 ? 'Moderate' :
               'Weak'} correlation
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};