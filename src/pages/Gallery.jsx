import { Breadcrumb } from "../globals.jsx";

const galleryItems = [
  {
    id: 1,
    image: "/imagen.jpg",
    alt: "Partido de béisbol",
    description: "Esta foto fue tomada en...",
  },

  {
    id: 2,
    image: "/imagen.jpg",
    alt: "Jugador de béisbol",
    description: "Esta foto fue tomada en...",
  },

  {
    id: 3,
    image: "/imagen.jpg",
    alt: "Estadio de béisbol",
    description: "Esta foto fue tomada en...",
  },

  {
    id: 4,
    image: "/imagen.jpg",
    alt: "Momento durante un partido",
    description: "Esta foto fue tomada en...",
  },

  {
    id: 5,
    image: "/imagen.jpg",
    alt: "Equipo de béisbol",
    description: "Esta foto fue tomada en...",
  },

  {
    id: 6,
    image: "/imagen.jpg",
    alt: "Imagen destacada de béisbol",
    description: "Esta foto fue tomada en...",
  },

  {
    id: 7,
    image: "/imagen.jpg",
    alt: "Galería de béisbol",
    description: "Esta foto fue tomada en...",
  },
];

export default function Galeria() {
  return (
    <>
      <Breadcrumb>INICIO &gt; GALERIA</Breadcrumb>

      <main
        className="
          min-h-[calc(100vh-100px)]

          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]

          px-15
          py-10
        "
      >
        <section
          className="
            mx-auto
            grid
            max-w-300

            grid-cols-1
            gap-7.5

            md:grid-cols-2
            lg:grid-cols-3
          "
        >
          {galleryItems.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </section>
      </main>
    </>
  );
}

export function GalleryCard({ item }) {
  return (
    <article
      className="
        group
        overflow-hidden
        rounded-xl
        border
        border-white/10
        shadow-lg
      "
    >
      <div
        className="
          relative
          h-62.5
          cursor-pointer
          overflow-hidden
        "
      >
        <img
          src={item.image}
          alt={item.alt}
          className="
            h-full
            w-full
            object-cover

            transition-transform
            duration-300

            group-hover:scale-105
          "
        />

        <div
          className="
            absolute
            inset-0

            flex
            items-center
            justify-center

            bg-[#02112d]/85

            p-5
            text-center
            text-lg
            font-bold
            italic
            text-white

            opacity-0

            transition-opacity
            duration-300

            group-hover:opacity-100
          "
        >
          {item.description}
        </div>
      </div>
    </article>
  );
}
