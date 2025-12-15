import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PinGate from "./pages/PinGate";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Photos from "./pages/Photos";

export default function App() {
  return (
    <BrowserRouter>
      <PinGate>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/photos" element={<Photos />} />
        </Routes>
      </PinGate>
    </BrowserRouter>
  );
}
