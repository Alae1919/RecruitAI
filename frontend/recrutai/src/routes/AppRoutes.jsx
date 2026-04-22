import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import ErrorBoundary from '../components/layout/ErrorBoundary';

import Home     from '../pages/home';
import Login    from '../pages/login';
import Register from '../pages/Register';

const RecruiterDashboard       = lazy(() => import('../pages/RecruiterDashboard'));
const ViewOffers               = lazy(() => import('../components/recruiter/ViewOffers'));
const AddOffer                 = lazy(() => import('../components/recruiter/AddOffer'));
const RecruiterProfile         = lazy(() => import('../components/recruiter/RecruiterProfile'));
const RecruiterCandidates      = lazy(() => import('../components/recruiter/recruiter_candidate'));
const RecruiterInterviews      = lazy(() => import('../components/recruiter/entretien_recruiter'));
const InterviewQuestionsPage   = lazy(() => import('../components/recruiter/questions/InterviewQuestionsPage'));
const JobseekerDashboard    = lazy(() => import('../pages/JobseekerDashboard'));
const JobSeekerEntretien    = lazy(() => import('../components/jobseeker/JobSeekerEntretien'));
const JobSeekerProfile      = lazy(() => import('../components/jobseeker/JobSeekerProfile'));
const JobSeekerCandidate    = lazy(() => import('../components/jobseeker/JobSeekerCandidate'));
const JobSeekerApplications = lazy(() => import('../components/jobseeker/JobSeekerApplications'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-brand-base">
      <div className="flex flex-col items-center gap-4">
        <span className="text-xl font-bold text-gray-900 dark:text-brand-text-primary">
          RecrutAI<span className="text-brand-accent">.</span>
        </span>
        <Spinner size="md" />
      </div>
    </div>
  );
}

const ROLE_HOME = {
  RECRUITER: '/recruiter-dashboard',
  JOBSEEKER: '/jobseeker-dashboard',
};

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    const home = ROLE_HOME[user.role] ?? '/';
    return <Navigate to={home} replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/recruiter-dashboard"
            element={
              <ProtectedRoute requiredRole="RECRUITER">
                <ErrorBoundary>
                  <RecruiterDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="view-offers" replace />} />
            <Route path="view-offers" element={<ViewOffers />} />
            <Route path="add-offers" element={<AddOffer />} />
            <Route path="profile" element={<RecruiterProfile />} />
            <Route path="recruiter_candidate" element={<RecruiterCandidates />} />
            <Route path="recruiter_candidate_entretien" element={<RecruiterInterviews />} />
            <Route path="offers/:offerId/questions" element={<InterviewQuestionsPage />} />
          </Route>

          <Route
            path="/jobseeker-dashboard"
            element={
              <ProtectedRoute requiredRole="JOBSEEKER">
                <ErrorBoundary>
                  <JobseekerDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="mes_applications" replace />} />
            <Route path="mes_applications" element={<JobSeekerApplications />} />
            <Route path="mes_candidatures" element={<JobSeekerCandidate />} />
            <Route path="mes_entretiens" element={<JobSeekerEntretien />} />
            <Route path="profile" element={<JobSeekerProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
