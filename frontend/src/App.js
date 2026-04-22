import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LandingPage from '@/pages/LandingPage';
import ConciergePage from '@/pages/ConciergePage';
import MapPage from '@/pages/MapPage';
import ChatPage from '@/pages/ChatPage';
import SafetyPage from '@/pages/SafetyPage';
import TripsPage from '@/pages/TripsPage';
import SignInPage from '@/pages/SignInPage';
import RegisterPage from '@/pages/RegisterPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import PartnerRegisterPage from '@/pages/PartnerRegisterPage';
import PartnerDashboardPage from '@/pages/PartnerDashboardPage';
import BlogPage from '@/pages/BlogPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DestinationsPage from '@/pages/DestinationsPage';
import DashboardRouterPage from '@/pages/DashboardRouterPage';
import ArtisanDashboardPage from '@/pages/ArtisanDashboardPage';
import AgencyDashboardPage from '@/pages/AgencyDashboardPage';
import HotelDashboardPage from '@/pages/HotelDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/concierge" element={<ConciergePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/itineraries" element={<TripsPage />} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/auth/signin" element={<SignInPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/subscription/success" element={<SubscriptionPage />} />
            <Route path="/subscription/cancel" element={<SubscriptionPage />} />
            <Route path="/partner/register" element={<PartnerRegisterPage />} />
            <Route path="/partner/dashboard" element={<PartnerDashboardPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/dashboard" element={<DashboardRouterPage />} />
            <Route path="/dashboard/client" element={<DashboardPage />} />
            <Route path="/dashboard/artisan" element={<ArtisanDashboardPage />} />
            <Route path="/dashboard/agency" element={<AgencyDashboardPage />} />
            <Route path="/dashboard/hotel" element={<HotelDashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="bottom-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
