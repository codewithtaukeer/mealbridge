import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FOOD_CATEGORIES } from '@mealbridge/shared';
import {
  Search,
  MapPin,
  Clock,
  Building2,
  AlertTriangle,
  ArrowRight,
  LayoutGrid,
  Map as MapIcon,
} from 'lucide-react';

export function FoodDiscoveryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Demonstration surplus dataset
  const donations = [
    {
      id: 'demo-1',
      title: 'Vegetarian Thali & Steamed Rice',
      category: 'VEGETARIAN_MEALS',
      categoryLabel: 'Vegetarian Meals',
      quantity: 45,
      unit: 'Portions',
      donorName: 'Edesiea Community Kitchen',
      donorType: 'Canteen / Mess',
      city: 'Prayagraj, UP',
      locality: 'Near Temple Road',
      deadline: 'Today, 4:00 PM',
      preparedAt: '12:30 PM today',
      allergens: ['Dairy'],
      handlingNotes: 'Kept in thermal insulated food carriers at >60°C',
      status: 'AVAILABLE',
      lat: 25.4358,
      lng: 81.7706,
    },
    {
      id: 'demo-2',
      title: 'Assorted Bakery Loaves & Dinner Rolls',
      category: 'BAKED_GOODS',
      categoryLabel: 'Baked Goods',
      quantity: 30,
      unit: 'Boxes',
      donorName: 'Harvest Artisanal Bakery',
      donorType: 'Bakery',
      city: 'Civil Lines',
      locality: 'MG Marg Area',
      deadline: 'Today, 6:30 PM',
      preparedAt: '09:00 AM today',
      allergens: ['Wheat', 'Gluten'],
      handlingNotes: 'Dry packaging, keep sealed from moisture',
      status: 'AVAILABLE',
      lat: 25.4512,
      lng: 81.8341,
    },
    {
      id: 'demo-3',
      title: 'Seasonal Farm Greens & Root Vegetables',
      category: 'FRUITS_VEGETABLES',
      categoryLabel: 'Produce',
      quantity: 25,
      unit: 'Kilograms',
      donorName: 'Green Market Cooperative',
      donorType: 'Wholesale Mandi',
      city: 'Katra',
      locality: 'Subzi Mandi Gate 2',
      deadline: 'Tomorrow, 10:00 AM',
      preparedAt: 'Harvested yesterday',
      allergens: [],
      handlingNotes: 'Ambient temperature storage, clean crates',
      status: 'AVAILABLE',
      lat: 25.4601,
      lng: 81.8542,
    },
    {
      id: 'demo-4',
      title: 'Fresh Packaged Paneer & Curd',
      category: 'DAIRY',
      categoryLabel: 'Dairy Products',
      quantity: 15,
      unit: 'Kilograms',
      donorName: 'Kalyan Dairy Union',
      donorType: 'Dairy Provider',
      city: 'Alopibagh',
      locality: 'GT Road Point',
      deadline: 'Today, 8:00 PM',
      preparedAt: 'Chilled batches',
      allergens: ['Milk', 'Dairy'],
      handlingNotes: 'Cold chain storage required (<4°C)',
      status: 'AVAILABLE',
      lat: 25.4421,
      lng: 81.8719,
    },
    {
      id: 'demo-5',
      title: 'Cooked Lentil Soup (Dal Tadka) & Rotis',
      category: 'VEGETARIAN_MEALS',
      categoryLabel: 'Vegetarian Meals',
      quantity: 60,
      unit: 'Portions',
      donorName: 'Grand Heritage Banquet',
      donorType: 'Event Caterer',
      city: 'Naini',
      locality: 'Industrial Area Phase 1',
      deadline: 'Today, 5:00 PM',
      preparedAt: 'Post-lunch banquet surplus',
      allergens: [],
      handlingNotes: 'Packed in food-grade steel decanters',
      status: 'AVAILABLE',
      lat: 25.3871,
      lng: 81.8654,
    },
  ];

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' || d.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="py-10">
      <PageContainer size="lg" withBloom>
        <SectionHeading
          theme="dark"
          badge="Live Listings"
          title="Discover Available Surplus Food"
          description="Browse safe, high-quality surplus food from verified commercial donors. Exact collection address and contact details are disclosed to authorized recipient NGOs upon acceptance."
        />

        {/* Filter & Search Bar */}
        <div className="bg-deep-abyss p-4 rounded-card border border-white/10 shadow-md space-y-4 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search food by name, donor, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-text" />}
              />
            </div>

            {/* Category Select */}
            <div className="w-full md:w-64">
              <select
                aria-label="Filter by food category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-pill bg-obsidian-shell border border-white/15 text-pure-white text-xs py-2.5 px-4 focus:border-neon-pulse focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-obsidian-shell p-1 rounded-pill border border-white/10 self-end md:self-auto shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-neon-pulse text-obsidian-shell font-semibold shadow-sm'
                    : 'text-slate-text hover:text-pure-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'map'
                    ? 'bg-neon-pulse text-obsidian-shell font-semibold shadow-sm'
                    : 'text-slate-text hover:text-pure-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map View</span>
              </button>
            </div>
          </div>

          {/* Privacy Notice Pill */}
          <div className="text-[11px] text-slate-text flex items-center gap-1.5 pt-2 border-t border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-pulse shadow-[0_0_6px_#3ddc91] shrink-0" />
            <span>Showing verified offers within local service radius. Exact donor phone numbers and private pickup addresses are restricted to authorized rescue participants.</span>
          </div>
        </div>

        {/* View Mode: Map Simulated Interface */}
        {viewMode === 'map' ? (
          <GlassCard variant="light" padding="lg" className="mb-8 text-center space-y-4">
            <div className="w-full h-80 rounded-xl bg-white/70 border border-fog-border flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-obsidian-shell flex items-center justify-center text-neon-pulse mb-3 shadow-sm">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-base font-semibold text-obsidian-shell">
                Interactive Local Map (Prayagraj Pilot Area)
              </h3>
              <p className="text-xs text-slate-text max-w-md mt-1">
                Displaying 5 active pickup hubs across Civil Lines, Katra, and Naini.
                Full OpenStreetMap integration with live routing is available in the volunteer workflow.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {filteredDonations.map((d) => (
                  <span
                    key={d.id}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-pill bg-white shadow-sm border border-fog-border text-obsidian-shell flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-neon-pulse" />
                    {d.city} · {d.quantity} {d.unit}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        ) : null}

        {/* Listings Grid */}
        {filteredDonations.length === 0 ? (
          <GlassCard variant="light" padding="xl" className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto text-slate-text mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-obsidian-shell">No donations matched your criteria</h3>
            <p className="text-xs text-slate-text mt-1 max-w-sm mx-auto">
              Try adjusting your category filter or clearing your search term to see other available listings.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-obsidian-shell border-obsidian-shell/20 hover:border-obsidian-shell"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
              }}
            >
              Reset Filters
            </Button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonations.map((d) => (
              <GlassCard
                key={d.id}
                variant="light"
                padding="md"
                hoverEffect
                className="flex flex-col justify-between border-fog-border"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral" size="sm">
                      {d.categoryLabel}
                    </Badge>
                    <Badge variant="success" dot size="sm">
                      Available
                    </Badge>
                  </div>

                  <h3 className="text-lg font-medium text-obsidian-shell leading-snug">
                    {d.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-text">
                    <p className="flex items-center gap-1.5 font-medium text-obsidian-shell">
                      <Building2 className="w-3.5 h-3.5 text-obsidian-shell/70 shrink-0" />
                      <span>{d.donorName}</span>
                      <span className="text-[10px] text-slate-text">({d.donorType})</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-text shrink-0" />
                      <span>{d.locality}, {d.city}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-signal-yellow shrink-0" />
                      <span>Pickup Deadline: <strong className="text-obsidian-shell">{d.deadline}</strong></span>
                    </p>
                  </div>

                  {d.handlingNotes && (
                    <div className="p-2 rounded-lg bg-white/70 border border-fog-border text-[11px] text-slate-text">
                      <span className="font-semibold text-obsidian-shell">Storage notes: </span>
                      {d.handlingNotes}
                    </div>
                  )}

                  {d.allergens.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] uppercase font-medium tracking-[0.05em] text-slate-text mr-1">
                        Allergens:
                      </span>
                      {d.allergens.map((alg) => (
                        <span
                          key={alg}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-soft-coral/15 text-soft-coral border border-soft-coral/30 font-medium"
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-fog-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-medium tracking-[0.05em] text-slate-text block">Quantity</span>
                    <span className="text-base font-bold text-obsidian-shell">
                      {d.quantity} {d.unit}
                    </span>
                  </div>
                  <Link to={`/food/${d.id}`}>
                    <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Details
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
