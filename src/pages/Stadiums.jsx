import { Breadcrumb } from "../globals.jsx";


const stadiums = [
  {
    id: 1,
    name: "Citi Field",
    capacity: "41,922",
    address: "Queens, Nueva York",
    team: "New York Mets",
    image: "/imagen.jpg",
  },

  {
    id: 2,
    name: "Dodger Stadium",
    capacity: "56,000",
    address: "Los Ángeles, California",
    team: "Los Angeles Dodgers",
    image: "/imagen.jpg",
  },

  {
    id: 3,
    name: "Yankee Stadium",
    capacity: "46,537",
    address: "Bronx, Nueva York",
    team: "New York Yankees",
    image: "/imagen.jpg",
  },
];

export default function Estadios() {
  return (
    <>
      <Breadcrumb>
        INICIO &gt; ESTADIOS
      </Breadcrumb>

      <main
        className="
          flex
          min-h-[calc(100vh-100px)]
          flex-col
          gap-7.5

          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]

          px-15
          py-10
        "
      >
        {stadiums.map((stadium, index) => (
          <div key={stadium.id}>
            <StadiumCard stadium={stadium} />

            {index < stadiums.length - 1 && (
              <StadiumSeparator />
            )}
          </div>
        ))}
      </main>
    </>
  );
}

function StadiumSeparator() {
  return (
    <div
      className="
        my-10
        h-0.5
        w-full

        bg-linear-to-r
        from-transparent
        via-(--color-redlight)/60
        to-transparent
      "
    />
  );
}

function StadiumCard({ stadium }) {
  return (
    <article
      className="
        flex
        flex-col
        gap-10

        rounded-2xl
        border
        border-white/10

        bg-white/5
        p-7.5

        shadow-xl

        md:flex-row
        md:items-center
        md:justify-between
      "
    >
      <StadiumInfo stadium={stadium} />

      <StadiumImage image={stadium.image} name={stadium.name} />
    </article>
  );
}

function StadiumInfo({ stadium }) {
  return (
    <div
      className="
        flex
        flex-1
        flex-col
        gap-5
      "
    >
      <h2
        className="
          border-l-[5px]
          border-(--color-redlight)
          pl-3.75

          text-[32px]
          font-black
          italic
          uppercase
          tracking-[1px]
          text-white
        "
      >
        {stadium.name}
      </h2>

      <ul
        className="
          flex
          list-none
          flex-col
          gap-3
          pl-1.25
        "
      >
        <StadiumData label="Capacidad" value={stadium.capacity} />

        <StadiumData label="Dirección" value={stadium.address} />

        <StadiumData label="Equipo" value={stadium.team} />
      </ul>
    </div>
  );
}

function StadiumData({ label, value }) {
  return (
    <li
      className="
        text-lg
        font-semibold
        tracking-[0.5px]
        text-[#e0e6ed]
      "
    >
      <span className="font-bold">{label}:</span> {value}
    </li>
  );
}

function StadiumImage({ image, name }) {
  return (
    <div
      className="
        h-70
        min-w-75
        flex-1
        overflow-hidden

        rounded-[10px]
        border-2
        border-white/15

        bg-[#1a2b4c]
      "
    >
      <img
        src={image}
        alt={`Estadio ${name}`}
        className="
          h-full
          w-full
          object-cover
        "
      />
    </div>
  );
}
