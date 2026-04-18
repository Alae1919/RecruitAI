import React from "react";

const FeaturesSection = () => {
  return (
    <div className="bg-gray-100 py-12">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800 animate-fadeInInfinite">
          Pourquoi choisir notre plateforme ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center transform hover:scale-105 transition duration-300 animate-slideInInfinite delay-0">
            <div className="bg-blue-500 text-white p-6 rounded-full mb-4">
              <svg
                className="w-10 h-10"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c2.828 0 4.5 1.686 4.5 3.5S14.828 15 12 15s-4.5-1.686-4.5-3.5S9.172 8 12 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">IA Puissante</h3>
            <p className="text-gray-600">
              Optimisez le recrutement grâce à l'IA qui analyse et filtre les
              candidatures.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center transform hover:scale-105 transition duration-300 animate-slideInInfinite delay-200">
            <div className="bg-blue-500 text-white p-6 rounded-full mb-4">
              <svg
                className="w-10 h-10"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Flexibilité</h3>
            <p className="text-gray-600">
              Créez et personnalisez vos processus de recrutement en toute
              simplicité.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center transform hover:scale-105 transition duration-300 animate-slideInInfinite delay-400">
            <div className="bg-blue-500 text-white p-6 rounded-full mb-4">
              <svg
                className="w-10 h-10"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Efficacité</h3>
            <p className="text-gray-600">
              Gagnez du temps avec des outils qui automatisent les tâches
              répétitives.
            </p>
          </div>
          {/* Feature 4 */}
          <div className="flex flex-col items-center text-center transform hover:scale-105 transition duration-300 animate-slideInInfinite delay-600">
            <div className="bg-blue-500 text-white p-6 rounded-full mb-4">
              <svg
                className="w-10 h-10"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Accessibilité</h3>
            <p className="text-gray-600">
              Utilisez notre plateforme sur tous vos appareils, où que vous
              soyez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
