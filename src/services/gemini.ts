import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export async function analyzeFoodImage(base64Image: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Analise esta imagem de comida e seja conciso. Forneça em Português (Brasil):
  1. Nome do prato.
  2. Calorias estimadas.
  3. Macros (Prot/Carb/Gord).
  4. 3 Benefícios principais.
  5. Alertas rápidos.
  Use Markdown simples.`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
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
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });

  return response.text || "Não foi possível analisar a imagem.";
}
