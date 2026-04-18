import React, { useState } from "react";
import { createJobOffer } from "../../services/api"; // Importer la méthode API
//import { useHistory } from "react-router-dom"; // Si vous voulez rediriger après la soumission

const AddOffer = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  //const history = useHistory(); // Pour rediriger l'utilisateur

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Récupérer le token d'authentification (si vous l'avez stocké dans le localStorage)
    const token = localStorage.getItem("accessToken");

    console.log("Response:", token);
    // Vérifier si le token existe
    if (!token) {
      setError("Authentication required");
      return;
    }

    // Construire les données de l'offre d'emploi
    const jobOfferData = {
      title: jobTitle,
      description: description,
      requirements: requirements,
      salary_range: salary,
      location: location,
    };

    try {
      const response = await createJobOffer(jobOfferData, token);

      setSuccessMessage(response.message); // Afficher le message de succès
      // Réinitialiser les champs du formulaire
      setJobTitle("");
      setDescription("");
      setRequirements("");
      setSalary("");
      setLocation("");

      // Rediriger l'utilisateur après la soumission réussie
      //history.push("/job-offers");  // Exemple de redirection vers une page d'offres d'emploi

    } catch (error) {
      setError(error || "An error occurred while submitting the form");
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Offer</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-gray-600 mb-2">Job Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-blue-600"
            placeholder="Enter job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Description</label>
          <textarea
            className="w-full px-4 py-2 border rounded-lg focus:outline-blue-600"
            placeholder="Enter job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Requirements</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-blue-600"
            placeholder="Enter the requirements for the post"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Salary range</label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded-lg focus:outline-blue-600"
            placeholder="Enter the salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Location</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-blue-600"
            placeholder="Enter the location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default AddOffer;
