import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
 const [dropdownOpen, setDropdownOpen] = useState(false); 
 const toggleDropdown = () => {
  setDropdownOpen((prev) => !prev); // Inverse l'état pour ouvrir/fermer le menu
};

  return (
    <header className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-900">
          <a href="/" className="hover:opacity-75">
            prtA
          </a>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex space-x-6 text-gray-600 font-medium">
          <Link to="/" className="hover:text-blue-500">
            Home
          </Link>
          <Link to="/services" className="hover:text-blue-500">
            Service
          </Link>
          <Link to="/about" className="hover:text-blue-500">
            About us
          </Link>
          <Link to="/blog" className="hover:text-blue-500">
            Blog
          </Link>
        </nav>

        {/* Call to Action Button (Desktop) */}
        <div className="hidden md:block">
          <Link
            to="/login"
            className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-600 transition duration-300"
          >
            Log In
          </Link>
        </div>

        {/* Hamburger Menu Button (Mobile Only) */}
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
  

      {/* Dropdown Menu for Mobile */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
          <Link
            to="/"
            className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
            onClick={() => setDropdownOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/services"
            className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
            onClick={() => setDropdownOpen(false)}
          >
            Service
          </Link>
          <Link
            to="/about"
            className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
            onClick={() => setDropdownOpen(false)}
          >
            About us
          </Link>
          <Link
            to="/blog"
            className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
            onClick={() => setDropdownOpen(false)}
          >
            Blog
          </Link>
          <Link
            to="/login"
            className="block w-full text-center bg-blue-600 text-white font-semibold py-2  rounded-lg hover:bg-blue-600 transition duration-300"
            onClick={() =>setDropdownOpen(false)}
          >
            Log In
          </Link>
        </div>
      )}
         </div>
      </div>
    </header>
  );
};

export default Header;
