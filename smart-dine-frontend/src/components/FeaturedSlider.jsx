import React, { useEffect, useRef, useState } from "react";

const FeaturedSlider = ({ items = [], onItemClick }) => {
  const sliderRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Take first 5 menu items (or less)
  const displayItems = items.slice(0, 5);

  // Auto-slide with pause on hover
  useEffect(() => {
    if (displayItems.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 4000); // Increased to 4s for better viewing

    return () => clearInterval(interval);
  }, [displayItems.length, isHovered]);

  // Smooth scroll to current slide
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: currentIndex * sliderRef.current.offsetWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  // Manual navigation
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + displayItems.length) % displayItems.length
    );
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Menu</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our most popular and delicious dishes
        </p>
      </div>

      {/* Slider Container */}
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation Arrows */}
        {displayItems.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Previous slide"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Next slide"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Slider */}
        <div
          ref={sliderRef}
          className="flex w-full overflow-hidden rounded-2xl shadow-2xl relative bg-gray-100"
        >
          {displayItems.map((item, idx) => (
            <div
              key={item._id || idx}
              onClick={() => onItemClick?.(item)}
              className="min-w-full relative flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105"
            >
              {/* Image with loading state */}
              <div className="relative h-80 w-full overflow-hidden">
                <img
                  src={
                    item.image ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  }
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";
                  }}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6  text-white">
                <div className="text-center max-w-2xl mx-auto">
                  <h3 className="text-4xl font-bold mb-2 drop-shadow-lg">
                    {item.name}
                  </h3>

                  {item.price !== undefined && (
                    <p className="text-xl font-semibold text-orange-300 mb-3 drop-shadow-lg">
                      ₹{item.price.toFixed(2)}
                    </p>
                  )}

                  {item.description && (
                    <p className="text-sm text-gray-200 mb-4 line-clamp-2 drop-shadow-lg">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {displayItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-48 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${100 / displayItems.length}%`,
                transform: `translateX(${currentIndex * 100}%)`,
              }}
            />
          </div>
        )}
      </div>

      {/* Dots Indicator */}
      {displayItems.length > 1 && (
        <div className="mt-6 flex justify-center gap-3">
          {displayItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? "bg-gradient-to-r from-orange-500 to-red-500 w-8 scale-110"
                  : "bg-gray-300 hover:bg-gray-400 w-2"
              } h-2`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedSlider;
