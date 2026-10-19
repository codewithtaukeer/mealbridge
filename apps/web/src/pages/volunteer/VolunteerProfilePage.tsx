import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Save, ShieldCheck, Navigation, Compass, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export function VolunteerProfilePage() {
  const { user } = useAuth();
  const { detectLocation, isDetecting } = useGeolocation();

  const [transportMode, setTransportMode] = useState('TWO_WHEELER');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [isAvailable, setIsAvailable] = useState(true);
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved volunteer location preference
    const saved = localStorage.getItem('mealbridge_volunteer_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.city) setCity(parsed.city);
        if (parsed.pinCode) setPinCode(parsed.pinCode);
        if (parsed.latitude) setLatitude(parsed.latitude);
        if (parsed.longitude) setLongitude(parsed.longitude);
        if (parsed.serviceRadius) setServiceRadius(parsed.serviceRadius);
        if (parsed.transportMode) setTransportMode(parsed.transportMode);
        if (parsed.isAvailable !== undefined) setIsAvailable(parsed.isAvailable);
      } catch {}
    }
  }, []);

  const handleDetectLocation = async () => {
    const loc = await detectLocation();
    if (loc) {
      if (loc.city) setCity(loc.city);
      if (loc.pinCode) setPinCode(loc.pinCode);
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      // Auto-save live location
      localStorage.setItem(
        'mealbridge_volunteer_location',
        JSON.stringify({
          city: loc.city,
          pinCode: loc.pinCode,
          latitude: loc.latitude,
          longitude: loc.longitude,
          serviceRadius,
          transportMode,
          isAvailable,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const locationData = {
      city,
      pinCode,
      latitude,
      longitude,
      serviceRadius,
      transportMode,
      isAvailable,
      phone,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('mealbridge_volunteer_location', JSON.stringify(locationData));

    setTimeout(() => {
      setIsLoading(false);
      toast.success('Volunteer preferences & live dispatch radius saved');
    }, 300);
  };

  const transportOptions = [
    { label: 'Bicycle (Eco)', value: 'BICYCLE', desc: 'Up to 15 kg payload' },
    { label: 'Motorcycle / Scooter', value: 'TWO_WHEELER', desc: 'Up to 30 kg payload' },
    { label: 'Four-Wheeler / Car', value: 'CAR', desc: 'Up to 150 kg payload' },
    { label: 'Small Van / Utility', value: 'VAN', desc: 'Large catering batches' },
  ];

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
          Volunteer Courier Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Configure your vehicle parameters, maximum travel radius, and live mission dispatch availability.
        </p>
      </div>

      <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Availability Toggle */}
          <div className="p-4 rounded-xl bg-obsidian-shell/5 border border-fog-border flex items-center justify-between">
            <div>
              <span className="font-medium text-sm text-obsidian-shell block">
                Active Dispatch Availability
              </span>
              <span className="text-xs text-slate-text">
                When active, you receive live Socket.IO push alerts for nearby surplus pickups within your service radius.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isAvailable ? 'bg-neon-pulse justify-end' : 'bg-black/20 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Live Location & GPS Detection */}
          <div className="space-y-3 p-4 rounded-xl bg-mint-frost border border-fog-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-sm text-obsidian-shell block">
                  Live Dispatch Base Location
                </span>
                <span className="text-xs text-slate-text">
                  Used to notify you in real-time when donations are posted within your travel radius.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="px-3 py-1.5 rounded-button bg-neon-pulse/15 border border-neon-pulse/40 text-xs font-semibold text-obsidian-shell hover:bg-neon-pulse/25 flex items-center gap-1.5 transition-colors"
              >
                <Navigation className={`w-3.5 h-3.5 text-neon-pulse ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Detecting GPS...' : 'Detect Live Location'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Input
                label="Current City"
                placeholder="e.g. Prayagraj"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-slate-text" />}
              />
              <Input
                label="Current PIN Code"
                placeholder="e.g. 211001"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                leftIcon={<Compass className="w-4 h-4 text-slate-text" />}
              />
            </div>

            {latitude && longitude ? (
              <div className="p-2.5 rounded-lg bg-neon-pulse/10 border border-neon-pulse/30 flex items-center justify-between">
                <span className="text-xs text-obsidian-shell font-medium">
                  Live Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                </span>
                <span className="text-[10px] uppercase font-bold text-neon-pulse bg-neon-pulse/20 px-2 py-0.5 rounded">
                  GPS Active
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-text">
                GPS not yet acquired. Click &quot;Detect Live Location&quot; to allow browser geolocation.
              </p>
            )}
          </div>

          {/* Transport Mode */}
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-[0.05em] text-obsidian-shell">
              Primary Vehicle / Transport Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {transportOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setTransportMode(opt.value)}
                  className={`p-3 rounded-card text-left text-xs transition-all border ${
                    transportMode === opt.value
                      ? 'bg-neon-pulse/10 border-neon-pulse font-semibold text-obsidian-shell shadow-sm'
                      : 'bg-obsidian-shell/5 border-fog-border text-slate-text hover:bg-white/80'
                  }`}
                >
                  <span className="font-medium block">{opt.label}</span>
                  <span className="text-[11px] text-slate-text mt-0.5 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Service Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-obsidian-shell">
              <span>Service Radius: {serviceRadius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={serviceRadius}
              onChange={(e) => setServiceRadius(Number(e.target.value))}
              className="w-full accent-neon-pulse"
            />
            <span className="text-[11px] text-slate-text block">
              You will only be matched and notified for surplus food pickups within {serviceRadius} km of your live location.
            </span>
          </div>

          <Input
            label="Contact Mobile (For Coordinator Verification)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4 text-obsidian-shell" />}
            >
              Save Volunteer Profile
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="text-center text-[11px] text-slate-text flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-neon-pulse" />
        <span>Volunteer accounts adhere to Good Samaritan protection guidelines for food redistribution</span>
      </div>
    </div>
  );
}
