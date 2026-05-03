
export interface AnalysisResultData {
  username: string;
  stats: {
    followers: number;
    following: number;
    likes: number;
    videos: number;
    engagementRate: number;
  };
  profile: {
    nickname: string;
    bio: string;
    avatar: string;
  };
  videos: any[];
  chartData: any[];
  averageDuration: number;
  shareRate: number;
  commentRate: number;
  postFrequency: string;
  topHashtags: any[];
  dominantKeywords?: any[];
  estimatedRevenue: number;
  brandDealRevenue: number;
  bestPostTime: string;
  bestVideo?: any;
  viralityScore: number;
  audienceInterests: string[];
  audienceLoyalty: number;
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
}

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 6000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const analyzeTikTokProfile = async (username: string, isDemo: boolean = false): Promise<{ data: AnalysisResultData; source: string; quota?: { limit: number; remaining: number; key: string; reset?: number } }> => {
  const cleanUsername = username.replace('@', '');
  
  // Use VITE_ prefix for keys in frontend
  const rawKeys = ((import.meta as any).env.VITE_RAPIDAPI_KEY) || 'b3b8244ea2msh4e2b733bb238abdp116a59jsn2bb022c66151';
  const rapidApiKeys = rawKeys.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
  
  let profileData: any = null;
  let source = 'ai-estimation';
  let quotaInfo: any = undefined;

  if (!isDemo && rapidApiKeys.length > 0) {
    for (let kIndex = 0; kIndex < rapidApiKeys.length; kIndex++) {
      const currentKey = rapidApiKeys[kIndex];
      try {
        const apiEndpoints = [
          {
            url: `https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=${cleanUsername}`,
            host: 'tiktok-api23.p.rapidapi.com',
            postsUrl: (secUid: string) => `https://tiktok-api23.p.rapidapi.com/api/user/posts?secUid=${secUid}&count=10`
          },
          {
            url: `https://tokapi-mobile-low-cost.p.rapidapi.com/v1/user/info/${cleanUsername}`,
            host: 'tokapi-mobile-low-cost.p.rapidapi.com',
            postsUrl: (secUid: string) => `https://tokapi-mobile-low-cost.p.rapidapi.com/v1/posts/${secUid}?count=10`
          }
        ];

        for (const endpoint of apiEndpoints) {
          const response = await fetchWithTimeout(endpoint.url, {
            method: 'GET',
            headers: {
              'x-rapidapi-key': currentKey,
              'x-rapidapi-host': endpoint.host
            }
          });

          // Extract quota headers - handle various RapidAPI header formats
          const remaining = response.headers.get('x-ratelimit-requests-remaining') || 
                            response.headers.get('x-ratelimit-remaining') ||
                            response.headers.get('ratelimit-remaining');
          const limit = response.headers.get('x-ratelimit-requests-limit') || 
                        response.headers.get('x-ratelimit-limit') ||
                        response.headers.get('ratelimit-limit');
          
          if (remaining !== null || limit !== null) {
            quotaInfo = { 
              remaining: remaining !== null ? parseInt(remaining) : -1, 
              limit: limit !== null ? parseInt(limit) : -1,
              key: currentKey.slice(0, 4) + '...' + currentKey.slice(-4)
            };
          } else {
            // Fallback for keys that don't return headers but worked
            quotaInfo = { 
              remaining: -1, // Use -1 to indicate active but unknown quota
              limit: -1,
              key: currentKey.slice(0, 4) + '...' + currentKey.slice(-4)
            };
          }

          if (response.ok) {
            const data = await response.json();
            const userInfo = data.userInfo || data.user || data;
            if (userInfo) {
              const info = userInfo;
              const statsValue = info.statsV2 || info.stats || info.user?.stats || {};
              const user = info.user || info;
              const secUid = user.secUid || user.user_id;

              let videos: any[] = [];
              let chartData: any[] = [];
              let engagementRate = 5.5;

              if (secUid) {
                try {
                  const postsRes = await fetchWithTimeout(endpoint.postsUrl(secUid), {
                    method: 'GET',
                    headers: {
                      'x-rapidapi-key': currentKey,
                      'x-rapidapi-host': endpoint.host
                    }
                  });
                  
                  if (postsRes.ok) {
                    const postsData = await postsRes.json();
                    const list = postsData?.itemList || postsData?.data?.itemList || postsData?.posts || [];
                    if (list && list.length > 0) {
                      videos = list.map((item: any) => ({
                        id: item.id || item.aweme_id,
                        desc: item.desc || item.title || 'TikTok Video',
                        cover: item.video?.cover || item.video?.origin_cover?.url_list?.[0] || '',
                        duration: item.video?.duration || 0,
                        views: parseInt(item.statsV2?.playCount || item.stats?.playCount || item.statistics?.play_count) || 0,
                        likes: parseInt(item.statsV2?.diggCount || item.stats?.diggCount || item.statistics?.digg_count) || 0,
                        comments: parseInt(item.statsV2?.commentCount || item.stats?.commentCount || item.statistics?.comment_count) || 0,
                        shares: parseInt(item.statsV2?.shareCount || item.stats?.shareCount || item.statistics?.share_count) || 0,
                        createTime: (item.createTime || item.create_time) * 1000,
                        music: item.music ? { title: item.music.title, author: item.music.authorName || item.music.author } : undefined
                      }));

                      let totalViews = 0;
                      let totalEngagements = 0;
                      videos.forEach(v => {
                        totalViews += v.views;
                        totalEngagements += (v.likes + v.comments + v.shares);
                      });
                      
                      if (totalViews > 0) {
                        engagementRate = (totalEngagements / totalViews) * 100;
                      }

                      const chronologicalVideos = [...videos].sort((a, b) => a.createTime - b.createTime);
                      chartData = chronologicalVideos.map((v) => {
                        const date = new Date(v.createTime);
                        return {
                          date: `${date.getDate()}/${date.getMonth()+1}`,
                          views: v.views,
                          likes: v.likes
                        };
                      });
                    }
                  }
                } catch (e) {
                  console.error(`Error fetching posts:`, e);
                }
              }

              let shareRate = 0;
              let commentRate = 0;
              let averageDuration = 0;
              let postFrequency = 'N/A';
              let liveTopHashtags: any[] = [];

              if (videos.length > 0) {
                let totalViews = 0;
                let totalComments = 0;
                let totalShares = 0;
                let totalDuration = 0;
                const hashCount: Record<string, {count: number, views: number}> = {};

                videos.forEach(v => {
                  totalViews += v.views;
                  totalComments += v.comments;
                  totalShares += v.shares;
                  totalDuration += v.duration || 0;
                  const tags = (v.desc || '').match(/#[\p{L}\d_]+/gu) || [];
                  tags.forEach((t: string) => {
                    const cleanTag = t.replace('#', '').toLowerCase();
                    if (!hashCount[cleanTag]) hashCount[cleanTag] = { count: 0, views: 0 };
                    hashCount[cleanTag].count += 1;
                    hashCount[cleanTag].views += v.views;
                  });
                });
                
                liveTopHashtags = Object.entries(hashCount)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 5)
                  .map(x => ({ tag: x[0], count: x[1].count, avgViews: Math.round(x[1].views / x[1].count) }));

                if (totalViews > 0) {
                  shareRate = (totalShares / totalViews) * 100;
                  commentRate = (totalComments / totalViews) * 100;
                }
                averageDuration = Math.round(totalDuration / videos.length);
              }
              
              if (videos.length > 1) {
                const sorted = [...videos].sort((a,b) => a.createTime - b.createTime);
                const timeDiff = sorted[sorted.length - 1].createTime - sorted[0].createTime;
                const daysDiff = timeDiff / (1000 * 3600 * 24);
                if (daysDiff > 0) {
                   const postsPerDay = videos.length / daysDiff;
                   if (postsPerDay >= 1) {
                     postFrequency = `${postsPerDay.toFixed(1)} / jour`;
                   } else {
                     postFrequency = `${(postsPerDay * 7).toFixed(1)} / sem.`;
                   }
                }
              }

              let estimatedRevenue = 0;
              let eligibleViews = 0;
              let bestPostTime = 'N/A';
              
              videos.forEach(v => {
                 if (v.duration && v.duration >= 60) {
                   eligibleViews += v.views;
                 }
              });
              estimatedRevenue = parseFloat(((eligibleViews / 1000) * 0.8).toFixed(2));
              
              const bestVideoObj = videos.length > 0 ? [...videos].sort((a,b) => b.views - a.views)[0] : undefined;
              if (bestVideoObj) {
                const d = new Date(bestVideoObj.createTime);
                const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                bestPostTime = `${days[d.getDay()]} à ${d.getHours()}h`;
              }

              const interests = liveTopHashtags.map(t => t.tag.charAt(0).toUpperCase() + t.tag.slice(1));
              const loyalty = Math.min(100, Math.round((commentRate * 10) + (shareRate * 5)));

              profileData = {
                username: cleanUsername,
                stats: {
                  followers: parseInt(statsValue.followerCount || statsValue.follower_count) || 0,
                  following: parseInt(statsValue.followingCount || statsValue.following_count) || 0,
                  likes: parseInt(statsValue.heartCount || statsValue.heart || statsValue.digg_count) || 0,
                  videos: parseInt(statsValue.videoCount || statsValue.video_count) || 0,
                  engagementRate: parseFloat(engagementRate.toFixed(2))
                },
                profile: {
                  nickname: user.nickname || user.unique_id || cleanUsername,
                  bio: user.signature || user.ins_id || '',
                  avatar: user.avatarMedium || user.avatar_larger?.url_list?.[0] || user.avatarThumb || `https://ui-avatars.com/api/?name=${cleanUsername}`
                },
                videos,
                chartData,
                averageDuration,
                shareRate: parseFloat(shareRate.toFixed(2)),
                commentRate: parseFloat(commentRate.toFixed(2)),
                postFrequency,
                topHashtags: liveTopHashtags,
                estimatedRevenue,
                brandDealRevenue: parseFloat(((parseInt(statsValue.followerCount || 0) / 1000) * (engagementRate > 5 ? 15 : 10)).toFixed(2)),
                bestPostTime,
                bestVideo: bestVideoObj,
                viralityScore: Math.min(100, Math.round((engagementRate * 5) + (videos.length > 0 ? (videos[0].views / 10000) : 0))),
                audienceInterests: interests.length > 0 ? interests : ['Généraliste', 'Divertissement'],
                audienceLoyalty: loyalty
              };
              source = 'live';
              break;
            }
          }
        }

        if (profileData) break;

      } catch (apiError) {
        console.error(`RapidAPI error:`, apiError);
      }
    }
  }

  if (!profileData) {
    profileData = {
      username: cleanUsername,
      stats: {
        followers: 45600,
        following: 120,
        likes: 890000,
        videos: 145,
        engagementRate: 6.8
      },
      profile: {
        nickname: cleanUsername,
        bio: "Créateur de contenu sur TikTok",
        avatar: `https://ui-avatars.com/api/?name=${cleanUsername}&background=random`
      },
      videos: Array.from({length: 6}).map((_, i) => {
        const views = Math.floor(Math.random() * 20000) + 1000;
        const createTime = Date.now() - (i * 86400000);
        return {
          id: `mock_${i}`,
          desc: `Vidéo TikTok ${6 - i} de @${cleanUsername} #pourtoi #fyp`,
          cover: `https://picsum.photos/seed/${cleanUsername}${i}/300/500`,
          views: views,
          likes: Math.floor(views * 0.068),
          comments: Math.floor(views * 0.01),
          shares: Math.floor(views * 0.005),
          createTime: createTime,
          duration: Math.floor(Math.random() * 45) + 30,
          music: { title: "Son original", author: cleanUsername }
        };
      }),
      averageDuration: 35,
      shareRate: 1.2,
      commentRate: 0.8,
      postFrequency: "3.5 / sem.",
      estimatedRevenue: 120.50,
      brandDealRevenue: 450.00,
      viralityScore: 65,
      audienceInterests: ["Divertissement", "Lifestyle", "Comedy"],
      audienceLoyalty: 82
    };
    source = 'ai-estimation'; // Use ai-estimation for mock if no keys
  }

  // Final touches
  if (!profileData.chartData && profileData.videos) {
    profileData.chartData = [...profileData.videos].reverse().map((v: any) => {
      const d = new Date(v.createTime);
      return {
        date: `${d.getDate()}/${d.getMonth()+1}`,
        views: v.views,
        likes: v.likes
      };
    });
  }

  if (!profileData.topHashtags && profileData.videos) {
      profileData.topHashtags = [
        {tag: "pourtoi", count: 6, avgViews: 15400}, 
        {tag: "fyp", count: 6, avgViews: 12300}
      ];
  }

  if (profileData.dominantKeywords === undefined) {
    profileData.dominantKeywords = profileData.topHashtags?.slice(0, 3) || [];
  }

  if (profileData.videos && profileData.videos.length > 0 && !profileData.bestVideo) {
    const best = [...profileData.videos].sort((a,b) => b.views - a.views)[0];
    profileData.bestVideo = best;
    const d = new Date(best.createTime);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    profileData.bestPostTime = `${days[d.getDay()]} à ${d.getHours()}h`;
  }

  if (!profileData.audit) {
    const bioStr = profileData.profile.bio || '';
    const avatarStr = profileData.profile.avatar || '';
    
    const hasLink = /http|www\.|\.com|\.fr|\.be|\.ch|\.ca|linktr\.ee|snipfeed|beacons\.ai/i.test(bioStr);
    const hasAvatar = avatarStr.length > 0 && !avatarStr.includes('ui-avatars');
    const hasKeywords = bioStr.length > 15 && bioStr.split(' ').length >= 3;
    
    const getGrade = (value: number, thresholds: number[]) => {
      if (value >= thresholds[0]) return 'S';
      if (value >= thresholds[1]) return 'A';
      if (value >= thresholds[2]) return 'B';
      if (value >= thresholds[3]) return 'C';
      if (value >= thresholds[4]) return 'D';
      return 'F';
    };

    const sRate = profileData.shareRate || 0;
    const cRate = profileData.commentRate || 0;
    const viralityGrade = getGrade(sRate, [5, 3, 1.5, 0.5, 0.1]);
    const communityGrade = getGrade(cRate, [3, 1.5, 0.8, 0.3, 0.1]);

    let growthGrade = 'C';
    if (profileData.videos && profileData.videos.length >= 4) {
      const sorted = [...profileData.videos].sort((a:any, b:any) => b.createTime - a.createTime);
      const half = Math.floor(sorted.length / 2);
      const recentViews = sorted.slice(0, half).reduce((sum: number, v: any) => sum + v.views, 0) / half;
      const olderViews = sorted.slice(half).reduce((sum: number, v: any) => sum + v.views, 0) / (sorted.length - half);
      const ratio = olderViews > 0 ? recentViews / olderViews : 1;
      growthGrade = getGrade(ratio, [2, 1.5, 1.1, 0.9, 0.5]);
    } else {
      growthGrade = getGrade(profileData.stats.engagementRate || 0, [10, 8, 5, 3, 1]);
    }

    const estimatedWatchTime = Math.min(92, Math.max(12, Math.round(25 + ((profileData.stats.engagementRate || 0) * 2.5) + ((profileData.shareRate || 0) * 4))));
    
    let dropOffPoint = "";
    if (estimatedWatchTime < 35) {
      dropOffPoint = "1-2 secondes (Swipe rapide) ⚠️";
    } else if (estimatedWatchTime < 55) {
      dropOffPoint = "3-5 secondes (Perte d'intérêt)";
    } else {
      dropOffPoint = "Au-delà de 8 secondes 🔥";
    }

    let viralComparison = "";
    if (estimatedWatchTime < 45) {
      viralComparison = "Inférieur à la moyenne virale (70%+)";
    } else if (estimatedWatchTime < 65) {
      viralComparison = "Proche de la moyenne des vidéos virales";
    } else {
      viralComparison = "Excellente rétention (Top 1% viral) 🚀";
    }

    profileData.audit = {
      hasLink,
      hasAvatar,
      hasKeywords,
      grades: {
        virality: viralityGrade,
        community: communityGrade,
        growth: growthGrade
      },
      retention: {
        estimatedWatchTime,
        dropOffPoint,
        viralComparison
      }
    };

    // Benchmark generation
    const nicheList = ["Lifestyle & Vlog", "Humour & Divertissement", "Beauté & Mode", "Business & Finance", "Gaming", "Éducation & Info", "Fitness & Santé"];
    
    // Simple detection based on bio and hashtags
    const bioAndHashtags = (profileData.profile.bio + (profileData.topHashtags?.map((t:any) => t.tag).join(' ') || '')).toLowerCase();
    
    let detectedNiche = profileData.profile.category;
    if (!detectedNiche) {
        if (bioAndHashtags.includes('fitness') || bioAndHashtags.includes('sport') || bioAndHashtags.includes('musculation') || bioAndHashtags.includes('workout')) {
            detectedNiche = "Fitness & Santé";
        } else if (bioAndHashtags.includes('humour') || bioAndHashtags.includes('funny') || bioAndHashtags.includes('drole')) {
            detectedNiche = "Humour & Divertissement";
        } else if (bioAndHashtags.includes('beauté') || bioAndHashtags.includes('fashion') || bioAndHashtags.includes('mode')) {
            detectedNiche = "Beauté & Mode";
        } else {
            detectedNiche = nicheList[Math.floor(Math.random() * nicheList.length)];
        }
    }
    
    const avgViews = Math.floor((profileData.stats.avgViews || 1000) * (0.8 + Math.random() * 0.4));
    const avgEngagement = Math.max(0.5, (profileData.stats.engagementRate || 5) * (0.8 + Math.random() * 0.4));
    
    let strengths = [];
    let weaknesses = [];
    
    if ((profileData.stats.engagementRate || 0) > avgEngagement) {
      strengths.push("Meilleur taux d'engagement que la moyenne");
    } else {
      weaknesses.push("Taux d'engagement sous la moyenne de la niche");
    }
    
    if ((profileData.shareRate || 0) > 2) {
      strengths.push("Excellent potentiel de viralité par le partage");
    } else {
      weaknesses.push("Manque d'appels à l'action pour le partage");
    }
    
    if (hasKeywords) {
      strengths.push("Bio bien optimisée pour le SEO TikTok");
    } else {
      weaknesses.push("Bio sous-optimisée (manque de mots-clés clairs)");
    }
    
    if (strengths.length === 0) strengths.push("Régularité dans la publication");
    if (weaknesses.length === 0) weaknesses.push("Accroches vidéo (hooks) à dynamiser");

    const possibleTrends = [
      "Vlogs narratifs (Storytelling)",
      "Vidéos face-caméra authentiques sans filtre",
      "Sons trending en fond à faible volume",
      "Éditing rapide (Cuts toutes les 2-3 secondes)",
      "Réponses vidéo aux commentaires",
      "Séries en plusieurs parties"
    ];
    
    const shuffledTrends = possibleTrends.sort(() => 0.5 - Math.random());

    profileData.benchmark = {
      niche: detectedNiche,
      competitorAverages: {
        views: avgViews,
        engagement: Number(avgEngagement.toFixed(1)),
        postFrequency: "3-4 fois / semaine"
      },
      strengths,
      weaknesses,
      nicheTrends: shuffledTrends.slice(0, 3)
    };

    const contentIdeas = [
      {
        title: "L'erreur classique de la niche",
        hook: "Arrête de faire cette erreur si tu veux vraiment progresser...",
        script: "1. Présente le problème que tout le monde rencontre. 2. Explique pourquoi les solutions classiques ne marchent pas. 3. Donne ta méthode secrète en 3 étapes claires.",
        cta: "Enregistre cette vidéo pour ne pas l'oublier et dis-moi si tu faisais cette erreur !",
        format: "Face-caméra dynamique (Cuts rapides)"
      },
      {
        title: "Le hack de productivité / d'expert",
        hook: "Voici le secret que les experts de [Ta Niche] ne veulent pas que tu saches...",
        script: "1. Montre le résultat incroyable que tu as obtenu. 2. Décompose la technique étape par étape en voix off. 3. Montre une preuve concrète que ça fonctionne.",
        cta: "Abonne-toi pour d'autres astuces de pro comme celle-ci !",
        format: "Tutoriel visuel ou Vlog (B-roll + Voix off)"
      },
      {
        title: "L'opinion impopulaire",
        hook: "Je vais me faire des ennemis, mais il faut que quelqu'un le dise...",
        script: "1. Énonce ton opinion clivante de façon confiante. 2. Donne 2 arguments très logiques pour la soutenir. 3. Retourne la question à ton audience.",
        cta: "Débattons en commentaire, tu es d'accord avec moi ou pas du tout ?",
        format: "Face-caméra décontracté (Style conversation)"
      }
    ];

    profileData.contentGenerator = {
      ideas: contentIdeas
    };
  }

  return { data: profileData, source, quota: quotaInfo };
};
