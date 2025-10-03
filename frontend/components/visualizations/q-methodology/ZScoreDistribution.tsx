import React, { useState } from 'react';
import { scaleLinear, scaleBand, scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { LinePath } from '@visx/shape';
import { curveCardinal } from '@visx/curve';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface StatementDistribution {
  statementId: string;
  statement: string;
  distributions: {
    factor: string;
    zScore: number;
    qSortValue: number;
    rank: number;
  }[];
  variance: number;
  meanZScore: number;
}

interface ZScoreDistributionProps {
  data: StatementDistribution[];
  factors: string[];
  width?: number;
  height?: number;
  showVariance?: boolean;
  highlightStatement?: string;
}

export const ZScoreDistribution: React.FC<ZScoreDistributionProps> = ({
  data,
  factors,
  width = 900,
  height = 600,
  showVariance = true,
  highlightStatement
}) => {
  const [selectedStatements, setSelectedStatements] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'individual' | 'comparison' | 'variance'>('individual');
  const [sortBy, setSortBy] = useState<'id' | 'variance' | 'mean'>('variance');

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ statement: StatementDistribution; factor: string; zScore: number }>();

  // Chart dimensions
  const margin = { top: 60, right: 40, bottom: 80, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Sort data based on selected criteria
  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'variance':
        return b.variance - a.variance;
      case 'mean':
        return Math.abs(b.meanZScore) - Math.abs(a.meanZScore);
      default:
        return a.statementId.localeCompare(b.statementId);
    }
  });

  // Get Z-score range across all statements and factors
  const allZScores = data.flatMap(s => s.distributions.map((d: any) => d.zScore));
  const zScoreExtent = [Math.min(...allZScores), Math.max(...allZScores)];

  // Scales
  const xScale = scaleBand({
    domain: sortedData.map((d: any) => d.statementId),
    range: [0, innerWidth],
    padding: 0.1,
  });

  const yScale = scaleLinear({
    domain: zScoreExtent,
    range: [innerHeight, 0],
    nice: true,
  });

  const factorColorScale = scaleOrdinal({
    domain: factors,
    range: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#00C7BE'],
  });

  const varianceColorScale = scaleLinear({
    domain: [0, Math.max(...data.map((d: any) => d.variance))],
    range: ['#E5E5EA', '#FF3B30'] as any,
  });

  // Filter data based on selections
  const displayData = selectedStatements.size > 0 
    ? sortedData.filter((d: any) => selectedStatements.has(d.statementId))
    : sortedData.slice(0, Math.min(20, sortedData.length)); // Limit to 20 for readability

  const toggleStatement = (statementId: string) => {
    const newSelection = new Set(selectedStatements);
    if (newSelection.has(statementId)) {
      newSelection.delete(statementId);
    } else {
      newSelection.add(statementId);
    }
    setSelectedStatements(newSelection);
  };

  const renderIndividualView = () => (
    <Group>
      {displayData.map((statement, statementIndex) => {
        const statementX = xScale(statement.statementId) || 0;
        const statementWidth = xScale.bandwidth();
        const isHighlighted = highlightStatement === statement.statementId;

        return (
          <Group key={statement.statementId} left={statementX}>
            {/* Background bar for variance */}
            {showVariance && (
              <motion.rect
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: statementIndex * 0.02 }}
                x={0}
                y={0}
                width={statementWidth}
                height={innerHeight}
                fill={String(varianceColorScale(statement.variance) || '#E5E5EA')}
                opacity={0.1}
                style={{ transformOrigin: 'bottom' }}
              />
            )}

            {/* Z-score distribution points and lines */}
            {statement.distributions.map((distribution, factorIndex) => {
              const pointY = yScale(distribution.zScore);
              const factorX = (factorIndex / (statement.distributions.length - 1)) * statementWidth;

              return (
                <motion.g
                  key={`${statement.statementId}-${distribution.factor}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: isHighlighted ? 1 : 0.8, scale: 1 }}
                  transition={{
                    delay: statementIndex * 0.02 + factorIndex * 0.01,
                    duration: 0.3,
                  }}
                >
                  {/* Connect points with lines */}
                  {factorIndex > 0 && (
                    <line
                      x1={(factorIndex - 1) / (statement.distributions.length - 1) * statementWidth}
                      y1={yScale(statement.distributions[factorIndex - 1]?.zScore || 0)}
                      x2={factorX}
                      y2={pointY}
                      stroke={factorColorScale(distribution.factor)}
                      strokeWidth={isHighlighted ? 2 : 1}
                      opacity={0.6}
                    />
                  )}

                  {/* Z-score point */}
                  <circle
                    cx={factorX}
                    cy={pointY}
                    r={isHighlighted ? 6 : 4}
                    fill={factorColorScale(distribution.factor)}
                    stroke="white"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => {
                      showTooltip({
                        tooltipData: {
                          statement,
                          factor: distribution.factor,
                          zScore: distribution.zScore,
                        },
                        tooltipLeft: statementX + factorX + margin.left,
                        tooltipTop: pointY + margin.top,
                      });
                    }}
                    onMouseLeave={hideTooltip}
                    onClick={() => toggleStatement(statement.statementId)}
                  />

                  {/* Q-sort value label */}
                  {isHighlighted && (
                    <text
                      x={factorX}
                      y={pointY - 10}
                      fontSize={8}
                      fontWeight="600"
                      fill={factorColorScale(distribution.factor)}
                      textAnchor="middle"
                      fontFamily="-apple-system"
                      pointerEvents="none"
                    >
                      {distribution.qSortValue > 0 ? `+${distribution.qSortValue}` : String(distribution.qSortValue)}
                    </text>
                  )}
                </motion.g>
              );
            })}

            {/* Mean line */}
            <motion.line
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: statementIndex * 0.02 + 0.1 }}
              x1={0}
              x2={statementWidth}
              y1={yScale(statement.meanZScore)}
              y2={yScale(statement.meanZScore)}
              stroke="#333"
              strokeWidth={2}
              strokeDasharray="3 3"
              opacity={0.7}
              style={{ transformOrigin: 'left' }}
            />
          </Group>
        );
      })}
    </Group>
  );

  const renderComparisonView = () => {
    if (selectedStatements.size < 2) {
      return (
        <Group>
          <text
            x={innerWidth / 2}
            y={innerHeight / 2}
            fontSize={16}
            fill="#666"
            textAnchor="middle"
            fontFamily="-apple-system"
          >
            Select at least 2 statements to compare
          </text>
        </Group>
      );
    }

    const compareData = data.filter((d: any) => selectedStatements.has(d.statementId));
    
    return (
      <Group>
        {factors.map((factor, factorIndex) => {
          const factorData = compareData.map((statement, index) => ({
            x: index,
            y: statement.distributions.find(d => d.factor === factor)?.zScore || 0,
            statement: statement.statementId,
          }));

          const factorXScale = scaleBand({
            domain: compareData.map((_, i) => String(i)),
            range: [0, innerWidth],
            padding: 0.1,
          });

          return (
            <motion.g
              key={factor}
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 0.8, pathLength: 1 }}
              transition={{ delay: factorIndex * 0.1, duration: 0.8 }}
            >
              {/* Factor line */}
              <LinePath
                data={factorData}
                x={d => (factorXScale(String(d.x)) || 0) + factorXScale.bandwidth() / 2}
                y={d => yScale(d.y)}
                stroke={factorColorScale(factor)}
                strokeWidth={3}
                curve={curveCardinal}
                opacity={0.8}
              />

              {/* Factor points */}
              {factorData.map((point) => (
                <circle
                  key={`${factor}-${point.x}`}
                  cx={(factorXScale(String(point.x)) || 0) + factorXScale.bandwidth() / 2}
                  cy={yScale(point.y)}
                  r={5}
                  fill={factorColorScale(factor)}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </motion.g>
          );
        })}

        {/* X-axis labels for comparison */}
        {compareData.map((statement, index) => {
          const x = (index / (compareData.length - 1)) * innerWidth;
          return (
            <text
              key={statement.statementId}
              x={x}
              y={innerHeight + 20}
              fontSize={10}
              fill="#333"
              textAnchor="middle"
              fontFamily="-apple-system"
            >
              {statement.statementId}
            </text>
          );
        })}
      </Group>
    );
  };

  const renderVarianceView = () => (
    <Group>
      {sortedData.slice(0, 30).map((statement, index) => {
        const barX = xScale(statement.statementId) || 0;
        const barWidth = xScale.bandwidth();
        const barHeight = (statement.variance / Math.max(...data.map((d: any) => d.variance))) * innerHeight;

        return (
          <motion.g
            key={statement.statementId}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: index * 0.02, duration: 0.5 }}
            style={{ transformOrigin: `${barX + barWidth/2}px ${innerHeight}px` }}
          >
            <rect
              x={barX}
              y={innerHeight - barHeight}
              width={barWidth}
              height={barHeight}
              fill={String(varianceColorScale(statement.variance) || '#E5E5EA')}
              rx={2}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleStatement(statement.statementId)}
            />
            <text
              x={barX + barWidth / 2}
              y={innerHeight - barHeight - 5}
              fontSize={8}
              fontWeight="600"
              fill="#333"
              textAnchor="middle"
              fontFamily="-apple-system"
              pointerEvents="none"
            >
              {statement.variance.toFixed(2)}
            </text>
          </motion.g>
        );
      })}
    </Group>
  );

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title="Statement Z-Score Distributions"
        subtitle={`Showing ${displayData.length} statements across ${factors.length} factors`}
      >
        {/* Control buttons */}
        <Group top={-50}>
          {/* View mode selector */}
          {['individual', 'comparison', 'variance'].map((mode, i) => (
            <motion.g
              key={mode}
              transform={`translate(${i * 100}, 0)`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <rect
                x={0}
                y={0}
                width={90}
                height={30}
                fill={viewMode === mode ? '#007AFF' : 'rgba(255, 255, 255, 0.8)'}
                stroke="#007AFF"
                strokeWidth={1}
                rx={8}
                style={{ cursor: 'pointer' }}
                onClick={() => setViewMode(mode as any)}
              />
              <text
                x={45}
                y={20}
                fontSize={11}
                fontWeight="600"
                fill={viewMode === mode ? 'white' : '#007AFF'}
                textAnchor="middle"
                fontFamily="-apple-system"
                pointerEvents="none"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </text>
            </motion.g>
          ))}

          {/* Sort selector */}
          <Group left={320}>
            {['id', 'variance', 'mean'].map((sort, i) => (
              <motion.g
                key={sort}
                transform={`translate(${i * 80}, 0)`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <rect
                  x={0}
                  y={0}
                  width={70}
                  height={30}
                  fill={sortBy === sort ? '#34C759' : 'rgba(255, 255, 255, 0.8)'}
                  stroke="#34C759"
                  strokeWidth={1}
                  rx={8}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSortBy(sort as any)}
                />
                <text
                  x={35}
                  y={20}
                  fontSize={11}
                  fontWeight="600"
                  fill={sortBy === sort ? 'white' : '#34C759'}
                  textAnchor="middle"
                  fontFamily="-apple-system"
                  pointerEvents="none"
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </text>
              </motion.g>
            ))}
          </Group>
        </Group>

        {/* Grid and axes */}
        <GridRows
          scale={yScale}
          width={innerWidth}
          strokeDasharray="3 3"
          stroke="rgba(0, 0, 0, 0.1)"
        />

        {/* Zero line */}
        <line
          x1={0}
          x2={innerWidth}
          y1={yScale(0)}
          y2={yScale(0)}
          stroke="#8E8E93"
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Axes */}
        <AxisLeft
          scale={yScale}
          label="Z-Score"
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          label="Statement ID"
          labelProps={{
            fontSize: 12,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
          }}
          tickLabelProps={() => ({
            fontSize: 9,
            fontFamily: '-apple-system',
            textAnchor: 'middle',
            angle: viewMode === 'variance' ? -45 : 0,
            dx: viewMode === 'variance' ? -8 : 0,
            dy: viewMode === 'variance' ? -4 : 0,
          })}
        />

        {/* Main visualization */}
        <AnimatePresence mode="wait">
          <motion.g
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'individual' && renderIndividualView()}
            {viewMode === 'comparison' && renderComparisonView()}
            {viewMode === 'variance' && renderVarianceView()}
          </motion.g>
        </AnimatePresence>

        {/* Factor legend */}
        {(viewMode === 'individual' || viewMode === 'comparison') && (
          <Group top={20} left={innerWidth - 120}>
            <rect
              x={-10}
              y={-10}
              width={130}
              height={factors.length * 20 + 20}
              fill="rgba(255, 255, 255, 0.95)"
              stroke="rgba(0, 0, 0, 0.1)"
              strokeWidth={1}
              rx={8}
            />
            <text
              x={0}
              y={5}
              fontSize={12}
              fontWeight="600"
              fontFamily="-apple-system"
              fill="#333"
            >
              Factors
            </text>
            {factors.map((factor, i) => (
              <Group key={factor} top={20 + i * 20}>
                <circle
                  cx={5}
                  cy={5}
                  r={4}
                  fill={factorColorScale(factor)}
                />
                <text
                  x={15}
                  y={9}
                  fontSize={10}
                  fontFamily="-apple-system"
                  fill="#333"
                >
                  {factor}
                </text>
              </Group>
            ))}
          </Group>
        )}

        {/* Statistics panel */}
        <Group top={innerHeight - 60} left={20}>
          <rect
            x={-10}
            y={-20}
            width={200}
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
            Distribution Statistics
          </text>
          <text
            x={0}
            y={18}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Selected: {selectedStatements.size} statements
          </text>
          <text
            x={0}
            y={32}
            fontSize={10}
            fontFamily="-apple-system"
            fill="#666"
          >
            Z-Score range: [{(zScoreExtent[0] || -3).toFixed(2)}, {(zScoreExtent[1] || 3).toFixed(2)}]
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
              Statement {tooltipData.statement.statementId}
            </div>
            <div style={{ marginBottom: '8px', color: '#333' }}>
              {tooltipData.statement.statement}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              <div>
                Factor {tooltipData.factor}: <span style={{ 
                  fontWeight: '600', 
                  color: factorColorScale(tooltipData.factor) 
                }}>
                  {tooltipData.zScore.toFixed(3)}
                </span>
              </div>
              <div>Variance: {tooltipData.statement.variance.toFixed(3)}</div>
              <div>Mean Z-Score: {tooltipData.statement.meanZScore.toFixed(3)}</div>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};