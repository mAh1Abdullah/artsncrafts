import React, { useState } from 'react';
import { consultCraftAdvisor, CraftConsultantResponse } from '../services/geminiService';
import { Sparkles, X, Send, Bot, ShieldCheck, ArrowRight } from 'lucide-react';

interface CraftAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CraftAdvisorModal: React.FC<CraftAdvisorModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState<CraftConsultantResponse | null>(null);

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    const result = await consultCraftAdvisor(prompt);
    setAdvisorResponse(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 relative text-stone-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-900 text-amber-200 flex items-center justify-center shadow-lg shadow-amber-900/20 shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">AI Craft & Customization Advisor</h2>
            <p className="text-xs text-stone-500">Describe your custom gift idea, heritage motif, or raw material needs.</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleConsult} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-800 block mb-1">
              What bespoke piece or craft project do you want to create?
            </label>
            <div className="relative">
              <textarea
                rows={3}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'I want a teakwood wall clock with pressed wildflowers and a custom Bengali poem engraved on the rim for my parents anniversary...'"
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs focus:ring-2 focus:ring-amber-800/30 focus:outline-none pr-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-950 hover:bg-amber-900 text-amber-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                Analyzing Craft Materials & Artisans...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-400" />
                Get AI Artisan Recommendation
              </>
            )}
          </button>
        </form>

        {/* Advisor Result Output */}
        {advisorResponse && (
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-900/20 space-y-4 text-xs animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold border-b border-amber-200/80 pb-2">
              <Bot className="w-4 h-4 text-amber-800" />
              <span>Crafting Advice & Artisan Match</span>
            </div>

            <p className="text-stone-800 leading-relaxed font-serif">
              "{advisorResponse.craftRecommendation}"
            </p>

            <div className="space-y-1.5">
              <span className="font-bold text-amber-950 block uppercase text-[10px] tracking-wider">Recommended Natural Materials:</span>
              <div className="flex flex-wrap gap-1.5">
                {advisorResponse.recommendedMaterials.map((mat, i) => (
                  <span key={i} className="bg-white border border-amber-200 px-2.5 py-0.5 rounded-md text-stone-700 font-medium">
                    {mat}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-amber-950 block uppercase text-[10px] tracking-wider">Suggested Customization Specs:</span>
              <ul className="list-disc list-inside space-y-1 text-stone-700">
                {advisorResponse.suggestedCustomizations.map((spec, i) => (
                  <li key={i}>{spec}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900">
              <span className="italic">{advisorResponse.artisanMatchNote}</span>
              <button
                onClick={onClose}
                className="text-amber-950 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Browse Marketplace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
