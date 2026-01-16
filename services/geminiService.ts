
import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

export const generateAssetReportSummary = async (assets: Asset[]): Promise<string> => {
  // Fix: Check API_KEY availability directly from process.env
  if (!process.env.API_KEY) {
    console.warn("API_KEY não configurada. IA desativada.");
    return "Insights de IA não disponíveis no momento.";
  }

  // Fix: Strict initialization according to @google/genai guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const assetSummary = assets.map(a => `${a.type} ${a.brand} (${a.status})`).join(', ');
  const prompt = `Como um consultor sênior de TI, analise este inventário de ativos e forneça um resumo executivo de 3 frases sobre a saúde da frota: ${assetSummary}`;

  try {
    // Fix: Using correct model naming and property access
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Property .text is a getter, correctly used without parentheses
    return response.text || "Não foi possível gerar o resumo automático.";
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Erro ao carregar insights da IA.";
  }
};
