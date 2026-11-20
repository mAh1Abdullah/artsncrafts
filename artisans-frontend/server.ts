import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Lazy initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        aiClient = new GoogleGenAI({ apiKey });
      }
    }
    return aiClient;
  }

  // --- API ROUTES ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: "The Artisan's Market" });
  });

  // AI Craft Advisor Endpoint
  app.post('/api/gemini/craft-advisor', async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          craftRecommendation: `Bespoke handcrafted item for: "${prompt}".`,
          recommendedMaterials: ['Seasoned Chittagong Teak', 'Pure Earthenware Clay', 'Handspun Silk Yarn'],
          suggestedCustomizations: ['Laser Engraved Monogram / Date', 'Custom Artisan Finish', 'Hand-Stitched Silk Gift Packaging'],
          artisanMatchNote: 'Matched with master craftspeople in Dhamrai, Sonargaon, and Chittagong.'
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert Artisan Crafts Consultant for "The Artisan's Market", an online marketplace for authentic handcrafted arts, pottery, woodcarvings, textiles, and raw materials.
A buyer submitted the following craft customization request: "${prompt}".

Respond with a JSON object with strictly these keys:
{
  "craftRecommendation": "A 2-3 sentence enthusiastic advice on how this bespoke piece can be crafted",
  "recommendedMaterials": ["Array of 3-4 natural authentic craft materials"],
  "suggestedCustomizations": ["Array of 3 personalized options e.g. engraved text, custom size, glaze tone"],
  "artisanMatchNote": "A sentence describing which traditional Bangladeshi craft cluster (Dhamrai, Sonargaon, Srimangal, Chittagong) is ideal"
}`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/gemini/craft-advisor:', err);
      return res.json({
        craftRecommendation: 'Hand-shaped bespoke artisan creation tailored to your vision.',
        recommendedMaterials: ['Teak Wood', 'Earthenware Clay', 'Brass Accent'],
        suggestedCustomizations: ['Name Engraving', 'Custom Dimension', 'Artisan Gift Box'],
        artisanMatchNote: 'Matched with heritage Bangladeshi artisan studios.'
      });
    }
  });

  // AI Product Story Generator Endpoint
  app.post('/api/gemini/describe-product', async (req, res) => {
    const { title = 'Artisanal Piece', category = 'Craft', materials = 'natural materials' } = req.body || {};
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          craftedTitle: `Artisanal ${title}`,
          engagingStory: `Hand-thrown and meticulously shaped by master Bangladeshi artisans using authentic ${materials}. Each piece carries the distinct touch and heritage of traditional crafting techniques passed down through generations.`,
          suggestedTags: [category, 'Handmade', 'Artisanal', 'Heritage', 'Sustainable'],
          careInstructions: 'Wipe gently with a clean dry cloth or soft sponge. Store in a cool, dry area.'
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Generate a compelling product listing description for a handcrafted product on "The Artisan's Market".
Product Title: "${title}"
Category: "${category}"
Materials Used: "${materials}"

Respond with a JSON object with strictly these keys:
{
  "craftedTitle": "An elegant, marketable product title",
  "engagingStory": "A 3-sentence poetic story highlighting the artisan craft process, heritage, and unique tactile beauty of the item",
  "suggestedTags": ["Array of 5 search tags"],
  "careInstructions": "1 short clear sentence on how to preserve and care for this handcrafted item"
}`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/gemini/describe-product:', err);
      return res.json({
        craftedTitle: title,
        engagingStory: `Beautifully crafted piece made with authentic ${materials || 'natural materials'}. Perfect as a personal keepsake or thoughtful handcrafted gift.`,
        suggestedTags: ['Handmade', 'Artisan', 'Craft'],
        careInstructions: 'Clean gently with a soft dry cloth.'
      });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[The Artisan's Market] Server running at http://localhost:${PORT}`);
  });
}

startServer();
