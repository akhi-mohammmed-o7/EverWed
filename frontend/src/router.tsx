import React from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { EverWedLogo } from "@/components/ui/EverWedLogo";

// Layouts
import { PlannerLayout } from "@/components/layout/PlannerLayout";
import { CoupleLayout } from "@/components/layout/CoupleLayout";

// Public Pages
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage, PortalSelectionPage } from "@/pages/public/LoginPage";
import { CoupleSignupPage } from "@/pages/public/CoupleSignupPage";
import { CoupleWeddingBuilderPage } from "@/pages/couple/CoupleWeddingBuilderPage";
import { PlannerSignupPage } from "@/pages/public/PlannerSignupPage";

// Staff Pages
import { OverviewPage } from "@/pages/planner/OverviewPage";
import { EnquiriesPage } from "@/pages/planner/EnquiriesPage";
import { WeddingsPage } from "@/pages/planner/WeddingsPage";
import { WeddingDetailPage } from "@/pages/planner/WeddingDetailPage";
import { VendorsPage } from "@/pages/planner/VendorsPage";
import { TasksPage } from "@/pages/planner/TasksPage";
import { TeamManagementPage } from "@/pages/planner/TeamManagementPage";
import { PlannerHomePage } from "@/pages/planner/PlannerHomePage";
import { FinancePage } from "@/pages/planner/FinancePage";

// Couple Pages
import { CoupleDashboardPage } from "@/pages/couple/CoupleDashboardPage";
import { CoupleOverviewPage } from "@/pages/couple/CoupleOverviewPage";
import { CoupleEventsPage } from "@/pages/couple/CoupleEventsPage";
import { CoupleGuestsPage } from "@/pages/couple/CoupleGuestsPage";
import { CoupleChecklistPage } from "@/pages/couple/CoupleChecklistPage";
import { CoupleBudgetPage } from "@/pages/couple/CoupleBudgetPage";

const PlannerWorkspaceHome: React.FC = () => {
  const { user } = useAuth();
  return user?.role === "admin" ? <OverviewPage /> : <PlannerHomePage />;
};

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
    if (user.role === "couple") {
      return <Navigate to="/couple/dashboard" replace />;
    }
    return <Navigate to="/planner" replace />;
  }

  // A couple without a wedding must complete the Wedding Builder first.
  if (user.role === "couple" && !user.wedding_id && location.pathname !== "/couple/builder") {
    return <Navigate to="/couple/builder" replace />;
  }

  return <>{children}</>;
};

const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
);

export const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <PortalSelectionPage /> },
  { path: "/login/founder", element: <LoginPage portal="founder" /> },
  { path: "/login/planner", element: <LoginPage portal="planner" /> },
  { path: "/login/couple", element: <LoginPage portal="couple" /> },
  { path: "/register/couple", element: <CoupleSignupPage /> },
  { path: "/register/planner", element: <PlannerSignupPage /> },

  // Staff workspace (Founder & Planner only)
  {
    path: "/planner",
    element: (
      <ProtectedRoute allowedRoles={["admin", "planner"]}>
        <PlannerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PlannerWorkspaceHome /> },
      { path: "enquiries", element: <AdminOnly><EnquiriesPage /></AdminOnly> },
      { path: "weddings", element: <WeddingsPage /> },
      { path: "weddings/:id", element: <WeddingDetailPage /> },
      { path: "finance", element: <FinancePage /> },
      { path: "vendors", element: <VendorsPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "team", element: <AdminOnly><TeamManagementPage /></AdminOnly> },
    ],
  },

  // Couple portal
  {
    path: "/couple",
    element: (
      <ProtectedRoute allowedRoles={["couple"]}>
        <CoupleLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/couple/dashboard" replace /> },
      { path: "onboarding", element: <Navigate to="/couple/builder" replace /> },
      { path: "builder", element: <CoupleWeddingBuilderPage /> },
      { path: "dashboard", element: <CoupleDashboardPage /> },
      { path: "overview", element: <CoupleOverviewPage /> },
      { path: "events", element: <CoupleEventsPage /> },
      { path: "guests", element: <CoupleGuestsPage /> },
      { path: "checklist", element: <CoupleChecklistPage /> },
      { path: "budget", element: <CoupleBudgetPage /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);
