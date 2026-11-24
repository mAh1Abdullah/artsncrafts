import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ApiProblemError, type VendorDTO } from '@waw/contracts';
import { getDashboardUrl, storefrontPath, wawApi } from '../lib/api';

export function SellerSignupIsland() {
  const [displayName, setDisplayName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [craftSpecialty, setCraftSpecialty] = useState('');
  const [workshopLocation, setWorkshopLocation] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [description, setDescription] = useState('');
  const [allowCod, setAllowCod] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedVendor, setSubmittedVendor] = useState<VendorDTO | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await wawApi.submitVendorApplication({
        displayName,
        legalName: legalName || undefined,
        craftSpecialty,
        workshopLocation,
        supportEmail,
        supportPhone,
        description,
        allowCod,
      });
      setSubmittedVendor(res.data);
    } catch (err) {
      if (err instanceof ApiProblemError) {
        setError(err.problem.detail);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedVendor) {
    return (
      <div className="rounded-xl border border-[#4D6B59] bg-white p-8 space-y-4">
        <CheckCircle2 className="h-10 w-10 text-[#4D6B59]" />
        <h2 className="font-editorial text-2xl font-semibold text-[#221E1B]">
          Application Received — {submittedVendor.displayName}
        </h2>
        <p className="text-sm text-[#574E46] leading-relaxed">
          Your workshop application is now queued in the Next.js Marketplace
          Admin console with status{' '}
          <strong className="font-mono">{submittedVendor.status}</strong>. Once
          approved, your studio storefront will go live at{' '}
          <code className="font-mono text-[#B84A27]">
            /storefront/shops/{submittedVendor.publicSlug}
          </code>
          .
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <a
            href={`${getDashboardUrl()}/admin`}
            className="px-4 py-2 rounded-lg bg-[#221E1B] hover:bg-[#B84A27] text-white text-xs font-medium"
          >
            Review in Admin Console
          </a>
          <a
            href={storefrontPath('/')}
            className="px-4 py-2 rounded-lg border border-[#D8CFC3] text-xs font-medium text-[#221E1B]"
          >
            Back to Storefront
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#E5DDD2] bg-white p-6 sm:p-8 space-y-5"
    >
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#574E46] mb-1">
            Studio Display Name
          </label>
          <input
            type="text"
            required
            minLength={3}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Rajshahi Silk & Loom Guild"
            className="w-full rounded-md border border-[#D8CFC3] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#574E46] mb-1">
            Legal / Cooperative Name (optional)
          </label>
          <input
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="Registered craft entity"
            className="w-full rounded-md border border-[#D8CFC3] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#574E46] mb-1">
            Craft Specialty
          </label>
          <input
            type="text"
            required
            minLength={3}
            value={craftSpecialty}
            onChange={(e) => setCraftSpecialty(e.target.value)}
            placeholder="e.g. Hand-Reeled Mulberry Silk"
            className="w-full rounded-md border border-[#D8CFC3] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#574E46] mb-1">
            Workshop Location
          </label>
          <input
            type="text"
            required
            minLength={3}
            value={workshopLocation}
            onChange={(e) => setWorkshopLocation(e.target.value)}
            placeholder="e.g. Boalia, Rajshahi"
            className="w-full rounded-md border border-[#D8CFC3] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#574E46] mb-1">
            Support Email
          </label>
          <input
            type="email"
            required
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="artisan@studio.bd"
            className="w-full rounded-md border border-[#D8CFC3] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#574E46] mb-1">
            Phone (+880)
          </label>
          <input
            type="tel"
            required
            minLength={8}
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            placeholder="+88017XXXXXXXX"
            className="w-full rounded-md border border-[#D8CFC3] px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#574E46] mb-1">
          Workshop Heritage & Techniques
        </label>
        <textarea
          rows={4}
          required
          minLength={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us about your artisans, materials, and traditional craft methods..."
          className="w-full rounded-md border border-[#D8CFC3] px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#574E46] cursor-pointer">
        <input
          type="checkbox"
          checked={allowCod}
          onChange={(e) => setAllowCod(e.target.checked)}
        />
        <span>Accept Cash on Delivery (COD) for verified buyers</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-[#B84A27] hover:bg-[#9c3d1f] text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>Submit Artisan Application</span>
      </button>
    </form>
  );
}
