export type UsageStats = {
  totalTokens: number;
  cost: number;
};

export type UsageData = {
  daily: UsageStats | null;
  total: UsageStats | null;
  error?: string;
};

export type CcusageResponse = {
  totals?: {
    totalTokens: number;
    totalCost: number;
  };
  daily?: Array<{
    totalTokens: number;
    totalCost: number;
  }>;
};
