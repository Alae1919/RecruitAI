import React, { useState } from "react";
import { registerRecruiter } from "../../services/api"; // Import du service API

const RecruiterForm = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    company_phone: "",
    company_name: "",
    company_website: "",
    industry: "",
    adress: "",
    position: "",
  });

  const [loading, setLoading] = useState(false); // État pour indiquer le chargement
  const [error, setError] = useState(null); // État pour afficher les erreurs
  const [successMessage, setSuccessMessage] = useState(null); // Message de confirmation

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formDataToSubmit = { ...formData, role: "recruiter" };
      const response = await registerRecruiter(formData); // Appel API
      setSuccessMessage("Your account has been created successfully!");
      console.log("Response:", response);
      setFormData({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        company_phone: "",
        company_name: "",
        company_website: "",
        industry: "",
        adress: "",
        position: "",
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to register recruiter. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Recruiter Information</h3>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded">
          {error}
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
        <label className="block text-sm font-medium text-gray-700">Personal Phone</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your personal phone number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Adress</label>
        <input
          type="text"
          name="adress"
          value={formData.adress}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your adress"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Company Phone</label>
        <input
          type="text"
          name="company_phone"
          value={formData.company_phone}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your company phone number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Company Name</label>
        <input
          type="text"
          name="company_name"
          value={formData.company_name}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your company name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Position</label>
        <input
          type="text"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your position"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Company Website</label>
        <input
          type="url"
          name="company_website"
          value={formData.company_website}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your company website"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Industry</label>
        <input
          type="text"
          name="industry"
          value={formData.industry}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:outline-blue-600"
          placeholder="Enter your industry"
        />
      </div>
      <input type="hidden" name="role" value="recruiter" />
      <button
        type="submit"
        className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Register as Recruiter"}
      </button>
    </form>
  );
};

export default RecruiterForm;
