import React, { useState } from 'react';
import { scaleLinear, scaleBand, scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface StatementScore {
  statementId: string;
  statement: string;
  score: number;
  zScore: number;
  rank: number;
}

interface FactorArray {
  factor: string;
  eigenvalue: number;
  variance: number;
  statements: StatementScore[];
}

interface FactorArraysVisualizationProps {
  data: FactorArray[];
  width?: number;
  height?: number;
  showZScores?: boolean;
}

export const FactorArraysVisualization: React.FC<FactorArraysVisualizationProps> = ({
  data,
  width = 1000,
  height = 600,
  showZScores = false
}) => {
  const [selectedFactor, setSelectedFactor] = useState<string>(data[0]?.factor || '');
  const [viewMode, setViewMode] = useState<'grid' | 'distribution'>('grid');
  
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<StatementScore>();

  // Chart dimensions
  const margin = { top: 60, right: 40, bottom: 80, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const selectedFactorData = data.find(d => d.factor === selectedFactor);
  if (!selectedFactorData) return null;

  const sortedStatements = [...selectedFactorData.statements].sort((a, b) => 
    showZScores ? b.zScore - a.zScore : b.score - a.score
  );

  // Q-sort grid dimensions (typical -4 to +4 range)
  const qSortRange = Array.from({length: 9}, (_, i) => i - 4);
  const maxStatementsPerColumn = Math.max(...qSortRange.map(score => 
    sortedStatements.filter(s => s.score === score).length
  ));

  // Scales for grid view
  const xScale = scaleBand({
    domain: qSortRange.map(String),
    range: [0, innerWidth],
    padding: 0.1,
  });

  const yScale = scaleBand({
    domain: Array.from({length: maxStatementsPerColumn}, (_, i) => String(i)),
    range: [innerHeight, 0],
    padding: 0.05,
  });

  // Scales for distribution view  
  const distributionXScale = scaleBand({
    domain: sortedStatements.map((_, i) => String(i)),
    range: [0, innerWidth],
    padding: 0.05,
  });

  const distributionYScale = scaleLinear({
    domain: showZScores 
      ? [Math.min(...sortedStatements.map(s => s.zScore)), Math.max(...sortedStatements.map(s => s.zScore))]
      : [-4, 4],
    range: [innerHeight, 0],
    nice: true,
  });

  const colorScale = scaleOrdinal({
    domain: ['-4', '-3', '-2', '-1', '0', '1', '2', '3', '4'],
    range: ['#FF3B30', '#FF6B46', '#FF9500', '#FFCC02', '#8E8E93', '#34C759', '#32D74B', '#30B350', '#007AFF'],
  });

  const renderGridView = () => (
    <Group>
      {/* Grid lines */}
      <GridColumns
        scale={xScale}
        height={innerHeight}
        strokeDasharray="2 2"
        stroke="rgba(0, 0, 0, 0.1)"
      />
      <GridRows
        scale={yScale}
        width={innerWidth}
        strokeDasharray="2 2"
        stroke="rgba(0, 0, 0, 0.1)"
      />

      {/* Q-sort positions */}
      {qSortRange.map(score => {
        const statementsAtScore = sortedStatements.filter(s => s.score === score);
        const columnX = xScale(String(score)) || 0;
        const columnWidth = xScale.bandwidth();

        return (
          <Group key={score} left={columnX}>
            {/* Column header */}
            <rect
              x={0}
              y={-30}
              width={columnWidth}
              height={25}
              fill={colorScale(String(score))}
              rx={4}
              opacity={0.8}
            />
            <text
              x={columnWidth / 2}
              y={-12}
              fontSize={14}
              fontWeight="700"
              fill="white"
              textAnchor="middle"
              fontFamily="-apple-system"
            >
              {score > 0 ? `+${score}` : String(score)}
            </text>

            {/* Statements in this column */}
            {statementsAtScore.map((statement, index) => {
              const cellY = yScale(String(index)) || 0;
              const cellHeight = yScale.bandwidth();
              
              return (
                <motion.g
                  key={statement.statementId}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: (Math.abs(score) * 0.1) + (index * 0.05),
                    duration: 0.4,
                    ease: 'backOut',
                  }}
                >
                  <rect
                    x={2}
                    y={cellY}
                    width={columnWidth - 4}
                    height={cellHeight}
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke={colorScale(String(score))}
                    strokeWidth={2}
                    rx={6}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => {
                      showTooltip({
                        tooltipData: statement,
                        tooltipLeft: columnX + columnWidth / 2 + margin.left,
                        tooltipTop: cellY + cellHeight / 2 + margin.top,
                      });
                    }}
                    onMouseLeave={hideTooltip}
                  />
                  <text
                    x={columnWidth / 2}
                    y={cellY + cellHeight / 2}
                    fontSize={10}
                    fontWeight="600"
                    fill="#333"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="-apple-system"
                    pointerEvents="none"
                  >
                    {statement.statementId}
                  </text>
                  {showZScores && (
                    <text
                      x={columnWidth / 2}
                      y={cellY + cellHeight / 2 + 12}
                      fontSize={8}
                      fill="#666"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="-apple-system"
                      pointerEvents="none"
                    >
                      z={statement.zScore.toFixed(2)}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </Group>
        );
      })}
    </Group>
  );

  const renderDistributionView = () => (
    <Group>
      {/* Grid */}
      <GridRows
        scale={distributionYScale}
        width={innerWidth}
        strokeDasharray="3 3"
        stroke="rgba(0, 0, 0, 0.1)"
      />

      {/* Zero line */}
      {!showZScores && (
        <line
          x1={0}
          x2={innerWidth}
          y1={distributionYScale(0)}
          y2={distributionYScale(0)}
          stroke="#8E8E93"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      )}

      {/* Statement bars */}
      {sortedStatements.map((statement, index) => {
        const barX = distributionXScale(String(index)) || 0;
        const barWidth = distributionXScale.bandwidth();
        const value = showZScores ? statement.zScore : statement.score;
        const barY = value >= 0 ? distributionYScale(value) : distributionYScale(0);
        const barHeight = Math.abs(distributionYScale(value) - distributionYScale(0));

        return (
          <motion.g
            key={statement.statementId}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{
              delay: index * 0.01,
              duration: 0.5,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: `${barX + barWidth/2}px ${distributionYScale(0)}px` }}
          >
            <rect
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill={colorScale(String(statement.score))}
              opacity={0.8}
              rx={2}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => {
                showTooltip({
                  tooltipData: statement,
                  tooltipLeft: barX + barWidth / 2 + margin.left,
                  tooltipTop: barY + margin.top,
                });
              }}
              onMouseLeave={hideTooltip}
            />
            <text
              x={barX + barWidth / 2}
              y={barY + (value >= 0 ? -5 : barHeight + 15)}
              fontSize={8}
              fontWeight="600"
              fill="#333"
              textAnchor="middle"
              fontFamily="-apple-system"
              pointerEvents="none"
            >
              {statement.statementId}
            </text>
          </motion.g>
        );
      })}

      {/* Axes for distribution view */}
      <AxisLeft
        scale={distributionYScale}
        label={showZScores ? "Z-Score" : "Q-Sort Value"}
        labelProps={{
          fontSize: 12,
          fontFamily: '-apple-system',
          textAnchor: 'middle',
        }}
      />
      <AxisBottom
        scale={distributionXScale}
        top={innerHeight}
        label="Statement Rank"
        labelProps={{
          fontSize: 12,
          fontFamily: '-apple-system',
          textAnchor: 'middle',
        }}
        tickFormat={(d, i) => i % 5 === 0 ? String(i + 1) : ''}
      />
    </Group>
  );

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title={`Factor ${selectedFactor} - Idealized Q-Sort Array`}
        subtitle={`Eigenvalue: ${selectedFactorData.eigenvalue.toFixed(2)}, Variance: ${selectedFactorData.variance.toFixed(1)}%`}
      >
        {/* Control buttons */}
        <Group top={-50}>
          {/* Factor selector */}
          {data.map((factor, i) => (
            <motion.g
              key={factor.factor}
              transform={`translate(${i * 80}, 0)`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <rect
                x={0}
                y={0}
                width={70}
                height={30}
                fill={selectedFactor === factor.factor ? '#007AFF' : 'rgba(255, 255, 255, 0.8)'}
                stroke="#007AFF"
                strokeWidth={1}
                rx={8}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedFactor(factor.factor)}
              />
              <text
                x={35}
                y={20}
                fontSize={12}
                fontWeight="600"
                fill={selectedFactor === factor.factor ? 'white' : '#007AFF'}
                textAnchor="middle"
                fontFamily="-apple-system"
                pointerEvents="none"
              >
                {factor.factor}
              </text>
            </motion.g>
          ))}

          {/* View mode toggle */}
          <Group left={data.length * 80 + 20}>
            <rect
              x={0}
              y={0}
              width={120}
              height={30}
              fill={viewMode === 'grid' ? '#34C759' : 'rgba(255, 255, 255, 0.8)'}
              stroke="#34C759"
              strokeWidth={1}
              rx={8}
              style={{ cursor: 'pointer' }}
              onClick={() => setViewMode(viewMode === 'grid' ? 'distribution' : 'grid')}
            />
            <text
              x={60}
              y={20}
              fontSize={11}
              fontWeight="600"
              fill={viewMode === 'grid' ? 'white' : '#34C759'}
              textAnchor="middle"
              fontFamily="-apple-system"
              pointerEvents="none"
            >
              {viewMode === 'grid' ? 'Grid View' : 'Distribution'}
            </text>
          </Group>

          {/* Z-score toggle */}
          <Group left={data.length * 80 + 160}>
            <rect
              x={0}
              y={0}
              width={80}
              height={30}
              fill={showZScores ? '#FF9500' : 'rgba(255, 255, 255, 0.8)'}
              stroke="#FF9500"
              strokeWidth={1}
              rx={8}
              style={{ cursor: 'pointer' }}
              onClick={() => setViewMode('distribution')} // Auto-switch to distribution for z-scores
            />
            <text
              x={40}
              y={20}
              fontSize={11}
              fontWeight="600"
              fill={showZScores ? 'white' : '#FF9500'}
              textAnchor="middle"
              fontFamily="-apple-system"
              pointerEvents="none"
            >
              Z-Scores
            </text>
          </Group>
        </Group>

        {/* Main visualization */}
        <AnimatePresence mode="wait">
          <motion.g
            key={`${selectedFactor}-${viewMode}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'grid' ? renderGridView() : renderDistributionView()}
          </motion.g>
        </AnimatePresence>

        {/* Statistics panel */}
        <Group top={innerHeight - 60} left={innerWidth - 200}>
          <rect
            x={-10}
            y={-20}
            width={210}
            height={70}
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
            Statements: {sortedStatements.length}
          </text>
          <text
            x={0}
            y={32}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Range: {Math.min(...sortedStatements.map(s => s.score))} to {Math.max(...sortedStatements.map(s => s.score))}
          </text>
        </Group>
      </BaseChart>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
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
            maxWidth: '300px',
          }}
        >
          <div style={{ fontFamily: '-apple-system', fontSize: '12px', lineHeight: 1.4 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Statement {tooltipData.statementId}
            </div>
            <div style={{ marginBottom: '8px', color: '#333' }}>
              {tooltipData.statement}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              <div>Score: <span style={{ fontWeight: '600', color: colorScale(String(tooltipData.score)) }}>
                {tooltipData.score > 0 ? `+${tooltipData.score}` : String(tooltipData.score)}
              </span></div>
              <div>Z-Score: <span style={{ fontWeight: '600' }}>{tooltipData.zScore.toFixed(3)}</span></div>
              <div>Rank: #{tooltipData.rank}</div>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};