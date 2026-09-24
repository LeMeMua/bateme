import { useEffect, useRef, useState } from "react";

import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

// =====================================================
// CONFIGURACIÓN
// =====================================================

const TARGET_PATH = "/ar/metos.mind";

/*
  EJEMPLO:

  Si tienes:

  public/
    models/
      mets/
        estadio.glb

  entonces sería:

  const MODEL_PATH = "/models/mets/estadio.glb";
*/

const MODEL_PATH = "/glb/baile.glb";

// Tamaño aproximado del modelo respecto al target
const MODEL_SIZE = 0.7;

// Qué tanto sale del plano del target
const MODEL_Z = 0.15;

export default function ARCamera() {
  const containerRef = useRef(null);
  const mindarRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // PREPARAR UNA COPIA DEL MODELO
  // =====================================================

  function createModel(originalScene) {
    /*
      SkeletonUtils.clone funciona mejor que clone(true)
      si el GLB tiene bones, rig o animaciones.
    */

    const model = SkeletonUtils.clone(originalScene);

    // ===================================================
    // CONSERVAR MATERIALES ORIGINALES
    // ===================================================

    model.traverse((child) => {
      child.visible = true;

      if (!child.isMesh) {
        return;
      }

      child.frustumCulled = false;

      /*
        NO creamos MeshNormalMaterial.

        Conservamos los materiales originales
        cargados desde el GLB.

        Los clonamos para que cada instancia
        tenga sus propios materiales.
      */

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) => {
          const clonedMaterial = material.clone();

          /*
              Esto ayuda si algunas caras del
              modelo tienen normales/orientación
              problemática.
            */

          clonedMaterial.side = THREE.DoubleSide;

          clonedMaterial.needsUpdate = true;

          return clonedMaterial;
        });
      } else if (child.material) {
        child.material = child.material.clone();

        child.material.side = THREE.DoubleSide;

        child.material.needsUpdate = true;
      }
    });

    // ===================================================
    // CALCULAR TAMAÑO Y CENTRO
    // ===================================================

    const box = new THREE.Box3().setFromObject(model);

    const size = new THREE.Vector3();

    box.getSize(size);

    const center = new THREE.Vector3();

    box.getCenter(center);

    console.log("Tamaño del modelo:", size);

    console.log("Centro del modelo:", center);

    // ===================================================
    // CENTRAR MODELO
    // ===================================================

    model.position.set(-center.x, -center.y, -center.z);

    // ===================================================
    // ESCALA AUTOMÁTICA
    // ===================================================

    const maxDimension = Math.max(size.x, size.y, size.z);

    if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
      throw new Error("El modelo GLB tiene dimensiones inválidas.");
    }

    const normalizedScale = MODEL_SIZE / maxDimension;

    console.log("Escala calculada:", normalizedScale);

    // ===================================================
    // WRAPPER
    // ===================================================

    /*
      Este Group es el que vamos a:

      - mover
      - escalar
      - girar

      Dejamos el GLB interno centrado.
    */

    const wrapper = new THREE.Group();

    wrapper.add(model);

    wrapper.scale.setScalar(normalizedScale);

    wrapper.position.set(0, 0, MODEL_Z);

    return wrapper;
  }

  // =====================================================
  // INICIAR AR
  // =====================================================

  async function startAR() {
    if (running || loading) {
      return;
    }

    setLoading(true);

    try {
      // =================================================
      // 1. CREAR MINDAR
      // =================================================

      const mindarThree = new MindARThree({
        container: containerRef.current,

        imageTargetSrc: TARGET_PATH,

        /*
            El .mind tiene 3 imágenes posibles.

            maxTrack: 1 significa que solamente
            rastreamos una simultáneamente.
          */

        maxTrack: 1,
      });

      mindarRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;

      // =================================================
      // 2. CONFIGURACIÓN DEL RENDERER
      // =================================================

      /*
        Fondo transparente para que se vea
        el video de la cámara detrás.
      */

      renderer.setClearColor(0x000000, 0);

      /*
        Manejo de color moderno de Three.js.
      */

      renderer.outputColorSpace = THREE.SRGBColorSpace;

      /*
        Ayuda con materiales PBR del GLB.
      */

      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      renderer.toneMappingExposure = 1;

      // =================================================
      // 3. ANCHORS
      // =================================================

      const anchor0 = mindarThree.addAnchor(0);

      const anchor1 = mindarThree.addAnchor(1);

      const anchor2 = mindarThree.addAnchor(2);

      // =================================================
      // 4. ILUMINACIÓN
      // =================================================

      /*
        Los MeshStandardMaterial y otros materiales
        PBR necesitan iluminación.
      */

      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);

      scene.add(hemisphereLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);

      directionalLight.position.set(1, 2, 2);

      scene.add(directionalLight);

      // =================================================
      // 5. CARGAR GLB
      // =================================================

      const loader = new GLTFLoader();

      console.log("Intentando cargar modelo:", MODEL_PATH);

      const gltf = await loader.loadAsync(MODEL_PATH);

      console.log("GLB CARGADO CORRECTAMENTE:", gltf);

      console.log("Animaciones:", gltf.animations);

      // =================================================
      // 6. CREAR UNA INSTANCIA POR TARGET
      // =================================================

      const model0 = createModel(gltf.scene);

      const model1 = createModel(gltf.scene);

      const model2 = createModel(gltf.scene);

      // =================================================
      // 7. AGREGARLOS A LOS ANCHORS
      // =================================================

      anchor0.group.add(model0);

      anchor1.group.add(model1);

      anchor2.group.add(model2);

      // =================================================
      // 8. DEBUG DE DETECCIÓN
      // =================================================

      anchor0.onTargetFound = () => {
        console.log("TARGET 0 DETECTADO");
      };

      anchor0.onTargetLost = () => {
        console.log("TARGET 0 PERDIDO");
      };

      anchor1.onTargetFound = () => {
        console.log("TARGET 1 DETECTADO");
      };

      anchor1.onTargetLost = () => {
        console.log("TARGET 1 PERDIDO");
      };

      anchor2.onTargetFound = () => {
        console.log("TARGET 2 DETECTADO");
      };

      anchor2.onTargetLost = () => {
        console.log("TARGET 2 PERDIDO");
      };

      // =================================================
      // 9. INICIAR MINDAR
      // =================================================

      await mindarThree.start();

      console.log("MindAR iniciado correctamente");

      // =================================================
      // 10. VIDEO COMO FONDO
      // =================================================

      const video = mindarThree.video;

      if (video) {
        video.style.position = "absolute";

        video.style.top = "0";

        video.style.left = "0";

        video.style.width = "100%";

        video.style.height = "100%";

        video.style.objectFit = "cover";

        video.style.zIndex = "0";
      }

      // =================================================
      // 11. THREE.JS SOBRE LA CÁMARA
      // =================================================

      const canvas = renderer.domElement;

      canvas.style.position = "absolute";

      canvas.style.top = "0";

      canvas.style.left = "0";

      canvas.style.width = "100%";

      canvas.style.height = "100%";

      canvas.style.zIndex = "1";

      canvas.style.pointerEvents = "none";

      // =================================================
      // 12. ANIMACIÓN
      // =================================================

      renderer.setAnimationLoop(() => {
        /*
            Giramos los wrappers completos.
          */

        model0.rotation.y += 0.01;

        model1.rotation.y += 0.01;

        model2.rotation.y += 0.01;

        renderer.render(scene, camera);
      });

      setRunning(true);
    } catch (error) {
      console.error("ERROR INICIANDO AR:", error);

      setRunning(false);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // DETENER AR
  // =====================================================

  function stopAR() {
    const mindarThree = mindarRef.current;

    if (!mindarThree) {
      return;
    }

    try {
      // =================================================
      // PARAR THREE.JS
      // =================================================

      mindarThree.renderer.setAnimationLoop(null);

      // =================================================
      // DETENER TRACKS DE LA CÁMARA
      // =================================================

      const video = mindarThree.video;

      if (video?.srcObject) {
        video.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // =================================================
      // DETENER MINDAR
      // =================================================

      mindarThree.stop();

      // =================================================
      // LIBERAR RENDERER
      // =================================================

      mindarThree.renderer.dispose();

      // =================================================
      // LIMPIAR CONTENEDOR
      // =================================================

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      mindarRef.current = null;

      setRunning(false);

      console.log("CÁMARA DETENIDA");
    } catch (error) {
      console.error("ERROR DETENIENDO AR:", error);
    }
  }

  // =====================================================
  // CLEANUP AL SALIR DE LA PÁGINA
  // =====================================================

  useEffect(() => {
    return () => {
      const mindarThree = mindarRef.current;

      if (!mindarThree) {
        return;
      }

      try {
        mindarThree.renderer.setAnimationLoop(null);

        const video = mindarThree.video;

        if (video?.srcObject) {
          video.srcObject.getTracks().forEach((track) => {
            track.stop();
          });
        }

        mindarThree.stop();

        mindarThree.renderer.dispose();
      } catch (error) {
        console.error("ERROR LIMPIANDO AR:", error);
      }

      mindarRef.current = null;
    };
  }, []);

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <main
      className="
        relative
        h-[calc(100dvh-68px)]
        w-full
        overflow-hidden
        bg-black
      "
    >
      {/* ==========================================
          CÁMARA + THREE.JS
          ========================================== */}

      <div
        ref={containerRef}
        className="
          absolute
          inset-0

          h-full
          w-full

          overflow-hidden
        "
      />

      {/* ==========================================
          INTERFAZ SUPERPUESTA
          ========================================== */}

      <div
        className="
          pointer-events-none

          absolute
          inset-0
          z-20

          flex
          flex-col
          justify-between

          p-5
          pb-8
        "
      >
        {/* PARTE SUPERIOR */}

        <div>
          <h1
            className="
              text-3xl
              font-black
              italic
              text-white

              drop-shadow-lg
            "
          >
            MLB AR
          </h1>

          <p
            className="
              mt-2

              font-semibold
              text-white

              drop-shadow-lg
            "
          >
            Apunta la cámara hacia un logo de los Mets
          </p>
        </div>

        {/* BOTONES */}

        <div
          className="
            pointer-events-auto

            flex
            justify-center
            gap-4
          "
        >
          {!running && (
            <button
              type="button"
              onClick={startAR}
              disabled={loading}
              className="
                rounded-xl

                bg-redlight

                px-8
                py-4

                text-lg
                font-bold
                text-white

                shadow-xl

                disabled:opacity-50
              "
            >
              {loading ? "Cargando modelo..." : "Iniciar cámara"}
            </button>
          )}

          {running && (
            <button
              type="button"
              onClick={stopAR}
              className="
                rounded-xl

                bg-white

                px-8
                py-4

                text-lg
                font-bold
                text-bglight

                shadow-xl
              "
            >
              Detener cámara
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
