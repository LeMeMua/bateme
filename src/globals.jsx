import { Link } from "react-router-dom";

const defaultLinks = [
  { label: "ESTADISTICAS", to: "/estadisticas" },
  { label: "ESTADIOS", to: "/estadios" },
  { label: "GALERIA", to: "/galeria" },
  { label: "TRIVIA", to: "/trivia" },
  { label: "AR CAMERA", to: "/ar-camera" },
];

export default function Header({ links = defaultLinks }) {
  return (
    <header>
      <nav
        className="
          flex
          items-center
          justify-between
          border-b-2
          border-gray-100
          bg-white
          px-8
          py-4
        "
      >
        <Logo />

        <ul className="flex list-none items-center ">
          {links.map((link, index) => (
            <HButton
              key={link.to}
              link={link}
              index={index}
              length={links.length}
            />
          ))}
        </ul>

        <button type="button" className="text-lg text-gray-600">
          ⓘ
        </button>
      </nav>
    </header>
  );
}

export function Logo() {
  return (
    <Link
      to="/"
      className="
        rounded
        border-l-10
        border-(--color-redlight)
        bg-(--color-bglight)
        px-4
        py-2
        font-black
        italic
        text-white
      "
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
        className="
          text-sm
          text-center
          font-extrabold
          tracking-tight
          text-black
          no-underline
          hover:text-(--color-bglight)
        "
      >
        {link.label}
      </Link>

      {index < length - 1 && (
        <span className="px-4" aria-hidden="true">
          |
        </span>
      )}
    </li>
  );
}

export function Breadcrumb({ children }) {
  return (
    <div
      className="
        bg-(--color-cream)
        px-10
        py-3

        text-lg
        font-black
        italic
        tracking-wide
        text-(--color-wine)
      "
    >
      &gt; {children}
    </div>
  );
}
