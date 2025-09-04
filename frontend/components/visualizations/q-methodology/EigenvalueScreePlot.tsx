import React from 'react';
import { scaleLinear, scaleBand } from '@visx/scale';
import { Line } from '@visx/shape';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Circle } from '@visx/shape';
import { motion } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface EigenvalueData {
  factor: number;
  eigenvalue: number;
  varianceExplained: number;
  cumulativeVariance: number;
}

interface EigenvalueScreePlotProps {
  data: EigenvalueData[];
  width?: number;
  height?: number;
}

export const EigenvalueScreePlot: React.FC<EigenvalueScreePlotProps> = ({ 
  data, 
  width = 800, 
  height = 400 
}) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<EigenvalueData>();

  // Chart dimensions
  const margin = { top: 40, right: 80, bottom: 60, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Kaiser criterion line at eigenvalue = 1
  const kaiserLine = 1.0;

  // Scales
  const xScale = scaleBand({
    domain: data.map(d => d.factor),
    range: [0, innerWidth],
    padding: 0.3,
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map(d => d.eigenvalue), 2)],
    range: [innerHeight, 0],
  });

  const percentScale = scaleLinear({
    domain: [0, 100],
    range: [innerHeight, 0],
  });

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title="Eigenvalue Scree Plot"
        subtitle="Factor extraction analysis with Kaiser criterion"
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

        {/* Axes */}
        <AxisLeft
          scale={yScale}
          label="Eigenvalue"
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          label="Factor"
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
        />

        {/* Kaiser criterion line */}
        <Line
          from={{ x: 0, y: yScale(kaiserLine) }}
          to={{ x: innerWidth, y: yScale(kaiserLine) }}
          stroke="#FF3B30"
          strokeWidth={2}
          strokeDasharray="5 5"
          opacity={0.7}
        />
        <text
          x={innerWidth - 100}
          y={yScale(kaiserLine) - 10}
          fontSize={11}
          fill="#FF3B30"
          fontFamily="-apple-system"
        >
          Kaiser Criterion (λ = 1)
        </text>

        {/* Scree plot line */}
        <motion.path
          d={`M ${data
            .map((d) => `${(xScale(d.factor) ?? 0) + xScale.bandwidth() / 2},${yScale(d.eigenvalue)}`)
            .join(' L ')}`}
          fill="none"
          stroke="url(#appleBlue)"
          strokeWidth={3}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Data points */}
        {data.map((d, i) => (
          <motion.g
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Circle
              cx={(xScale(d.factor) ?? 0) + xScale.bandwidth() / 2}
              cy={yScale(d.eigenvalue)}
              r={6}
              fill="white"
              stroke="url(#appleBlue)"
              strokeWidth={3}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                showTooltip({
                  tooltipData: d,
                  tooltipLeft: (xScale(d.factor) ?? 0) + xScale.bandwidth() / 2 + margin.left,
                  tooltipTop: yScale(d.eigenvalue) + margin.top,
                });
              }}
              onMouseLeave={hideTooltip}
            />
            {d.eigenvalue >= kaiserLine && (
              <text
                x={(xScale(d.factor) ?? 0) + xScale.bandwidth() / 2}
                y={yScale(d.eigenvalue) - 12}
                fontSize={10}
                fontWeight="600"
                fill="#007AFF"
                textAnchor="middle"
                fontFamily="-apple-system"
              >
                {d.eigenvalue.toFixed(2)}
              </text>
            )}
          </motion.g>
        ))}

        {/* Cumulative variance line (secondary) */}
        <motion.path
          d={`M ${data
            .map((d) => `${(xScale(d.factor) ?? 0) + xScale.bandwidth() / 2},${percentScale(d.cumulativeVariance)}`)
            .join(' L ')}`}
          fill="none"
          stroke="url(#appleGreen)"
          strokeWidth={2}
          strokeDasharray="3 3"
          opacity={0.6}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Secondary Y-axis for cumulative variance */}
        <AxisLeft
          scale={percentScale}
          left={innerWidth}
          label="Cumulative Variance %"
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
            fill: '#34C759'
          }}
          tickLabelProps={() => ({
            fontSize: 10,
            fontFamily: '-apple-system',
            textAnchor: 'start',
            fill: '#34C759'
          })}
        />
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
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ fontFamily: '-apple-system', fontSize: '12px' }}>
            <strong>Factor {tooltipData.factor}</strong>
            <div style={{ marginTop: '4px' }}>
              Eigenvalue: <span style={{ color: '#007AFF' }}>{tooltipData.eigenvalue.toFixed(3)}</span>
            </div>
            <div>
              Variance: <span style={{ color: '#34C759' }}>{tooltipData.varianceExplained.toFixed(1)}%</span>
            </div>
            <div>
              Cumulative: <span style={{ color: '#34C759' }}>{tooltipData.cumulativeVariance.toFixed(1)}%</span>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};