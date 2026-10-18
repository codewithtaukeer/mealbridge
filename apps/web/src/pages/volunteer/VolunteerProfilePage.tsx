import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function VolunteerProfilePage() {
  const { user } = useAuth();

  const [transportMode, setTransportMode] = useState('TWO_WHEELER');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [isAvailable, setIsAvailable] = useState(true);
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Volunteer preferences saved successfully');
    }, 400);
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
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Volunteer Courier Profile
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Configure your vehicle parameters, maximum travel radius, and live mission dispatch availability.
        </p>
      </div>

      <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Availability Toggle */}
          <div className="p-4 rounded-xl bg-white/60 border border-black/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-forest-night block">
                Active Dispatch Availability
              </span>
              <span className="text-xs text-muted-text">
                When active, you receive live Socket.IO push alerts for nearby surplus pickups.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isAvailable ? 'bg-bridge-green justify-end' : 'bg-black/20 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Transport Mode */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-forest-night">
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
                      ? 'bg-bridge-green/10 border-bridge-green font-semibold text-forest-night shadow-sm'
                      : 'bg-white/50 border-black/5 text-muted-text hover:bg-white/80'
                  }`}
                >
                  <span className="font-bold block">{opt.label}</span>
                  <span className="text-[11px] text-muted-text mt-0.5 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Service Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-forest-night">
              <span>Service Radius: {serviceRadius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={serviceRadius}
              onChange={(e) => setServiceRadius(Number(e.target.value))}
              className="w-full accent-bridge-green"
            />
            <span className="text-[11px] text-muted-text block">
              You will only be matched with pickup locations within {serviceRadius} km of your operating base.
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
              leftIcon={<Save className="w-4 h-4 text-forest-night" />}
            >
              Save Volunteer Profile
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="text-center text-[11px] text-muted-text flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-bridge-green" />
        <span>Volunteer accounts adhere to Good Samaritan protection guidelines for food redistribution</span>
      </div>
    </div>
  );
}
