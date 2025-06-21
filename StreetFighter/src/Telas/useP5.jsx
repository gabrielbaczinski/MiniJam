import { useEffect, useRef } from 'react';
import p5 from 'p5';

// Flag global para evitar múltiplas instâncias
let p5InstanceExists = false;

export default function useP5(sketch) {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);

  useEffect(() => {
    console.log('useP5 effect: verificando canvas');
    
    // Remover todas as instâncias existentes do documento
    const allCanvases = document.querySelectorAll('canvas');
    if (allCanvases.length > 1) {
      console.log(`Encontrados ${allCanvases.length} canvas, removendo extras`);
      // Manter apenas o primeiro canvas
      for (let i = 1; i < allCanvases.length; i++) {
        allCanvases[i].remove();
      }
    }
    
    // Só criar uma nova instância se não existir nenhuma e temos container
    if (!p5InstanceExists && containerRef.current) {
      console.log('Criando nova instância p5');
      p5InstanceExists = true;
      p5InstanceRef.current = new p5(sketch, containerRef.current);
    }
    
    // Limpeza ao desmontar
    return () => {
      if (p5InstanceRef.current) {
        console.log('Removendo instância p5');
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
        p5InstanceExists = false;
      }
    };
  }, []); // Dependência vazia - inicializar apenas uma vez

  return containerRef;
}