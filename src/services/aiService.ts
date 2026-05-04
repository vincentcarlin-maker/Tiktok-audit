import { GoogleGenAI, Type } from "@google/genai";

let _ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Clé API Gemini manquante. Veuillez l'ajouter dans les paramètres de l'application (Variables d'environnement) avec le nom GEMINI_API_KEY.");
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

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
  const ai = getAiClient();
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
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('API key')) {
      throw new Error("Clé API Gemini manquante ou invalide. Vérifiez vos paramètres.");
    }
    throw new Error(`Erreur IA : ${error.message || "Impossible de générer les recommandations"}`);
  }
}
