import { useEffect, useRef } from 'react';
import p5 from 'p5';

export default function useP5(sketch) {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Only create a new instance if one doesn't already exist
    if (!isInitializedRef.current && containerRef.current) {
      console.log('Creating new p5 instance');
      
      // Remove any existing canvas
      const existingCanvas = containerRef.current.querySelector('canvas');
      if (existingCanvas) {
        console.log('Canvas already exists, removing');
        existingCanvas.remove();
      }
      
      // Create new p5 instance
      p5InstanceRef.current = new p5(sketch, containerRef.current);
      isInitializedRef.current = true;
    }
    
    // Cleanup when component unmounts
    return () => {
      if (p5InstanceRef.current) {
        console.log('Removing p5 instance');
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []); // Empty dependency array - initialize only once

  return containerRef;
}