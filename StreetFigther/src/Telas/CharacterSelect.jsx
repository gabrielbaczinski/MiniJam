import React, { useState, useEffect } from 'react';
import './CharacterSelect.css';

const characters = [
  { id: 'ryu', name: 'RYU', special: 'HADOUKEN', country: 'JAPAN' },
  { id: 'ken', name: 'KEN', special: 'SHORYUKEN', country: 'USA' },
  { id: 'chun-li', name: 'CHUN-LI', special: 'KIKOKEN', country: 'CHINA' },
  { id: 'makoto', name: 'MAKOTO', special: 'HAYATE', country: 'JAPAN' }
];

const CharacterSelect = ({ onStart, onNavigate }) => {
  const [p1Selection, setP1Selection] = useState(0);
  const [p2Selection, setP2Selection] = useState(1);
  const [p1Confirmed, setP1Confirmed] = useState(false);
  const [p2Confirmed, setP2Confirmed] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  // Se ambos jogadores confirmaram, inicie o jogo após contagem regressiva
  useEffect(() => {
    if (p1Confirmed && p2Confirmed && !countdown) {
      setCountdown(3);
    }
    
    if (countdown !== null) {
      if (countdown === 0) {
        onStart(characters[p1Selection].id, characters[p2Selection].id);
      } else {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [p1Confirmed, p2Confirmed, countdown, onStart, p1Selection, p2Selection]);
  
  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Player 1 controls (WASD + F)
      if (!p1Confirmed) {
        switch(e.keyCode) {
          case 65: // A - esquerda
            setP1Selection(prev => (prev > 0 ? prev - 1 : characters.length - 1));
            break;
          case 68: // D - direita
            setP1Selection(prev => (prev < characters.length - 1 ? prev + 1 : 0));
            break;
          case 70: // F - confirmar
            setP1Confirmed(true);
            break;
          default:
            break;
        }
      }
      
      // Player 2 controls (Arrows + K)
      if (!p2Confirmed) {
        switch(e.keyCode) {
          case 37: // Left arrow
            setP2Selection(prev => (prev > 0 ? prev - 1 : characters.length - 1));
            break;
          case 39: // Right arrow
            setP2Selection(prev => (prev < characters.length - 1 ? prev + 1 : 0));
            break;
          case 75: // K - confirmar
            setP2Confirmed(true);
            break;
          default:
            break;
        }
      }
      
      // Cancelar seleção com ESC
      if (e.keyCode === 27) { // ESC
        if (p2Confirmed) setP2Confirmed(false);
        else if (p1Confirmed) setP1Confirmed(false);
        else onNavigate('title');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [p1Confirmed, p2Confirmed, onNavigate]);
  
  // URL das imagens de personagens
  const getCharacterPortrait = (characterId) => {
    const portraits = {
      'ryu': 'https://www.justnopoint.com/zweifuss/select/14.gif',
      'ken': 'https://www.justnopoint.com/zweifuss/select/19.gif',
      'chun-li': 'https://www.justnopoint.com/zweifuss/select/10.gif',
      'makoto': 'https://www.justnopoint.com/zweifuss/select/11.gif'
    };
    
    return portraits[characterId] || 'https://i.imgur.com/HgTRKQs.png';
  };
  
  return (
    <div className="character-select">
      <h1 className="select-title">SELECT YOUR FIGHTER</h1>
      
      <div className="character-grid">
        <div className="player-selection p1">
          <h2>PLAYER 1</h2>
          <div className="character-portrait">
            <img 
              src={getCharacterPortrait(characters[p1Selection].id)}
              alt={characters[p1Selection].name} 
            />
            {p1Confirmed && <div className="confirmed-overlay">READY!</div>}
          </div>
          <div className="character-info">
            <div className="character-name">{characters[p1Selection].name}</div>
            <div className="character-special">SPECIAL: {characters[p1Selection].special}</div>
            <div className="character-country">{characters[p1Selection].country}</div>
          </div>
          <div className="controls-hint">
            USE A/D TO SELECT - F TO CONFIRM
          </div>
        </div>
        
        {countdown !== null && (
          <div className="countdown">{countdown}</div>
        )}
        
        <div className="versus">VS</div>
        
        <div className="player-selection p2">
          <h2>PLAYER 2</h2>
          <div className="character-portrait">
            <img 
              src={getCharacterPortrait(characters[p2Selection].id)}
              alt={characters[p2Selection].name} 
            />
            {p2Confirmed && <div className="confirmed-overlay">READY!</div>}
          </div>
          <div className="character-info">
            <div className="character-name">{characters[p2Selection].name}</div>
            <div className="character-special">SPECIAL: {characters[p2Selection].special}</div>
            <div className="character-country">{characters[p2Selection].country}</div>
          </div>
          <div className="controls-hint">
            USE ←/→ TO SELECT - K TO CONFIRM
          </div>
        </div>
      </div>
      
      <div className="select-navigation">
        <button 
          className="back-button" 
          onClick={() => onNavigate('title')}
        >
          BACK TO TITLE
        </button>
      </div>
    </div>
  );
};

export default CharacterSelect;