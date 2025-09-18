import React from 'react';
import { scaleLinear } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { curveNatural } from '@visx/curve';
import { LinePath } from '@visx/shape';
import { motion } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';

interface DistributionData {
  value: number;
  count: number;
  expectedCount: number;
}

interface QSortDistributionProps {
  data: DistributionData[];
  width?: number;
  height?: number;
  showExpected?: boolean;
}

export const QSortDistribution: React.FC<QSortDistributionProps> = ({
  data,
  width = 800,
  height = 400,
  showExpected = true
}) => {
  // Chart dimensions
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = scaleLinear({
    domain: [Math.min(...data.map((d: any) => d.value)), Math.max(...data.map((d: any) => d.value))],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d: any) => Math.max(d.count, d.expectedCount)))],
    range: [innerHeight, 0],
    nice: true,
  });

  // Bar width calculation
  const barWidth = innerWidth / data.length * 0.8;

  return (
    <BaseChart
      width={width}
      height={height}
      margin={margin}
      title="Q-Sort Distribution"
      subtitle="Actual vs. Expected (quasi-normal) distribution"
    >
      {/* Grid */}
      <GridRows
        scale={yScale}
        width={innerWidth}
        strokeDasharray="3 3"
        stroke="rgba(0, 0, 0, 0.1)"
      />

      {/* Axes */}
      <AxisLeft
        scale={yScale}
        label="Number of Statements"
        labelProps={{
          fontSize: 12,
          fontFamily: '-apple-system',
          textAnchor: 'middle',
        }}
      />
      <AxisBottom
        scale={xScale}
        top={innerHeight}
        label="Q-Sort Value"
        labelProps={{
          fontSize: 12,
          fontFamily: '-apple-system',
          textAnchor: 'middle',
        }}
      />

      {/* Actual distribution bars */}
      <Group>
        {data.map((d, i) => (
          <motion.g
            key={d.value}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{
              delay: i * 0.05,
              duration: 0.5,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: `${xScale(d.value)}px ${innerHeight}px` }}
          >
            <rect
              x={xScale(d.value) - barWidth / 2}
              y={yScale(d.count)}
              width={barWidth}
              height={innerHeight - yScale(d.count)}
              fill="url(#appleBlue)"
              opacity={0.7}
              rx={4}
              ry={4}
            />
            {/* Value label on top of bar */}
            {d.count > 0 && (
              <text
                x={xScale(d.value)}
                y={yScale(d.count) - 5}
                fontSize={10}
                fontWeight="600"
                fill="#007AFF"
                textAnchor="middle"
                fontFamily="-apple-system"
              >
                {d.count}
              </text>
            )}
          </motion.g>
        ))}
      </Group>

      {/* Expected distribution curve */}
      {showExpected && (
        <motion.g
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 1, pathLength: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <LinePath
            data={data}
            x={d => xScale(d.value)}
            y={d => yScale(d.expectedCount)}
            stroke="#FF3B30"
            strokeWidth={3}
            strokeOpacity={0.8}
            strokeDasharray="5 5"
            curve={curveNatural}
          />
          {/* Dots on expected curve */}
          {data.map((d) => (
            <circle
              key={`expected-${d.value}`}
              cx={xScale(d.value)}
              cy={yScale(d.expectedCount)}
              r={4}
              fill="white"
              stroke="#FF3B30"
              strokeWidth={2}
            />
          ))}
        </motion.g>
      )}

      {/* Legend */}
      <Group top={20} left={innerWidth - 150}>
        <Group>
          <rect
            x={0}
            y={0}
            width={20}
            height={12}
            fill="url(#appleBlue)"
            opacity={0.7}
            rx={2}
          />
          <text
            x={25}
            y={10}
            fontSize={11}
            fontFamily="-apple-system"
            fill="#333"
          >
            Actual Distribution
          </text>
        </Group>
        {showExpected && (
          <Group top={20}>
            <line
              x1={0}
              x2={20}
              y1={6}
              y2={6}
              stroke="#FF3B30"
              strokeWidth={3}
              strokeDasharray="5 5"
            />
            <text
              x={25}
              y={10}
              fontSize={11}
              fontFamily="-apple-system"
              fill="#333"
            >
              Expected (Quasi-normal)
            </text>
          </Group>
        )}
      </Group>

      {/* Statistics overlay */}
      <Group top={innerHeight - 40} left={20}>
        <rect
          x={-10}
          y={-20}
          width={180}
          height={50}
          fill="rgba(255, 255, 255, 0.9)"
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth={1}
          rx={8}
        />
        <text
          x={0}
          y={0}
          fontSize={10}
          fontFamily="-apple-system"
          fill="#666"
        >
          Range: [{Math.min(...data.map((d: any) => d.value))}, {Math.max(...data.map((d: any) => d.value))}]
        </text>
        <text
          x={0}
          y={15}
          fontSize={10}
          fontFamily="-apple-system"
          fill="#666"
        >
          Total Statements: {data.reduce((sum, d) => sum + d.count, 0)}
        </text>
      </Group>
    </BaseChart>
  );
};