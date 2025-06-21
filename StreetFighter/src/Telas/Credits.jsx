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
      <h1 className="credits-title">HOW TO PLAY</h1>
      
      <div className="controls-section">
        <div className="controls-column">
          <h2>PLAYER 1</h2>
          <div className="control-group">
            <div className="control">
              <span className="key">W</span>
              <span className="action">Jump</span>
            </div>
            <div className="control">
              <span className="key">A</span>
              <span className="action">Move Left</span>
            </div>
            <div className="control">
              <span className="key">S</span>
              <span className="action">Crouch</span>
            </div>
            <div className="control">
              <span className="key">D</span>
              <span className="action">Move Right</span>
            </div>
            <div className="control">
              <span className="key">F</span>
              <span className="action">Punch</span>
            </div>
            <div className="control">
              <span className="key">G</span>
              <span className="action">Block</span>
            </div>
          </div>
          
          <h3 className="special-moves">SPECIAL MOVES</h3>
          <div className="control-group">
            <div className="control">
              <span className="key">Q</span>
              <span className="action">Special Attack</span>
            </div>
            <div className="control">
              <span className="key">E</span>
              <span className="action">Super Attack</span>
            </div>
          </div>
        </div>
        
        <div className="controls-column">
          <h2>PLAYER 2</h2>
          <div className="control-group">
            <div className="control">
              <span className="key">↑</span>
              <span className="action">Jump</span>
            </div>
            <div className="control">
              <span className="key">←</span>
              <span className="action">Move Left</span>
            </div>
            <div className="control">
              <span className="key">↓</span>
              <span className="action">Crouch</span>
            </div>
            <div className="control">
              <span className="key">→</span>
              <span className="action">Move Right</span>
            </div>
            <div className="control">
              <span className="key">K</span>
              <span className="action">Punch</span>
            </div>
            <div className="control">
              <span className="key">L</span>
              <span className="action">Block</span>
            </div>
          </div>
          
          <h3 className="special-moves">SPECIAL MOVES</h3>
          <div className="control-group">
            <div className="control">
              <span className="key">I</span>
              <span className="action">Special Attack</span>
            </div>
            <div className="control">
              <span className="key">O</span>
              <span className="action">Super Attack</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="game-tips">
        <h3>GAMEPLAY TIPS</h3>
        <ul>
          <li>Land hits to build your power meter</li>
          <li>Special Attacks use 30% of your power meter</li>
          <li>Super Attacks use 100% of your power meter and deal massive damage</li>
          <li>Blocking reduces incoming damage by 80%</li>
          <li>You cannot move while blocking</li>
          <li>Jump attacks cannot be blocked</li>
          <li>Win the match by depleting your opponent's health bar</li>
        </ul>
      </div>
      
      <div className="game-mechanics">
        <h3>CHARACTER ABILITIES</h3>
        <div className="character-abilities">
          <div className="character">
            <h4>RYU</h4>
            <p>Balanced fighter with powerful Hadouken projectile</p>
          </div>
          <div className="character">
            <h4>KEN</h4>
            <p>Faster movement with strong Shoryuken uppercut</p>
          </div>
          <div className="character">
            <h4>CHUN-LI</h4>
            <p>Quick attacks and multiple hit combos</p>
          </div>
          <div className="character">
            <h4>MAKOTO</h4>
            <p>Powerful strikes with higher damage output</p>
          </div>
        </div>
      </div>
      
      <div className="navigation-buttons">
        <button 
          className="nav-button back-button" 
          onClick={() => onNavigate('title')}
        >
          BACK TO TITLE
        </button>
        
        <button 
          className="nav-button play-button" 
          onClick={() => onNavigate('select')}
        >
          SELECT CHARACTER
        </button>
      </div>
    </div>
  );
};

export default Credits;