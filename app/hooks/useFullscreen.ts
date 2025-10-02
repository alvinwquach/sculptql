import { useState, useCallback, useEffect, RefObject } from "react";
import { FullscreenElement, FullscreenDocument } from "@/app/types/fullscreen";

export function useFullscreen(containerRef: RefObject<HTMLDivElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      // Enter fullscreen
      const element = containerRef.current as FullscreenElement | null;
      if (element?.requestFullscreen) {
        element.requestFullscreen();
        setIsFullscreen(true);
      } else if (element?.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if (element?.mozRequestFullScreen) {
        element.mozRequestFullScreen();
        setIsFullscreen(true);
      } else if (element?.msRequestFullscreen) {
        element.msRequestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      const doc = document as FullscreenDocument;
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
        setIsFullscreen(false);
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
        setIsFullscreen(false);
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
        setIsFullscreen(false);
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen, containerRef]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument;
      const fullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(fullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  return { isFullscreen, toggleFullscreen };
}
