
export interface GroundingMetadata {
  groundingChunks?: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
}

export interface AnalysisResponse {
  text: string;
  sources: Array<{ title: string; uri: string }>;
}
