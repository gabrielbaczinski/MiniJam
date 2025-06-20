export class Projectile {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.damage = config.damage || 10;
        this.width = config.width || 30;
        this.height = config.height || 20;
        this.color = config.color || [255, 255, 255];
        this.name = config.name || 'Projectile';
        this.owner = config.owner; // Jogador que lançou (Player 1 ou Player 2)
        this.p = config.p; // Referência ao p5
        this.frame = 0;
        this.lifetime = 120; // 2 segundos @ 60fps
        this.hitboxes = [];
    }
    
    update() {
        // Atualizar posição
        this.x += this.vx;
        this.y += this.vy;
        
        // Animação
        this.frame++;
        
        // Atualizar hitbox
        this.hitboxes = [{
            x: this.x - this.width/2,
            y: this.y - this.height/2,
            width: this.width,
            height: this.height
        }];
        
        // Verificar colisão com jogadores
        this.checkPlayerCollision();
        
        // Reduzir tempo de vida
        this.lifetime--;
    }
    
    display() {
        const p = this.p;
        
        // Salvar contexto
        p.push();
        
        // Desenhar rastro para sensação de movimento
        p.noStroke();
        for (let i = 1; i <= 5; i++) {
            // Rastro de movimento
            const trailX = this.x - (this.vx * i * 0.5);
            const alpha = 150 - (i * 25); // Diminui opacidade ao longo do rastro
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.ellipse(
                trailX, 
                this.y, 
                this.width * (1 - i*0.15), 
                this.height * (1 - i*0.15)
            );
        }
        
        // Efeito luminoso principal
        const alphaGlow = 150 + Math.sin(p.frameCount * 0.2) * 50;
        p.fill(this.color[0], this.color[1], this.color[2], alphaGlow);
        p.ellipse(this.x, this.y, this.width * 1.5, this.height * 1.5);
        
        // Desenhar núcleo do projétil
        p.fill(
            Math.min(255, this.color[0] + 100), 
            Math.min(255, this.color[1] + 100), 
            Math.min(255, this.color[2] + 100)
        );
        p.ellipse(this.x, this.y, this.width, this.height);
        
        // Adicionar detalhes baseados no tipo
        if (this.name.includes('Hadoken')) {
            // Desenhar espiral
            p.stroke(255);
            p.noFill();
            p.strokeWeight(2);
            p.arc(this.x, this.y, this.width * 0.6, this.height * 0.6, p.frameCount * 0.2, p.frameCount * 0.2 + p.PI * 1.5);
        } else if (this.name.includes('Kiko')) {
            // Partículas para Kikoken/Kikosho
            for (let i = 0; i < 5; i++) {
                const angle = p.random(p.TWO_PI);
                const dist = p.random(this.width/4);
                p.fill(255, 255, 255, 150);
                p.ellipse(
                    this.x + Math.cos(angle) * dist,
                    this.y + Math.sin(angle) * dist,
                    5, 5
                );
            }
        } else if (this.name.includes('Hayate') || this.name.includes('Seichusen')) {
            // Efeito de movimento rápido
            p.stroke(255, 215, 0, 150);
            p.strokeWeight(3);
            for (let i = 1; i <= 3; i++) {
                p.line(this.x - (this.vx * i * 2), this.y, this.x - (this.vx * i * 2.5), this.y);
            }
        }
        
        // Restaurar contexto
        p.pop();
    }
    
    isOffScreen() {
        return (
            this.x < -50 ||
            this.x > this.p.width + 50 ||
            this.y < -50 ||
            this.y > this.p.height + 50 ||
            this.lifetime <= 0
        );
    }
    
    checkPlayerCollision() {
        // Verificar colisão apenas com o oponente, não com quem lançou
        const player1 = window.player1;
        const player2 = window.player2;
        
        if (!player1 || !player2) return;
        
        // Determinar contra quem verificar colisão
        const opponent = this.owner === 'Player 1' ? player2 : player1;
        
        // Hitbox simplificada do oponente
        const opponentHitbox = {
            x: opponent.x - 30,
            y: opponent.y - 80,
            width: 60,
            height: 80
        };
        
        // Verificar colisão
        if (this.intersects(this.hitboxes[0], opponentHitbox)) {
            // Causar dano
            if (!opponent.isBlocking) {
                opponent.life -= this.damage;
                if (opponent.life < 0) opponent.life = 0;
                
                // Knockback
                const knockbackDir = this.vx > 0 ? 1 : -1;
                opponent.vx = knockbackDir * 10;
                
                // Verificar game over
                if (opponent.life <= 0) {
                    window.gameOver = true;
                    window.winner = this.owner;
                }
            } else {
                // Dano reduzido se estiver bloqueando
                opponent.life -= this.damage * 0.2;
                if (opponent.life < 0) opponent.life = 0;
                
                // Knockback menor
                const knockbackDir = this.vx > 0 ? 1 : -1;
                opponent.vx = knockbackDir * 3;
            }
            
            // Remover projétil após atingir
            this.lifetime = 0;
        }
    }
    
    // Verificar se duas hitboxes se intersectam
    intersects(box1, box2) {
        return (
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y
        );
    }
}