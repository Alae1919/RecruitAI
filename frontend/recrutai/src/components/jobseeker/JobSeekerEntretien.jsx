// src/components/JobSeekerEntretien.jsx
import React, { useState, useEffect } from "react";
import JobSeekerInterviewProcess from "./JobSeekerInterviewProcess";
import { fetchJobSeekerInterviews } from "../../services/api";
import JobSeekerInterviewAnswers from "./JobSeekerInterviewAnswers";


const JobSeekerEntretien = () => {
  const [interviews, setInterviews] = useState([]);
  const [currentInterview, setCurrentInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);

const handleViewInterview = (interviewId) => {
  setSelectedInterview(interviewId);
};

  // Charger les interviews depuis l'API
  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const data = await fetchJobSeekerInterviews();
        console.log(data);
        const formattedInterviews = data.map((item) => ({
          id: item.id,
          candidateName: item.candidate_name,
          offerName: item.offer_name,
          status: item.status,
          score: item.result ? item.result.score : null,
          video: item.interview_link ? item.interview_link : null,
        }));
        setInterviews(formattedInterviews);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des interviews :", err);
        setError("Failed to load interviews. Please try again later.");
        setLoading(false);
      }
    };

    loadInterviews();
  }, []);

  if (loading) return <p>Loading interviews...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      {currentInterview ? (
        <JobSeekerInterviewProcess
          interview={currentInterview}
          onClose={() => setCurrentInterview(null)}
        />
      ) : (selectedInterview ? (
        <JobSeekerInterviewAnswers
          interviewId={selectedInterview}
          onBack={() => setSelectedInterview(null)}
        />
      ) :(
        <>
          <h1 className="text-2xl font-bold mb-6 text-gray-800">My Interviews</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 hidden md:table">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-4 py-2 text-left">Offer Name</th>
                  <th className="border px-4 py-2 text-left">Status</th>
                  <th className="border px-4 py-2 text-left">Score</th>
                  <th className="border px-4 py-2 text-left">Passer l'entretien</th>
                  <th className="border px-4 py-2 text-left">View Interview</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview.id} className="border">
                    <td className="border px-4 py-2">{interview.offerName}</td>
                    <td className="border px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-white ${
                          interview.status === "completed"
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
                      {interview.score !== null
                        ? `${interview.score}/10`
                        : "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() =>
                          interview.status !== "available"
                            ? setCurrentInterview(interview)
                            : null
                        }
                        disabled={interview.status === "available"}
                        className={`px-4 py-2 rounded hover:bg-blue-600 ${
                          interview.status !== "available"
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-blue-500 text-white cursor-pointer"
                        }`}
                      >
                        Passer l'entretien
                      </button>
                      
                    </td>
                    <td className="border px-4 py-2">
                    <button
                      onClick={() => handleViewInterview(interview.id)}
                      disabled={interview.status === "available"}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      View Interview
                    </button>
                    
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
                className="border rounded-lg mb-4 p-4 shadow-sm"
              >
                <h2 className="font-bold text-lg">{interview.offerName}</h2>
                <p>
                  <span className="font-semibold">Status: </span>
                  <span
                    className={`px-2 py-1 rounded text-white ${
                      interview.status === "completed"
                        ? "bg-green-500"
                        : interview.status === "processing"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {interview.status}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Score: </span>
                  {interview.score !== null
                    ? `${interview.score}/10`
                    : "N/A"}
                </p>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() =>
                      interview.status === "available"
                        ? setCurrentInterview(interview)
                        : null
                    }
                    disabled={interview.status !== "available"}
                    className={`px-4 py-2 rounded w-full hover:bg-blue-600 ${
                      interview.status !== "available"
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-500 text-white cursor-pointer"
                    }`}
                  >
                    Passer l'entretien
                  </button>
                  
                  <button
                    onClick={() =>
                      handleViewInterview(interview.id)}
                    
                    disabled={interview.status === "available"}
                    className={`px-4 py-2 rounded w-full hover:bg-green-600 ${
                      interview.status !== "available"
                        ? "bg-green-500 text-white cursor-pointer"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    View Interview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ))}
    </div>
  );
};

export default JobSeekerEntretien;
