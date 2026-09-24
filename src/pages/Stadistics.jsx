import { useState } from "react";

import { Breadcrumb } from "../globals.jsx";

const players = [
  {
    id: "jugador1",
    name: "Jugador1",

    paragraphs: [
      `Los New York Mets son un equipo profesional de béisbol con sede
      en el distrito de Queens de la ciudad de Nueva York. Compiten en
      la División Este de la Liga Nacional de las Grandes Ligas de
      Béisbol (MLB).`,

      `Fundados en 1962 para reemplazar a los abandonados Giants y
      Dodgers de Nueva York, los Mets adoptaron el azul y naranja para
      representar el regreso del béisbol de la Liga Nacional a la
      ciudad.`,

      `A lo largo de su historia, los Mets han ganado dos títulos de
      Serie Mundial (1969 y 1986), marcando momentos icónicos en el
      deporte.`,
    ],
  },

  {
    id: "jugador2",
    name: "Jugador2",

    paragraphs: [
      `Plantilla actual y roster oficial de los jugadores destacados
      de la franquicia.`,
    ],
  },

  {
    id: "jugador3",
    name: "Jugador3",

    paragraphs: [
      `Estadísticas completas de bateo, picheo y posición en la tabla
      divisional.`,
    ],
  },

  {
    id: "jugador4",
    name: "Jugador4",

    paragraphs: [
      `Preguntas y datos curiosos sobre momentos históricos de los Mets.`,
    ],
  },
];

export default function Estadisticas() {
  const [selectedPlayer, setSelectedPlayer] = useState("jugador1");

  const currentPlayer = players.find((player) => player.id === selectedPlayer);

  return (
    <>
      <Breadcrumb>INICIO &gt; JUGADOR</Breadcrumb>

      <main
        className="
          relative
          min-h-[calc(100vh-100px)]
          overflow-hidden

          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]

          px-15
          py-10
          text-white
        "
      >
        <BackgroundLogo />

        <div className="relative z-10">
          <h1
            className="
              mb-10

              text-[38px]
              font-black
              italic
              tracking-[1px]
              text-white

              [-webkit-text-stroke:2px_#ff2a4b]
            "
          >
            JUGADORES DE
          </h1>

          <div
            className="
              flex
              items-start
              gap-12.5
            "
          >
            <PlayerMenu
              players={players}
              selectedPlayer={selectedPlayer}
              onSelect={setSelectedPlayer}
            />

            <PlayerContent player={currentPlayer} />
          </div>
        </div>
      </main>
    </>
  );
}

function BackgroundLogo() {
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/en/7/7b/New_York_Mets_Insignia.svg"
      alt=""
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        left-[20%]
        top-[10%]

        h-[80%]
        w-[70%]

        object-contain
        opacity-[0.04]
      "
    />
  );
}

//#region PlayerMenu

export function PlayerMenu({ players, selectedPlayer, onSelect }) {
  return (
    <aside className="w-50 shrink-0">
      <ul
        className="
          flex
          list-none
          flex-col
          gap-3.75
        "
      >
        {players.map((player) => (
          <PlayerButton
            key={player.id}
            player={player}
            selected={selectedPlayer === player.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </aside>
  );
}

function PlayerButton({ player, selected, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(player.id)}
        className={`
          cursor-pointer
          text-left

          text-2xl
          font-black
          italic

          transition-colors
          duration-200

          hover:text-[#ff2a4b]

          ${
            selected
              ? "text-[#ff2a4b] [-webkit-text-stroke:1px_white]"
              : "text-[#030a17]"
          }
        `}
      >
        {player.name}

        {selected && <span className="ml-2">&lt;</span>}
      </button>
    </li>
  );
}
//#endregion

//#region PlayerContent
export function PlayerContent({ player }) {
  if (!player) {
    return null;
  }

  return (
    <section
      className="
        flex
        min-h-95
        flex-1
        flex-col
        justify-between
      "
    >
      <div className="max-w-187.5">
        {player.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="
              mb-4

              text-lg
              font-medium
              leading-[1.6]

              text-[#e0e6ed]
            "
          >
            {paragraph}
          </p>
        ))}
      </div>

      <TeamLogo />
    </section>
  );
}

function TeamLogo() {
  return (
    <div
      className="
        mt-5
        flex
        h-40
        w-65
        self-end

        items-center
        justify-center

        rounded
        bg-white
        p-3.75

        shadow-xl
      "
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/en/7/7b/New_York_Mets_Insignia.svg"
        alt="Logo de New York Mets"
        className="
          max-h-full
          max-w-full
          object-contain
        "
      />
    </div>
  );
}
//#endregion
