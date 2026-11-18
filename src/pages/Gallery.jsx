import { useEffect, useRef, useState } from "react";

import { Breadcrumb } from "../globals.jsx";

// ==========================================
// CONFIGURACIÓN DE LOS 9 VIDEOS
// ==========================================

const galleryItems = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: `Video ${index + 1}`,
}));

// ==========================================
// RUTAS DE LOS VIDEOS
// ==========================================

function getVideoUrl(id, withParticles) {
  const folder = withParticles ? "Con Partículas" : "Sin Partículas";

  return `/${encodeURIComponent(folder)}/${id}.mp4`;
}

// ==========================================
// FILTROS DISPONIBLES
// ==========================================

const filters = [
  {
    id: "normal",
    label: "Original",
  },
  {
    id: "saturacion",
    label: "Saturación",
  },
  {
    id: "blur",
    label: "Blur",
  },
  {
    id: "espejo",
    label: "Espejo",
  },
];

// ==========================================
// FORMATO DE TIEMPO
// ==========================================

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

// ==========================================
// GALERÍA PRINCIPAL
// ==========================================

export default function Galeria() {
  const [selectedId, setSelectedId] = useState(1);

  const [withParticles, setWithParticles] = useState(true);

  const [filter, setFilter] = useState("normal");

  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const resumeRef = useRef(null);

  const videoUrl = getVideoUrl(selectedId, withParticles);

  // ========================================
  // SELECCIONAR UN VIDEO
  // ========================================

  function selectVideo(id) {
    if (id === selectedId) {
      playerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    resumeRef.current = null;
    setSelectedId(id);

    playerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // ========================================
  // ACTIVAR / DESACTIVAR PARTÍCULAS
  // ========================================

  function toggleParticles() {
    const video = videoRef.current;

    resumeRef.current = {
      time: video?.currentTime || 0,
      playing: video ? !video.paused : false,
    };

    setWithParticles((previous) => !previous);
  }

  return (
    <>
      <Breadcrumb>INICIO &gt; GALERIA</Breadcrumb>

      <main
        className="
          min-h-[calc(100vh-100px)]

          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]

          px-4
          py-10

          md:px-15
        "
      >
        <div className="mx-auto max-w-300">
          {/* ============================ */}
          {/* REPRODUCTOR PRINCIPAL */}
          {/* ============================ */}

          <section
            ref={playerRef}
            className="
              mb-12

              overflow-hidden
              rounded-2xl

              border
              border-white/10

              bg-white/5

              p-4
              shadow-xl

              md:p-7
            "
          >
            {/* ENCABEZADO */}

            <div
              className="
                mb-5
                flex
                flex-wrap
                items-center
                justify-between
                gap-4
              "
            >
              <h2
                className="
                  border-l-[5px]
                  border-(--color-redlight)

                  pl-4

                  text-2xl
                  font-black
                  italic
                  uppercase
                  text-white
                "
              >
                VIDEO {selectedId}
              </h2>

              {/* BOTÓN DE PARTÍCULAS */}

              <button
                type="button"
                onClick={toggleParticles}
                className="
                  cursor-pointer

                  rounded-lg
                  border
                  border-red-500/50

                  bg-red-600

                  px-5
                  py-2.5

                  text-sm
                  font-bold
                  text-white

                  transition-all
                  hover:bg-red-500
                "
              >
                {withParticles ? "✦ Con partículas" : "◯ Sin partículas"}

                <span className="ml-2">⇄</span>
              </button>
            </div>

            {/* REPRODUCTOR */}

            <VideoPlayer
              videoRef={videoRef}
              resumeRef={resumeRef}
              src={videoUrl}
              filter={filter}
            />

            {/* ============================ */}
            {/* FILTROS DEL VIDEO */}
            {/* ============================ */}

            <div className="mt-6">
              <h3
                className="
                  mb-3

                  text-sm
                  font-bold
                  uppercase
                  tracking-widest

                  text-white/70
                "
              >
                Filtros de video
              </h3>

              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                "
              >
                {filters.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={filter === option.id}
                    onClick={() => setFilter(option.id)}
                    className={`
                      cursor-pointer
                      rounded-lg
                      border

                      px-5
                      py-2.5

                      text-sm
                      font-bold

                      transition-all
                      duration-300

                      ${
                        filter === option.id
                          ? "border-red-500 bg-red-600 text-white"
                          : "border-white/15 bg-white/5 text-white/70 hover:bg-white/15"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* INFORMACIÓN */}

            <p className="mt-4 text-xs text-white/50">
              Aplica filtros mientras reproduces el video. También puedes
              cambiar entre las versiones con y sin partículas.
            </p>
          </section>

          {/* ============================ */}
          {/* GALERÍA DE VIDEOS */}
          {/* ============================ */}

          <h2
            className="
              mb-7

              border-l-[5px]
              border-(--color-redlight)

              pl-4

              text-2xl
              font-black
              italic
              uppercase

              text-white
            "
          >
            GALERÍA DE VIDEOS
          </h2>

          <section
            className="
              grid
              grid-cols-1
              gap-7.5

              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            {galleryItems.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                withParticles={withParticles}
                onSelect={() => selectVideo(item.id)}
              />
            ))}
          </section>
        </div>
      </main>
    </>
  );
}

// ==========================================
// REPRODUCTOR DE VIDEO
// ==========================================

function VideoPlayer({ videoRef, resumeRef, src, filter }) {
  const fullscreenRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  // ========================================
  // REINICIAR ESTADOS CUANDO CAMBIA VIDEO
  // ========================================

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError("");
  }, [src]);

  // ========================================
  // RESTAURAR TIEMPO AL CAMBIAR PARTÍCULAS
  // ========================================

  function handleLoadedMetadata(event) {
    const video = event.currentTarget;

    const videoDuration = Number.isFinite(video.duration) ? video.duration : 0;

    setDuration(videoDuration);

    const resume = resumeRef.current;

    if (!resume) return;

    resumeRef.current = null;

    const maxTime = Math.max(0, videoDuration - 0.05);

    const resumeTime = Math.min(resume.time, maxTime);

    video.currentTime = resumeTime;

    setCurrentTime(resumeTime);

    if (resume.playing) {
      video.play().catch(() => {
        console.warn("El navegador bloqueó la reproducción automática.");
      });
    }
  }

  // ========================================
  // REPRODUCIR / PAUSAR
  // ========================================

  function togglePlay() {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {
        setError("No se pudo iniciar la reproducción.");
      });
    } else {
      video.pause();
    }
  }

  // ========================================
  // MOVER BARRA DE PROGRESO
  // ========================================

  function handleSeek(event) {
    const video = videoRef.current;

    if (!video) return;

    const time = Number(event.target.value);

    video.currentTime = time;
    setCurrentTime(time);
  }

  // ========================================
  // ACTIVAR / DESACTIVAR SONIDO
  // ========================================

  function toggleMute() {
    const video = videoRef.current;

    if (!video) return;

    const nextMuted = !video.muted;

    video.muted = nextMuted;

    setMuted(nextMuted);
  }

  // ========================================
  // PANTALLA COMPLETA
  // ========================================

  function toggleFullscreen() {
    const element = fullscreenRef.current;

    if (!element) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      element.requestFullscreen?.();
    }
  }

  // ========================================
  // ERRORES DE VIDEO
  // ========================================

  function handleVideoError(event) {
    const code = event.currentTarget.error?.code;

    let message = "No se pudo cargar el video.";

    if (code === 4) {
      message = "Archivo no encontrado o formato incompatible.";
    }

    if (code === 3) {
      message = "El navegador no pudo decodificar el video.";
    }

    setError(message);
  }

  // ========================================
  // ESTILOS DE LOS FILTROS
  // ========================================

  const videoStyle = {
    filter:
      filter === "saturacion"
        ? "saturate(1.8)"
        : filter === "blur"
          ? "blur(6px)"
          : "none",

    transform: filter === "espejo" ? "scaleX(-1)" : "none",
  };

  return (
    <div
      ref={fullscreenRef}
      className="
        overflow-hidden
        rounded-xl

        border
        border-white/15

        bg-[#071327]
      "
    >
      {/* ============================ */}
      {/* PANTALLA DEL VIDEO */}
      {/* ============================ */}

      <div
        className="
          relative
          aspect-video
          w-full
          overflow-hidden
          bg-black
        "
      >
        <video
          key={src}
          ref={videoRef}
          src={src}
          className="
            block
            h-full
            w-full
            object-contain
          "
          style={videoStyle}
          preload="metadata"
          playsInline
          muted={muted}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(event) =>
            setCurrentTime(event.currentTarget.currentTime)
          }
          onDurationChange={(event) => {
            const value = event.currentTarget.duration;

            setDuration(Number.isFinite(value) ? value : 0);
          }}
          onError={handleVideoError}
        />

        {/* MENSAJE DE ERROR */}

        {error && (
          <div
            className="
              absolute
              inset-0

              flex
              flex-col
              items-center
              justify-center
              gap-3

              bg-[#071327]/95

              p-5
              text-center
            "
          >
            <p className="font-bold text-red-400">{error}</p>

            <p className="break-all text-xs text-white/60">Ruta: {src}</p>
          </div>
        )}
      </div>

      {/* ============================ */}
      {/* CONTROLES DEL REPRODUCTOR */}
      {/* ============================ */}

      <div
        className="
          flex
          flex-col
          gap-3

          bg-[#071327]
          p-4
        "
      >
        {/* BARRA DE PROGRESO */}

        <input
          type="range"
          min="0"
          max={duration > 0 ? duration : 0.1}
          step="0.1"
          value={Math.min(currentTime, duration > 0 ? duration : 0.1)}
          onChange={handleSeek}
          aria-label="Progreso del video"
          className="
            w-full
            cursor-pointer
            accent-red-600
          "
        />

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            {/* PLAY / PAUSA */}

            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pausar" : "Reproducir"}
              className="
                cursor-pointer
                text-2xl
                text-white

                transition
                hover:text-red-400
              "
            >
              {playing ? "⏸" : "▶"}
            </button>

            {/* SONIDO */}

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              className="
                cursor-pointer
                text-xl
                text-white

                transition
                hover:text-red-400
              "
            >
              {muted ? "🔇" : "🔊"}
            </button>

            {/* TIEMPO */}

            <span
              className="
                text-xs
                font-semibold
                text-white/70

                sm:text-sm
              "
            >
              {formatTime(currentTime)}
              {" / "}
              {formatTime(duration)}
            </span>
          </div>

          {/* PANTALLA COMPLETA */}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Pantalla completa"
            className="
              cursor-pointer
              text-xl
              text-white

              transition
              hover:text-red-400
            "
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TARJETA DE LA GALERÍA
// ==========================================

export function GalleryCard({ item, selected, withParticles, onSelect }) {
  const previewUrl = getVideoUrl(item.id, withParticles);

  return (
    <article
      className={`
        group
        overflow-hidden
        rounded-xl
        border-2
        shadow-lg

        transition-all
        duration-300

        ${
          selected
            ? "border-red-500 shadow-red-500/20"
            : "border-white/10 hover:border-white/40"
        }
      `}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="
          relative
          block
          h-62.5
          w-full

          cursor-pointer
          overflow-hidden

          bg-[#1a2b4c]
          text-left
        "
      >
        {/* VISTA PREVIA */}

        <video
          key={previewUrl}
          src={`${previewUrl}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          className="
            h-full
            w-full
            object-cover

            transition-transform
            duration-300

            group-hover:scale-105
          "
        />

        {/* DEGRADADO */}

        <div
          className="
            pointer-events-none

            absolute
            inset-0

            bg-linear-to-t
            from-[#02112d]/95
            via-transparent
            to-transparent
          "
        />

        {/* ICONO DE PLAY */}

        <div
          className="
            pointer-events-none

            absolute
            inset-0

            flex
            items-center
            justify-center
          "
        >
          <div
            className="
              flex
              h-15
              w-15
              items-center
              justify-center

              rounded-full

              border
              border-white/30

              bg-[#02112d]/70

              text-2xl
              text-white

              backdrop-blur-sm

              transition-transform
              duration-300

              group-hover:scale-115
            "
          >
            ▶
          </div>
        </div>

        {/* INFORMACIÓN */}

        <div
          className="
            pointer-events-none

            absolute
            bottom-0
            left-0

            w-full
            p-5
          "
        >
          <h3
            className="
              text-xl
              font-black
              italic
              uppercase
              text-white
            "
          >
            {item.name}
          </h3>

          <p
            className="
              mt-1
              text-xs
              font-semibold
              text-white/70
            "
          >
            {withParticles
              ? "Versión con partículas"
              : "Versión sin partículas"}
          </p>
        </div>

        {/* VIDEO SELECCIONADO */}

        {selected && (
          <div
            className="
              pointer-events-none

              absolute
              right-3
              top-3

              rounded-full

              bg-red-600

              px-3
              py-1

              text-xs
              font-bold
              text-white
            "
          >
            Seleccionado
          </div>
        )}
      </button>
    </article>
  );
}
