"use client";

import React, { useEffect, useRef } from "react";

type LightData = {
  el: HTMLElement;
  x: number;
  y: number;
};

export default function MagneticLightEffect() {
  const glowRef = useRef<HTMLDivElement | null>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const attachedLight = useRef<HTMLElement | null>(null);
  const lightsRef = useRef<LightData[]>([]);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const getLights = () => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>("[data-light]"),
      );

      lightsRef.current = els.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      });
    };

    const updateLightPositions = () => {
      lightsRef.current = lightsRef.current.map((item) => {
        const rect = item.el.getBoundingClientRect();
        return {
          ...item,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const detachAllLights = () => {
      lightsRef.current.forEach(({ el }) => {
        el.style.setProperty("--light-scale", "1");
        el.style.setProperty("--light-opacity", "0.25");
        el.classList.remove("is-active");
      });
    };

    const findNearestLight = () => {
      let nearest: LightData | null = null;
      let minDistance = Infinity;

      for (const light of lightsRef.current) {
        const dx = mouse.current.x - light.x;
        const dy = mouse.current.y - light.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearest = light;
        }
      }

      return { nearest, minDistance };
    };

    const snapDistance = 160;

    const animate = () => {
      updateLightPositions();

      const { nearest, minDistance } = findNearestLight();

      if (nearest && minDistance < snapDistance) {
        attachedLight.current = nearest.el;
        target.current.x = nearest.x;
        target.current.y = nearest.y;

        detachAllLights();

        nearest.el.style.setProperty("--light-scale", "1.8");
        nearest.el.style.setProperty("--light-opacity", "1");
        nearest.el.classList.add("is-active");
      } else {
        attachedLight.current = null;
        target.current.x = mouse.current.x;
        target.current.y = mouse.current.y;

        detachAllLights();
      }

      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;

      glow.style.transform = `translate(${current.current.x}px, ${current.current.y}px) translate(-50%, -50%)`;

      requestAnimationFrame(animate);
    };

    getLights();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", getLights);
    window.addEventListener("scroll", updateLightPositions, { passive: true });

    const raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", getLights);
      window.removeEventListener("scroll", updateLightPositions);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        className="pointer-events-none fixed left-0 top-0 z-9999 h-28 w-28 rounded-full bg-yellow-300/35 blur-3xl mix-blend-screen"
      />

      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="grid grid-cols-3 gap-16">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex flex-col items-center gap-4">
                <div
                  data-light
                  className="light-point relative h-8 w-8 rounded-full bg-yellow-200"
                />
                <p className="text-sm text-white/70">Light {item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .light-point {
          --light-scale: 1;
          --light-opacity: 0.25;
          transform: scale(var(--light-scale));
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            opacity 0.25s ease,
            background-color 0.25s ease;
          opacity: var(--light-opacity);
          box-shadow:
            0 0 10px rgba(255, 230, 150, 0.25),
            0 0 30px rgba(255, 210, 100, 0.15);
        }

        .light-point.is-active {
          opacity: 1;
          background-color: rgb(254 240 138);
          box-shadow:
            0 0 20px rgba(255, 240, 180, 0.9),
            0 0 45px rgba(255, 220, 120, 0.75),
            0 0 90px rgba(255, 200, 80, 0.45);
        }
      `}</style>
    </>
  );
}
