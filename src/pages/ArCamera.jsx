import { useEffect, useRef, useState } from "react";

import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

const TARGET_PATH = "/ar/metos.mind";

export default function MindAR() {
  const containerRef = useRef(null);
  const sessionRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session) {
        session.disposed = true;
        session.cleanup();
        sessionRef.current = null;
      }
    };
  }, []);

  async function startAR() {
    if (sessionRef.current) return;

    setLoading(true);

    const container = containerRef.current;
    const anchors = [];

    let currentAnchor = null;
    let tracking = false;
    let first = true;
    let model = null;

    const targetPosition = new THREE.Vector3();
    const targetQuaternion = new THREE.Quaternion();
    const targetScale = new THREE.Vector3();

    const mindarThree = new MindARThree({
      container,
      imageTargetSrc: TARGET_PATH,
      maxTrack: 1,

      filterMinCF: 0.001,
      filterBeta: 1000,

      warmupTolerance: 5,
      missTolerance: 10,
    });

    const { renderer, scene, camera } = mindarThree;

    const session = {
      disposed: false,
      cleanupPromise: null,
      cleanup: null,
    };

    sessionRef.current = session;

    for (let i = 0; i < 3; i++) {
      anchors.push(mindarThree.addAnchor(i));
    }

    const displayGroup = new THREE.Group();
    displayGroup.visible = false;
    scene.add(displayGroup);

    const loader = new GLTFLoader();

    session.cleanup = () => {
      if (session.cleanupPromise) {
        return session.cleanupPromise;
      }

      session.disposed = true;

      session.cleanupPromise = (async () => {
        renderer.setAnimationLoop(null);

        try {
          await mindarThree.stop();
        } catch (error) {
          console.error("Error deteniendo AR:", error);
        }

        if (model) {
          model.traverse((object) => {
            if (object.geometry) {
              object.geometry.dispose();
            }

            const materials = object.material ? [].concat(object.material) : [];

            materials.forEach((material) => {
              material.dispose();
            });
          });
        }

        scene.remove(displayGroup);
        renderer.dispose();

        renderer.domElement?.remove();

        if (sessionRef.current === session) {
          sessionRef.current = null;
        }
        removeMindARUI();

        setRunning(false);
        setLoading(false);
      })();

      return session.cleanupPromise;
    };

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];

      anchor.onTargetFound = () => {
        if (session.disposed) return;

        currentAnchor = anchor;
        tracking = true;

        anchor.group.updateWorldMatrix(true, false);

        anchor.group.matrixWorld.decompose(
          targetPosition,
          targetQuaternion,
          targetScale,
        );

        if (first) {
          displayGroup.position.copy(targetPosition);
          displayGroup.quaternion.copy(targetQuaternion);
          displayGroup.scale.copy(targetScale);

          first = false;
        }

        displayGroup.visible = true;
      };

      anchor.onTargetLost = () => {
        if (currentAnchor === anchor) {
          tracking = false;
        }
      };
    }

    try {
      await mindarThree.start();

      if (session.disposed) return;

      const gltf = await loader.loadAsync("/glb/baile.glb");

      if (session.disposed) {
        gltf.scene.traverse((object) => {
          object.geometry?.dispose();
        });
        return;
      }

      model = gltf.scene;

      model.scale.set(0.7, 0.7, 0.7);
      model.position.set(0, 0, 0.15);

      displayGroup.add(model);

      renderer.setAnimationLoop(() => {
        if (session.disposed) return;

        if (tracking && currentAnchor) {
          currentAnchor.group.updateWorldMatrix(true, false);

          currentAnchor.group.matrixWorld.decompose(
            targetPosition,
            targetQuaternion,
            targetScale,
          );

          displayGroup.position.lerp(targetPosition, 0.1);

          displayGroup.quaternion.slerp(targetQuaternion, 0.1);

          displayGroup.scale.lerp(targetScale, 0.1);
        }

        if (model) {
          model.rotation.y += 0.01;
        }

        renderer.render(scene, camera);
      });

      setRunning(true);
      setLoading(false);
    } catch (error) {
      if (!session.disposed) {
        console.error("Error iniciando MindAR:", error);
        await session.cleanup();
      }
    }
  }

  async function stopAR() {
    const session = sessionRef.current;

    if (!session) return;

    setLoading(true);

    await session.cleanup();
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute z-50 bottom-10 left-1/2 -translate-x-1/2">
        {!running ? (
          <button
            onClick={startAR}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Iniciando..." : "Iniciar AR"}
          </button>
        ) : (
          <button
            onClick={stopAR}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Deteniendo..." : "Detener AR"}
          </button>
        )}
      </div>
    </div>
  );
}

function removeMindARUI() {
  document
    .querySelectorAll(
      ".mindar-ui-scanning, .mindar-ui-loading, .mindar-ui-error",
    )
    .forEach((element) => {
      element.remove();
    });
}
