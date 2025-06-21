export class Projectile {
  constructor(x, y, isGoingLeft, p, damage = 15, color = [255, 255, 0], size = 30, type = 'hadouken') {
    this.x = x;
    this.y = y;
    this.isGoingLeft = isGoingLeft;
    this.vx = isGoingLeft ? -8 : 8;
    this.vy = 0;
    this.size = size;
    this.damage = damage;
    this.color = color;
    this.p = p;
    this.isActive = true;
    this.type = type;
    this.owner = null;
    this.isPowerAttack = false;
  }

  update() {
    if (!this.isActive) return;
    
    this.x += this.vx;
    this.y += this.vy;

    // Check if out of bounds
    if (this.isOffScreen()) {
      this.isActive = false;
    }
  }

  display() {
    if (!this.isActive || !this.p) return;
    
    this.p.push();
    this.p.noStroke();
    
    // Draw projectile based on type
    if (this.type === 'hadouken') {
      // Hadouken style - energy ball
      this.p.fill(this.color[0], this.color[1], this.color[2], 200);
      this.p.ellipse(this.x, this.y, this.size, this.size);
      
      // Inner glow
      this.p.fill(255, 255, 255, 150);
      this.p.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.6);
      
      // Wave effect
      const waveSize = this.size * 1.2 * (1 + Math.sin(this.p.frameCount * 0.2) * 0.1);
      this.p.noFill();
      this.p.stroke(this.color[0], this.color[1], this.color[2], 100);
      this.p.strokeWeight(2);
      this.p.ellipse(this.x, this.y, waveSize, waveSize);
    } 
    else if (this.type === 'power') {
      // Power attack - larger, more impressive
      // Outer glow
      this.p.fill(this.color[0], this.color[1], this.color[2], 100);
      this.p.ellipse(this.x, this.y, this.size * 1.5, this.size * 1.5);
      
      // Main body
      this.p.fill(this.color[0], this.color[1], this.color[2], 200);
      this.p.ellipse(this.x, this.y, this.size, this.size);
      
      // Inner core
      this.p.fill(255, 255, 255, 200);
      this.p.ellipse(this.x, this.y, this.size * 0.4, this.size * 0.4);
      
      // Particles
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (this.size / 2);
        const particleX = this.x + Math.cos(angle) * distance;
        const particleY = this.y + Math.sin(angle) * distance;
        const particleSize = Math.random() * (this.size / 5) + (this.size / 10);
        
        this.p.fill(255, 255, 255, 150);
        this.p.ellipse(particleX, particleY, particleSize, particleSize);
      }
    }
    
    this.p.pop();
  }

  checkCollision(player) {
    if (!this.isActive || !player || this.owner === player) return false;
    
    // Simple collision detection using rectangles
    const projLeft = this.x - this.size/2;
    const projRight = this.x + this.size/2;
    const projTop = this.y - this.size/2;
    const projBottom = this.y + this.size/2;
    
    const playerLeft = player.x - player.width/2;
    const playerRight = player.x + player.width/2;
    const playerTop = player.y - player.height;
    const playerBottom = player.y;
    
    if (projRight > playerLeft && 
        projLeft < playerRight && 
        projBottom > playerTop && 
        projTop < playerBottom) {
        
        const knockbackDirection = this.isGoingLeft ? -1 : 1;
        
        // Apply damage to the player (reduced if blocking)
        player.takeDamage(
            player.isBlocking ? Math.floor(this.damage * 0.4) : this.damage,
            knockbackDirection
        );
        
        // Create hit effect
        if (window.effects) {
            window.effects.push({
                x: this.x,
                y: this.y,
                type: player.isBlocking ? 'block' : 'hit',
                timer: 15,
                size: this.size * 1.5
            });
        }
        
        this.isActive = false;
        return true;
    }
    
    return false;
  }

  // Adicione este método se estiver faltando
  isOffScreen() {
    return this.x < -50 || this.x > this.p.width + 50;
  }
}