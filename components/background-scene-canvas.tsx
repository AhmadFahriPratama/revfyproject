"use client";

import { Float, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

type Quality = "high" | "medium" | "lite";

const orbitalNodes = [
  { position: [3.2, 1.3, -0.8], scale: 0.36, color: "#70f8ff" },
  { position: [-3.2, -1.1, 0.6], scale: 0.44, color: "#8d74ff" },
  { position: [1.9, -2, -1.2], scale: 0.28, color: "#ff82cf" },
  { position: [-1.8, 2.1, 0.2], scale: 0.38, color: "#72ffd2" },
  { position: [0.2, 2.8, -0.4], scale: 0.22, color: "#ffe07a" },
];

function BrandMonolith() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, state.pointer.y * 0.16, 0.05);
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh>
          <boxGeometry args={[1.65, 2.15, 0.3]} />
          <meshPhysicalMaterial color="#0e1430" emissive="#15215a" emissiveIntensity={0.65} roughness={0.18} metalness={0.82} clearcoat={1} />
        </mesh>
      </Float>
      <mesh position={[0, 0, 0.18]}>
        <planeGeometry args={[1.16, 1.16]} />
        <meshBasicMaterial color="#76f8ff" transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <ringGeometry args={[0.26, 0.5, 48]} />
        <meshBasicMaterial color="#ffe07a" transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
        <torusGeometry args={[2.65, 0.03, 16, 120]} />
        <meshBasicMaterial color="#70f8ff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function AmbientField({ quality }: { quality: Quality }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -state.pointer.x * 0.08, 0.04);
    groupRef.current.rotation.x += delta * 0.02;
  });

  return (
    <group ref={groupRef}>
      {orbitalNodes.slice(0, quality === "high" ? orbitalNodes.length : quality === "medium" ? 4 : 3).map((node, index) => (
        <Float key={`${node.color}-${index}`} speed={1.1 + index * 0.15} rotationIntensity={0.85} floatIntensity={1.1}>
          <mesh position={node.position as [number, number, number]} scale={node.scale}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.55} metalness={0.62} roughness={0.22} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export function BackgroundSceneCanvas({ quality }: { quality: Quality }) {
  const starCount = quality === "high" ? 1600 : quality === "medium" ? 900 : 380;
  const sparkleCount = quality === "high" ? 48 : quality === "medium" ? 28 : 12;

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 52 }} dpr={[1, quality === "high" ? 1.5 : 1.2]}>
      <color attach="background" args={["#04030b"]} />
      <fog attach="fog" args={["#04030b", 8, 18]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 4, 3]} intensity={1.8} color="#9a8dff" />
      <pointLight position={[-4, -3, 2]} intensity={1.3} color="#70f8ff" />
      <pointLight position={[5, 2, -2]} intensity={1.15} color="#ff82cf" />
      <Stars radius={80} depth={40} count={starCount} factor={3.4} fade speed={0.9} />
      <Sparkles count={sparkleCount} size={4.2} scale={[11, 7, 4]} speed={0.18} color="#b8b6ff" />
      <BrandMonolith />
      <AmbientField quality={quality} />
    </Canvas>
  );
}
