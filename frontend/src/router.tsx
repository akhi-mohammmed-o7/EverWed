import React from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { EverWedLogo } from "@/components/ui/EverWedLogo";

// Layouts
import { PlannerLayout } from "@/components/layout/PlannerLayout";
import { CoupleLayout } from "@/components/layout/CoupleLayout";

// Public Pages
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { WeddingBuilderPage } from "@/pages/builder/WeddingBuilderPage";

// Planner Pages
import { OverviewPage } from "@/pages/planner/OverviewPage";
import { EnquiriesPage } from "@/pages/planner/EnquiriesPage";
import { WeddingsPage } from "@/pages/planner/WeddingsPage";
import { WeddingDetailPage } from "@/pages/planner/WeddingDetailPage";
import { VendorsPage } from "@/pages/planner/VendorsPage";
import { QuotesPage } from "@/pages/planner/QuotesPage";
import { TasksPage } from "@/pages/planner/TasksPage";
import { OperationsPage } from "@/pages/planner/OperationsPage";
import { FinancePage } from "@/pages/planner/FinancePage";
import { RiskRadarPage } from "@/pages/planner/RiskRadarPage";

// Couple Pages
import { CoupleDashboardPage } from "@/pages/couple/CoupleDashboardPage";
import { CoupleOverviewPage } from "@/pages/couple/CoupleOverviewPage";
import { CoupleEventsPage } from "@/pages/couple/CoupleEventsPage";
import { CoupleGuestsPage } from "@/pages/couple/CoupleGuestsPage";
import { CoupleChecklistPage } from "@/pages/couple/CoupleChecklistPage";
import { CoupleBudgetPage } from "@/pages/couple/CoupleBudgetPage";
import { CoupleVendorsPage } from "@/pages/couple/CoupleVendorsPage";
import { CoupleMoodboardPage } from "@/pages/couple/CoupleMoodboardPage";

/**
 * Route protection wrapper verifying authentication and role authorization.
 */
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}> = ({ children, allowedRoles, redirectPath = "/login" }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center p-4 font-sans">
        <div className="text-center space-y-3">
          <EverWedLogo variant="mark" size="lg" />
          <p className="text-xs text-muted-foreground animate-pulse font-semibold">
            Verifying EverWed session authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a couple tries to access planner routes, gracefully redirect to their dashboard
    if (user.role === "couple") {
      return <Navigate to="/couple/dashboard" replace />;
    }
    return <Navigate to="/planner" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/builder", element: <WeddingBuilderPage /> },

  // Planner Workspace (Admin & Planner only)
  {
    path: "/planner",
    element: (
      <ProtectedRoute allowedRoles={["admin", "planner"]}>
        <PlannerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "enquiries", element: <EnquiriesPage /> },
      { path: "weddings", element: <WeddingsPage /> },
      { path: "weddings/:id", element: <WeddingDetailPage /> },
      { path: "vendors", element: <VendorsPage /> },
      { path: "quotes", element: <QuotesPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "operations", element: <OperationsPage /> },
      { path: "finance", element: <FinancePage /> },
      { path: "risk-radar", element: <RiskRadarPage /> },
    ],
  },

  // Couple Sanctuary (Accessible to Couple, and Admin/Planner for inspection)
  {
    path: "/couple",
    element: (
      <ProtectedRoute allowedRoles={["couple", "admin", "planner"]}>
        <CoupleLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/couple/dashboard" replace /> },
      { path: "dashboard", element: <CoupleDashboardPage /> },
      { path: "overview", element: <CoupleOverviewPage /> },
      { path: "events", element: <CoupleEventsPage /> },
      { path: "guests", element: <CoupleGuestsPage /> },
      { path: "checklist", element: <CoupleChecklistPage /> },
      { path: "budget", element: <CoupleBudgetPage /> },
      { path: "vendors", element: <CoupleVendorsPage /> },
      { path: "moodboard", element: <CoupleMoodboardPage /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);
