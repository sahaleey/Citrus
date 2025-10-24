import React from "react";
import { Plus } from "lucide-react"; // Removed 'Check' and 'LoaderCircle'

// --- UPDATED: Removed 'isPending' from props ---
const MenuItemCard = ({ item, onAddToCart, onShowDetails }) => {
  const categoryColor =
    item.category === "Veg"
      ? "border-green-500 text-green-600 bg-green-50"
      : "border-red-500 text-red-600 bg-red-50";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-[var(--surface-color)] shadow-[var(--box-shadow)] transition-transform duration-200 hover:-translate-y-1">
      {/* Image Section */}
      <div
        className="group relative h-48 w-full cursor-pointer"
        onClick={() => onShowDetails(item)}
      >
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
        <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white opacity-0 transition-all group-hover:opacity-100">
          View Details
        </span>
        {item.category && (
          <span
            className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-xs font-semibold ${categoryColor}`}
          >
            {item.category}
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3
              className="text-lg font-semibold text-[var(--text-color)] group-hover:text-[var(--primary-color)]"
              onClick={() => onShowDetails(item)}
            >
              {item.name}
            </h3>
            <span className="text-lg font-bold text-[var(--primary-color)]">
              ₹{item.price}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-color-secondary)]">
            {item.description.substring(0, 70)}...
          </p>
        </div>

        {/* --- UPDATED: Simplified Button --- */}
        {/* Removed all 'isPending' logic */}
        <button
          onClick={() => onAddToCart(item)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg"
        >
          <Plus size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
