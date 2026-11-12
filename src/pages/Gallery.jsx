import { useEffect, useRef, useState } from "react";

import { Breadcrumb } from "../globals.jsx";

// ==========================================
// CONFIGURACIÓN DE LOS 9 VIDEOS
// ==========================================

const galleryItems = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: `Video ${index + 1}`,
}));

// Rutas de los archivos MP4
function getVideoUrl(id, withParticles) {
  const folder = withParticles ? "Con Partículas" : "Sin Partículas";

  return `/${encodeURIComponent(folder)}/${id}.mp4`;
}

// ==========================================
// TIPOS DE FILTROS
// ==========================================

const filters = [
  {
    id: "normal",
    label: "Original",
  },
  {
    id: "pixelado",
    label: "Pixelado",
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

  // Seleccionar uno de los 9 videos
  function selectVideo(id) {
    if (id === selectedId) return;

    resumeRef.current = null;
    setSelectedId(id);

    playerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Cambiar entre las dos versiones
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
          {/* REPRODUCTOR PRINCIPAL */}

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

            {/* VIDEO INTERACTIVO */}

            <VideoPlayer
              videoRef={videoRef}
              resumeRef={resumeRef}
              src={videoUrl}
              filter={filter}
            />

            {/* SELECTOR DE FILTROS */}

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

            <p className="mt-4 text-xs text-white/50">
              Cambia los filtros mientras se reproduce el video. Usa el botón
              superior para alternar entre la versión con partículas y la
              versión sin partículas.
            </p>
          </section>

          {/* TÍTULO DE LA GALERÍA */}

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

          {/* CUADRÍCULA DE LOS 9 VIDEOS */}

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
  const canvasRef = useRef(null);
  const fullscreenRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  // Recargar video al cambiar su ruta
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const resume = resumeRef.current;
    resumeRef.current = null;

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError("");

    const restorePlayback = () => {
      setDuration(video.duration || 0);

      if (resume) {
        const maxTime = Number.isFinite(video.duration)
          ? Math.max(0, video.duration - 0.05)
          : resume.time;

        video.currentTime = Math.min(resume.time, maxTime);

        if (resume.playing) {
          video.play().catch(() => {
            // Algunos navegadores bloquean
            // la reproducción automática.
          });
        }
      }
    };

    video.addEventListener("loadedmetadata", restorePlayback);

    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", restorePlayback);
    };
  }, [src, videoRef, resumeRef]);

  // ========================================
  // FILTRO PIXELADO CON CANVAS
  // ========================================

  useEffect(() => {
    if (filter !== "pixelado") return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const smallCanvas = document.createElement("canvas");
    const smallCtx = smallCanvas.getContext("2d");

    if (!smallCtx) return;

    let animationId;

    function drawPixelatedFrame() {
      const cssWidth = video.clientWidth;
      const cssHeight = video.clientHeight;

      if (cssWidth > 0 && cssHeight > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const width = Math.round(cssWidth * dpr);
        const height = Math.round(cssHeight * dpr);

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        // Cuanto mayor sea este número,
        // más grandes serán los píxeles.
        const pixelSize = 14;

        const smallWidth = Math.max(1, Math.round(cssWidth / pixelSize));

        const smallHeight = Math.max(1, Math.round(cssHeight / pixelSize));

        if (
          smallCanvas.width !== smallWidth ||
          smallCanvas.height !== smallHeight
        ) {
          smallCanvas.width = smallWidth;
          smallCanvas.height = smallHeight;
        }

        smallCtx.fillStyle = "#000000";
        smallCtx.fillRect(0, 0, smallWidth, smallHeight);

        if (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          // Mantener las proporciones originales
          const ratio = Math.min(
            smallWidth / video.videoWidth,
            smallHeight / video.videoHeight,
          );

          const drawWidth = video.videoWidth * ratio;
          const drawHeight = video.videoHeight * ratio;

          const x = (smallWidth - drawWidth) / 2;
          const y = (smallHeight - drawHeight) / 2;

          smallCtx.drawImage(video, x, y, drawWidth, drawHeight);
        }

        // Desactivar suavizado al ampliar
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);

        ctx.drawImage(smallCanvas, 0, 0, width, height);
      }

      animationId = requestAnimationFrame(drawPixelatedFrame);
    }

    drawPixelatedFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [filter, src, videoRef]);

  // ========================================
  // CONTROLES DE REPRODUCCIÓN
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

  function handleSeek(event) {
    const video = videoRef.current;

    if (!video) return;

    const time = Number(event.target.value);

    video.currentTime = time;
    setCurrentTime(time);
  }

  function toggleMute() {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function toggleFullscreen() {
    const element = fullscreenRef.current;

    if (!element) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      element.requestFullscreen?.();
    }
  }

  function handleVideoError() {
    const video = videoRef.current;
    const code = video?.error?.code;

    let message = "No se pudo cargar el video.";

    if (code === 4) {
      message = "Archivo no encontrado o formato de video no compatible.";
    }

    if (code === 3) {
      message = "El navegador no pudo decodificar este video.";
    }

    setError(message);
  }

  // ========================================
  // ESTILOS SEGÚN EL FILTRO
  // ========================================

  const videoStyle = {
    filter: filter === "blur" ? "blur(6px)" : "none",

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
      {/* PANTALLA DEL VIDEO */}

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
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(event) =>
            setCurrentTime(event.currentTarget.currentTime)
          }
          onDurationChange={(event) =>
            setDuration(event.currentTarget.duration || 0)
          }
          onError={handleVideoError}
        />

        {/* CAPA DEL PIXELADO */}

        {filter === "pixelado" && (
          <canvas
            ref={canvasRef}
            className="
              pointer-events-none
              absolute
              inset-0
              h-full
              w-full
            "
          />
        )}

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

      {/* BARRA DE CONTROLES */}

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
          max={Number.isFinite(duration) && duration > 0 ? duration : 0.1}
          step="0.1"
          value={Math.min(
            currentTime,
            Number.isFinite(duration) && duration > 0 ? duration : 0.1,
          )}
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

            {/* VOLUMEN */}

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
        {/* VISTA PREVIA DEL VIDEO */}

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

        {/* SOMBRA INFERIOR */}

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

        {/* ICONO DE REPRODUCCIÓN */}

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

        {/* INFORMACIÓN DEL VIDEO */}

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

        {/* INDICADOR DE SELECCIÓN */}

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
