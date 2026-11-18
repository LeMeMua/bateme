import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";

import { Breadcrumb } from "../globals.jsx";

const teams = {
  atl: "Atlanta Braves",
  mia: "Miami Marlins",
  nym: "New York Mets",
  phi: "Philadelphia Phillies",
  wsh: "Washington Nationals",

  lad: "Los Angeles Dodgers",
  sd: "San Diego Padres",
  sf: "San Francisco Giants",
  ari: "Arizona Diamondbacks",
  col: "Colorado Rockies",

  chc: "Chicago Cubs",
  cin: "Cincinnati Reds",
  mil: "Milwaukee Brewers",
  pit: "Pittsburgh Pirates",
  stl: "St. Louis Cardinals",
};

export default function Estadisticas() {
  const { teamSlug } = useParams();

  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const teamName = teams[teamSlug] || "";

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setLoading(true);
      setError("");
      setPlayers([]);
      setSelectedPlayer(null);

      try {
        const response = await fetch("/stats.xlsx");

        if (!response.ok) {
          throw new Error("No se pudo cargar el archivo de estadísticas");
        }

        const buffer = await response.arrayBuffer();

        const workbook = XLSX.read(buffer, {
          type: "array",
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const data = XLSX.utils.sheet_to_json(sheet, {
          defval: null,
          raw: true,
        });

        const filteredPlayers = data
          .filter((row) => {
            if (!teamName) return false;

            return (
              String(row["Equipo"] || "")
                .trim()
                .toLowerCase() === teamName.toLowerCase()
            );
          })
          .map((row, index) => ({
            id: String(row["ID MLB"] ?? index),
            name: row["Jugador"],
            number: row["Uniforme"],
            position: row["Posición"],
            mlbId: row["ID MLB"],
            stats: row,
          }));

        if (active) {
          setPlayers(filteredPlayers);
          setSelectedPlayer(filteredPlayers[0]?.id ?? null);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, [teamName]);

  const currentPlayer = players.find((player) => player.id === selectedPlayer);

  return (
    <>
      <Breadcrumb>
        INICIO &gt; ESTADISTICAS &gt; {teamName || "EQUIPOS"}
      </Breadcrumb>

      <main
        className="
          relative
          min-h-[calc(100vh-100px)]
          overflow-hidden
          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]
          px-4
          py-8
          text-white
          sm:px-6
          sm:py-10
          lg:px-15
        "
      >
        <div className="relative z-10 mx-auto w-full max-w-350 min-w-0">
          <h1
            className="
              mb-7
              break-words
              text-2xl
              sm:text-3xl
              md:mb-10
              lg:text-[38px]
              font-black
              italic
              tracking-[1px]
              text-white
              [-webkit-text-stroke:1px_#ff2a4b]
              sm:[-webkit-text-stroke:2px_#ff2a4b]
            "
          >
            JUGADORES DE {teamName.toUpperCase()}
          </h1>

          {!teamSlug && <p>Selecciona un equipo desde la página de inicio.</p>}

          {teamSlug && !teamName && <p>El equipo seleccionado no existe.</p>}

          {loading && teamName && <p>Cargando jugadores...</p>}

          {error && <p className="text-red-400">{error}</p>}

          {!loading && !error && teamName && (
            <>
              <p className="mb-6 text-gray-300">
                Total de jugadores: {players.length}
              </p>

              <div className="flex min-w-0 flex-col items-stretch gap-7 lg:flex-row lg:items-start lg:gap-12.5">
                <PlayerMenu
                  players={players}
                  selectedPlayer={selectedPlayer}
                  onSelect={setSelectedPlayer}
                />

                <PlayerContent player={currentPlayer} />
              </div>
            </>
          )}
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
    <aside className="w-full min-w-0 shrink-0 overflow-x-auto pb-2 lg:max-h-150 lg:w-64 lg:overflow-y-auto lg:overflow-x-hidden">
      <ul
        className="
          flex
          list-none
          flex-row
          gap-3
          lg:flex-col
          lg:gap-3.75
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
    <li className="shrink-0">
      <button
        type="button"
        onClick={() => onSelect(player.id)}
        className={`
          cursor-pointer
          text-left

          whitespace-nowrap
          text-base
          sm:text-lg
          lg:text-2xl
          font-black
          italic

          transition-colors
          duration-200

          hover:text-[#ff2a4b]

          ${
            selected
              ? "text-[#ff2a4b] [-webkit-text-stroke:1px_white]"
              : "text-white"
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
    return (
      <p className="text-gray-300">
        No hay jugadores disponibles para este equipo.
      </p>
    );
  }

  const battingStats = [
    "Bateo G",
    "AB",
    "R",
    "H",
    "2B",
    "3B",
    "HR",
    "RBI",
    "BB bateo",
    "SO bateo",
    "SB",
    "CS",
    "AVG",
    "OBP",
    "SLG",
    "OPS",
  ];

  const pitchingStats = [
    "W",
    "L",
    "ERA",
    "SV",
    "HLD",
    "IP",
    "SO pitcheo",
    "BB pitcheo",
    "WHIP",
  ];

  const fieldingStats = ["FLD%", "PO", "A", "E", "TC"];

  function renderStats(title, columns) {
    const hasStats = columns.some(
      (column) =>
        player.stats[column] !== null &&
        player.stats[column] !== undefined &&
        player.stats[column] !== "",
    );

    return (
      <div className="mb-8">
        <h3 className="mb-4 border-l-4 border-[#ff2a4b] pl-3 text-xl font-black italic">
          {title}
        </h3>

        {!hasStats ? (
          <p className="text-gray-400">No hay estadísticas registradas.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-max text-left text-xs sm:text-sm">
              <thead className="bg-[#ff2a4b] text-white">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-4 py-3">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr className="bg-white/10">
                  {columns.map((column) => (
                    <td key={column} className="whitespace-nowrap px-4 py-4">
                      {player.stats[column] ?? "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="w-full min-w-0 flex-1">
      <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h2 className="mb-5 break-words text-2xl font-black italic text-[#ff2a4b] sm:text-3xl">
          {player.name}
        </h2>

        <div className="grid grid-cols-1 gap-4 text-base sm:grid-cols-2 sm:text-lg xl:grid-cols-3">
          <p>
            <span className="font-bold">Número:</span> {player.number ?? "—"}
          </p>

          <p>
            <span className="font-bold">Posición:</span>{" "}
            {player.position ?? "—"}
          </p>

          <p>
            <span className="font-bold">ID MLB:</span> {player.mlbId ?? "—"}
          </p>
        </div>
      </div>

      {renderStats("ESTADÍSTICAS DE BATEO", battingStats)}

      {renderStats("ESTADÍSTICAS DE PITCHEO", pitchingStats)}

      {renderStats("ESTADÍSTICAS DE FILDEO", fieldingStats)}
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
