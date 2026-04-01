// "use client";

// import { useEffect, useRef } from "react";

// type LightPoint = {
//   el: HTMLElement;
//   x: number;
//   y: number;
// };

// export default function MagneticLightCursor() {
//   const glowRef = useRef<HTMLDivElement | null>(null);
//   const mouse = useRef({ x: 0, y: 0 });
//   const current = useRef({ x: 0, y: 0 });
//   const target = useRef({ x: 0, y: 0 });
//   const attached = useRef<HTMLElement | null>(null);
//   const lightsRef = useRef<LightPoint[]>([]);
//   const rafRef = useRef<number | null>(null);

//   useEffect(() => {
//     const glow = glowRef.current;
//     if (!glow) return;

//     const collectLights = () => {
//       const els = Array.from(
//         document.querySelectorAll<HTMLElement>("[data-light='true']"),
//       );

//       lightsRef.current = els.map((el) => {
//         const rect = el.getBoundingClientRect();
//         return {
//           el,
//           x: rect.left + rect.width / 2,
//           y: rect.top + rect.height / 2,
//         };
//       });
//     };

//     const refreshLightPositions = () => {
//       lightsRef.current = lightsRef.current.map((light) => {
//         const rect = light.el.getBoundingClientRect();
//         return {
//           ...light,
//           x: rect.left + rect.width / 2,
//           y: rect.top + rect.height / 2,
//         };
//       });
//     };

//     const onMouseMove = (e: MouseEvent) => {
//       mouse.current.x = e.clientX;
//       mouse.current.y = e.clientY;
//     };

//     const activateLight = (el: HTMLElement | null) => {
//       for (const light of lightsRef.current) {
//         const wrapper = light.el.closest("[data-light-wrapper]");
//         if (!wrapper) continue;

//         if (light.el === el) {
//           wrapper.setAttribute("data-light-active", "true");
//         } else {
//           wrapper.setAttribute("data-light-active", "false");
//         }
//       }
//     };

//     const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
//       const dx = x1 - x2;
//       const dy = y1 - y2;
//       return Math.sqrt(dx * dx + dy * dy);
//     };

//     const findNearestLight = () => {
//       let nearest: LightPoint | null = null;
//       let minDistance = Infinity;

//       for (const light of lightsRef.current) {
//         const d = getDistance(
//           mouse.current.x,
//           mouse.current.y,
//           light.x,
//           light.y,
//         );

//         if (d < minDistance) {
//           minDistance = d;
//           nearest = light;
//         }
//       }

//       return { nearest, minDistance };
//     };

//     const attachDistance = 140;
//     const detachDistance = 190;

//     const animate = () => {
//       refreshLightPositions();

//       if (attached.current) {
//         const active = lightsRef.current.find((l) => l.el === attached.current);

//         if (active) {
//           const d = getDistance(
//             mouse.current.x,
//             mouse.current.y,
//             active.x,
//             active.y,
//           );

//           if (d > detachDistance) {
//             attached.current = null;
//             activateLight(null);
//             target.current.x = mouse.current.x;
//             target.current.y = mouse.current.y;
//           } else {
//             target.current.x = active.x;
//             target.current.y = active.y;
//             activateLight(active.el);
//           }
//         } else {
//           attached.current = null;
//           activateLight(null);
//         }
//       } else {
//         const { nearest, minDistance } = findNearestLight();

//         if (nearest && minDistance < attachDistance) {
//           attached.current = nearest.el;
//           target.current.x = nearest.x;
//           target.current.y = nearest.y;
//           activateLight(nearest.el);
//         } else {
//           target.current.x = mouse.current.x;
//           target.current.y = mouse.current.y;
//           activateLight(null);
//         }
//       }

//       current.current.x += (target.current.x - current.current.x) * 0.12;
//       current.current.y += (target.current.y - current.current.y) * 0.12;

//       glow.style.transform = `translate(${current.current.x}px, ${current.current.y}px) translate(-50%, -50%)`;

//       if (attached.current) {
//         glow.style.width = "200px";
//         glow.style.height = "200px";
//         glow.style.opacity = "0.7";
//       } else {
//         glow.style.width = "300px";
//         glow.style.height = "300px";
//         glow.style.opacity = "1";
//       }

//       rafRef.current = requestAnimationFrame(animate);
//     };

//     collectLights();
//     window.addEventListener("mousemove", onMouseMove);
//     window.addEventListener("resize", collectLights);
//     window.addEventListener("scroll", refreshLightPositions, { passive: true });

//     rafRef.current = requestAnimationFrame(animate);

//     return () => {
//       if (rafRef.current) cancelAnimationFrame(rafRef.current);
//       window.removeEventListener("mousemove", onMouseMove);
//       window.removeEventListener("resize", collectLights);
//       window.removeEventListener("scroll", refreshLightPositions);
//     };
//   }, []);

//   return (
//     <div
//       ref={glowRef}
//       className="pointer-events-none fixed left-0 top-0 z-9999 h-[280px] w-[280px] rounded-full bg-white/40 blur-[95px] mix-blend-screen transition-[width,height,opacity] duration-200"
//     />
//   );
// }

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type LightPoint = {
  el: HTMLElement;
  wrapper: HTMLElement | null;
  x: number;
  y: number;
};

export default function MagneticLightCursor() {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const lightsRef = useRef<LightPoint[]>([]);
  const attachedRef = useRef<HTMLElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const collectLights = () => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('[data-light="true"]'),
      );

      lightsRef.current = els.map((el) => {
        const rect = el.getBoundingClientRect();

        return {
          el,
          wrapper: el.closest("[data-light-wrapper]"),
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      });
    };

    const refreshLights = () => {
      lightsRef.current = lightsRef.current.map((light) => {
        const rect = light.el.getBoundingClientRect();

        return {
          ...light,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      });
    };

    const setActiveWrapper = (activeEl: HTMLElement | null) => {
      lightsRef.current.forEach((light) => {
        if (!light.wrapper) return;

        if (light.el === activeEl) {
          light.wrapper.setAttribute("data-light-active", "true");
        } else {
          light.wrapper.setAttribute("data-light-active", "false");
        }
      });
    };

    const distance = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const findNearestLight = () => {
      let nearest: LightPoint | null = null;
      let min = Infinity;

      for (const light of lightsRef.current) {
        const d = distance(
          mouseRef.current.x,
          mouseRef.current.y,
          light.x,
          light.y,
        );

        if (d < min) {
          min = d;
          nearest = light;
        }
      }

      return { nearest, minDistance: min };
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    gsap.set(glow, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      width: 280,
      height: 280,
      opacity: 1,
    });

    const xTo = gsap.quickTo(glow, "x", {
      duration: 0.35,
      ease: "power3.out",
    });

    const yTo = gsap.quickTo(glow, "y", {
      duration: 0.35,
      ease: "power3.out",
    });

    const attachDistance = 220;
    const detachDistance = 300;

    const animate = () => {
      refreshLights();

      if (attachedRef.current) {
        const active = lightsRef.current.find(
          (l) => l.el === attachedRef.current,
        );

        if (!active) {
          attachedRef.current = null;
          setActiveWrapper(null);

          xTo(mouseRef.current.x);
          yTo(mouseRef.current.y);

          gsap.to(glow, {
            width: 280,
            height: 280,
            opacity: 1,
            duration: 0.25,
            ease: "power2.out",
          });
        } else {
          const d = distance(
            mouseRef.current.x,
            mouseRef.current.y,
            active.x,
            active.y,
          );

          if (d > detachDistance) {
            attachedRef.current = null;
            setActiveWrapper(null);

            xTo(mouseRef.current.x);
            yTo(mouseRef.current.y);

            gsap.to(glow, {
              width: 280,
              height: 280,
              opacity: 1,
              duration: 0.25,
              ease: "power2.out",
            });
          } else {
            setActiveWrapper(active.el);

            xTo(active.x);
            yTo(active.y);

            gsap.to(glow, {
              width: 220,
              height: 220,
              opacity: 0.9,
              duration: 0.25,
              ease: "power2.out",
            });
          }
        }
      } else {
        const { nearest, minDistance } = findNearestLight();

        if (nearest && minDistance < attachDistance) {
          attachedRef.current = nearest.el;
          setActiveWrapper(nearest.el);

          xTo(nearest.x);
          yTo(nearest.y);

          gsap.fromTo(
            nearest.wrapper,
            { opacity: 0.96 },
            {
              opacity: 1,
              duration: 0.08,
              repeat: 1,
              yoyo: true,
              ease: "power1.inOut",
            },
          );
        } else {
          setActiveWrapper(null);

          xTo(mouseRef.current.x);
          yTo(mouseRef.current.y);

          gsap.to(glow, {
            width: 280,
            height: 280,
            opacity: 1,
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    collectLights();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", collectLights);
    window.addEventListener("scroll", refreshLights, { passive: true });

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", collectLights);
      window.removeEventListener("scroll", refreshLights);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed left-0 top-0 z-9999 rounded-full bg-white/45 blur-[110px] mix-blend-screen"
    />
  );
}
