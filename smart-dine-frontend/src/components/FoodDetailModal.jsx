import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";

const FoodDetailModal = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  const categoryColor =
    item.category === "Veg"
      ? "border-green-500 text-green-700 bg-green-50"
      : "border-red-500 text-red-700 bg-red-50";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 "
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm "
        />

        {/* Modal Container - Responsive sizing */}
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-xl sm:rounded-2xl bg-white shadow-2xl 
             max-h-[90vh] overflow-y-auto overflow-x-hidden scroll-smooth
             [&::-webkit-scrollbar]:w-2
             [&::-webkit-scrollbar-track]:bg-gray-100
             [&::-webkit-scrollbar-track]:rounded-full
             [&::-webkit-scrollbar-thumb]:bg-[#3a9c6c]
             [&::-webkit-scrollbar-thumb]:rounded-full
             [&::-webkit-scrollbar-thumb]:hover:bg-[#2d7a58]
             [scrollbar-width:thin]
             [scrollbar-color:#3a9c6c_#f1f5f9]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Responsive positioning */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white transition-all hover:bg-[#3a9c6c] hover:scale-110"
            aria-label="Close food details"
          >
            <X size={16} className="sm:w-5 sm:h-5" />
          </button>

          {/* Image - Responsive height */}
          <div className="relative h-48 sm:h-56 md:h-64 w-full">
            <img
              src={
                item.image ||
                "https://placehold.co/600x400/cccccc/FFF?text=No+Image"
              }
              alt={item.name}
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/600x400/cccccc/FFF?text=Image+Not+Found";
              }}
              className="h-full w-full object-cover"
            />
            {item.category && (
              <span
                className={`absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full border px-2 py-1 sm:px-3 sm:py-1 text-xs font-semibold ${categoryColor}`}
              >
                {item.category}
              </span>
            )}
          </div>

          {/* Content - Responsive padding and typography */}
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex-1">
                {item.name}
              </h2>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#3a9c6c] whitespace-nowrap">
                ₹{item.price}
              </span>
            </div>

            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              {item.description}
            </p>

            {/* Add to Cart Button - Responsive sizing */}
            <button
              onClick={() => {
                onAddToCart(item);
                onClose();
              }}
              className="mt-4 sm:mt-5 md:mt-6 flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-[#3a9c6c] px-4 py-3 sm:px-5 sm:py-3 md:px-6 md:py-4 text-sm sm:text-base font-semibold text-white transition-all hover:bg-[#2d7a58] hover:shadow-lg active:scale-95"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              Add to Cart
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FoodDetailModal;
