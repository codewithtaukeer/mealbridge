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
          badge="Live Listings"
          title="Discover Available Surplus Food"
          description="Browse safe, high-quality surplus food from verified commercial donors. Exact collection address and contact details are disclosed to authorized recipient NGOs upon acceptance."
        />

        {/* Filter & Search Bar */}
        <div className="glass-light p-4 rounded-2xl border border-white/60 shadow-glass-sm space-y-4 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search food by name, donor, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-muted-text" />}
              />
            </div>

            {/* Category Select */}
            <div className="w-full md:w-64">
              <select
                aria-label="Filter by food category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-button bg-white/80 border border-black/15 text-primary-text text-sm py-2.5 px-3 focus:bg-white focus:border-bridge-green focus:outline-none focus:ring-2 focus:ring-fresh-mint/60"
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
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl self-end md:self-auto shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-forest-night shadow-sm'
                    : 'text-muted-text hover:text-forest-night'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">List View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-forest-night shadow-sm'
                    : 'text-muted-text hover:text-forest-night'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Map View</span>
              </button>
            </div>
          </div>

          {/* Privacy Notice Pill */}
          <div className="text-[11px] text-muted-text flex items-center gap-1.5 pt-1 border-t border-black/5">
            <span className="w-1.5 h-1.5 rounded-full bg-fresh-mint shrink-0" />
            <span>Showing verified offers within local service radius. Exact donor phone numbers and private pickup addresses are restricted to authorized rescue participants.</span>
          </div>
        </div>

        {/* View Mode: Map Simulated Interface */}
        {viewMode === 'map' ? (
          <GlassCard variant="light" padding="lg" className="mb-8 text-center space-y-4">
            <div className="w-full h-80 rounded-xl bg-forest-night/5 border border-black/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-bridge-green/10 flex items-center justify-center text-bridge-green mb-3">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-forest-night">
                Interactive Local Map (Prayagraj Pilot Area)
              </h3>
              <p className="text-xs text-muted-text max-w-md mt-1">
                Displaying 5 active pickup hubs across Civil Lines, Katra, and Naini.
                Full OpenStreetMap integration with live routing is available in the volunteer workflow.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {filteredDonations.map((d) => (
                  <span
                    key={d.id}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white shadow-sm border border-black/10 text-forest-night flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-bridge-green" />
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
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto text-muted-text mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-forest-night">No donations matched your criteria</h3>
            <p className="text-xs text-muted-text mt-1 max-w-sm mx-auto">
              Try adjusting your category filter or clearing your search term to see other available listings.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
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
                className="flex flex-col justify-between border-white/70"
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

                  <h3 className="text-lg font-bold text-forest-night leading-snug">
                    {d.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-muted-text">
                    <p className="flex items-center gap-1.5 font-medium text-primary-text">
                      <Building2 className="w-3.5 h-3.5 text-bridge-green shrink-0" />
                      <span>{d.donorName}</span>
                      <span className="text-[10px] text-muted-text">({d.donorType})</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-text shrink-0" />
                      <span>{d.locality}, {d.city}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-harvest-gold shrink-0" />
                      <span>Pickup Deadline: <strong className="text-forest-night">{d.deadline}</strong></span>
                    </p>
                  </div>

                  {d.handlingNotes && (
                    <div className="p-2 rounded-lg bg-black/[0.03] text-[11px] text-muted-text">
                      <span className="font-semibold text-primary-text">Storage notes: </span>
                      {d.handlingNotes}
                    </div>
                  )}

                  {d.allergens.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-text mr-1">
                        Allergens:
                      </span>
                      {d.allergens.map((alg) => (
                        <span
                          key={alg}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-soft-coral/20 text-[#7a2e20] border border-soft-coral/30 font-medium"
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-text block">Quantity</span>
                    <span className="text-base font-extrabold text-forest-night">
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
