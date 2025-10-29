import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar } from "react-icons/fa";

const FeaturedSlider = ({ items = [], onItemClick }) => {
  const sliderRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Take first 5 menu items (or less)
  const displayItems = items.slice(0, 5);

  // Auto-slide with pause on hover
  useEffect(() => {
    if (displayItems.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [displayItems.length, isHovered]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

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
    <section className="relative mb-16 lg:mb-24 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-orange-100 to-red-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full opacity-50 blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-12 lg:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-green-300 to-green-500 text-white text-sm font-semibold rounded-full mb-4 shadow-lg">
            Smart Dine
          </span>
          <h2 className="text-4xl lg:text-6xl font-bold bg-linear-to-br from-green-700 to-green-300/90 bg-clip-text text-transparent mb-4">
            Welcome to Citrus Juicerie
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our most popular and chef-recommended dishes, crafted with
            passion and the finest ingredients
          </p>
        </motion.div>
      </div>

      {/* Slider Container */}
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows */}
        {displayItems.length > 1 && (
          <>
            <motion.button
              onClick={goToPrev}
              className="absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-2xl p-3 lg:p-4 shadow-2xl border border-white/20 opacity-0 lg:group-hover:opacity-100 transition-all duration-500 hover:scale-110 hover:shadow-2xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous slide"
            >
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6"
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
            </motion.button>
            <motion.button
              onClick={goToNext}
              className="absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-2xl p-3 lg:p-4 shadow-2xl border border-white/20 opacity-0 lg:group-hover:opacity-100 transition-all duration-500 hover:scale-110 hover:shadow-2xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next slide"
            >
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6"
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
            </motion.button>
          </>
        )}

        {/* Slider Track */}
        <div className="relative overflow-hidden rounded-3xl lg:rounded-4xl shadow-2xl bg-linear-to-br from-gray-50 to-white border border-white/20 backdrop-blur-sm">
          <div
            ref={sliderRef}
            className="flex transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {displayItems.map((item, idx) => (
              <motion.div
                key={item._id || idx}
                className="w-full flex-shrink-0 relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div
                  onClick={() => onItemClick?.(item)}
                  className="relative cursor-pointer group/card"
                >
                  {/* Image Container */}
                  <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] w-full overflow-hidden">
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                      }
                      alt={item.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80";
                      }}
                      className="h-full w-full object-cover transition-transform duration-1000 group-hover/card:scale-110"
                    />

                    {/* Multi-layer Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

                    {/* Featured Badge */}
                    <div className="absolute top-6 left-6">
                      <span className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-sm">
                        <FaStar className="text-sm text-amber-300" /> Featured
                      </span>
                    </div>

                    {/* Category Badge */}
                    {item.category && (
                      <div className="absolute top-6 right-6">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-sm border ${
                            item.category === "Veg"
                              ? "bg-green-500/20 text-green-100 border-green-400/30"
                              : "bg-red-500/20 text-red-100 border-red-400/30"
                          }`}
                        >
                          {item.category === "Veg" ? "🌱 Veg" : "🍖 Non-Veg"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12 text-white">
                    <motion.div
                      className="max-w-4xl mx-auto text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                    >
                      {/* Dish Name */}
                      <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 lg:mb-6 leading-tight drop-shadow-2xl">
                        {item.name}
                      </h3>

                      {/* Price */}
                      {item.price !== undefined && (
                        <div className="flex items-center justify-center gap-3 mb-4 lg:mb-6">
                          <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-300 drop-shadow-lg">
                            ₹{item.price.toFixed(2)}
                          </span>
                          <span className="text-sm sm:text-base text-gray-300 line-through">
                            ₹{(item.price * 1.2).toFixed(2)}
                          </span>
                          <span className="text-xs sm:text-sm bg-green-500 text-white px-2 py-1 rounded-full font-semibold">
                            Save 20%
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {item.description && (
                        <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-6 lg:mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-lg line-clamp-2 sm:line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress Bar */}
          {displayItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-48 sm:w-64 h-1.5 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                initial={false}
                animate={{
                  width: `${100 / displayItems.length}%`,
                  x: `${currentIndex * 100}%`,
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {displayItems.length > 1 && (
        <motion.div
          className="mt-8 flex justify-center gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {displayItems.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`relative transition-all duration-500 rounded-full ${
                idx === currentIndex
                  ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-lg scale-110"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: idx === currentIndex ? "24px" : "12px",
                height: "12px",
              }}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === currentIndex && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Slide Counter */}
      {displayItems.length > 1 && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-2xl text-sm font-semibold">
            <span className="text-orange-300">{currentIndex + 1}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-300">{displayItems.length}</span>
          </span>
        </div>
      )}
    </section>
  );
};

export default FeaturedSlider;
