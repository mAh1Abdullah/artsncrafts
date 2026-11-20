/**
 * Client service to communicate with server-side Gemini API endpoints.
 */

export interface CraftConsultantResponse {
  craftRecommendation: string;
  recommendedMaterials: string[];
  suggestedCustomizations: string[];
  artisanMatchNote: string;
}

export interface ProductDescriptionResponse {
  craftedTitle: string;
  engagingStory: string;
  suggestedTags: string[];
  careInstructions: string;
}

export async function consultCraftAdvisor(prompt: string): Promise<CraftConsultantResponse> {
  try {
    const res = await fetch('/api/gemini/craft-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      throw new Error(`Advisor service returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Gemini Craft Advisor error, fallbacking to client response:', err);
    return {
      craftRecommendation: `Bespoke handcrafted craft based on "${prompt}". Our master artisans in Dhamrai and Sonargaon can hand-craft this made-to-order piece.`,
      recommendedMaterials: ['Seasoned Teak Wood', 'Earthenware Clay', 'Pure Brass Filigree', 'Natural Dyes'],
      suggestedCustomizations: ['Personalized Engraved Initials & Date', 'Custom Dimensions & Finish Color', 'Hand-Stitched Silk Gift Pouch'],
      artisanMatchNote: 'Matched with master craftspeople specializing in bespoke wedding gifts, corporate heritage keepsakes, and traditional pottery.'
    };
  }
}

export async function generateArtisanProductStory(
  title: string,
  category: string,
  materials: string
): Promise<ProductDescriptionResponse> {
  try {
    const res = await fetch('/api/gemini/describe-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, materials })
    });
    if (!res.ok) {
      throw new Error(`Story service returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Gemini Story error, fallbacking to template:', err);
    return {
      craftedTitle: `Handcrafted ${title}`,
      engagingStory: `Hand-thrown and meticulously shaped by skilled Bangladeshi artisans using authentic ${materials || 'natural materials'}. Each piece carries the unique character and warmth of traditional craftsmanship.`,
      suggestedTags: [category, 'Handmade', 'Artisanal', 'Sustainable', 'Heritage Craft'],
      careInstructions: 'Clean gently with a soft dry or damp cloth. Avoid harsh chemicals or abrasive sponges.'
    };
  }
}
