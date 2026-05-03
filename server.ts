import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
const keyStatusMap: Record<string, { remaining: number; limit: number; lastUsed: number }> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API Route to check keys status
  app.get('/api/keys-status', (req, res) => {
    // Return the status map but with keys partially hidden for security
    const sanitizedStatus = Object.entries(keyStatusMap).map(([key, data]) => ({
      key: key.substring(0, 4) + '...' + key.substring(key.length - 4),
      ...data
    }));
    res.json(sanitizedStatus);
  });

  // API Route to analyze TikTok account
  app.post('/api/analyze', async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    try {
      const isDemo = req.body.demo === true;
      const cleanUsername = username.replace('@', '');
      
      // Support multiple RapidAPI keys for rotation on rate limit (comma separated)
      const rawKeys = process.env.RAPIDAPI_KEY || process.env.VITE_TIKTOK_API_KEY || process.env.TIKTOK_API_KEY || 'b3b8244ea2msh4e2b733bb238abdp116a59jsn2bb022c66151';
      const rapidApiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      let profileData: any = null;
      let source = 'ai-estimation';

      if (!isDemo && rapidApiKeys.length > 0) {
        // Try each key until one works or we run out
        for (let kIndex = 0; kIndex < rapidApiKeys.length; kIndex++) {
          const currentKey = rapidApiKeys[kIndex];
          try {
            console.log(`Trying RapidAPI key #${kIndex + 1}...`);
            
            // We'll try common TikTok APIs in sequence if one returns 403/401
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
              const response = await fetch(endpoint.url, {
                method: 'GET',
                headers: {
                  'x-rapidapi-key': currentKey,
                  'x-rapidapi-host': endpoint.host
                }
              });

              // Capture Quota Headers
              const remainingVal = response.headers.get('x-ratelimit-requests-remaining');
              const limitVal = response.headers.get('x-ratelimit-requests-limit');
              if (remainingVal !== null) {
                keyStatusMap[currentKey] = {
                  remaining: parseInt(remainingVal),
                  limit: parseInt(limitVal || '0'),
                  lastUsed: Date.now()
                };
              }

              if (response.status === 403 || response.status === 401) {
                console.log(`Key #${kIndex+1} not authorized for ${endpoint.host}, trying next API...`);
                continue;
              }

              if (response.ok) {
                const data = await response.json();
                // Normalize data structure between different APIs
                const userInfo = data.userInfo || data.user || data;
                if (userInfo) {
                  const info = userInfo;
                  const stats = info.statsV2 || info.stats || info.user?.stats || {};
                  const user = info.user || info;
                  const secUid = user.secUid || user.user_id;

                  let videos: any[] = [];
                  let chartData: any[] = [];
                  let engagementRate = 5.5;

                  if (secUid) {
                    try {
                      const postsRes = await fetch(endpoint.postsUrl(secUid), {
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

                  // ... same logic for rates and hashtags ...
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
                      const tags = v.desc.match(/#[\p{L}\d_]+/gu) || [];
                      tags.forEach((t: string) => {
                        const cleanTag = t.replace('#', '').toLowerCase();
                        if (!hashCount[cleanTag]) Object.assign(hashCount, { [cleanTag]: { count: 0, views: 0 } });
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

                  // Audience Insights
                  const interests = liveTopHashtags.map(t => t.tag.charAt(0).toUpperCase() + t.tag.slice(1));
                  const loyalty = Math.min(100, Math.round((commentRate * 10) + (shareRate * 5)));

                  profileData = {
                    username: cleanUsername,
                    stats: {
                      followers: parseInt(stats.followerCount || stats.follower_count) || 0,
                      following: parseInt(stats.followingCount || stats.following_count) || 0,
                      likes: parseInt(stats.heartCount || stats.heart || stats.digg_count) || 0,
                      videos: parseInt(stats.videoCount || stats.video_count) || 0,
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
                    estimatedRevenue, // Fonds créateur
                    brandDealRevenue: parseFloat(((parseInt(stats.followerCount || 0) / 1000) * (engagementRate > 5 ? 15 : 10)).toFixed(2)), // Estimation Partenariats
                    bestPostTime,
                    bestVideo: bestVideoObj,
                    viralityScore: Math.min(100, Math.round((engagementRate * 5) + (videos.length > 0 ? (videos[0].views / 10000) : 0))),
                    audienceInterests: interests.length > 0 ? interests : ['Généraliste', 'Divertissement'],
                    audienceLoyalty: loyalty
                  };
                  source = 'live';
                  break; // Exit endpoints loop
                }
              } else if (response.status === 429) {
                console.error(`Rate limit exceeded for key #${kIndex + 1} on ${endpoint.host}`);
                source = 'rate-limited';
                break; // Exit endpoints loop to try next key
              }
            }

            if (profileData) break; // Exit keys loop if we found data

          } catch (apiError) {
            console.error(`RapidAPI loop error:`, apiError);
          }
        }
      }

      // Fallback: Mock data if RapidAPI fails or is in demo mode
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
            return {
              id: `mock_${i}`,
              desc: `Vidéo TikTok ${6 - i} de @${cleanUsername} #pourtoi #fyp`,
              cover: `https://picsum.photos/seed/${cleanUsername}${i}/300/500`,
              views: views,
              likes: Math.floor(views * 0.068),
              comments: Math.floor(views * 0.01),
              shares: Math.floor(views * 0.005),
              createTime: Date.now() - (i * 86400000),
              duration: Math.floor(Math.random() * 45) + 30,
              music: { title: "Son original", author: cleanUsername }
            };
          }),
          source: 'mock'
        };
      }

      // We still want to return a consistent structure
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
          profileData.topHashtags = [{tag: "pourtoi", count: 6}, {tag: "fyp", count: 6}];
      }

      if (profileData.videos && profileData.videos.length > 0) {
        const best = [...profileData.videos].sort((a,b) => b.views - a.views)[0];
        profileData.bestVideo = best;
        const d = new Date(best.createTime);
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        profileData.bestPostTime = `${days[d.getDay()]} à ${d.getHours()}h`;
      }

      // Return the data
      res.json({
        data: profileData,
        source
      });

    } catch (error: any) {
      console.error('Error analyzing TikTok profile:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
