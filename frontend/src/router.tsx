import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

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

export const router = createBrowserRouter([
  // Public
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/builder", element: <WeddingBuilderPage /> },

  // Planner Workspace
  {
    path: "/planner",
    element: <PlannerLayout />,
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

  // Couple Sanctuary
  {
    path: "/couple",
    element: <CoupleLayout />,
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
