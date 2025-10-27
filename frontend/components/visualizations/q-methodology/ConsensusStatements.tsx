import React, { useState } from 'react';
import { scaleLinear, scaleBand } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { motion } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface ConsensusStatement {
  id: string;
  text: string;
  meanZScore: number;
  standardDeviation: number;
  factorScores: { factor: string; score: number }[];
}

interface ConsensusStatementsProps {
  data: ConsensusStatement[];
  width?: number;
  height?: number;
  threshold?: number;
}

export const ConsensusStatements: React.FC<ConsensusStatementsProps> = ({
  data,
  width = 800,
  height = 600,
  threshold = 0.5,
}) => {
  const [selectedStatement, setSelectedStatement] = useState<string | null>(
    null
  );
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<ConsensusStatement>();

  const margin = { top: 60, right: 60, bottom: 80, left: 250 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Filter consensus statements (low standard deviation)
  const consensusStatements = data
    .filter((statement: any) => statement.standardDeviation < threshold)
    .sort((a, b) => a.standardDeviation - b.standardDeviation)
    .slice(0, 15);

  const xScale = scaleLinear({
    domain: [-4, 4],
    range: [0, innerWidth],
  });

  const yScale = scaleBand({
    domain: consensusStatements.map((_s, i) => i.toString()),
    range: [0, innerHeight],
    padding: 0.2,
  });

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title="Consensus Statements"
        subtitle={`Statements with standard deviation < ${threshold} (high agreement across factors)`}
      >
        {/* Grid */}
        <GridRows
          scale={yScale}
          width={innerWidth}
          strokeDasharray="2 2"
          stroke="rgba(0, 0, 0, 0.05)"
        />

        {/* Zero line */}
        <line
          x1={xScale(0)}
          x2={xScale(0)}
          y1={0}
          y2={innerHeight}
          stroke="#333"
          strokeWidth={2}
        />

        {/* Axes */}
        <AxisLeft
          scale={yScale}
          hideAxisLine
          hideTicks
          tickLabelProps={() => ({ fontSize: 0, fill: 'transparent' })}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          label="Average Z-Score"
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
          tickLabelProps={() => ({
            fontSize: 10,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          })}
        />

        {/* Consensus statements */}
        {consensusStatements.map((statement, i) => {
          const yPos = yScale(i.toString())!;
          const barHeight = yScale.bandwidth();
          const isSelected = selectedStatement === statement.id;
          const rangeWidth =
            xScale(statement.meanZScore + statement.standardDeviation) -
            xScale(statement.meanZScore - statement.standardDeviation);

          return (
            <Group key={statement.id}>
              {/* Background highlight for selection */}
              <motion.rect
                x={-margin.left + 10}
                y={yPos - 5}
                width={width - 20}
                height={barHeight + 10}
                fill={isSelected ? 'rgba(52, 199, 89, 0.1)' : 'transparent'}
                rx={6}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setSelectedStatement(isSelected ? null : statement.id)
                }
              />

              {/* Statement text */}
              <text
                x={-15}
                y={yPos + barHeight / 2 + 4}
                fontSize={10}
                fontFamily="-apple-system"
                textAnchor="end"
                fill={isSelected ? '#34C759' : '#333'}
                fontWeight={isSelected ? '600' : 'normal'}
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setSelectedStatement(isSelected ? null : statement.id)
                }
              >
                {statement.id}.{' '}
                {statement.text.length > 35
                  ? statement.text.substring(0, 35) + '...'
                  : statement.text}
              </text>

              {/* Consensus range bar */}
              <motion.rect
                x={xScale(statement.meanZScore - statement.standardDeviation)}
                y={yPos + barHeight / 2 - 8}
                width={rangeWidth}
                height={16}
                fill="url(#appleGreen)"
                opacity={isSelected ? 0.6 : 0.4}
                rx={8}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
                style={{
                  cursor: 'pointer',
                  transformOrigin: `${xScale(statement.meanZScore)}px ${yPos + barHeight / 2}px`,
                }}
                onMouseEnter={() => {
                  showTooltip({
                    tooltipData: statement,
                    tooltipLeft: xScale(statement.meanZScore) + margin.left,
                    tooltipTop: yPos + barHeight / 2 + margin.top,
                  });
                }}
                onMouseLeave={hideTooltip}
                onClick={() =>
                  setSelectedStatement(isSelected ? null : statement.id)
                }
              />

              {/* Mean score point */}
              <motion.circle
                cx={xScale(statement.meanZScore)}
                cy={yPos + barHeight / 2}
                r={isSelected ? 8 : 6}
                fill="white"
                stroke="#34C759"
                strokeWidth={isSelected ? 4 : 3}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: i * 0.05 + 0.2,
                  duration: 0.4,
                  type: 'spring',
                }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => {
                  showTooltip({
                    tooltipData: statement,
                    tooltipLeft: xScale(statement.meanZScore) + margin.left,
                    tooltipTop: yPos + barHeight / 2 + margin.top,
                  });
                }}
                onMouseLeave={hideTooltip}
                onClick={() =>
                  setSelectedStatement(isSelected ? null : statement.id)
                }
              />

              {/* Mean score value */}
              <text
                x={xScale(statement.meanZScore)}
                y={yPos + barHeight / 2 + 2}
                fontSize={7}
                fontWeight="700"
                fill="#34C759"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="-apple-system"
                pointerEvents="none"
              >
                {statement.meanZScore.toFixed(1)}
              </text>

              {/* Standard deviation label */}
              <text
                x={innerWidth + 15}
                y={yPos + barHeight / 2 + 4}
                fontSize={9}
                fontFamily="-apple-system"
                fill={isSelected ? '#34C759' : '#666'}
                fontWeight={isSelected ? '600' : 'normal'}
              >
                &sigma;={statement.standardDeviation.toFixed(3)}
              </text>

              {/* Range indicators */}
              <text
                x={xScale(statement.meanZScore - statement.standardDeviation)}
                y={yPos + barHeight / 2 + 25}
                fontSize={8}
                fontFamily="-apple-system"
                fill="#999"
                textAnchor="middle"
              >
                {(statement.meanZScore - statement.standardDeviation).toFixed(
                  1
                )}
              </text>
              <text
                x={xScale(statement.meanZScore + statement.standardDeviation)}
                y={yPos + barHeight / 2 + 25}
                fontSize={8}
                fontFamily="-apple-system"
                fill="#999"
                textAnchor="middle"
              >
                {(statement.meanZScore + statement.standardDeviation).toFixed(
                  1
                )}
              </text>
            </Group>
          );
        })}

        {/* Summary statistics */}
        <Group top={innerHeight - 60} left={innerWidth - 180}>
          <rect
            x={-10}
            y={-25}
            width={190}
            height={70}
            fill="rgba(255, 255, 255, 0.9)"
            stroke="rgba(52, 199, 89, 0.3)"
            strokeWidth={1}
            rx={8}
          />
          <text
            x={0}
            y={-10}
            fontSize={11}
            fontFamily="-apple-system"
            fontWeight="600"
            fill="#34C759"
          >
            Consensus Summary
          </text>
          <text
            x={0}
            y={5}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Statements: {consensusStatements.length}
          </text>
          <text
            x={0}
            y={20}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Avg. Agreement:{' '}
            {(
              consensusStatements.reduce(
                (sum, s) => sum + (1 - s.standardDeviation),
                0
              ) / consensusStatements.length
            ).toFixed(2)}
          </text>
          <text
            x={0}
            y={35}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Threshold: &sigma; &lt; {threshold}
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
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(52, 199, 89, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(52, 199, 89, 0.15)',
              maxWidth: '350px',
            }}
          >
            <div style={{ fontFamily: '-apple-system', fontSize: '12px' }}>
              <div
                style={{
                  fontWeight: '600',
                  color: '#34C759',
                  marginBottom: '6px',
                }}
              >
                Statement {tooltipData.id}
              </div>
              <div
                style={{
                  marginBottom: '8px',
                  fontSize: '11px',
                  lineHeight: '1.4',
                }}
              >
                {tooltipData.text}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                <div>
                  Mean Z-Score:{' '}
                  <span style={{ fontWeight: '600', color: '#34C759' }}>
                    {tooltipData.meanZScore.toFixed(3)}
                  </span>
                </div>
                <div>
                  Standard Deviation:{' '}
                  <span style={{ fontWeight: '600' }}>
                    {tooltipData.standardDeviation.toFixed(3)}
                  </span>
                </div>
                <div>
                  Range: [
                  {(
                    tooltipData.meanZScore - tooltipData.standardDeviation
                  ).toFixed(2)}
                  ,{' '}
                  {(
                    tooltipData.meanZScore + tooltipData.standardDeviation
                  ).toFixed(2)}
                  ]
                </div>
              </div>
              {tooltipData.factorScores && (
                <div
                  style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    Factor Scores:
                  </div>
                  {tooltipData.factorScores.map((score, idx) => (
                    <div key={idx} style={{ marginLeft: '8px' }}>
                      {score.factor}: {score.score.toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TooltipWithBounds>
        )}
    </>
  );
};
