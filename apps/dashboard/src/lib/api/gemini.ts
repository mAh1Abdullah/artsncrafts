import { GoogleGenAI, Type } from '@google/genai';
import type {
  CraftAdvisorResponseDTO,
  ProductStoryResponseDTO,
} from '@waw/contracts';

const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured on the Next.js server. Configure it in Settings > Secrets.'
    ) as Error & { statusCode?: number; code?: string };
    err.statusCode = 503;
    err.code = 'AI_KEY_MISSING';
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateCraftAdvice(prompt: string): Promise<CraftAdvisorResponseDTO> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `A buyer submitted this bespoke craft request: "${prompt}". Provide tailored craftsmanship advice grounded in authentic Bangladeshi heritage craft clusters (Dhamrai, Sonargaon, Sylhet, Chittagong Hill Tracts, Tangail, Old Dhaka).`,
    config: {
      systemInstruction:
        'You are an expert Artisan Crafts Consultant for The Artisan\'s Market. Give concise, specific, culturally authentic Bangladeshi craft recommendations in valid JSON.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          craftRecommendation: {
            type: Type.STRING,
            description: '2-3 concise sentences explaining how this bespoke piece should be crafted.',
          },
          recommendedMaterials: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 4 natural authentic craft materials.',
          },
          suggestedCustomizations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 personalized options (e.g. engraving, weave motif, glaze tone).',
          },
          artisanMatchNote: {
            type: Type.STRING,
            description: '1 sentence naming the ideal traditional Bangladeshi craft cluster.',
          },
        },
        required: [
          'craftRecommendation',
          'recommendedMaterials',
          'suggestedCustomizations',
          'artisanMatchNote',
        ],
      },
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('Gemini returned an empty craft recommendation.');
  }

  return JSON.parse(text) as CraftAdvisorResponseDTO;
}

export async function generateArtisanProductStory(params: {
  title: string;
  category: string;
  materials: string;
}): Promise<ProductStoryResponseDTO> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Create a marketplace product listing for:
Title: "${params.title}"
Category: "${params.category}"
Materials: "${params.materials}"`,
    config: {
      systemInstruction:
        'You are an editorial copywriter for The Artisan\'s Market. Write authentic, refined descriptions celebrating Bangladeshi craftsmanship without clichés or hype.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          craftedTitle: {
            type: Type.STRING,
            description: 'A refined, marketable product title.',
          },
          engagingStory: {
            type: Type.STRING,
            description: 'A 3-sentence story highlighting craft technique, heritage, and tactile quality.',
          },
          suggestedTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '5 clean search tags.',
          },
          careInstructions: {
            type: Type.STRING,
            description: '1 clear sentence explaining how to care for the handcrafted piece.',
          },
        },
        required: ['craftedTitle', 'engagingStory', 'suggestedTags', 'careInstructions'],
      },
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('Gemini returned an empty product story.');
  }

  return JSON.parse(text) as ProductStoryResponseDTO;
}
