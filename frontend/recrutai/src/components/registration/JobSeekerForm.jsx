import React, { useState, useRef } from "react";
import { registerJobSeeker } from "../../services/api"; // Assurez-vous que l'API est correctement configurée

const JobSeekerForm = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    experience: "",
    skills: "",
    resume: null,
  });

  const [loading, setLoading] = useState(false); // Indicateur de chargement
  const [error, setError] = useState(null); // Gestion des erreurs
  const [successMessage, setSuccessMessage] = useState(null); // Gestion du message de succès

  const fileInputRef = useRef(null); // Référence pour réinitialiser le champ fichier

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      resume: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Préparation des données pour l'envoi au backend
    const formDataToSubmit = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSubmit.append(key, formData[key]);
    });
    formDataToSubmit.append("role", "job_seeker"); 
    try {
      const response = await registerJobSeeker(formDataToSubmit); // Appel au service API
      setSuccessMessage("Job Seeker registered successfully!");
      console.log("Response:", response.data);

      // Réinitialisation des champs
      setFormData({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        experience: "",
        skills: "",
        resume: null,
      });

      // Réinitialiser le champ fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      setError(
        err.response?.data || "Failed to register. Please check your inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Job Seeker Information</h3>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded">
          {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-800 p-3 rounded">
          {successMessage}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Create a password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Experience</label>
        <textarea
          name="experience"
          value={formData.experience}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Describe your experience"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Skills</label>
        <textarea
          name="skills"
          value={formData.skills}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="List your skills"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Upload CV</label>
        <input
          type="file"
          name="resume"
          onChange={handleFileChange}
          required
          ref={fileInputRef} // Lier la référence au champ fichier
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
        />
      </div>
 
  <input type="hidden" name="role" value="job_seeker" />


      <button
        type="submit"
        className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Register as Job Seeker"}
      </button>
    </form>
  );
};

export default JobSeekerForm;
