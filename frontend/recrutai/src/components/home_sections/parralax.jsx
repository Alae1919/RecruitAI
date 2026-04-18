
import React, { useState, useEffect } from "react";

const ParallaxBanner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
  
    const slides = [
      {
        id: 1,
        image: "/assets/back1.webp", // Chemin relatif vers la première image
        title: "Réinventez le Recrutement avec l'IA",
        description:
          "Simplifiez vos processus d'embauche grâce à une plateforme intelligente qui automatise la sélection des candidats.",
      },
      {
        id: 2,
        image: "/assets/back2.webp", // Chemin relatif vers la deuxième image
        title: "Génération de Questions d'Entretien",
        description:
          "Générez des questions personnalisées basées sur les compétences et l'expérience des candidats.",
      },
      {
        id: 3,
        image: "/assets/back3.webp", // Chemin relatif vers la troisième image
        title: "Analyse des Réponses",
        description:
          "Évaluez automatiquement les réponses des candidats pour identifier les talents les plus adaptés.",
      },
    ];
  
    useEffect(() => {
      const interval = setInterval(() => {
        handleNextSlide();
      }, 5000);
  
      return () => clearInterval(interval);
    }, [currentIndex]);
  
    const handleNextSlide = () => {
      if (isAnimating) return;
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        setIsAnimating(false);
      }, 500);
    };
  
    const handlePrevSlide = () => {
      if (isAnimating) return;
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === 0 ? slides.length - 1 : prevIndex - 1
        );
        setIsAnimating(false);
      }, 500);
    };
  
    return (
      <section className="relative w-full h-screen overflow-hidden">
        {/* Slides */}
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 h-screen relative"
            >
              {/* Image en background */}
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay sombre */}
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              {/* Contenu du slide */}
              <div className="relative z-10 container mx-auto h-full flex flex-col justify-center items-center text-center text-white px-6 md:px-12">
                <h1 className="text-4xl md:text-5xl font-bold animate-fadeIn delay-2">{slide.title}</h1>
                <p className="mt-4 text-lg text-gray-300 animate-fadeIn delay-2">{slide.description}</p>
                <button className="mt-6 bg-white text-blue-500 font-semibold py-3 px-6 rounded-full hover:bg-blue-100 transition duration-300 animate-bounce">
                  Découvrez nos solutions
                </button>
              </div>
            </div>
          ))}
        </div>
  
  
  
     
      </section>
     
        
     
      
    );
};

export default ParallaxBanner;





