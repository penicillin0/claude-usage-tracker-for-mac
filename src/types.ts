export interface UsageStats {
  totalTokens: number;
  cost: number;
}

export interface UsageData {
  daily: UsageStats | null;
  total: UsageStats | null;
  error?: string;
}

export interface CcusageResponse {
  totals?: {
    totalTokens: number;
    totalCost: number;
  };
  daily?: Array<{
    totalTokens: number;
    totalCost: number;
  }>;
}
