"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

export default function BackgroundBlurs() {
  useEffect(() => {
    gsap.to(".bg-blur-1", {
      x: 100,
      y: -50,
      rotation: 10,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(".bg-blur-2", {
      x: -100,
      y: 50,
      rotation: -10,
      duration: 25,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(".bg-blur-3", {
      x: 50,
      y: -100,
      rotation: 5,
      duration: 30,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="bg-blur-1 absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="bg-blur-2 absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
      <div className="bg-blur-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
    </div>
  );
}
