import { useEffect, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { ApiProblemError, type CraftAdvisorResponseDTO } from '@waw/contracts';
import { wawApi } from '../lib/api';
import {
  getStoreSnapshot,
  setAdvisorOpen,
  subscribeStore,
} from '../lib/store';

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
        setError((err as Error).message || 'Unable to reach Craft Advisor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#221E1B]/50 backdrop-blur-[2px]"
        onClick={() => setAdvisorOpen(false)}
      />
      <div className="relative z-10 w-full max-w-xl rounded-xl bg-[#FAF9F6] border border-[#DED6CA] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD2] flex items-center justify-between bg-[#F3EFE9]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#B84A27]" />
            <h2 className="font-editorial text-lg font-semibold text-[#221E1B]">
              Bespoke Craft Advisor
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAdvisorOpen(false)}
            className="p-1.5 rounded-md text-[#6E6359] hover:text-[#221E1B]"
            aria-label="Close Craft Advisor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <p className="text-sm text-[#574E46] leading-relaxed">
            Describe a gift, dining centerpiece, or heirloom textile you have in
            mind. Our server-side advisor matches your idea to traditional
            Bangladeshi craft clusters and materials.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              rows={3}
              required
              minLength={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A housewarming dining table centerpiece combining natural clay and brass engraving for a wedding gift..."
              className="w-full rounded-lg border border-[#D8CFC3] bg-white px-3.5 py-2.5 text-sm text-[#221E1B] focus:border-[#B84A27] focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Bridal Jamdani shawl',
                  'Engraved Dhamrai clay pitcher',
                  'Teak tea serving tray',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-xs px-2.5 py-1 rounded border border-[#E2D9CC] bg-white hover:border-[#221E1B] text-[#574E46]"
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B84A27] hover:bg-[#9c3d1f] text-white text-sm font-medium disabled:opacity-50 shrink-0"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Consult</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-[#E2D9CC] bg-white p-5 space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#B84A27]">
                  Craft Recommendation
                </div>
                <p className="mt-1 text-sm text-[#221E1B] leading-relaxed">
                  {result.craftRecommendation}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#EFE8DE]">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6359]">
                    Recommended Materials
                  </div>
                  <ul className="mt-1.5 space-y-1 text-sm text-[#221E1B]">
                    {result.recommendedMaterials.map((mat) => (
                      <li key={mat}>• {mat}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6359]">
                    Bespoke Customizations
                  </div>
                  <ul className="mt-1.5 space-y-1 text-sm text-[#221E1B]">
                    {result.suggestedCustomizations.map((opt) => (
                      <li key={opt}>• {opt}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE8DE] text-xs text-[#4D6B59] font-medium">
                Artisan Cluster Match: {result.artisanMatchNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
