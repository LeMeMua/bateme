import { useEffect, useRef } from "react";

import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

import * as THREE from "three";

const TARGET_PATH = "/ar/metos.mind";

export default function MindAR() {
  const containerRef = useRef(null);
  let currentAnchor = null;
  let index = null;
  let anchors = [];

  let tracking = false;
  let first = true;

  const targetPosition = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  const targetScale = new THREE.Vector3();

  useEffect(() => {
    let disposed = false;
    let model = null;

    const container = containerRef.current;

    container.innerHTML = "";

    const mindarThree = new MindARThree({
      container: containerRef.current,
      imageTargetSrc: TARGET_PATH,
      maxTrack: 1,

      filterMinCF: 0.001,
      filterBeta: 1000,

      warmupTolerance: 5,
      missTolerance: 10,
    });

    const { renderer, scene, camera } = mindarThree;

    for (let i = 0; i < 3; i++) {
      anchors.push(mindarThree.addAnchor(i));
    }

    const displayGroup = new THREE.Group();
    displayGroup.visible = false;
    scene.add(displayGroup);

    const loader = new GLTFLoader();

    async function loadModel() {
      const gltf = await loader.loadAsync("/glb/baile.glb");

      if (disposed) return;

      model = gltf.scene;

      model.scale.set(0.7, 0.7, 0.7);
      model.position.set(0, 0, 0.15);

      displayGroup.add(model);
    }

    for (let i = 0; i < 3; i++) {
      anchors[i].onTargetFound = () => {
        currentAnchor = anchors[i];
        tracking = true;

        currentAnchor.group.matrix.decompose(
          targetPosition,
          targetQuaternion,
          targetScale,
        );

        if (first) {
          displayGroup.position.copy(targetPosition);
          displayGroup.rotation.copy(targetQuaternion);
          displayGroup.scale.copy(targetScale);

          first = false;
        }
      };
    }

    for (let i = 0; i < 3; i++) {
      anchors[i].onTargetLost = () => {
        currentAnchor = anchors[i];
        tracking = false;
      };
    }

    async function startAR() {
      try {
        await mindarThree.start();

        if (disposed) {
          if (mindarThree.controller) {
            await mindarThree.stop();
          }

          return;
        }

        await loadModel();

        if (disposed) return;

        renderer.setAnimationLoop(() => {
          if (tracking && currentAnchor) {
            currentAnchor.group.matrix.decompose(
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
      } catch (error) {
        if (!disposed) {
          console.error("Error iniciando MindAR:", error);
        }
      }
    }
    const timeout = setTimeout(() => {
      if (!disposed) {
        startAR();
      }
    }, 0);

    return () => {
      disposed = true;

      clearTimeout(timeout);

      renderer.setAnimationLoop(null);

      if (mindarThree.controller) {
        mindarThree.stop();
      }

      renderer.dispose();

      if (renderer.domElement) {
        renderer.domElement.remove();
      }

      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      id="container"
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden"
    />
  );
}
