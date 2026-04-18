import React, { useState, useEffect } from "react";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import {
  fetchJobOffers,
  fetchCandidatesForJobOffer,
  acceptCandidate,
  rejectCandidate
} from "../../services/api";
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js';

const JobOffersWithCandidates = () => {
  const [jobOffers, setJobOffers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobOffer, setSelectedJobOffer] = useState(null);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  useEffect(() => {
    // Charger la liste des offres d'emploi
    const loadJobOffers = async () => {
      try {
        const data = await fetchJobOffers();
        setJobOffers(data);
      } catch (error) {
        console.error("Failed to load job offers:", error);
      } finally {
        setLoadingOffers(false);
      }
    };
    loadJobOffers();
  }, []);

  const CandidateResume = ({ resumeUrl }) => {
    const [pdfBlob, setPdfBlob] = useState(null);

    useEffect(() => {
      let isMounted = true;

      const fetchPdf = async () => {
        try {
          const response = await fetch(resumeUrl, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // Ajoutez des en-têtes si nécessaire
            },
          });
          const blob = await response.blob();
          if (isMounted) {
            setPdfBlob(URL.createObjectURL(blob));
          }
        } catch (error) {
          console.error('Failed to fetch the PDF:', error);
        }
      };

      fetchPdf();

      return () => {
        isMounted = false;
      };
    }, [resumeUrl]);

    return (
      <div style={{ height: '500px' }}>
        <Worker workerUrl={pdfjsWorker}>
          {pdfBlob ? (
            <Viewer fileUrl={pdfBlob} />
          ) : (
            <p>Loading the PDF...</p>
          )}
        </Worker>
      </div>
    );
  };

  const handleViewCandidates = async (jobOffer) => {
    setLoadingCandidates(true);
    setSelectedJobOffer(jobOffer);

    try {
      const data = await fetchCandidatesForJobOffer(jobOffer.id);
      setCandidates(data);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleViewResume = (resumeUrl) => {
    setSelectedResume(resumeUrl); 
    window.open(resumeUrl, "_blank");
  };

  const handleAcceptCandidate = async (applicationId) => {
    try {
      await acceptCandidate(applicationId);
      alert("Candidat accepté avec succès.");
      
      // Mettre à jour le statut du candidat localement
      const updatedCandidates = candidates.map(candidate => 
        candidate.id === applicationId 
          ? { ...candidate, status: "accepted" } 
          : candidate
      );
      setCandidates(updatedCandidates);

    } catch (error) {
      console.error("Erreur lors de l'acceptation du candidat :", error);
      alert("Erreur lors de l'acceptation du candidat.");
    }
  };

  const handleRejectCandidate = async (applicationId) => {
    try {
      await rejectCandidate(applicationId);
      alert("Candidat rejeté avec succès.");
      
      // Mettre à jour le statut du candidat localement
      const updatedCandidates = candidates.map(candidate => 
        candidate.id === applicationId 
          ? { ...candidate, status: "rejected" } 
          : candidate
      );
      setCandidates(updatedCandidates);

    } catch (error) {
      console.error("Erreur lors du rejet du candidat :", error);
      alert("Erreur lors du rejet du candidat.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Job Offers</h2>

      {loadingOffers ? (
        <p>Loading job offers...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-4 py-2 text-left text-gray-600 font-medium">
                  Offer Title
                </th>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {jobOffers.map((offer) => (
                <tr key={offer.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">{offer.title}</td>
                  <td className="px-4 py-2">{offer.description}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleViewCandidates(offer)}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                    >
                      View Candidates
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedJobOffer && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">
            Candidates for Job Offer {selectedJobOffer.title}
          </h3>

          {loadingCandidates ? (
            <p>Loading candidates...</p>
          ) : candidates.length > 0 ? (
            <ul className="space-y-4">
              {candidates.map((candidate) => (
                <li key={candidate.id} className="p-4 bg-white shadow-md rounded-md">
                  <p>
                    <span className="font-bold">Name:</span> {candidate.candidate_name}
                  </p>
                  <p>
                    <span className="font-bold">Status:</span> {candidate.status}
                  </p>
                  <button
                    onClick={() => handleViewResume(candidate.resume_url)}
                    className="text-blue-600 hover:underline"
                  >
                    View Resume
                  </button>
                  <div className="mt-4 space-x-2">
                    {candidate.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptCandidate(candidate.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectCandidate(candidate.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No candidates have applied for this job offer yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobOffersWithCandidates;
