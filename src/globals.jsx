import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const defaultLinks = [
  { label: "ESTADISTICAS", to: "/estadisticas" },
  { label: "ESTADIOS", to: "/estadios" },
  { label: "GALERIA", to: "/galeria" },
  { label: "TRIVIA", to: "/trivia" },
  { label: "AR CAMERA", to: "/ar-camera" },
];

export default function Header({ links = defaultLinks }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const location = useLocation();

  // El menú se cierra al navegar a otra sección.
  useEffect(() => {
    setMenuOpen(false);
    setInfoOpen(false);
  }, [location.pathname]);

  return (
    <header className="relative z-50 shrink-0 bg-white">
      <nav
        aria-label="Navegación principal"
        className="flex min-h-[76px] items-center justify-between gap-3 border-b-2 border-gray-100 bg-white px-4 py-4 sm:px-6 lg:px-8"
      >
        <Logo />

        {/* La navegación original se mantiene en escritorio. */}
        <ul className="hidden min-w-0 list-none items-center lg:flex">
          {links.map((link, index) => (
            <HButton
              key={link.to}
              link={link}
              index={index}
              length={links.length}
            />
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Información del sitio"
            aria-expanded={infoOpen}
            onClick={() => setInfoOpen((old) => !old)}
            className="rounded-md p-2 text-lg text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-(--color-bglight)"
          >
            ⓘ
          </button>
          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((old) => !old)}
            className="rounded-md border border-gray-200 px-3 py-2 text-xl font-bold text-(--color-bglight) hover:bg-gray-100 lg:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {infoOpen && (
        <div
          className="border-b border-gray-200 bg-(--color-cream) px-4 py-3 text-sm text-(--color-wine) sm:px-6 lg:px-8"
          role="status"
        >
          Explora estadísticas, estadios en 3D, videos, trivia y realidad
          aumentada.
        </div>
      )}

      {/* Mismo estilo y colores; menú vertical solo en celular y tablet. */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Menú para móviles"
          className="border-b-2 border-gray-100 bg-white shadow-md lg:hidden"
        >
          <ul className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-3 text-sm font-extrabold tracking-tight no-underline transition-colors ${
                      isActive
                        ? "bg-(--color-bglight) text-white"
                        : "text-black hover:bg-gray-100 hover:text-(--color-bglight)"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

export function Logo() {
  return (
    <Link
      to="/"
      className="shrink-0 rounded border-l-10 border-(--color-redlight) bg-(--color-bglight) px-4 py-2 font-black italic text-white"
    >
      MLB
    </Link>
  );
}

export function HButton({ link, index, length }) {
  return (
    <li className="flex items-center">
      <Link
        to={link.to}
        className="text-center text-xs font-extrabold tracking-tight text-black no-underline hover:text-(--color-bglight) xl:text-sm"
      >
        {link.label}
      </Link>
      {index < length - 1 && (
        <span className="px-2 xl:px-4" aria-hidden="true">
          |
        </span>
      )}
    </li>
  );
}

export function Breadcrumb({ children }) {
  return (
    <div className="bg-(--color-cream) px-4 py-3 text-sm font-black italic tracking-wide text-(--color-wine) sm:px-6 sm:text-base lg:px-10 lg:text-lg">
      &gt; {children}
    </div>
  );
}
