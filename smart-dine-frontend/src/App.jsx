import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Menu from "./pages/Menu";
import ChiefBoard from "./pages/ChiefBoard";

function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen  bg-white text-black   transition-colors duration-300">
        {/* Toggler Button */}

        {/* App Routes */}
        <Routes>
          <Route path="/menu" element={<Menu />} />
          <Route path="/chef-dashboard" element={<ChiefBoard />} />
          <Route path="/" element={<Navigate to="/menu?table=bench-1" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
