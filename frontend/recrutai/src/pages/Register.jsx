import React, { useState } from "react";
import RecruiterForm from "../components/registration/RecruiterForm";
import JobSeekerForm from "../components/registration/JobSeekerForm";

const Register = () => {
  const [role, setRole] = useState(""); // État pour gérer le rôle sélectionné

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white mt-20 ">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Register</h2>

        {/* Sélection du Rôle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select your role
          </label>
          <select
            value={role}
            onChange={handleRoleChange}
            className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          >
            <option value="">Choose your role</option>
            <option value="recruiter">Recruiter</option>
            <option value="job_seeker">Job Seeker</option>
          </select>
        </div>

        {/* Formulaires Dynamiques */}
        {role === "recruiter" && <RecruiterForm />}
        {role === "job_seeker" && <JobSeekerForm />}
        {!role && (
          <p className="text-gray-600 text-sm">Please select a role to continue.</p>
        )}
      </div>
    </div>
  );
};

export default Register;
