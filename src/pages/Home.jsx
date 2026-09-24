import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <DivisionNav />

      <main
        className="
          relative
          flex
          min-h-[70vh]
          flex-col
          items-center
          justify-center
          overflow-hidden
          bg-(--color-hero)
          px-10
          py-16
        "
      >
        <Background />

        <div
          className="
            relative
            z-10
            flex
            w-full
            max-w-325
            flex-col
            items-center
          "
        >
          <HomeImages />

          <h1
            className="
              mt-10
              text-center
              text-[28px]
              font-bold
              italic
              tracking-wide
              text-white
            "
          >
            Cada Juego. Cada rivalidad. Cada momento.
          </h1>
        </div>
      </main>
    </>
  );
}
const divisions = [
  {
    name: "DIVISION ESTE",
    teams: [
      { name: "ATL", slug: "atl" },
      { name: "MIA", slug: "mia" },
      { name: "NYM", slug: "nym" },
      { name: "PHI", slug: "phi" },
      { name: "WSH", slug: "wsh" },
    ],
  },

  {
    name: "DIVISION OESTE",
    teams: [
      { name: "LAD", slug: "lad" },
      { name: "SD", slug: "sd" },
      { name: "SF", slug: "sf" },
      { name: "ARI", slug: "ari" },
      { name: "COL", slug: "col" },
    ],
  },

  {
    name: "DIVISION CENTRAL",
    teams: [
      { name: "CHC", slug: "chc" },
      { name: "CIN", slug: "cin" },
      { name: "MIL", slug: "mil" },
      { name: "PIT", slug: "pit" },
      { name: "STL", slug: "stl" },
    ],
  },
];

export function DivisionNav() {
  const [isMoving, setIsMoving] = useState(true);
  const [currentDivision, setCurrentDivision] = useState(0);

  const scrollContainer = useRef(null);

  useEffect(() => {
    if (!isMoving) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentDivision((previousDivision) => {
        return (previousDivision + 1) % divisions.length;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [isMoving]);

  useEffect(() => {
    const container = scrollContainer.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      left: currentDivision * container.clientWidth,
      behavior: "smooth",
    });
  }, [currentDivision]);

  return (
    <section
      ref={scrollContainer}
      onMouseEnter={() => setIsMoving(false)}
      onMouseLeave={() => setIsMoving(true)}
      className="
        bg-(--color-cream)
        py-5
        w-full
        overflow-x-auto
        snap-x
        snap-mandatory
      "
    >
      <div className="flex w-full">
        {divisions.map((division) => (
          <div
            key={division.name}
            className="
              w-full
              shrink-0
              px-10
              flex
              justify-center
              items-center
              snap-center
            "
          >
            <Division division={division} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Division({ division }) {
  return (
    <div className="flex items-center gap-6">
      <h2
        className="
          whitespace-nowrap
          text-lg
          font-black
          italic
          tracking-wide
          text-(--color-wine)
        "
      >
        <span className="mr-2">&gt;</span>

        {division.name}
      </h2>

      <div className="flex gap-4">
        {division.teams.map((team) => (
          <TeamButton key={team.slug} team={team} />
        ))}
      </div>
    </div>
  );
}

function TeamButton({ team }) {
  return (
    <Link
      to={`/equipo/${team.slug}`}
      className="
        flex
        h-15
        w-15
        shrink-0
        items-center
        justify-center

        rounded-full
        border-2
        border-gray-200

        bg-white
        text-sm
        font-bold
        text-(--color-bglight)

        shadow-sm

        transition
        duration-200

        hover:-translate-y-1
        hover:border-(--color-bglight)
        hover:shadow-lg
      "
    >
      {team.name}
    </Link>
  );
}

function Background() {
  return (
    <div
      className="
        absolute
        inset-0
        bg-cover
        bg-center
      "
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(11, 34, 82, 0.88),
            rgba(11, 34, 82, 0.88)
          ),
          url('/imagen.jpg')
        `,
      }}
    />
  );
}

function HomeImages() {
  return (
    <section
      className="
        flex
        w-full
        items-center
        justify-center
        gap-5
      "
      aria-label="Imágenes destacadas"
    >
      <HomeImage />

      <HomeImage main />

      <HomeImage />
    </section>
  );
}

function HomeImage({ main = false }) {
  return (
    <div
      className={`
        bg-cover
        bg-center
        shadow-2xl
        transition

        ${main ? "h-87.5 w-155" : "h-75 w-100 opacity-70"}
      `}
      style={{
        backgroundImage: "url('/imagen.jpg')",
      }}
    />
  );
}
