import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  growthPlan: string[];
  contentIdeas: {
    title: string;
    hook: string;
    description: string;
  }[];
}

export async function getAIRecommendations(profileData: any): Promise<AIInsights> {
  const prompt = `
    En tant qu'expert TikTok, analyse ce profil et donne des recommandations stratégiques.
    
    Données du profil:
    - Nom: ${profileData.profile.nickname}
    - Bio: ${profileData.profile.bio}
    - Followers: ${profileData.stats.followers}
    - Engagement: ${profileData.stats.engagementRate}%
    - Tops Hashtags: ${profileData.topHashtags?.map((t: any) => t.tag).join(', ')}
    - Vidéos récentes (descriptions): ${profileData.videos?.slice(0, 5).map((v: any) => v.desc).join(' | ')}
    
    Répond au format JSON suivant:
    {
      "summary": "Résumé de la performance actuelle",
      "strengths": ["Force 1", "Force 2"],
      "weaknesses": ["Point à améliorer 1", "Point à améliorer 2"],
      "growthPlan": ["Action 1", "Action 2", "Action 3"],
      "contentIdeas": [
        {
          "title": "Titre de l'idée",
          "hook": "L'accroche (hook) pour les 3 premières secondes",
          "description": "Description du concept de la vidéo"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentIdeas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hook: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Impossible de générer les recommandations IA pour le moment.");
  }
}
