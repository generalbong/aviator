
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AIInsight {
  sentiment: string;
  recommendation: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export const getAIStrategyInsight = async (history: number[]): Promise<AIInsight> => {
  try {
    const historyString = history.slice(0, 10).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this aviator game history: [${historyString}]. 
      Provide a playful "AI Strategy Insight" for a simulation. 
      Do not give real financial advice. 
      Include a sentiment, a recommendation, and a risk level.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            riskLevel: { 
              type: Type.STRING,
              description: "One of: Low, Medium, High"
            }
          },
          required: ["sentiment", "recommendation", "riskLevel"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      sentiment: "The data is hazy.",
      recommendation: "Trust your gut, pilot!",
      riskLevel: "Medium"
    };
  }
};
