import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PublicLayout from "../components/layouts/PublicLayout";

import Home from "../pages/home";
import Login from "../pages/login";
import Register from "../pages/Register";

const RecruiterDashboard   = lazy(() => import("../pages/RecruiterDashboard"));
const ViewOffers           = lazy(() => import("../components/recruiter/ViewOffers"));
const AddOffer             = lazy(() => import("../components/recruiter/AddOffer"));
const RecruiterProfile     = lazy(() => import("../components/recruiter/RecruiterProfile"));
const RecruiterCandidates  = lazy(() => import("../components/recruiter/recruiter_candidate"));
const RecruiterInterviews  = lazy(() => import("../components/recruiter/entretien_recruiter"));
const JobseekerDashboard   = lazy(() => import("../pages/JobseekerDashboard"));
const JobSeekerEntretien   = lazy(() => import("../components/jobseeker/JobSeekerEntretien"));
const JobSeekerProfile     = lazy(() => import("../components/jobseeker/JobSeekerProfile"));
const JobSeekerCandidate   = lazy(() => import("../components/jobseeker/JobSeekerCandidate"));
const JobSeekerApplications = lazy(() => import("../components/jobseeker/JobSeekerApplications"));

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

        <Route
          path="/recruiter-dashboard"
          element={
            <ProtectedRoute requiredRole="RECRUITER">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="add-offers" element={<AddOffer />} />
          <Route path="view-offers" element={<ViewOffers />} />
          <Route path="profile" element={<RecruiterProfile />} />
          <Route path="recruiter_candidate" element={<RecruiterCandidates />} />
          <Route path="recruiter_candidate_entretien" element={<RecruiterInterviews />} />
        </Route>

        <Route
          path="/jobseeker-dashboard"
          element={
            <ProtectedRoute requiredRole="JOBSEEKER">
              <JobseekerDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="mes_candidatures" element={<JobSeekerCandidate />} />
          <Route path="mes_entretiens" element={<JobSeekerEntretien />} />
          <Route path="mes_applications" element={<JobSeekerApplications />} />
          <Route path="profile" element={<JobSeekerProfile />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;
