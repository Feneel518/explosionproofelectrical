"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import styles from "./product-stage.module.css";

type ProductStageProps = {
  exploded: boolean; autoRotate: boolean; resetKey: number;
  drawing?: boolean; onReady?: () => void; modelUrl: string; className?: string;
};

function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.LineSegments)) return;
    geometries.add(child.geometry);
    (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
    });
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

export default function ProductStage({ exploded, autoRotate, resetKey, drawing = false, onReady, modelUrl, className = "" }: ProductStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef({ exploded, autoRotate, resetKey, drawing });
  const onReadyRef = useRef(onReady);
  const wakeRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    settingsRef.current = { exploded, autoRotate, resetKey, drawing };
    onReadyRef.current = onReady;
    wakeRef.current?.();
  }, [exploded, autoRotate, resetKey, drawing, onReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      queueMicrotask(() => setStatus("fallback"));
      return;
    }
    let disposed = false, frame = 0, ticking = false, visible = true, contextAvailable = true;
    let needsRender = true, loaded = false, ready = false, lastTime = 0;
    let lastReset = settingsRef.current.resetKey, explodeProgress = 0;
    let stageWidth = host.clientWidth, stageHeight = 0;
    let frameSampleTime = 0, frameSamples = 0;
    let scrolling = false, scrollEndTimer = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
    // A slight underside view keeps the glass seat and retaining ring visible.
    camera.position.set(3.7, -2.1, 7);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.className = styles.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Interactive 45W wellglass model. Drag to rotate, or use arrow keys when focused.");
    host.appendChild(canvas);

    const environment = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const environmentMap = generator.fromScene(environment, 0.035, 0.1, 100, { size: 128 });
    scene.environment = environmentMap.texture;
    scene.environmentIntensity = 1.15;
    environment.dispose(); generator.dispose();
    scene.add(new THREE.HemisphereLight(0xf2f9f4, 0x252825, 1.5));
    const key = new THREE.DirectionalLight(0xf4f9ff, 3.2);
    key.position.set(-3, 5, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc4d9e7, 3);
    rim.position.set(4, 2, -4); scene.add(rim);
    const turntable = new THREE.Group();
    turntable.rotation.z = -0.07;
    scene.add(turntable);
    const parts: { object: THREE.Object3D; restY: number; travel: number }[] = [];
    const lines: THREE.LineSegments[] = [];
    const drawingUniform = { value: settingsRef.current.drawing ? 1 : 0 };
    const paper = new THREE.Color("#072436");
    const drawingMaterial = new THREE.LineBasicMaterial({ color: "#bfd8e4", transparent: true, opacity: 0.75 });

    // Only rotation is needed. Passive pointer handlers avoid the blocking
    // wheel listener that OrbitControls installs even with zoom disabled.
    const angles = new THREE.Spherical().setFromVector3(camera.position);
    const initialAngles = angles.clone();
    let targetTheta = angles.theta, targetPhi = angles.phi;
    const minPhi = Math.PI * 0.21, maxPhi = Math.PI * 0.72;
    let pointer: { id: number; x: number; y: number } | null = null;
    camera.lookAt(0, 0, 0);
    canvas.style.touchAction = "pan-y";

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; lastTime = 0;
      frameSampleTime = 0; frameSamples = 0;
    }
    function wake() {
      needsRender = true;
      if (!disposed && loaded && contextAvailable && visible && !scrolling && !document.hidden && !frame && !ticking) frame = requestAnimationFrame(animate);
    }
    function animate(time: number) {
      frame = 0;
      if (disposed || !loaded || !contextAvailable || !visible || scrolling || document.hidden) return;
      ticking = true;
      const elapsed = lastTime ? time - lastTime : 0;
      const delta = elapsed ? Math.min(elapsed / 1000, 0.06) : 1 / 60;
      // Lower resolution once sustained rendering is slow. Keep the original
      // geometry and avoid quality oscillation or measuring idle/offscreen time.
      if (elapsed > 0 && elapsed < 120 && renderer.getPixelRatio() > 0.9) {
        frameSampleTime += elapsed; frameSamples++;
        if (frameSamples === 40) {
          if (frameSampleTime / frameSamples > 26) {
            renderer.setPixelRatio(Math.max(0.9, renderer.getPixelRatio() - 0.25));
            needsRender = true;
          }
          frameSamples = 0; frameSampleTime = 0;
        }
      }
      lastTime = time;
      const settings = settingsRef.current;
      const drawingTarget = settings.drawing ? 1 : 0;
      const previousDrawing = drawingUniform.value;
      drawingUniform.value = reducedMotion.matches ? drawingTarget : THREE.MathUtils.damp(previousDrawing, drawingTarget, 7, delta);
      if (Math.abs(drawingUniform.value - drawingTarget) < 0.002) drawingUniform.value = drawingTarget;
      const drawingMoving = drawingUniform.value !== previousDrawing;
      if (drawingMoving || !ready) {
        drawingMaterial.opacity = drawingUniform.value * 0.75;
        lines.forEach((line) => { line.visible = drawingUniform.value > 0.001; });
        needsRender = true;
      }
      if (lastReset !== settings.resetKey) {
        lastReset = settings.resetKey;
        targetTheta = initialAngles.theta; targetPhi = initialAngles.phi;
        needsRender = true;
      }
      const rotating = settings.autoRotate && !reducedMotion.matches && !pointer;
      if (rotating) targetTheta -= delta * Math.PI * 2 / 60 * 0.48;
      const previousTheta = angles.theta, previousPhi = angles.phi;
      angles.theta = reducedMotion.matches ? targetTheta : THREE.MathUtils.damp(angles.theta, targetTheta, 14, delta);
      angles.phi = reducedMotion.matches ? targetPhi : THREE.MathUtils.damp(angles.phi, targetPhi, 14, delta);
      if (Math.abs(angles.theta - targetTheta) < 0.00001) angles.theta = targetTheta;
      if (Math.abs(angles.phi - targetPhi) < 0.00001) angles.phi = targetPhi;
      const changed = angles.theta !== previousTheta || angles.phi !== previousPhi;
      if (changed) { camera.position.setFromSpherical(angles); camera.lookAt(0, 0, 0); }
      const target = settings.exploded ? 1 : 0;
      const previousProgress = explodeProgress;
      explodeProgress = reducedMotion.matches ? target : THREE.MathUtils.damp(explodeProgress, target, 6, delta);
      if (Math.abs(explodeProgress - target) < 0.001) explodeProgress = target;
      const moving = previousProgress !== explodeProgress;
      if (moving) {
        parts.forEach(({ object, restY, travel }) => { object.position.y = restY + travel * explodeProgress; });
        turntable.position.y = explodeProgress * 0.32;
      }
      const desiredFov = (stageWidth < 460 ? 39 : 35) + explodeProgress * 14;
      if (camera.fov !== desiredFov) { camera.fov = desiredFov; camera.updateProjectionMatrix(); needsRender = true; }
      if (changed || moving || needsRender || !ready) {
        renderer.render(scene, camera); needsRender = false;
        if (!ready) { ready = true; setStatus("ready"); onReadyRef.current?.(); }
      }
      ticking = false;
      if (rotating || changed || moving || drawingMoving) frame = requestAnimationFrame(animate);
      else lastTime = 0;
    }
    wakeRef.current = wake;
    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      pointer.x = event.clientX; pointer.y = event.clientY;
      // Vertical touch gestures belong to native page scrolling. The browser
      // cancels the pointer sequence once it recognises that gesture.
      if (event.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) return;
      const sensitivity = Math.PI * 2 * 0.65 / Math.max(stageHeight, 1);
      targetTheta -= dx * sensitivity;
      if (event.pointerType !== "touch") targetPhi = THREE.MathUtils.clamp(targetPhi - dy * sensitivity, minPhi, maxPhi);
      wake();
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      pointer = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      wake();
    };
    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerup", onPointerEnd, { passive: true });
    canvas.addEventListener("pointercancel", onPointerEnd, { passive: true });
    const resize = new ResizeObserver(() => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height || (width === stageWidth && height === stageHeight)) return;
      stageWidth = width; stageHeight = height;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.setSize(width, height, false); wake();
    });
    resize.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; if (visible) wake(); else stop();
    });
    intersection.observe(host);
    const onVisibility = () => { if (document.hidden) stop(); else wake(); };
    const onMotion = () => wake();
    const onScroll = () => {
      if (!scrolling) { scrolling = true; stop(); }
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => { scrolling = false; wake(); }, 150);
    };
    const onKey = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") targetTheta -= 0.14;
      if (event.key === "ArrowRight") targetTheta += 0.14;
      if (event.key === "ArrowUp") targetPhi -= 0.1;
      if (event.key === "ArrowDown") targetPhi += 0.1;
      targetPhi = THREE.MathUtils.clamp(targetPhi, minPhi, maxPhi);
      wake();
    };
    const onContextLost = (event: Event) => { event.preventDefault(); contextAvailable = false; stop(); setStatus("fallback"); };
    const onContextRestored = () => { contextAvailable = true; if (loaded) { setStatus("ready"); wake(); } };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onScroll, { passive: true });
    reducedMotion.addEventListener("change", onMotion);
    canvas.addEventListener("keydown", onKey);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    // The GLB contains the original STL surfaces and offline-generated drawing
    // lines. No STL parsing, edge generation or replacement model is built here.
    new GLTFLoader().load(modelUrl, async (gltf) => {
      if (disposed) { disposeObject(gltf.scene); return; }
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const longest = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(longest) || longest <= 0) { disposeObject(gltf.scene); setStatus("fallback"); return; }
      const shaded = new Set<THREE.Material>();
      gltf.scene.traverse((object) => {
        if (typeof object.userData.showcaseTravel === "number") parts.push({object,restY:object.position.y,travel:object.userData.showcaseTravel});
        if (object instanceof THREE.LineSegments) {
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => m.dispose());
          object.material = drawingMaterial; object.visible = false; lines.push(object); return;
        }
        if (!(object instanceof THREE.Mesh)) return;
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
          if (shaded.has(material)) return;
          shaded.add(material);
          if (material instanceof THREE.MeshStandardMaterial) {
            material.flatShading = Boolean(object.userData.stlSurface);
            if (material.transparent) { material.depthWrite = false; material.forceSinglePass = true; material.envMapIntensity = 1.6; }
          }
          material.onBeforeCompile = (shader: Parameters<THREE.Material["onBeforeCompile"]>[0]) => {
            shader.uniforms.uDrawing = drawingUniform;
            shader.fragmentShader = "uniform float uDrawing;\n" + shader.fragmentShader.replace("#include <opaque_fragment>",
              `outgoingLight = mix(outgoingLight, vec3(${paper.r}, ${paper.g}, ${paper.b}), uDrawing);\n#include <opaque_fragment>`);
          };
          material.needsUpdate = true;
        });
      });
      gltf.scene.position.sub(center);
      const model = new THREE.Group(); model.add(gltf.scene); model.scale.setScalar(4.5 / longest); turntable.add(model);
      // Compile both views ahead of the intro to avoid a shader hitch on click.
      lines.forEach((line) => { line.visible = true; });
      try { await renderer.compileAsync(scene, camera); }
      catch { if (!disposed) setStatus("fallback"); return; }
      if (disposed) return;
      loaded = true; wake();
    }, undefined, () => { if (!disposed) setStatus("fallback"); });

    return () => {
      disposed = true; stop(); wakeRef.current = null;
      resize.disconnect(); intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollEndTimer);
      reducedMotion.removeEventListener("change", onMotion);
      canvas.removeEventListener("keydown", onKey);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      disposeObject(scene); drawingMaterial.dispose(); environmentMap.dispose(); renderer.dispose(); canvas.remove();
    };
  }, [modelUrl]);

  return <div className={`${styles.stage} ${className}`} data-stage-status={status}>
    <div ref={hostRef} className={styles.host} aria-hidden={status === "fallback"} />
    {status !== "ready" && <div className={styles.fallback} role="status">
      <Image src="/marketing/wellglass.png" alt="ExEC wellglass product photograph" width={440} height={440} className={styles.fallbackImage} />
      <span>{status === "loading" ? "Preparing the product view" : "Product photograph · 3D unavailable on this device"}</span>
    </div>}
    {status === "ready" && <span className={styles.modelNote}>45W wellglass · product visualisation</span>}
  </div>;
}
