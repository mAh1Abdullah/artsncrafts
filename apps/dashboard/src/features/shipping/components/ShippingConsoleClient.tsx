"use client";

import { useState } from "react";
import { CheckCircle2, Compass, MapPin, Plus, Truck } from "lucide-react";
import {
  formatBDT,
  type CourierProviderDTO,
  type CourierSuggestionDTO,
  type DeliveryZoneDTO,
  type OrderDTO,
  type ShipmentDTO,
} from "@waw/contracts";

interface ShippingConsoleClientProps {
  initialZones: DeliveryZoneDTO[];
  initialCouriers: CourierProviderDTO[];
  initialShipments: ShipmentDTO[];
  initialOrders: OrderDTO[];
}

export function ShippingConsoleClient({
  initialZones,
  initialCouriers,
  initialShipments,
  initialOrders,
}: ShippingConsoleClientProps) {
  const [zones, setZones] = useState(initialZones);
  const [shipments, setShipments] = useState(initialShipments);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  // Simulator state
  const [simDistrict, setSimDistrict] = useState("Dhaka");
  const [simUpazila, setSimUpazila] = useState("Banani");
  const [suggestion, setSuggestion] = useState<CourierSuggestionDTO | null>(
    null
  );

  // Manual booking state
  const [bookOrderId, setBookOrderId] = useState(initialOrders[0]?.id ?? "");
  const [bookCourier, setBookCourier] = useState<
    "pathao" | "steadfast" | "redx"
  >("pathao");

  // Tracking event form state
  const [eventShipmentId, setEventShipmentId] = useState(
    initialShipments[0]?.id ?? ""
  );
  const [eventStatus, setEventStatus] = useState<ShipmentDTO["status"]>(
    "in_transit"
  );
  const [eventLocation, setEventLocation] = useState(
    "Tejgaon Central Sorting Hub, Dhaka"
  );
  const [eventDesc, setEventDesc] = useState(
    "Parcel scanned and dispatched for last-mile delivery."
  );

  const handleTariffSave = async (zone: DeliveryZoneDTO, newPrice: number) => {
    setFeedback(null);
    const res = await fetch("/api/v1/delivery-zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idOrCode: zone.id, basePriceBdt: newPrice }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ tone: "error", message: json?.detail || "Update failed" });
      return;
    }
    setZones((prev) =>
      prev.map((z) => (z.id === zone.id ? json.data : z))
    );
    setFeedback({
      tone: "success",
      message: `Updated ${zone.name} tariff to ${formatBDT(json.data.basePriceBdt)}.`,
    });
  };

  const handleSimulateCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(
      `/api/v1/delivery-zones?suggest=true&district=${encodeURIComponent(
        simDistrict
      )}&upazila=${encodeURIComponent(simUpazila)}`
    );
    const json = await res.json();
    if (res.ok && json?.data) {
      setSuggestion(json.data);
    }
  };

  const handleBookShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookOrderId) return;
    setFeedback(null);
    const res = await fetch("/api/v1/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: bookOrderId,
        courierCode: bookCourier,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ tone: "error", message: json?.detail || "Booking failed" });
      return;
    }
    setShipments((prev) => [json.data, ...prev]);
    setEventShipmentId(json.data.id);
    setFeedback({
      tone: "success",
      message: `Booked consignment ${json.data.trackingNumber} via ${json.data.courierName}.`,
    });
  };

  const handleAppendEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventShipmentId) return;
    setFeedback(null);
    const res = await fetch(
      `/api/v1/shipments/${encodeURIComponent(eventShipmentId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: eventStatus,
          location: eventLocation,
          description: eventDesc,
        }),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      setFeedback({
        tone: "error",
        message: json?.detail || "Failed to log tracking scan",
      });
      return;
    }
    setShipments((prev) =>
      prev.map((s) => (s.id === eventShipmentId ? json.data : s))
    );
    setFeedback({
      tone: "success",
      message: `Logged "${eventStatus}" scan on ${json.data.trackingNumber}.`,
    });
  };

  return (
    <div className="space-y-6">
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

      {/* Delivery Zones & Courier Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Bangladesh Delivery Zone Tariffs
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-sm text-slate-900">
                    {zone.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {zone.code} · ETA {zone.estimatedDeliveryDaysMin}–
                    {zone.estimatedDeliveryDaysMax} days
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">৳</span>
                  <input
                    type="number"
                    defaultValue={zone.basePriceBdt}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val) && val !== zone.basePriceBdt) {
                        handleTariffSave(zone, val);
                      }
                    }}
                    className="w-24 rounded-md border border-slate-300 px-2.5 py-1 text-sm font-mono text-right tabular-nums"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Courier Suggestion Simulator */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Courier Routing Simulator
            </h2>
          </div>
          <form onSubmit={handleSimulateCourier} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  District
                </label>
                <select
                  value={simDistrict}
                  onChange={(e) => setSimDistrict(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm bg-white"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Bandarban">Bandarban (Remote)</option>
                  <option value="Sunamganj">Sunamganj (Remote)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Upazila / Area
                </label>
                <input
                  type="text"
                  value={simUpazila}
                  onChange={(e) => setSimUpazila(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 hover:bg-slate-800 text-white py-2 text-xs font-medium"
            >
              Evaluate Optimal Courier
            </button>
          </form>

          {suggestion && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>{suggestion.recommendedCourier.name}</span>
                <span className="font-mono">
                  {suggestion.confidenceScore}% match
                </span>
              </div>
              <div className="text-slate-600">
                Zone: {suggestion.zone.name} · Estimated Fee:{" "}
                <strong className="font-mono">
                  {formatBDT(suggestion.estimatedFeeBdt)}
                </strong>
              </div>
              <div className="text-slate-500 font-mono">
                COD {suggestion.scoringBreakdown.codScore} · Speed{" "}
                {suggestion.scoringBreakdown.speedScore} · Price{" "}
                {suggestion.scoringBreakdown.priceScore}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Connected Couriers
            </div>
            <div className="space-y-1.5">
              {initialCouriers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs text-slate-700"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-slate-500">
                    ~{c.avgDeliveryHours}h · {formatBDT(c.basePriceBdt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking + Tracking Event Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleBookShipment}
          className="bg-white border border-slate-200 rounded-lg p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Book New Courier Consignment
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Order
              </label>
              <select
                value={bookOrderId}
                onChange={(e) => setBookOrderId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm bg-white"
              >
                {initialOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Courier Provider
              </label>
              <select
                value={bookCourier}
                onChange={(e) =>
                  setBookCourier(
                    e.target.value as "pathao" | "steadfast" | "redx"
                  )
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm bg-white"
              >
                <option value="pathao">Pathao Logistics</option>
                <option value="steadfast">Steadfast Courier</option>
                <option value="redx">RedX Delivery</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Generate Consignment</span>
          </button>
        </form>

        <form
          onSubmit={handleAppendEvent}
          className="bg-white border border-slate-200 rounded-lg p-5 space-y-3"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Append Tracking Scan Event
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Shipment
              </label>
              <select
                value={eventShipmentId}
                onChange={(e) => setEventShipmentId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm bg-white font-mono"
              >
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} ({s.orderNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Scan Status
              </label>
              <select
                value={eventStatus}
                onChange={(e) =>
                  setEventStatus(e.target.value as ShipmentDTO["status"])
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm bg-white"
              >
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Hub / Location"
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
            />
            <input
              type="text"
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder="Scan notes"
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white px-4 py-2 text-xs font-medium transition-colors"
          >
            Append Event to Timeline
          </button>
        </form>
      </div>

      {/* Shipments Timeline List */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Active Consignments & Append-Only Tracking Logs ({shipments.length})
          </h2>
        </div>
        {shipments.map((s) => (
          <div key={s.id} className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-slate-900">
                  {s.trackingNumber}
                </span>
                <span className="text-xs text-slate-500">
                  {s.courierName} · Order {s.orderNumber}
                </span>
              </div>
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                {s.status.replace("_", " ")}
              </span>
            </div>
            <div className="pl-3 border-l border-slate-200 space-y-2">
              {s.events.map((ev) => (
                <div key={ev.id} className="text-xs flex flex-wrap gap-2">
                  <span className="font-mono text-slate-400">
                    {new Date(ev.eventTimestamp).toLocaleString()}
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {ev.status.replace("_", " ")}
                  </span>
                  <span className="text-slate-600">
                    — {ev.location}: {ev.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
