import React, { useState } from 'react';
import { scaleLinear, scaleBand, scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { GridColumns } from '@visx/grid';
import { motion } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface StatementScore {
  factor: string;
  zScore: number;
  rank: number;
}

interface DistinguishingStatement {
  id: string;
  text: string;
  scores: StatementScore[];
  pValue: number;
  isConsensus: boolean;
}

interface DistinguishingStatementsProps {
  data: DistinguishingStatement[];
  factors: string[];
  width?: number;
  height?: number;
}

export const DistinguishingStatements: React.FC<DistinguishingStatementsProps> = ({
  data,
  factors,
  width = 900,
  height = 600
}) => {
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ statement: DistinguishingStatement; factor: string; score: StatementScore }>();

  // Chart dimensions
  const margin = { top: 60, right: 200, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Filter distinguishing statements (p < 0.05)
  const distinguishingStatements = data
    .filter(s => s.pValue < 0.05 && !s.isConsensus)
    .sort((a, b) => a.pValue - b.pValue)
    .slice(0, 10); // Top 10 most distinguishing

  // Scales
  const xScale = scaleLinear({
    domain: [-4, 4],
    range: [0, innerWidth],
  });

  const yScale = scaleBand({
    domain: distinguishingStatements.map(s => s.id),
    range: [0, innerHeight],
    padding: 0.3,
  });

  const colorScale = scaleOrdinal({
    domain: factors,
    range: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#00C7BE'],
  });

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title="Distinguishing Statements"
        subtitle="Statements that significantly differentiate factors (p < 0.05)"
      >
        {/* Grid */}
        <GridColumns
          scale={xScale}
          height={innerHeight}
          strokeDasharray="3 3"
          stroke="rgba(0, 0, 0, 0.1)"
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

        {/* X-axis labels */}
        <text
          x={xScale(-4)}
          y={-10}
          fontSize={11}
          fontFamily="-apple-system"
          textAnchor="start"
          fill="#666"
        >
          Most Disagree (-4)
        </text>
        <text
          x={xScale(0)}
          y={-10}
          fontSize={11}
          fontFamily="-apple-system"
          textAnchor="middle"
          fill="#666"
        >
          Neutral (0)
        </text>
        <text
          x={xScale(4)}
          y={-10}
          fontSize={11}
          fontFamily="-apple-system"
          textAnchor="end"
          fill="#666"
        >
          Most Agree (+4)
        </text>

        {/* Statement rows */}
        {distinguishingStatements.map((statement, i) => {
          const yPos = yScale(statement.id)!;
          const isSelected = selectedStatement === statement.id;

          return (
            <Group key={statement.id}>
              {/* Background highlight */}
              <motion.rect
                x={-margin.left + 10}
                y={yPos - 5}
                width={width - margin.right - 20}
                height={yScale.bandwidth() + 10}
                fill={isSelected ? 'rgba(0, 122, 255, 0.05)' : 'transparent'}
                rx={8}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedStatement(isSelected ? null : statement.id)}
              />

              {/* Factor scores */}
              {statement.scores.map((score, j) => {
                const xPos = xScale(score.zScore);

                return (
                  <motion.g
                    key={`${statement.id}-${score.factor}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: isSelected || !selectedStatement ? 1 : 0.7,
                      opacity: isSelected || !selectedStatement ? 1 : 0.5
                    }}
                    transition={{
                      delay: i * 0.05 + j * 0.02,
                      duration: 0.3,
                    }}
                  >
                    <circle
                      cx={xPos}
                      cy={yPos + yScale.bandwidth() / 2}
                      r={isSelected ? 8 : 6}
                      fill={colorScale(score.factor)}
                      stroke="white"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => {
                        showTooltip({
                          tooltipData: { statement, factor: score.factor, score },
                          tooltipLeft: xPos + margin.left,
                          tooltipTop: yPos + yScale.bandwidth() / 2 + margin.top,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                    />
                    <text
                      x={xPos}
                      y={yPos + yScale.bandwidth() / 2 + 1}
                      fontSize={8}
                      fontWeight="600"
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="-apple-system"
                      pointerEvents="none"
                    >
                      {score.rank}
                    </text>
                  </motion.g>
                );
              })}

              {/* Connecting lines between scores */}
              {statement.scores.length > 1 && (
                <motion.path
                  d={`M ${statement.scores.map(s => `${xScale(s.zScore)},${yPos + yScale.bandwidth() / 2}`).join(' L ')}`}
                  stroke="rgba(0, 0, 0, 0.2)"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                />
              )}

              {/* P-value indicator */}
              <text
                x={innerWidth + 10}
                y={yPos + yScale.bandwidth() / 2 + 4}
                fontSize={9}
                fontFamily="-apple-system"
                fill={statement.pValue < 0.01 ? '#FF3B30' : '#FF9500'}
                fontWeight="600"
              >
                p={statement.pValue.toFixed(3)}
              </text>
            </Group>
          );
        })}

        {/* Statement labels */}
        {distinguishingStatements.map((statement) => {
          const yPos = yScale(statement.id)!;
          const displayText = statement.text.length > 40 
            ? statement.text.substring(0, 40) + '...' 
            : statement.text;

          return (
            <text
              key={`label-${statement.id}`}
              x={-margin.left + 15}
              y={yPos + yScale.bandwidth() / 2 + 4}
              fontSize={10}
              fontFamily="-apple-system"
              fill="#333"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedStatement(
                selectedStatement === statement.id ? null : statement.id
              )}
            >
              {statement.id}. {displayText}
            </text>
          );
        })}

        {/* Legend */}
        <Group top={-40} left={innerWidth / 2 - (factors.length * 40) / 2}>
          {factors.map((factor, i) => (
            <Group key={factor} left={i * 80}>
              <circle
                cx={0}
                cy={0}
                r={5}
                fill={colorScale(factor)}
              />
              <text
                x={10}
                y={3}
                fontSize={11}
                fontFamily="-apple-system"
                fill="#333"
              >
                {factor}
              </text>
            </Group>
          ))}
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
            padding: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '300px',
          }}
        >
          <div style={{ fontFamily: '-apple-system', fontSize: '12px' }}>
            <strong>{tooltipData.factor}</strong>
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
              {tooltipData.statement.text}
            </div>
            <div style={{ marginTop: '6px' }}>
              Z-score: <span style={{ 
                color: colorScale(tooltipData.factor),
                fontWeight: '600' 
              }}>
                {tooltipData.score.zScore.toFixed(2)}
              </span>
            </div>
            <div>
              Rank: <span style={{ fontWeight: '600' }}>
                {tooltipData.score.rank}
              </span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#999' }}>
              p-value: {tooltipData.statement.pValue.toFixed(4)}
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};