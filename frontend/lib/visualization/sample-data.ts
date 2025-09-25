// Sample data generators for Q-methodology visualizations
import type { 
  ParticipantLoading,
  // ParticipantLoadingMatrixData, // Unused type
  DistributionData,
  DistinguishingStatement,
  ConsensusStatement,
  StatementScore
} from '@/components/visualizations/q-methodology';

/**
 * Generate sample factor loading data for 3D factor space visualization
 */
export function generateSampleFactorLoadings(
  participantCount: number = 20,
  factors: string[] = ['Factor 1', 'Factor 2', 'Factor 3']
): ParticipantLoading[] {
  const participants: ParticipantLoading[] = [];

  for (let i = 0; i < participantCount; i++) {
    const participantId = `P${(i + 1).toString().padStart(2, '0')}`;
    
    // Generate random loadings with some realistic clustering
    const x = (Math.random() - 0.5) * 1.8; // Factor 1 loading
    const y = (Math.random() - 0.5) * 1.8; // Factor 2 loading  
    const z = (Math.random() - 0.5) * 1.8; // Factor 3 loading
    
    // Calculate loading strength (magnitude)
    const loadingStrength = Math.sqrt(x * x + y * y + (z * z || 0));
    
    // Determine defining factor (highest absolute loading)
    const loadings = [
      { factor: factors[0], value: x },
      { factor: factors[1], value: y },
      ...(factors[2] ? [{ factor: factors[2], value: z }] : [])
    ];
    
    const definingFactor = loadings.reduce((prev, curr) => 
      Math.abs(curr.value) > Math.abs(prev.value) ? curr : prev
    ).factor;

    participants.push({
      participant: participantId,
      x,
      y,
      z: factors[2] ? z : undefined,
      loadingStrength,
      definingFactor: loadingStrength > 0.4 ? definingFactor : undefined,
      allLoadings: loadings
    });
  }

  return participants;
}

/**
 * Generate sample Q-sort distribution data
 */
export function generateSampleQSortDistribution(): DistributionData[] {
  const values = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  
  // Create quasi-normal distribution
  const expectedCounts = [2, 3, 5, 8, 10, 8, 5, 3, 2]; // Bell curve
  
  return values.map((value, index) => {
    const count = expectedCounts[index] + Math.floor(Math.random() * 3) - 1;
    return {
      value,
      frequency: count,
      category: `Value ${value}`,
      count,
      expectedCount: expectedCounts[index]
    };
  });
}

/**
 * Generate sample distinguishing statements data
 */
export function generateSampleDistinguishingStatements(
  statementCount: number = 15,
  factors: string[] = ['Factor 1', 'Factor 2', 'Factor 3']
): DistinguishingStatement[] {
  const statements: DistinguishingStatement[] = [];
  
  const sampleTexts = [
    "Technology should be the primary driver of educational innovation",
    "Traditional teaching methods are more effective than modern approaches",
    "Student-centered learning produces better outcomes than teacher-directed instruction",
    "Assessment should focus on practical skills rather than theoretical knowledge",
    "Collaborative learning is more valuable than individual study",
    "Digital literacy is as important as traditional literacy",
    "Standardized testing accurately measures student achievement",
    "Creative thinking should be prioritized over analytical thinking",
    "Experiential learning is more effective than classroom-based learning",
    "Personalized learning paths improve student engagement",
    "Critical thinking skills are more important than content knowledge",
    "Peer feedback is more valuable than teacher feedback",
    "Problem-based learning enhances real-world application",
    "Multicultural education should be integrated into all subjects",
    "Emotional intelligence is as important as academic intelligence"
  ];

  for (let i = 0; i < Math.min(statementCount, sampleTexts.length); i++) {
    const scores: StatementScore[] = factors.map((factor: any) => ({
      statementId: `S${(i + 1).toString().padStart(2, '0')}`,
      factor,
      qSortValue: Math.floor(Math.random() * 9) - 4, // -4 to +4
      zScore: (Math.random() - 0.5) * 6, // Range from -3 to 3
      rank: Math.floor(Math.random() * 40) + 1 // Rank 1-40
    }));

    // Calculate p-value (lower values indicate more distinguishing)
    const pValue = Math.random() * 0.08; // Most will be < 0.05 (significant)
    
    // Create factor scores map
    const factorScores = factors.reduce((acc, factor, idx) => {
      acc[factor] = scores[idx].zScore;
      return acc;
    }, {} as { [factor: string]: number });
    
    statements.push({
      id: `S${(i + 1).toString().padStart(2, '0')}`,
      statement: sampleTexts[i] || '',
      text: sampleTexts[i] || '',
      factors: factorScores,
      scores,
      significance: pValue,
      pValue,
      isDistinguishing: pValue < 0.05,
      isConsensus: false
    });
  }

  return statements.sort((a, b) => a.pValue - b.pValue);
}

/**
 * Generate sample consensus statements data
 */
export function generateSampleConsensusStatements(
  statementCount: number = 12,
  factors: string[] = ['Factor 1', 'Factor 2', 'Factor 3']
): ConsensusStatement[] {
  const statements: ConsensusStatement[] = [];
  
  const consensusTexts = [
    "Education should prepare students for future careers",
    "Teachers need adequate professional development",
    "Safe learning environments are essential for student success",
    "Parents should be involved in their children's education",
    "Basic numeracy and literacy are fundamental skills",
    "Students learn better when they feel supported",
    "Regular feedback improves learning outcomes",
    "Access to educational resources should be equitable",
    "Learning objectives should be clearly communicated",
    "Student wellbeing affects academic performance",
    "Qualified teachers are essential for quality education",
    "Learning should be engaging and meaningful"
  ];

  for (let i = 0; i < Math.min(statementCount, consensusTexts.length); i++) {
    // Generate factor scores with high agreement (low standard deviation)
    const baseScore = (Math.random() - 0.5) * 4; // Central tendency
    const factorScores = factors.map((factor: any) => ({
      factor,
      score: baseScore + (Math.random() - 0.5) * 0.8 // Small variation around base
    }));
    
    const meanZScore = factorScores.reduce((sum, s) => sum + s.score, 0) / factorScores.length;
    const standardDeviation = Math.sqrt(
      factorScores.reduce((sum, s) => sum + Math.pow(s.score - meanZScore, 2), 0) / factorScores.length
    );

    statements.push({
      id: `C${(i + 1).toString().padStart(2, '0')}`,
      statement: consensusTexts[i] || '',
      text: consensusTexts[i] || '',
      consensusScore: 1 - standardDeviation, // Higher score for lower variance
      meanZScore,
      variance: standardDeviation * standardDeviation,
      standardDeviation,
      factorScores,
      isConsensus: standardDeviation < 0.5
    });
  }

  return statements.sort((a, b) => a.standardDeviation - b.standardDeviation);
}

/**
 * Generate comprehensive sample data for all Q-methodology components
 */
export function generateSampleQMethodologyData() {
  const factors = ['Factor 1', 'Factor 2', 'Factor 3'];
  
  return {
    factorLoadings: generateSampleFactorLoadings(25, factors),
    qSortDistribution: generateSampleQSortDistribution(),
    distinguishingStatements: generateSampleDistinguishingStatements(15, factors),
    consensusStatements: generateSampleConsensusStatements(12, factors),
    factors
  };
}