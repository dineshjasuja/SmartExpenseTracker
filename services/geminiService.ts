
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Parses user input into a structured expense object using Gemini.
 * Optimized for high speed and low latency on serverless platforms.
 */
export const parseExpenseMessage = async (message: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const currentDate = new Date().toISOString().split('T')[0];
    
    const categories = [
      "Grocery", "Household Help", "Medical", "Shopping", "Transport", 
      "Education", "Entertainment", "Medical Insurance", "Property Tax", 
      "Electricity", "Mobile", "Home Maintenance", "Petrol", "Food & Drinks"
    ];

    const systemInstruction = `Extract expense JSON. Today: ${currentDate}. Categories: ${categories.join(', ')}. Return format: {"amount":number,"category":string,"description":string,"date":"YYYY-MM-DD"}`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest", 
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: categories },
            description: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ["amount", "category", "description", "date"],
        },
      },
    });

    const text = response.text.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing expense with Gemini:", error);
    return null;
  }
};
