import { Routes, Route } from "react-router-dom";

import Header from "./globals.jsx";
import Home from "./pages/Home.jsx";
import Estadios from "./pages/Stadiums.jsx";
import Galeria from "./pages/Gallery.jsx";
import Trivia from "./pages/Trivia.jsx";
import Estadisticas from "./pages/Stadistics.jsx";
import ARCamera from "./pages/ArCamera.jsx";

function PlaceholderPage({ title }) {
  return (
    <main className="min-h-screen bg-bglight px-8 py-16 text-white">
      <h1 className="text-4xl font-black">{title}</h1>
      <p className="mt-4 text-lg text-gray-200">
        Esta sección estará disponible próximamente.
      </p>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/estadios" element={<Estadios />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/trivia" element={<Trivia />} />
        <Route path="/ar-camera" element={<ARCamera />} />
      </Routes>
    </>
  );
}
