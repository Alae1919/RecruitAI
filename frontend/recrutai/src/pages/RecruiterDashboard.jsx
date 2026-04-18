import React from "react";
import { Outlet } from "react-router-dom";
import RecruiterHeader from "../components/recruiter/RecruiterHeader";

const RecruiterDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <RecruiterHeader />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default RecruiterDashboard;
