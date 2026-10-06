import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useGLTF, useAnimations, Bounds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export function Model(props, ref) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF("/baile.glb");
  const { actions } = useAnimations(animations, group);
  const { index, setIndex } = useState(-1);

  useEffect(() => {
    index == 0
      ? actions[index].reset().fadeIn(0.5).play()
      : actions[index].stop();
    return () => actions[index].fadeOut(0.5);
  }, [index, actions]);

  return (
    <group ref={[group, ref]} {...props} dispose={null}>
      <group name="Scene">
        <group
          name="Armature"
          position={[-0.044, 2.39, -0.062]}
          rotation={[3.094, 0.193, 3.102]}
        >
          <group name="batter">
            <skinnedMesh
              name="Cube002"
              geometry={nodes.Cube002.geometry}
              material={materials.BATTER_TEXTURE}
              skeleton={nodes.Cube002.skeleton}
              onClick={() => setIndex(0)}
            />
            <skinnedMesh
              name="Cube002_1"
              geometry={nodes.Cube002_1.geometry}
              material={materials.gorra}
              skeleton={nodes.Cube002_1.skeleton}
            />
          </group>
          <primitive object={nodes.Back1} />
          <primitive object={nodes.Back2} />
          <primitive object={nodes.Hip_L} />
          <primitive object={nodes.Hip_R} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/baile.glb");
