export interface TikTokStats {
  followers: number;
  following: number;
  likes: number;
  videos: number;
  engagementRate: number;
}

export interface TikTokProfile {
  nickname: string;
  bio: string;
  avatar: string;
}

export interface TikTokVideo {
  id: string;
  desc: string;
  cover: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createTime: number;
  duration?: number;
  music?: {
    title: string;
    author: string;
  };
}

export interface ChartDataPoint {
  date: string;
  views: number;
  likes: number;
}

export interface TopHashtag {
  tag: string;
  count: number;
  avgViews?: number;
}

export interface AnalysisResult {
  data: {
    username?: string;
    stats: TikTokStats;
    profile: TikTokProfile;
    videos: TikTokVideo[];
    chartData: ChartDataPoint[];
    topHashtags: TopHashtag[];
    averageDuration?: number;
    bestVideo?: TikTokVideo;
    shareRate?: number;
    commentRate?: number;
    postFrequency?: string;
    estimatedRevenue?: number;
    brandDealRevenue?: number;
    viralityScore?: number;
    dominantKeywords?: TopHashtag[];
    bestPostTime?: string;
    audienceInterests?: string[];
    audienceLoyalty?: number;
    audit?: {
      hasLink: boolean;
      hasAvatar: boolean;
      hasKeywords: boolean;
      grades: {
        virality: string;
        community: string;
        growth: string;
      };
      retention: {
        estimatedWatchTime: number;
        dropOffPoint: string;
        viralComparison: string;
      };
    };
    benchmark?: {
      niche: string;
      competitorAverages: {
        views: number;
        engagement: number;
        postFrequency: string;
      };
      strengths: string[];
      weaknesses: string[];
      nicheTrends: string[];
    };
    contentGenerator?: {
      ideas: {
        title: string;
        hook: string;
        script: string;
        cta: string;
        format: string;
      }[];
    };
    aiInsights?: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
      growthPlan: string[];
      contentIdeas: {
        title: string;
        hook: string;
        description: string;
      }[];
      isGenerated: boolean;
    };
  };
  insights: string[];
}
