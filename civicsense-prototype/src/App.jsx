import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, AuthProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import RequireRole from "./components/RequireRole";
import ErrorBoundary from "./components/ErrorBoundary";
import AIChatbotWidget from "./components/AIChatbotWidget";
import NotificationSimulator from "./components/NotificationSimulator";

import Landing from "./pages/Landing";
import Login from "./pages/Login";

import CitizenLayout from "./pages/citizen/CitizenLayout";
import CitizenHome from "./pages/citizen/CitizenHome";
import FileComplaint from "./pages/citizen/FileComplaint";
import TrackComplaint from "./pages/citizen/TrackComplaint";
import IssueMapPage from "./pages/citizen/IssueMapPage";
import VotingSystem from "./pages/citizen/VotingSystem";
import Rewards from "./pages/citizen/Rewards";
import SOS from "./pages/citizen/SOS";

import GovLayout from "./pages/gov/GovLayout";
import GovDashboard from "./pages/gov/GovDashboard";
import GovQueue from "./pages/gov/GovQueue";
import GovAnalytics from "./pages/gov/GovAnalytics";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminCitizens from "./pages/admin/AdminCitizens";
import AdminGov from "./pages/admin/AdminGov";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  return (
    <ErrorBoundary title="CivicSense Portal Initialization Error">
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login/:role" element={<Login />} />
                <Route path="/voting-system" element={<VotingSystem />} />
                <Route path="/issue-map" element={<IssueMapPage />} />
                <Route path="/sos" element={<SOS />} />

                <Route
                  path="/citizen"
                  element={
                    <ErrorBoundary title="Citizen Portal Encountered an Issue">
                      <RequireRole role="citizen">
                        <CitizenLayout />
                      </RequireRole>
                    </ErrorBoundary>
                  }
                >
                  <Route index element={<CitizenHome />} />
                  <Route path="file" element={<FileComplaint />} />
                  <Route path="track" element={<TrackComplaint />} />
                  <Route path="map" element={<IssueMapPage />} />
                  <Route path="voting" element={<VotingSystem />} />
                  <Route path="rewards" element={<Rewards />} />
                  <Route path="sos" element={<SOS />} />
                </Route>

                <Route
                  path="/gov"
                  element={
                    <ErrorBoundary title="Government Portal Encountered an Issue">
                      <RequireRole role="gov">
                        <GovLayout />
                      </RequireRole>
                    </ErrorBoundary>
                  }
                >
                  <Route index element={<GovDashboard />} />
                  <Route path="queue" element={<GovQueue />} />
                  <Route path="dashboard" element={<GovDashboard />} />
                  <Route path="analytics" element={<GovAnalytics />} />
                </Route>

                <Route
                  path="/admin"
                  element={
                    <ErrorBoundary title="Admin Portal Encountered an Issue">
                      <RequireRole role="admin">
                        <AdminLayout />
                      </RequireRole>
                    </ErrorBoundary>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="citizens" element={<AdminCitizens />} />
                  <Route path="gov" element={<AdminGov />} />
                  <Route path="audit" element={<AdminAuditLog />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<Landing />} />
              </Routes>

              {/* Fixed Floating AI CivicSense Chatbot Widget */}
              <AIChatbotWidget />

              {/* Automated SMS / WhatsApp Notification Simulator */}
              <NotificationSimulator />
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}


