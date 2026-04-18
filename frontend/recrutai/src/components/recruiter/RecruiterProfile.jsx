
import React, { useState, useEffect } from "react";
import { getRecruiterProfile, updateRecruiterProfile } from "../../services/api"; // Importer les fonctions API

const RecruiterProfile = () => {
  const [profile, setProfile] = useState(null); // État pour stocker les données du profil
  const [isEditing, setIsEditing] = useState(false); // État pour activer/désactiver le mode édition
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs

  // Charger les données du profil au montage du composant
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getRecruiterProfile();
        setProfile(data); // Mettre à jour le profil avec les données récupérées
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = async () => {
    try {
      const updatedProfile = await updateRecruiterProfile(profile); // Appel API pour sauvegarder les données
      //setProfile(updatedProfile); // Mettre à jour l'état avec les données sauvegardées
      setIsEditing(false); // Désactiver le mode édition
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading profile: {error}</p>;

  const EDITABLE_FIELDS = [
    { name: "full_name",        label: "Full Name",       type: "text" },
    { name: "phone",            label: "Personal Phone",  type: "text" },
    { name: "adress",           label: "Address",         type: "text" },
    { name: "company_phone",    label: "Company Phone",   type: "text" },
    { name: "company_name",     label: "Company Name",    type: "text" },
    { name: "position",         label: "Position",        type: "text" },
    { name: "company_website",  label: "Company Website", type: "url"  },
    { name: "industry",         label: "Industry",        type: "text" },
  ];

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <form className="space-y-4">
        {profile && (
          <>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email ?? ""}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              />
            </div>
            {EDITABLE_FIELDS.map(({ name, label, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={profile[name] ?? ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
                  }`}
                />
              </div>
            ))}
          </>
        )}

        <div className="flex justify-between">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEditClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveClick}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelClick}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default RecruiterProfile;
/*

import React, { useState } from "react";

const RecruiterProfile = () => {
  const [profile, setProfile] = useState({
    full_name: "John Doe",
    email: "recruiter@example.com",
    phone: "123456789",
    adress: "123 Main Street",
    company_phone: "987654321",
    company_name: "Tech Company",
    company_website: "https://www.techcompany.com",
    industry: "Technology",
    position: "HR Manager",
  });

  const [isEditing, setIsEditing] = useState(false); // État pour activer/désactiver le mode édition

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    setIsEditing(true); // Active le mode édition
  };

  const handleCancelClick = () => {
    setIsEditing(false); // Désactive le mode édition
  };

  const handleSaveClick = () => {
    console.log("Profile updated:", profile); // Simule une mise à jour
    setIsEditing(false); // Désactive le mode édition après la sauvegarde
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={profile.full_name}
            onChange={handleChange}
            disabled={!isEditing} // Désactive le champ si non en mode édition
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled // Toujours désactivé
            className="w-full px-4 py-2 border rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Personal Phone</label>
          <input
            type="text"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input
            type="text"
            name="adress"
            value={profile.adress}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Phone</label>
          <input
            type="text"
            name="company_phone"
            value={profile.company_phone}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input
            type="text"
            name="company_name"
            value={profile.company_name}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Position</label>
          <input
            type="text"
            name="position"
            value={profile.position}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Website</label>
          <input
            type="url"
            name="company_website"
            value={profile.company_website}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Industry</label>
          <input
            type="text"
            name="industry"
            value={profile.industry}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>

        {/* Boutons d'action *//*}
        <div className="flex justify-between">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEditClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveClick}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelClick}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default RecruiterProfile;
*/
