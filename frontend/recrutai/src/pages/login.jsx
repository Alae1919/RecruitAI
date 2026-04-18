import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../src/services/api";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "JOBSEEKER", // Par défaut
  });
  const [loading, setLoading] = useState(false); // Indicateur de chargement
  const [error, setError] = useState(null); // Gestion des erreurs
  const [successMessage, setSuccessMessage] = useState(null); // Message de succès

  const [showPassword, setShowPassword] = useState(false); // Gestion visibilité mot de passe

  const navigate = useNavigate();
  const { refetch } = useAuth();
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await loginUser(formData);
      setSuccessMessage("Login successful!");


      localStorage.setItem("accessToken", response.access);
      localStorage.setItem("refreshToken", response.refresh);
      await refetch();
      if (formData.role === "RECRUITER") {
        navigate("/recruiter-dashboard/profile");
      } else if (formData.role === "JOBSEEKER") {
        navigate("/jobseeker-dashboard/profile");
      }

      // Redirection ou autre action après le succès
     // window.location.href = "/"; // Exemple de redirection
    } catch {
      setError("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-auto mt-20">
      <div className="font-[sans-serif]">
        <div className="flex flex-col items-center justify-center py-6 px-4 min-h-screen">
          <div className="grid md:grid-cols-2 items-center gap-4 max-w-6xl w-full">
            <div className="border border-gray-300 rounded-lg p-6 max-w-md shadow-[0_2px_22px_-4px_rgba(93,96,127,0.2)] max-md:mx-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-8">
                  <h3 className="text-gray-800 text-3xl font-extrabold">Sign in</h3>
                  <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                    Sign in to your account and explore a world of possibilities. Your journey begins here.
                  </p>
                </div>

                {/* Affichage des erreurs */}
                {error && (
                  <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                    {error}
                  </div>
                )}

                {/* Affichage des messages de succès */}
                {successMessage && (
                  <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                    {successMessage}
                  </div>
                )}

                {/* Champ Email */}
                <div>
                  <label className="text-gray-800 text-sm mb-2 block">Email</label>
                  <div className="relative flex items-center">
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Champ Password */}
                <div>
                  <label className="text-gray-800 text-sm mb-2 block">Password</label>
                  <div className="relative flex items-center">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                      placeholder="Enter password"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#bbb"
                      stroke="#bbb"
                      className="w-[18px] h-[18px] absolute right-4 cursor-pointer"
                      viewBox="0 0 128 128"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <path d="M64 16c-28.673 0-53.255 17.596-63.497 42.057a4 4 0 0 0 0 3.886C10.745 94.404 35.327 112 64 112s53.255-17.596 63.497-42.057a4 4 0 0 0 0-3.886C117.255 33.596 92.673 16 64 16zm0 88c-22.554 0-42.46-13.62-51.6-33.994C21.54 49.62 41.446 36 64 36c22.554 0 42.46 13.62 51.6 33.994C106.46 90.38 86.554 104 64 104zM64 52a12 12 0 1 1 0 24 12 12 0 0 1 0-24z" />
                      ) : (
                        <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z" />
                      )}
                    </svg>
                  </div>
                </div>

                {/* Champ Role */}
                <div>
                  <label className="text-gray-800 text-sm mb-2 block">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full text-sm text-gray-800 border border-gray-300 px-4 py-3 rounded-lg outline-blue-600"
                  >
                    <option value="JOBSEEKER">Job Seeker</option>
                    <option value="RECRUITER">Recruiter</option>
                  </select>
                </div>

                <div className="!mt-8">
                  <button
                    type="submit"
                    className="w-full shadow-xl py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Log in"}
                  </button>
                </div>

                <p className="text-sm !mt-8 text-center text-gray-800">
                  Don't have an account{" "}
                  <Link to="/register" className="text-blue-600 font-semibold hover:underline ml-1 whitespace-nowrap">
                    Register here
                  </Link>
                </p>
              </form>
            </div>
            <div className="lg:h-[400px] md:h-[300px] max-md:mt-8">
              <img
                src="/assets/login-image.webp"
                className="w-full h-full max-md:w-4/5 mx-auto block object-cover"
                alt="Login Illustration"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
