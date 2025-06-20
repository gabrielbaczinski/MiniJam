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
        // Remover verificações de estado que podem estar bloqueando o movimento
        this.vx = -this.speed;
        this.isFacingLeft = true;
        this.currentState = 'walking';
    }
    
    moveRight() {
        // Remover verificações de estado que podem estar bloqueando o movimento
        this.vx = this.speed;
        this.isFacingLeft = false;
        this.currentState = 'walking';
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
        // Não pode atacar enquanto bloqueia
        if (this.isAttacking || this.isCasting || this.isBlocking || this.currentState === 'intro')
            return;

        this.isAttacking = true;
        this.attackTimer = 20;
        this.currentState = 'punching';
        this.animationTimer = 20;

        let opponent = this.name === 'Player 1' ? window.player2 : window.player1;
        let distance = Math.abs(this.x - opponent.x);
        
        if (distance <= 70) {
            // Ataque direto se estiver próximo
            const knockbackDirection = this.x < opponent.x ? 1 : -1;
            opponent.takeDamage(this.attackPower, knockbackDirection);
            
            // Ganha energia com ataques
            this.power = Math.min(this.powerMax, this.power + 5);
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
        
        // Determinar tipo de projétil baseado no personagem
        const projectileConfig = {
            type: 'hadoken',
            x: this.x + (30 * direction),
            y: this.y - 50,
            vx: speed,
            vy: 0,
            size: 40,
            damage: 15,
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
            damage: 35,
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
            this.power = 0;
            this.currentState = 'special';
            this.actionStartTime = Date.now();
            this.isAttacking = true;
            this.isCasting = true;
            this.castTimer = 40;
            
            // Efeito visual mais intenso
            if (!window.effects) window.effects = [];
            
            // Criar múltiplos efeitos em volta do personagem
            for (let i = 0; i < 3; i++) {
                window.effects.push({
                    x: this.x,
                    y: this.y - 60,
                    type: 'special',
                    timer: 30 + i * 10,
                    size: 80 + i * 40
                });
            }
            
            setTimeout(() => {
                this.isAttacking = false;
                this.isCasting = false;
                if (this.currentState === 'special') {
                    this.currentState = 'idle';
                }
            }, 1000);
            
            let opponent = this.name === 'Player 1' ? window.player2 : window.player1;
            
            if (opponent) {
                // Flash tela
                document.body.style.backgroundColor = "#fff";
                setTimeout(() => document.body.style.backgroundColor = "", 50);
                
                if (opponent.isBlocking) {
                    opponent.takeDamage(20, this.x < opponent.x ? 1 : -1);
                    console.log(`${this.name} acertou um ULTIMATE BLOQUEADO em ${opponent.name}!`);
                } else {
                    opponent.takeDamage(40, this.x < opponent.x ? 1 : -1);
                    console.log(`${this.name} acertou um ULTIMATE em ${opponent.name}!`);
                    
                    // Efeito adicional de impacto no oponente
                    for (let i = 0; i < 5; i++) {
                        window.effects.push({
                            x: opponent.x + (Math.random() * 40 - 20),
                            y: opponent.y - 50 - (Math.random() * 40),
                            type: 'hit',
                            timer: 15 + i * 2,
                            size: 30 + (i * 15)
                        });
                    }
                }
            }
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
                    case 'walking': currentSprite = this.sprites.walk; break;
                    case 'punching': currentSprite = this.sprites.punch; break;
                    case 'special': currentSprite = this.sprites.special; break;
                    case 'jumping': currentSprite = this.sprites.jump; break;
                    case 'crouching': currentSprite = this.sprites.crouch; break;
                    case 'blocking': currentSprite = this.sprites.block; break;
                    case 'damage': currentSprite = this.sprites.damage; break; // Usar sprite de dano
                    default: currentSprite = this.sprites.idle;
                }
            }
            
            // Desenhar o sprite ou um retângulo colorido
            p.push();
            if (currentSprite && currentSprite.width) {
                // Desenhar o sprite se estiver disponível
                const scale = 2;
                const width = currentSprite.width * scale;
                const height = currentSprite.height * scale;
                
                // Verificar valores válidos
                if (!isNaN(width) && !isNaN(height) && !isNaN(this.x) && !isNaN(this.y)) {
                    // Virar o sprite conforme direção
                    if (this.isFacingLeft) {
                        p.translate(this.x, 0);
                        p.scale(-1, 1);
                        p.image(currentSprite, -width/2, this.y - height, width, height);
                    } else {
                        p.image(currentSprite, this.x - width/2, this.y - height, width, height);
                    }
                    
                    // Efeito visual quando leva dano
                    if (this.lastDamageTimer > 0) {
                        // Efeito de pulso vermelho
                        const damageIntensity = p.map(this.lastDamageTimer, 0, 20, 0, 180);
                        
                        // Piscada vermelha que diminui com o tempo
                        if (this.lastDamageTimer % 4 < 2) {
                            p.fill(255, 0, 0, damageIntensity);
                            p.rect(this.x - width/2, this.y - height, width, height);
                        }
                        
                        // Pequeno deslocamento aleatório para efeito de tremor
                        if (this.lastDamageTimer > 10) {
                            const offsetX = Math.random() * 6 - 3;
                            const offsetY = Math.random() * 6 - 3;
                            
                            if (this.isFacingLeft) {
                                p.translate(offsetX, offsetY);
                            } else {
                                p.translate(offsetX, offsetY);
                            }
                        }
                    }
                } else {
                    // Fallback para retângulo
                    const color = this.name === 'Player 1' ? p.color(255, 0, 0) : p.color(0, 0, 255);
                    p.fill(color);
                    p.rect(this.x - 30, this.y - 110, 60, 110);
                }
            } else {
                // Fallback para retângulo
                const color = this.name === 'Player 1' ? p.color(255, 0, 0) : p.color(0, 0, 255);
                p.fill(color);
                p.rect(this.x - 30, this.y - 110, 60, 110);
                
                p.fill(255);
                p.textAlign(p.CENTER);
                p.textSize(12);
                p.text(this.name, this.x, this.y - 120);
                p.text(this.currentState, this.x, this.y - 105);
            }
            p.pop();
            
            // Barras de vida e energia
            this.drawStatusBars();
            
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
        
        // Colisão entre personagens
        if (opponent) {
            const myWidth = 70;
            const minDistance = myWidth * 0.8;
            const distance = Math.abs(this.x - opponent.x);
            
            if (distance < minDistance) {
                const overlap = minDistance - distance;
                const pushDirection = this.x < opponent.x ? -1 : 1;
                
                this.x += pushDirection * overlap / 2.5;
                opponent.x -= pushDirection * overlap / 2.5;
                
                this.x = Math.max(myWidth/2, Math.min(800 - myWidth/2, this.x));
                opponent.x = Math.max(myWidth/2, Math.min(800 - myWidth/2, opponent.x));
            }
            
            // Virar para o oponente
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
    }
}