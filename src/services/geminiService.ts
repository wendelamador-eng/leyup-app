import { GoogleGenAI, Type } from "@google/genai";
import { LegalResponse } from "../types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

export async function getLegalAdvice(
  problemTitle: string, 
  answers: Record<string, string>,
  additionalDetails?: string,
  userProfile?: { name: string; age: string; occupation: string; gender: string }
): Promise<LegalResponse> {
  const ai = getAI();
  const prompt = `
    Actúa como un experto asesor legal de Honduras para una aplicación llamada "LeyUp". 
    IMPORTANTE: Responde ÚNICAMENTE con base en las leyes vigentes de Honduras (Código del Trabajo, Código de Familia, Código Civil, etc.).
    
    DATOS DEL USUARIO:
    - Nombre: ${userProfile?.name || 'No proporcionado'}
    - Género: ${userProfile?.gender || 'No proporcionado'}
    - Edad: ${userProfile?.age || 'No proporcionada'}
    - Ocupación/Contexto: ${userProfile?.occupation || 'No proporcionado'}

    El usuario tiene el siguiente problema: "${problemTitle}".
    Ha respondido a las siguientes preguntas:
    ${Object.entries(answers).map(([q, a]) => `- ${q}: ${a}`).join('\n')}
    ${additionalDetails ? `\nDetalles adicionales proporcionados por el usuario: "${additionalDetails}"` : ''}

    Proporciona una respuesta estructurada.
    Usa un lenguaje sencillo, directo y empático. Dirígete al usuario por su nombre si está disponible.
    Evita tecnicismos excesivos.
    Todos los costos deben expresarse en Lempiras (L). No utilices dólares u otras monedas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING, description: "Resumen claro de la situación legal." },
            whatToDo: { type: Type.STRING, description: "Acciones inmediatas recomendadas." },
            steps: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de pasos numerados a seguir." 
            },
            risks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Posibles riesgos o advertencias legales." 
            },
            estimatedCosts: { type: Type.STRING, description: "Rango estimado de costos." },
            estimatedTime: { type: Type.STRING, description: "Tiempo aproximado del proceso." }
          },
          required: ["diagnosis", "whatToDo", "steps", "risks", "estimatedCosts", "estimatedTime"]
        }
      }
    });
    
    const text = response.text;
    if (!text) {
      console.error("Gemini API returned an empty response.");
      throw new Error("La IA no devolvió una respuesta válida.");
    }
    
    try {
      const parsed = JSON.parse(text);
      
      return {
        ...parsed,
        steps: Array.isArray(parsed.steps) ? parsed.steps : [String(parsed.steps)],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [String(parsed.risks)]
      } as LegalResponse;
    } catch (parseError) {
      console.error("Error parsing Gemini response as JSON:", text);
      throw new Error("Error al procesar la respuesta de la IA.");
    }
  } catch (error: any) {
    console.error("Error fetching legal advice from Gemini:", error);
    
    let userFriendlyMessage = "No se pudo obtener la asesoría en este momento.";
    
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("PERMISSION_DENIED")) {
      userFriendlyMessage = "Error de acceso con la API de Gemini. Por favor, verifica la configuración de la aplicación.";
    } else if (error.message?.includes("quota")) {
      userFriendlyMessage = "Se ha alcanzado el límite de consultas. Por favor, intenta de nuevo en unos momentos.";
    } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
      userFriendlyMessage = "Error de conexión. Verifica tu internet e intenta de nuevo.";
    } else {
      userFriendlyMessage = "Hubo un problema al procesar tu consulta legal. Por favor, intenta de nuevo.";
    }
    
    throw new Error(userFriendlyMessage);
  }
}
