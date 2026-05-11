import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField({ count = 1000, color = "#f43f5e" }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = (Math.random() - 0.5) * 50;
      p[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function Grid() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.z = (state.clock.getElapsedTime() * 2) % 2;
    }
  });

  return (
    <group ref={ref}>
      <gridHelper args={[100, 50, "#33000a", "#00222a"]} rotation={[Math.PI / 2, 0, 0]} position={[0, -5, 0]} />
      <gridHelper args={[100, 50, "#33000a", "#00222a"]} rotation={[Math.PI / 2, 0, 0]} position={[0, -5, -100]} />
    </group>
  );
}

export default function NeuralBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-[#050510]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={75} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#f43f5e" intensity={2} />
        <pointLight position={[-10, -10, -10]} color="#06b6d4" intensity={2} />
        
        <ParticleField count={1500} color="#f43f5e" />
        <ParticleField count={1000} color="#06b6d4" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Grid />
        </Float>
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <fog attach="fog" args={["#050510", 5, 25]} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/40 via-transparent to-[#050510]" />
    </div>
  );
}
