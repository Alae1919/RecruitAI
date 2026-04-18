/*import React, { useState, useEffect } from "react";
import { getJobSeekerProfile, updateJobSeekerProfile } from "../../services/api"; // Import des fonctions API

const JobSeekerProfile = () => {
  const [profile, setProfile] = useState(null); // État pour stocker les données du profil
  const [isEditing, setIsEditing] = useState(false); // État pour activer/désactiver le mode édition
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [successMessage, setSuccessMessage] = useState(""); // État pour afficher un message de succès

  // Charger les données du profil au montage du composant
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getJobSeekerProfile(); // Appel API pour récupérer les données
        setProfile(data); // Mettre à jour l'état du profil
        setLoading(false); // Fin du chargement
      } catch (err) {
        setError(err); // Enregistrer l'erreur
        setLoading(false); // Fin du chargement même en cas d'erreur
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value })); // Mise à jour des données locales
  };

  const handleEditClick = () => {
    setIsEditing(true); // Activer le mode édition
    setSuccessMessage(""); // Réinitialiser le message de succès
  };

  const handleCancelClick = () => {
    setIsEditing(false); // Désactiver le mode édition
    setSuccessMessage(""); // Réinitialiser le message de succès
  };

  const handleSaveClick = async () => {
    try {
      await updateJobSeekerProfile(profile); // Appel API pour sauvegarder les données
      setIsEditing(false); // Désactiver le mode édition
      setSuccessMessage("Profile updated successfully!"); // Afficher un message de succès
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err); // Afficher l'erreur
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading profile: {error}</p>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {successMessage && (
        <p className="text-green-600 bg-green-100 p-2 rounded-lg">{successMessage}</p>
      )}

      <form className="space-y-4">
        {profile &&
          Object.keys(profile).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium">
                {key.replace(/_/g, " ").toUpperCase()}
              </label>
              <input
                type={key === "email" ? "email" : "text"}
                name={key}
                value={profile[key]}
                onChange={handleChange}
                disabled={!isEditing || key === "email"} // Désactiver le champ email
                className={`w-full px-4 py-2 border rounded-lg ${
                  isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
                }`}
              />
            </div>
          ))}

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

export default JobSeekerProfile;
*/

import React, { useState, useEffect,useRef } from "react";
import { getJobSeekerProfile , updateJobSeekerProfile} from "../../services/api";

const JobSeekerProfile = () => {
  
 
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(""); // État pour afficher un message de succès
  const [isEditing, setIsEditing] = useState(false); // État pour activer/désactiver le mode édition
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getJobSeekerProfile(); // Appel de la fonction d'API
        setProfile({
          address: data.address,  // Fix typo: 'adress' → 'address'
          email: data.email,
          fullName: data.full_name,
          experience: data.experience,
          phone: data.phone,
          skills: data.skills,
          cv: data.resume,
          resume: null,
        }); // Met à jour l'état avec les données du profil
      } catch (err) {
        console.error("Failed to load profile:", err);
      }finally {
        setIsLoading(false);
      }
    };

    fetchProfile(); // Appelle la fonction de récupération des données
  }, []);

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfile((prev) => ({ ...prev, resume: file }));
  };
  

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

 
  const handleSaveClick = async () => {
    try {
      await updateJobSeekerProfile(profile);
      setIsEditing(false); // Désactiver le mode édition
      setSuccessMessage("Profile updated successfully!"); // Afficher un message de succès
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err); // Afficher l'erreur
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading profile...</div>;
  }
  
  if (!profile) {
    return <div className="p-6">Failed to load profile</div>;
  }

  return (
    
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={profile.fullName}
            onChange={handleChange}
            disabled={!isEditing}
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
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
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
            name="address"
            value={profile.address}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Experience</label>
          <textarea
            name="experience"
            value={profile.experience}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Skills</label>
          <textarea
            name="skills"
            value={profile.skills}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              isEditing ? "focus:outline-blue-600 bg-white" : "bg-gray-100"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">CV</label>
          {isEditing ? (
            <input
              type="file"
              name="resume"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-blue-600"
            />
          ) : (/*
            <a
              href={profile.cv ? URL.createObjectURL(profile.cv) : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profile.cv ? "View CV" : "No CV uploaded"}
            </a>
*/
            profile.cv ? (
              <a
                href={profile.cv}  // Assuming your API returns a URL string
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View CV
              </a>
            ) : (
              <span>No CV uploaded</span>
            )

          )}
        </div>

        {/* Boutons d'action */}
        
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

export default JobSeekerProfile;
