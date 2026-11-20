import React, { useState } from 'react';
import { VendorProfile } from '../types';
import { Store, ShieldCheck, MapPin, Sparkles, CheckCircle, Upload } from 'lucide-react';

interface SellerSignupPageProps {
  existingVendor?: VendorProfile;
  onSubmitApplication: (appData: {
    displayName: string;
    publicSlug: string;
    craftSpecialty: string;
    description: string;
    workshopLocation: string;
    supportEmail: string;
    supportPhone: string;
    allowCod: boolean;
    avatarUrl?: string;
    bannerUrl?: string;
  }) => void;
  onGoToDashboard: () => void;
}

export const SellerSignupPage: React.FC<SellerSignupPageProps> = ({
  existingVendor,
  onSubmitApplication,
  onGoToDashboard
}) => {
  const [displayName, setDisplayName] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [craftSpecialty, setCraftSpecialty] = useState('Terracotta & Earthenware Pottery');
  const [description, setDescription] = useState('');
  const [workshopLocation, setWorkshopLocation] = useState('Dhamrai, Dhaka');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [allowCod, setAllowCod] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !description || !supportEmail) return;

    onSubmitApplication({
      displayName,
      publicSlug: publicSlug || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      craftSpecialty,
      description,
      workshopLocation,
      supportEmail,
      supportPhone,
      allowCod,
      avatarUrl
    });

    setSubmitted(true);
  };

  if (existingVendor && existingVendor.status === 'approved') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          You are an Approved Artisan Seller!
        </h1>
        <p className="text-stone-600 max-w-lg mx-auto text-sm">
          Your shop <strong>"{existingVendor.displayName}"</strong> is active on The Artisan's Market. You can list handcrafted items, view customer custom orders, and track payouts.
        </p>
        <button
          onClick={onGoToDashboard}
          className="px-6 py-3 bg-amber-950 text-amber-100 rounded-xl font-semibold text-sm hover:bg-amber-900 transition-colors cursor-pointer"
        >
          Open Seller Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 text-amber-100 rounded-3xl p-8 shadow-xl">
        <div className="max-w-2xl space-y-3">
          <span className="bg-amber-800/80 text-amber-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            Artisan Onboarding & Guild Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Apply to Sell Your Handcrafted Creations
          </h1>
          <p className="text-amber-200/90 text-sm leading-relaxed">
            Join thousands of independent Bangladeshi potters, weavers, carvers, and metalworkers. Reach nationwide buyers seeking authentic made-to-order crafts and wholesale raw materials.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-amber-800 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">Application Submitted & Verified!</h2>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Your vendor profile has been created and approved. You are now ready to list your handcrafted items.
          </p>
          <button
            onClick={onGoToDashboard}
            className="px-6 py-3 bg-amber-900 text-white rounded-xl text-xs font-bold hover:bg-amber-800 transition-colors cursor-pointer"
          >
            Go to Seller Dashboard
          </button>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-lg space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-serif text-xl font-bold text-stone-900">Artisan Studio Profile</h2>
            <p className="text-xs text-stone-500">Provide details about your craft studio, workshop location, and contact information.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">Shop / Studio Display Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Dhamrai Clay Heritage Studio"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">Desired Public URL Slug</label>
              <input
                type="text"
                placeholder="e.g., dhamrai-clay-heritage"
                value={publicSlug}
                onChange={(e) => setPublicSlug(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">Craft Specialty *</label>
              <select
                value={craftSpecialty}
                onChange={(e) => setCraftSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              >
                <option value="Terracotta & Earthenware Pottery">Terracotta & Earthenware Pottery</option>
                <option value="Handloom Muslin & Jamdani Weaving">Handloom Muslin & Jamdani Weaving</option>
                <option value="Hand-Carved Teak & Mahogany Crafts">Hand-Carved Teak & Mahogany Crafts</option>
                <option value="Resin & Pressed Flower Crafts">Resin & Pressed Flower Crafts</option>
                <option value="Brass & Copper Metalsmithing">Brass & Copper Metalsmithing</option>
                <option value="Leather & Hide Crafting">Leather & Hide Crafting</option>
                <option value="Raw Materials Wholesaler">Raw Materials Wholesaler</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">Workshop Location *</label>
              <input
                type="text"
                required
                placeholder="e.g., Dhamrai, Dhaka Division"
                value={workshopLocation}
                onChange={(e) => setWorkshopLocation(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">Support Email *</label>
              <input
                type="email"
                required
                placeholder="artisan@studio.bd"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">Support Phone Number</label>
              <input
                type="tel"
                placeholder="+8801711223344"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-800">Artisan Studio Story & Heritage Bio *</label>
            <textarea
              rows={3}
              required
              placeholder="Tell buyers about your studio, generations of craftsmanship, materials used, and kiln techniques..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-800">Avatar / Logo Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="allowCod"
              checked={allowCod}
              onChange={(e) => setAllowCod(e.target.checked)}
              className="w-4 h-4 text-amber-900 rounded focus:ring-amber-800 cursor-pointer"
            />
            <label htmlFor="allowCod" className="text-xs text-stone-700 cursor-pointer">
              Accept Cash on Delivery (COD) for verified buyers
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-950 hover:bg-amber-900 text-amber-100 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Submit Artisan Seller Application
          </button>
        </form>
      )}
    </div>
  );
};
