import React, { useEffect, useCallback } from 'react';
import useP5 from './useP5';
import { Fighter } from '../Classes/Fighter';
import { CHARACTERS } from '../Classes/Characters';
import { Projectile } from '../Classes/Projectile';
import LoadingScreen from './LoadingScreen';

// REMOVA esta linha global:
// let sprites = { ryu: {}, ken: {}, 'chun-li': {}, makoto: {} };

if (typeof window !== 'undefined') {
    if (window._gameKeyDown) window.removeEventListener('keydown', window._gameKeyDown);
    if (window._gameKeyUp) window.removeEventListener('keyup', window._gameKeyUp);
    
    window.keyState = {};
    
    window._gameKeyDown = (e) => {
        window.keyState[e.keyCode] = true;
        
        if ([32, 37, 38, 39, 40, 65, 68, 83, 87, 70, 71, 75, 76, 81, 69, 73, 79, 27].includes(e.keyCode)) {
            e.preventDefault();
        }
    };
    
    window._gameKeyUp = (e) => {
        window.keyState[e.keyCode] = false;
    };
    
    window.addEventListener('keydown', window._gameKeyDown);
    window.addEventListener('keyup', window._gameKeyUp);
    
    window.gamePaused = false;
    window.exitRequested = false;
}

const GameCanvas = React.memo(({ selectedCharacters = { player1: 'ryu', player2: 'ken' }, onGameEnd, onGameReady }) => {
    const [isLoading, setIsLoading] = React.useState(true);

    const handleGameReady = React.useCallback(() => {
        setIsLoading(false);
        if (typeof onGameReady === 'function') onGameReady();
    }, [onGameReady]);

    useEffect(() => {
        return () => {};
    }, []);

    useEffect(() => {
        return () => {
            window.gameOver = false;
            window.winner = null;
            window.gamePaused = false;
            window.exitRequested = false;
            window.projectiles = [];
            window.effects = [];
        };
    }, []);

    React.useEffect(() => {
        const cleanupExtraCanvas = () => {
            const allCanvases = document.querySelectorAll('canvas');
            if (allCanvases.length > 1) {
                for (let i = 1; i < allCanvases.length; i++) {
                    allCanvases[i].remove();
                }
            }
        };
        
        cleanupExtraCanvas();
        
        const checkInterval = setInterval(cleanupExtraCanvas, 5000);
        
        return () => {
            clearInterval(checkInterval);
        };
    }, []);

    const sketchFunction = useCallback((p) => {
        // MOVA para cá:
        let sprites = { ryu: {}, ken: {}, 'chun-li': {}, makoto: {} };
        let assetsLoaded = false;
        let renderReady = false;
        let fadeInCounter = 0;
        let fadeInDuration = 30;
        let gameReadyNotified = false;
        let gamePaused = false;
        let exitRequested = false;

        function preloadSound(url) {
            return new Promise((resolve) => {
                const audioElement = new Audio(url);
                audioElement.volume = 0.5;
                audioElement.addEventListener('canplaythrough', () => { resolve(audioElement); });
                audioElement.addEventListener('error', () => { resolve(null); });
                audioElement.preload = 'auto';
                audioElement.load();
            });
        }

        const config = {
            canvasWidth: 800,
            canvasHeight: 400,
            gravity: 0.6,
            groundLevel: 400,
            gameSpeed: 1,
            debugMode: false
        };

        let player1 = null;
        let player2 = null;
        let setupComplete = false;
        let loadingMessage = "Carregando...";
        let selectedBg = null;
        let backgrounds = [];
        let gameTime = 99;
        let lastSecond = 0;
        
        async function loadSprite(p, character) {
            const loadImageAsync = (path) => {
                let fixedPath = path;
                if (!fixedPath.startsWith('/Sprites/')) {
                    if (fixedPath.startsWith('Sprites/')) {
                        fixedPath = '/' + fixedPath;
                    } else {
                        fixedPath = '/Sprites/' + fixedPath;
                    }
                }
                const cacheBuster = `cb=${Date.now()}_${Math.floor(Math.random()*100000)}`;
                const sep = fixedPath.includes('?') ? '&' : '?';
                const urlWithCacheBuster = `${fixedPath}${sep}${cacheBuster}`;
                return new Promise((resolve) => {
                    p.loadImage(
                        urlWithCacheBuster,
                        img => { resolve(img); },
                        () => {
                            const fallbackImg = createFallbackImage(character, fixedPath);
                            resolve(fallbackImg);
                        }
                    );
                });
            };
            
            const createFallbackImage = (character, path) => {
                const imgWidth = 96;
                const imgHeight = 110;
                const buffer = p.createGraphics(imgWidth, imgHeight);
                let mainColor;
                if (character === 'ryu') {
                    mainColor = p.color(255, 255, 255);
                } else if (character === 'ken') {
                    mainColor = p.color(255, 100, 0);
                } else if (character === 'chun-li') {
                    mainColor = p.color(100, 100, 255);
                } else {
                    mainColor = p.color(0, 200, 100);
                }
                buffer.background(mainColor);
                buffer.fill(0, 0, 0, 150);
                buffer.noStroke();
                buffer.rect(imgWidth/4, imgHeight/6, imgWidth/2, imgHeight*2/3);
                buffer.ellipse(imgWidth/2, imgHeight/4, imgWidth/3, imgHeight/3);
                buffer.fill(0);
                buffer.textSize(12);
                buffer.textAlign(p.CENTER, p.CENTER);
                buffer.text(character.toUpperCase(), imgWidth/2, imgHeight - 20);
                buffer.text(path.split('/').pop().split('.')[0], imgWidth/2, imgHeight - 8);
                return buffer;
            };

    try {
        const charName = character === 'chun-li' ? 'Chun' : 
                        character === 'ryu' ? 'Ryu' :
                        character === 'ken' ? 'Ken' : 'Makoto';
        
        const idle = await loadImageAsync(`Sprites/${charName} Standing.gif`);
        const walk = await loadImageAsync(`Sprites/${charName} Walking.gif`);
        const punch = await loadImageAsync(`Sprites/${charName} Punch.gif`);
        const special = await loadImageAsync(`Sprites/${charName} Special.gif`);
        const jump = await loadImageAsync(`Sprites/${charName} Jump.gif`);
        const crouch = await loadImageAsync(`Sprites/${charName} Crouch.gif`);
        const block = await loadImageAsync(`Sprites/${charName} Block.gif`);
        const damage = await loadImageAsync(`Sprites/${charName} Damage.gif`);
        
        const intro = await loadImageAsync(`Sprites/${charName} Intro.gif`);
        const win = await loadImageAsync(`Sprites/${charName} Win.gif`);
        const lost = await loadImageAsync(`Sprites/${charName} Lost.gif`);
        const walkBack = await loadImageAsync(`Sprites/${charName} WalkBack.gif`);
        
        let superAttack = null;
        if (character === 'ryu' || character === 'ken' || character === 'chun-li' || character === 'makoto') {
            superAttack = await loadImageAsync(`Sprites/${charName} Super.gif`);
        }
        
        [idle, walk, punch, special, jump, crouch, block, damage].forEach(sprite => {
            if (sprite.width < 10 || sprite.height < 10) {}
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
        return createDefaultSprites(character, p);
    }
}

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
            p.createCanvas(800, 450);
            
            const groundLevel = 450;
            
            window.gameOver = false;
            window.winner = null;
            window.projectiles = [];
            window.effects = [];
            window.keyState = {};
    
            p.keyPressed = function() {
                window.keyState[p.keyCode] = true;
                
                if (p.keyCode === 27) {
                    window.gamePaused = !window.gamePaused;
                }
                
                return false;
            };
            
            p.keyReleased = function() {
                window.keyState[p.keyCode] = false;
                return false;
            };
            
            p.noSmooth();
            p.pixelDensity(1);
            
            p.imageMode(p.CORNER);
            
            window.gameScale = Math.min(window.innerWidth / 800, window.innerHeight / 450) * 0.9;
            
            try {
                loadingMessage = "Carregando backgrounds...";
                backgrounds = [];
                for (let i = 1; i <= 6; i++) {
                    try {
                        const bgPath = `/Sprites/BG${i}.gif`;
                        const bg = await new Promise((resolve) => {
                            p.loadImage(
                                bgPath,
                                img => { resolve(img); },
                                () => {
                                    const fallbackBg = p.createGraphics(800, 450);
                                    fallbackBg.background(60);
                                    fallbackBg.fill(100);
                                    fallbackBg.noStroke();
                                    
                                    for (let x = 0; x < 800; x += 40) {
                                        for (let y = 0; y < 400; y += 40) {
                                            if ((x + y) % 80 === 0) {
                                                fallbackBg.rect(x, y, 40, 40);
                                            }
                                        }
                                    }
                                    
                                    fallbackBg.fill(120);
                                    fallbackBg.rect(0, 400, 800, 50);
                                    
                                    fallbackBg.fill(200);
                                    fallbackBg.textSize(24);
                                    fallbackBg.textAlign(p.CENTER, p.CENTER);
                                    fallbackBg.text("STREET FIGHTER", 400, 50);
                                    
                                    resolve(fallbackBg);
                                }
                            );
                        });
                        
                        if (bg) backgrounds.push(bg);
                    } catch (e) {}
                }
                
                if (backgrounds.length === 0) {
                    const defaultBg = p.createGraphics(800, 450);
                    defaultBg.background(40);
                    defaultBg.fill(60);
                    
                    for (let x = 0; x < 800; x += 20) {
                        for (let y = 0; y < 450; y += 20) {
                            if ((x + y) % 40 === 0) {
                                defaultBg.rect(x, y, 20, 20);
                            }
                        }
                    }
                    
                    backgrounds.push(defaultBg);
                }
                
                selectedBg = backgrounds[0];
                
                loadingMessage = "Carregando sprites...";
                sprites.ryu = await loadSprite(p, 'ryu');
                sprites.ken = await loadSprite(p, 'ken');
                sprites['chun-li'] = await loadSprite(p, 'chun-li');
                sprites.makoto = await loadSprite(p, 'makoto');
                
                if (backgrounds.length > 0) {
                    selectedBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                }
                
                loadingMessage = "Inicializando jogadores...";
                try {
                    let p1Character = selectedCharacters?.player1 || 'ryu';
                    let p2Character = selectedCharacters?.player2 || 'ken';
                    
                    const player1Sprites = sprites[p1Character] || await loadSprite(p, p1Character);
                    const player2Sprites = sprites[p2Character] || await loadSprite(p, p2Character);
                    
                    window.projectiles = [];
                    
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
                    
                    player1 = p1;
                    player2 = p2;
                    window.player1 = p1;
                    window.player2 = p2;
                    
                    setupComplete = true;
                    
                    if (!gameReadyNotified) {
                        gameReadyNotified = true;
                        setTimeout(() => {
                            handleGameReady();
                        }, 500);
                    }
                } catch (error) {
                    loadingMessage = "Erro ao carregar! Tente novamente. " + error.message;
                    setupComplete = false;
                }
            } catch (error) {
                loadingMessage = "Erro ao inicializar: " + error.message;
                setupComplete = false;
            }
            
            gameTime = 99;
            lastSecond = p.frameCount;
            
            player1.currentState = 'intro';
            player2.currentState = 'intro';

            setTimeout(() => {
                if (player1.currentState === 'intro') player1.currentState = 'idle';
                if (player2.currentState === 'intro') player2.currentState = 'idle';
            }, 3000);
            
            let bgMusicElement = null;
    
            try {
                bgMusicElement = await preloadSound('./Sprites/Music.mp3');
                
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
                
                window.bgMusic = bgMusicElement;
            } catch (error) {}
        };
        
        p.draw = function() {
            if (!setupComplete || !player1 || !player2) {
                p.background(0);
                return;
            }
            
            try {
                player1 = window.player1 || player1;
                player2 = window.player2 || player2;
                gamePaused = window.gamePaused;
                exitRequested = window.exitRequested;
                
                if (exitRequested && typeof onGameEnd === 'function') {
                    onGameEnd('exit');
                    window.exitRequested = false;
                    return;
                }
                
                if (isNaN(player1.x)) player1.x = 200;
                if (isNaN(player1.y)) player1.y = 400;
                if (isNaN(player2.x)) player2.x = 600;
                if (isNaN(player2.y)) player2.y = 400;
                
                if (selectedBg) {
                    p.image(selectedBg, 0, 0, p.width, p.height);
                } else {
                    p.background(80);
                }
                
                if (!gamePaused) {
                    player1.update(player2);
                    player2.update(player1);
                    
                    if (window.projectiles && window.projectiles.length > 0) {
                        for (let i = window.projectiles.length - 1; i >= 0; i--) {
                            window.projectiles[i].update();
                            if (window.projectiles[i].isOffScreen()) {
                                window.projectiles.splice(i, 1);
                            }
                        }
                    }
                }
                
                player1.display();
                player2.display();
                
                if (window.projectiles && window.projectiles.length > 0) {
                    for (let i = 0; i < window.projectiles.length; i++) {
                        window.projectiles[i].display();
                    }
                }
                
                updateAndDrawEffects();
                drawGameHUD();
                
                if (gamePaused) {
                    drawPauseMenu();
                }
                
                if (window.keyState[32] && window.gameOver) {
                    if (!window.spaceProcessed) {
                        window.spaceProcessed = true;
                        restartMatch();
                        if (typeof onGameEnd === 'function') {
                            onGameEnd(window.winner);
                        }
                    }
                } else {
                    window.spaceProcessed = false;
                }
                
            } catch (error) {}
        };
        
        p.mousePressed = function() {
            if (window.gamePaused) {
                const btnContinueX = p.width/2;
                const btnContinueY = p.height/2;
                const btnWidth = 200;
                const btnHeight = 50;
                
                if (p.mouseX > btnContinueX - btnWidth/2 && 
                    p.mouseX < btnContinueX + btnWidth/2 && 
                    p.mouseY > btnContinueY - btnHeight/2 && 
                    p.mouseY < btnContinueY + btnHeight/2) {
                    window.gamePaused = false;
                    return false;
                }
                
                const btnExitX = p.width/2;
                const btnExitY = p.height/2 + 70;
                
                if (p.mouseX > btnExitX - btnWidth/2 && 
                    p.mouseX < btnExitX + btnWidth/2 && 
                    p.mouseY > btnExitY - btnHeight/2 && 
                    p.mouseY < btnExitY + btnHeight/2) {
                    window.exitRequested = true;
                    return false;
                }
            }
            
            if (window.gameOver) {
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
            
            return true;
        };
        
        function updateAndDrawEffects() {
            if (!window.effects) window.effects = [];
            
            for (let i = window.effects.length - 1; i >= 0; i--) {
                const effect = window.effects[i];
                
                effect.timer--;
                
                p.push();
                p.strokeWeight(1);
                p.stroke(0);
        
                const opacity = p.map(effect.timer, 30, 0, 255, 0);
                
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
                        p.noFill();
                        p.stroke(255, 150, 0, opacity);
                        p.strokeWeight(3);
                        p.ellipse(effect.x, effect.y, size, size);
                        p.stroke(255, 200, 0, opacity * 0.7);
                        p.ellipse(effect.x, effect.y, size * 0.7, size * 0.7);
                        break;
                        
                    case 'kamehameha':
                        break;
                        
                    case 'fire':
                        p.noStroke();
                        
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
                        
                    case 'lightning-kick':
                        p.noStroke();
                        
                        for (let i = 0; i < 12; i++) {
                            const kickAngle = p.random(0, p.PI);
                            const kickDist = p.random(10, 40);
                            const xOffset = Math.cos(kickAngle) * kickDist * effect.direction;
                            const yOffset = Math.sin(kickAngle) * kickDist;
                            
                            p.fill(180 + p.random(-30, 30), 100 + p.random(-30, 30), 255, opacity * p.random(0.3, 0.9));
                            
                            const particleSize = p.random(5, 15);
                            p.ellipse(
                                effect.x + xOffset, 
                                effect.y + yOffset, 
                                particleSize, 
                                particleSize
                            );
                        }
                        
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
                        
                    case 'kaiju-beam':
                        p.push();
                        
                        const beamDirection = effect.direction || 1;
                        const beamProgress = 1 - (effect.timer / effect.initialTimer);
                        const beamGrowth = p.pow(beamProgress, 2) * 6;
                        
                        const beamBaseLength = effect.size;
                        const beamLength = beamBaseLength + (beamBaseLength * 10 * beamGrowth);
                        const beamWidth = effect.size * (0.9 - beamProgress * 0.3);
                        
                        const beamEndX = effect.x + (beamLength * beamDirection);
                        
                        const coreGreen = [30, 220, 100];
                        const outerGreen = [10, 150, 50];
                        
                        const beamAlpha = effect.timer < 10 ? opacity * (effect.timer/10) : opacity;
                        
                        for (let i = 0; i < 3; i++) {
                            const glowSize = beamWidth * (1.5 + i * 0.5);
                            const glowAlpha = beamAlpha * (0.3 - i * 0.1);
                            
                            p.fill(outerGreen[0], outerGreen[1], outerGreen[2], glowAlpha);
                            p.noStroke();
                            p.beginShape();
                            
                            for (let j = 0; j <= 20; j++) {
                                const ratio = j / 20;
                                const xPos = p.lerp(effect.x, beamEndX, ratio);
                                
                                const turbulence = p.noise(ratio * 10, p.frameCount * 0.05) * 15;
                                const widthMod = ratio < 0.2 ? ratio / 0.2 : 
                                             ratio > 0.8 ? (1 - ratio) / 0.2 : 1;
                                
                                const yPos = effect.y - (glowSize * widthMod) / 2 + turbulence;
                                p.vertex(xPos, yPos);
                            }
                            
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
                        
                        p.fill(coreGreen[0], coreGreen[1], coreGreen[2], beamAlpha);
                        p.noStroke();
                        p.beginShape();
                        
                        for (let i = 0; i <= 20; i++) {
                            const ratio = i / 20;
                            const xPos = p.lerp(effect.x, beamEndX, ratio);
                            
                            const wave = p.sin(ratio * 15 + p.frameCount * 0.2) * 5;
                            const widthMod = ratio < 0.2 ? ratio / 0.2 : 
                                         ratio > 0.8 ? (1 - ratio) / 0.2 : 1;
                            
                            const yPos = effect.y - (beamWidth * widthMod) / 2 + wave;
                            p.vertex(xPos, yPos);
                        }
                        
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
                        
                        for (let i = 0; i < 3; i++) {
                            const particlePos = p.lerp(effect.x, beamEndX, p.random(0.1, 0.9));
                            const particleSize = p.random(beamWidth * 0.2, beamWidth * 0.4);
                            
                            p.fill(100, 255, 150, beamAlpha * p.random(0.5, 1));
                            p.push();
                            p.translate(particlePos, effect.y + p.random(-beamWidth/3, beamWidth/3));
                            p.rotate(p.random(p.TWO_PI));
                            p.ellipse(0, 0, particleSize, particleSize * 1.5);
                            p.pop();
                        }
                        
                        const originSize = beamWidth * 1.2 * (1 + p.sin(p.frameCount * 0.2) * 0.1);
                        p.fill(coreGreen[0], coreGreen[1], coreGreen[2], beamAlpha);
                        p.ellipse(effect.x, effect.y, originSize, originSize);
                        
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
                
                p.pop();
                
                if (effect.timer <= 0) {
                    window.effects.splice(i, 1);
                }
            }
        }
        
        function drawGameHUD() {
            try {
                if (isNaN(p.width)) return;
                
                if (player1) {
                    player1.drawLifeBar(p);
                    player1.drawPowerBar(p);
                }
                
                if (player2) {
                    player2.drawLifeBar(p);
                    player2.drawPowerBar(p);
                }
                
                p.fill(0, 0, 0, 150);
                p.rect(p.width/2 - 40, 30, 80, 30);
                
                p.fill(255);
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                const displayTime = isNaN(gameTime) ? 99 : gameTime;
                p.text(displayTime, p.width/2, 45);
                
                if (!gamePaused && !window.gameOver && p.frameCount - lastSecond >= 60) {
                    lastSecond = p.frameCount;
                    if (gameTime > 0) {
                        gameTime--;
                    } else {
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
                
                if (window.gameOver) {
                    p.fill(0, 0, 0, 150);
                    p.rect(0, 0, p.width, p.height);
                    
                    p.fill(255);
                    p.textSize(32);
                    p.textAlign(p.CENTER, p.CENTER);
                    
                    if (window.winner === 'Draw') {
                        p.text("DRAW!", p.width/2, p.height/2 - 50);
                    } else {
                        p.text(`${window.winner} WINS!`, p.width/2, p.height/2 - 50);
                        
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
                    
                    if (p.keyIsDown(32)) {
                        if (typeof onGameEnd === 'function') {
                            onGameEnd(window.winner);
                        }
                    }
                }
                
                drawCharacterIcons();
            } catch (error) {}
        }
        
        function drawCharacterIcons() {
            try {
                if (isNaN(p.width) || !player1 || !player2) return;
                
                const iconSize = 40;
                
                p.fill(255, 0, 0, 100);
                p.rect(10, 30, iconSize, iconSize);
                
                const p2IconX = p.width - 10 - iconSize;
                if (!isNaN(p2IconX)) {
                    p.fill(0, 0, 255, 100);
                    p.rect(p2IconX, 30, iconSize, iconSize);
                }
                
                if (sprites && player1 && player1.character && sprites[player1.character] && sprites[player1.character].idle) {
                    p.image(sprites[player1.character].idle, 10, 30, iconSize, iconSize);
                }
                
                if (sprites && player2 && player2.character && sprites[player2.character] && sprites[player2.character].idle) {
                    p.image(sprites[player2.character].idle, p2IconX, 30, iconSize, iconSize);
                }
            } catch (error) {}
        }
        
        function checkSpritesLoaded() {
            if (!sprites || !sprites.ryu || !sprites.ryu.idle || !sprites.ken || !sprites.ken.idle) {
                return false;
            }
            
            return true;
        }
        
        function drawPauseMenu() {
            p.fill(0, 0, 0, 180);
            p.rect(0, 0, p.width, p.height);
            
            p.fill(255);
            p.textSize(36);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("PAUSE", p.width/2, p.height/2 - 70);
            
            const btnContinueX = p.width/2;
            const btnContinueY = p.height/2;
            const btnWidth = 200;
            const btnHeight = 50;
            
            const mouseOverContinue = 
                p.mouseX > btnContinueX - btnWidth/2 && 
                p.mouseX < btnContinueX + btnWidth/2 && 
                p.mouseY > btnContinueY - btnHeight/2 && 
                p.mouseY < btnContinueY + btnHeight/2;
            
            p.fill(mouseOverContinue ? 100 : 50);
            p.rect(btnContinueX - btnWidth/2, btnContinueY - btnHeight/2, btnWidth, btnHeight, 5);
            p.fill(255);
            p.textSize(24);
            p.text("CONTINUE", btnContinueX, btnContinueY + 8);
            
            const btnExitX = p.width/2;
            const btnExitY = p.height/2 + 70;
            
            const mouseOverExit = 
                p.mouseX > btnExitX - btnWidth/2 && 
                p.mouseX < btnExitX + btnWidth/2 && 
                p.mouseY > btnExitY - btnHeight/2 && 
                p.mouseY < btnExitY + btnHeight/2;
            
            p.fill(mouseOverExit ? 200 : 100);
            p.rect(btnExitX - btnWidth/2, btnExitY - btnHeight/2, btnWidth, btnHeight, 5);
            p.fill(255);
            p.text("EXIT TO MENU", btnExitX, btnExitY + 8);
            
            p.textSize(16);
            p.text("Press ESC to resume", p.width/2, p.height - 50);
        }
        
        async function restartMatch() {
            let p1Character = selectedCharacters?.player1 || 'ryu';
            let p2Character = selectedCharacters?.player2 || 'ken';

            // RECARREGUE os sprites usando a instância p5 atual
            sprites[p1Character] = await loadSprite(p, p1Character);
            sprites[p2Character] = await loadSprite(p, p2Character);

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

            window.projectiles = [];
            window.effects = [];

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
        
        let uiSprites = {};
    }, [selectedCharacters, onGameEnd, handleGameReady]);

    const canvasRef = useP5(sketchFunction);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.focus();
            
            const handleFocus = () => {
                if (canvas) canvas.focus();
            };
            
            document.addEventListener('click', handleFocus);
            return () => {
                document.removeEventListener('click', handleFocus);
            };
        }
    }, [canvasRef]);
    
    useEffect(() => {
        function handleEscKey(e) {
            if (e.keyCode === 27) {
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
                    <LoadingScreen />
                </div>
            )}
        </div>
    );
});

export default GameCanvas;