import React from "react";
import { Outlet } from "react-router-dom";
import RecruiterHeader from "../components/jobseeker/JobSeekerHeader";
import JobSeekerHeader from "../components/jobseeker/JobSeekerHeader";

const JobseekerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <JobSeekerHeader />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default JobseekerDashboard;