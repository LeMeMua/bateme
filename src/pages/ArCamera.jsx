import { useCallback, useEffect, useRef, useState } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import * as THREE from "three";

// Un solo archivo .mind con varias imágenes.
// Asigna un modelo distinto a cada índice en public/ar/targets.json.
const CONFIG_URL = "/ar/targets.json";

function errorText(error) {
  if (error?.name === "NotAllowedError") {
    return "No se permitió usar la cámara. Revisa los permisos del navegador.";
  }
  if (error?.name === "NotFoundError") {
    return "No se encontró una cámara disponible.";
  }
  return error?.message || "Ocurrió un error inesperado.";
}

function validateConfig(data) {
  if (!Array.isArray(data?.collections) || !data.collections.length) {
    throw new Error(
      "targets.json debe contener una lista 'collections' no vacía.",
    );
  }

  if (data.collections.length !== 1) {
    throw new Error(
      "Para el modo de cámara única, usa una sola colección con un archivo .mind que incluya todas las imágenes.",
    );
  }

  return data.collections.map((collection, i) => {
    if (
      !collection?.mind ||
      !Array.isArray(collection.targets) ||
      !collection.targets.length
    ) {
      throw new Error(
        `La colección ${i + 1} necesita 'mind' y una lista 'targets' no vacía.`,
      );
    }
    const used = new Set();
    const targets = collection.targets.map((item) => {
      if (!Number.isInteger(item.index) || item.index < 0 || !item.model) {
        throw new Error(
          `Objetivo inválido en ${collection.mind}: necesita index >= 0 y model.`,
        );
      }
      if (used.has(item.index)) {
        throw new Error(
          `targetIndex repetido (${item.index}) en ${collection.mind}.`,
        );
      }
      used.add(item.index);
      return item;
    });
    return {
      ...collection,
      id: collection.id || collection.mind,
      name: collection.name || collection.mind,
      targets,
    };
  });
}

// Libera geometrías, materiales y texturas de un modelo cargado.
function disposeModel(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((part) => {
    if (part.geometry) geometries.add(part.geometry);
    const list = part.material
      ? Array.isArray(part.material)
        ? part.material
        : [part.material]
      : [];
    list.forEach((material) => {
      if (!material) return;
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value);
      });
    });
  });

  geometries.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
  textures.forEach((item) => item.dispose());
}

function createLoader(path) {
  const cleanPath = path.split(/[?#]/)[0].toLowerCase();
  if (cleanPath.endsWith(".fbx"))
    return { loader: new FBXLoader(), type: "fbx" };
  if (cleanPath.endsWith(".glb") || cleanPath.endsWith(".gltf")) {
    return { loader: new GLTFLoader(), type: "gltf" };
  }
  throw new Error(`Modelo no compatible: ${path}. Usa .glb, .gltf o .fbx.`);
}

function placeModel(anchor, asset, config, session) {
  const { root, clips } = asset;
  const pivot = new THREE.Group();
  const normalized = new THREE.Group();
  normalized.add(root);

  const bounds = new THREE.Box3().setFromObject(root);
  if (bounds.isEmpty()) {
    throw new Error(`El modelo ${config.model} no tiene geometría visible.`);
  }

  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const longestSide = Math.max(size.x, size.y, size.z);
  const desiredSize = Number(config.size ?? 0.7);
  if (!Number.isFinite(desiredSize) || desiredSize <= 0) {
    throw new Error(`Tamaño inválido para ${config.model}.`);
  }

  // El ancho de la imagen detectada equivale aproximadamente a 1 unidad.
  const factor = longestSide > 0 ? desiredSize / longestSide : 1;
  normalized.scale.setScalar(factor);
  normalized.position.copy(center).multiplyScalar(-factor);

  const offset = Array.isArray(config.position) ? config.position : [0, 0, 0.1];
  const rotation = Array.isArray(config.rotation) ? config.rotation : [0, 0, 0];
  pivot.position.set(offset[0] || 0, offset[1] || 0, offset[2] || 0);
  pivot.rotation.set(
    THREE.MathUtils.degToRad(rotation[0] || 0),
    THREE.MathUtils.degToRad(rotation[1] || 0),
    THREE.MathUtils.degToRad(rotation[2] || 0),
  );
  pivot.add(normalized);
  anchor.group.add(pivot);

  let mixer = null;
  if (clips.length && config.animate !== false) {
    mixer = new THREE.AnimationMixer(root);
    clips.forEach((clip) => mixer.clipAction(clip).play());
  }

  const entry = {
    root,
    pivot,
    mixer,
    anchor,
    // rotateSpeed se interpreta en grados por segundo.
    spin: Number(config.rotateSpeed) || 0,
  };
  session.models.push(entry);
  return entry;
}

export default function ARCamera() {
  const containerRef = useRef(null);
  const sessionRef = useRef(null);
  const queueRef = useRef(Promise.resolve());
  const mountedRef = useRef(false);

  const [collection, setCollection] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [message, setMessage] = useState(
    "Cargando configuración de imágenes AR...",
  );
  const [error, setError] = useState("");
  const [detected, setDetected] = useState([]);
  const [warnings, setWarnings] = useState([]);

  const busy = phase === "starting" || phase === "stopping";
  const running = phase === "running";

  const updateState = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const cleanupSession = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    sessionRef.current = null;
    session.disposed = true;

    const ar = session.ar;
    ar.renderer.setAnimationLoop(null);

    // MindAR.stop() puede fallar si el arranque no terminó.
    try {
      if (ar.controller && ar.video?.srcObject) {
        await ar.stop();
      } else {
        ar.controller?.stopProcessVideo?.();
      }
    } catch (err) {
      console.warn("No se pudo detener MindAR completamente:", err);
    }

    try {
      ar.controller?.dispose?.();
    } catch (err) {
      console.warn("No se pudo liberar el controlador:", err);
    }

    const stream = ar.video?.srcObject;
    stream?.getTracks?.().forEach((track) => track.stop());
    if (ar.video) {
      ar.video.srcObject = null;
      ar.video.remove();
    }

    session.models.forEach(({ root, mixer, pivot }) => {
      mixer?.stopAllAction();
      if (mixer) mixer.uncacheRoot(root);
      pivot.removeFromParent();
      disposeModel(root);
    });
    session.models.length = 0;

    ar.renderer.dispose();
    ar.renderer.forceContextLoss?.();
    ar.renderer.domElement?.remove();
    ar.cssRenderer?.domElement?.remove();

    updateState(() => {
      setDetected([]);
      setPhase("idle");
      setMessage("Cámara detenida.");
    });
  }, [updateState]);

  // Serializar el inicio y la parada para evitar sesiones simultáneas.
  const enqueue = useCallback((job) => {
    const result = queueRef.current.then(job, job);
    queueRef.current = result.catch(() => {});
    return result;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    async function readConfig() {
      try {
        const response = await fetch(CONFIG_URL, {
          signal: controller.signal,
          cache: "no-cache",
        });
        if (!response.ok)
          throw new Error(`No se encontró ${CONFIG_URL} (${response.status}).`);
        const text = await response.text();
        if (text.trimStart().startsWith("<")) {
          throw new Error(
            `${CONFIG_URL} está devolviendo HTML en lugar de JSON. Revisa public/ar/.`,
          );
        }
        const parsed = validateConfig(JSON.parse(text));
        if (controller.signal.aborted) return;
        setCollection(parsed[0]);
        setError("");
        setMessage(
          `Listo: ${parsed[0].targets.length} imágenes configuradas. Pulsa Iniciar AR.`,
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(`Configuración: ${errorText(err)}`);
          setMessage("No se pudo cargar la configuración.");
        }
      }
    }

    readConfig();
    return () => {
      mountedRef.current = false;
      controller.abort();
      // No interrumpir el start() a mitad de su inicialización.
      void enqueue(cleanupSession);
    };
  }, [cleanupSession, enqueue]);

  async function loadModelWhenFound(session, record) {
    if (record.entry || record.promise || session.disposed) return;

    const { target, anchor } = record;
    updateState(() => setMessage(`Cargando ${target.name || target.model}...`));

    record.promise = (async () => {
      let assetRoot = null;
      try {
        const { loader, type } = createLoader(target.model);
        const result = await loader.loadAsync(target.model);
        assetRoot = type === "gltf" ? result.scene : result;
        const clips = result.animations || [];

        if (session.disposed) {
          disposeModel(assetRoot);
          return;
        }

        record.entry = placeModel(
          anchor,
          { root: assetRoot, clips },
          target,
          session,
        );
        updateState(() =>
          setMessage(`Modelo listo: ${target.name || target.model}`),
        );
      } catch (err) {
        if (assetRoot && !record.entry) disposeModel(assetRoot);
        console.error(`Error cargando ${target.model}:`, err);
        if (!session.disposed) {
          updateState(() => {
            setWarnings((old) => [
              ...old,
              `${target.model}: ${errorText(err)}`,
            ]);
            setMessage(`No se pudo cargar ${target.model}.`);
          });
        }
      } finally {
        record.promise = null;
      }
    })();
  }

  async function runAR(collection) {
    const container = containerRef.current;
    if (!container) return;

    // Vite puede devolver index.html si la ruta del .mind no existe.
    const response = await fetch(collection.mind);
    if (
      !response.ok ||
      (response.headers.get("content-type") || "").includes("text/html")
    ) {
      throw new Error(
        `No se encontró un archivo .mind válido en ${collection.mind}.`,
      );
    }
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength)
      throw new Error(`El archivo ${collection.mind} está vacío.`);

    if (!mountedRef.current) return;
    const ar = new MindARThree({
      container,
      imageTargetSrc: collection.mind,
      maxTrack: Math.max(1, Math.min(4, Number(collection.maxTrack) || 1)),
      uiLoading: "no",
      uiScanning: "no",
      uiError: "no",
      filterMinCF: 0.001,
      filterBeta: 1000,
      warmupTolerance: 5,
      missTolerance: 10,
    });

    const session = {
      ar,
      disposed: false,
      models: [],
      records: new Map(),
      visible: new Set(),
    };
    sessionRef.current = session;
    ar.renderer.setClearColor(0x000000, 0);
    ar.scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(2, 4, 5);
    ar.scene.add(light);

    for (const target of collection.targets) {
      const anchor = ar.addAnchor(target.index);
      const record = { target, anchor, entry: null, promise: null };
      session.records.set(target.index, record);

      anchor.onTargetFound = () => {
        if (session.disposed) return;
        session.visible.add(target.index);
        updateState(() => {
          setDetected([...session.visible]);
          setMessage(`Imagen reconocida: ${target.name || `#${target.index}`}`);
        });
        void loadModelWhenFound(session, record);
      };
      anchor.onTargetLost = () => {
        if (session.disposed) return;
        session.visible.delete(target.index);
        updateState(() => {
          setDetected([...session.visible]);
          if (session.visible.size === 0)
            setMessage("Apunta la cámara hacia una imagen registrada.");
        });
      };
    }

    await ar.start();
    if (session.disposed || !mountedRef.current) return;

    // MindAR expone cuántas imágenes contiene el .mind ya cargado.
    const foundCount = ar.controller?.markerDimensions?.length;
    if (Number.isInteger(foundCount)) {
      const invalid = collection.targets.filter((t) => t.index >= foundCount);
      const assigned = new Set(collection.targets.map((t) => t.index));
      const unassigned = Array.from({ length: foundCount }, (_, i) => i).filter(
        (i) => !assigned.has(i),
      );
      updateState(() => {
        const issues = [];
        if (invalid.length)
          issues.push(
            `Los índices ${invalid.map((t) => t.index).join(", ")} no existen en ${collection.mind} (tiene ${foundCount} imágenes).`,
          );
        if (unassigned.length)
          issues.push(
            `Faltan modelos para los índices ${unassigned.join(", ")} de ${collection.mind}.`,
          );
        setWarnings(issues);
      });
    }

    const clock = new THREE.Clock();
    ar.renderer.setAnimationLoop(() => {
      if (session.disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      for (const entry of session.models) {
        if (entry.anchor.group.visible) {
          entry.mixer?.update(dt);
          if (entry.spin)
            entry.pivot.rotation.y += THREE.MathUtils.degToRad(entry.spin) * dt;
        }
      }
      ar.renderer.render(ar.scene, ar.camera);
    });

    updateState(() => {
      setPhase("running");
      setMessage("Apunta la cámara hacia una imagen registrada.");
    });
  }

  function startAR() {
    if (!collection || phase !== "idle") return;
    if (!window.isSecureContext) {
      setError(
        "La cámara requiere HTTPS o localhost. No funciona en HTTP de una IP local.",
      );
      return;
    }

    setError("");
    setWarnings([]);
    setDetected([]);
    setPhase("starting");
    setMessage("Preparando archivos y solicitando acceso a la cámara...");

    void enqueue(async () => {
      try {
        await runAR(collection);
      } catch (err) {
        console.error("Error iniciando AR:", err);
        await cleanupSession();
        updateState(() => {
          setError(errorText(err));
          setPhase("idle");
          setMessage("No se pudo iniciar AR.");
        });
      }
    });
  }

  function stopAR() {
    if (phase !== "running") return;
    setPhase("stopping");
    setMessage("Deteniendo cámara...");
    void enqueue(cleanupSession);
  }

  return (
    <main className="relative h-[calc(100dvh-76px)] min-h-[360px] w-full min-w-0 overflow-hidden bg-black text-white">
      <div
        ref={containerRef}
        className="absolute inset-0 isolate overflow-hidden"
      />

      <div className="absolute left-2 right-2 top-2 z-40 mx-auto max-h-[min(45dvh,280px)] max-w-xl overflow-y-auto overscroll-contain rounded-xl border border-white/20 bg-[#02112d]/90 p-3 shadow-xl backdrop-blur-md sm:left-3 sm:right-3 sm:top-3 sm:p-4">
        <h1 className="mb-2 text-base font-black uppercase sm:mb-3 sm:text-lg">
          Cámara de realidad aumentada
        </h1>
        {collection && (
          <p className="mb-2 text-sm text-white/75">
            {collection.name} · {collection.targets.length} imágenes
            configuradas
          </p>
        )}
        <p role="status" className="mt-3 text-sm text-white/80">
          {message}
        </p>
        {detected.length > 0 && (
          <p className="mt-1 text-sm font-semibold text-green-300">
            Detectadas:{" "}
            {detected
              .map(
                (i) =>
                  collection?.targets.find((t) => t.index === i)?.name ||
                  `Imagen ${i}`,
              )
              .join(", ")}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-2 rounded-lg bg-red-950/80 p-2 text-sm text-red-200"
          >
            {error}
          </p>
        )}
        {warnings.length > 0 && (
          <div className="mt-2 max-h-25 overflow-y-auto rounded-lg bg-amber-950/80 p-2 text-xs text-amber-100">
            {warnings.map((warning, i) => (
              <p key={`${i}-${warning}`}>{warning}</p>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 sm:bottom-7 sm:w-max sm:max-w-[90%]">
        {!running ? (
          <button
            type="button"
            onClick={startAR}
            disabled={busy || !collection}
            className="w-full rounded-xl bg-green-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {busy
              ? phase === "stopping"
                ? "Deteniendo..."
                : "Iniciando..."
              : "Iniciar AR"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopAR}
            className="w-full rounded-xl bg-red-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-red-500 sm:w-auto"
          >
            Detener AR
          </button>
        )}
      </div>
    </main>
  );
}
