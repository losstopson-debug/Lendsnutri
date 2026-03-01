import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface FoodAnalysis {
  name: string;
  nutritionalInfo: string;
  healthInsights: string;
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysis> {
  // Support both Vite's import.meta.env and Node's process.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Chave da API do Gemini não configurada. Verifique as variáveis de ambiente (VITE_GEMINI_API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Analise esta imagem de comida e seja conciso. Forneça em Português (Brasil).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Nome do prato",
          },
          nutritionalInfo: {
            type: Type.STRING,
            description: "Informações nutricionais em Markdown (Calorias estimadas, Macros: Prot/Carb/Gord)",
          },
          healthInsights: {
            type: Type.STRING,
            description: "Insights de saúde em Markdown (3 Benefícios principais, Alertas rápidos)",
          },
        },
        required: ["name", "nutritionalInfo", "healthInsights"],
      },
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Não foi possível analisar a imagem.");
  }

  return JSON.parse(text) as FoodAnalysis;
}
