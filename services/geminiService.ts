import { GoogleGenAI, Modality } from "@google/genai";
import { GeminiModel } from "../types";

// Initialize the Gemini client
// Note: In a real production app, you might proxy this through a backend to keep keys secure.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a single workshop image to extract text and context.
 * Uses Flash for speed and vision capabilities.
 */
export const analyzeImageContent = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: "Analyze this workshop photo. 1) Transcribe ALL legible text from sticky notes, cards, or whiteboards. 2) Describe the color coding or grouping of items (e.g., 'yellow notes clustered on the left'). 3) Identify any drawn diagrams or arrows. Output as a structured summary of the visual data.",
          },
        ],
      },
    });
    
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image content.");
  }
};

/**
 * Synthesizes a full report from multiple image descriptions.
 * Uses Pro for complex reasoning and synthesis.
 */
export const generateWorkshopReport = async (descriptions: string[]): Promise<string> => {
  // Construct the prompt outside try block so it's available for fallback
  const combinedContext = descriptions.map((d, i) => `Image ${i + 1} Analysis:\n${d}`).join('\n\n');
    
  const prompt = `
    You are an expert Workshop Facilitator and Documentation Specialist.
    I have analyzed several photos from a workshop session. 
    
    Here is the extracted data from the materials:
    ---
    ${combinedContext}
    ---
    
    Based on these inputs, generate a professional Workshop Summary Report in Markdown format.
    The report MUST include:
    1. **Executive Summary**: A high-level overview of the session's visible outcome.
    2. **Key Themes & Insights**: Group the sticky notes and points into thematic clusters.
    3. **Actionable Findings**: Specific takeaways derived from the content.
    4. **Suggested Next Steps**: Practical follow-up actions based on the workshop type.
    
    Formatting:
    - Use headers (#, ##).
    - Use bullet points.
    - Use bold text for emphasis.
    - Keep the tone professional, encouraging, and clear.
  `;

  try {
    // Use Gemini 3 Pro for advanced reasoning and synthesis
    // Removed thinkingConfig to ensure stability and avoid potential errors
    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: {
        parts: [{ text: prompt }]
      }
    });

    return response.text || "Report generation failed.";
  } catch (error) {
    console.warn("Pro model failed, falling back to Flash:", error);
    
    // Fallback to Flash if Pro fails (e.g., quota or model errors)
    try {
        const response = await ai.models.generateContent({
          model: GeminiModel.FLASH,
          contents: {
            parts: [{ text: prompt }]
          }
        });
        return response.text || "Report generation failed (Fallback).";
    } catch (fallbackError) {
        console.error("Error generating report:", fallbackError);
        throw new Error("Failed to generate comprehensive report.");
    }
  }
};

/**
 * Generates a podcast-style audio overview of the report.
 * Step 1: Generate a script using Flash.
 * Step 2: Synthesize audio using TTS with Multi-Speaker config.
 */
export const generateAudioOverview = async (reportText: string): Promise<string> => {
  try {
    // Step 1: Generate the Podcast Script
    const scriptPrompt = `
      Convert the following workshop report into a lively podcast transcript between two colleagues, Alex and Sam.
      
      Report Content:
      ${reportText.substring(0, 8000)}
      
      Characters:
      - Alex: The lead facilitator. Deep voice, confident, summarizing the big picture.
      - Sam: The analyst. Higher voice, curious, asking questions and pointing out specific sticky note details.
      
      Format the output EXACTLY like this (no other text):
      Alex: [Line]
      Sam: [Line]
      Alex: [Line]
      ...
      
      Keep it under 2 minutes of speaking time. Start with a friendly welcome.
    `;

    const scriptResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: { parts: [{ text: scriptPrompt }] },
    });

    const script = scriptResponse.text;
    if (!script) throw new Error("Failed to generate podcast script.");

    // Step 2: Synthesize Audio from Script
    const ttsResponse = await ai.models.generateContent({
      model: GeminiModel.TTS,
      contents: { parts: [{ text: script }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Alex',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
              },
              {
                speaker: 'Sam',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
              }
            ]
          }
        }
      }
    });

    const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio data received");
    
    return audioData;
  } catch (error) {
    console.error("Error generating audio overview:", error);
    throw new Error("Failed to generate audio overview.");
  }
};
