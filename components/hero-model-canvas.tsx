"use client";

import { Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

const variants = {
  core: { primary: "#8d74ff", secondary: "#70f8ff", accent: "#ff82cf" },
  matrix: { primary: "#72ffd2", secondary: "#70f8ff", accent: "#8d74ff" },
  focus: { primary: "#ffb86b", secondary: "#72ffd2", accent: "#8d74ff" },
  admin: { primary: "#ff82cf", secondary: "#8d74ff", accent: "#70f8ff" },
  premium: { primary: "#ffe07a", secondary: "#ff82cf", accent: "#70f8ff" },
  brand: { primary: "#70f8ff", secondary: "#8d74ff", accent: "#ffe07a" },
};

type VariantName = keyof typeof variants;
type Quality = "high" | "medium" | "lite";

function ModelCluster({ variant, quality }: { variant: VariantName; quality: Quality }) {
  const palette = variants[variant];
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current || !coreRef.current || !shellRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.16;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, state.pointer.y * 0.25, 0.05);
    coreRef.current.rotation.x += delta * 0.18;
    shellRef.current.rotation.z -= delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.75} floatIntensity={0.85}>
        <mesh ref={coreRef}>
          <torusKnotGeometry args={[1.05, 0.24, quality === "high" ? 160 : 100, 24]} />
          <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.85} roughness={0.22} metalness={0.9} clearcoat={1} />
        </mesh>
      </Float>
      <mesh ref={shellRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[1.6, 2.3, 80]} />
        <meshBasicMaterial color={palette.secondary} transparent opacity={0.36} side={THREE.DoubleSide} />
      </mesh>
      {variant === "brand" ? (
        <mesh position={[0, 0, 0.32]}>
          <torusGeometry args={[0.62, 0.08, 20, 90]} />
          <meshBasicMaterial color="#ffe07a" transparent opacity={0.44} />
        </mesh>
      ) : null}
      <Float speed={1.35} rotationIntensity={0.6} floatIntensity={0.95}>
        <mesh position={[1.8, 0.8, -0.6]} scale={0.38}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.52} metalness={0.62} roughness={0.26} />
        </mesh>
      </Float>
      {quality !== "lite" ? (
        <Float speed={1.55} rotationIntensity={0.8} floatIntensity={1.1}>
          <mesh position={[-1.62, -0.95, 0.4]} scale={0.32}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={palette.secondary} emissive={palette.secondary} emissiveIntensity={0.48} metalness={0.55} roughness={0.18} />
          </mesh>
        </Float>
      ) : null}
    </group>
  );
}

export function HeroModelCanvas({ variant, quality }: { variant: VariantName; quality: Quality }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, quality === "high" ? 1.6 : 1.2]}>
      <ambientLight intensity={1} />
      <directionalLight position={[4, 3, 4]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-4, -3, 3]} intensity={1.25} color={variants[variant].secondary} />
      <ModelCluster variant={variant} quality={quality} />
    </Canvas>
  );
}
