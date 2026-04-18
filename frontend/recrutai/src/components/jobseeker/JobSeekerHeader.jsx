import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const JobSeekerHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev); // Inverse l'état pour ouvrir/fermer le menu
  };

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo ou titre */}
        <div className="text-blue-600 text-2xl font-bold">
          Welcome
        </div>

        {/* Menu de navigation (desktop) */}
        <nav className="hidden md:flex space-x-8 text-gray-800 font-medium">
        <Link
            to="/jobseeker-dashboard/mes_applications"
            className="hover:text-blue-600"
          >
           Search for Jobs
          </Link>
          <Link
            to="/jobseeker-dashboard/mes_candidatures"
            className="hover:text-blue-600"
          >
           My Applications
          </Link>
          <Link
            to="/jobseeker-dashboard/mes_entretiens"
            className="hover:text-blue-600"
          >
            My Interviews
          </Link>
          <Link
            to="/jobseeker-dashboard/profile"
            className="hover:text-blue-600"
          >
            My Profile
          </Link>
        
        </nav>

        {/* Bouton de déconnexion (desktop) */}
        <button
          onClick={handleLogout}
          className="hidden md:block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Log Out
        </button>

        {/* Menu Hamburger (mobile) */}
        <div className="relative md:hidden">
          <button
            className="text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            onClick={toggleDropdown}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
              <Link
                to="/jobseeker-dashboard/mes_applications"
                className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                onClick={() => setDropdownOpen(false)}
              >
                  Search for Jobs
              </Link>
              <Link
                to="/jobseeker-dashboard/mes_candidatures"
                className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                onClick={() => setDropdownOpen(false)}
              >
                  My Applications
              </Link>
              <Link
                to="/jobseeker-dashboard/mes_entretiens"
                className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                onClick={() => setDropdownOpen(false)}
              >
                     My Interviews
              </Link>
              <Link
                to="/jobseeker-dashboard/profile"
                className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                onClick={() => setDropdownOpen(false)}
              >
                My Profile
              </Link>
             
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-red-100"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default JobSeekerHeader;