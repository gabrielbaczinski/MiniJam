import React, { useEffect } from 'react';
import useP5 from './useP5';
import { Fighter } from '../Classes/Fighter';
import { CHARACTERS } from '../Classes/Characters';
import { Projectile } from '../Classes/Projectile';

// Sistema global de teclas
if (typeof window !== 'undefined') {
    window.keyState = {};
    
    window.removeEventListener('keydown', window._gameKeyDown);
    window.removeEventListener('keyup', window._gameKeyUp);
    
    window._gameKeyDown = function(e) {
        window.keyState[e.keyCode] = true;
    };
    
    window._gameKeyUp = function(e) {
        window.keyState[e.keyCode] = false;
    };
    
    window.addEventListener('keydown', window._gameKeyDown);
    window.addEventListener('keyup', window._gameKeyUp);
}

const GameCanvas = ({ selectedCharacters = { player1: 'ryu', player2: 'ken' }, onGameEnd, onGameReady }) => {
    // Verificar instâncias duplicadas no momento da montagem
    useEffect(() => {
        console.log("GameCanvas montado");

        // Pode adicionar lógica para relatar quando o canvas está pronto
        
        return () => {
            console.log("GameCanvas desmontado");
            // Limpeza
        };
    }, []);

    const sketchFunction = (p) => {
        // Adicione esta configuração
        const config = {
            canvasWidth: 800,
            canvasHeight: 400,
            gravity: 0.6,
            groundLevel: 400,
            gameSpeed: 1,
            debugMode: false
        };

        // Variáveis do jogo
        let player1 = null;
        let player2 = null;
        let setupComplete = false;
        let loadingMessage = "Carregando...";
        let sprites = {
            ryu: {}, ken: {}, 'chun-li': {}, makoto: {}
        };
        let selectedBg = null;
        let backgrounds = [];
        let gameTime = 99; // Tempo em segundos
        let lastSecond = 0;
        
        // Função para carregar sprites com fallback robusto
        async function loadSprite(p, character) {
            console.log(`Carregando sprites para ${character}...`);
            
            const loadImageAsync = (path) => {
                return new Promise((resolve) => {
                    p.loadImage(
                        path,
                        img => {
                            console.log(`Imagem ${path} carregada com sucesso`);
                            resolve(img);
                        },
                        () => {
                            console.error(`Erro ao carregar ${path}`);
                            // Criar imagem de fallback simples
                            const fallbackImg = p.createImage(96, 110);
                            fallbackImg.loadPixels();
                            for (let i = 0; i < fallbackImg.width; i++) {
                                for (let j = 0; j < fallbackImg.height; j++) {
                                    fallbackImg.set(i, j, p.color(255, 0, 0, 150));
                                }
                            }
                            fallbackImg.updatePixels();
                            resolve(fallbackImg);
                        }
                    );
                });
            };
            
            try {
                // Converter nome do personagem para formato do arquivo
                const charName = character === 'chun-li' ? 'Chun' : 
                                 character === 'ryu' ? 'Ryu' :
                                 character === 'ken' ? 'Ken' : 'Makoto';
                
                // Carregar todos os sprites necessários
                const idle = await loadImageAsync(`/Sprites/${charName} Standing.gif`);
                const walk = await loadImageAsync(`/Sprites/${charName} Walking.gif`);
                const punch = await loadImageAsync(`/Sprites/${charName} Punch.gif`);
                const special = await loadImageAsync(`/Sprites/${charName} Special.gif`);
                const jump = await loadImageAsync(`/Sprites/${charName} Jump.gif`);
                const crouch = await loadImageAsync(`/Sprites/${charName} Crouch.gif`);
                const block = await loadImageAsync(`/Sprites/${charName} Block.gif`);
                const damage = await loadImageAsync(`/Sprites/${charName} Damage.gif`);
                
                // Retornar objeto com todas as animações
                return {
                    idle,
                    walk,
                    punch,
                    special,
                    jump,
                    crouch,
                    block,
                    damage // Adicionada aqui
                };
            } catch (error) {
                console.error(`Erro ao carregar sprites para ${character}:`, error);
                
                // Fallback: criar imagens coloridas básicas
                const createColorImage = () => {
                    const img = p.createImage(96, 110);
                    img.loadPixels();
                    const color = character === 'ryu' ? [255, 255, 255] :
                                 character === 'ken' ? [255, 0, 0] :
                                 character === 'chun-li' ? [0, 0, 255] : [0, 255, 0];
                    
                    for (let i = 0; i < img.width; i++) {
                        for (let j = 0; j < img.height; j++) {
                            img.set(i, j, p.color(...color, 150));
                        }
                    }
                    img.updatePixels();
                    return img;
                };
                
                const defaultImg = createColorImage();
                
                return {
                    idle: defaultImg,
                    walk: defaultImg,
                    punch: defaultImg,
                    special: defaultImg,
                    jump: defaultImg,
                    crouch: defaultImg,
                    block: defaultImg
                };
            }
        }

        p.setup = async function() {
            // Criar o canvas com o tamanho correto (800x450)
            p.createCanvas(800, 450);
            
            // Ajustar o groundLevel para corresponder ao tamanho do canvas
            const groundLevel = 450;
            
            // Reset global state
            window.gameOver = false;
            window.winner = null;
            window.projectiles = [];
            window.keyState = {}; // Para rastreamento de teclas
            
            // Inicialização adequada do sistema de teclas
            window.keyState = {};
            
            // Garantir que estas funções estejam definidas
            p.keyPressed = function() {
                window.keyState[p.keyCode] = true;
                return false; // Impedir comportamento padrão do navegador
            };
            
            p.keyReleased = function() {
                window.keyState[p.keyCode] = false;
                return false; // Impedir comportamento padrão do navegador
            };
            
            // Configurações para pixel art nítida
            p.noSmooth();
            p.pixelDensity(1);
            
            // Modo de imagem padrão
            p.imageMode(p.CORNER);
            
            // Calcular escala com base no tamanho da tela
            window.gameScale = Math.min(window.innerWidth / 800, window.innerHeight / 450) * 0.9;
            
            try {
                // Carregar backgrounds
                loadingMessage = "Carregando backgrounds...";
                for (let i = 1; i <= 6; i++) {
                    try {
                        const bg = await new Promise((resolve) => {
                            p.loadImage(
                                `/Sprites/BG${i}.gif`,
                                img => resolve(img),
                                () => {
                                    console.error(`Erro ao carregar BG${i}.gif`);
                                    resolve(null);
                                }
                            );
                        });
                        if (bg) backgrounds.push(bg);
                    } catch (e) {
                        console.error(`Erro ao carregar background ${i}:`, e);
                    }
                }
                
                // Carregar sprites
                loadingMessage = "Carregando sprites...";
                sprites.ryu = await loadSprite(p, 'ryu');
                sprites.ken = await loadSprite(p, 'ken');
                sprites['chun-li'] = await loadSprite(p, 'chun-li');
                sprites.makoto = await loadSprite(p, 'makoto');
                
                // Adicione este log
                console.log("Sprites carregados:", {
                    ryu: sprites.ryu ? Object.keys(sprites.ryu).length : 0,
                    ken: sprites.ken ? Object.keys(sprites.ken).length : 0,
                    'chun-li': sprites['chun-li'] ? Object.keys(sprites['chun-li']).length : 0,
                    makoto: sprites.makoto ? Object.keys(sprites.makoto).length : 0
                });
                
                // Escolher background aleatório
                if (backgrounds.length > 0) {
                    selectedBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                }
                
                // Inicializar jogadores
                loadingMessage = "Inicializando jogadores...";
                try {
                    // Carregar os personagens selecionados
                    let p1Character = selectedCharacters?.player1 || 'ryu';
                    let p2Character = selectedCharacters?.player2 || 'ken';
                    
                    console.log(`Inicializando jogadores com ${p1Character} e ${p2Character}`);
                    
                    // Carregar sprites para os personagens selecionados
                    const player1Sprites = sprites[p1Character] || await loadSprite(p, p1Character);
                    const player2Sprites = sprites[p2Character] || await loadSprite(p, p2Character);
                    
                    // Inicializar a lista global de projéteis
                    window.projectiles = [];
                    
                    // Teclas de controle para Player 1 e Player 2
                    const p1MoveKeys = [65, 68, 87, 83]; // A, D, W, S
                    const p1AttackKey = 70; // F
                    const p1BlockKey = 71; // G
                    const p1SpecialKeys = [81]; // Q
                    const p1UltimateKeys = [69]; // E
                    
                    const p2MoveKeys = [37, 39, 38, 40]; // Setas
                    const p2AttackKey = 75; // K
                    const p2BlockKey = 76; // L
                    const p2SpecialKeys = [73]; // I
                    const p2UltimateKeys = [79]; // O
                    
                    // Criar jogadores - IMPORTANTE: atribua às variáveis locais E globais
                    const p1 = new Fighter(
                        200,  // x
                        groundLevel, // y - ajustado para o groundLevel correto
                        "Player 1",
                        p1MoveKeys,
                        p1AttackKey,
                        p1BlockKey,
                        p1SpecialKeys,
                        p1UltimateKeys,
                        p,
                        player1Sprites,
                        p1Character
                    );
                    
                    const p2 = new Fighter(
                        600,  // x
                        groundLevel, // y - ajustado para o groundLevel correto
                        "Player 2",
                        p2MoveKeys,
                        p2AttackKey,
                        p2BlockKey,
                        p2SpecialKeys,
                        p2UltimateKeys,
                        p,
                        player2Sprites,
                        p2Character
                    );
                    
                    // Atribuir às variáveis do escopo da função e às globais
                    player1 = p1;
                    player2 = p2;
                    window.player1 = p1;
                    window.player2 = p2;
                    
                    // No final, quando tudo estiver carregado:
                    setupComplete = true;
                    loadingMessage = "";
                    
                    // Notificar o App que o jogo está pronto
                    if (typeof onGameReady === 'function') {
                        onGameReady();
                    }
                } catch (error) {
                    console.error("Erro na inicialização dos jogadores:", error);
                    // Tratar o erro mostrando uma mensagem na tela
                    loadingMessage = "Erro ao carregar! Tente novamente. " + error.message;
                    setupComplete = false;
                }
            } catch (error) {
                console.error("Erro durante setup:", error);
                loadingMessage = "Erro ao inicializar: " + error.message;
                setupComplete = false;
            }
            
            // Inicializar o timer de jogo
            gameTime = 99; // 99 segundos
            lastSecond = p.frameCount;
        };
        
        p.draw = function() {
            // Tela de carregamento - verificar corretamente as variáveis
            if (!setupComplete || !player1 || !player2) {
                p.background(0);
                p.fill(255);
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(loadingMessage || "Carregando...", p.width/2, p.height/2);
                return;
            }
            
            try {
                // Certifique-se de que as variáveis locais estão sincronizadas com as globais
                player1 = window.player1 || player1;
                player2 = window.player2 || player2;
                
                // Garantir que coordenadas são números válidos
                if (isNaN(player1.x)) player1.x = 200;
                if (isNaN(player1.y)) player1.y = 400;
                if (isNaN(player2.x)) player2.x = 600;
                if (isNaN(player2.y)) player2.y = 400;
                
                // Desenhar o fundo
                p.background(0);
                
                // Desenhar cenário de fundo se disponível
                if (backgrounds.length > 0) {
                    const currentBg = backgrounds[0]; // Usar o primeiro background carregado
                    p.image(currentBg, 0, 0, p.width, p.height);
                }
                
                // Atualizar e renderizar jogadores
                player1.update(player2);
                player2.update(player1);
                
                // IMPORTANTE: Chamar o método display de ambos os jogadores
                player1.display();
                player2.display();
                
                // Atualizar e renderizar projéteis
                if (window.projectiles && window.projectiles.length > 0) {
                    for (let i = window.projectiles.length - 1; i >= 0; i--) {
                        window.projectiles[i].update();
                        window.projectiles[i].display();
                        
                        if (window.projectiles[i].isOffScreen()) {
                            window.projectiles.splice(i, 1);
                        }
                    }
                }
                
                // Atualizar e desenhar efeitos (NOVA CHAMADA)
                updateAndDrawEffects();
                
                // Desenhar HUD
                drawGameHUD();
            } catch (error) {
                console.error("Erro no draw:", error);
                p.background(0);
                p.fill(255, 0, 0);
                p.textSize(18);
                p.text("Erro durante a renderização. Verifique o console.", p.width/2, p.height/2);
            }
        };
        
        function updateAndDrawEffects() {
            if (!window.effects) window.effects = [];
            
            // Atualizar e desenhar efeitos
            for (let i = window.effects.length - 1; i >= 0; i--) {
                const effect = window.effects[i];
                
                // Atualizar tempo de vida
                effect.timer--;
                
                // Desenhar com base no tipo
                p.push();
                
                switch(effect.type) {
                    case 'hit':
                        // Efeito de impacto
                        const opacity = p.map(effect.timer, 15, 0, 255, 0);
                        const size = p.map(effect.timer, 15, 0, effect.size * 0.5, effect.size * 1.5);
                        
                        p.noStroke();
                        p.fill(255, 255, 255, opacity);
                        p.ellipse(effect.x, effect.y, size);
                        
                        // Linhas de impacto
                        p.stroke(255, 255, 255, opacity);
                        p.strokeWeight(2);
                        for (let j = 0; j < 8; j++) {
                            const angle = j * p.PI / 4;
                            const lineSize = size / 2;
                            p.line(
                                effect.x + p.cos(angle) * lineSize * 0.3,
                                effect.y + p.sin(angle) * lineSize * 0.3,
                                effect.x + p.cos(angle) * lineSize,
                                effect.y + p.sin(angle) * lineSize
                            );
                        }
                        break;
                        
                    case 'special':
                        // Efeito de ativação de especial
                        const specialOpacity = p.map(effect.timer, 30, 0, 200, 0);
                        
                        p.noFill();
                        p.stroke(255, 220, 50, specialOpacity);
                        p.strokeWeight(3);
                        
                        // Círculo de energia
                        p.ellipse(effect.x, effect.y, effect.size * (1 + (30 - effect.timer) / 15));
                        
                        // Brilho interno
                        p.fill(255, 220, 50, specialOpacity * 0.7);
                        p.ellipse(effect.x, effect.y, effect.size * 0.5);
                        break;
                }
                
                p.pop();
                
                // Remover efeitos expirados
                if (effect.timer <= 0) {
                    window.effects.splice(i, 1);
                }
            }
        }
        
        function drawGameHUD() {
            try {
                // Verificar se temos valores válidos antes de desenhar
                if (isNaN(p.width)) return;
                
                // Timer central
                p.fill(0, 0, 0, 150);
                p.rect(p.width/2 - 40, 30, 80, 30);
                
                p.fill(255);
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                // Garantir que gameTime é um número
                const displayTime = isNaN(gameTime) ? 99 : gameTime;
                p.text(displayTime, p.width/2, 45);
                
                // Atualizar timer a cada segundo
                if (p.frameCount - lastSecond >= 60) {
                    lastSecond = p.frameCount;
                    if (gameTime > 0) {
                        gameTime--;
                    } else {
                        // Se acabou o tempo, verificar quem tem mais vida
                        if (!window.gameOver) {
                            window.gameOver = true;
                            if (player1.life > player2.life) {
                                window.winner = 'Player 1';
                            } else if (player2.life > player1.life) {
                                window.winner = 'Player 2';
                            } else {
                                window.winner = 'Draw';
                            }
                        }
                    }
                }
                
                // Se jogo acabou, mostrar tela de vitória
                if (window.gameOver) {
                    p.fill(0, 0, 0, 200);
                    p.rect(0, 0, p.width, p.height);
                    
                    p.fill(255);
                    p.textSize(32);
                    p.textAlign(p.CENTER, p.CENTER);
                    
                    if (window.winner === 'Draw') {
                        p.text("DRAW!", p.width/2, p.height/2 - 20);
                    } else {
                        p.text(`${window.winner} WINS!`, p.width/2, p.height/2 - 20);
                    }
                    
                    p.textSize(18);
                    p.text("Press SPACE to play again", p.width/2, p.height/2 + 20);
                    
                    // Reiniciar jogo com espaço
                    if (p.keyIsDown(32)) { // 32 é o keyCode para espaço
                        if (typeof onGameEnd === 'function') {
                            onGameEnd(); // Chamar a função onGameEnd quando o jogo terminar
                        }
                    }
                }
                
                // Mostrar ícones dos personagens
                drawCharacterIcons();
            } catch (error) {
                console.error("Erro em drawGameHUD:", error);
            }
        }

        function drawCharacterIcons() {
            try {
                // Verificar se temos valores válidos antes de desenhar
                if (isNaN(p.width) || !player1 || !player2) return;
                
                const iconSize = 40;
                
                // Player 1
                p.fill(255, 0, 0, 100);
                p.rect(10, 30, iconSize, iconSize);
                
                // Player 2 - Certifique-se de que os cálculos são válidos
                const p2IconX = p.width - 10 - iconSize;
                if (!isNaN(p2IconX)) {
                    p.fill(0, 0, 255, 100);
                    p.rect(p2IconX, 30, iconSize, iconSize);
                }
                
                // Verificar os sprites antes de tentar renderizar
                if (sprites && player1 && player1.character && 
                    sprites[player1.character] && sprites[player1.character].idle) {
                    p.image(sprites[player1.character].idle, 10, 30, iconSize, iconSize);
                }
                
                if (sprites && player2 && player2.character && 
                    sprites[player2.character] && sprites[player2.character].idle) {
                    p.image(sprites[player2.character].idle, p2IconX, 30, iconSize, iconSize);
                }
            } catch (error) {
                console.error("Erro em drawCharacterIcons:", error);
            }
        }
    };
    
    const canvasRef = useP5(sketchFunction);
    
    // Garantir que o foco do canvas seja mantido para capturar inputs
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Foca o canvas quando estiver disponível
            canvas.focus();
            
            // Adicionar listener para manter o foco
            const handleFocus = () => {
                if (canvas) canvas.focus();
            };
            
            document.addEventListener('click', handleFocus);
            return () => {
                document.removeEventListener('click', handleFocus);
            };
        }
    }, [canvasRef]);
    
    return (
        <div 
            ref={canvasRef}
            tabIndex={0}
            style={{ 
                outline: 'none',
                width: '800px',          // Largura fixa
                height: '450px',         // Altura fixa
                margin: '0 auto',        // Centralizar horizontalmente
                imageRendering: 'pixelated',
                WebkitImageRendering: 'pixelated',
                mozImageRendering: 'pixelated',
                msImageRendering: 'pixelated',
                boxShadow: '0 10px 20px rgba(0,0,0,0.3)'  // Sombra para destacar
            }}
        />
    );
};

export default GameCanvas;