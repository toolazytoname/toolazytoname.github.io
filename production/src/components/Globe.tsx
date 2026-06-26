/**
 * Globe — a 3D Earth with 4 memory dots.
 *
 * Features:
 *   • Drag to spin, auto-rotate when idle.
 *   • 4 `.earth-photo` DOM elements that follow each dot's projected 2D position.
 *   • Click dot → opens lightbox via the `onSelect(id)` callback.
 *   • CSS-gradient fallback when WebGL is unavailable (no white screen).
 *
 * Memory positions are converted to 3D cartesian once on mount, then re-projected
 * to screen every frame. Photos track the dot at all times.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Memory } from '@data/memories';

type Props = {
  memories: Memory[];
  onSelect?: (id: string) => void;
};

export default function Globe({ memories, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const photoRefs = useRef<Record<string, HTMLElement | null>>({});
  const [ready, setReady] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const onSelectRef = useRef<(id: string) => void>(onSelect);
  onSelectRef.current = onSelect;

  // Always emit a global event so Astro pages can hook in without prop-drilling.
  const handleSelect = useRef((id: string) => {
    onSelectRef.current?.(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memory:select', { detail: id }));
    }
  }).current;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Feature-detect WebGL. If missing → render the static SVG fallback only.
    const test = document.createElement('canvas');
    const gl =
      test.getContext('webgl2') ||
      test.getContext('webgl') ||
      test.getContext('experimental-webgl');
    if (!gl) {
      setWebglOk(false);
      setReady(true);
      return;
    }

    let width = container.clientWidth;
    let height = container.clientHeight;
    if (width === 0 || height === 0) {
      width = 600;
      height = 600;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Earth sphere — wireframe over a dark ink base. No textures (avoids
    // loading external assets; looks editorial).
    const earthGeo = new THREE.SphereGeometry(1, 48, 48);
    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x1d1d1f,
      transparent: true,
      opacity: 0.92,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Latitude / longitude wireframe overlay.
    const wireGeo = new THREE.SphereGeometry(1.005, 24, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xc96442,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    // Equator + tropics + meridian ring — accent line.
    const ringGeo = new THREE.RingGeometry(1.01, 1.012, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd97757,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const equator = new THREE.Mesh(ringGeo, ringMat);
    equator.rotation.x = Math.PI / 2;
    scene.add(equator);

    // Convert lat/lon → cartesian and place dot meshes.
    const dotGroup = new THREE.Group();
    scene.add(dotGroup);

    type DotData = {
      mesh: THREE.Mesh;
      halo: THREE.Mesh;
      pos: THREE.Vector3;
      memory: Memory;
    };
    const dots: DotData[] = [];

    memories.forEach((m) => {
      const phi = (90 - m.lat) * (Math.PI / 180);
      const theta = (m.lon + 180) * (Math.PI / 180);
      const x = -(1.001) * Math.sin(phi) * Math.cos(theta);
      const z = (1.001) * Math.sin(phi) * Math.sin(theta);
      const y = (1.001) * Math.cos(phi);

      const dotGeo = new THREE.SphereGeometry(0.028, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(m.color) });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.set(x, y, z);

      const haloGeo = new THREE.SphereGeometry(0.055, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(m.color),
        transparent: true,
        opacity: 0.25,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(x, y, z);

      dotGroup.add(dotMesh);
      dotGroup.add(halo);
      dots.push({ mesh: dotMesh, halo, pos: dotMesh.position.clone(), memory: m });
    });

    // Lighting (basic material is unlit, but we keep ambient for any future PBR).
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // Pointer state for drag-to-spin.
    let dragging = false;
    let lastX = 0,
      lastY = 0;
    let velY = 0.0008; // auto-rotate speed
    let velX = 0;
    let userInteracting = false;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      userInteracting = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      velY = dx * 0.005;
      velX = dy * 0.005;
      earth.rotation.y += velY;
      earth.rotation.x += velX;
      dotGroup.rotation.copy(earth.rotation);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      // resume auto after a beat
      setTimeout(() => {
        userInteracting = false;
      }, 1500);
    };
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    // Click detection on dots via raycaster.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handleClick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const meshes = dots.map((d) => d.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const hit = hits[0];
        if (!hit) return;
        const found = dots.find((d) => d.mesh === hit.object);
        if (found) handleSelect(found.memory.id);
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    // Resize observer.
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    // Render loop.
    let frameId = 0;
    const project = new THREE.Vector3();
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      if (!userInteracting && !dragging) {
        earth.rotation.y += velY;
        dotGroup.rotation.copy(earth.rotation);
        velY = 0.0008 + Math.sin(t * 0.5) * 0.0002;
      }

      // Pulse halos.
      dots.forEach((d, i) => {
        const pulse = 1 + Math.sin(t * 1.6 + i) * 0.18;
        d.halo.scale.setScalar(pulse);
        (d.halo.material as THREE.MeshBasicMaterial).opacity =
          0.18 + Math.sin(t * 1.6 + i) * 0.08;
      });

      // Project each dot to 2D, then position the corresponding .earth-photo.
      const rect = renderer.domElement.getBoundingClientRect();
      dots.forEach((d) => {
        project.copy(d.mesh.getWorldPosition(new THREE.Vector3()));
        project.project(camera);
        const x = (project.x * 0.5 + 0.5) * rect.width;
        const y = (-project.y * 0.5 + 0.5) * rect.height;
        const visible = project.z < 1;
        const el = photoRefs.current[d.memory.id];
        if (el) {
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          el.style.opacity = visible ? '1' : '0';
          el.style.pointerEvents = visible ? 'auto' : 'none';
          // Hide elements on the back hemisphere.
          el.dataset.visible = visible ? '1' : '0';
        }
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();
    setReady(true);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      dots.forEach((d) => {
        d.mesh.geometry.dispose();
        (d.mesh.material as THREE.Material).dispose();
        d.halo.geometry.dispose();
        (d.halo.material as THREE.Material).dispose();
      });
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [memories]);

  return (
    <div className="globe-wrap" ref={containerRef} data-ready={ready ? '1' : '0'}>
      {/* The 4 DOM photo elements — positioned by the render loop above */}
      {memories.map((m) => (
        <button
          key={m.id}
          ref={(el) => {
            photoRefs.current[m.id] = el;
          }}
          type="button"
          className="earth-photo"
          data-id={m.id}
          style={{ ['--dot' as string]: m.color }}
          onClick={() => handleSelect(m.id)}
          aria-label={`查看 ${m.title}`}
        >
          <span className="earth-photo__icon">{m.icon}</span>
          <span className="earth-photo__label">{m.title.split(' · ')[0]}</span>
        </button>
      ))}

      {/* WebGL failure fallback — static CSS gradient + 4 dots via DOM */}
      {!webglOk && (
        <div className="globe-fallback" aria-hidden="true">
          <div className="globe-fallback__sphere" />
          {memories.map((m, i) => {
            const angle = (i / memories.length) * Math.PI * 2 - Math.PI / 2;
            const r = 42;
            return (
              <span
                key={m.id}
                className="globe-fallback__dot"
                style={{
                  left: `${50 + Math.cos(angle) * r}%`,
                  top: `${50 + Math.sin(angle) * r}%`,
                  background: m.color,
                }}
                title={m.title}
              />
            );
          })}
        </div>
      )}

      <style>{`
        .globe-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          max-width: 640px;
          margin: 0 auto;
        }
        .earth-photo {
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(20, 20, 19, 0.88);
          color: #faf9f5;
          border: 1px solid var(--dot, #c96442);
          border-radius: 980px;
          font-size: 12px;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: opacity 200ms, transform 200ms;
          z-index: 2;
        }
        .earth-photo:hover {
          transform: translate(var(--x, 0), var(--y, 0)) translate(-50%, -50%) scale(1.06);
        }
        .earth-photo__icon {
          font-size: 14px;
          line-height: 1;
        }
        .earth-photo__label {
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .globe-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .globe-fallback__sphere {
          width: 78%;
          aspect-ratio: 1;
          border-radius: 50%;
          background:
            radial-gradient(circle at 30% 30%, #2a2a2c, #141413 70%),
            var(--color-terracotta);
          box-shadow: inset -20px -20px 60px rgba(0,0,0,0.4);
        }
        .globe-fallback__dot {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 0 4px rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  );
}