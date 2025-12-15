import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import PinGate from "./components/PinGate";

import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Photos from "./pages/Photos";

export default function App() {
  return (
    <PinGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/photos" element={<Photos />} />
        </Routes>
      </BrowserRouter>
    </PinGate>
  );
}
