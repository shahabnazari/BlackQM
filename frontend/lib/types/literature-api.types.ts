/**
 * NETFLIX-GRADE TypeScript Types for Literature API Service
 *
 * Strict type definitions for all API responses - NO `any` types allowed.
 * Phase 10.102: Enterprise Production-Ready Implementation
 * Phase 10.106: Removed unused Paper import
 */

/**
 * Research Gap Analysis Result
 */
export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  field: string;
  severity: 'high' | 'medium' | 'low';
  evidence: string[];
  relatedPapers: string[];
  opportunities: string[];
  confidence: number; // 0-1
}

/**
 * Knowledge Graph Node Properties
 */
export interface KnowledgeGraphNodeProperties {
  [key: string]: string | number | boolean | string[] | undefined;
}

/**
 * Knowledge Graph Node
 */
export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'paper' | 'author' | 'concept' | 'method' | 'theme';
  properties: KnowledgeGraphNodeProperties;
}

/**
 * Knowledge Graph Edge
 */
export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by' | 'related' | 'contradicts';
  weight?: number;
  confidence?: number;
}

/**
 * Knowledge Graph Data Structure
 */
export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

/**
 * Knowledge Graph Insights
 */
export interface KnowledgeGraphInsights {
  bridgeConcepts: BridgeConcept[];
  controversies: Controversy[];
  emergingTopics: EmergingTopic[];
}

/**
 * Bridge Concept
 */
export interface BridgeConcept {
  id: string;
  label: string;
  connects: string[];
  strength: number;
  evidence: string[];
}

/**
 * Controversy
 */
export interface Controversy {
  id: string;
  topic: string;
  opposingViews: Array<{
    view: string;
    evidence: string[];
    papers: string[];
  }>;
  intensity: number;
}

/**
 * Emerging Topic
 */
export interface EmergingTopic {
  id: string;
  label: string;
  growthRate: number;
  papers: string[];
  firstAppearance: number; // year
  recentActivity: number; // count
}

/**
 * Influence Flow
 */
export interface InfluenceFlow {
  from: string;
  to: string;
  strength: number;
  type: 'citation' | 'concept' | 'method';
  evidence: string[];
}

/**
 * Predicted Link
 */
export interface PredictedLink {
  source: string;
  target: string;
  confidence: number;
  reason: string;
  predictedYear?: number;
}

/**
 * Research Opportunity
 */
export interface ResearchOpportunity {
  id: string;
  title: string;
  description: string;
  field: string;
  potentialImpact: 'high' | 'medium' | 'low';
  feasibility: 'high' | 'medium' | 'low';
  relatedGaps: string[];
  suggestedMethods: string[];
  estimatedDuration: string;
  requiredResources: string[];
}

/**
 * Funding Opportunity
 */
export interface FundingOpportunity {
  id: string;
  title: string;
  organization: string;
  amount: string;
  deadline: string;
  eligibility: string[];
  matchScore: number; // 0-1
  applicationUrl?: string;
}

/**
 * Timeline Prediction
 */
export interface TimelinePrediction {
  event: string;
  predictedDate: string;
  confidence: number;
  factors: string[];
  alternativeScenarios: Array<{
    scenario: string;
    probability: number;
    date: string;
  }>;
}

/**
 * Transformative Opportunity
 */
export interface TransformativeOpportunity {
  id: string;
  title: string;
  description: string;
  transformativePotential: number; // 0-1
  timeToImpact: string;
  requiredBreakthroughs: string[];
  relatedFields: string[];
}

/**
 * Forecast
 */
export interface Forecast {
  topic: string;
  prediction: string;
  timeframe: string;
  confidence: number;
  supportingEvidence: string[];
  alternativeOutcomes: string[];
}

/**
 * Declining Topic
 */
export interface DecliningTopic {
  id: string;
  label: string;
  declineRate: number;
  peakYear: number;
  currentActivity: number;
  reasons: string[];
}

/**
 * Social Media Post
 */
export interface SocialMediaPost {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'reddit';
  content: string;
  author: string;
  timestamp: string;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

/**
 * Social Media Insights
 */
export interface SocialMediaInsights {
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  trendingThemes: Array<{
    theme: string;
    mentionCount: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  keyInfluencers: Array<{
    username: string;
    platform: string;
    followerCount: number;
    relevanceScore: number;
  }>;
  engagementMetrics: {
    totalEngagement: number;
    averageEngagement: number;
    peakEngagementTime: string;
  };
}

/**
 * Video Transcript Citation
 */
export interface TranscriptCitation {
  id: string;
  paperId: string;
  paperTitle: string;
  context: string;
  timestamp: number; // seconds
  confidence: number;
}

/**
 * YouTube Channel
 */
export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl?: string;
  customUrl?: string;
}

/**
 * YouTube Video
 */
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

/**
 * YouTube Search Response
 */
export interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  hasMore: boolean;
}

/**
 * YouTube Search with Transcription Response
 */
export interface YouTubeSearchWithTranscriptionResponse {
  videos: YouTubeVideo[];
  transcripts?: Array<{
    videoId: string;
    transcriptId: string;
    status: 'pending' | 'completed' | 'failed';
  }>;
  themes?: Array<{
    videoId: string;
    themes: string[];
  }>;
}

/**
 * Transcription Response
 */
export interface TranscriptionResponse {
  transcriptId: string;
  sourceId: string;
  sourceType: 'youtube' | 'podcast';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  duration?: number;
  wordCount?: number;
  estimatedCost?: number;
}

/**
 * Theme Extraction from Transcript Response
 */
export interface ThemeExtractionFromTranscriptResponse {
  transcriptId: string;
  themes: Array<{
    theme: string;
    confidence: number;
    evidence: string[];
  }>;
  researchContext?: string;
}

/**
 * Knowledge Graph Build Response
 */
export interface KnowledgeGraphBuildResponse {
  success: boolean;
  graph: KnowledgeGraphData;
  metrics: {
    entitiesExtracted: number;
    citationsCreated: number;
    bridgeConceptsFound: number;
    controversiesDetected: number;
    emergingTopicsFound: number;
    processingTimeMs: number;
  };
  insights: KnowledgeGraphInsights;
}

/**
 * Knowledge Graph Get Response
 */
export interface KnowledgeGraphGetResponse {
  success: boolean;
  graph: KnowledgeGraphData;
  stats: {
    nodeCount: number;
    edgeCount: number;
    bridgeConcepts: number;
    emergingTopics: number;
  };
}

/**
 * Future Trends Response
 */
export interface FutureTrendsResponse {
  influenceFlows: InfluenceFlow[];
  predictedLinks: PredictedLink[];
  opportunities: ResearchOpportunity[];
  topOpportunities: ResearchOpportunity[];
}

/**
 * Funding Opportunities Response
 */
export interface FundingOpportunitiesResponse {
  fundingOpportunities: FundingOpportunity[];
  highProbability: FundingOpportunity[];
  matchScores: Record<string, number>;
}

/**
 * Timeline Predictions Response
 */
export interface TimelinePredictionsResponse {
  timelines: TimelinePrediction[];
  keyMilestones: Array<{
    milestone: string;
    date: string;
    confidence: number;
  }>;
}

/**
 * Transformative Opportunities Response
 */
export interface TransformativeOpportunitiesResponse {
  predictions: Array<{
    opportunity: string;
    timeframe: string;
    impact: number;
  }>;
  transformativeOpportunities: TransformativeOpportunity[];
}

/**
 * Forecasts Response
 */
export interface ForecastsResponse {
  forecasts: Forecast[];
  emergingTopics: EmergingTopic[];
  decliningTopics: DecliningTopic[];
}

