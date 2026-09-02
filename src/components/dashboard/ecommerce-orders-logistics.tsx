"use client";

import { useState, useEffect } from "react";
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
  Clock,
  DollarSign,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Zap,
} from "lucide-react";

export interface EcommerceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  advanceAmount: number;
  dueBalance: number;
  paymentMethod: "bkash" | "nagad" | "uddoktapay" | "amarpay" | "cod" | "card" | "cash";
  paymentStatus: "paid" | "partial" | "unpaid";
  status: "pending" | "completed" | "voided" | "incomplete" | "cancelled";
  courierService: "pathao" | "steadfast" | null;
  trackingCode: string | null;
  courierStatus?: "pending_pickup" | "in_transit" | "delivered" | "returned";
  fraudRiskScore: number;
  fraudRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  fraudSignals?: string[];
  notes?: string;
  createdAt: string;
}

export interface AbandonedCartRecord {
  id: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalValue: number;
  recoveryStatus: "pending" | "recovered" | "lost";
  recoveryAttempts: number;
  lastReminderSentAt?: string;
  createdAt: string;
}

interface Props {
  subscriptionTier?: string;
  canManageEcommerce?: boolean;
}

export function EcommerceOrdersLogistics({ subscriptionTier = "Enterprise", canManageEcommerce = true }: Props) {
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCartRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subTab, setSubTab] = useState<"orders" | "abandoned" | "gateways" | "tracking">("orders");

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierService, setCourierService] = useState<"pathao" | "steadfast">("pathao");
  const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifyResult, setOtpVerifyResult] = useState<string | null>(null);
  const [isAdvancePaymentModalOpen, setIsAdvancePaymentModalOpen] = useState(false);
  const [newAdvanceInput, setNewAdvanceInput] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/orders");
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAbandonedCarts = async () => {
    try {
      const res = await fetch("/api/v1/orders/abandoned-carts");
      const data = await res.json();
      if (data.success && data.abandonedCarts) {
        setAbandonedCarts(data.abandonedCarts);
      }
    } catch (e) {
      console.error("Failed to fetch abandoned carts:", e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAbandonedCarts();
  }, []);

  // Book Courier Handler
  const handleBookCourier = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch("/api/v1/orders/courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          courierService,
          recipientName: selectedOrder.customerName,
          recipientPhone: selectedOrder.customerPhone,
          recipientAddress: selectedOrder.shippingAddress,
          amountToCollect: selectedOrder.dueBalance,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local order
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? {
                  ...o,
                  courierService,
                  trackingCode: data.consignmentId,
                  courierStatus: "pending_pickup",
                }
              : o
          )
        );
        setIsCourierModalOpen(false);
        alert(`Parcel successfully booked with ${courierService.toUpperCase()}!\nConsignment ID: ${data.consignmentId}`);
      }
    } catch (e) {
      alert(`Booking error: ${(e as Error).message}`);
    }
  };

  // Settle Advance Payment Handler
  const handleUpdateAdvance = async () => {
    if (!selectedOrder) return;
    const amount = Number(newAdvanceInput);
    if (isNaN(amount) || amount < 0) return;

    try {
      const res = await fetch("/api/v1/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          advanceAmount: amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === selectedOrder.id ? data.order : o))
        );
        setIsAdvancePaymentModalOpen(false);
      }
    } catch (e) {
      alert(`Update error: ${(e as Error).message}`);
    }
  };

  // Send OTP
  const handleSendOTP = async (phone: string) => {
    setSmsPhone(phone);
    setIsSmsModalOpen(true);
    setSmsStatus("Dispatching OTP via local Bangladeshi SMS gateway...");
    try {
      const res = await fetch("/api/v1/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatus(`OTP Sent! (Demo code: ${data.otpDemo})`);
      }
    } catch (e) {
      setSmsStatus(`Failed to send SMS: ${(e as Error).message}`);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    try {
      const res = await fetch("/api/v1/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", phone: smsPhone, otp: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpVerifyResult("Customer Verified Successfully (OTP Validated)");
      } else {
        setOtpVerifyResult(`Verification Failed: ${data.error}`);
      }
    } catch (e) {
      setOtpVerifyResult(`Verification Error: ${(e as Error).message}`);
    }
  };

  // Send Abandoned Cart Reminder
  const handleSendCartReminder = async (cartId: string) => {
    try {
      const res = await fetch("/api/v1/orders/abandoned-carts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, action: "send_reminder" }),
      });
      const data = await res.json();
      if (data.success) {
        setAbandonedCarts((prev) =>
          prev.map((c) => (c.id === cartId ? data.cart : c))
        );
        alert("Recovery SMS / WhatsApp Offer sent with 5% promo code!");
      }
    } catch (e) {
      alert(`Reminder failed: ${(e as Error).message}`);
    }
  };

  // Filtering
  const filteredOrders = orders.filter((o) => {
    const matchQuery =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      (o.trackingCode && o.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // Analytics Metrics
  const totalOrdersAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAdvanceCollected = orders.reduce((sum, o) => sum + o.advanceAmount, 0);
  const totalDuePending = orders.reduce((sum, o) => sum + o.dueBalance, 0);
  const highRiskCount = orders.filter((o) => o.fraudRiskLevel === "HIGH").length;
  const activeShipmentsCount = orders.filter((o) => o.courierService && o.courierStatus !== "delivered").length;

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Bangladeshi E-Commerce, Gateways & Logistics
            </h2>
            <Badge className="bg-indigo-600 text-white text-[10px] uppercase">
              {subscriptionTier} Tier • {canManageEcommerce ? "Full Access" : "Read Only"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Native bKash, Nagad, AmarPay, UddoktaPay, Pathao & Steadfast Courier integrations with Fraud AI.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchOrders();
              fetchAbandonedCarts();
            }}
            disabled={isLoading}
            className="h-9 text-xs bg-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total Online Orders</span>
              <ShoppingBag className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${totalOrdersAmount.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{orders.length} transactions logged</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Advance Collected</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              ${totalAdvanceCollected.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">MFS & Gateway Prepayments</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Due Balance (COD)</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">
              ${totalDuePending.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Payable at courier delivery</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Active Shipments</span>
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {activeShipmentsCount} Parcels
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Pathao & Steadfast Live</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Fraud Risk Flags</span>
              <ShieldAlert className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-xl font-bold font-mono text-red-700 mt-1">
              {highRiskCount} Orders
            </div>
            <div className="text-[11px] text-red-500 font-medium mt-0.5">Requires Phone Verification</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setSubTab("orders")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            subTab === "orders" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Online Orders & COD Tenders ({orders.length})</span>
          </div>
        </button>
        <button
          onClick={() => setSubTab("abandoned")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            subTab === "abandoned" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Abandoned Cart Recovery ({abandonedCarts.length})</span>
          </div>
        </button>
        <button
          onClick={() => setSubTab("gateways")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            subTab === "gateways" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span>Payment Gateways & Webhooks</span>
          </div>
        </button>
      </div>

      {/* SUBTAB 1: ORDERS & COD TENDERS */}
      {subTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search order #, customer, phone, or tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Order / Customer</TableHead>
                  <TableHead className="text-xs font-semibold">Items</TableHead>
                  <TableHead className="text-xs font-semibold">Total Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Advance & Due</TableHead>
                  <TableHead className="text-xs font-semibold">Payment Method</TableHead>
                  <TableHead className="text-xs font-semibold">Fraud Risk</TableHead>
                  <TableHead className="text-xs font-semibold">Courier & Logistics</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="text-xs hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-bold text-slate-900">{order.orderNumber}</div>
                      <div className="font-medium text-slate-700 mt-0.5">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                        <PhoneCall className="h-2.5 w-2.5" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[180px] truncate text-slate-800 font-medium">
                        {order.items.map((it) => `${it.productName} (×${it.quantity})`).join(", ")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {order.items.reduce((s, it) => s + it.quantity, 0)} total units
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold font-mono text-slate-900">${order.totalAmount.toFixed(2)}</div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-semibold mt-0.5 ${
                          order.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-emerald-700 font-semibold font-mono">
                        Adv: ${order.advanceAmount.toFixed(2)}
                      </div>
                      <div
                        className={`font-mono text-[11px] ${
                          order.dueBalance > 0 ? "text-red-600 font-bold" : "text-slate-400"
                        }`}
                      >
                        Due: ${order.dueBalance.toFixed(2)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-bold tracking-wide flex items-center w-fit space-x-1"
                      >
                        {order.paymentMethod === "bkash" && (
                          <span className="text-pink-600 font-extrabold">bKash</span>
                        )}
                        {order.paymentMethod === "nagad" && (
                          <span className="text-orange-600 font-extrabold">Nagad</span>
                        )}
                        {order.paymentMethod === "amarpay" && (
                          <span className="text-indigo-600 font-extrabold">AmarPay</span>
                        )}
                        {order.paymentMethod === "uddoktapay" && (
                          <span className="text-blue-600 font-extrabold">UddoktaPay</span>
                        )}
                        {order.paymentMethod === "cod" && (
                          <span className="text-slate-700 font-bold">COD / Manual</span>
                        )}
                        {order.paymentMethod === "card" && (
                          <span className="text-slate-700 font-bold">Card</span>
                        )}
                      </Badge>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">{order.paymentStatus}</div>
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsFraudModalOpen(true);
                        }}
                        className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.fraudRiskLevel === "HIGH"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : order.fraudRiskLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {order.fraudRiskLevel === "HIGH" ? (
                          <ShieldAlert className="h-3 w-3" />
                        ) : (
                          <ShieldCheck className="h-3 w-3" />
                        )}
                        <span>{order.fraudRiskLevel} ({order.fraudRiskScore})</span>
                      </button>
                    </TableCell>

                    <TableCell>
                      {order.courierService ? (
                        <div>
                          <div className="flex items-center space-x-1">
                            <Truck className="h-3 w-3 text-indigo-600" />
                            <span className="font-bold text-slate-900 uppercase text-[10px]">
                              {order.courierService}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">{order.trackingCode}</div>
                          <Badge variant="outline" className="text-[9px] capitalize text-blue-700 bg-blue-50 border-blue-200 mt-0.5">
                            {order.courierStatus?.replace("_", " ")}
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsCourierModalOpen(true);
                          }}
                          className="h-7 text-[10px] bg-slate-50 hover:bg-slate-100 font-semibold"
                        >
                          <Truck className="h-3 w-3 mr-1 text-slate-600" />
                          Book Courier
                        </Button>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendOTP(order.customerPhone)}
                          title="Verify via OTP"
                          className="h-7 w-7 p-0"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewAdvanceInput(String(order.advanceAmount));
                            setIsAdvancePaymentModalOpen(true);
                          }}
                          title="Update Advance / Due"
                          className="h-7 w-7 p-0"
                        >
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ABANDONED CARTS */}
      {subTab === "abandoned" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Abandoned Cart Recovery Desk</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers who initiated checkout but abandoned without completing payment or COD confirmation.
                </p>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {abandonedCarts.filter((c) => c.recoveryStatus === "pending").length} Recoverable Leads
              </Badge>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Customer Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Cart Items</TableHead>
                  <TableHead className="text-xs font-semibold">Cart Value</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Reminders Sent</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Recovery Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abandonedCarts.map((cart) => (
                  <TableRow key={cart.id} className="text-xs hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-bold text-slate-900 font-mono">{cart.customerPhone}</div>
                      {cart.customerName && (
                        <div className="text-[11px] text-slate-500">{cart.customerName}</div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[240px] truncate text-slate-700 font-medium">
                        {cart.items.map((it) => `${it.productName} (×${it.quantity})`).join(", ")}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold font-mono text-slate-900">${cart.totalValue.toFixed(2)}</div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize font-semibold ${
                          cart.recoveryStatus === "recovered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : cart.recoveryStatus === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {cart.recoveryStatus}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-slate-600 font-medium">{cart.recoveryAttempts} attempts</div>
                      {cart.lastReminderSentAt && (
                        <div className="text-[10px] text-slate-400">Last: {new Date(cart.lastReminderSentAt).toLocaleTimeString()}</div>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleSendCartReminder(cart.id)}
                        className="h-7 text-[11px] bg-slate-900 hover:bg-slate-800 text-white font-medium"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send SMS / WhatsApp Promo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PAYMENT GATEWAYS & WEBHOOK CONFIG */}
      {subTab === "gateways" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs">
                    bK
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">bKash Payment Gateway</CardTitle>
                    <CardDescription className="text-xs">Direct Merchant MFS API</CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Connected</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Merchant Number:</span>
                <span className="font-mono font-semibold">+880 1700-000111</span>
              </div>
              <div className="flex justify-between">
                <span>Webhook URL:</span>
                <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">/api/v1/orders/webhook</code>
              </div>
              <div className="flex justify-between">
                <span>Partial Advance Supported:</span>
                <span className="text-emerald-600 font-semibold">Enabled</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                    NG
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Nagad Payment Gateway</CardTitle>
                    <CardDescription className="text-xs">Postal Mobile Financial Service</CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Connected</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Merchant ID:</span>
                <span className="font-mono font-semibold">NG-MERCH-88019</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement Speed:</span>
                <span className="text-emerald-600 font-semibold">T+0 Instant</span>
              </div>
              <div className="flex justify-between">
                <span>Auto Refund Bridge:</span>
                <span className="text-slate-700 font-medium">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    AP
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">AmarPay Aggregator</CardTitle>
                    <CardDescription className="text-xs">Cards, MFS & Internet Banking</CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Store ID:</span>
                <span className="font-mono font-semibold">wawpos_sylhet</span>
              </div>
              <div className="flex justify-between">
                <span>Supported Channels:</span>
                <span className="font-semibold text-slate-800">Visa, MC, bKash, Rocket, Citytouch</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    UP
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">UddoktaPay</CardTitle>
                    <CardDescription className="text-xs">Automated Small Merchant Gateway</CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Webhook Trigger:</span>
                <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">/api/v1/orders/webhook</code>
              </div>
              <div className="flex justify-between">
                <span>API Status:</span>
                <span className="text-emerald-600 font-semibold">Operational (100% SLA)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COURIER BOOKING (PATHAO / STEADFAST) */}
      {/* ========================================================================= */}
      <Dialog open={isCourierModalOpen} onOpenChange={setIsCourierModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center">
              <Truck className="h-4 w-4 mr-2 text-indigo-600" />
              Book Parcel Delivery
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dispatch order #{selectedOrder?.orderNumber} via Pathao or Steadfast Logistics API.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-mono text-slate-800">{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-right text-slate-800 truncate max-w-[240px]">{selectedOrder.shippingAddress}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-800">COD Cash to Collect:</span>
                  <span className="font-mono font-bold text-red-600">${selectedOrder.dueBalance.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Select Courier Service Provider</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setCourierService("pathao")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      courierService === "pathao"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold">Pathao Courier</div>
                    <div className={`text-[10px] mt-0.5 ${courierService === "pathao" ? "text-slate-300" : "text-slate-500"}`}>
                      Fast Metro & City Delivery (24-48h)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourierService("steadfast")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      courierService === "steadfast"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold">Steadfast Courier</div>
                    <div className={`text-[10px] mt-0.5 ${courierService === "steadfast" ? "text-slate-300" : "text-slate-500"}`}>
                      National Coverage (All 64 Districts)
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCourierModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleBookCourier} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Confirm & Book Parcel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: FRAUD RISK HEURISTIC DETAILS */}
      {/* ========================================================================= */}
      <Dialog open={isFraudModalOpen} onOpenChange={setIsFraudModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-red-600" />
              Automated Fraud Risk Evaluation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Algorithmic order risk assessment based on past transaction history and MFS signals.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Risk Level Score</div>
                <div
                  className={`text-2xl font-bold font-mono mt-1 ${
                    selectedOrder.fraudRiskLevel === "HIGH"
                      ? "text-red-600"
                      : selectedOrder.fraudRiskLevel === "MEDIUM"
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {selectedOrder.fraudRiskLevel} ({selectedOrder.fraudRiskScore})
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-slate-900">Evaluated Risk Signals:</div>
                <ul className="space-y-1 text-slate-700">
                  {selectedOrder.fraudSignals && selectedOrder.fraudSignals.length > 0 ? (
                    selectedOrder.fraudSignals.map((sig, i) => (
                      <li key={i} className="flex items-center space-x-2 bg-slate-100 p-2 rounded">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                        <span>{sig}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400">Standard clean profile</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsFraudModalOpen(false)} className="text-xs bg-slate-900 text-white">
              Close Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: OTP VERIFICATION / SMS GATEWAY */}
      {/* ========================================================================= */}
      <Dialog open={isSmsModalOpen} onOpenChange={setIsSmsModalOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-indigo-600" />
              SMS OTP Verification Gateway
            </DialogTitle>
            <DialogDescription className="text-xs">
              Verify customer order authentication via local Bulk SMS API.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} className="mt-1 font-mono" />
            </div>

            {smsStatus && (
              <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded text-xs font-medium">
                {smsStatus}
              </div>
            )}

            <div>
              <Label className="text-xs">Enter 6-Digit OTP Code</Label>
              <Input
                placeholder="e.g. 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="mt-1 font-mono text-center tracking-widest font-bold text-sm"
              />
            </div>

            {otpVerifyResult && (
              <div className="p-2 bg-slate-100 rounded text-xs font-semibold text-slate-900">
                {otpVerifyResult}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSmsModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleVerifyOTP} className="text-xs bg-indigo-600 text-white">
              Verify OTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: UPDATE ADVANCE PAYMENT / DUE */}
      {/* ========================================================================= */}
      <Dialog open={isAdvancePaymentModalOpen} onOpenChange={setIsAdvancePaymentModalOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Update Advance & Due Balance</DialogTitle>
            <DialogDescription className="text-xs">
              Record manual bKash/Nagad advance payment or settle due balance.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order Total:</span>
                <span className="font-mono font-bold text-slate-900">${selectedOrder.totalAmount.toFixed(2)}</span>
              </div>

              <div>
                <Label className="text-xs">Advance Amount Paid ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newAdvanceInput}
                  onChange={(e) => setNewAdvanceInput(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>

              <div className="flex justify-between text-xs font-bold pt-1 border-t">
                <span>Calculated Due Balance:</span>
                <span className="font-mono text-red-600">
                  ${Math.max(0, selectedOrder.totalAmount - (Number(newAdvanceInput) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAdvancePaymentModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleUpdateAdvance} className="text-xs bg-slate-900 text-white">
              Save Payment Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
