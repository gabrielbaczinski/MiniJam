import { useRef, useEffect } from 'react';
import p5 from 'p5';

// Garantir que tenhamos apenas uma instância do P5
let currentInstance = null;

const useP5 = (sketchFunction) => {
    const canvasRef = useRef(null);
    const p5InstanceRef = useRef(null);
    
    useEffect(() => {
        console.log("useP5 effect running");
        
        // Limpar instância existente se houver
        if (currentInstance) {
            console.log("Removendo instância P5 existente");
            try {
                currentInstance.remove();
            } catch (e) {
                console.error("Erro ao remover instância P5:", e);
            }
            currentInstance = null;
        }
        
        // Limpar todos os canvas visíveis do P5
        document.querySelectorAll('canvas.p5Canvas').forEach(canvas => {
            console.log("Removendo canvas existente");
            canvas.parentNode?.removeChild(canvas);
        });
        
        // Restaurar o sistema de teclas global
        if (typeof window !== 'undefined') {
            window.keyState = {};
            
            // Remover listeners antigos se existirem
            if (window._gameKeyDown) {
                window.removeEventListener('keydown', window._gameKeyDown);
            }
            if (window._gameKeyUp) {
                window.removeEventListener('keyup', window._gameKeyUp);
            }
            
            // Adicionar novos listeners
            window._gameKeyDown = function(e) {
                window.keyState[e.keyCode] = true;
                // Evitar comportamentos padrão como rolagem da página
                if ([32, 37, 38, 39, 40, 87, 65, 83, 68].includes(e.keyCode)) {
                    e.preventDefault();
                }
            };
            
            window._gameKeyUp = function(e) {
                window.keyState[e.keyCode] = false;
            };
            
            window.addEventListener('keydown', window._gameKeyDown);
            window.addEventListener('keyup', window._gameKeyUp);
        }
        
        // Garantir que variáveis globais sejam resetadas
        window.player1 = null;
        window.player2 = null;
        window.projectiles = [];
        window.gameOver = false;
        window.winner = null;
        
        // Criar nova instância com pequeno delay para garantir limpeza
        const timer = setTimeout(() => {
            if (canvasRef.current) {
                console.log("Criando nova instância P5");
                // Criar nova instância
                const instance = new p5(sketchFunction, canvasRef.current);
                p5InstanceRef.current = instance;
                currentInstance = instance;
            }
        }, 100);
        
        // Cleanup quando o componente desmontar
        return () => {
            clearTimeout(timer);
            
            // Remover listeners de tecla específicos deste componente
            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', window._gameKeyDown);
                window.removeEventListener('keyup', window._gameKeyUp);
            }
            
            if (p5InstanceRef.current) {
                console.log("Limpando instância P5 ao desmontar");
                try {
                    p5InstanceRef.current.remove();
                    if (currentInstance === p5InstanceRef.current) {
                        currentInstance = null;
                    }
                } catch (e) {
                    console.error("Erro ao limpar instância P5:", e);
                }
                p5InstanceRef.current = null;
            }
        };
    }, [sketchFunction]);
    
    return canvasRef;
};

export default useP5;