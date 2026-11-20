import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { AlexandriaPortPage } from './pages/AlexandriaPortPage';
import { DekheilaPortPage } from './pages/DekheilaPortPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ShipperDashboardPage } from './pages/ShipperDashboardPage';
import { CarrierDashboardPage } from './pages/CarrierDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NewShipmentPage } from './pages/NewShipmentPage';
import { ShipmentDetailsPage } from './pages/ShipmentDetailsPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/ports/alexandria" element={<AlexandriaPortPage />} />
              <Route path="/ports/dekheila" element={<DekheilaPortPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/shipper" element={<ShipperDashboardPage />} />
              <Route path="/carrier" element={<CarrierDashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/shipments/new" element={<NewShipmentPage />} />
              <Route path="/shipments/:shipmentId" element={<ShipmentDetailsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
