import React, { useEffect } from 'react';
import './Credits.css';

const Credits = ({ onNavigate }) => {
  // Voltar ao menu inicial com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 27) { // ESC
        onNavigate('title');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);
  
  return (
    <div className="credits-screen">
      <h1 className="credits-title">COMO JOGAR</h1>
      
      <div className="controls-section">
        <div className="controls-column">
          <h2>JOGADOR 1</h2>
          <div className="control-group">
            <div className="control">
              <span className="key">W</span>
              <span className="action">Pular</span>
            </div>
            <div className="control">
              <span className="key">A</span>
              <span className="action">Mover para Esquerda</span>
            </div>
            <div className="control">
              <span className="key">S</span>
              <span className="action">Abaixar</span>
            </div>
            <div className="control">
              <span className="key">D</span>
              <span className="action">Mover para Direita</span>
            </div>
            <div className="control">
              <span className="key">F</span>
              <span className="action">Soco</span>
            </div>
            <div className="control">
              <span className="key">G</span>
              <span className="action">Defender</span>
            </div>
          </div>
          
          <h3 className="special-moves">GOLPES ESPECIAIS</h3>
          <div className="control-group">
            <div className="control">
              <span className="key">Q</span>
              <span className="action">Ataque Especial</span>
            </div>
            <div className="control">
              <span className="key">E</span>
              <span className="action">Super Ataque</span>
            </div>
          </div>
        </div>
        
        <div className="controls-column">
          <h2>JOGADOR 2</h2>
          <div className="control-group">
            <div className="control">
              <span className="key">↑</span>
              <span className="action">Pular</span>
            </div>
            <div className="control">
              <span className="key">←</span>
              <span className="action">Mover para Esquerda</span>
            </div>
            <div className="control">
              <span className="key">↓</span>
              <span className="action">Abaixar</span>
            </div>
            <div className="control">
              <span className="key">→</span>
              <span className="action">Mover para Direita</span>
            </div>
            <div className="control">
              <span className="key">K</span>
              <span className="action">Soco</span>
            </div>
            <div className="control">
              <span className="key">L</span>
              <span className="action">Defender</span>
            </div>
          </div>
          
          <h3 className="special-moves">GOLPES ESPECIAIS</h3>
          <div className="control-group">
            <div className="control">
              <span className="key">I</span>
              <span className="action">Ataque Especial</span>
            </div>
            <div className="control">
              <span className="key">O</span>
              <span className="action">Super Ataque</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="game-tips">
        <h3>DICAS DE JOGO</h3>
        <ul>
          <li>Acerte golpes para encher sua barra de poder</li>
          <li>Ataques Especiais consomem 30% da barra de poder</li>
          <li>Super Ataques consomem 100% da barra de poder e causam muito dano</li>
          <li>Defender reduz o dano recebido em 80%</li>
          <li>Não é possível se mover enquanto defende</li>
          <li>Ataques aéreos não podem ser defendidos</li>
          <li>Vença a luta zerando a barra de vida do oponente</li>
        </ul>
      </div>
      
      <div className="game-mechanics">
        <h3>HABILIDADES DOS PERSONAGENS</h3>
        <div className="character-abilities">
          <div className="character">
            <h4>RYU</h4>
            <p>Lutador equilibrado com poderoso projétil Hadouken</p>
          </div>
          <div className="character">
            <h4>KEN</h4>
            <p>Movimentação rápida e forte Shoryuken</p>
          </div>
          <div className="character">
            <h4>CHUN-LI</h4>
            <p>Ataques rápidos e combos de múltiplos golpes</p>
          </div>
          <div className="character">
            <h4>MAKOTO</h4>
            <p>Golpes poderosos com alto dano</p>
          </div>
        </div>
      </div>
      
      <div className="navigation-buttons">
        <button 
          className="nav-button back-button" 
          onClick={() => onNavigate('title')}
        >
          VOLTAR AO MENU
        </button>
        
        <button 
          className="nav-button play-button" 
          onClick={() => onNavigate('select')}
        >
          SELECIONAR PERSONAGEM
        </button>
      </div>
    </div>
  );
};

export default Credits;