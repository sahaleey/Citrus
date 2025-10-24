import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText } from "lucide-react";
import dayjs from "dayjs";
import { generateBillPDF } from "../utils/BillGenerator"; // <-- updated utility

const BillModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md overflow-hidden rounded-lg bg-[var(--surface-color)] shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <FileText size={20} className="text-[var(--primary-color)]" />
              Your Bill (Table: {order.tableId})
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-[var(--text-color-secondary)] hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Bill Body */}
          <div className="max-h-[60vh] overflow-y-auto p-5">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Citrus Restaurant
              </h2>
              <p className="text-sm text-[var(--text-color-secondary)]">
                Thank you for dining with us!
              </p>
            </div>

            <ul className="mb-4 space-y-3 divide-y divide-[var(--border-color)]">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between pt-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-[var(--text-color-secondary)]">
                      {item.quantity} x ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Total */}
            <div className="mt-4 border-t-2 border-dashed border-gray-300 pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₹{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Button */}
          <div className="border-t border-[var(--border-color)] bg-gray-50/50 p-5">
            <button
              onClick={() => generateBillPDF(order)}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-3 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BillModal;
