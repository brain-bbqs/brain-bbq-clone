import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A full low-poly bunny built from primitives: body, head, two long ears,
// four feet, and a fluffy tail. Faces the +X direction.
export function Bunny3D({ color = "#ffffff" }: { color?: string }) {
  const earL = useRef<THREE.Mesh>(null!);
  const earR = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    // Gentle ear wiggle as the bunny moves
    const t = clock.getElapsedTime() * 6;
    if (earL.current) earL.current.rotation.z = 0.15 + Math.sin(t) * 0.08;
    if (earR.current) earR.current.rotation.z = -0.15 - Math.sin(t) * 0.08;
  });
  return (
    <group scale={0.9}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0.55, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Ears */}
      <mesh ref={earL} position={[0.55, 0.75, 0.12]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh ref={earR} position={[0.55, 0.75, -0.12]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Inner ear pink */}
      <mesh position={[0.58, 0.78, 0.13]}>
        <capsuleGeometry args={[0.035, 0.32, 4, 8]} />
        <meshStandardMaterial color="#ff9ec4" roughness={0.8} />
      </mesh>
      <mesh position={[0.58, 0.78, -0.13]}>
        <capsuleGeometry args={[0.035, 0.32, 4, 8]} />
        <meshStandardMaterial color="#ff9ec4" roughness={0.8} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.82, 0.42, 0.18]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.82, 0.42, -0.18]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Nose */}
      <mesh position={[0.88, 0.28, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ff7aa8" />
      </mesh>
      {/* Front feet */}
      <mesh position={[0.35, -0.5, 0.22]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.35, -0.5, -0.22]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back feet (longer) */}
      <mesh position={[-0.3, -0.45, 0.28]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.13, 0.18, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-0.3, -0.45, -0.28]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.13, 0.18, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Fluffy tail */}
      <mesh position={[-0.55, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#fff5f5" roughness={1} />
      </mesh>
    </group>
  );
}