// Ajuste a classe Projectile

class Projectile {
    constructor(x, y, isGoingLeft, p5Instance, damage = 10, color = [255, 200, 0], size = 40, type = 'normal') {
        this.x = x;
        this.y = y;
        this.isGoingLeft = isGoingLeft;
        this.p = p5Instance;
        this.speed = 8;
        this.width = size;  // Tamanho visual
        this.height = size * 0.75; // Tamanho visual
        this.hitboxWidth = size * 0.75; // Área real de colisão (menor)
        this.hitboxHeight = size * 0.5; // Área real de colisão (menor)
        this.damage = damage;
        this.hasHit = false; // Para evitar múltiplos acertos
        this.color = color;
        this.type = type; // normal, hadouken, power, etc.
        this.lifespan = 120; // Desaparece após 120 frames
    }
    
    update() {
        // Diminuir lifespan
        this.lifespan--;
        
        // Mover o projétil na direção correta
        this.x += this.isGoingLeft ? -this.speed : this.speed;
        
        // Verificar colisão com jogadores se ainda não acertou
        if (!this.hasHit) {
            this.checkCollision(window.player1);
            this.checkCollision(window.player2);
        }
    }
    
    checkCollision(player) {
        // Ignorar colisão com o personagem que lançou o projétil
        const isSource = (this.isGoingLeft && player === window.player2) || 
                         (!this.isGoingLeft && player === window.player1);
        
        if (isSource) return;
        
        // Hitbox do projétil
        const projLeft = this.x - this.hitboxWidth/2;
        const projRight = this.x + this.hitboxWidth/2;
        const projTop = this.y - this.hitboxHeight/2;
        const projBottom = this.y + this.hitboxHeight/2;
        
        // Hitbox do jogador
        const playerLeft = player.x - player.width/2;
        const playerRight = player.x + player.width/2;
        const playerTop = player.y - player.height;
        const playerBottom = player.y;
        
        // Verificar colisão
        if (projRight > playerLeft && 
            projLeft < playerRight && 
            projBottom > playerTop && 
            projTop < playerBottom) {
            
            const knockbackDirection = this.isGoingLeft ? -1 : 1;
            
            // Aplicar dano ao jogador
            player.takeDamage(this.damage, knockbackDirection);
            
            // Marcar como acertou para evitar múltiplos hits
            this.hasHit = true;
            
            // Criar efeito visual de impacto
            if (!window.effects) window.effects = [];
            window.effects.push({
                x: this.x,
                y: this.y,
                type: 'hit',
                timer: 15,
                size: this.width * 1.5
            });
        }
    }
    
    display() {
        if (!this.p) return;
        
        const p = this.p;
        
        p.push();
        
        // Efeitos específicos por tipo
        switch(this.type) {
            case 'hadouken':
                // Efeito de bola de energia
                p.noStroke();
                
                // Camada externa (aura)
                p.fill(this.color[0], this.color[1], this.color[2], 100);
                p.ellipse(this.x, this.y, this.width * 1.3);
                
                // Camada interna (núcleo)
                p.fill(this.color[0], this.color[1], this.color[2]);
                p.ellipse(this.x, this.y, this.width * 0.8);
                
                // Efeito de luz interna
                p.fill(255, 255, 255, 200);
                p.ellipse(this.x - this.width/5, this.y - this.width/5, this.width * 0.3);
                break;
            
            case 'power':
                // Efeito de poder especial maior
                p.noStroke();
                
                // Aura externa pulsante
                const pulseAmount = p.map(p.sin(p.frameCount * 0.2), -1, 1, 0.9, 1.1);
                
                // Ondas de energia
                for (let i = 3; i > 0; i--) {
                    const fade = 150 - (i * 40);
                    p.fill(this.color[0], this.color[1], this.color[2], fade);
                    p.ellipse(this.x, this.y, this.width * 1.5 * pulseAmount / i);
                }
                
                // Núcleo
                p.fill(this.color[0], this.color[1], this.color[2]);
                p.ellipse(this.x, this.y, this.width);
                
                // Brilho central
                p.fill(255, 255, 255, 200);
                p.ellipse(this.x, this.y, this.width * 0.4);
                break;
                
            default:
                // Projétil padrão
                p.fill(this.color[0], this.color[1], this.color[2]);
                p.ellipse(this.x, this.y, this.width, this.height);
        }
        
        p.pop();
    }
    
    // Verificar se o projétil saiu da tela
    isOffScreen() {
        return this.x < -50 || 
               this.x > this.p.width + 50 || 
               this.lifespan <= 0 || 
               this.hasHit;
    }
}

export { Projectile };