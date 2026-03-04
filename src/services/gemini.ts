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

export async function analyzeFoodText(foodName: string): Promise<FoodAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave da API do Gemini não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Analise detalhadamente o seguinte alimento ou prato: "${foodName}".
Responda APENAS em JSON válido.
Não inclua explicações fora do JSON.
Se houver incerteza, mencione no campo "descricao".`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
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
    throw new Error("Não foi possível analisar o alimento.");
  }

  return JSON.parse(text) as FoodAnalysis;
}

export async function askFoodQuestion(analysis: FoodAnalysis, question: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave da API do Gemini não configurada.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Com base na seguinte análise de alimento:
${JSON.stringify(analysis, null, 2)}

Responda à seguinte dúvida do usuário de forma clara, concisa e em Português (Brasil):
"${question}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "Não foi possível gerar uma resposta.";
}

export interface RecipeAnalysis {
  tempoPreparo: string;
  rendimento: string;
  ingredientes: string[];
  modoPreparo: string[];
}

export async function generateRecipe(foodName: string): Promise<RecipeAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave da API do Gemini não configurada.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Crie uma receita detalhada para preparar: "${foodName}".
Responda APENAS em JSON válido.
Não inclua explicações fora do JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tempoPreparo: { type: Type.STRING },
          rendimento: { type: Type.STRING },
          ingredientes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          modoPreparo: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["tempoPreparo", "rendimento", "ingredientes", "modoPreparo"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Não foi possível gerar a receita.");
  }

  return JSON.parse(text) as RecipeAnalysis;
}
