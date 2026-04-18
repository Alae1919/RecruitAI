import React, { useState, useEffect } from "react";
import { fetchJobOffers, editJobOffer, deleteJobOffer, fetchCandidatesForJobOffer } from "../../services/api"; // Import API

const ViewOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const data = await fetchJobOffers();
        setOffers(data);
      } catch (err) {
        setError(err.detail || "An error occurred while fetching job offers.");
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  const handleSaveChanges = async () => {
    try {
      const updatedOffer = await editJobOffer(editingOffer.id, editingOffer);
      setOffers((prevOffers) =>
        prevOffers.map((offer) =>
          offer.id === editingOffer.id ? updatedOffer : offer
        )
      );
      setEditingOffer(null);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      await deleteJobOffer(id);
      setOffers((prevOffers) => prevOffers.filter((offer) => offer.id !== id));
    } catch (err) {
      setError("Failed to delete the offer. Please try again.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingOffer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditOffer = (offer) => {
    setEditingOffer({ ...offer });
  };

  const handleViewCandidates = async (offer) => {
    setShowCandidates(true);
    setSelectedOffer(offer);
    setLoadingCandidates(true);

    try {
      const data = await fetchCandidatesForJobOffer(offer.id);
      setCandidates(data);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleCloseCandidates = () => {
    setSelectedOffer(null);
    setCandidates([]);
    setShowCandidates(false);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Offers</h2>
      {offers.length > 0 ? (
        <ul className="space-y-4">
          {offers.map((offer) =>
            editingOffer && editingOffer.id === offer.id ? (
              <li key={offer.id} className="p-4 bg-gray-50 border rounded-lg shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Job Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editingOffer.title}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                      name="description"
                      value={editingOffer.description}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Requirements</label>
                    <input
                      type="text"
                      name="requirements"
                      value={editingOffer.requirements}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Salary</label>
                    <input
                      type="text"
                      name="salary"
                      value={editingOffer.salary_range}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editingOffer.location}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex space-x-4 mt-4">
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingOffer(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </li>
            ) : (
              <li
              key={offer.id}
              className="p-4 bg-gray-50 border rounded-lg shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {offer.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Description:</strong> {offer.description}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Requirements:</strong> {offer.requirements}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Salary:</strong> {offer.salary_range}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Location:</strong> {offer.location}
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleEditOffer(offer)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleViewCandidates(offer)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  View Candidates
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOffer(offer.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Delete Offer
                </button>
              </div>
            </li>
            )
          )}
        </ul>
      ) : (
        <p className="text-gray-600 text-center">No offers available. Create a new offer to get started.</p>
      )}

      {/* Pop-up affichant les candidats sous forme de tableau */}
      {showCandidates && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg relative">
            <button
              onClick={handleCloseCandidates}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Candidates for {selectedOffer.title}
            </h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Resume</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td className="border px-4 py-2">{candidate.candidate_name}</td>
                    <td className="border px-4 py-2">{candidate.status}</td>
                    <td className="border px-4 py-2">
                      <button onClick={() => window.open(candidate.resume_url, "_blank")} className="text-blue-500 hover:underline text-sm">
                        View Resume
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOffers;
