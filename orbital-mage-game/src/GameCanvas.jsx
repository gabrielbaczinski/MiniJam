import React, { useRef, useEffect } from 'react';
import p5 from 'p5';
import wizard from './sprites/magao.png';

let estado = 'menu';
let nivel = 1;
let moedas = 0;
let pausado = false;
let upgradeVidaExtra = 0;
let upgradeForcaExtra = 0;
let upgradeVelocidadeExtra = 0;


const GameCanvas = () => {
  const sketchRef = useRef();

  useEffect(() => {
    let mago;
    let MagoImg;
    let monstros = [];
    let magias = [];
    let gravidade;
    let pontuacao = 0;
    let carregando = false;
    let forca = 0;
    let vida = 3
    let teclasPressionadas = {};
    let tipoMagiaAtual = 'normal';

    const sketch = (p) => {
      const plataformaAltura = 300;

      p.setup = async () => {
        try {
        p.createCanvas(1260, 535).parent("game-container");
        gravidade = p.createVector(p.width / 2, plataformaAltura);
        mago = new Mago(p, 50, plataformaAltura - 40, 60, 40);
        gerarHorda();
        MagoImg = await p.loadImage(wizard)
      }
        catch (error) {
          console.error("Erro ao carregar o jogo:", error);
        }
      };

      p.draw = () => {
        if (estado === 'menu') {
          p.background(20);
          p.fill(255);
          p.textSize(32);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("MAGOS VS MONSTROS", p.width / 2, 80);

          p.textSize(20);
          p.text("1 - Jogar", p.width / 2, 150);
          p.text("2 - Dificuldade", p.width / 2, 180);
          p.text("3 - Upgrades", p.width / 2, 210);
          p.text("4 - Sair", p.width / 2, 240);
          return;
        }

        if (estado === 'upgrade') {
          p.background(40);
          p.fill(255);
          p.textSize(28);
          p.textAlign(p.CENTER, p.TOP);
          p.text("UPGRADES", p.width / 2, 40);

          p.textSize(18);
          p.text(`Moedas: ${moedas}`, p.width / 2, 100);
          p.text("[1] Aumentar Vida (+1) - 10 moedas", p.width / 2, 160);
          p.text("[2] Aumentar Tempo de Queimadura - 20 moedas", p.width / 2, 200);
          p.text("[3] Aumentar Área de Impacto do Choque - 15 moedas", p.width / 2, 240);
          p.text("[0] Voltar ao Menu", p.width / 2, 300);
          return;
        }

        if (pausado) {
          p.fill(255, 255, 0);
          p.textSize(32);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("Jogo Pausado", p.width / 2, p.height / 2 - 40);
          p.textSize(16);
          p.text("ESC para continuar\nSPACE para ir ao menu", p.width / 2, p.height / 2);
          return;
        }

        p.background(30);
        desenharUI(p);
        p.fill(200, 200, 0);
        p.rect(0, plataformaAltura, p.width, 20);

        mago.mover(teclasPressionadas, p);
        mago.exibir();

        for (let i = magias.length - 1; i >= 0; i--) {
          const magia = magias[i];
          magia.aplicarGravidade(gravidade);
          magia.mover();
          magia.exibir();

          if (
            magia.pos.x < 0 || magia.pos.x > p.width ||
            magia.pos.y < 0 || magia.pos.y > p.height
          ) {
            magias.splice(i, 1);
            continue;
          }

          for (let j = monstros.length - 1; j >= 0; j--) {
            const monstro = monstros[j];
            if (magia.colideCom(monstro)) {
              magia.ativarEfeito(monstro, monstros);
              magias.splice(i, 1);
              break;
            }
          }
        }

        for (let i = monstros.length - 1; i >= 0; i--) {
          const monstro = monstros[i];
          monstro.atualizarEstado();
          monstro.mover();
          monstro.exibir();

          if (
            monstro.x < mago.x + mago.w &&
            monstro.y >= mago.y &&
            monstro.y < mago.y + mago.h
          ) {
            monstros.splice(i, 1);
            vida -= 1;
          }

          if (monstro.vida <= 0) {
            monstros.splice(i, 1);
            if (monstro instanceof Chefe) {
              pontuacao += 100;
              moedas += 50;
            } else {
              pontuacao += 10;
              moedas += 5;
            }
          }


        }

        if (vida <= 0) {
          p.noLoop();
          p.fill(255, 0, 0);
          p.textSize(32);
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Game Over!', p.width / 2, p.height / 2);
          setTimeout(() => estado = 'menu', 3000);
        }


        if (monstros.length === 0 && vida > 0) {
          gerarHorda();
        }
      };

      p.keyPressed = () => {
        teclasPressionadas[p.key] = true;
        if (vida <= 0) return;

        if (estado === 'menu') {
          if (p.key === '1') {
            iniciarJogo();
          } else if (p.key === '2') {
            alert("Seleção de dificuldade ainda não implementada.");
          } else if (p.key === '3') {
            estado = 'upgrade'; 
          } else if (p.key === '4') {
            window.close();
          }
          return;
        }

        if (estado === 'upgrade') {
          if (p.key === '1' && moedas >= 10) {
            upgradeVidaExtra += 1;
            moedas -= 10;
            alert('Vida aumentada!');
          } else if (p.key === '2' && moedas >= 20) {
            Monstro.tempoQueimando += 1;
            moedas -= 20;
            alert('Dano de Queimadura aumentado!');
          } else if (p.key === '3' && moedas >= 15) {
            Magia.raioDeImpacto += 10;
            moedas -= 15;
            alert('Área de impacto aumentada!');
          } else if (p.key === '0') {
            estado = 'menu';
          } else {
            alert('Moedas insuficientes!');
          }
          return;
        }

        if (estado === 'jogando') {
          if (p.key === '1') tipoMagiaAtual = 'feitiço';
          if (p.key === '2') tipoMagiaAtual = 'congelamento';
          if (p.key === '3') tipoMagiaAtual = 'fogo';
          if (p.key === '4') tipoMagiaAtual = 'eletrico';

          if (p.keyCode === 27) { // Tecla espaço para pausar
            alternarPausa();
          }


          if (p.keyCode === 32) { // Tecla ESC para voltar ao menu
            estado = 'menu';
            pausado = false;
            p.loop(); // Garante que o menu seja redesenhado
          }
        }
      };


      p.keyReleased = () => {
        delete teclasPressionadas[p.key];
      };

      p.mousePressed = () => {
        if (vida <= 0) return;
        carregando = true;
        forca = 0;
      };

      p.mouseReleased = () => {
        if (vida <= 0) return;
        carregando = false;
        const origem = p.createVector(mago.x + mago.w / 2, mago.y);
        const destino = p.createVector(p.mouseX, p.mouseY);
        const baseForca = Math.max(3, forca);
        const dir = p5.Vector.sub(destino, origem).normalize().mult(baseForca * 10);
        const destinoFinal = p5.Vector.add(origem, dir);
        magias.push(new Magia(p, origem.x, origem.y, destinoFinal, baseForca, tipoMagiaAtual));
        forca = 0;
      };

      const desenharUI = (p) => {
        p.fill(255);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`Pontuação: ${pontuacao}`, 10, 10);
        p.text(`Vida: ${vida}`, 10, 30);
        p.text(`Poderes: [1] Feitiço | [2] Congelamento | [3] Fogo | [4] Elétrico`, 10, 50);
        p.text(`Magia Atual: ${tipoMagiaAtual}`, 10, 70);
        p.text(`Nível: ${nivel - 1}`, 10, 90);
        p.text(`Moedas: ${moedas}`, 10, 110);


        if (carregando) {
          forca = Math.min(forca + 0.2, 10);
          p.fill(255, 255, 0);
          p.rect(mago.x + mago.w / 2 - 20, mago.y - 50, forca * 10, 10);
        }
      };

      const alternarPausa = () => {
        pausado = !pausado;
        if (pausado) {
          p.noLoop(); // Para o loop de desenho
        } else {
          p.loop(); // Retorna ao loop de desenho
        }
      };


      const gerarHorda = () => {
        if (nivel % 5 === 0) {
          // Nível de chefe
          const y = plataformaAltura - 30;
          const chefe = new Chefe(p, p.width + 100, y);
          monstros.push(chefe);
        } else {
          // Níveis normais
          let quantidade = 5 + nivel * 2;
          for (let i = 0; i < quantidade; i++) {
            const y = plataformaAltura - 30 + p.random(-20, 20);
            const monstro = new Monstro(p, p.width + p.random(0, 100), y);
            monstro.velocidadeBase += nivel * 0.1;
            monstros.push(monstro);
          }
        }
        nivel++;
      };

      const iniciarJogo = () => {
        vida = 3 + upgradeVidaExtra;
        forca = upgradeForcaExtra;
        monstros = [];
        magias = [];
        estado = 'jogando';
        nivel = 1;
        mago.velocidade = 2 + upgradeVelocidadeExtra; // velocidade base + upgrade
        p.loop();
        gerarHorda();
      };


      class Chefe {
        constructor(p, x, y) {
          this.p = p;
          this.x = x;
          this.y = y;
          this.tamanho = 80;
          this.velocidadeBase = 0.4;
          this.velocidade = this.velocidadeBase;
          this.vida = 30;
          this.lento = false;
          this.queimando = false;
          this.tempoQueimando = 0;
        }

        mover() {
          this.x -= this.velocidade;
        }

        atualizarEstado() {
          this.velocidade = this.lento ? this.velocidadeBase * 0.3 : this.velocidadeBase;
          if (this.queimando && this.p.frameCount % 60 === 0) {
            this.vida--;
            this.tempoQueimando--;
            if (this.tempoQueimando <= 0) this.queimando = false;
          }
        }

        exibir() {
          this.p.fill(100, 0, 100);
          if (this.queimando) this.p.fill(255, 100, 0);
          if (this.lento) this.p.stroke(0, 255, 255);
          this.p.rect(this.x, this.y - this.tamanho / 2, this.tamanho, this.tamanho);
          this.p.noStroke();
          this.p.fill(255);
          this.p.textSize(14);
          this.p.textAlign(this.p.CENTER, this.p.CENTER);
          this.p.text(`CHEFE ❤ ${this.vida}`, this.x + this.tamanho / 2, this.y - this.tamanho);
        }

        pos() {
          return this.p.createVector(this.x + this.tamanho / 2, this.y);
        }
      }


      class Mago {
        constructor(p, x, y, w, h) {
          this.p = p;
          this.x = x;
          this.y = y;
          this.w = w;
          this.h = h;
          this.tamanho = 40;
          this.velocidade = 4;
        }

        mover(teclas, p) {
          if (teclas['a'] || teclas['ArrowLeft']) this.x = Math.max(0, this.x - this.velocidade);
          if (teclas['d'] || teclas['ArrowRight']) this.x = Math.min(p.width - this.w, this.x + this.velocidade);
        }

        exibir() {
          p.image(MagoImg, this.x, this.y, this.w, this.h);
        }
      }

      class Monstro {
        constructor(p, x, y) {
          this.p = p;
          this.x = x;
          this.y = y;
          this.tamanho = 30;
          this.velocidadeBase = p.random(0.5, 1.2);
          this.velocidade = this.velocidadeBase;
          this.vida = 3;
          this.lento = false;
          this.queimando = false;
          this.tempoQueimando = 0;
        }

        mover() {
          this.x -= this.velocidade;
        }

        atualizarEstado() {
          this.velocidade = this.lento ? this.velocidadeBase * 0.3 : this.velocidadeBase;
          if (this.queimando && this.p.frameCount % 60 === 0) {
            this.vida--;
            this.tempoQueimando--;
            if (this.tempoQueimando <= 0) this.queimando = false;
          }
        }

        exibir() {
          this.p.fill(200, 50, 50);
          if (this.queimando) this.p.fill(255, 100, 0);
          if (this.lento) this.p.stroke(0, 255, 255);
          this.p.rect(this.x, this.y - this.tamanho / 2, this.tamanho, this.tamanho);
          this.p.noStroke();
          this.p.fill(255);
          this.p.textSize(12);
          this.p.textAlign(this.p.CENTER, this.p.CENTER);
          this.p.text(`❤ ${this.vida}`, this.x + this.tamanho / 2, this.y - this.tamanho);
        }

        pos() {
          return this.p.createVector(this.x + this.tamanho / 2, this.y);
        }
      }

      class Magia {
        constructor(p, x, y, destino, forca, tipo) {
          this.p = p;
          this.pos = this.p.createVector(x, y);
          const dir = p5.Vector.sub(destino, this.pos).normalize();
          this.vel = dir.mult(forca + 1);
          this.raio = 8;
          this.tipo = tipo;
        }

        aplicarGravidade(alvo) {
          const forca = p5.Vector.sub(alvo, this.pos);
          const dist = forca.mag();
          if (dist > 10 && dist < 200) {
            forca.normalize();
            let intensidade = 2 / (dist * dist);
            forca.mult(intensidade);
            this.vel.add(forca);
          }
        }

        mover() {
          this.pos.add(this.vel);
          this.vel.y += 0.1;
        }

        exibir() {
          if (this.tipo === 'fogo') this.p.fill(255, 100, 0);
          else if (this.tipo === 'eletrico') this.p.fill(100, 255, 255);
          else if (this.tipo === 'congelamento') this.p.fill(0, 150, 255);
          else this.p.fill(255);
          this.p.ellipse(this.pos.x, this.pos.y, this.raio * 2);
        }

        colideCom(monstro) {
          const d = p5.Vector.dist(this.pos, monstro.pos());
          return d < this.raio + monstro.tamanho / 2;
        }

        ativarEfeito(monstro, todosMonstros) {
          if (this.tipo === 'fogo') {
            monstro.queimando = true;
            monstro.tempoQueimando = 3;
          } else if (this.tipo === 'congelamento') {
            monstro.lento = true;
            setTimeout(() => { monstro.lento = false; }, 3000);
          } else if (this.tipo === 'eletrico') {
            monstro.vida -= 1;
            const raioDeImpacto = 50;
            for (let outro of todosMonstros) {
              if (outro !== monstro && p5.Vector.dist(monstro.pos(), outro.pos()) < raioDeImpacto) {
                outro.vida -= 1;
              }
            }
          } else {
            monstro.vida -= 1;
          }
        }
      }
    };

    sketchRef.current = new p5(sketch);

    return () => {
      sketchRef.current.remove();
    };
  }, []);

  return <div id="game-container" />;
};

export default GameCanvas;
