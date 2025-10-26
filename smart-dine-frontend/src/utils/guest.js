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
// Returns null if no table ID is found (user hasn't scanned a table yet)
export const getTableId = () => {
  const tableId = localStorage.getItem("tableId");
  // We don't generate a default tableId; it must be set explicitly
  return tableId || null;
};

// Optional: Function to set the table ID (call this after QR scan)
export const setTableId = (id) => {
  if (id) {
    localStorage.setItem("tableId", id);
  } else {
    // Allows clearing the table ID if needed
    localStorage.removeItem("tableId");
  }
};

// Optional: Function to clear both guest and table IDs (e.g., on logout/cleanup)
export const clearGuestSession = () => {
  localStorage.removeItem("guestId");
  localStorage.removeItem("tableId");
  localStorage.removeItem("cartItems"); // Also clear cart
};
