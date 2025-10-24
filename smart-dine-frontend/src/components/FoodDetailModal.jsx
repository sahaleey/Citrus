import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";

const FoodDetailModal = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  const categoryColor =
    item.category === "Veg"
      ? "border-green-500 text-green-600 bg-green-50"
      : "border-red-500 text-red-600 bg-red-50";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-lg bg-[var(--surface-color)] shadow-2xl"
          onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/30 p-1.5 text-white transition-all hover:bg-[var(--primary-color)]"
            aria-label="Close food details"
          >
            <X size={20} />
          </button>

          {/* Image */}
          <div className="relative h-64 w-full">
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
                className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold ${categoryColor}`}
              >
                {item.category}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-3xl font-bold text-[var(--text-color)]">
                {item.name}
              </h2>
              <span className="text-3xl font-bold text-[var(--primary-color)]">
                ₹{item.price}
              </span>
            </div>
            <p className="mt-2 text-base text-[var(--text-color-secondary)]">
              {item.description}
            </p>

            {/* Add to Cart Button */}
            <button
              onClick={() => {
                onAddToCart(item);
                onClose(); // Close modal after adding
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-3 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg"
            >
              <Plus size={20} />
              Add to Cart
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FoodDetailModal;
