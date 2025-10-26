import axios from "axios";

// 1. Create a global API instance
const api = axios.create({
  baseURL: "https://citrus-c209.onrender.com/api", // This will use the Vite proxy
});

// 2. Create an "interceptor" (a helper that runs before every request)
api.interceptors.request.use(
  (config) => {
    // 3. Get the token from localStorage
    const token = localStorage.getItem("citrus_token");

    if (token) {
      // 4. If token exists, add it to the 'Authorization' header
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
