import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const FeaturedSlider = ({ featuredFoods, scrollToMenu, onItemClick }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isHovered || isDragging) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % featuredFoods.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredFoods.length, isHovered, isDragging]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % featuredFoods.length);
  }, [featuredFoods.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i - 1 + featuredFoods.length) % featuredFoods.length);
  }, [featuredFoods.length]);

  const goToSlide = useCallback(
    (newIndex) => {
      setDirection(newIndex > index ? 1 : -1);
      setIndex(newIndex);
    },
    [index]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) prevSlide();
    else if (info.offset.x < -swipeThreshold) nextSlide();
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const gradients = [
    "linear-gradient(135deg, #FF6B35 0%, #FF9E5E 100%)",
    "linear-gradient(135deg, #00A896 0%, #02C39A 100%)",
    "linear-gradient(135deg, #4361EE 0%, #3A0CA3 100%)",
    "linear-gradient(135deg, #F72585 0%, #B5179E 100%)",
    "linear-gradient(135deg, #FF9F1C 0%, #FFBF69 100%)",
  ];

  return (
    <div className="relative w-full max-w-7xl mx-auto h-[24rem] sm:h-[28rem] md:h-[32rem] lg:h-[36rem] xl:h-[40rem] overflow-hidden rounded-3xl">
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 p-3 rounded-full"
      >
        <FiChevronLeft className="text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 p-3 rounded-full"
      >
        <FiChevronRight className="text-white" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1">
        {featuredFoods.map((_, i) => (
          <div
            key={i}
            className="h-1 w-6 bg-white/30 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-white"
              animate={{ width: i === index ? "100%" : "0%" }}
              transition={{ duration: i === index ? 5 : 0 }}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {featuredFoods.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`w-2 h-2 rounded-full ${
              i === index ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="absolute w-full h-full flex flex-col-reverse sm:flex-row items-center justify-between p-4 sm:p-8 md:p-10 lg:p-12"
          style={{ background: gradients[index % gradients.length] }}
        >
          <div className="sm:flex-1 text-center sm:text-left space-y-4 max-w-lg">
            {featuredFoods[index]?.offer && (
              <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                {featuredFoods[index]?.offer}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              {featuredFoods[index]?.name}
            </h2>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              <p className="text-2xl font-bold text-white">
                ₹{featuredFoods[index]?.price}
              </p>
              <motion.button
                onClick={() =>
                  onItemClick
                    ? onItemClick(featuredFoods[index])
                    : scrollToMenu?.()
                }
                className="px-5 py-2 bg-white text-orange-600 font-semibold rounded-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Order Now
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-2xl overflow-hidden shadow-2xl"
          >
            <img
              src={featuredFoods[index]?.image || "/food-placeholder.png"}
              alt={featuredFoods[index]?.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FeaturedSlider;
