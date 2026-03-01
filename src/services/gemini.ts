import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface FoodAnalysis {
  nomePrato: string;
  descricao: string;
  calorias: {
    totalEstimado_kcal: string;
    porPorcao_kcal: string;
  };
  macronutrientes: {
    proteinas_g: string;
    carboidratos_g: string;
    gorduras_g: string;
    fibras_g: string;
  };
  micronutrientesPrincipais: string[];
  beneficiosSaude: string[];
  riscosOuAlertas: string[];
  sugestaoParaMelhorar: string;
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysis> {
  // Support both Vite's import.meta.env and Node's process.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Chave da API do Gemini não configurada. Verifique as variáveis de ambiente (VITE_GEMINI_API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Analise detalhadamente esta imagem de comida.
Responda APENAS em JSON válido.
Não inclua explicações fora do JSON.
Se houver incerteza, mencione no campo "descricao".`;

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
          nomePrato: { type: Type.STRING },
          descricao: { type: Type.STRING },
          calorias: {
            type: Type.OBJECT,
            properties: {
              totalEstimado_kcal: { type: Type.STRING },
              porPorcao_kcal: { type: Type.STRING }
            },
            required: ["totalEstimado_kcal", "porPorcao_kcal"]
          },
          macronutrientes: {
            type: Type.OBJECT,
            properties: {
              proteinas_g: { type: Type.STRING },
              carboidratos_g: { type: Type.STRING },
              gorduras_g: { type: Type.STRING },
              fibras_g: { type: Type.STRING }
            },
            required: ["proteinas_g", "carboidratos_g", "gorduras_g", "fibras_g"]
          },
          micronutrientesPrincipais: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          beneficiosSaude: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          riscosOuAlertas: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          sugestaoParaMelhorar: { type: Type.STRING }
        },
        required: [
          "nomePrato",
          "descricao",
          "calorias",
          "macronutrientes",
          "micronutrientesPrincipais",
          "beneficiosSaude",
          "riscosOuAlertas",
          "sugestaoParaMelhorar"
        ],
      },
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Não foi possível analisar a imagem.");
  }

  return JSON.parse(text) as FoodAnalysis;
}
