import { json } from "@sveltejs/kit";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { env } from "$env/dynamic/private";
// @ts-ignore
import prompt from './prompt.md?raw';

export const POST = async ({ request }) => {
  const provider = request.headers.get("x-ai-provider") || "gemini";
  
  // Get API key from generic header, fallback to env vars if missing (dev mode)
  let apiKey = request.headers.get("x-api-key");
  
  if (!apiKey) {
    if (provider === "openai") {
      apiKey = env.OPENAI_API_KEY || "";
    } else {
      apiKey = env.GEMINI_API_KEY || "";
    }
  }

  if (!apiKey || apiKey === "your_api_key_here") {
    return json({ error: `${provider === 'openai' ? 'OpenAI' : 'Gemini'} API Key not provided` }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return json({ error: "No audio file provided" }, { status: 400 });
    }

    if (provider === "openai") {
      const client = new OpenAI({ apiKey });
      
      // For OpenAI, we need to transcribe first then analyze, or use a model that supports audio.
      // Since standard GPT-4o audio input via API details are specific, a robust way for "analysis" 
      // often involves transcription + text analysis if direct audio isn't easily supported 
      // in the simple chat completion flow yet (or requires specific beta setup).
      // However, let's try to use the transcription + analysis approach for broad compatibility 
      // OR if we assume GPT-4o audio capability, we'd need to send base64 audio.
      // BUT current OpenAI Node SDK helper for audio in chat completions expects specific format.
      // Let's stick to Transcription (Whisper) -> Analysis (GPT-4o) for reliability 
      // unless user specifically asked for multimodal.
      // The prompt is about "voice coaching", so tone matters. 
      // Multimodal is better but let's check if "gpt-4o-audio-preview" is available/stable.
      // Usage of GPT-4o for audio:
      // https://platform.openai.com/docs/guides/audio
      
      // Let's try standard Transcription -> Analysis for now as it's most standard,
      // UNLESS the prompt relies heavily on "how" it was said (tone, pitch).
      // The prompt asks to "analyze this audio...". 
      // Given "AI Voice Coach", tone IS important.
      // So fetching transcription might miss the point.
      // Let's try to pass the audio to GPT-4o-audio-preview if possible.
      
      // Since I can't easily verify if their key has access to audio-preview, 
      // I will fallback to: Transcribe (Whisper) -> Analyze (GPT-4o).
      // This is safer. 
      
      // Step 1: Transcribe
      const transcription = await client.audio.transcriptions.create({
        file: audioFile as any, // OpenAI SDK expects File object, Blob usually works or needs conversion
        model: "whisper-1",
      });

      // Step 2: Analyze Text
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Here is the transcription of the user's speech:\n\n"${transcription.text}"\n\nPlease analyze it according to the system prompt.` }
        ],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content || "{}");
      return json(analysis);

    } else {
      // GEMINI Implementation
      const client = new GoogleGenAI({ apiKey });
      
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      const result = await client.models.generateContent({
        model: "gemini-3-flash-preview", // or gemini-2.0-flash-exp if available
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { 
                inlineData: { 
                  data: base64Audio, 
                  mimeType: audioFile.type 
                } 
              }
            ]
          }
        ]
      });

      const responseText = result.text || "";
      const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
      const analysis = JSON.parse(jsonString);

      return json(analysis);
    }

  } catch (error: any) {
    console.error(`${provider} Analysis Error:`, error);
    return json({ error: error.message || "Failed to analyze audio" }, { status: 500 });
  }
};
