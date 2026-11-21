"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Package,
  Plus,
  Sparkles,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import {
  formatBDT,
  type OrderDTO,
  type ProductCategory,
  type ProductDTO,
  type VendorDTO,
  type VendorSettlementDTO,
} from "@waw/contracts";

interface SellerStudioClientProps {
  initialVendors: VendorDTO[];
  initialProducts: ProductDTO[];
  initialOrders: OrderDTO[];
  initialSettlements: VendorSettlementDTO[];
}

export function SellerStudioClient({
  initialVendors,
  initialProducts,
  initialOrders,
  initialSettlements,
}: SellerStudioClientProps) {
  const [vendors, setVendors] = useState(initialVendors);
  const [selectedVendorId, setSelectedVendorId] = useState(
    initialVendors[0]?.id ?? "v-dhamrai-clay"
  );
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [settlements] = useState(initialSettlements);
  const [activeTab, setActiveTab] = useState<
    "listings" | "orders" | "settlements" | "settings"
  >("listings");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  // Create Listing form state
  const [newTitle, setNewTitle] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newCategory, setNewCategory] = useState<ProductCategory>("pottery");
  const [newPriceBdt, setNewPriceBdt] = useState("2800");
  const [newStock, setNewStock] = useState("15");
  const [newMaterials, setNewMaterials] = useState("Dhamrai River Clay, Natural Slip");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("Handcrafted, Heritage");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const activeVendor =
    vendors.find((v) => v.id === selectedVendorId) ?? vendors[0];
  const vendorProducts = products.filter(
    (p) => p.vendorId === activeVendor?.id
  );
  const vendorSettlements = settlements.filter(
    (s) => s.vendorProfileId === activeVendor?.id
  );

  // Settings controlled state
  const [shopDesc, setShopDesc] = useState(activeVendor?.description ?? "");
  const [shopPhone, setShopPhone] = useState(activeVendor?.supportPhone ?? "");
  const [allowCod, setAllowCod] = useState(activeVendor?.allowCod ?? true);

  const handleVendorChange = (id: string) => {
    setSelectedVendorId(id);
    const v = vendors.find((item) => item.id === id);
    if (v) {
      setShopDesc(v.description);
      setShopPhone(v.supportPhone);
      setAllowCod(v.allowCod);
    }
  };

  const handleGenerateStory = async () => {
    if (!newTitle.trim()) {
      setFeedback({
        tone: "error",
        message: "Enter a product title before generating an editorial story.",
      });
      return;
    }
    setIsGeneratingStory(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/v1/ai/product-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          materials: newMaterials.trim() || "Natural local craft materials",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.detail || "Unable to generate product story.");
      }
      const story = json.data;
      setNewTitle(story.craftedTitle || newTitle);
      setNewDescription(
        `${story.engagingStory}\n\nCare: ${story.careInstructions}`
      );
      if (Array.isArray(story.suggestedTags)) {
        setNewTags(story.suggestedTags.join(", "));
      }
      setFeedback({
        tone: "success",
        message: "Artisan story and tags drafted via Gemini 4 Hydrogen.",
      });
    } catch (err) {
      setFeedback({
        tone: "error",
        message: (err as Error).message,
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    setFeedback(null);
    try {
      const priceBdt = Number(newPriceBdt) || 1200;
      const sellingPriceUsd = Number((priceBdt / 120).toFixed(2));
      const sku =
        newSku.trim() ||
        `ART-${Math.floor(1000 + Math.random() * 9000)}`;

      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle.trim(),
          sku,
          vendorId: activeVendor?.id,
          brand: activeVendor?.displayName,
          category: newCategory,
          description: newDescription.trim(),
          sellingPrice: sellingPriceUsd,
          priceBdt,
          unitCost: Number((sellingPriceUsd * 0.55).toFixed(2)),
          currentStock: Number(newStock) || 10,
          reorderLevel: 4,
          isSyncedToEcommerce: true,
          materialsUsed: newMaterials
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          tags: newTags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          moderationStatus: "approved",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.detail || "Failed to publish listing.");
      }
      setProducts((prev) => [json.data, ...prev]);
      setNewTitle("");
      setNewSku("");
      setNewDescription("");
      setFeedback({
        tone: "success",
        message: `Published "${json.data.name}" (${json.data.sku}) to both Astro Storefront and WAW-POS.`,
      });
    } catch (err) {
      setFeedback({ tone: "error", message: (err as Error).message });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleAdvanceOrderStatus = async (
    orderId: string,
    nextStatus: OrderDTO["status"]
  ) => {
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || "Failed to update order.");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? json.data : o))
      );
      setFeedback({
        tone: "success",
        message: `Order ${json.data.orderNumber} updated to ${nextStatus}.`,
      });
    } catch (err) {
      setFeedback({ tone: "error", message: (err as Error).message });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor) return;
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/v1/vendors/${encodeURIComponent(activeVendor.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: shopDesc,
            supportPhone: shopPhone,
            allowCod,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || "Failed to save settings.");
      setVendors((prev) =>
        prev.map((v) => (v.id === activeVendor.id ? json.data : v))
      );
      setFeedback({
        tone: "success",
        message: `Saved studio profile for ${json.data.displayName}.`,
      });
    } catch (err) {
      setFeedback({ tone: "error", message: (err as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Switcher + Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <label
              htmlFor="studio-select"
              className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium"
            >
              Active Artisan Studio
            </label>
            <select
              id="studio-select"
              value={selectedVendorId}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="text-sm font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.displayName} ({v.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start md:self-auto">
          {(
            [
              { id: "listings", label: "Listings", icon: Package },
              { id: "orders", label: "Fulfillment", icon: Truck },
              { id: "settlements", label: "Payouts", icon: Wallet },
              { id: "settings", label: "Shop Settings", icon: Store },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm flex items-center gap-2 ${
            feedback.tone === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: LISTINGS + AI PRODUCT STORY */}
      {activeTab === "listings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Publish Handcrafted Listing
                </h2>
                <p className="text-xs text-slate-500">
                  Creates a unified SKU in PostgreSQL & WAW-POS
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGeneratingStory}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#B84A27]" />
                <span>
                  {isGeneratingStory ? "Drafting..." : "AI Story Assist"}
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hand-Thrown Terracotta Tea Kettle"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="Auto if blank"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as ProductCategory)
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-slate-900 focus:outline-none"
                  >
                    <option value="pottery">Pottery</option>
                    <option value="textiles">Textiles</option>
                    <option value="woodwork">Woodwork</option>
                    <option value="jewelry">Jewelry</option>
                    <option value="leatherwork">Leatherwork</option>
                    <option value="paintings">Paintings</option>
                    <option value="handicrafts">Handicrafts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Price (BDT)
                  </label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={newPriceBdt}
                    onChange={(e) => setNewPriceBdt(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Opening Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Materials Used (comma-separated)
                </label>
                <input
                  type="text"
                  value={newMaterials}
                  onChange={(e) => setNewMaterials(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Craft Story & Care Notes
                </label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe traditional craft technique, provenance, and care..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingProduct}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {isCreatingProduct ? "Publishing..." : "Publish to Catalog"}
                </span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Studio Catalog ({vendorProducts.length})
              </h2>
              <span className="text-xs text-slate-500">
                Synced to Astro Storefront
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-5">Product</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Stock</th>
                    <th className="py-2.5 px-5">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {vendorProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">
                        {p.sku}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {formatBDT(p.priceBdt)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {p.currentStock}
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                          {p.moderationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {vendorProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        No listings yet for this studio. Publish your first
                        handcrafted piece on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS FULFILLMENT */}
      {activeTab === "orders" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Incoming Orders & Dispatch Queue ({orders.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5">Order</th>
                  <th className="py-2.5 px-4">Buyer & Address</th>
                  <th className="py-2.5 px-4">Tracking</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-3 px-5">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {ord.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        {formatBDT(Math.round(ord.totalAmount * 120))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {ord.customerName}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {ord.shippingAddress}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {ord.trackingCode || "Pending Dispatch"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right space-x-2">
                      {ord.status === "pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAdvanceOrderStatus(ord.id, "crafting")
                          }
                          className="px-2.5 py-1 rounded border border-slate-300 text-xs font-medium hover:bg-slate-50"
                        >
                          Start Crafting
                        </button>
                      )}
                      {(ord.status === "pending" ||
                        ord.status === "crafting" ||
                        ord.status === "processing") && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAdvanceOrderStatus(ord.id, "shipped")
                          }
                          className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {ord.status === "shipped" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAdvanceOrderStatus(ord.id, "delivered")
                          }
                          className="px-2.5 py-1 rounded bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800"
                        >
                          Confirm Delivery
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTLEMENTS */}
      {activeTab === "settlements" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Artisan Payout Ledger
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5">Cycle</th>
                  <th className="py-2.5 px-4">Payout Channel</th>
                  <th className="py-2.5 px-4 text-right">Gross</th>
                  <th className="py-2.5 px-4 text-right">Commission</th>
                  <th className="py-2.5 px-4 text-right">Net Payout</th>
                  <th className="py-2.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {(vendorSettlements.length > 0
                  ? vendorSettlements
                  : settlements
                ).map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-5 font-mono text-xs text-slate-700">
                      {s.periodStart} → {s.periodEnd}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {s.payoutAccountMasked}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatBDT(s.grossAmountBdt)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      -{formatBDT(s.commissionBdt)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatBDT(s.netAmountBdt)}
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                        {s.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHOP SETTINGS */}
      {activeTab === "settings" && activeVendor && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Studio Profile & COD Policy — {activeVendor.displayName}
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Studio Bio & Craft Heritage
            </label>
            <textarea
              rows={4}
              value={shopDesc}
              onChange={(e) => setShopDesc(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Support Phone
            </label>
            <input
              type="text"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-slate-900 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allowCod}
              onChange={(e) => setAllowCod(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Allow Cash on Delivery (COD) for eligible buyers</span>
          </label>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium"
          >
            Save Studio Profile
          </button>
        </form>
      )}
    </div>
  );
}
