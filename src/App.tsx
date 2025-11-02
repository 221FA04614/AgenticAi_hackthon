import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { ProfileSetup } from "./pages/ProfileSetup";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EditEventPage } from "./pages/EditEventPage";
import { EventDetailsPage } from "./pages/EventDetailsPage";
import { EventsPage } from "./pages/EventsPage";
import { MyEventsPage } from "./pages/MyEventsPage";
import { MyRegistrationsPage } from "./pages/MyRegistrationsPage";
import { PastEventsPage } from "./pages/PastEventsPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { FeedbackSummaryPage } from "./pages/FeedbackSummaryPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminPortalPage } from "./pages/AdminPortalPage";
import { ProposalFormPage } from "./pages/ProposalFormPage";
import { MyProposalsPage } from "./pages/MyProposalsPage";
import { Toaster } from "sonner";

function App() {
  const user = useQuery(api.auth.loggedInUser);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user === undefined ? (
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : user === null ? (
          <Routes>
            <Route path="/admin-portal" element={<AdminPortalPage />} />
            <Route path="/*" element={<LandingPageWithAuth />} />
          </Routes>
        ) : (
          <AuthenticatedApp />
        )}
        
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function LandingPageWithAuth() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin-portal" element={<AdminPortalPage />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthenticatedApp() {
  const user = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.users.getCurrentUserProfile);

  if (user === undefined || profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user exists but no profile, show profile setup
  if (user && !profile) {
    return <ProfileSetup />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/events/:eventId/edit" element={<EditEventPage />} />
        <Route path="/events/:eventId/feedback" element={<FeedbackPage />} />
        <Route path="/events/:eventId/feedback-summary" element={<FeedbackSummaryPage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/my-registrations" element={<MyRegistrationsPage />} />
        <Route path="/past-events" element={<PastEventsPage />} />
        <Route path="/submit-proposal" element={<ProposalFormPage />} />
        <Route path="/my-proposals" element={<MyProposalsPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin-portal" element={<AdminPortalPage />} />
        <Route path="/*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
