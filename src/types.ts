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
    };
  };
  insights: string[];
}
