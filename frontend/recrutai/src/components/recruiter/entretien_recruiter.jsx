// src/components/RecruiterInterviews.jsx
import React, { useState, useEffect } from "react";
import { fetchRecruiterInterviews } from "../../services/api"; // Import de l'API

const RecruiterInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données des interviews depuis l'API
  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const data = await fetchRecruiterInterviews();
        // Formater les données pour correspondre à l'affichage existant
        const formattedInterviews = data.map((interview) => ({
          id: interview.id,
          candidateName: interview.candidate_name,
          offerName: interview.offer_title,
          status: interview.status,
          score: interview.result ? interview.result : null,
          video: interview.interview_link,
        }));
        console.log(formattedInterviews);
        setInterviews(formattedInterviews);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des interviews :", err);
        setError("Failed to load interviews.");
        setLoading(false);
      }
    };

    loadInterviews();
  }, []);

  if (loading) return <p>Loading interviews...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Candidate Interviews</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 hidden md:table">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2 text-left">Candidate Name</th>
              <th className="border px-4 py-2 text-left">Offer Name</th>
              <th className="border px-4 py-2 text-left">Score</th>
              <th className="border px-4 py-2 text-left">Status</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview) => (
              <tr key={interview.id} className="border">
                <td className="border px-4 py-2">{interview.candidateName}</td>
                <td className="border px-4 py-2">{interview.offerName}</td>
                <td className="border px-4 py-2">
                  {interview.score !== null ? `${interview.score.score}/100` : "Not Scored Yet"}
                </td>
                <td className="border px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-white ${
                      interview.status === "evaluated"
                        ? "bg-green-500"
                        : interview.status === "processing"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {interview.status}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  {interview.status !== "available" && interview.video ? (
                    <button
                      onClick={() => window.open(interview.video, "_blank")}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      View Interview
                    </button>
                  ) : (
                    <span className="text-gray-500">No Video Available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mode carte pour mobile */}
      <div className="md:hidden">
        {interviews.map((interview) => (
          <div
            key={interview.id}
            className="border rounded-lg mb-4 p-4 shadow-sm bg-gray-50"
          >
            <h2 className="font-bold text-lg">{interview.candidateName}</h2>
            <p>
              <span className="font-semibold">Offer: </span>
              {interview.offerName}
            </p>
            <p>
              <span className="font-semibold">Score: </span>
              {interview.score !== null ? `${interview.score.score}/10` : "Not Scored Yet"}
            </p>
            <p>
              <span className="font-semibold">Status: </span>
              <span
                className={`px-2 py-1 rounded text-white ${
                  interview.status === "evaluated"
                    ? "bg-green-500"
                    : interview.status === "processing"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              >
                {interview.status}
              </span>
            </p>
            <div className="mt-2">
              {interview.status === "available" && interview.video ? (
                <button
                  onClick={() => window.open(interview.video, "_blank")}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  View Interview
                </button>
              ) : (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                >
                  No Video Available
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecruiterInterviews;
