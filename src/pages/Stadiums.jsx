import { Component, Suspense, useMemo } from "react";

import { Canvas } from "@react-three/fiber";

import { OrbitControls, useFBX, Html } from "@react-three/drei";

import { Box3, Vector3 } from "three";

import { Breadcrumb } from "../globals.jsx";

// ====================================
// DATOS DE LOS ESTADIOS
// ====================================

const stadiums = [
  {
    id: 1,
    name: "Citi Field",
    capacity: "41,922",
    address: "Queens, Nueva York",
    team: "New York Mets",
    model: "/models/estadios-citi.fbx",
  },
  {
    id: 2,
    name: "Dodger Stadium",
    capacity: "56,000",
    address: "Los Ángeles, California",
    team: "Los Angeles Dodgers",
    model: "/models/estadio-dodgers.fbx",
  },
  {
    id: 3,
    name: "Yankee Stadium",
    capacity: "46,537",
    address: "Bronx, Nueva York",
    team: "New York Yankees",
    model: "/models/estadio-yankees.fbx",
  },
];

// ====================================
// PÁGINA PRINCIPAL
// ====================================

export default function Estadios() {
  return (
    <>
      <Breadcrumb>INICIO &gt; ESTADIOS</Breadcrumb>

      <main
        className="
          flex
          min-h-[calc(100vh-100px)]
          flex-col
          gap-7.5

          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]

          px-4
          py-10
          md:px-15
        "
      >
        {stadiums.map((stadium, index) => (
          <div key={stadium.id}>
            <StadiumCard stadium={stadium} />

            {index < stadiums.length - 1 && <StadiumSeparator />}
          </div>
        ))}
      </main>
    </>
  );
}

// ====================================
// SEPARADOR
// ====================================

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

// ====================================
// TARJETA DEL ESTADIO
// ====================================

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
        p-5

        shadow-xl

        md:flex-row
        md:items-center
        md:justify-between
        md:p-7.5
      "
    >
      <StadiumInfo stadium={stadium} />

      <StadiumModelViewer model={stadium.model} name={stadium.name} />
    </article>
  );
}

// ====================================
// INFORMACIÓN DEL ESTADIO
// ====================================

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

// ====================================
// DATOS INDIVIDUALES
// ====================================

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

// ====================================
// MANEJO DE ERRORES DE MODELOS
// ====================================

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Error al cargar el estadio 3D:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="
            flex
            h-full
            w-full
            flex-col
            items-center
            justify-center
            gap-3
            p-5
            text-center
          "
        >
          <p className="font-bold text-red-400">
            No se pudo cargar el modelo 3D
          </p>

          <p className="text-sm text-white/70">{this.state.error.message}</p>

          <p className="text-xs text-white/50">
            Verifica la ruta del archivo FBX.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ====================================
// CARGADOR Y CENTRADO DEL MODELO FBX
// ====================================

function StadiumModel({ url }) {
  // Cargar archivo FBX
  const fbx = useFBX(url);

  // Preparar el modelo
  const model = useMemo(() => {
    const clonedModel = fbx.clone(true);

    // Calcular dimensiones originales
    const box = new Box3().setFromObject(clonedModel);

    if (box.isEmpty()) {
      console.warn("El modelo no contiene geometría visible:", url);

      return clonedModel;
    }

    const center = box.getCenter(new Vector3());

    const size = box.getSize(new Vector3());

    // Identificar la dimensión más grande
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Ajustar el tamaño automáticamente
    if (maxDimension > 0) {
      const scale = 5 / maxDimension;

      clonedModel.scale.setScalar(scale);

      // Centrar teniendo en cuenta la escala
      clonedModel.position.copy(center).multiplyScalar(-scale);
    }

    // Configurar materiales y geometrías
    clonedModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Evitar ocultar partes del modelo
        // por cálculos incorrectos de visibilidad
        child.frustumCulled = false;
      }
    });

    console.log("FBX cargado correctamente:", url);

    return clonedModel;
  }, [fbx, url]);

  return <primitive object={model} />;
}

// ====================================
// PANTALLA DE CARGA
// ====================================

function StadiumLoading() {
  return (
    <Html center>
      <div
        className="
          flex
          flex-col
          items-center
          gap-3
          whitespace-nowrap
        "
      >
        <div
          className="
            h-8
            w-8
            animate-spin
            rounded-full
            border-4
            border-white/20
            border-t-red-500
          "
        />

        <p className="text-sm font-semibold text-white">
          Cargando estadio 3D...
        </p>
      </div>
    </Html>
  );
}

// ====================================
// VISOR 3D INTERACTIVO
// ====================================

function StadiumModelViewer({ model, name }) {
  return (
    <div
      className="
        relative

        h-70
        w-full
        flex-1

        overflow-hidden

        rounded-[10px]
        border-2
        border-white/15

        bg-[#1a2b4c]

        md:min-w-75
      "
    >
      <ModelErrorBoundary key={model}>
        <Canvas
          camera={{
            position: [8, 7, 10],
            fov: 45,
            near: 0.01,
            far: 1000,
          }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
          }}
          style={{
            width: "100%",
            height: "100%",
            touchAction: "none",
          }}
        >
          {/* Fondo del visor */}

          <color attach="background" args={["#1a2b4c"]} />

          {/* Iluminación ambiental */}

          <ambientLight intensity={2} />

          {/* Luz superior */}

          <hemisphereLight args={["#ffffff", "#405070", 2]} />

          {/* Luz principal */}

          <directionalLight position={[10, 15, 10]} intensity={3} />

          {/* Luz secundaria */}

          <directionalLight position={[-10, 8, -10]} intensity={1.5} />

          {/* Modelo FBX */}

          <Suspense fallback={<StadiumLoading />}>
            <StadiumModel url={model} />
          </Suspense>

          {/* Controles de movimiento */}

          <OrbitControls
            makeDefault
            enableRotate={true}
            enableZoom={true}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.08}
            rotateSpeed={0.7}
            zoomSpeed={0.8}
            minDistance={3}
            maxDistance={30}
            target={[0, 0, 0]}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI - 0.1}
          />
        </Canvas>
      </ModelErrorBoundary>

      {/* Indicador inferior */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-3
          left-1/2

          -translate-x-1/2

          rounded-full

          border
          border-white/10

          bg-black/60

          px-4
          py-2

          text-center
          text-xs
          text-white/80

          backdrop-blur-md
        "
      >
        Arrastra para rotar · Scroll para zoom
      </div>

      {/* Accesibilidad */}

      <span className="sr-only">Modelo 3D interactivo de {name}</span>
    </div>
  );
}
