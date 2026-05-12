import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SpeedFX() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05010a, 0.06);

    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Streak particles (long lines flying toward camera)
    const COUNT = 600;
    const positions = new Float32Array(COUNT * 6); // line: 2 points
    const colors = new Float32Array(COUNT * 6);
    const speeds = new Float32Array(COUNT);

    const palette = [
      new THREE.Color(0xff2bd6), // pink
      new THREE.Color(0x00e5ff), // cyan
      new THREE.Color(0x7a5cff), // violet
      new THREE.Color(0x39ff88), // green
    ];

    function reset(i: number, fresh = false) {
      const r = 6 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.6;
      const z = fresh ? -100 + Math.random() * 100 : -90 - Math.random() * 30;
      const len = 1.5 + Math.random() * 5;
      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z - len;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 6 + 0] = c.r; colors[i * 6 + 1] = c.g; colors[i * 6 + 2] = c.b;
      colors[i * 6 + 3] = c.r * 0.1; colors[i * 6 + 4] = c.g * 0.1; colors[i * 6 + 5] = c.b * 0.1;
      speeds[i] = 0.6 + Math.random() * 1.8;
    }
    for (let i = 0; i < COUNT; i++) reset(i, true);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(geom, mat);
    scene.add(lines);


    let mouseX = 0, mouseY = 0;
    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let lastTime = performance.now();
    const pos = geom.getAttribute("position") as THREE.BufferAttribute;

    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      for (let i = 0; i < COUNT; i++) {
        const dz = speeds[i] * dt * 28;
        positions[i * 6 + 2] += dz;
        positions[i * 6 + 5] += dz;
        if (positions[i * 6 + 2] > 6) reset(i);
      }
      pos.needsUpdate = true;


      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      geom.dispose();
      mat.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
