import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Pages
import OLogin from "./pages/auth/OLogin";
import OWelcome from "./pages/kiosk/OWelcome";
import OIssueTicket from "./pages/kiosk/OIssueTicket";
import OMobileQueueStatus from "./pages/customer/OMobileQueueStatus";
import ODashboard from "./pages/admin/ODashboard";
import OStaffPerformanceReport from "./pages/admin/OStaffPerformanceReport";
import OWorkflowDesigner from "./pages/admin/OWorkflowDesigner";
import StaffControlPage from "./pages/staff/StaffControlPage";
import OStaffOperations from "./pages/staff/OStaffOperations";
import OBulkQueueManagement from "./pages/staff/OBulkQueueManagement";
import ODisplayBoard from "./pages/board/ODisplayBoard";
import "./i18n";
import { apiPath } from "./config/api";
import OTicketIssued from "./pages/kiosk/OTicketIssued";

// Layouts
import MainLayout from "./layouts/MainLayout";

// --- Protected Route Component ---
const RequireAuth: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );

  return user ? <Outlet /> : <Navigate to="/" replace />;
};

// --- Wrapper Pages ---
const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <OWelcome
      onSelectCategory={(categoryId) => {
        console.log("Category Selected:", categoryId);
        navigate("/kiosk/issue", { state: { category: categoryId } });
      }}
    />
  );
};

const IssueTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const category = (location.state as any)?.category || "RESTAURANT"; // Fallback

  // Verify Profile Exists
  const profileId = localStorage.getItem("adaqueue_selected_profile");
  if (!profileId) {
    return <Navigate to="/kiosk" replace />;
  }

  return (
    <OIssueTicket
      category={category}
      onConfirm={async (data) => {
        const docNo =
          data?.queue?.docNo ||
          localStorage.getItem("adaqueue_last_queue_docno");
        navigate("/kiosk/ticket", { state: { docNo } });
      }}
      onBack={() => navigate("/kiosk")}
    />
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors duration-200">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<OLogin />} />

              {/* Kiosk Routes (Usually running on separate machine, maybe public or protected by simple guard) */}
              <Route path="/kiosk" element={<WelcomePage />} />
              <Route path="/kiosk/issue" element={<IssueTicketPage />} />
              <Route path="/kiosk/ticket" element={<OTicketIssued />} />

              {/* Customer Mobile Route */}
              <Route path="/q/:id" element={<OMobileQueueStatus />} />

              {/* Display Board Route */}
              <Route path="/board" element={<ODisplayBoard />} />

              {/* Staff Only Routes (Direct Access) */}
              <Route path="/staff-direct" element={<OStaffOperations />} />

              {/* Protected Admin/Staff Routes with Layout */}
              <Route element={<RequireAuth />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin/dashboard" element={<ODashboard />} />
                  <Route
                    path="/admin/reports"
                    element={<OStaffPerformanceReport />}
                  />
                  <Route
                    path="/admin/workflow"
                    element={<OWorkflowDesigner />}
                  />
                  <Route path="/staff/control" element={<StaffControlPage />} />
                  <Route
                    path="/staff/operations"
                    element={<OStaffOperations />}
                  />
                  <Route
                    path="/staff/bulk-management"
                    element={<OBulkQueueManagement />}
                  />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
