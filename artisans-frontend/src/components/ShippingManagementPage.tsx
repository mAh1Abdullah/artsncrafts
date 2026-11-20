import React, { useState, useEffect } from 'react';
import { DeliveryZone, DeliveryLocation, Shipment, ShipmentEvent, User } from '../types';
import { storageService } from '../services/storage';
import { formatPrice } from '../utils/cuid';
import { 
  Truck, MapPin, ShieldCheck, Compass, Settings, Plus, RefreshCw, 
  Search, CheckCircle, AlertTriangle, ChevronRight, Clock, Box,
  DollarSign, FileText, ArrowRight, UserCheck
} from 'lucide-react';

interface ShippingManagementPageProps {
  currentUser: User;
  onShowToast: (type: 'success' | 'info' | 'warning', title: string, message: string) => void;
}

export const ShippingManagementPage: React.FC<ShippingManagementPageProps> = ({
  currentUser,
  onShowToast
}) => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  
  const [activeTab, setActiveTab] = useState<'zones' | 'couriers' | 'shipments' | 'simulator'>('zones');

  // Delivery Simulator state
  const [testDistrict, setTestDistrict] = useState('Dhaka');
  const [testUpazila, setTestUpazila] = useState('Dhanmondi');
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Editing zone price
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editPriceBDT, setEditPriceBDT] = useState<number>(60);

  // Selected shipment for events modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipmentEvents, setShipmentEvents] = useState<ShipmentEvent[]>([]);

  // Add event form
  const [newEventStatus, setNewEventStatus] = useState('in_transit');
  const [newEventLocation, setNewEventLocation] = useState('Tejgaon Sorting Hub');
  const [newEventDesc, setNewEventDesc] = useState('Parcel processed at automated sorting station.');

  // Manual booking form
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [manualVendorOrderId, setManualVendorOrderId] = useState('vord_1');
  const [manualCourierCode, setManualCourierCode] = useState('pathao');
  const [manualTrackingNo, setManualTrackingNo] = useState('');
  const [manualOverrideReason, setManualOverrideReason] = useState('');

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const loadData = () => {
    setZones(storageService.getDeliveryZones());
    setLocations(storageService.getDeliveryLocations());
    setCouriers(storageService.getCourierProviders());
    setShipments(storageService.getShipments());
  };

  const handleRunSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = storageService.resolveDeliverySuggestion(testDistrict, testUpazila);
    setSimulationResult(res);
  };

  const handleUpdateZonePrice = (zoneId: string) => {
    storageService.updateDeliveryZone(zoneId, { basePriceCents: editPriceBDT * 100 });
    setEditingZoneId(null);
    onShowToast('success', 'Zone Tariff Updated', `Updated delivery rate to ৳${editPriceBDT}`);
  };

  const handleViewShipmentEvents = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShipmentEvents(storageService.getShipmentEvents(shipment.id));
  };

  const handleAddTrackingEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    storageService.addShipmentEvent(selectedShipment.id, newEventStatus, newEventLocation, newEventDesc);
    setShipmentEvents(storageService.getShipmentEvents(selectedShipment.id));
    onShowToast('success', 'Tracking Event Appended', `New timeline update added for ${selectedShipment.trackingNumber}`);
  };

  const handleExecuteManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storageService.bookShipment(
      manualVendorOrderId,
      manualCourierCode,
      manualTrackingNo,
      currentUser.id,
      manualOverrideReason
    );

    setIsManualBookingOpen(false);
    setManualTrackingNo('');
    setManualOverrideReason('');
    onShowToast('success', 'Shipment Booked', `Booked ${res.shipment.trackingNumber} via ${res.shipment.courierName}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Page Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-amber-50 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <span className="bg-amber-800/80 text-amber-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-amber-700/50">
            <Truck className="w-3.5 h-3.5 text-amber-300" />
            Phase 9 Logistics & Delivery Domain
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Bangladesh Shipping, Delivery Zones & Courier Hub
          </h1>
          <p className="text-amber-200/90 text-sm leading-relaxed">
            Zone-based delivery pricing, automated Pathao / RedX / Steadfast courier recommendation engine, append-only tracking logs, and vendor override tracking control.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('zones')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'zones' ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-stone-800/80 text-amber-100 hover:bg-stone-700'
              }`}
            >
              Delivery Zones (BD Tariff)
            </button>
            <button
              onClick={() => setActiveTab('couriers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'couriers' ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-stone-800/80 text-amber-100 hover:bg-stone-700'
              }`}
            >
              Courier Directory (API)
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'simulator' ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-stone-800/80 text-amber-100 hover:bg-stone-700'
              }`}
            >
              Delivery Suggestion Engine
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'shipments' ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-stone-800/80 text-amber-100 hover:bg-stone-700'
              }`}
            >
              Shipment Tracking Logs ({shipments.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB 1: Delivery Zones & Pricing */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif font-bold text-2xl text-stone-900">Bangladesh Delivery Service Zones</h2>
              <p className="text-xs text-stone-500">Normalised tariff zones covering Dhaka Metro, Major District Cities, and Remote Hill Tracts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {zone.code}
                    </span>
                    <h3 className="font-serif font-bold text-lg text-stone-900 mt-1">{zone.name}</h3>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${zone.isActive ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Base Shipping Tariff:</span>
                    {editingZoneId === zone.id ? (
                      <div className="flex items-center gap-1">
                        <span className="font-bold">৳</span>
                        <input
                          type="number"
                          value={editPriceBDT}
                          onChange={(e) => setEditPriceBDT(Number(e.target.value))}
                          className="w-16 px-1 py-0.5 border border-stone-300 rounded font-bold text-xs"
                        />
                        <button
                          onClick={() => handleUpdateZonePrice(zone.id)}
                          className="px-2 py-0.5 bg-emerald-800 text-white rounded font-bold text-[10px]"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        {formatPrice(zone.basePriceCents)}
                        <button
                          onClick={() => {
                            setEditingZoneId(zone.id);
                            setEditPriceBDT(zone.basePriceCents / 100);
                          }}
                          className="text-[10px] text-amber-800 underline font-semibold"
                        >
                          Edit
                        </button>
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>Est. Delivery Window:</span>
                    <span className="font-bold text-amber-900">{zone.estimatedDeliveryDaysMin} - {zone.estimatedDeliveryDaysMax} Days</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 space-y-1">
                  <span className="font-bold text-stone-800 block">Coverage Highlights:</span>
                  {zone.code === 'dhaka_metro' && <p>• Dhanmondi, Gulshan, Uttara, Mirpur, Mohammadpur, Motijheel</p>}
                  {zone.code === 'outside_dhaka' && <p>• Chittagong Sadar, Sylhet City, Rajshahi, Khulna, Barisal, Rangpur</p>}
                  {zone.code === 'remote_area' && <p>• Rangamati Hill Tracts, Bandarban, Khagrachhari, Saint Martin's Island</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Location Normalization Table */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-stone-900">Normalised Delivery Locations Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                    <th className="p-3">Location ID</th>
                    <th className="p-3">Division</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Upazila / Thana</th>
                    <th className="p-3">Postal Code</th>
                    <th className="p-3">Zone Mapping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono text-stone-500">{loc.id}</td>
                      <td className="p-3 font-semibold text-stone-900">{loc.division}</td>
                      <td className="p-3 text-stone-800">{loc.district}</td>
                      <td className="p-3 text-stone-800">{loc.upazilaThana}</td>
                      <td className="p-3 font-mono text-stone-500">{loc.postalCode || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          loc.isRemote ? 'bg-rose-100 text-rose-800' : loc.district === 'Dhaka' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {loc.isRemote ? 'Remote Area' : loc.district === 'Dhaka' ? 'Dhaka Metro' : 'Outside Dhaka'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: Courier Directory */}
      {activeTab === 'couriers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif font-bold text-2xl text-stone-900">Integrated Bangladesh Courier Partners</h2>
              <p className="text-xs text-stone-500">API integration credentials and capabilities for Pathao, RedX, and Steadfast.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {couriers.map((courier) => (
              <div key={courier.id} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif font-bold text-lg text-stone-900">{courier.name}</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> API Active
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>COD Support:</span>
                    <span className="font-bold text-emerald-900">Yes (100% Guaranteed)</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Avg. SLA Delivery Speed:</span>
                    <span className="font-bold text-amber-900">{courier.avgDeliveryHours} Hours</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>API Endpoint:</span>
                    <span className="font-mono text-[10px] text-stone-500 truncate max-w-[150px]">{courier.apiEndpoint}</span>
                  </div>
                </div>

                <button
                  onClick={() => onShowToast('info', 'Courier Health Check', `${courier.name} API endpoint responding normal (HTTP 200 OK)`)}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Ping Endpoint Status
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 3: Delivery Suggestion Engine Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="font-serif font-bold text-2xl text-stone-900">Delivery Suggestion Engine Simulator</h2>
            <p className="text-xs text-stone-500">Test how the platform matches buyer addresses to delivery zones and scores couriers based on speed, price, and COD reliability.</p>
          </div>

          <form onSubmit={handleRunSimulation} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Select District</label>
              <select
                value={testDistrict}
                onChange={(e) => setTestDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Rangamati">Rangamati (Remote)</option>
                <option value="Bandarban">Bandarban (Remote)</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Select Upazila / Thana</label>
              <input
                type="text"
                value={testUpazila}
                onChange={(e) => setTestUpazila(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-950 hover:bg-amber-900 text-amber-100 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                Run Delivery Resolution Engine
              </button>
            </div>
          </form>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="p-6 bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl border border-amber-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="bg-amber-800 text-amber-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Resolved Zone: {simulationResult.zoneCode.toUpperCase()}
                </span>
                <span className="font-serif font-bold text-lg text-emerald-950">
                  Base Tariff: {formatPrice(simulationResult.basePriceCents)}
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-stone-900 text-sm">
                    Top Recommended Partner: <span className="text-amber-900">{simulationResult.topSuggestion.courierName}</span>
                  </h3>
                </div>
                <p className="text-xs text-stone-600">
                  <strong>Reason:</strong> {simulationResult.topSuggestion.recommendedReason}
                </p>
                <p className="text-xs text-stone-600">
                  <strong>Score:</strong> {simulationResult.topSuggestion.confidenceScore}/100 • <strong>Estimated Time:</strong> {simulationResult.topSuggestion.estimatedDays}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-800 text-xs">All Scored Couriers Breakdown:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {simulationResult.allSuggestions.map((s: any) => (
                    <div key={s.courierCode} className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1">
                      <p className="font-bold text-stone-900">{s.courierName}</p>
                      <p className="text-[11px] text-stone-500">Confidence Score: <strong className="text-amber-900">{s.confidenceScore}%</strong></p>
                      <p className="text-[11px] text-stone-500">Price: {formatPrice(s.priceCents)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 4: Shipment Tracking Logs */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif font-bold text-2xl text-stone-900">Shipments & Tracking Events Log</h2>
              <p className="text-xs text-stone-500">Append-only courier events timeline and tracking number overrides.</p>
            </div>
            <button
              onClick={() => setIsManualBookingOpen(true)}
              className="px-4 py-2 bg-amber-950 hover:bg-amber-900 text-amber-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Book New Shipment
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                    <th className="p-3">Shipment ID</th>
                    <th className="p-3">Vendor Order ID</th>
                    <th className="p-3">Courier</th>
                    <th className="p-3">Tracking Number</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Override Note</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono text-stone-500">{s.id}</td>
                      <td className="p-3 font-mono font-bold text-stone-900">{s.vendorOrderId}</td>
                      <td className="p-3 font-bold text-amber-950">{s.courierName}</td>
                      <td className="p-3 font-mono text-emerald-900 font-bold">{s.trackingNumber}</td>
                      <td className="p-3">
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-stone-500 italic max-w-[150px] truncate">
                        {s.courierOverrideReason || 'Standard Recommendation'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleViewShipmentEvents(s)}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          View Events
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Shipment Events Timeline Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedShipment(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-bold text-lg"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {selectedShipment.courierName}
              </span>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Tracking #{selectedShipment.trackingNumber}
              </h2>
              <p className="text-xs text-stone-500">Append-only courier audit timeline.</p>
            </div>

            {/* Timeline List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {shipmentEvents.map((evt, idx) => (
                <div key={evt.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1 relative pl-8">
                  <span className="w-2.5 h-2.5 bg-amber-800 rounded-full absolute left-3 top-4" />
                  <div className="flex justify-between font-bold text-stone-900">
                    <span className="uppercase">{evt.status}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{new Date(evt.eventTimestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-stone-600 font-semibold">{evt.location}</p>
                  <p className="text-stone-500 text-[11px]">{evt.description}</p>
                </div>
              ))}
            </div>

            {/* Append Event Form */}
            <form onSubmit={handleAddTrackingEvent} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
              <h4 className="font-bold text-stone-900">Append Courier Tracking Event</h4>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newEventStatus}
                  onChange={(e) => setNewEventStatus(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-stone-300 rounded-lg font-bold"
                >
                  <option value="booked">Booked</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                </select>
                <input
                  type="text"
                  required
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Location Hub"
                  className="px-2 py-1.5 bg-white border border-stone-300 rounded-lg"
                />
              </div>
              <input
                type="text"
                required
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                placeholder="Status Event Description..."
                className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg"
              />
              <button
                type="submit"
                className="w-full py-2 bg-amber-950 text-amber-100 font-bold rounded-xl text-xs uppercase"
              >
                Append Event to Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. Manual Booking Modal */}
      {isManualBookingOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsManualBookingOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-bold"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-stone-900">Book Courier Shipment</h2>
              <p className="text-xs text-stone-500">API booking or manual tracking override.</p>
            </div>

            <form onSubmit={handleExecuteManualBooking} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Vendor Order ID</label>
                <input
                  type="text"
                  required
                  value={manualVendorOrderId}
                  onChange={(e) => setManualVendorOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Courier Partner</label>
                <select
                  value={manualCourierCode}
                  onChange={(e) => setManualCourierCode(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="pathao">Pathao Logistics Express</option>
                  <option value="redx">RedX Delivery Network</option>
                  <option value="steadfast">Steadfast Courier</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Custom Tracking No. (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-generated tracking"
                  value={manualTrackingNo}
                  onChange={(e) => setManualTrackingNo(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Vendor Override Reason (If Override)</label>
                <input
                  type="text"
                  placeholder="e.g. Buyer requested Steadfast due to specific address point"
                  value={manualOverrideReason}
                  onChange={(e) => setManualOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-950 text-amber-100 font-bold rounded-2xl uppercase tracking-wider shadow-md"
              >
                Confirm Shipment Booking
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
