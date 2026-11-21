"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Copy,
  DollarSign,
  Plus,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

export interface ResellerAffiliate {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  commissionRate: number; // e.g. 10%
  totalSalesGenerated: number;
  unpaidCommission: number;
  totalPaidCommission: number;
  status: "active" | "suspended";
}

export interface CampaignLandingPage {
  id: string;
  title: string;
  productName: string;
  slug: string;
  discountPercentage: number;
  visits: number;
  orders: number;
  conversionRate: number;
  status: "active" | "paused";
}

export function ResellerMarketingHub() {
  const [activeSubTab, setActiveSubTab] = useState<"resellers" | "landing_pages" | "vendors">("resellers");

  // Resellers State
  const [resellers, setResellers] = useState<ResellerAffiliate[]>([
    {
      id: "aff-001",
      name: "Sylhet Lifestyle Influencer Group",
      phone: "+880 1711-223344",
      referralCode: "SYLHET10",
      commissionRate: 10,
      totalSalesGenerated: 2450.0,
      unpaidCommission: 245.0,
      totalPaidCommission: 850.0,
      status: "active",
    },
    {
      id: "aff-002",
      name: "Dhaka Craft Box Deals",
      phone: "+880 1822-445566",
      referralCode: "DHAKA5",
      commissionRate: 7.5,
      totalSalesGenerated: 1820.0,
      unpaidCommission: 136.5,
      totalPaidCommission: 450.0,
      status: "active",
    },
    {
      id: "aff-003",
      name: "Artisan Guild Ambassadors",
      phone: "+880 1933-778899",
      referralCode: "GUILD12",
      commissionRate: 12,
      totalSalesGenerated: 980.0,
      unpaidCommission: 0.0,
      totalPaidCommission: 117.6,
      status: "active",
    },
  ]);

  // Landing Page Campaigns State
  const [campaigns, setCampaigns] = useState<CampaignLandingPage[]>([
    {
      id: "camp-01",
      title: "Sylhet Cane Basket Exclusive Flash Sale",
      productName: "Handcrafted Cane Basket",
      slug: "sylhet-cane-sale",
      discountPercentage: 20,
      visits: 1420,
      orders: 86,
      conversionRate: 6.05,
      status: "active",
    },
    {
      id: "camp-02",
      title: "Traditional Shital Pati Summer Festival",
      productName: "Traditional Shital Pati Mat",
      slug: "shital-pati-festival",
      discountPercentage: 15,
      visits: 890,
      orders: 42,
      conversionRate: 4.71,
      status: "active",
    },
  ]);

  // Modals
  const [isAddResellerOpen, setIsAddResellerOpen] = useState(false);
  const [newResellerName, setNewResellerName] = useState("");
  const [newResellerPhone, setNewResellerPhone] = useState("");
  const [newResellerCode, setNewResellerCode] = useState("");
  const [newResellerRate, setNewResellerRate] = useState("10");

  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState("");
  const [newCampProduct, setNewCampProduct] = useState("Handcrafted Cane Basket");
  const [newCampDiscount, setNewCampDiscount] = useState("15");

  // Create Reseller
  const handleCreateReseller = (e: React.FormEvent) => {
    e.preventDefault();
    const newAff: ResellerAffiliate = {
      id: `aff-${Date.now()}`,
      name: newResellerName,
      phone: newResellerPhone,
      referralCode: newResellerCode.toUpperCase().replace(/\s+/g, ""),
      commissionRate: Number(newResellerRate) || 10,
      totalSalesGenerated: 0,
      unpaidCommission: 0,
      totalPaidCommission: 0,
      status: "active",
    };
    setResellers([newAff, ...resellers]);
    setIsAddResellerOpen(false);
    setNewResellerName("");
    setNewResellerPhone("");
    setNewResellerCode("");
  };

  // Settle Reseller Commission
  const handleSettlePayout = (id: string) => {
    setResellers(
      resellers.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            totalPaidCommission: r.totalPaidCommission + r.unpaidCommission,
            unpaidCommission: 0,
          };
        }
        return r;
      })
    );
    alert("Commission payout recorded and marked as settled!");
  };

  // Create Campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newCampTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newCamp: CampaignLandingPage = {
      id: `camp-${Date.now()}`,
      title: newCampTitle,
      productName: newCampProduct,
      slug,
      discountPercentage: Number(newCampDiscount) || 10,
      visits: 1,
      orders: 0,
      conversionRate: 0,
      status: "active",
    };
    setCampaigns([newCamp, ...campaigns]);
    setIsAddCampaignOpen(false);
    setNewCampTitle("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Reseller Program & Landing Page Engine
            </h2>
            <Badge className="bg-emerald-600 text-white text-[10px]">Growth Hub</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Affiliate commission ledger, viral single-product landing pages, and vendor catalog isolation.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab("resellers")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeSubTab === "resellers" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>Reseller / Affiliate Ledger ({resellers.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab("landing_pages")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeSubTab === "landing_pages" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Single-Product Landing Pages ({campaigns.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab("vendors")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeSubTab === "vendors" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Store className="h-3.5 w-3.5" />
            <span>Multi-Vendor Segregation</span>
          </div>
        </button>
      </div>

      {/* SUBTAB 1: RESELLER / AFFILIATES */}
      {activeSubTab === "resellers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Affiliate Commission Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage partner referral codes, auto-calculate commission earnings, and disburse payouts.
              </p>
            </div>
            <Button
              onClick={() => setIsAddResellerOpen(true)}
              className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Invite New Reseller
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Reseller / Partner</TableHead>
                  <TableHead className="text-xs font-semibold">Promo Code</TableHead>
                  <TableHead className="text-xs font-semibold">Commission Rate</TableHead>
                  <TableHead className="text-xs font-semibold">Sales Generated</TableHead>
                  <TableHead className="text-xs font-semibold">Unpaid Commission</TableHead>
                  <TableHead className="text-xs font-semibold">Lifetime Paid</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers.map((r) => (
                  <TableRow key={r.id} className="text-xs hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{r.phone}</div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                        {r.referralCode}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-800">{r.commissionRate}%</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold font-mono text-slate-900">${r.totalSalesGenerated.toFixed(2)}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold font-mono text-emerald-700">${r.unpaidCommission.toFixed(2)}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-slate-500">${r.totalPaidCommission.toFixed(2)}</span>
                    </TableCell>

                    <TableCell className="text-right">
                      {r.unpaidCommission > 0 ? (
                        <Button
                          size="sm"
                          onClick={() => handleSettlePayout(r.id)}
                          className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          Settle Payout
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-400">
                          Settled
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: LANDING PAGES */}
      {activeSubTab === "landing_pages" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Promotional Single-Product Landing Pages</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate high-converting mobile landing pages with 1-click bKash checkout for Facebook/TikTok ads.
              </p>
            </div>
            <Button
              onClick={() => setIsAddCampaignOpen(true)}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Landing Campaign
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <Card key={camp.id} className="border-slate-200 shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">{camp.title}</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                      {camp.discountPercentage}% OFF Active
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    Product: {camp.productName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border text-center">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase">Visitors</div>
                      <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">{camp.visits}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase">Orders</div>
                      <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">{camp.orders}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase">Conv. Rate</div>
                      <div className="font-bold font-mono text-emerald-600 text-sm mt-0.5">{camp.conversionRate}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-slate-600">
                    <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded truncate max-w-[220px]">
                      /campaign/{camp.slug}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard?.writeText(`https://wawpos.store/campaign/${camp.slug}`);
                        alert("Campaign URL copied to clipboard!");
                      }}
                      className="h-7 text-[10px]"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: MULTI-VENDOR SEGREGATION */}
      {activeSubTab === "vendors" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Sylhet Cane Guild</CardTitle>
              <CardDescription className="text-xs">Vendor ID: VEND-001 (Artisan Bamboo/Cane)</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Active SKUs:</span>
                <span className="font-semibold text-slate-900">4 Products</span>
              </div>
              <div className="flex justify-between">
                <span>Stock in Hand:</span>
                <span className="font-semibold text-emerald-600">85 Units</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Share:</span>
                <span className="font-mono text-slate-800">85% / 15% Store Cut</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Dhaka Handloom Weavers</CardTitle>
              <CardDescription className="text-xs">Vendor ID: VEND-002 (Textile & Khadi)</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Active SKUs:</span>
                <span className="font-semibold text-slate-900">3 Products</span>
              </div>
              <div className="flex justify-between">
                <span>Stock in Hand:</span>
                <span className="font-semibold text-emerald-600">62 Units</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Share:</span>
                <span className="font-mono text-slate-800">80% / 20% Store Cut</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Hazaribagh Leathercrafts</CardTitle>
              <CardDescription className="text-xs">Vendor ID: VEND-003 (Pure Leather Accessories)</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Active SKUs:</span>
                <span className="font-semibold text-slate-900">2 Products</span>
              </div>
              <div className="flex justify-between">
                <span>Stock in Hand:</span>
                <span className="font-semibold text-emerald-600">40 Units</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Share:</span>
                <span className="font-mono text-slate-800">88% / 12% Store Cut</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: ADD RESELLER */}
      <Dialog open={isAddResellerOpen} onOpenChange={setIsAddResellerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleCreateReseller}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register Reseller / Affiliate</DialogTitle>
              <DialogDescription className="text-xs">
                Create a new referral partner profile and assign customized commission percentages.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <Label className="text-xs">Partner / Influencer Name *</Label>
                <Input
                  required
                  value={newResellerName}
                  onChange={(e) => setNewResellerName(e.target.value)}
                  placeholder="e.g. Sylhet Deals Network"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Phone Number *</Label>
                <Input
                  required
                  value={newResellerPhone}
                  onChange={(e) => setNewResellerPhone(e.target.value)}
                  placeholder="+880 17XX-XXXXXX"
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">Unique Promo Code *</Label>
                <Input
                  required
                  value={newResellerCode}
                  onChange={(e) => setNewResellerCode(e.target.value)}
                  placeholder="e.g. SYLHET2026"
                  className="mt-1 font-mono uppercase"
                />
              </div>

              <div>
                <Label className="text-xs">Commission Rate (%) *</Label>
                <Input
                  type="number"
                  required
                  value={newResellerRate}
                  onChange={(e) => setNewResellerRate(e.target.value)}
                  placeholder="10"
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddResellerOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-slate-900 text-white">
                Save Partner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD LANDING CAMPAIGN */}
      <Dialog open={isAddCampaignOpen} onOpenChange={setIsAddCampaignOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleCreateCampaign}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Create Single-Product Landing Page</DialogTitle>
              <DialogDescription className="text-xs">
                Build a conversion-focused landing campaign with instant checkout.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <Label className="text-xs">Campaign Headline *</Label>
                <Input
                  required
                  value={newCampTitle}
                  onChange={(e) => setNewCampTitle(e.target.value)}
                  placeholder="e.g. 50% Weekend Blowout Cane Handbags"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Select Product *</Label>
                <select
                  value={newCampProduct}
                  onChange={(e) => setNewCampProduct(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
                >
                  <option value="Handcrafted Cane Basket">Handcrafted Cane Basket</option>
                  <option value="Traditional Shital Pati Mat">Traditional Shital Pati Mat</option>
                  <option value="Artisan Khadi Cotton Shirt">Artisan Khadi Cotton Shirt</option>
                  <option value="Leather Keyholder & Card Case">Leather Keyholder & Card Case</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Discount Percentage (%) *</Label>
                <Input
                  type="number"
                  required
                  value={newCampDiscount}
                  onChange={(e) => setNewCampDiscount(e.target.value)}
                  placeholder="15"
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddCampaignOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-indigo-600 text-white">
                Launch Campaign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
