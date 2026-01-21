import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// Perfectly looping road segments
function InfiniteRoad() {
  const roadGroupRef = useRef();
  const SEGMENT_LENGTH = 30;
  const NUM_SEGMENTS = 4;
  const ROAD_SPEED = 0.4;

  useFrame(() => {
    if (roadGroupRef.current) {
      roadGroupRef.current.children.forEach((segment) => {
        segment.position.z += ROAD_SPEED;
        
        // Seamless teleport when segment passes camera
        if (segment.position.z > 15) {
          segment.position.z -= SEGMENT_LENGTH * NUM_SEGMENTS;
        }
      });
    }
  });

  return (
    <group ref={roadGroupRef}>
      {[...Array(NUM_SEGMENTS)].map((_, segmentIndex) => (
        <group key={segmentIndex} position={[0, 0, -segmentIndex * SEGMENT_LENGTH]}>
          
          {/* Main road surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
            <planeGeometry args={[10, SEGMENT_LENGTH]} />
            <meshStandardMaterial color="#0a0a12" roughness={0.95} />
          </mesh>

          {/* Center dashed lines (yellow) */}
          {[...Array(6)].map((_, i) => (
            <mesh 
              key={`dash-${i}`}
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, -2.49, -SEGMENT_LENGTH/2 + i * 5]}
            >
              <planeGeometry args={[0.25, 3]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          ))}

          {/* Left white line */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, -2.49, 0]}>
            <planeGeometry args={[0.15, SEGMENT_LENGTH]} />
            <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
          </mesh>

          {/* Right white line */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -2.49, 0]}>
            <planeGeometry args={[0.15, SEGMENT_LENGTH]} />
            <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
          </mesh>

          {/* Left edge glow (cyan) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, -2.48, 0]}>
            <planeGeometry args={[0.1, SEGMENT_LENGTH]} />
            <meshBasicMaterial color="#00d4ff" opacity={0.4} transparent />
          </mesh>

          {/* Right edge glow (pink) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, -2.48, 0]}>
            <planeGeometry args={[0.1, SEGMENT_LENGTH]} />
            <meshBasicMaterial color="#ff006e" opacity={0.4} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Moving starfield
function MovingStars() {
  const starsRef = useRef();
  const STAR_SPEED = 0.15;

  useFrame(() => {
    if (starsRef.current) {
      const positions = starsRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < 1000; i++) {
        positions[i * 3 + 2] += STAR_SPEED;
        
        // Loop stars back
        if (positions[i * 3 + 2] > 20) {
          positions[i * 3 + 2] = -100;
        }
      }
      
      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const starPositions = React.useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 40 + 5;
      positions[i * 3 + 2] = -Math.random() * 120;
    }
    return positions;
  }, []);

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.1} 
        color="#ffffff" 
        transparent 
        opacity={0.7} 
        sizeAttenuation 
      />
    </points>
  );
}

// Speed particles
function SpeedParticles() {
  const particlesRef = useRef();
  const ROAD_SPEED = 0.4;

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < 60; i++) {
        positions[i * 3 + 2] += ROAD_SPEED * 2.5;
        
        if (positions[i * 3 + 2] > 10) {
          positions[i * 3 + 2] = -70;
          positions[i * 3] = (Math.random() - 0.5) * 20;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const particles = React.useMemo(() => {
    const positions = new Float32Array(60 * 3);
    const colors = new Float32Array(60 * 3);
    
    for (let i = 0; i < 60; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = -Math.random() * 70;
      
      // Alternate between cyan and pink
      const color = i % 2 === 0 ? [0, 0.83, 1] : [1, 0, 0.43];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }
    return { positions, colors };
  }, []);

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={60}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={60}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors
        transparent 
        opacity={0.6} 
        sizeAttenuation 
      />
    </points>
  );
}

export default function SynthwaveBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      background: 'linear-gradient(180deg, #0a0a15 0%, #060610 70%, #000000 100%)',
    }}>
      <Canvas 
        camera={{ 
          position: [0, 2, 8], 
          fov: 65,
          near: 0.1,
          far: 1000
        }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[0, 10, 5]} intensity={0.4} color="#ffffff" />
        
        <InfiniteRoad />
        <MovingStars />
        <SpeedParticles />
        
        <fog attach="fog" args={['#000000', 40, 90]} />
      </Canvas>
    </div>
  );
}