import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { PLANS, getPlanById } from '../../../config/plans';
import { 
  Building2, MapPin, Wifi, CreditCard, Check, 
  ArrowRight, ArrowLeft, CheckCircle, Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const TenantSetupWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const [companyData, setCompanyData] = useState({
    name: '',
    contactEmail: '',
    industry: '',
    companySize: ''
  });

  const [locationData, setLocationData] = useState({
    name: 'Main Site',
    address: '',
    lat: -34.6037,
    lng: -58.3816
  });

  const [mqttData, setMqttData] = useState({
    host: 'broker.hivemq.com',
    port: 8884,
    protocol: 'wss',
    username: '',
    password: ''
  });

  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  const industries = [
    'Manufacturing', 'Agriculture', 'Energy', 'Water Treatment',
    'Food & Beverage', 'Pharmaceuticals', 'Mining', 'Other'
  ];

  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

  const steps = [
    { num: 1, title: 'Company Info', icon: Building2 },
    { num: 2, title: 'First Location', icon: MapPin },
    { num: 3, title: 'MQTT Setup', icon: Wifi },
    { num: 4, title: 'Select Plan', icon: Sparkles },
    { num: 5, title: 'Payment', icon: CreditCard }
  ];

  const handleCreateTenant = async () => {
    setIsCreating(true);
    try {
      const tenantId = companyData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const locationId = `loc-${Date.now()}`;
      const now = new Date().toISOString();
      
      const plan = getPlanById(selectedPlan);
      
      const tenantDoc = {
        name: companyData.name,
        contactEmail: companyData.contactEmail,
        industry: companyData.industry,
        companySize: companyData.companySize,
        plan: selectedPlan,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        
        limits: plan.limits,
        
        subscription: {
          plan: selectedPlan,
          status: 'active',
          createdAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paymentMethod: paymentData.cardNumber ? {
            type: 'card',
            last4: paymentData.cardNumber.slice(-4),
            brand: 'visa'
          } : null,
          lastPaymentDate: null
        },
        
        usage: {
          locations: 1,
          users: 0,
          widgetsTotal: 0,
          dashboards: 0,
          mqttMessagesToday: 0,
          mqttTopicsSubscribed: 0,
          lastCalculated: now,
          dailyStats: {
            date: new Date().toISOString().split('T')[0],
            mqttMessages: 0,
            dataPointsStored: 0
          }
        }
      };

      await setDoc(doc(db, 'tenants', tenantId), tenantDoc);

      const locationDoc = {
        name: locationData.name,
        address: locationData.address,
        lat: locationData.lat,
        lng: locationData.lng,
        mqtt_config: mqttData,
        layout: { machines: [], widgets: [] },
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(db, 'tenants', tenantId, 'locations', locationId), locationDoc);

      alert('✅ Tenant Created Successfully!');
      navigate(`/app/tenants/${tenantId}`);
    } catch (e) {
      console.error(e);
      alert('Error creating tenant');
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1:
        return companyData.name && companyData.contactEmail;
      case 2:
        return locationData.name;
      case 3:
        return mqttData.host && mqttData.port;
      case 4:
        return selectedPlan;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
            Create New Tenant
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Set up a new client organization in 5 easy steps
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mb-6">
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              
              return (
                <React.Fragment key={step.num}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110' 
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </div>
                    <span className={`text-xs font-bold hidden md:block ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="p-8 min-h-[500px]">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center mb-8">
                  <Building2 size={48} className="mx-auto text-blue-600 mb-3" />
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Company Information</h2>
                  <p className="text-slate-500 dark:text-slate-400">Tell us about the organization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      value={companyData.name}
                      onChange={e => setCompanyData({...companyData, name: e.target.value})}
                      placeholder="e.g. Acme Industries Inc."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      value={companyData.contactEmail}
                      onChange={e => setCompanyData({...companyData, contactEmail: e.target.value})}
                      placeholder="admin@company.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Industry
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      value={companyData.industry}
                      onChange={e => setCompanyData({...companyData, industry: e.target.value})}
                    >
                      <option value="">Select Industry</option>
                      {industries.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Company Size
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      value={companyData.companySize}
                      onChange={e => setCompanyData({...companyData, companySize: e.target.value})}
                    >
                      <option value="">Select Size</option>
                      {companySizes.map(size => (
                        <option key={size} value={size}>{size} employees</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center mb-8">
                  <MapPin size={48} className="mx-auto text-blue-600 mb-3" />
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">First Location</h2>
                  <p className="text-slate-500 dark:text-slate-400">Set up your primary site</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                        Site Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        value={locationData.name}
                        onChange={e => setLocationData({...locationData, name: e.target.value})}
                        placeholder="e.g. Main Factory"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                        Physical Address
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        value={locationData.address}
                        onChange={e => setLocationData({...locationData, address: e.target.value})}
                        placeholder="Street address, city, country"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <MapPin size={16} />
                        Map Coordinates
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-blue-700 dark:text-blue-300 block mb-1">Latitude</label>
                          <input type="number" step="any" readOnly className="w-full px-2 py-1 border border-blue-200 dark:border-blue-800 rounded text-sm bg-white dark:bg-slate-800 font-mono" value={locationData.lat} />
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 dark:text-blue-300 block mb-1">Longitude</label>
                          <input type="number" step="any" readOnly className="w-full px-2 py-1 border border-blue-200 dark:border-blue-800 rounded text-sm bg-white dark:bg-slate-800 font-mono" value={locationData.lng} />
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Click on the map to set location</p>
                    </div>
                  </div>

                  <div className="h-[400px] rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-inner">
                    <MapContainer center={[locationData.lat, locationData.lng]} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker 
                        position={[locationData.lat, locationData.lng]} 
                        setPosition={(pos) => setLocationData({...locationData, lat: pos.lat, lng: pos.lng})} 
                      />
                    </MapContainer>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center mb-8">
                  <Wifi size={48} className="mx-auto text-emerald-600 mb-3" />
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">MQTT Configuration</h2>
                  <p className="text-slate-500 dark:text-slate-400">Connect to your IoT infrastructure</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-2">Broker Settings</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Configure the MQTT broker for real-time data communication</p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Broker Host *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      value={mqttData.host}
                      onChange={e => setMqttData({...mqttData, host: e.target.value})}
                      placeholder="broker.hivemq.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Port *</label>
                      <input
                        type="number"
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        value={mqttData.port}
                        onChange={e => setMqttData({...mqttData, port: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Protocol</label>
                      <select
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        value={mqttData.protocol}
                        onChange={e => setMqttData({...mqttData, protocol: e.target.value})}
                      >
                        <option value="wss">WSS (Secure)</option>
                        <option value="ws">WS (Insecure)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Username</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        value={mqttData.username}
                        onChange={e => setMqttData({...mqttData, username: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        value={mqttData.password}
                        onChange={e => setMqttData({...mqttData, password: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

{currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center mb-8">
                  <Sparkles size={48} className="mx-auto text-purple-600 mb-3" />
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Choose Your Plan</h2>
                  <p className="text-slate-500 dark:text-slate-400">Select the best fit for your operation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.values(PLANS).map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative cursor-pointer rounded-2xl border-3 p-6 transition-all hover:shadow-xl ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {selectedPlan === plan.id && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <Check size={18} className="text-white" />
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                          {plan.displayName}
                        </h3>
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                          <span className="text-3xl font-bold text-blue-600">${plan.price}</span>
                          <span className="text-slate-500 text-sm">/month</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Locations</span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {plan.limits.maxLocations === 999 ? 'Unlimited' : plan.limits.maxLocations}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Users</span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {plan.limits.maxUsers === 999 ? 'Unlimited' : plan.limits.maxUsers}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Dashboards</span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {plan.limits.maxDashboards === 999 ? 'Unlimited' : plan.limits.maxDashboards}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Data Retention</span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {plan.limits.dataRetentionDays} days
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Key Features</p>
                        <div className="space-y-1">
                          {plan.limits.features.mqttAuditor && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={14} />
                              <span>MQTT Auditor</span>
                            </div>
                          )}
                          {plan.limits.features.advancedAnalytics && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={14} />
                              <span>Advanced Analytics</span>
                            </div>
                          )}
                          {plan.limits.features.apiAccess && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={14} />
                              <span>API Access</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center mb-8">
                  <CreditCard size={48} className="mx-auto text-blue-600 mb-3" />
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Information</h2>
                  <p className="text-slate-500 dark:text-slate-400">Secure payment processing (Demo Mode)</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-12 h-8 bg-white/20 rounded backdrop-blur-sm"></div>
                      <div className="text-xs font-bold">DEMO CARD</div>
                    </div>
                    <div className="font-mono text-xl tracking-wider mb-4">
                      {paymentData.cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs opacity-70 mb-1">Card Holder</div>
                        <div className="font-bold">{paymentData.cardHolder || 'YOUR NAME'}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-70 mb-1">Expires</div>
                        <div className="font-bold">{paymentData.expiryDate || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                        Card Number
                      </label>
                      <input
                        type="text"
                        maxLength="19"
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        value={paymentData.cardNumber}
                        onChange={e => setPaymentData({...paymentData, cardNumber: e.target.value})}
                        placeholder="1234 5678 9012 3456"
                        />
                        </div>
                                        <div>
                                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                            Card Holder Name
                                          </label>
                                          <input
                                            type="text"
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            value={paymentData.cardHolder}
                                            onChange={e => setPaymentData({...paymentData, cardHolder: e.target.value})}
                                            placeholder="John Doe"
                                          />
                                        </div>
                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                              Expiry Date
                                            </label>
                                            <input
                                              type="text"
                                              maxLength="5"
                                              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                              value={paymentData.expiryDate}
                                              onChange={e => setPaymentData({...paymentData, expiryDate: e.target.value})}
                                              placeholder="MM/YY"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                              CVV
                                            </label>
                                            <input
                                              type="text"
                                              maxLength="3"
                                              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                              value={paymentData.cvv}
                                              onChange={e => setPaymentData({...paymentData, cvv: e.target.value})}
                                              placeholder="123"
                                            />
                                          </div>
                                        </div>
                        
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                          <p className="text-sm text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                                            <CheckCircle size={16} />
                                            Demo Mode Active
                                          </p>
                                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                            No actual payment will be processed. This is for demonstration purposes only.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                        
                              <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <button
                                  onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/app/tenants')}
                                  className="flex items-center gap-2 px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                                >
                                  <ArrowLeft size={18} />
                                  {currentStep === 1 ? 'Cancel' : 'Back'}
                                </button>
                        
                                {currentStep < 5 ? (
                                  <button
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    disabled={!canProceed()}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    Next Step
                                    <ArrowRight size={18} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleCreateTenant}
                                    disabled={isCreating}
                                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    {isCreating ? (
                                      <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creating...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle size={20} />
                                        Create Tenant
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                        };
                        export default TenantSetupWizard;