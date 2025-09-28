"use client";

import { Database } from "@/app/types/query";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap } from "gsap";


function DatabaseCarousel({ databases }: { databases: Database[] }) {
    const scrollerRef = useRef<HTMLDivElement>(null);
  
    // Animate the carousel
    useGSAP(() => {
        // Get the scroller element
      const scroller = scrollerRef.current;
      // If the scroller element is not found, return
      if (!scroller) return;
  // Clear any existing children

      scroller.innerHTML = '';
        const copies = 3;
  // Create multiple copies for seamless loop
      for (let i = 0; i < copies; i++) {
        // Create a card element for each database
        databases.forEach((db, idx) => {
          // Create a card element
          const card = document.createElement('div');
          // Set the class name for the card
          card.className = "flex items-center p-6 mx-3 transition-all duration-300 hover:shadow-xl flex-shrink-0 bg-white rounded-lg border border-pink-500/30 hover:border-pink-400/50 shadow-lg hover:shadow-pink-500/25";
        // Set the inner HTML for the card
          card.innerHTML = `
            <div class="relative group flex items-center justify-center p-0">
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-6 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-900 text-pink-200 text-sm rounded-lg px-3 py-1 mb-2 shadow-lg whitespace-nowrap border border-pink-500/30">
                ${db.tooltip}
              </div>
              <div class="relative w-24 h-24">
                <img src="${db.src}" alt="${db.alt}" class="object-contain w-full h-full" />
              </div>
            </div>
          `;
          // Append the card to the scroller
          scroller.appendChild(card);
        });
      }
      // Get the total width of the scroller
      const totalWidth = scroller.scrollWidth;
      // Get the width of each item in the carousel by the total width and the copies
      const itemWidth = totalWidth / copies;
      // Animate the scroller
      gsap.fromTo(
        scroller,
        { x: 0 },
        {
          x: -itemWidth,
          ease: "none",
          duration: 20,
          repeat: -1,
        }
      );
      // Return a function to kill the tweens
      return () => {
        gsap.killTweensOf(scroller);
      };
    }, [databases]);
  
    return (
      <div className="relative overflow-hidden">
        <h2 className="text-3xl font-bold mb-12 text-center bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Works with the following databases
        </h2>
        <div ref={scrollerRef} className="flex flex-nowrap whitespace-nowrap">
          {/* Content will be populated by GSAP */}
        </div>
      </div>
    );
  }

  export default DatabaseCarousel;