
import { GoogleGenAI, Type } from "@google/genai";
import { LotteryType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPrediction = async (type: LotteryType, userPrompt?: string) => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are a professional lottery analyst and numerology expert. 
    Your task is to generate a set of 'optimized' lottery numbers based on statistical theory (frequency analysis, sum ranges, even/odd distribution).
    While lottery is random, users enjoy the 'AI-driven' logic behind predictions.
    
    Rules for specific matrices:
    - Lotto 6/45: 6 numbers (1-45).
    - Lotto 6/49: 6 numbers (1-49).
    - Powerball: 5 numbers (1-69) and 1 Powerball (1-26).
    - Mega Millions: 5 numbers (1-70) and 1 Mega Ball (1-25).
    
    Return a JSON object only.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `Generate a prediction for ${type}. ${userPrompt ? `User Context: ${userPrompt}` : ""}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          numbers: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "Main sequence numbers."
          },
          specialNumber: {
            type: Type.INTEGER,
            description: "Special ball if applicable (Powerball, Mega Ball)."
          },
          analysis: {
            type: Type.STRING,
            description: "A detailed 2-3 sentence technical justification for these numbers."
          },
          stats: {
            type: Type.OBJECT,
            properties: {
              hotScore: { type: Type.NUMBER },
              rarityPercent: { type: Type.NUMBER }
            }
          }
        },
        required: ["numbers", "analysis"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse prediction:", e);
    throw new Error("Prediction engine malfunctioned.");
  }
};
