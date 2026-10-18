import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PublicLayout } from './layouts/PublicLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { FoodDiscoveryPage } from './pages/public/FoodDiscoveryPage';
import { FoodDetailsPage } from './pages/public/FoodDetailsPage';
import { ImpactPage } from './pages/public/ImpactPage';
import { FoodSafetyPage } from './pages/public/FoodSafetyPage';
import { AboutPage } from './pages/public/AboutPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';
import { HelpPage } from './pages/public/HelpPage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

export function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#F5F5EC',
            color: '#18372B',
            border: '1px solid rgba(255, 255, 255, 0.28)',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(9, 35, 25, 0.1)',
          },
        }}
      />
      <Routes>
        {/* Public Marketing & Informational Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/food" element={<FoodDiscoveryPage />} />
          <Route path="/food/:id" element={<FoodDetailsPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/food-safety" element={<FoodSafetyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* 404 Not Found Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
