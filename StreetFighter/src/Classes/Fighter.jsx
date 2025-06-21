import { keyCodeFromKey } from './utils';
import { Projectile } from './Projectile';

export class Fighter {
    constructor(x, y, name, moveKeys, attackKey, blockKey, specialKeys, ultimateKeys, p5Instance, sprites, character) {
        // Posição e física
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 110;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.gravity = 0.6;
        this.onGround = true;
        
        // Status do personagem
        this.life = 100;
        this.maxLife = 100;
        this.power = 0;
        this.powerMax = 100;
        this.name = name;
        
        // Controles
        this.moveKeys = moveKeys;
        this.attackKey = attackKey;
        this.blockKey = blockKey;
        this.specialKeys = specialKeys;
        this.ultimateKeys = ultimateKeys;
        
        // Renderização
        this.p = p5Instance;
        this.sprites = sprites;
        this.character = character;
        
        // Estado atual e flags
        this.currentState = 'idle';
        this.isAttacking = false;
        this.isBlocking = false;
        this.isCasting = false;
        this.isStunned = false;
        this.isFacingLeft = false;
        
        // Timers
        this.actionStartTime = 0;
        this.attackTimer = 0;
        this.castTimer = 0;
        this.stunTimer = 0;
        this.lastDamageTimer = 0;
        this.animationTimer = 0;
        
        // Input tracking
        this.lastKeyPressed = null;
        this.keyHistory = [];
        
        // Dados específicos de personagem
        this.attackPower = character === 'ken' ? 12 : 
                          character === 'ryu' ? 10 : 
                          character === 'chun-li' ? 8 : 15;
        
        // Sequências de teclas para ataques especiais
        this.hadoukenSeq = [moveKeys[3], moveKeys[1], attackKey]; // Baixo, Direita, Ataque
        this.powerSeq = [moveKeys[3], moveKeys[0], attackKey]; // Baixo, Esquerda, Ataque
    }

    // ==== Métodos de movimento básico ====
    
    moveLeft() {
        if (this.currentState === 'idle' || this.currentState === 'walking') {
            this.vx = -this.speed;
            
            // Se estiver virado para a direita, estamos andando para trás
            if (!this.isFacingLeft) {
                this.isWalkingBack = true;
            } else {
                this.isWalkingBack = false;
            }
            
            this.currentState = 'walking';
            
            // Impedir que o personagem saia da tela
            const characterHalfWidth = 35;
            this.x = Math.max(characterHalfWidth, this.x);
        }
    }
    
    moveRight() {
        if (this.currentState === 'idle' || this.currentState === 'walking') {
            this.vx = this.speed;
            
            // Se estiver virado para a esquerda, estamos andando para trás
            if (this.isFacingLeft) {
                this.isWalkingBack = true;
            } else {
                this.isWalkingBack = false;
            }
            
            this.currentState = 'walking';
            
            // Impedir que o personagem saia da tela
            const characterHalfWidth = 35;
            this.x = Math.min(this.p.width - characterHalfWidth, this.x);
        }
    }
    
    jump() {
        if (this.onGround && (this.currentState === 'idle' || this.currentState === 'walking')) {
            this.vy = -15;
            this.onGround = false;
            this.currentState = 'jumping';
        }
    }
    
    crouch() {
        if (this.onGround && !this.isAttacking) {
            this.currentState = 'crouching';
        }
    }
    
    block() {
        if (this.onGround && (this.currentState === 'idle' || this.currentState === 'walking')) {
            this.currentState = 'blocking';
            this.isBlocking = true;
        }
    }

    // ==== Métodos de ataque ====
    
    attack() {
        // Se já estiver atacando ou em outra ação, não permitir novo ataque
        if (this.isAttacking || this.isCasting || this.currentState !== 'idle' && 
            this.currentState !== 'walking') {
            return;
        }
        
        // Iniciar ataque
        this.currentState = 'punching';
        this.actionStartTime = Date.now();
        this.isAttacking = true;
        
        // IMPORTANTE: Zerar a velocidade horizontal para evitar movimento indesejado
        this.vx = 0;
        
        // Temporizador para finalizar o ataque (130ms)
        setTimeout(() => {
            // Verificar se ainda estamos no mesmo estado de ataque
            if (this.currentState === 'punching') {
                this.currentState = 'idle';
            }
            this.isAttacking = false;
        }, 130);
        
        // Verificar hit apenas se o oponente estiver no range
        const opponent = this.name === 'Player 1' ? window.player2 : window.player1;
        
        if (opponent) {
            // Verificar colisão do golpe
            this.checkAttackHit(opponent);
        }
    }
    
    hadouken() {
        if (this.isAttacking || this.isCasting || this.power < 25 || this.currentState === 'intro')
            return;

        this.isCasting = true;
        this.castTimer = 25;
        this.currentState = 'special';
        this.animationTimer = 25;

        // Determinar direção com base no sprite
        const direction = this.isFacingLeft ? -1 : 1;
        const speed = 8 * direction;
        
        // Calcular posição central do personagem
        const centerY = this.y - (this.height / 2); // Centro vertical
        
        // Determinar tipo de projétil baseado no personagem
        const projectileConfig = {
            type: 'hadouken',
            x: this.x, // Usar a posição X central do personagem
            y: centerY, // Usar o centro vertical do personagem
            vx: speed,
            vy: 0,
            size: 40,
            damage: 8, // Reduzido de 15 para 8
            color: [255, 255, 0],
            owner: this,
            isPowerAttack: false,
            p: this.p
        };
        
        // Configurações específicas por personagem
        switch(this.character) {
            case 'ryu':
                projectileConfig.color = [0, 100, 255];
                break;
            case 'ken':
                projectileConfig.color = [255, 100, 0];
                projectileConfig.size = 35;
                projectileConfig.damage = 12;
                break;
            case 'chun-li':
                // Cria múltiplos projéteis para Chun-Li
                for (let i = -1; i <= 1; i++) {
                    window.projectiles.push({
                        ...projectileConfig,
                        y: this.y - 50 + (i * 20),
                        vy: i * 2,
                        size: 25,
                        damage: 8,
                        color: [0, 191, 255]
                    });
                }
                this.power -= 25;
                return; // Retorna para não criar projétil adicional
            case 'makoto':
                projectileConfig.color = [139, 69, 19];
                projectileConfig.vx = speed * 1.5;
                projectileConfig.damage = 18;
                break;
        }
        
        // Adicionar projétil à lista global
        if (!window.projectiles) window.projectiles = [];
        window.projectiles.push(projectileConfig);
        
        // Consumir energia
        this.power -= 25;
    }
    
    powerAttack() {
        if (this.isAttacking || this.isCasting || this.power < this.powerMax || this.currentState === 'intro')
            return;

        this.isCasting = true;
        this.castTimer = 40;
        this.currentState = 'special';
        this.animationTimer = 40;
        
        // Determinar direção com base no sprite
        const direction = this.isFacingLeft ? -1 : 1;
        
        // Projétil base
        const projectileConfig = {
            type: 'power',
            x: this.x + (30 * direction),
            y: this.y - 50,
            vx: direction > 0 ? 5 : -5,
            vy: 0,
            size: 50,
            damage: 20, // Reduzido de 35 para 20
            color: [255, 255, 0],
            owner: this,
            isPowerAttack: true,
            p: this.p
        };
        
        // Configurações específicas por personagem
        switch(this.character) {
            case 'ryu':
                projectileConfig.color = [255, 50, 50];
                break;
            case 'ken':
                projectileConfig.color = [255, 150, 0];
                projectileConfig.size = 60;
                projectileConfig.damage = 40;
                break;
            case 'chun-li':
                projectileConfig.color = [0, 200, 255];
                projectileConfig.size = 40;
                projectileConfig.damage = 30;
                break;
            case 'makoto':
                projectileConfig.color = [139, 69, 19];
                projectileConfig.vx = direction > 0 ? 6 : -6;
                projectileConfig.size = 70;
                projectileConfig.damage = 45;
                break;
        }
        
        // Adicionar projétil à lista global
        if (!window.projectiles) window.projectiles = [];
        window.projectiles.push(projectileConfig);
        
        // Consumir toda a energia
        this.power = 0;
    }

    // ==== Métodos especiais ====
    
    castSpecial() {
        if (this.power >= 30) {
            this.power -= 30;
            this.currentState = 'special';
            this.actionStartTime = Date.now();
            this.isAttacking = true;
            
            // Criar efeito visual no personagem
            if (!window.effects) window.effects = [];
            window.effects.push({
                x: this.x,
                y: this.y - 60,
                type: 'special',
                timer: 30,
                size: 80
            });
            
            setTimeout(() => {
                this.isAttacking = false;
                if (this.currentState === 'special') {
                    this.currentState = 'idle';
                }
            }, 500);
            
            // Criar projétil
            const offsetX = this.isFacingLeft ? -20 : 20;
            const centerY = this.y - 75; 
            
            // Definir cor com base no personagem
            let projectileColor = [255, 200, 0]; // amarelo
            
            switch(this.character) {
                case 'ryu':
                    projectileColor = [0, 100, 255]; // azul
                    break;
                case 'ken':
                    projectileColor = [255, 100, 0]; // laranja
                    break;
                case 'chun-li':
                    projectileColor = [0, 191, 255]; // azul claro
                    break;
                case 'makoto':
                    projectileColor = [139, 69, 19]; // marrom
                    break;
            }
            
            const projectile = new Projectile(
                this.x + offsetX,
                centerY,
                this.isFacingLeft,
                this.p,
                15,
                projectileColor,
                40,
                'hadouken'
            );
            
            if (!window.projectiles) window.projectiles = [];
            window.projectiles.push(projectile);
            
            console.log(`${this.name} usou um ataque especial!`);
        }
    }
    
    castUltimate() {
        if (this.power >= 100) {
            // Consumir toda a energia
            this.power = 0;
            
            // Estado base para animação super
            // O Ken usa a mesma animação 'super' que já está carregada
            this.currentState = 'super';
            this.actionStartTime = Date.now();
            this.isAttacking = true;
            this.isCasting = true;
            this.castTimer = 60;
            
            // Efeitos visuais extras para o Ken
            if (this.character === 'ken') {
                // Adicionar efeitos visuais para o ken usando o sistema de efeitos existente
                if (!window.effects) window.effects = [];
                
                // Direção baseada na orientação do personagem
                const direction = this.isFacingLeft ? -1 : 1;
                
                // Adicionar múltiplos efeitos de fogo ao redor do Ken
                for (let i = 0; i < 8; i++) {
                    window.effects.push({
                        x: this.x + direction * (Math.random() * 60 - 30),
                        y: this.y - 50 - (Math.random() * 60),
                        type: 'fire',
                        timer: 30 + Math.random() * 15,
                        size: 40 + Math.random() * 20
                    });
                }
            }
            
            // Comportamento específico por personagem
            switch (this.character) {
                case 'ryu':
                    // Ryu: Super Hadouken - Uma enorme rajada de energia azul
                    window.effects.push({
                        x: this.x + (direction * 50),
                        y: this.y - 60,
                        type: 'kamehameha',
                        timer: 60,
                        initialTimer: 60,
                        size: 40,
                        character: 'ryu',
                        direction: direction
                    });
                    
                    // Som de energia carregando
                    // Som aqui se tiver sistema de áudio
                    
                    // Timer para checar hit no oponente
                    setTimeout(() => {
                        let opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                        if (opponent) {
                            const isOpponentInDirection = 
                                (direction > 0 && opponent.x > this.x) || 
                                (direction < 0 && opponent.x < this.x);
                            
                            if (isOpponentInDirection) {
                                if (opponent.isBlocking) {
                                    opponent.takeDamage(15, direction);
                            } else {
                                opponent.takeDamage(30, direction);
                                
                                // Screen shake mais forte
                                const canvas = document.querySelector('canvas');
                                if (canvas) {
                                    canvas.style.transition = 'none';
                                    canvas.style.transform = `translateX(${Math.random() * 12 - 6}px)`;
                                    setTimeout(() => {
                                        canvas.style.transition = 'transform 0.2s';
                                        canvas.style.transform = 'translateX(0)';
                                    }, 100);
                                }
                            }
                            }
                        }
                    }, 500);
                    break;
                    
                case 'ken':
                    // Ken: Shoryureppa - Múltiplos uppercuts flamejantes
                    // Estado de animação especial
                    this.currentState = 'special'; // Ken usa a animação special para super
                    
                    // Efeito de chamas
                    for (let i = 0; i < 15; i++) {
                        window.effects.push({
                            x: this.x + (Math.random() * 80 - 40),
                            y: this.y - 40 - (i * 10),
                            type: 'fire',
                            timer: 40 + Math.random() * 20,
                            size: 30 + Math.random() * 20
                        });
                    }
                    
                    // Movimento para cima (o Ken salta enquanto faz o uppercut)
                    this.vy = -15;
                    this.y -= 20; // Salto instantâneo inicial
                    
                    // Verificar hit no oponente após um breve delay
                    setTimeout(() => {
                        let opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                        if (opponent) {
                            // Range para o Shoryureppa (uppercut)
                            const hitRange = 100;
                            const distance = Math.abs(this.x - opponent.x);
                            
                            if (distance < hitRange) {
                                if (opponent.isBlocking) {
                                    opponent.takeDamage(15, direction);
                            } else {
                                // Combo de hits múltiplos
                                for (let i = 0; i < 3; i++) {
                                    setTimeout(() => {
                                        opponent.takeDamage(10, direction);
                                        // Efeito de hit para cada golpe
                                        window.effects.push({
                                            x: opponent.x,
                                            y: opponent.y - 60 - (i * 20),
                                            type: 'hit',
                                            timer: 15,
                                            size: 40
                                        });
                                    }, i * 200);
                                }
                                
                                // Efeito visual de uppercut
                                window.effects.push({
                                    x: opponent.x,
                                    y: opponent.y - 80,
                                    type: 'special',
                                    timer: 30,
                                    size: 60
                                });
                            }
                            }
                        }
                    }, 300);
                    break;
                    
                case 'chun-li':
                    // Chun-Li: Hyakuretsu Kyaku - Lightning Legs (múltiplos chutes)
                    
                    // Definir um timer mais curto para evitar travamento
                    this.castTimer = 40; // Reduzido de 60 para 40
                    
                    // Estado específico para não conflitar com outros
                    this.currentState = 'special'; // Usar 'special' em vez de 'super'
                    
                    window.effects.push({
                        x: this.x + (direction * 40),
                        y: this.y - 50,
                        type: 'lightning-kick',
                        timer: 40, // Reduzido de 50 para 40
                        size: 60,
                        direction: direction
                    });
                    
                    // Criar sequência de hits rápidos
                    const opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                    if (opponent) {
                        const hitRange = 120;
                        const distance = Math.abs(this.x - opponent.x);
                        
                        if (distance < hitRange && 
                            ((direction > 0 && opponent.x > this.x) || 
                             (direction < 0 && opponent.x < this.x))) {
                        
                            // 10 hits rápidos
                            const totalDamage = opponent.isBlocking ? 15 : 30;
                            
                            // Aplicar dano total de uma vez
                            opponent.takeDamage(totalDamage, direction * 0.5);
                            
                            // Efeitos visuais para cada hit
                            for (let i = 0; i < 10; i++) {
                                setTimeout(() => {
                                    window.effects.push({
                                        x: opponent.x + (Math.random() * 40 - 20) * direction,
                                        y: opponent.y - 40 - (Math.random() * 40),
                                        type: 'hit',
                                        timer: 10,
                                        size: 25 + Math.random() * 15
                                    });
                                    
                                    // Pequeno shake a cada hit
                                    const canvas = document.querySelector('canvas');
                                    if (canvas) {
                                        canvas.style.transform = `translateX(${Math.random() * 4 - 2}px)`;
                                        setTimeout(() => {
                                            canvas.style.transform = 'translateX(0)';
                                        }, 50);
                                    }
                                }, i * 100); // Um hit a cada 100ms
                            }
                        }
                    }
                    
                    // IMPORTANTE: Garantir que a Chun-Li volte ao estado normal
                    setTimeout(() => {
                        if (this.currentState === 'special' || this.currentState === 'super') {
                            this.currentState = 'idle';
                            this.isAttacking = false;
                            this.isCasting = false;
                        }
                    }, 500); // Tempo reduzido para 500ms
                    
                    break;
                    
                case 'makoto':
                    // Makoto: Seichusen Godanzuki - Golpe de energia de longo alcance
                    window.effects.push({
                        x: this.x,
                        y: this.y - 60,
                        type: 'kaiju-beam',
                        timer: 60,
                        initialTimer: 60,
                        size: 35,
                        character: 'makoto',
                        direction: direction
                    });
                    
                    // Verificar hit após breve delay
                    setTimeout(() => {
                        const opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                        if (opponent) {
                            const isOpponentInDirection = 
                                (direction > 0 && opponent.x > this.x) || 
                                (direction < 0 && opponent.x < this.x);
                        
                            if (isOpponentInDirection) {
                                if (opponent.isBlocking) {
                                    opponent.takeDamage(15, direction);
                            } else {
                                opponent.takeDamage(30, direction);
                                
                                // Efeito de impacto
                                for (let i = 0; i < 5; i++) {
                                    window.effects.push({
                                        x: opponent.x + (direction * 20),
                                        y: opponent.y - 60,
                                        type: 'hit',
                                        timer: 20,
                                        size: 50 + (i * 10)
                                    });
                                }
                            }
                            }
                        }
                    }, 400);
                    break;
                    
                default:
                    // Fallback para outros personagens - usar Kamehameha genérico
                    window.effects.push({
                        x: this.x + (direction * 50),
                        y: this.y - 60,
                        type: 'kamehameha',
                        timer: 50,
                        initialTimer: 50,
                        size: 30,
                        character: this.character || 'default',
                        direction: direction
                    });
            }
            
            // Finalizar a animação depois de um tempo
            setTimeout(() => {
                this.isAttacking = false;
                this.isCasting = false;
                if (this.currentState === 'super' || this.currentState === 'special') {
                    this.currentState = 'idle';
                }
            }, 1500);
        }
    }

    // ==== Métodos de dano e morte ====
    
    takeDamage(amount, direction) {
        if (isNaN(amount) || amount <= 0) return;
        
        // Aplicar redução de dano se estiver bloqueando
        if (this.isBlocking) {
            amount = amount / 2;
            this.power = Math.min(this.powerMax, this.power + Math.floor(amount / 2));
            this.vx = direction * 5;
            
            // Efeito visual de bloqueio
            if (!window.effects) window.effects = [];
            window.effects.push({
                x: this.x - (direction * 30),
                y: this.y - 60,
                type: 'block',
                timer: 10,
                size: 40
            });
        } else {
            // Knockback mais forte quando não está bloqueando
            this.vx = direction * 10;
            this.isStunned = true;
            this.stunTimer = 15;
            
            // IMPORTANTE: Alterar o estado para 'damage' para mostrar a sprite de dano
            this.currentState = 'damage';
            
            // Definir um timer para quanto tempo a animação de dano será exibida
            this.damageAnimTimer = 20; // 20 frames de animação de dano
            
            // Efeito visual de impacto
            if (!window.effects) window.effects = [];
            window.effects.push({
                x: this.x,
                y: this.y - 60,
                type: 'hit',
                timer: 15,
                size: 50
            });
            
            // Para danos maiores, adicionar efeito extra
            if (amount >= 10) {
                for (let i = 0; i < 3; i++) {
                    window.effects.push({
                        x: this.x + (Math.random() * 40 - 20),
                        y: this.y - 50 - (Math.random() * 30),
                        type: 'hit',
                        timer: 10 + Math.random() * 5,
                        size: 20 + Math.random() * 20
                    });
                }
            }
        }
        
        // Aplicar dano
        this.life = Math.max(0, this.life - amount);
        
        // Configurar timer de efeito visual
        this.lastDamageTimer = amount > 10 ? 20 : 15;
        
        // Verificar morte
        if (this.life <= 0) {
            window.gameOver = true;
            window.winner = this.name === 'Player 1' ? 'Player 2' : 'Player 1';
        }
    }

    // ==== Métodos de verificação de input ====
    
    handleMovement() {
        // Se estiver atacando ou usando especial, não permitir movimento
        if (this.isAttacking || this.isCasting) return;
        
        // Usar window.keyState em vez de p.keyIsDown
    
        // Esquerda (A ou LEFT_ARROW)
        if (window.keyState && window.keyState[this.moveKeys[0]]) {
            this.moveLeft();
        }
        // Direita (D ou RIGHT_ARROW)
        else if (window.keyState && window.keyState[this.moveKeys[1]]) {
            this.moveRight();
        } else if (this.currentState === 'walking') {
            // Se não está se movendo, mas o estado é 'walking', voltar para idle
            this.currentState = 'idle';
        }
        
        // Pular (W ou UP_ARROW)
        if (window.keyState && window.keyState[this.moveKeys[2]] && this.onGround) {
            this.jump();
        }
        
        // Agachar (S ou DOWN_ARROW)
        if (window.keyState && window.keyState[this.moveKeys[3]]) {
            this.crouch();
        } else if (this.currentState === 'crouching') {
            this.currentState = 'idle';
        }
        
        // Ataque (F ou K)
        if (window.keyState && window.keyState[this.attackKey]) {
            this.attack();
        }
        
        // Bloquear (G ou L)
        if (window.keyState && window.keyState[this.blockKey]) {
            this.block();
        } else {
            if (this.currentState === 'blocking') {
                this.currentState = 'idle';
            }
            this.isBlocking = false;
        }
        
        // Debug: imprimir estado das teclas a cada 60 frames
        if (this.p.frameCount % 60 === 0) {
            console.log(`${this.name} - Input state:`, {
                left: window.keyState[this.moveKeys[0]],
                right: window.keyState[this.moveKeys[1]],
                up: window.keyState[this.moveKeys[2]],
                down: window.keyState[this.moveKeys[3]],
                attack: window.keyState[this.attackKey],
                block: window.keyState[this.blockKey]
            });
        }
    }
    
    checkSequence(sequence) {
        if (!sequence || !Array.isArray(sequence)) {
            return false;
        }
        
        let allPressed = true;
        for (let key of sequence) {
            if (!this.p.keyIsDown(keyCodeFromKey(key))) {
                allPressed = false;
                break;
            }
        }
        return allPressed;
    }
    
    updateKeyHistory() {
        if (!this.keyHistory) this.keyHistory = [];
        
        const relevantKeys = [...this.moveKeys, this.attackKey, this.blockKey];
        
        for (const key of relevantKeys) {
            if (window.keyState && window.keyState[key] && 
                (!this.lastKeyPressed || this.lastKeyPressed !== key)) {
                
                this.keyHistory.push(key);
                this.lastKeyPressed = key;
                
                if (this.keyHistory.length > 10) {
                    this.keyHistory.shift();
                }
            } else if (!window.keyState || !window.keyState[key]) {
                this.lastKeyPressed = null;
            }
        }
    }
    
    checkSpecialMoves() {
        // Especial com tecla única (Q ou I)
        if (this.specialKeys && this.specialKeys.length > 0) {
            for (let key of this.specialKeys) {
                if (window.keyState && window.keyState[key]) {
                    this.castSpecial();
                    break;
                }
            }
        }
        
        // Ultimate com tecla única (E ou O)
        if (this.ultimateKeys && this.ultimateKeys.length > 0) {
            for (let key of this.ultimateKeys) {
                if (window.keyState && window.keyState[key]) {
                    this.castUltimate();
                    break;
                }
            }
        }
        
        // Verificar hadouken - Baixo, Direita, Ataque (Down + Right + Attack)
        // Simplificado para verificar teclas simultâneas
        if (window.keyState && 
            window.keyState[this.moveKeys[3]] && // Down
            window.keyState[this.moveKeys[1]] && // Right
            window.keyState[this.attackKey]) {    // Attack
            this.hadouken();
        }
        
        // Verificar power attack - Baixo, Esquerda, Ataque (só se tiver 100% de poder)
        if (this.power >= this.powerMax && 
            window.keyState && 
            window.keyState[this.moveKeys[3]] && // Down
            window.keyState[this.moveKeys[0]] && // Left
            window.keyState[this.attackKey]) {    // Attack
            this.powerAttack();
        }
    }

    // ==== Métodos de renderização ====
    
    display() {
        try {
            const p = this.p;
            if (!p) return;
            
            // Verificar valores NaN
            if (isNaN(this.x) || isNaN(this.y)) {
                console.error("Posição inválida:", this.x, this.y);
                if (isNaN(this.x)) this.x = this.name === "Player 1" ? 200 : 600;
                if (isNaN(this.y)) this.y = 400;
            }
            
            // Determinar qual sprite usar
            let currentSprite = null;
            
            if (this.sprites) {
                switch(this.currentState) {
                    case 'idle': currentSprite = this.sprites.idle; break;
                    case 'walking': currentSprite = this.sprites.walk; break;
                    case 'walkingBack': currentSprite = this.sprites.walkBack || this.sprites.walk; break;
                    case 'punching': currentSprite = this.sprites.punch; break;
                    case 'jumping': currentSprite = this.sprites.jump; break;
                    case 'crouching': currentSprite = this.sprites.crouch; break;
                    case 'blocking': currentSprite = this.sprites.block; break;
                    case 'damage': currentSprite = this.sprites.damage; break;
                    case 'intro': currentSprite = this.sprites.intro || this.sprites.idle; break;
                    case 'win': currentSprite = this.sprites.win || this.sprites.idle; break;
                    case 'lost': currentSprite = this.sprites.lost || this.sprites.damage; break;
                    case 'special': currentSprite = this.sprites.special; break;
                    case 'super': currentSprite = this.sprites.super || this.sprites.special; break;
                    default: currentSprite = this.sprites.idle;
                }
            }
            
            // Se o sprite não existir, use o idle como fallback
            if (!currentSprite && this.sprites && this.sprites.idle) {
                currentSprite = this.sprites.idle;
            }
            
            // Verificar novamente se temos um sprite válido
            if (currentSprite) {
                p.push();
                
                // IMPORTANTE: Escala corrigida para os personagens - aumentar o tamanho
                const spriteScale = 2.5; // Aumentar escala para 2.5x
                
                // Espelhar o sprite se estiver virado para a esquerda
                if (this.isFacingLeft) {
                    p.translate(this.x, this.y);
                    p.scale(-spriteScale, spriteScale);
                    p.image(currentSprite, -currentSprite.width/2, -currentSprite.height);
                } else {
                    p.translate(this.x, this.y);
                    p.scale(spriteScale, spriteScale);
                    p.image(currentSprite, -currentSprite.width/2, -currentSprite.height);
                }
                
                p.pop();
                
                // Debug: desenhar hitbox
                if (window.debugMode) {
                    p.push();
                    p.noFill();
                    p.stroke(255, 0, 0);
                    p.rect(this.x - this.width/2, this.y - this.height, this.width, this.height);
                    p.pop();
                }
            } else {
                // Fallback se não tiver sprite - desenhar um retângulo colorido
                p.push();
                p.fill(this.name === "Player 1" ? p.color(255, 0, 0) : p.color(0, 0, 255));
                p.rect(this.x - 40, this.y - 100, 80, 100);
                p.pop();
            }
            
            // Desenhar barra de vida
            this.drawLifeBar(p);
            
            // Desenhar barra de poder
            this.drawPowerBar(p);
            
        } catch (error) {
            console.error("Erro ao renderizar fighter:", error);
        }
    }
    
    drawStatusBars() {
        const p = this.p;
        if (!p) return;
        
        const isPlayer1 = this.name === "Player 1";
        const barX = isPlayer1 ? 100 : p.width - 300;
        const barY = 50;
        
        // Fundo da barra de vida
        p.fill(50);
        p.rect(barX, barY, 200, 15);
        
        // Barra de vida
        p.fill(isPlayer1 ? p.color(255, 50, 50) : p.color(50, 50, 255));
        p.rect(barX, barY, 200 * (this.life / 100), 15);
        
        // Barra de poder (energia)
        p.fill(50);
        p.rect(barX, barY + 20, 200, 10);
        p.fill(255, 255, 0);
        p.rect(barX, barY + 20, 200 * (this.power / 100), 10);
        
        // Nome do jogador
        p.fill(255);
        p.textSize(14);
        p.textAlign(isPlayer1 ? p.LEFT : p.RIGHT);
        p.text(this.name, isPlayer1 ? barX : barX + 200, barY - 10);
        
        // Efeito visual quando a barra de poder está cheia
        if (this.power >= this.powerMax) {
            const pulseAmount = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 0.8, 1.0);
            p.fill(255, 255, 0, 150);
            p.rect(barX, barY + 20, 200 * pulseAmount, 10);
        }
    }

    drawLifeBar(p) {
      if (!p) return;
      
      const isPlayer1 = this.name === "Player 1";
      const barX = isPlayer1 ? 100 : p.width - 300;
      const barY = 50;
      
      // Fundo da barra de vida
      p.fill(50);
      p.rect(barX, barY, 200, 20, 3);
      
      // Preenchimento da barra de vida
      p.fill(isPlayer1 ? p.color(255, 50, 50) : p.color(50, 50, 255));
      const lifeWidth = Math.max(0, 200 * (this.life / this.maxLife));
      p.rect(barX, barY, lifeWidth, 20, 3);
      
      // Borda da barra de vida
      p.noFill();
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(barX, barY, 200, 20, 3);
      p.noStroke();
      
      // Nome do jogador
      p.fill(255);
      p.textSize(16);
      p.textAlign(isPlayer1 ? p.LEFT : p.RIGHT);
      p.text(this.name, isPlayer1 ? barX : barX + 200, barY - 10);
      
      // Mostrar vida como número
      p.textAlign(p.CENTER);
      p.textSize(14);
      p.text(Math.ceil(this.life) + "%", barX + 100, barY + 14);
    }

    drawPowerBar(p) {
      if (!p) return;
      
      const isPlayer1 = this.name === "Player 1";
      const barX = isPlayer1 ? 100 : p.width - 300;
      const barY = 80;
      
      // Fundo da barra de energia
      p.fill(50);
      p.rect(barX, barY, 200, 10, 3);
      
      // Preenchimento da barra de energia
      const powerFactor = this.power / this.powerMax;
      const powerWidth = Math.min(200, Math.max(0, 200 * powerFactor));
      
      // Mudar cor com base no nível de energia
      if (powerFactor >= 1) {
        // Pronto para ultimate - pulsar
        const pulseAmount = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 0.7, 1);
        p.fill(255, 255, 0, 200 * pulseAmount);
      } else if (powerFactor >= 0.3) {
        // Suficiente para especial
        p.fill(255, 165, 0);
      } else {
        // Não suficiente para especial
        p.fill(200, 200, 200);
      }
      
      p.rect(barX, barY, powerWidth, 10, 3);
      
      // Borda da barra de energia
      p.noFill();
      p.stroke(255);
      p.strokeWeight(1);
      p.rect(barX, barY, 200, 10, 3);
      p.noStroke();
    }

    // ==== Método principal de atualização ====
    
    update(opponent) {
        if (window.gameOver) return;
        
        // Verificar e corrigir valores NaN
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.vx) || isNaN(this.vy)) {
            console.error("Valores NaN detectados:", this.x, this.y, this.vx, this.vy);
            if (isNaN(this.x)) this.x = this.name === "Player 1" ? 200 : 600;
            if (isNaN(this.y)) this.y = 400;
            if (isNaN(this.vx)) this.vx = 0;
            if (isNaN(this.vy)) this.vy = 0;
        }
        
        // Sempre processar os comandos (remover a condição !this.isStunned temporariamente para debug)
        this.handleMovement();
        this.checkSpecialMoves();
        
        // Se estiver stunned, reduzir velocidade
        if (this.isStunned) {
            this.vx *= 0.5;
        }
        
        // Resetar velocidade horizontal
        if (Math.abs(this.vx) < 0.1) {
            this.vx = 0;
            if (this.onGround && this.currentState === 'walking') {
                this.currentState = 'idle';
            }
        }
        
        // Aplicar física
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // Limites da tela
        if (this.x < 50) this.x = 50;
        if (this.x > 750) this.x = 750;
        
        // Colisão com o chão
        if (this.y >= 450) {
            this.y = 450;
            this.vy = 0;
            this.onGround = true;
            if (this.currentState === 'jumping') {
                this.currentState = 'idle';
            }
        }
        
        // Aplicar atrito
        this.vx *= 0.8;
        
        // Atualizar timers
        if (this.attackTimer > 0) {
            this.attackTimer--;
            if (this.attackTimer === 0) {
                this.isAttacking = false;
                if (this.currentState === 'punching') {
                    this.currentState = 'idle';
                }
            }
        }
        
        if (this.castTimer > 0) {
            this.castTimer--;
            if (this.castTimer === 0) {
                this.isCasting = false;
                if (this.currentState === 'special') {
                    this.currentState = 'idle';
                }
            }
        }
        
        if (this.stunTimer > 0) {
            this.stunTimer--;
            if (this.stunTimer === 0) {
                this.isStunned = false;
            }
        }
        
        if (this.lastDamageTimer > 0) {
            this.lastDamageTimer--;
        }
        
        // Atualizar timer da animação de dano
        if (this.damageAnimTimer > 0) {
            this.damageAnimTimer--;
            if (this.damageAnimTimer === 0) {
                // Quando o timer terminar, voltar para o estado idle
                if (this.currentState === 'damage') {
                    this.currentState = 'idle';
                }
            }
        }
        
        // Colisão entre personagens - versão corrigida
        if (opponent) {
            // Usar a largura real dos sprites para uma colisão mais precisa
            const myWidth = this.sprites && this.sprites.idle ? this.sprites.idle.width * 1.3 : 70;
            const oppWidth = opponent.sprites && opponent.sprites.idle ? opponent.sprites.idle.width * 1.3 : 70;
            
            const minDistance = (myWidth + oppWidth) / 3;
            const distance = Math.abs(this.x - opponent.x);
            
            if (distance < minDistance) {
                const overlap = minDistance - distance;
                const pushDirection = this.x < opponent.x ? -1 : 1;
                
                // Empurrar os personagens para evitar sobreposição
                if (!this.isStunned && !opponent.isStunned) {
                    // Distribuir o empurrão igualmente
                    this.x += pushDirection * overlap / 2.5;
                    opponent.x -= pushDirection * overlap / 2.5;
                } else if (this.isStunned && !opponent.isStunned) {
                    // Se este personagem está stunned, ele leva todo o empurrão
                    this.x += pushDirection * overlap;
                } else if (!this.isStunned && opponent.isStunned) {
                    // Se o oponente está stunned, ele leva todo o empurrão
                    opponent.x -= pushDirection * overlap;
                }
                
                // Garantir que os personagens não saiam da tela
                this.x = Math.max(myWidth/2, Math.min(800 - myWidth/2, this.x));
                opponent.x = Math.max(oppWidth/2, Math.min(800 - oppWidth/2, opponent.x));
            }
            
            // Virar para o oponente quando não estiver atacando
            if (!this.isAttacking && !this.isCasting) {
                this.isFacingLeft = opponent.x < this.x;
            }
        }
        
        // Ganhar energia passivamente
        if (!window.gameOver && this.power < this.powerMax && this.p.frameCount % 30 === 0) {
            this.power += 2;
        }
        
        // Atualizar histórico de teclas
        this.updateKeyHistory();
        
        // Mecanismo de segurança - garantir que personagens não fiquem presos em animações
        if (this.isCasting || this.isAttacking) {
            // Se o personagem estiver preso em uma animação por muito tempo
            if (!this._animationSafetyTimer) this._animationSafetyTimer = 0;
            this._animationSafetyTimer++;
            
            // Após 180 frames (3 segundos a 60 FPS), forçar retorno ao estado idle
            if (this._animationSafetyTimer > 180) {
                console.log(`${this.name} travado em animação, forçando reset`);
                this.isAttacking = false;
                this.isCasting = false;
                this.currentState = 'idle';
                this._animationSafetyTimer = 0;
            }
        } else {
            // Resetar o timer quando não estiver em animação
            this._animationSafetyTimer = 0;
        }
    }
    
    // Método para verificar o estado das teclas de forma robusta
    checkInput() {
        if (!this.p || !window.keyState) {
            console.warn(`${this.name} - Não foi possível acessar o estado de teclas`);
            return {
                left: false,
                right: false,
                up: false, 
                down: false,
                attack: false,
                block: false,
                special: false,
                ultimate: false
            };
        }

        // Mapear códigos de tecla para ações
        const inputState = {
            left: window.keyState[this.moveKeys[0]] === true,
            right: window.keyState[this.moveKeys[1]] === true,
            up: window.keyState[this.moveKeys[2]] === true,
            down: window.keyState[this.moveKeys[3]] === true,
            attack: window.keyState[this.attackKey] === true, 
            block: window.keyState[this.blockKey] === true,
            special: this.specialKeys.some(key => window.keyState[key] === true),
            ultimate: this.ultimateKeys.some(key => window.keyState[key] === true)
        };
        
        // Log para depuração
        if (Math.random() < 0.01) { // Log apenas ocasionalmente para não sobrecarregar o console
            console.log(`${this.name} - Input state:`, inputState);
        }
        
        return inputState;
    }
    
    // Modifique o método checkAttackHit para aumentar o alcance
    checkAttackHit(opponent) {
        // Verificar se o oponente está no alcance
        const attackRange = 150 // Aumentado de 70 para 100 (ajuste conforme necessário)
        
        // Calcular distância entre os personagens
        const distance = Math.abs(this.x - opponent.x);
        
        // Determinar se o ataque está na direção correta
        const correctDirection = (this.isFacingLeft && this.x > opponent.x) || 
                                (!this.isFacingLeft && this.x < opponent.x);
        
        // Verificar se o oponente está em range e na direção correta
        if (distance < attackRange && correctDirection) {
            if (opponent.isBlocking) {
                // Criar efeito visual de bloqueio
                if (!window.effects) window.effects = [];
                window.effects.push({
                    x: opponent.x,
                    y: opponent.y - 40,
                    type: 'block',
                    timer: 10,
                    size: 40
                });
                
                // Dar um pequeno knockback mesmo bloqueando
                const knockbackDirection = this.x < opponent.x ? 1 : -1;
                opponent.x += knockbackDirection * 5;
                
                // Pequeno dano mesmo bloqueando (reduzido de 5 para 3)
                opponent.takeDamage(3);
                
                // Aumentar power para ambos
                this.power += 5;
                opponent.power += 10; // Quem bloqueia ganha mais power
            } else {
                // Aplicar dano e knockback completos
                const knockbackDirection = this.x < opponent.x ? 1 : -1;
                
                // Efeito visual de hit
                if (!window.effects) window.effects = [];
                window.effects.push({
                    x: opponent.x - (knockbackDirection * 10),
                    y: opponent.y - 40,
                    type: 'hit',
                    timer: 15,
                    size: 50
                });
                
                // Aplicar dano (reduzido de 20 para 10 pontos)
                opponent.takeDamage(10, knockbackDirection);
                
                // Ganhar power pelo hit
                this.power += 10;
            }
            
            // Feedback de hit através de screen shake
            const canvas = document.querySelector('canvas');
            if (canvas) {
                canvas.style.transition = 'none';
                canvas.style.transform = `translateX(${Math.random() * 5 - 2.5}px) translateY(${Math.random() * 5 - 2.5}px)`;
                setTimeout(() => {
                    canvas.style.transition = 'transform 0.2s';
                    canvas.style.transform = 'translateX(0) translateY(0)';
                }, 50);
            }
        } else {
            // Miss - cria pequeno efeito visual ou som
            if (Math.random() > 0.5) { // 50% chance para reduzir spam de efeitos
                if (!window.effects) window.effects = [];
                window.effects.push({
                    x: this.x + (this.isFacingLeft ? -30 : 30),
                    y: this.y - 40,
                    type: 'miss',
                    timer: 8,
                    size: 20
                });
            }
        }
    }
}

// Substitua a função drawPauseMenu por esta versão mais robusta
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

// Substitua a função updateAndDrawEffects por esta versão:
function updateAndDrawEffects() {
    if (!window.effects) window.effects = [];
    
    // Atualizar e desenhar efeitos usando formas básicas em vez de sprites
    for (let i = window.effects.length - 1; i >= 0; i--) {
        const effect = window.effects[i];
        
        // Atualizar tempo de vida
        effect.timer--;
        
        // Desenhar com base no tipo usando formas básicas
        p.push();
        
        // Usar transparência baseada no timer
        const opacity = p.map(effect.timer, 30, 0, 255, 0);
        
        // Calcular tamanho baseado no timer e efeito específico
        const size = effect.type === 'hit' ? 
                    p.map(effect.timer, 15, 0, effect.size * 0.5, effect.size * 1.5) : 
                    effect.size * (1 + (1 - effect.timer/30) * 0.5);
        
        // Escolher cor baseada no tipo de efeito
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
            default:
                p.fill(255, opacity);
                p.ellipse(effect.x, effect.y, size, size);
        }
        
        p.pop();
        
        // Remover efeitos expirados
        if (effect.timer <= 0) {
            window.effects.splice(i, 1);
        }
    }
}