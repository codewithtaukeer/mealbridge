import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-ivory text-primary-text selection:bg-fresh-mint selection:text-forest-night">
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
