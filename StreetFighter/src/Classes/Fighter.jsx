import { keyCodeFromKey } from './utils';
import { Projectile } from './Projectile';
export class Fighter {
    constructor(x, y, name, moveKeys, attackKey, blockKey, specialKeys, ultimateKeys, p5Instance, sprites, character) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 110;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.gravity = 0.6;
        this.onGround = true;
        this.life = 100;
        this.maxLife = 100;
        this.power = 0;
        this.powerMax = 100;
        this.name = name;
        this.moveKeys = moveKeys;
        this.attackKey = attackKey;
        this.blockKey = blockKey;
        this.specialKeys = specialKeys;
        this.ultimateKeys = ultimateKeys;
        this.p = p5Instance;
        this.sprites = sprites;
        this.character = character;
        this.currentState = 'idle';
        this.isAttacking = false;
        this.isBlocking = false;
        this.isCasting = false;
        this.isStunned = false;
        this.isFacingLeft = false;
        this.actionStartTime = 0;
        this.attackTimer = 0;
        this.castTimer = 0;
        this.stunTimer = 0;
        this.lastDamageTimer = 0;
        this.animationTimer = 0;
        this.lastKeyPressed = null;
        this.keyHistory = [];
        this.attackPower = character === 'ken' ? 12 : character === 'ryu' ? 10 : character === 'chun-li' ? 8 : 15;
        this.hadoukenSeq = [moveKeys[3], moveKeys[1], attackKey];
        this.powerSeq = [moveKeys[3], moveKeys[0], attackKey];
    }
    moveLeft() {
        if (this.currentState === 'idle' || this.currentState === 'walking') {
            this.vx = -this.speed;
            if (!this.isFacingLeft) {
                this.isWalkingBack = true;
            } else {
                this.isWalkingBack = false;
            }
            this.currentState = 'walking';
            const characterHalfWidth = 35;
            this.x = Math.max(characterHalfWidth, this.x);
        }
    }
    moveRight() {
        if (this.currentState === 'idle' || this.currentState === 'walking') {
            this.vx = this.speed;
            if (this.isFacingLeft) {
                this.isWalkingBack = true;
            } else {
                this.isWalkingBack = false;
            }
            this.currentState = 'walking';
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
    attack() {
        if (this.isAttacking || this.isCasting || this.currentState !== 'idle' && this.currentState !== 'walking') {
            return;
        }
        this.currentState = 'punching';
        this.actionStartTime = Date.now();
        this.isAttacking = true;
        this.vx = 0;
        setTimeout(() => {
            if (this.currentState === 'punching') {
                this.currentState = 'idle';
            }
            this.isAttacking = false;
        }, 130);
        const opponent = this.name === 'Player 1' ? window.player2 : window.player1;
        if (opponent) {
            this.checkAttackHit(opponent);
        }
    }
    hadouken() {
        if (this.isAttacking || this.isCasting || this.power < 25 || this.currentState === 'intro') return;
        this.isCasting = true;
        this.castTimer = 25;
        this.currentState = 'special';
        this.animationTimer = 25;
        const direction = this.isFacingLeft ? -1 : 1;
        const speed = 8 * direction;
        // Projétil centralizado no topo da cabeça
        const projX = this.x;
        const projY = this.y - this.height;
        const projectileConfig = {
            type: 'hadouken',
            x: projX,
            y: projY,
            vx: speed,
            vy: 0,
            size: 40,
            damage: 8,
            color: [255, 255, 0],
            owner: this,
            isPowerAttack: false,
            p: this.p
        };
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
                for (let i = -1; i <= 1; i++) {
                    window.projectiles.push({
                        ...projectileConfig,
                        y: projY + (i * 20),
                        vy: i * 2,
                        size: 25,
                        damage: 8,
                        color: [0, 191, 255]
                    });
                }
                this.power -= 25;
                return;
            case 'makoto':
                projectileConfig.color = [139, 69, 19];
                projectileConfig.vx = speed * 1.5;
                projectileConfig.damage = 18;
                break;
        }
        if (!window.projectiles) window.projectiles = [];
        window.projectiles.push(projectileConfig);
        this.power -= 25;
    }
    powerAttack() {
        if (this.isAttacking || this.isCasting || this.power < this.powerMax || this.currentState === 'intro') return;
        this.isCasting = true;
        this.castTimer = 40;
        this.currentState = 'special';
        this.animationTimer = 40;
        const direction = this.isFacingLeft ? -1 : 1;
        // Projétil centralizado no topo da cabeça
        const projX = this.x;
        const projY = this.y - this.height;
        const projectileConfig = {
            type: 'power',
            x: projX,
            y: projY,
            vx: direction > 0 ? 5 : -5,
            vy: 0,
            size: 50,
            damage: 12,
            color: [255, 255, 0],
            owner: this,
            isPowerAttack: true,
            p: this.p
        };
        switch(this.character) {
            case 'ryu':
                projectileConfig.color = [255, 50, 50];
                break;
            case 'ken':
                projectileConfig.color = [255, 150, 0];
                projectileConfig.size = 60;
                projectileConfig.damage = 20;
                break;
            case 'chun-li':
                projectileConfig.color = [0, 200, 255];
                projectileConfig.size = 40;
                projectileConfig.damage = 15;
                break;
            case 'makoto':
                projectileConfig.color = [139, 69, 19];
                projectileConfig.vx = direction > 0 ? 6 : -6;
                projectileConfig.size = 70;
                projectileConfig.damage = 25;
                break;
        }
        if (!window.projectiles) window.projectiles = [];
        window.projectiles.push(projectileConfig);
        this.power = 0;
    }
    castSpecial() {
        if (this.power >= 30) {
            this.power -= 30;
            this.currentState = 'special';
            this.actionStartTime = Date.now();
            this.isAttacking = true;
            if (!window.effects) window.effects = [];
            window.effects.push({ x: this.x, y: this.y - 60, type: 'special', timer: 30, size: 80 });
            setTimeout(() => {
                this.isAttacking = false;
                if (this.currentState === 'special') {
                    this.currentState = 'idle';
                }
            }, 500);
            // Projétil especial centralizado no topo da cabeça
            const direction = this.isFacingLeft ? -1 : 1;
            const projX = this.x + (direction * 20);
            const projY = this.y - this.height;
            let projectileColor = [255, 200, 0];
            switch(this.character) {
                case 'ryu': projectileColor = [0, 100, 255]; break;
                case 'ken': projectileColor = [255, 100, 0]; break;
                case 'chun-li': projectileColor = [0, 191, 255]; break;
                case 'makoto': projectileColor = [139, 69, 19]; break;
            }
            const projectile = new Projectile(projX, projY, this.isFacingLeft, this.p, 15, projectileColor, 40, 'hadouken');
            if (!window.projectiles) window.projectiles = [];
            window.projectiles.push(projectile);
            // Lógica de colisão igual ao supremo
            setTimeout(() => {
                let opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                if (opponent) {
                    const isOpponentInDirection = (direction > 0 && opponent.x > this.x) || (direction < 0 && opponent.x < this.x);
                    const hitRange = 100;
                    const distance = Math.abs(this.x - opponent.x);
                    // Ajuste: colisão no topo da sprite
                    const yDiff = Math.abs((this.y - this.height) - (opponent.y - opponent.height));
                    if (distance < hitRange && isOpponentInDirection && yDiff < 60) {
                        if (opponent.isBlocking) {
                            opponent.takeDamage(8, direction);
                        } else {
                            opponent.takeDamage(15, direction);
                            const canvas = document.querySelector('canvas');
                            if (canvas) {
                                canvas.style.transition = 'none';
                                canvas.style.transform = `translateX(${Math.random() * 8 - 4}px)`;
                                setTimeout(() => {
                                    canvas.style.transition = 'transform 0.2s';
                                    canvas.style.transform = 'translateX(0)';
                                }, 100);
                            }
                        }
                    }
                }
            }, 300);
        }
    }
    castUltimate() {
        if (this.power >= 100) {
            this.power = 0;
            this.currentState = 'super';
            this.actionStartTime = Date.now();
            this.isAttacking = true;
            this.isCasting = true;
            this.castTimer = 60;
            const direction = this.isFacingLeft ? -1 : 1;
            if (this.character === 'ken') {
                if (!window.effects) window.effects = [];
                for (let i = 0; i < 8; i++) {
                    window.effects.push({ x: this.x + direction * (Math.random() * 60 - 30), y: this.y - 50 - (Math.random() * 60), type: 'fire', timer: 30 + Math.random() * 15, size: 40 + Math.random() * 20 });
                }
            }
            switch (this.character) {
                case 'ryu':
                    // Super do Ryu: lança um projétil gigante
                    const superProjRyu = new Projectile(
                        this.x + (direction * 60),
                        this.y - this.height,
                        this.isFacingLeft,
                        this.p,
                        30,
                        [0, 100, 255],
                        100,
                        'hadouken'
                    );
                    superProjRyu.owner = this;
                    if (!window.projectiles) window.projectiles = [];
                    window.projectiles.push(superProjRyu);
                    window.effects.push({ x: this.x + (direction * 50), y: this.y - 60, type: 'kamehameha', timer: 60, initialTimer: 60, size: 40, character: 'ryu', direction: direction });
                    setTimeout(() => {
                        let opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                        if (opponent) {
                            const isOpponentInDirection = (direction > 0 && opponent.x > this.x) || (direction < 0 && opponent.x < this.x);
                            const hitRange = 100;
                            const distance = Math.abs(this.x - opponent.x);
                            // Ajuste: colisão no topo da sprite
                            const yDiff = Math.abs((this.y - this.height) - (opponent.y - opponent.height));
                            if (distance < hitRange && isOpponentInDirection && yDiff < 60) {
                                if (opponent.isBlocking) {
                                    opponent.takeDamage(15, direction);
                                } else {
                                    opponent.takeDamage(30, direction);
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
                    for (let i = 0; i < 15; i++) {
                        window.effects.push({ x: this.x + (Math.random() * 80 - 40), y: this.y - 40 - (i * 10), type: 'fire', timer: 40 + Math.random() * 20, size: 30 + Math.random() * 20 });
                    }
                    this.vy = -15;
                    this.y -= 20;
                    setTimeout(() => {
                        let opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                        if (opponent) {
                            const hitRange = 100;
                            const distance = Math.abs(this.x - opponent.x);
                            if (distance < hitRange) {
                                if (opponent.isBlocking) {
                                    opponent.takeDamage(15, direction);
                                } else {
                                    for (let i = 0; i < 3; i++) {
                                        setTimeout(() => {
                                            opponent.takeDamage(10, direction);
                                            window.effects.push({ x: opponent.x, y: opponent.y - 60 - (i * 20), type: 'hit', timer: 15, size: 40 });
                                        }, i * 200);
                                    }
                                    window.effects.push({ x: opponent.x, y: opponent.y - 80, type: 'special', timer: 30, size: 60 });
                                }
                            }
                        }
                    }, 300);
                    break;
                case 'chun-li':
                    // Super da Chun-Li: lança vários projéteis rápidos
                    for (let i = -2; i <= 2; i++) {
                        const superProjChun = new Projectile(
                            this.x + (direction * 40),
                            this.y - this.height * 0.7 + (i * 15),
                            this.isFacingLeft,
                            this.p,
                            10,
                            [0, 191, 255],
                            35,
                            'hadouken'
                        );
                        superProjChun.owner = this;
                        if (!window.projectiles) window.projectiles = [];
                        window.projectiles.push(superProjChun);
                    }
                    window.effects.push({ x: this.x + (direction * 40), y: this.y - 50, type: 'lightning-kick', timer: 40, size: 60, direction: direction });
                    const opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                    if (opponent) {
                        const hitRange = 120;
                        const distance = Math.abs(this.x - opponent.x);
                        if (distance < hitRange && ((direction > 0 && opponent.x > this.x) || (direction < 0 && opponent.x < this.x))) {
                            const totalDamage = opponent.isBlocking ? 15 : 30;
                            opponent.takeDamage(totalDamage, direction * 0.5);
                            for (let i = 0; i < 10; i++) {
                                setTimeout(() => {
                                    window.effects.push({ x: opponent.x + (Math.random() * 40 - 20) * direction, y: opponent.y - 40 - (Math.random() * 40), type: 'hit', timer: 10, size: 25 + Math.random() * 15 });
                                    const canvas = document.querySelector('canvas');
                                    if (canvas) {
                                        canvas.style.transform = `translateX(${Math.random() * 4 - 2}px)`;
                                        setTimeout(() => {
                                            canvas.style.transform = 'translateX(0)';
                                        }, 50);
                                    }
                                }, i * 100);
                            }
                        }
                    }
                    setTimeout(() => {
                        if (this.currentState === 'super' || this.currentState === 'special') {
                            this.currentState = 'idle';
                            this.isAttacking = false;
                            this.isCasting = false;
                        }
                    }, 500);
                    break;
                case 'makoto':
                    window.effects.push({ x: this.x, y: this.y - 60, type: 'kaiju-beam', timer: 60, initialTimer: 60, size: 35, character: 'makoto', direction: direction });
                    setTimeout(() => {
                        const opponent = this.name === 'Player 1' ? window.player2 : window.player1;
                        if (opponent) {
                            const isOpponentInDirection = (direction > 0 && opponent.x > this.x) || (direction < 0 && opponent.x < this.x);
                            if (isOpponentInDirection) {
                                if (opponent.isBlocking) {
                                    opponent.takeDamage(15, direction);
                                } else {
                                    opponent.takeDamage(30, direction);
                                    for (let i = 0; i < 5; i++) {
                                        window.effects.push({ x: opponent.x + (direction * 20), y: opponent.y - 60, type: 'hit', timer: 20, size: 50 + (i * 10) });
                                    }
                                }
                            }
                        }
                    }, 400);
                    break;
                default:
                    window.effects.push({ x: this.x + (direction * 50), y: this.y - 60, type: 'kamehameha', timer: 50, initialTimer: 50, size: 30, character: this.character || 'default', direction: direction });
            }
            setTimeout(() => {
                this.isAttacking = false;
                this.isCasting = false;
                if (this.currentState === 'super' || this.currentState === 'special') {
                    this.currentState = 'idle';
                }
            }, 1500);
        }
    }
    takeDamage(amount, direction) {
        if (isNaN(amount) || amount <= 0) return;
        if (this.isBlocking) {
            amount = amount / 2;
            this.power = Math.min(this.powerMax, this.power + Math.floor(amount / 2));
            this.vx = direction * 5;
            if (!window.effects) window.effects = [];
            window.effects.push({ x: this.x - (direction * 30), y: this.y - 60, type: 'block', timer: 10, size: 40 });
        } else {
            this.vx = direction * 10;
            this.isStunned = true;
            this.stunTimer = 15;
            this.currentState = 'damage';
            this.damageAnimTimer = 20;
            if (!window.effects) window.effects = [];
            window.effects.push({ x: this.x, y: this.y - 60, type: 'hit', timer: 15, size: 50 });
            if (amount >= 10) {
                for (let i = 0; i < 3; i++) {
                    window.effects.push({ x: this.x + (Math.random() * 40 - 20), y: this.y - 50 - (Math.random() * 30), type: 'hit', timer: 10 + Math.random() * 5, size: 20 + Math.random() * 20 });
                }
            }
        }
        this.life = Math.max(0, this.life - amount);
        this.lastDamageTimer = amount > 10 ? 20 : 15;
        if (this.life <= 0) {
            window.gameOver = true;
            window.winner = this.name === 'Player 1' ? 'Player 2' : 'Player 1';
        }
    }
    handleMovement() {
        if (this.isAttacking || this.isCasting) return;
        if (window.keyState && window.keyState[this.moveKeys[0]]) {
            this.moveLeft();
        }
        else if (window.keyState && window.keyState[this.moveKeys[1]]) {
            this.moveRight();
        } else if (this.currentState === 'walking') {
            this.currentState = 'idle';
        }
        if (window.keyState && window.keyState[this.moveKeys[2]] && this.onGround) {
            this.jump();
        }
        if (window.keyState && window.keyState[this.moveKeys[3]]) {
            this.crouch();
        } else if (this.currentState === 'crouching') {
            this.currentState = 'idle';
        }
        if (window.keyState && window.keyState[this.attackKey]) {
            this.attack();
        }
        if (window.keyState && window.keyState[this.blockKey]) {
            this.block();
        } else {
            if (this.currentState === 'blocking') {
                this.currentState = 'idle';
            }
            this.isBlocking = false;
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
            if (window.keyState && window.keyState[key] && (!this.lastKeyPressed || this.lastKeyPressed !== key)) {
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
        if (this.specialKeys && this.specialKeys.length > 0) {
            for (let key of this.specialKeys) {
                if (window.keyState && window.keyState[key]) {
                    this.castSpecial();
                    break;
                }
            }
        }
        if (this.ultimateKeys && this.ultimateKeys.length > 0) {
            for (let key of this.ultimateKeys) {
                if (window.keyState && window.keyState[key]) {
                    this.castUltimate();
                    break;
                }
            }
        }
        if (window.keyState && window.keyState[this.moveKeys[3]] && window.keyState[this.moveKeys[1]] && window.keyState[this.attackKey]) {
            this.hadouken();
        }
        if (this.power >= this.powerMax && window.keyState && window.keyState[this.moveKeys[3]] && window.keyState[this.moveKeys[0]] && window.keyState[this.attackKey]) {
            this.powerAttack();
        }
    }
    display() {
        try {
            const p = this.p;
            if (!p) return;
            if (isNaN(this.x) || isNaN(this.y)) {
                if (isNaN(this.x)) this.x = this.name === "Player 1" ? 200 : 600;
                if (isNaN(this.y)) this.y = 400;
            }
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
                    case 'super':
                        currentSprite = this.sprites.super || this.sprites.special;
                        break;
                    default: currentSprite = this.sprites.idle;
                }
            }
            // Fallback: se o sprite não existir, desenha um retângulo colorido
            if (!currentSprite || !currentSprite.width || !currentSprite.height) {
                // Fallback: sprite ausente ou ainda não carregado (width/height 0)
                p.push();
                p.fill(this.name === "Player 1" ? p.color(255, 0, 0) : p.color(0, 0, 255));
                p.rect(this.x - 40, this.y - 100, 80, 100);
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(16);
                p.text(this.character ? this.character.toUpperCase() : this.name, this.x, this.y - 50);
                p.pop();
            } else {
                // Só desenha o sprite se width/height > 0
                if (currentSprite.width > 0 && currentSprite.height > 0) {
                    p.push();
                    const spriteScale = 2.5;
                    p.drawingContext.shadowColor = "rgba(0,0,0,0.5)";
                    p.drawingContext.shadowBlur = 10;
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
                } else {
                    // Fallback visual enquanto o sprite carrega (width/height == 0)
                    p.push();
                    p.fill(this.name === "Player 1" ? p.color(255, 0, 0) : p.color(0, 0, 255));
                    p.rect(this.x - 40, this.y - 100, 80, 100);
                    p.fill(255);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(16);
                    p.text(this.character ? this.character.toUpperCase() : this.name, this.x, this.y - 50);
                    p.pop();
                }
                // Debug: desenha contorno
                if (window.debugMode) {
                    p.push();
                    p.noFill();
                    p.stroke(255, 0, 0);
                    p.rect(this.x - this.width/2, this.y - this.height, this.width, this.height);
                    p.pop();
                }
                // Debug extra: loga se width/height são 0
                if (
                    typeof currentSprite.width === "number" &&
                    typeof currentSprite.height === "number" &&
                    (currentSprite.width === 0 || currentSprite.height === 0)
                ) {
                    console.warn("Sprite width/height = 0 (fallback visual ativado)", this.character, currentSprite);
                }
            }
            this.drawLifeBar(p);
            this.drawPowerBar(p);
        } catch (error) {
            console.error("Erro ao desenhar personagem:", error);
        }
    }
    drawStatusBars() {
        const p = this.p;
        if (!p) return;
        const isPlayer1 = this.name === "Player 1";
        const barX = isPlayer1 ? 100 : p.width - 300;
        const barY = 50;
        p.fill(50);
        p.rect(barX, barY, 200, 15);
        p.fill(isPlayer1 ? p.color(255, 50, 50) : p.color(50, 50, 255));
        p.rect(barX, barY, 200 * (this.life / 100), 15);
        p.fill(50);
        p.rect(barX, barY + 20, 200, 10);
        p.fill(255, 255, 0);
        p.rect(barX, barY + 20, 200 * (this.power / 100), 10);
        p.fill(255);
        p.textSize(14);
        p.textAlign(isPlayer1 ? p.LEFT : p.RIGHT);
        p.text(this.name, isPlayer1 ? barX : barX + 200, barY - 10);
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
      p.fill(50);
      p.rect(barX, barY, 200, 20, 3);
      p.fill(isPlayer1 ? p.color(255, 50, 50) : p.color(50, 50, 255));
      const lifeWidth = Math.max(0, 200 * (this.life / this.maxLife));
      p.rect(barX, barY, lifeWidth, 20, 3);
      p.noFill();
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(barX, barY, 200, 20, 3);
      p.noStroke();
      p.fill(255);
      p.textSize(16);
      p.textAlign(isPlayer1 ? p.LEFT : p.RIGHT);
      p.text(this.name, isPlayer1 ? barX : barX + 200, barY - 10);
      p.textAlign(p.CENTER);
      p.textSize(14);
      p.text(Math.ceil(this.life) + "%", barX + 100, barY + 14);
    }
    drawPowerBar(p) {
      if (!p) return;
      const isPlayer1 = this.name === "Player 1";
      const barX = isPlayer1 ? 100 : p.width - 300;
      const barY = 80;
      p.fill(50);
      p.rect(barX, barY, 200, 10, 3);
      const powerFactor = this.power / this.powerMax;
      const powerWidth = Math.min(200, Math.max(0, 200 * powerFactor));
      if (powerFactor >= 1) {
        const pulseAmount = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 0.7, 1);
        p.fill(255, 255, 0, 200 * pulseAmount);
      } else if (powerFactor >= 0.3) {
        p.fill(255, 165, 0);
      } else {
        p.fill(200, 200, 200);
      }
      p.rect(barX, barY, powerWidth, 10, 3);
      p.noFill();
      p.stroke(255);
      p.strokeWeight(1);
      p.rect(barX, barY, 200, 10, 3);
      p.noStroke();
    }
    update(opponent) {
        if (window.gameOver) return;
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.vx) || isNaN(this.vy)) {
            if (isNaN(this.x)) this.x = this.name === "Player 1" ? 200 : 600;
            if (isNaN(this.y)) this.y = 400;
            if (isNaN(this.vx)) this.vx = 0;
            if (isNaN(this.vy)) this.vy = 0;
        }
        this.handleMovement();
        this.checkSpecialMoves();
        if (this.isStunned) {
            this.vx *= 0.5;
        }
        if (Math.abs(this.vx) < 0.1) {
            this.vx = 0;
            if (this.onGround && this.currentState === 'walking') {
                this.currentState = 'idle';
            }
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        if (this.x < 50) this.x = 50;
        if (this.x > 750) this.x = 750;
        if (this.y >= 450) {
            this.y = 450;
            this.vy = 0;
            this.onGround = true;
            if (this.currentState === 'jumping') {
                this.currentState = 'idle';
            }
        }
        this.vx *= 0.8;
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
        if (this.damageAnimTimer > 0) {
            this.damageAnimTimer--;
            if (this.damageAnimTimer === 0) {
                if (this.currentState === 'damage') {
                    this.currentState = 'idle';
                }
            }
        }
        if (opponent) {
            const myWidth = this.sprites && this.sprites.idle ? this.sprites.idle.width * 1.3 : 70;
            const oppWidth = opponent.sprites && opponent.sprites.idle ? opponent.sprites.idle.width * 1.3 : 70;
            const minDistance = (myWidth + oppWidth) / 3;
            const distance = Math.abs(this.x - opponent.x);
            if (distance < minDistance) {
                const overlap = minDistance - distance;
                const pushDirection = this.x < opponent.x ? -1 : 1;
                if (!this.isStunned && !opponent.isStunned) {
                    this.x += pushDirection * overlap / 2.5;
                    opponent.x -= pushDirection * overlap / 2.5;
                } else if (this.isStunned && !opponent.isStunned) {
                    this.x += pushDirection * overlap;
                } else if (!this.isStunned && opponent.isStunned) {
                    opponent.x -= pushDirection * overlap;
                }
                this.x = Math.max(myWidth/2, Math.min(800 - myWidth/2, this.x));
                opponent.x = Math.max(oppWidth/2, Math.min(800 - oppWidth/2, opponent.x));
            }
            if (!this.isAttacking && !this.isCasting) {
                this.isFacingLeft = opponent.x < this.x;
            }
        }
        if (!window.gameOver && this.power < this.powerMax && this.p.frameCount % 30 === 0) {
            this.power += 2;
        }
        this.updateKeyHistory();
        if (this.isCasting || this.isAttacking) {
            if (!this._animationSafetyTimer) this._animationSafetyTimer = 0;
            this._animationSafetyTimer++;
            if (this._animationSafetyTimer > 180) {
                this.isAttacking = false;
                this.isCasting = false;
                this.currentState = 'idle';
                this._animationSafetyTimer = 0;
            }
        } else {
            this._animationSafetyTimer = 0;
        }
    }
    checkInput() {
        if (!this.p || !window.keyState) {
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
        return inputState;
    }
    checkAttackHit(opponent) {
        const attackRange = 150;
        const distance = Math.abs(this.x - opponent.x);
        const correctDirection = (this.isFacingLeft && this.x > opponent.x) || (!this.isFacingLeft && this.x < opponent.x);
        if (distance < attackRange && correctDirection) {
            if (opponent.isBlocking) {
                if (!window.effects) window.effects = [];
                window.effects.push({ x: opponent.x, y: opponent.y - 40, type: 'block', timer: 10, size: 40 });
                const knockbackDirection = this.x < opponent.x ? 1 : -1;
                opponent.x += knockbackDirection * 5;
                opponent.takeDamage(2); // Reduzido
                this.power += 5;
                opponent.power += 10;
            } else {
                const knockbackDirection = this.x < opponent.x ? 1 : -1;
                if (!window.effects) window.effects = [];
                window.effects.push({ x: opponent.x - (knockbackDirection * 10), y: opponent.y - 40, type: 'hit', timer: 15, size: 50 });
                opponent.takeDamage(5, knockbackDirection); // Reduzido
                this.power += 10;
            }
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
            if (Math.random() > 0.5) {
                if (!window.effects) window.effects = [];
                window.effects.push({ x: this.x + (this.isFacingLeft ? -30 : 30), y: this.y - 40, type: 'miss', timer: 8, size: 20 });
            }
        }
    }
}