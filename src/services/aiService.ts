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
    En tant qu'expert TikTok senior spécialisé en croissance virale, analyse ce profil et donne des recommandations stratégiques DÉTAILLÉES.
    
    IMPORTANT: Tu DOIS impérativement remplir TOUTES les sections du JSON. Ne laisse aucune liste vide.
    Fournis au moins 5 points forts (strengths), 5 points faibles (weaknesses), 5 étapes de croissance (growthPlan) et 3 idées de contenu (contentIdeas).
    
    Données du profil:
    - Nom: ${profileData.profile.nickname}
    - Bio: ${profileData.profile.bio}
    - Followers: ${profileData.stats.followers}
    - Engagement Rate: ${profileData.stats.engagementRate}%
    - Tops Hashtags utilisés: ${profileData.topHashtags?.map((t: any) => t.tag).join(', ') || 'Non disponible'}
    - Vidéos récentes (descriptions pour contexte): ${profileData.videos?.slice(0, 10).map((v: any) => v.desc).join(' | ') || 'Non disponible'}
    
    Répond UNIQUEMENT au format JSON structure suivant:
    {
      "summary": "Une analyse globale percutante de 3-4 phrases sur le potentiel du compte.",
      "strengths": ["Analyse précise d'une force", "etc (min 5)"],
      "weaknesses": ["Détection d'un point faible", "etc (min 5)"],
      "growthPlan": ["Action concrète immédiate", "etc (min 5)"],
      "contentIdeas": [
        {
          "title": "Concept accrocheur",
          "hook": "L'accroche exacte",
          "description": "Scénario complet"
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
            summary: { type: Type.STRING, description: "Un résumé détaillé de la stratégie recommandée" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste d'au moins 3 points forts" },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste d'au moins 3 points d'amélioration" },
            growthPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Un plan d'action en 5 étapes concrètes" },
            contentIdeas: {
              type: Type.ARRAY,
              description: "3 idées de vidéos virales",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hook: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "hook", "description"]
              }
            }
          },
          required: ["summary", "strengths", "weaknesses", "growthPlan", "contentIdeas"]
        }
      }
    });

    console.log("Raw AI Response:", response.text);
    const parsed = JSON.parse(response.text);
    return parsed;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('API key')) {
      throw new Error("Clé API Gemini manquante ou invalide. Vérifiez vos paramètres.");
    }
    throw new Error(`Erreur IA : ${error.message || "Impossible de générer les recommandations"}`);
  }
}
