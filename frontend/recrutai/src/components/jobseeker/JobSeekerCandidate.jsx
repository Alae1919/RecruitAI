
import React, { useEffect, useState } from "react";
import {getJobSeekerApplications }from "../../services/api"; // Importez le service

const JobSeekerCandidate = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les candidatures depuis l'API
  const fetchApplications = async () => {
    try {
      const data = await getJobSeekerApplications();
      setApplications(data);
    } catch (err) {
      setError("Failed to load applications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Appel de l'API au montage du composant
  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h2>

      {loading ? (
        <p className="text-gray-600 text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : applications.length > 0 ? (
        <table className="table-auto w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-sm text-gray-600">Offer Name</th>
              <th className="px-4 py-2 text-sm text-gray-600">Status</th>
              <th className="px-4 py-2 text-sm text-gray-600">Applied At</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b hover:bg-gray-100">
                <td className="px-4 py-2">{app.job_offer_title}</td>
                <td
                  className={`px-4 py-2 font-medium ${
                    app.status === "Accepted"
                      ? "text-green-600"
                      : app.status === "Rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {app.status}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {new Date(app.applied_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600 text-center">No applications found.</p>
      )}
    </div>
  );
};

export default JobSeekerCandidate;

/*
const JobSeekerCandidate = () => {
  // Données fictives des candidatures
  const applications = [
    {
      id: 1,
      offerName: "Frontend Developer",
      status: "Accepted",
    },
    {
      id: 2,
      offerName: "Backend Developer",
      status: "In Progress",
    },
    {
      id: 3,
      offerName: "Data Scientist",
      status: "Rejected",
    },
  ];

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h2>
      {applications.length > 0 ? (
        <table className="table-auto w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-sm text-gray-600">Offer Name</th>
              <th className="px-4 py-2 text-sm text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b hover:bg-gray-100">
                <td className="px-4 py-2">{app.offerName}</td>
                <td
                  className={`px-4 py-2 font-medium ${
                    app.status === "Accepted"
                      ? "text-green-600"
                      : app.status === "Rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {app.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600 text-center">No applications found.</p>
      )}
    </div>
  );
};

export default JobSeekerCandidate;
*/