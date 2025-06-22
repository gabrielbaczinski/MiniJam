import React, { useEffect, useCallback } from 'react';
import useP5 from './useP5';
import { Fighter } from '../Classes/Fighter';
import { CHARACTERS } from '../Classes/Characters';
import { Projectile } from '../Classes/Projectile';

// Sistema global de teclas - Versão melhorada
if (typeof window !== 'undefined') {
    // Remover listeners antigos se existirem
    if (window._gameKeyDown) window.removeEventListener('keydown', window._gameKeyDown);
    if (window._gameKeyUp) window.removeEventListener('keyup', window._gameKeyUp);
    
    // Inicializar estado de teclas como objeto vazio
    window.keyState = {};
    
    // Definir novos listeners
    window._gameKeyDown = (e) => {
        window.keyState[e.keyCode] = true;
        // Prevenir comportamento padrão para teclas de jogo
        if ([32, 37, 38, 39, 40, 65, 68, 83, 87, 70, 71, 75, 76, 81, 69, 73, 79, 27].includes(e.keyCode)) {
            e.preventDefault();
        }
    };
    
    window._gameKeyUp = (e) => {
        window.keyState[e.keyCode] = false;
    };
    
    // Adicionar listeners
    window.addEventListener('keydown', window._gameKeyDown);
    window.addEventListener('keyup', window._gameKeyUp);
    
    // Resetar estados do jogo
    window.gamePaused = false;
    window.exitRequested = false;
}

const GameCanvas = React.memo(({ selectedCharacters = { player1: 'ryu', player2: 'ken' }, onGameEnd, onGameReady }) => {
    // Novo estado para controlar o loading
    const [isLoading, setIsLoading] = React.useState(true);

    // Função para ser chamada quando o jogo estiver pronto
    const handleGameReady = React.useCallback(() => {
        setIsLoading(false);
        if (typeof onGameReady === 'function') onGameReady();
    }, [onGameReady]);

    // Verificar instâncias duplicadas no momento da montagem
    useEffect(() => {
        console.log("GameCanvas montado");

        // Pode adicionar lógica para relatar quando o canvas está pronto
        
        return () => {
            console.log("GameCanvas desmontado");
            // Limpeza
        };
    }, []);

    // Limpar event listeners quando o componente for desmontado
    useEffect(() => {
        return () => {
            // Limpar variables globais
            window.gameOver = false;
            window.winner = null;
            window.gamePaused = false;
            window.exitRequested = false;
            window.projectiles = [];
            window.effects = [];
            // Remover event listeners específicos do jogo
            // window.removeEventListener('keydown', window._escapeHandler); // Removido para não interferir no ESC do p5.js
        };
    }, []);

    // UseEffect para remover canvas extras
    React.useEffect(() => {
        const cleanupExtraCanvas = () => {
            const allCanvases = document.querySelectorAll('canvas');
            if (allCanvases.length > 1) {
                console.log(`Limpando ${allCanvases.length - 1} canvas extras`);
                // Manter apenas o primeiro canvas
                for (let i = 1; i < allCanvases.length; i++) {
                    allCanvases[i].remove();
                }
            }
        };
        
        // Executar limpeza inicial
        cleanupExtraCanvas();
        
        // Configurar intervalo para verificar periodicamente
        const checkInterval = setInterval(cleanupExtraCanvas, 5000);
        
        return () => {
            clearInterval(checkInterval);
        };
    }, []);

    // Tornar o sketchFunction estável com useCallback
    const sketchFunction = useCallback((p) => {
        // Adicione estas variáveis no topo da função sketchFunction
        let assetsLoaded = false;
        let renderReady = false;
        let fadeInCounter = 0;
        let fadeInDuration = 30; // Frames para o fade in
        let gameReadyNotified = false; // NOVA VARIÁVEL
        let gamePaused = false;
        let exitRequested = false; // Flag para indicar que o jogador quer sair

        // Adicione no início do arquivo, logo após os imports
        function preloadSound(url) {
            return new Promise((resolve) => {
                // Usar o URL correto para a música
                const audioElement = new Audio(url);
                audioElement.volume = 0.5;
                audioElement.addEventListener('canplaythrough', () => {
                    resolve(audioElement);
                });
                audioElement.addEventListener('error', () => {
                    console.error(`Erro ao carregar áudio: ${url}`);
                    resolve(null);
                });
                // Pré-carregamento
                audioElement.preload = 'auto';
                audioElement.load();
            });
        }

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
                // Garante que o caminho sempre começa com '/Sprites/'
                let fixedPath = path;
                if (!fixedPath.startsWith('/Sprites/')) {
                    if (fixedPath.startsWith('Sprites/')) {
                        fixedPath = '/' + fixedPath;
                    } else {
                        fixedPath = '/Sprites/' + fixedPath;
                    }
                }
                // Adiciona cache-buster para forçar recarregamento
                const cacheBuster = `cb=${Date.now()}_${Math.floor(Math.random()*100000)}`;
                const sep = fixedPath.includes('?') ? '&' : '?';
                const urlWithCacheBuster = `${fixedPath}${sep}${cacheBuster}`;
                console.log(`Tentando carregar imagem de: ${urlWithCacheBuster}`);
                return new Promise((resolve) => {
                    p.loadImage(
                        urlWithCacheBuster,
                        img => {
                            console.log(`Imagem ${urlWithCacheBuster} carregada com sucesso, dimensões: ${img.width}x${img.height}`);
                            resolve(img);
                        },
                        () => {
                            console.error(`Erro ao carregar ${urlWithCacheBuster}`);
                            // Criar fallback mais visível
                            const fallbackImg = createFallbackImage(character, fixedPath);
                            resolve(fallbackImg);
                        }
                    );
                });
            };
            
            // Função melhorada para criar imagem de fallback
            const createFallbackImage = (character, path) => {
                console.log(`Criando fallback para ${path}`);
        
                // Dimensões maiores para fallback
                const imgWidth = 96;
                const imgHeight = 110;
                
                const buffer = p.createGraphics(imgWidth, imgHeight);
                
                // Determinar a cor baseada no personagem
                let mainColor;
                if (character === 'ryu') {
                    mainColor = p.color(255, 255, 255); // Branco para Ryu
                } else if (character === 'ken') {
                    mainColor = p.color(255, 100, 0); // Laranja para Ken
                } else if (character === 'chun-li') {
                    mainColor = p.color(100, 100, 255); // Azul para Chun-Li
                } else {
                    mainColor = p.color(0, 200, 100); // Verde para Makoto
                }
                
                // Fundo colorido
                buffer.background(mainColor);
                
                // Silhueta do personagem
                buffer.fill(0, 0, 0, 150);
                buffer.noStroke();
                buffer.rect(imgWidth/4, imgHeight/6, imgWidth/2, imgHeight*2/3);
                
                // Cabeça
                buffer.ellipse(imgWidth/2, imgHeight/4, imgWidth/3, imgHeight/3);
                
                // Nome e tipo
                buffer.fill(0);
                buffer.textSize(12);
                buffer.textAlign(p.CENTER, p.CENTER);
                buffer.text(character.toUpperCase(), imgWidth/2, imgHeight - 20);
                buffer.text(path.split('/').pop().split('.')[0], imgWidth/2, imgHeight - 8);
                
                return buffer;
            };

    try {
        // Converter nome do personagem para formato do arquivo
        const charName = character === 'chun-li' ? 'Chun' : 
                        character === 'ryu' ? 'Ryu' :
                        character === 'ken' ? 'Ken' : 'Makoto';
        
        // Usar caminhos relativos sem a barra inicial
        const idle = await loadImageAsync(`Sprites/${charName} Standing.gif`);
        const walk = await loadImageAsync(`Sprites/${charName} Walking.gif`);
        const punch = await loadImageAsync(`Sprites/${charName} Punch.gif`);
        const special = await loadImageAsync(`Sprites/${charName} Special.gif`);
        const jump = await loadImageAsync(`Sprites/${charName} Jump.gif`);
        const crouch = await loadImageAsync(`Sprites/${charName} Crouch.gif`);
        const block = await loadImageAsync(`Sprites/${charName} Block.gif`);
        const damage = await loadImageAsync(`Sprites/${charName} Damage.gif`);
        
        // Carregar as novas sprites
        const intro = await loadImageAsync(`Sprites/${charName} Intro.gif`);
        const win = await loadImageAsync(`Sprites/${charName} Win.gif`);
        const lost = await loadImageAsync(`Sprites/${charName} Lost.gif`);
        const walkBack = await loadImageAsync(`Sprites/${charName} WalkBack.gif`);
        
        // Carregar Super específico para cada personagem
        let superAttack = null;
        if (character === 'ryu' || character === 'ken' || character === 'chun-li' || character === 'makoto') {
            superAttack = await loadImageAsync(`Sprites/${charName} Super.gif`);
        }
        
        // Verificar se as sprites têm dimensões válidas
        [idle, walk, punch, special, jump, crouch, block, damage].forEach(sprite => {
            if (sprite.width < 10 || sprite.height < 10) {
                console.warn(`Sprite com dimensões suspeitas: ${sprite.width}x${sprite.height}`);
            }
        });
        
        return {
            idle,
            walk,
            walkBack,
            punch,
            special,
            jump,
            crouch,
            block,
            damage,
            intro,
            win,
            lost,
            super: superAttack
        };
    } catch (error) {
        console.error(`Erro ao carregar sprites para ${character}:`, error);
        return createDefaultSprites(character, p);
    }
}

// Nova função para criar um conjunto completo de sprites padrão
function createDefaultSprites(character, p) {
    const sprites = {};
    const states = ['idle', 'walk', 'walkBack', 'punch', 'special', 'jump', 
                    'crouch', 'block', 'damage', 'intro', 'win', 'lost', 'super'];
    
    states.forEach(state => {
        const buffer = p.createGraphics(96, 110);
        buffer.background(100, 100, 100);
        buffer.fill(200, 200, 200);
        buffer.textSize(14);
        buffer.textAlign(p.CENTER, p.CENTER);
        buffer.text(`${character}`, buffer.width/2, buffer.height/2 - 20);
        buffer.text(`${state}`, buffer.width/2, buffer.height/2 + 20);
        
        sprites[state] = buffer;
    });
    
    return sprites;
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
            window.effects = [];
            window.keyState = {}; // Para rastreamento de teclas
    
            // Função p5.js para keyPressed
            p.keyPressed = function() {
                // Atualizar o estado das teclas diretamente
                window.keyState[p.keyCode] = true;
                
                // Tecla ESC (27) para pausar o jogo
                if (p.keyCode === 27) {
                    window.gamePaused = !window.gamePaused;
                    console.log("Jogo pausado:", window.gamePaused);
                }
                
                // Retornar false para prevenir comportamento padrão do navegador
                return false;
            };
            
            // Função p5.js para keyReleased
            p.keyReleased = function() {
                window.keyState[p.keyCode] = false;
                return false;
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
                backgrounds = []; // Reset array

                for (let i = 1; i <= 6; i++) {
                    try {
                        const bgPath = `/Sprites/BG${i}.gif`;
                        console.log(`Tentando carregar background: ${bgPath}`);
                        
                        const bg = await new Promise((resolve) => {
                            p.loadImage(
                                bgPath,
                                img => {
                                    console.log(`Background ${i} carregado com sucesso`);
                                    resolve(img);
                                },
                                () => {
                                    console.error(`Erro ao carregar BG${i}.gif`);
                                    // Criar um background de fallback
                                    const fallbackBg = p.createGraphics(800, 450);
                                    fallbackBg.background(60);
                                    fallbackBg.fill(100);
                                    fallbackBg.noStroke();
                                    
                                    // Grade de fundo
                                    for (let x = 0; x < 800; x += 40) {
                                        for (let y = 0; y < 400; y += 40) {
                                            if ((x + y) % 80 === 0) {
                                                fallbackBg.rect(x, y, 40, 40);
                                            }
                                        }
                                    }
                                    
                                    // Piso
                                    fallbackBg.fill(120);
                                    fallbackBg.rect(0, 400, 800, 50);
                                    
                                    // Texto
                                    fallbackBg.fill(200);
                                    fallbackBg.textSize(24);
                                    fallbackBg.textAlign(p.CENTER, p.CENTER);
                                    fallbackBg.text("STREET FIGHTER", 400, 50);
                                    
                                    resolve(fallbackBg);
                                }
                            );
                        });
                        
                        if (bg) backgrounds.push(bg);
                    } catch (e) {
                        console.error(`Erro ao carregar background ${i}:`, e);
                    }
                }
                
                // Se nenhum background foi carregado, criar um padrão
                if (backgrounds.length === 0) {
                    console.log("Criando background padrão");
                    const defaultBg = p.createGraphics(800, 450);
                    defaultBg.background(40);
                    defaultBg.fill(60);
                    
                    // Padrão de grade
                    for (let x = 0; x < 800; x += 20) {
                        for (let y = 0; y < 450; y += 20) {
                            if ((x + y) % 40 === 0) {
                                defaultBg.rect(x, y, 20, 20);
                            }
                        }
                    }
                    
                    backgrounds.push(defaultBg);
                }
                
                // Garantir que temos um background selecionado
                selectedBg = backgrounds[0];
                
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
                    
                    // IMPORTANTE: Notificar que o jogo está pronto
                    setupComplete = true;
                    
                    // Garantir que onGameReady seja chamado apenas uma vez
                    if (!gameReadyNotified) {
                        console.log("GameCanvas: Notificando que está pronto");
                        gameReadyNotified = true;
                        setTimeout(() => {
                            handleGameReady();
                        }, 500); // Pequeno delay para garantir que tudo foi processado
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
            
            // Definir estado inicial como 'intro' para ambos os jogadores
            player1.currentState = 'intro';
            player2.currentState = 'intro';

            // Criar um timer para mudar para o estado 'idle' após a animação
            setTimeout(() => {
                if (player1.currentState === 'intro') player1.currentState = 'idle';
                if (player2.currentState === 'intro') player2.currentState = 'idle';
            }, 3000); // Ajuste este tempo de acordo com a duração da sua animação de intro

            // Após criar o canvas e antes de iniciar o carregamento dos outros recursos
            // Inicializar uiSprites como um objeto vazio
            uiSprites = {
                pauseButton: null,
                continueButton: null,
                exitButton: null
            };
            
            // Tentar carregar os sprites de UI
            try {
                uiSprites.pauseButton = await new Promise((resolve) => {
                    p.loadImage('/Sprites/UI/PauseButton.png', 
                        img => resolve(img), 
                        () => resolve(null));
                });
                
                uiSprites.continueButton = await new Promise((resolve) => {
                    p.loadImage('/Sprites/UI/ContinueButton.png', 
                        img => resolve(img), 
                        () => resolve(null));
                });
                
                uiSprites.exitButton = await new Promise((resolve) => {
                    p.loadImage('/Sprites/UI/ExitButton.png', 
                        img => resolve(img), 
                        () => resolve(null));
                });
            } catch (e) {
                console.error("Erro ao carregar sprites de UI:", e);
                // Manter os valores como null em caso de falha
            }
            
            // Sistema de áudio simplificado
            let bgMusicElement = null;
    
            try {
                bgMusicElement = await preloadSound('./Sprites/Music.mp3');
                
                // Adicione um botão de áudio para resolver a política de autoplay
                const audioButton = document.createElement('button');
                audioButton.innerHTML = '🔊 Ativar Som';
                audioButton.style.position = 'absolute';
                audioButton.style.top = '10px';
                audioButton.style.left = '10px';
                audioButton.style.zIndex = '1000';
                audioButton.style.padding = '5px 10px';
                audioButton.style.background = '#333';
                audioButton.style.color = '#fff';
                audioButton.style.border = 'none';
                audioButton.style.borderRadius = '5px';
                audioButton.style.cursor = 'pointer';
                
                audioButton.onclick = () => {
                    if (bgMusicElement) {
                        bgMusicElement.play();
                        audioButton.remove();
                    }
                };
                
                document.body.appendChild(audioButton);
                
                // Expor o elemento de áudio globalmente
                window.bgMusic = bgMusicElement;
            } catch (error) {
                console.error("Erro ao configurar áudio:", error);
            }
        };
        
        p.draw = function() {
            // Verificação básica de inicialização
            if (!setupComplete || !player1 || !player2) {
                // Mostrar apenas um indicador simples de carregamento 
                p.background(0);
                return;
            }
            
            try {
                // Sincronizar variáveis
                player1 = window.player1 || player1;
                player2 = window.player2 || player2;
                gamePaused = window.gamePaused;
                exitRequested = window.exitRequested;
                
                // Se o jogador solicitou sair, chamar onGameEnd
                if (exitRequested && typeof onGameEnd === 'function') {
                    console.log("Saindo do jogo via menu de pausa");
                    onGameEnd('exit');
                    window.exitRequested = false;
                    return;
                }
                
                // Garantir valores válidos
                if (isNaN(player1.x)) player1.x = 200;
                if (isNaN(player1.y)) player1.y = 400;
                if (isNaN(player2.x)) player2.x = 600;
                if (isNaN(player2.y)) player2.y = 400;
                
                // Desenhar fundo
                if (selectedBg) {
                    p.image(selectedBg, 0, 0, p.width, p.height);
                } else {
                    p.background(80);
                }
                
                // APENAS ATUALIZA SE O JOGO NÃO ESTIVER PAUSADO
                if (!gamePaused) {
                    // Atualizar jogadores
                    player1.update(player2);
                    player2.update(player1);
                    
                    // Atualizar projéteis
                    if (window.projectiles && window.projectiles.length > 0) {
                        for (let i = window.projectiles.length - 1; i >= 0; i--) {
                            window.projectiles[i].update();
                            if (window.projectiles[i].isOffScreen()) {
                                window.projectiles.splice(i, 1);
                            }
                        }
                    }
                }
                
                // Sempre renderizar (mesmo pausado, para manter a visualização)
                player1.display();
                player2.display();
                
                // Desenhar projéteis
                if (window.projectiles && window.projectiles.length > 0) {
                    for (let i = 0; i < window.projectiles.length; i++) {
                        window.projectiles[i].display();
                    }
                }
                
                // Atualizar e desenhar efeitos visuais
                updateAndDrawEffects();
                
                // Desenhar HUD
                drawGameHUD();
                
                // Desenhar menu de pausa se o jogo estiver pausado
                if (gamePaused) {
                    drawPauseMenu();
                }
                
                // Verificar tecla SPACE separadamente para encerrar o jogo
                if (window.keyState[32] && window.gameOver) { // 32 = SPACE
                    console.log("Tecla espaço pressionada no game over");
                    if (!window.spaceProcessed) {
                        window.spaceProcessed = true;
                        restartMatch(); // Recarregar sprites e recriar jogadores
                        if (typeof onGameEnd === 'function') {
                            onGameEnd(window.winner);
                        }
                    }
                } else {
                    window.spaceProcessed = false;
                }
                
            } catch (error) {
                console.error("Erro durante a renderização:", error);
            }
        };
        
        p.mousePressed = function() {
            // Se o jogo estiver pausado, verificar cliques nos botões do menu
            if (window.gamePaused) {
                // Botão continue
                const btnContinueX = p.width/2;
                const btnContinueY = p.height/2;
                const btnWidth = 200;
                const btnHeight = 50;
                
                // Verificar clique no botão continue
                if (p.mouseX > btnContinueX - btnWidth/2 && 
                    p.mouseX < btnContinueX + btnWidth/2 && 
                    p.mouseY > btnContinueY - btnHeight/2 && 
                    p.mouseY < btnContinueY + btnHeight/2) {
                    window.gamePaused = false;
                    return false; // Impedir eventos adicionais
                }
                
                // Botão exit
                const btnExitX = p.width/2;
                const btnExitY = p.height/2 + 70;
                
                // Verificar clique no botão exit
                if (p.mouseX > btnExitX - btnWidth/2 && 
                    p.mouseX < btnExitX + btnWidth/2 && 
                    p.mouseY > btnExitY - btnHeight/2 && 
                    p.mouseY < btnExitY + btnHeight/2) {
                    window.exitRequested = true;
                    return false; // Impedir eventos adicionais
                }
            }
            
            // Se o jogo acabou, verificar clique para reiniciar
            if (window.gameOver) {
                // Área central da tela
                if (p.mouseX > p.width/2 - 150 && 
                    p.mouseX < p.width/2 + 150 && 
                    p.mouseY > p.height/2 - 50 && 
                    p.mouseY < p.height/2 + 50) {
                    if (typeof onGameEnd === 'function') {
                        onGameEnd(window.winner);
                    }
                    return false;
                }
            }
            
            return true; // Permitir eventos padrão para outros cliques
        };
        
        function updateAndDrawEffects() {
            if (!window.effects) window.effects = [];
            
            // Atualizar e desenhar efeitos
            for (let i = window.effects.length - 1; i >= 0; i--) {
                const effect = window.effects[i];
                
                // Atualizar tempo de vida
                effect.timer--;
                
                // Restaurar configurações padrão antes de cada efeito
                p.push();
                p.strokeWeight(1); // Restaurar espessura do contorno padrão
                p.stroke(0);       // Restaurar cor do contorno padrão
        
                // Usar transparência baseada no timer
                const opacity = p.map(effect.timer, 30, 0, 255, 0);
                
                // Calcular tamanho baseado no timer e efeito específico
                const size = effect.type === 'hit' ? 
                            p.map(effect.timer, 15, 0, effect.size * 0.5, effect.size * 1.5) : 
                            effect.size * (1 + (1 - effect.timer/30) * 0.5);
                
                switch(effect.type) {
                    case 'hit':
                        p.fill(255, 200, 0, opacity);
                        p.noStroke();
                        p.ellipse(effect.x, effect.y, size, size);
                        break;
                        
                    case 'block':
                        p.fill(100, 100, 255, opacity);
                        p.noStroke();
                        for (let j = 0; j < 8; j++) {
                            const angle = j * Math.PI / 4;
                            const x = effect.x + Math.cos(angle) * size/2;
                            const y = effect.y + Math.sin(angle) * size/2;
                            p.ellipse(x, y, size/4, size/4);
                        }
                        break;
                        
                    case 'special':
                        // Efeito de ataque especial
                        p.noFill();
                        p.stroke(255, 150, 0, opacity);
                        p.strokeWeight(3);
                        p.ellipse(effect.x, effect.y, size, size);
                        p.stroke(255, 200, 0, opacity * 0.7);
                        p.ellipse(effect.x, effect.y, size * 0.7, size * 0.7);
                        break;
                        
                    case 'kamehameha':
                        // Implementação do efeito kamehameha que já foi definido
                        // Restaurar os contornos quando necessário
                        // ... código existente do kamehameha ...
                        break;
                        
                    case 'fire':
                        p.noStroke();
                        
                        // Desenha várias camadas de fogo com cores diferentes
                        for (let j = 0; j < 3; j++) {
                            const flameSize = size * (1 - j * 0.2);
                            
                            if (j === 0) p.fill(255, 100, 0, opacity * 0.8);
                            else if (j === 1) p.fill(255, 160, 0, opacity * 0.6);
                            else p.fill(255, 220, 50, opacity * 0.5);
                            
                            p.beginShape();
                            for (let a = 0; a < p.TWO_PI; a += 0.2) {
                                const noise = p.noise(a * 2, effect.timer * 0.1) * 0.5 + 0.5;
                                const flameRadius = flameSize * noise;
                                const fx = effect.x + Math.cos(a) * flameRadius;
                                const fy = effect.y + Math.sin(a) * flameRadius * 1.2;
                                p.vertex(fx, fy);
                            }
                            p.endShape(p.CLOSE);
                        }
                        break;
                        
                    case 'aura':
                        p.noFill();
                        
                        const pulseSize = 1 + Math.sin(effect.timer * 0.2) * 0.2;
                        
                        for (let j = 0; j < 4; j++) {
                            const strokeWeight = 5 - j;
                            const auraSize = size * (0.7 + j * 0.2) * pulseSize;
                            
                            p.stroke(255, 200 - j * 40, 0, opacity * (1 - j * 0.2));
                            p.strokeWeight(strokeWeight);
                            p.ellipse(effect.x, effect.y, auraSize, auraSize);
                        }
                        
                        // Linhas de energia irradiando
                        p.strokeWeight(2);
                        for (let j = 0; j < 12; j++) {
                            const angle = j * p.TWO_PI / 12;
                            const rayLength = size * 0.6 * pulseSize;
                            const outerLength = size * 0.9 * pulseSize;
                            p.stroke(255, 200, 0, opacity * 0.7);
                            p.line(
                                effect.x + Math.cos(angle) * rayLength, 
                                effect.y + Math.sin(angle) * rayLength,
                                effect.x + Math.cos(angle) * outerLength, 
                                effect.y + Math.sin(angle) * outerLength
                            );
                        }
                        break;
                        
                    case 'miss':
                        p.fill(255, 255, 255, opacity * 0.7);
                        p.noStroke();
                        p.textSize(16);
                        p.textAlign(p.CENTER);
                        p.text("miss", effect.x, effect.y);
                        break;
                        
                    // Dentro da função updateAndDrawEffects, adicione estes novos casos ao switch:

                    // Para Chun-Li (Lightning Legs)
                    case 'lightning-kick':
                        // Múltiplos chutes rápidos com efeito elétrico
                        p.noStroke();
                        
                        // Partículas de impacto em alta velocidade
                        for (let i = 0; i < 12; i++) {
                            const kickAngle = p.random(0, p.PI);
                            const kickDist = p.random(10, 40);
                            const xOffset = Math.cos(kickAngle) * kickDist * effect.direction;
                            const yOffset = Math.sin(kickAngle) * kickDist;
                            
                            // Cores roxas/azuis para eletricidade
                            p.fill(180 + p.random(-30, 30), 100 + p.random(-30, 30), 255, opacity * p.random(0.3, 0.9));
                            
                            // Traços de chutes
                            const particleSize = p.random(5, 15);
                            p.ellipse(
                                effect.x + xOffset, 
                                effect.y + yOffset, 
                                particleSize, 
                                particleSize
                            );
                        }
                        
                        // Padrão elétrico em volta dos chutes
                        p.stroke(200, 100, 255, opacity * 0.7);
                        p.strokeWeight(2);
                        
                        for (let j = 0; j < 8; j++) {
                            const start = p.random(0, p.TWO_PI);
                            const len = p.random(20, 40);
                            const branches = 3;
                            
                            for (let b = 0; b < branches; b++) {
                                const ang = start + (b * p.TWO_PI / branches) + p.sin(p.frameCount * 0.3) * 0.2;
                                let x1 = effect.x;
                                let y1 = effect.y;
                                
                                // Desenhar linha de eletricidade com segmentos
                                for (let s = 0; s < 3; s++) {
                                    const x2 = x1 + Math.cos(ang + p.random(-0.5, 0.5)) * (len / 3) * effect.direction;
                                    const y2 = y1 + Math.sin(ang + p.random(-0.5, 0.5)) * (len / 3);
                                    
                                    p.line(x1, y1, x2, y2);
                                    x1 = x2;
                                    y1 = y2;
                                }
                            }
                        }
                        break;
                        
                    // Para Makoto (Kaiju Beam)
                    case 'kaiju-beam':
                        // Beam verde estilo kaiju/energia da natureza
                        p.push();
                        
                        // Direção do beam
                        const beamDirection = effect.direction || 1;
                        
                        // Progresso da animação
                        const beamProgress = 1 - (effect.timer / effect.initialTimer);
                        const beamGrowth = p.pow(beamProgress, 2) * 6;
                        
                        // Tamanho base do raio
                        const beamBaseLength = effect.size;
                        const beamLength = beamBaseLength + (beamBaseLength * 10 * beamGrowth);
                        const beamWidth = effect.size * (0.9 - beamProgress * 0.3);
                        
                        // Posição final do raio
                        const beamEndX = effect.x + (beamLength * beamDirection);
                        
                        // Cor verde para Makoto
                        const coreGreen = [30, 220, 100];
                        const outerGreen = [10, 150, 50];
                        
                        // Ajustar opacidade
                        const beamAlpha = effect.timer < 10 ? opacity * (effect.timer/10) : opacity;
                        
                        // Aura externa verde
                        for (let i = 0; i < 3; i++) {
                            const glowSize = beamWidth * (1.5 + i * 0.5);
                            const glowAlpha = beamAlpha * (0.3 - i * 0.1);
                            
                            p.fill(outerGreen[0], outerGreen[1], outerGreen[2], glowAlpha);
                            p.noStroke();
                            
                            // Desenhar o beam com noise para parecer energia orgânica
                            p.beginShape();
                            
                            // Parte superior do raio
                            for (let j = 0; j <= 20; j++) {
                                const ratio = j / 20;
                                const xPos = p.lerp(effect.x, beamEndX, ratio);
                                
                                // Turbulência orgânica nas bordas
                                const turbulence = p.noise(ratio * 10, p.frameCount * 0.05) * 15;
                                const widthMod = ratio < 0.2 ? ratio / 0.2 : 
                                             ratio > 0.8 ? (1 - ratio) / 0.2 : 1;
                                
                                const yPos = effect.y - (glowSize * widthMod) / 2 + turbulence;
                                p.vertex(xPos, yPos);
                            }
                            
                            // Parte inferior do raio
                            for (let j = 20; j >= 0; j--) {
                                const ratio = j / 20;
                                const xPos = p.lerp(effect.x, beamEndX, ratio);
                                
                                const turbulence = p.noise(ratio * 10 + 100, p.frameCount * 0.05) * 15;
                                const widthMod = ratio < 0.2 ? ratio / 0.2 : 
                                             ratio > 0.8 ? (1 - ratio) / 0.2 : 1;
                                
                                const yPos = effect.y + (glowSize * widthMod) / 2 + turbulence;
                                p.vertex(xPos, yPos);
                            }
                            
                            p.endShape(p.CLOSE);
                        }
                        
                        // Núcleo verde brilhante
                        p.fill(coreGreen[0], coreGreen[1], coreGreen[2], beamAlpha);
                        p.noStroke();
                        p.beginShape();
                        
                        // Desenhar núcleo com padrão de ondas
                        for (let i = 0; i <= 20; i++) {
                            const ratio = i / 20;
                            const xPos = p.lerp(effect.x, beamEndX, ratio);
                            
                            const wave = p.sin(ratio * 15 + p.frameCount * 0.2) * 5;
                            const widthMod = ratio < 0.2 ? ratio / 0.2 : 
                                         ratio > 0.8 ? (1 - ratio) / 0.2 : 1;
                            
                            const yPos = effect.y - (beamWidth * widthMod) / 2 + wave;
                            p.vertex(xPos, yPos);
                        }
                        
                        // Parte inferior
                        for (let i = 20; i >= 0; i--) {
                            const ratio = i / 20;
                            const xPos = p.lerp(effect.x, beamEndX, ratio);
                            
                            const wave = p.sin(ratio * 15 + p.frameCount * 0.2 + p.PI) * 5;
                            const widthMod = ratio < 0.2 ? ratio / 0.2 : 
                                         ratio > 0.8 ? (1 - ratio) / 0.2 : 1;
                            
                            const yPos = effect.y + (beamWidth * widthMod) / 2 + wave;
                            p.vertex(xPos, yPos);
                        }
                        
                        p.endShape(p.CLOSE);
                        
                        // Partículas de folhas/natureza fluindo no raio
                        for (let i = 0; i < 3; i++) {
                            const particlePos = p.lerp(effect.x, beamEndX, p.random(0.1, 0.9));
                            const particleSize = p.random(beamWidth * 0.2, beamWidth * 0.4);
                            
                            // Partículas de "folha"
                            p.fill(100, 255, 150, beamAlpha * p.random(0.5, 1));
                            p.push();
                            p.translate(particlePos, effect.y + p.random(-beamWidth/3, beamWidth/3));
                            p.rotate(p.random(p.TWO_PI));
                            p.ellipse(0, 0, particleSize, particleSize * 1.5);
                            p.pop();
                        }
                        
                        // Efeito de carga na origem
                        const originSize = beamWidth * 1.2 * (1 + p.sin(p.frameCount * 0.2) * 0.1);
                        p.fill(coreGreen[0], coreGreen[1], coreGreen[2], beamAlpha);
                        p.ellipse(effect.x, effect.y, originSize, originSize);
                        
                        // Aura verde na origem
                        p.stroke(100, 255, 150, beamAlpha * 0.7);
                        p.strokeWeight(2);
                        for (let i = 0; i < 8; i++) {
                            const angle = (i * p.PI / 4) + (p.frameCount * 0.03);
                            const rayLen = originSize * 0.8;
                            p.line(
                                effect.x, effect.y,
                                effect.x + p.cos(angle) * rayLen,
                                effect.y + p.sin(angle) * rayLen
                            );
                        }
                        
                        p.pop();
                        break;
                        
                    default:
                        p.fill(255, opacity);
                        p.stroke(200, opacity);
                        p.ellipse(effect.x, effect.y, size, size);
                }
                
                // Restaurar configurações originais
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
                
                // Certifique-se de desenhar as barras de vida e energia
                if (player1) {
                    player1.drawLifeBar(p);
                    player1.drawPowerBar(p);
                }
                
                if (player2) {
                    player2.drawLifeBar(p);
                    player2.drawPowerBar(p);
                }
                
                // Timer central
                p.fill(0, 0, 0, 150);
                p.rect(p.width/2 - 40, 30, 80, 30);
                
                p.fill(255);
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                const displayTime = isNaN(gameTime) ? 99 : gameTime;
                p.text(displayTime, p.width/2, 45);
                
                // Atualizar timer a cada segundo APENAS SE O JOGO NÃO ESTIVER PAUSADO
                if (!gamePaused && !window.gameOver && p.frameCount - lastSecond >= 60) {
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
                
                // Se jogo acabou, mostrar tela de vitória e definir animações
                if (window.gameOver) {
                    p.fill(0, 0, 0, 150); // Fundo semi-transparente em vez de completamente opaco
                    p.rect(0, 0, p.width, p.height);
                    
                    p.fill(255);
                    p.textSize(32);
                    p.textAlign(p.CENTER, p.CENTER);
                    
                    if (window.winner === 'Draw') {
                        p.text("DRAW!", p.width/2, p.height/2 - 50);
                        // Em caso de empate, ninguém ganha ou perde
                    } else {
                        p.text(`${window.winner} WINS!`, p.width/2, p.height/2 - 50);
                        
                        // Definir animações de vitória e derrota
                        if (window.winner === 'Player 1') {
                            if (player1.currentState !== 'win') player1.currentState = 'win';
                            if (player2.currentState !== 'lost') player2.currentState = 'lost';
                        } else {
                            if (player2.currentState !== 'win') player2.currentState = 'win';
                            if (player1.currentState !== 'lost') player1.currentState = 'lost';
                        }
                    }
                    
                    p.textSize(18);
                    p.text("Press SPACE to play again", p.width/2, p.height/2 + 50);
                    
                    // Reiniciar jogo com espaço
                    if (p.keyIsDown(32)) { // 32 é o keyCode para espaço
                        if (typeof onGameEnd === 'function') {
                            onGameEnd(window.winner);
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

        // Adicione esta função antes do setup:
        function checkSpritesLoaded() {
            // Verificar se os sprites essenciais foram carregados
            if (!sprites || 
                !sprites.ryu || !sprites.ryu.idle || 
                !sprites.ken || !sprites.ken.idle) {
                return false;
            }
            
            return true;
        }

        // Adicione esta função dentro do sketchFunction:
        function drawPauseMenu() {
            // Escurecer a tela
            p.fill(0, 0, 0, 180);
            p.rect(0, 0, p.width, p.height);
            
            // Título do menu - usar texto em vez de sprite
            p.fill(255);
            p.textSize(36);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("PAUSE", p.width/2, p.height/2 - 70);
            
            // Botão continue
            const btnContinueX = p.width/2;
            const btnContinueY = p.height/2;
            const btnWidth = 200;
            const btnHeight = 50;
            
            // Verificar mouse hover sobre continue
            const mouseOverContinue = 
                p.mouseX > btnContinueX - btnWidth/2 && 
                p.mouseX < btnContinueX + btnWidth/2 && 
                p.mouseY > btnContinueY - btnHeight/2 && 
                p.mouseY < btnContinueY + btnHeight/2;
            
            // Usar retângulo simples em vez de sprite
            p.fill(mouseOverContinue ? 100 : 50);
            p.rect(btnContinueX - btnWidth/2, btnContinueY - btnHeight/2, btnWidth, btnHeight, 5);
            p.fill(255);
            p.textSize(24);
            p.text("CONTINUE", btnContinueX, btnContinueY + 8);
            
            // Botão exit
            const btnExitX = p.width/2;
            const btnExitY = p.height/2 + 70;
            
            // Verificar mouse hover sobre exit
            const mouseOverExit = 
                p.mouseX > btnExitX - btnWidth/2 && 
                p.mouseX < btnExitX + btnWidth/2 && 
                p.mouseY > btnExitY - btnHeight/2 && 
                p.mouseY < btnExitY + btnHeight/2;
            
            // Usar retângulo simples em vez de sprite
            p.fill(mouseOverExit ? 200 : 100);
            p.rect(btnExitX - btnWidth/2, btnExitY - btnHeight/2, btnWidth, btnHeight, 5);
            p.fill(255);
            p.text("EXIT TO MENU", btnExitX, btnExitY + 8);
            
            // Instruções
            p.textSize(16);
            p.text("Press ESC to resume", p.width/2, p.height - 50);
        }
        
        // Função para reiniciar completamente a partida, recarregando sprites e recriando jogadores
        async function restartMatch() {
            // Recarregar sprites dos personagens selecionados
            let p1Character = selectedCharacters?.player1 || 'ryu';
            let p2Character = selectedCharacters?.player2 || 'ken';
            sprites[p1Character] = await loadSprite(p, p1Character);
            sprites[p2Character] = await loadSprite(p, p2Character);
            // Recriar jogadores com sprites novos
            player1 = new Fighter(
                200,
                450,
                "Player 1",
                [65, 68, 87, 83], // A, D, W, S
                70, // F
                71, // G
                [81], // Q
                [69], // E
                p,
                sprites[p1Character],
                p1Character
            );
            player2 = new Fighter(
                600,
                450,
                "Player 2",
                [37, 39, 38, 40], // Setas
                75, // K
                76, // L
                [73], // I
                [79], // O
                p,
                sprites[p2Character],
                p2Character
            );
            window.player1 = player1;
            window.player2 = player2;
            // Resetar projéteis e efeitos
            window.projectiles = [];
            window.effects = [];
            // Resetar timer e estados globais
            gameTime = 99;
            lastSecond = p.frameCount;
            window.gameOver = false;
            window.winner = null;
            player1.currentState = 'intro';
            player2.currentState = 'intro';
            setTimeout(() => {
                if (player1.currentState === 'intro') player1.currentState = 'idle';
                if (player2.currentState === 'intro') player2.currentState = 'idle';
            }, 3000);
        }
        
        let uiSprites = {}; // Inicialize como objeto vazio
    }, [selectedCharacters, onGameEnd, handleGameReady]);

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
    
    // Adiciona listener global para ESC pausar/despausar
    useEffect(() => {
        function handleEscKey(e) {
            if (e.keyCode === 27) { // ESC
                window.gamePaused = !window.gamePaused;
                e.preventDefault();
            }
        }
        window.addEventListener('keydown', handleEscKey);
        return () => {
            window.removeEventListener('keydown', handleEscKey);
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '800px', height: '450px', margin: '0 auto' }}>
            {/* Canvas do jogo */}
            <div 
                ref={canvasRef}
                tabIndex={0}
                id="game-canvas-container"
                style={{ 
                    outline: 'none',
                    width: '800px',
                    height: '450px',
                    imageRendering: 'pixelated',
                    WebkitImageRendering: 'pixelated',
                    mozImageRendering: 'pixelated',
                    msImageRendering: 'pixelated',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}
            />
            {/* Overlay de loading */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.85)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    fontSize: 28,
                    letterSpacing: 2
                }}>
                    <div style={{marginBottom: 20}}>Carregando...</div>
                    <div className="loader" style={{border: '6px solid #333', borderTop: '6px solid #fff', borderRadius: '50%', width: 48, height: 48, animation: 'spin 1s linear infinite'}}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
                </div>
            )}
        </div>
    );
});

export default GameCanvas;