import React from "react";
import { Plus, Eye } from "lucide-react";

const MenuItemCard = ({ item, onAddToCart, onShowDetails }) => {
  const categoryColor =
    item.category === "Veg"
      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
      : "border-rose-500 text-rose-700 bg-rose-50";

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100">
      {/* Image Section */}
      <div
        className="relative h-52 w-full cursor-pointer overflow-hidden"
        onClick={() => onShowDetails(item)}
      >
        <img
          src={
            item.image ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
          }
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Enhanced Overlay */}
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20" />

        {/* Quick View Button */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full font-semibold shadow-lg">
            <Eye size={16} />
            Quick View
          </div>
        </div>

        {/* Category Badge */}
        {item.category && (
          <span
            className={`absolute left-3 top-3 rounded-full border-2 px-3 py-1.5 text-xs font-bold ${categoryColor} backdrop-blur-sm shadow-sm`}
          >
            {item.category}
          </span>
        )}

        {/* Price Overlay */}
        <div className="absolute right-3 top-3 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1.5 shadow-lg">
          <span className="text-sm font-bold text-white">₹{item.price}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3
              className="text-xl font-bold text-gray-900 cursor-pointer transition-colors hover:text-[#3a9c6c] line-clamp-2 flex-1"
              onClick={() => onShowDetails(item)}
            >
              {item.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {item.description}
          </p>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(item)}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-[#3a9c6c] px-6 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-[#2d7a58] hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <Plus size={18} className="flex-shrink-0" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
