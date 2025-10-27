import React, { useState } from 'react';
import { scaleLinear, scaleBand } from '@visx/scale';
import { scaleSequential } from 'd3-scale';
import {
  interpolateRdBu,
  interpolateViridis,
  interpolateSpectral,
} from 'd3-scale-chromatic';
import { Group } from '@visx/group';
import { AxisLeft, AxisTop } from '@visx/axis';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseChart } from '../charts/BaseChart';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface ParticipantLoading {
  participant: string;
  loadings: { [factor: string]: number };
  communality: number;
  definingFactor?: string;
  flagged: boolean;
  reliability: number;
  demographics?: { [key: string]: any };
}

interface ParticipantLoadingMatrixProps {
  data: ParticipantLoading[];
  factors: string[];
  width?: number;
  height?: number;
  significanceThreshold?: number;
  colorScheme?: 'diverging' | 'viridis' | 'spectral';
  sortBy?: 'participant' | 'definingFactor' | 'communality' | 'reliability';
  showStats?: boolean;
}

export const ParticipantLoadingMatrix: React.FC<
  ParticipantLoadingMatrixProps
> = ({
  data,
  factors,
  width = 1000,
  height = 600,
  significanceThreshold = 0.4,
  colorScheme = 'diverging',
  sortBy = 'definingFactor',
  showStats = true,
}) => {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'matrix' | 'bars' | 'scatter'>(
    'matrix'
  );
  const [highlightSignificant, setHighlightSignificant] = useState(true);

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{
    participant: string;
    factor: string;
    loading: number;
    isSignificant: boolean;
    isDefining: boolean;
    communality: number;
  }>();

  // Chart dimensions
  const margin = { top: 100, right: 40, bottom: 80, left: 120 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Sort participants
  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'definingFactor':
        const aDefining = a.definingFactor || 'Z';
        const bDefining = b.definingFactor || 'Z';
        if (aDefining !== bDefining) return aDefining.localeCompare(bDefining);
        return (b.loadings[aDefining] || 0) - (a.loadings[bDefining] || 0); // Secondary sort by loading strength
      case 'communality':
        return b.communality - a.communality;
      case 'reliability':
        return b.reliability - a.reliability;
      default:
        return a.participant.localeCompare(b.participant);
    }
  });

  // Get loading extent for color scale
  const allLoadings = data.flatMap(d => Object.values(d.loadings));
  const loadingExtent = [Math.min(...allLoadings), Math.max(...allLoadings)];

  // Scales
  const xScale = scaleBand({
    domain: factors,
    range: [0, innerWidth],
    padding: 0.05,
  });

  const yScale = scaleBand({
    domain: sortedData.map((d: any) => d.participant),
    range: [0, innerHeight],
    padding: 0.05,
  });

  // Color scales
  const getColorScale = () => {
    switch (colorScheme) {
      case 'viridis':
        return scaleSequential(interpolateViridis).domain(loadingExtent);
      case 'spectral':
        return scaleSequential(interpolateSpectral).domain(loadingExtent);
      default:
        return scaleSequential(interpolateRdBu).domain(loadingExtent);
    }
  };

  const colorScale = getColorScale();

  // Statistics
  const stats = {
    totalParticipants: data.length,
    flaggedParticipants: data.filter((d: any) => d.flagged).length,
    meanCommunality:
      data.reduce((sum, d) => sum + d.communality, 0) / data.length,
    meanReliability:
      data.reduce((sum, d) => sum + d.reliability, 0) / data.length,
    factorCounts: factors.reduce(
      (acc, factor) => ({
        ...acc,
        [factor]: data.filter((d: any) => d.definingFactor === factor).length,
      }),
      {} as { [key: string]: number }
    ),
  };

  const renderMatrixView = () => (
    <Group>
      {sortedData.map((participant, i) => (
        <Group
          key={participant.participant}
          top={yScale(participant.participant) || 0}
        >
          {factors.map((factor, j) => {
            const loading = participant.loadings[factor] || 0;
            const cellX = xScale(factor) || 0;
            const cellWidth = xScale.bandwidth();
            const cellHeight = yScale.bandwidth();
            const isSignificant = Math.abs(loading) >= significanceThreshold;
            const isDefining = participant.definingFactor === factor;
            const isHighlighted =
              (!selectedFactor || selectedFactor === factor) &&
              (!selectedParticipant ||
                selectedParticipant === participant.participant);

            return (
              <motion.g
                key={`${participant.participant}-${factor}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: isHighlighted ? 1 : 0.3,
                  scale: 1,
                }}
                transition={{
                  delay: (i * factors.length + j) * 0.001,
                  duration: 0.3,
                }}
              >
                {/* Cell background */}
                <rect
                  x={cellX}
                  y={0}
                  width={cellWidth}
                  height={cellHeight}
                  fill={colorScale(loading)}
                  stroke={isDefining ? '#000' : 'rgba(255, 255, 255, 0.5)'}
                  strokeWidth={isDefining ? 3 : 0.5}
                  rx={2}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => {
                    showTooltip({
                      tooltipData: {
                        participant: participant.participant,
                        factor,
                        loading,
                        isSignificant,
                        isDefining,
                        communality: participant.communality,
                      },
                      tooltipLeft: cellX + cellWidth / 2 + margin.left,
                      tooltipTop:
                        yScale(participant.participant)! +
                        cellHeight / 2 +
                        margin.top,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                  onClick={() => {
                    setSelectedFactor(
                      selectedFactor === factor ? null : factor
                    );
                    setSelectedParticipant(
                      selectedParticipant === participant.participant
                        ? null
                        : participant.participant
                    );
                  }}
                />

                {/* Loading value text */}
                <text
                  x={cellX + cellWidth / 2}
                  y={cellHeight / 2}
                  fontSize={isHighlighted ? 10 : 8}
                  fontWeight={isSignificant ? '700' : '500'}
                  fill={Math.abs(loading) > 0.6 ? 'white' : '#333'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="-apple-system"
                  pointerEvents="none"
                >
                  {loading.toFixed(2)}
                </text>

                {/* Significance indicator */}
                {isSignificant && highlightSignificant && (
                  <circle
                    cx={cellX + cellWidth - 8}
                    cy={6}
                    r={3}
                    fill="#FF9500"
                    stroke="white"
                    strokeWidth={1}
                  />
                )}

                {/* Flagged indicator */}
                {participant.flagged && (
                  <rect
                    x={cellX + 2}
                    y={2}
                    width={4}
                    height={4}
                    fill="#FF3B30"
                    rx={1}
                  />
                )}
              </motion.g>
            );
          })}
        </Group>
      ))}
    </Group>
  );

  const renderBarsView = () => {
    const selectedData = selectedFactor
      ? sortedData.map((d: any) => ({
          participant: d.participant,
          loading: d.loadings[selectedFactor] || 0,
          communality: d.communality,
        }))
      : [];

    if (!selectedFactor) {
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
            Select a factor to view bar chart
          </text>
        </Group>
      );
    }

    const barXScale = scaleLinear({
      domain: [-1, 1],
      range: [0, innerWidth],
    });

    return (
      <Group>
        {selectedData.map((item, index) => {
          const barY = yScale(item.participant) || 0;
          const barHeight = yScale.bandwidth();
          const barX =
            item.loading >= 0 ? barXScale(0) : barXScale(item.loading);
          const barWidth = Math.abs(barXScale(item.loading) - barXScale(0));
          const isSignificant = Math.abs(item.loading) >= significanceThreshold;

          return (
            <motion.g
              key={item.participant}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: index * 0.02, duration: 0.4 }}
              style={{
                transformOrigin: `${barXScale(0)}px ${barY + barHeight / 2}px`,
              }}
            >
              <rect
                x={barX}
                y={barY + 2}
                width={barWidth}
                height={barHeight - 4}
                fill={item.loading >= 0 ? '#007AFF' : '#FF3B30'}
                opacity={isSignificant ? 0.8 : 0.4}
                rx={4}
              />
              <text
                x={barXScale(item.loading) + (item.loading >= 0 ? 5 : -5)}
                y={barY + barHeight / 2}
                fontSize={9}
                fontWeight="600"
                fill="#333"
                textAnchor={item.loading >= 0 ? 'start' : 'end'}
                dominantBaseline="middle"
                fontFamily="-apple-system"
              >
                {item.loading.toFixed(3)}
              </text>
            </motion.g>
          );
        })}

        {/* Zero line */}
        <line
          x1={barXScale(0)}
          x2={barXScale(0)}
          y1={0}
          y2={innerHeight}
          stroke="#333"
          strokeWidth={2}
        />

        {/* Significance thresholds */}
        <line
          x1={barXScale(significanceThreshold)}
          x2={barXScale(significanceThreshold)}
          y1={0}
          y2={innerHeight}
          stroke="#FF9500"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.7}
        />
        <line
          x1={barXScale(-significanceThreshold)}
          x2={barXScale(-significanceThreshold)}
          y1={0}
          y2={innerHeight}
          stroke="#FF9500"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.7}
        />
      </Group>
    );
  };

  const renderScatterView = () => {
    if (factors.length < 2) return null;

    const factor1 = selectedFactor || factors[0];
    const factor2 = factors.find(f => f !== factor1) || factors[1];

    const scatterXScale = scaleLinear({
      domain: [-1, 1],
      range: [0, innerWidth],
    });

    const scatterYScale = scaleLinear({
      domain: [-1, 1],
      range: [innerHeight, 0],
    });

    return (
      <Group>
        {/* Grid */}
        <line
          x1={0}
          x2={innerWidth}
          y1={scatterYScale(0)}
          y2={scatterYScale(0)}
          stroke="#ddd"
          strokeWidth={1}
        />
        <line
          x1={scatterXScale(0)}
          x2={scatterXScale(0)}
          y1={0}
          y2={innerHeight}
          stroke="#ddd"
          strokeWidth={1}
        />

        {/* Significance threshold circles */}
        <circle
          cx={scatterXScale(0)}
          cy={scatterYScale(0)}
          r={Math.abs(scatterXScale(significanceThreshold) - scatterXScale(0))}
          fill="none"
          stroke="#FF9500"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />

        {/* Data points */}
        {sortedData.map((participant, index) => {
          const x1Loading = (factor1 && participant.loadings[factor1]) || 0;
          const x2Loading = (factor2 && participant.loadings[factor2]) || 0;
          const px = scatterXScale(x1Loading) || 0;
          const py = scatterYScale(x2Loading) || 0;
          const isDefining1 = participant.definingFactor === factor1;
          const isDefining2 = participant.definingFactor === factor2;
          const isSignificant =
            Math.abs(x1Loading) >= significanceThreshold ||
            Math.abs(x2Loading) >= significanceThreshold;

          return (
            <motion.g
              key={participant.participant}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.4 }}
            >
              <circle
                cx={px}
                cy={py}
                r={4 + participant.communality * 4}
                fill={
                  isDefining1 ? '#007AFF' : isDefining2 ? '#34C759' : '#8E8E93'
                }
                stroke={isSignificant ? 'white' : 'none'}
                strokeWidth={2}
                opacity={0.8}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => {
                  showTooltip({
                    tooltipData: {
                      participant: participant.participant,
                      factor: `${factor1}×${factor2}`,
                      loading: Math.sqrt(x1Loading ** 2 + x2Loading ** 2),
                      isSignificant,
                      isDefining: isDefining1 || isDefining2,
                      communality: participant.communality,
                    },
                    tooltipLeft: px + margin.left,
                    tooltipTop: py + margin.top,
                  });
                }}
                onMouseLeave={hideTooltip}
              />
              <text
                x={px}
                y={py - 10}
                fontSize={8}
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

        {/* Axis labels */}
        <text
          x={innerWidth / 2}
          y={innerHeight + 30}
          fontSize={12}
          fontWeight="600"
          fill="#333"
          textAnchor="middle"
          fontFamily="-apple-system"
        >
          {factor1}
        </text>
        <text
          x={-40}
          y={innerHeight / 2}
          fontSize={12}
          fontWeight="600"
          fill="#333"
          textAnchor="middle"
          fontFamily="-apple-system"
          transform={`rotate(-90, -40, ${innerHeight / 2})`}
        >
          {factor2}
        </text>
      </Group>
    );
  };

  return (
    <>
      <BaseChart
        width={width}
        height={height}
        margin={margin}
        title="Participant-Factor Loading Matrix"
        subtitle={`${stats.totalParticipants} participants × ${factors.length} factors`}
      >
        {/* Control panel */}
        <Group top={-80}>
          {/* View mode selector */}
          {['matrix', 'bars', 'scatter'].map((mode, i) => (
            <motion.g
              key={mode}
              transform={`translate(${i * 80}, 0)`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <rect
                x={0}
                y={0}
                width={70}
                height={30}
                fill={
                  viewMode === mode ? '#007AFF' : 'rgba(255, 255, 255, 0.8)'
                }
                stroke="#007AFF"
                strokeWidth={1}
                rx={8}
                style={{ cursor: 'pointer' }}
                onClick={() => setViewMode(mode as any)}
              />
              <text
                x={35}
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

          {/* Color scheme selector */}
          <Group left={260}>
            {['diverging', 'viridis', 'spectral'].map((scheme, i) => (
              <motion.g
                key={scheme}
                transform={`translate(${i * 80}, 0)`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <rect
                  x={0}
                  y={0}
                  width={75}
                  height={30}
                  fill={
                    colorScheme === scheme
                      ? '#34C759'
                      : 'rgba(255, 255, 255, 0.8)'
                  }
                  stroke="#34C759"
                  strokeWidth={1}
                  rx={8}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setViewMode('matrix')} // Reset to matrix for color change
                />
                <text
                  x={37}
                  y={20}
                  fontSize={10}
                  fontWeight="600"
                  fill={colorScheme === scheme ? 'white' : '#34C759'}
                  textAnchor="middle"
                  fontFamily="-apple-system"
                  pointerEvents="none"
                >
                  {scheme}
                </text>
              </motion.g>
            ))}
          </Group>

          {/* Toggle buttons */}
          <Group left={520}>
            <motion.g whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <rect
                x={0}
                y={0}
                width={120}
                height={30}
                fill={
                  highlightSignificant ? '#FF9500' : 'rgba(255, 255, 255, 0.8)'
                }
                stroke="#FF9500"
                strokeWidth={1}
                rx={8}
                style={{ cursor: 'pointer' }}
                onClick={() => setHighlightSignificant(!highlightSignificant)}
              />
              <text
                x={60}
                y={20}
                fontSize={10}
                fontWeight="600"
                fill={highlightSignificant ? 'white' : '#FF9500'}
                textAnchor="middle"
                fontFamily="-apple-system"
                pointerEvents="none"
              >
                Highlight Sig.
              </text>
            </motion.g>
          </Group>
        </Group>

        {/* Factor selector for bars/scatter view */}
        {(viewMode === 'bars' || viewMode === 'scatter') && (
          <Group top={-50}>
            <text
              x={0}
              y={0}
              fontSize={12}
              fontWeight="600"
              fontFamily="-apple-system"
              fill="#333"
            >
              Select Factor:
            </text>
            {factors.map((factor, i) => (
              <motion.g
                key={factor}
                transform={`translate(${120 + i * 60}, 0)`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <rect
                  x={0}
                  y={-15}
                  width={50}
                  height={25}
                  fill={
                    selectedFactor === factor
                      ? '#5856D6'
                      : 'rgba(255, 255, 255, 0.8)'
                  }
                  stroke="#5856D6"
                  strokeWidth={1}
                  rx={6}
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setSelectedFactor(selectedFactor === factor ? null : factor)
                  }
                />
                <text
                  x={25}
                  y={2}
                  fontSize={11}
                  fontWeight="600"
                  fill={selectedFactor === factor ? 'white' : '#5856D6'}
                  textAnchor="middle"
                  fontFamily="-apple-system"
                  pointerEvents="none"
                >
                  {factor}
                </text>
              </motion.g>
            ))}
          </Group>
        )}

        {/* Axes */}
        {viewMode === 'matrix' && (
          <>
            <AxisTop
              scale={xScale}
              tickLabelProps={() => ({
                fontSize: 12,
                fontFamily: '-apple-system',
                textAnchor: 'middle',
                fontWeight: '600',
              })}
            />
            <AxisLeft
              scale={yScale}
              tickLabelProps={() => ({
                fontSize: 9,
                fontFamily: '-apple-system',
                textAnchor: 'end',
              })}
            />
          </>
        )}

        {viewMode === 'bars' && (
          <AxisLeft
            scale={yScale}
            tickLabelProps={() => ({
              fontSize: 9,
              fontFamily: '-apple-system',
              textAnchor: 'end',
            })}
          />
        )}

        {/* Main visualization */}
        <AnimatePresence mode="wait">
          <motion.g
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'matrix' && renderMatrixView()}
            {viewMode === 'bars' && renderBarsView()}
            {viewMode === 'scatter' && renderScatterView()}
          </motion.g>
        </AnimatePresence>

        {/* Color legend for matrix view */}
        {viewMode === 'matrix' && (
          <Group top={innerHeight + 20}>
            <defs>
              <linearGradient
                id="matrixColorLegend"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                {Array.from({ length: 21 }, (_, i) => {
                  const value =
                    (loadingExtent[0] || -1) +
                    (i / 20) *
                      ((loadingExtent[1] || 1) - (loadingExtent[0] || -1));
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

            <rect
              x={innerWidth / 2 - 150}
              y={0}
              width={300}
              height={15}
              fill="url(#matrixColorLegend)"
              stroke="rgba(0, 0, 0, 0.1)"
              strokeWidth={1}
              rx={2}
            />
            <text
              x={innerWidth / 2 - 160}
              y={10}
              fontSize={10}
              fontFamily="-apple-system"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {(loadingExtent[0] || -1).toFixed(2)}
            </text>
            <text
              x={innerWidth / 2 + 160}
              y={10}
              fontSize={10}
              fontFamily="-apple-system"
              textAnchor="start"
              dominantBaseline="middle"
            >
              {(loadingExtent[1] || 1).toFixed(2)}
            </text>
            <text
              x={innerWidth / 2}
              y={30}
              fontSize={11}
              fontWeight="600"
              fontFamily="-apple-system"
              textAnchor="middle"
              fill="#333"
            >
              Factor Loading
            </text>
          </Group>
        )}

        {/* Statistics panel */}
        {showStats && (
          <Group top={20} left={innerWidth - 180}>
            <rect
              x={-10}
              y={-10}
              width={190}
              height={120}
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
              Matrix Statistics
            </text>
            <text
              x={0}
              y={22}
              fontSize={10}
              fontFamily="-apple-system"
              fill="#666"
            >
              Participants: {stats.totalParticipants}
            </text>
            <text
              x={0}
              y={36}
              fontSize={10}
              fontFamily="-apple-system"
              fill="#666"
            >
              Flagged: {stats.flaggedParticipants}
            </text>
            <text
              x={0}
              y={50}
              fontSize={10}
              fontFamily="-apple-system"
              fill="#666"
            >
              Mean Communality: {stats.meanCommunality.toFixed(3)}
            </text>
            <text
              x={0}
              y={64}
              fontSize={10}
              fontFamily="-apple-system"
              fill="#666"
            >
              Mean Reliability: {stats.meanReliability.toFixed(3)}
            </text>
            <text
              x={0}
              y={82}
              fontSize={11}
              fontWeight="600"
              fontFamily="-apple-system"
              fill="#333"
            >
              Factor Definitions:
            </text>
            {factors.slice(0, 3).map((factor, i) => (
              <text
                key={factor}
                x={0}
                y={96 + i * 12}
                fontSize={9}
                fontFamily="-apple-system"
                fill="#666"
              >
                {factor}: {stats.factorCounts[factor] || 0} participants
              </text>
            ))}
          </Group>
        )}
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
                {tooltipData.factor}:{' '}
                <span
                  style={{
                    fontWeight: '600',
                    color: tooltipData.loading > 0 ? '#007AFF' : '#FF3B30',
                  }}
                >
                  {tooltipData.loading.toFixed(3)}
                </span>
              </div>
              <div
                style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}
              >
                <div>
                  {tooltipData.isSignificant ? '✓' : '✗'} Significant loading
                </div>
                <div>
                  {tooltipData.isDefining ? '⭐' : ''}{' '}
                  {tooltipData.isDefining ? 'Defining factor' : ''}
                </div>
                <div>Communality: {tooltipData.communality.toFixed(3)}</div>
              </div>
            </div>
          </TooltipWithBounds>
        )}
    </>
  );
};
