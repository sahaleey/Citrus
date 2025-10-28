// src/utils/guest.js

// Generates or retrieves a unique ID for the guest from localStorage
export const getGuestId = () => {
  let guestId = localStorage.getItem("guestId");
  if (!guestId) {
    // Generate a simple random ID if none exists
    guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem("guestId", guestId);
  }
  return guestId;
};

// Retrieves the table ID from localStorage
// Returns null if no table ID is found
export const getTableId = () => {
  const tableId = localStorage.getItem("tableId");
  return tableId || null;
};

// *** Export this function to set/save the table ID ***
export const setTableId = (id) => {
  if (id) {
    localStorage.setItem("tableId", id);
  } else {
    // Allows clearing the table ID
    localStorage.removeItem("tableId");
  }
};

// Optional: Function to clear session data
export const clearGuestSession = () => {
  localStorage.removeItem("guestId");
  localStorage.removeItem("tableId");
  localStorage.removeItem("cartItems"); // Also clear cart if you store it here
};
