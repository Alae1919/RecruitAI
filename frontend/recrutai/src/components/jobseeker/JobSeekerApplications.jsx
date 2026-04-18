import React, { useEffect, useState } from "react";
import {getJobOffers,applyForJob} from "../../services/api"; // Importez le service

const JobOffers = () => {
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les offres depuis l'API
  useEffect(() => {
    const fetchJobOffers = async () => {
      try {
        const data = await getJobOffers();
        setJobOffers(data);
      } catch (err) {
        setError("Failed to load job offers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobOffers();
  }, []);

  const handleApply = async (jobOfferId) => {
    try {
      await applyForJob(jobOfferId);
      alert("Your application has been submitted successfully!");
    } catch (err) {
      alert("Failed to submit application. Please try again later.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Job Offers</h1>

      {loading ? (
        <p className="text-gray-600 text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : jobOffers.length > 0 ? (
        <ul className="space-y-4">
          {jobOffers.map((offer) => (
            <li
              key={offer.id}
              className="p-4 bg-white shadow-md rounded-lg border flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {offer.title}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Description:</strong> {offer.description}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Location:</strong> {offer.location}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Salary:</strong> {offer.salary_range}
                </p>
              </div>
              <button
                onClick={() => handleApply(offer.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Apply
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 text-center">No job offers available.</p>
      )}
    </div>
  );
};

export default JobOffers;
