import { useEffect, useState } from 'react';
import { ArrowRight, Bot, Send, Sparkles, X } from 'lucide-react';
import { ApiProblemError, type CraftAdvisorResponseDTO } from '@waw/contracts';
import { wawApi } from '../lib/api';
import { getStoreSnapshot, setAdvisorOpen, subscribeStore } from '../lib/store';

export function CraftAdvisorIsland() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CraftAdvisorResponseDTO | null>(null);

  useEffect(() => {
    const sync = () => setOpen(getStoreSnapshot().advisorOpen);
    sync();
    return subscribeStore(sync);
  }, []);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await wawApi.askCraftAdvisor(prompt.trim());
      setResult(res.data);
    } catch (err) {
      if (err instanceof ApiProblemError) {
        setError(err.problem.detail);
      } else {
        setError('Unable to reach the AI Craft Advisor right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="AI Craft & Customization Advisor"
      onClick={() => setAdvisorOpen(false)}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 relative text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setAdvisorOpen(false)}
          aria-label="Close AI Craft Advisor"
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#2E2A25] text-amber-200 flex items-center justify-center shadow-lg shrink-0">
            <Sparkles className="w-6 h-6 text-[#C85A32]" />
          </div>
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#2E2A25]">
              AI Craft &amp; Customization Advisor
            </h2>
            <p className="text-xs text-stone-500">
              Describe your custom gift idea, heritage motif, or raw material
              needs.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="craft-advisor-prompt"
              className="text-xs font-semibold text-stone-800 block mb-1"
            >
              What bespoke piece or craft project do you want to create?
            </label>
            <textarea
              id="craft-advisor-prompt"
              rows={3}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'I want a Chittagong teakwood wall clock with brass inlays and a custom Bengali verse engraved on the rim for my parents' anniversary...'"
              className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs focus:ring-2 focus:ring-[#C85A32]/30 focus:border-[#C85A32] focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2E2A25] hover:bg-[#C85A32] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                Analyzing Craft Materials &amp; Artisans...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-300" />
                Get AI Artisan Recommendation
              </>
            )}
          </button>
        </form>

        {/* Advisor Result Output */}
        {result && (
          <div className="p-5 rounded-2xl bg-[#F4EBE1]/90 border border-[#E8DCCF] space-y-4 text-xs">
            <div className="flex items-center gap-2 text-[#2E2A25] font-bold border-b border-[#E8DCCF] pb-2">
              <Bot className="w-4 h-4 text-[#C85A32]" />
              <span>Crafting Advice &amp; Artisan Match</span>
            </div>

            <p className="text-[#2E2A25] leading-relaxed font-editorial text-sm">
              &ldquo;{result.craftRecommendation}&rdquo;
            </p>

            <div className="space-y-1.5">
              <span className="font-bold text-[#2E2A25] block uppercase text-[10px] tracking-wider">
                Recommended Natural Materials:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.recommendedMaterials.map((mat, i) => (
                  <span
                    key={i}
                    className="bg-white border border-[#E8DCCF] px-2.5 py-0.5 rounded-md text-stone-700 font-medium"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-[#2E2A25] block uppercase text-[10px] tracking-wider">
                Suggested Customization Specs:
              </span>
              <ul className="list-disc list-inside space-y-1 text-stone-700">
                {result.suggestedCustomizations.map((spec, i) => (
                  <li key={i}>{spec}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-[#E8DCCF] flex items-center justify-between gap-3 text-[11px] text-[#5F7464]">
              <span className="italic">{result.artisanMatchNote}</span>
              <button
                type="button"
                onClick={() => setAdvisorOpen(false)}
                className="text-[#2E2A25] font-bold hover:text-[#C85A32] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                Browse Marketplace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
