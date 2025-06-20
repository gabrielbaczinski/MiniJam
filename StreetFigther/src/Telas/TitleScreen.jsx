import React, { useState, useEffect } from 'react';
import './TitleScreen.css';

const TitleScreen = ({ onNavigate }) => {
  const [selected, setSelected] = useState(0);
  const [showPressStart, setShowPressStart] = useState(true);
  
  // Efeito piscante para o "Press Start"
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPressStart(show => !show);
    }, 800);
    return () => clearInterval(interval);
  }, []);
  
  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.keyCode) {
        case 13: // Enter
          handleSelect();
          break;
        case 38: // Seta para cima
          setSelected(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 40: // Seta para baixo
          setSelected(prev => (prev < 2 ? prev + 1 : prev));
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);
  
  const handleSelect = () => {
    switch(selected) {
      case 0:
        console.log("Selecionando modo arcade");
        onNavigate('select');
        break;
      case 1:
        console.log("Selecionando instruções");
        onNavigate('credits');
        break;
      case 2:
        // Opção para sair (não faz nada em web)
        console.log("Selecionando sair");
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="title-screen">
      <div className="logo-container">
        <h1 className="sf-logo">STREET FIGHTER</h1>
        <div className="sf-subtitle">MEGA JAM EDITION</div>
      </div>
      
      {showPressStart && (
        <div className="press-start">PRESS ENTER TO CONTINUE</div>
      )}
      
      <div className="menu-options">
        <div 
          className={`menu-item ${selected === 0 ? 'selected' : ''}`}
          onClick={() => { setSelected(0); handleSelect(); }}
        >
          ARCADE MODE
        </div>
        <div 
          className={`menu-item ${selected === 1 ? 'selected' : ''}`}
          onClick={() => { setSelected(1); handleSelect(); }}
        >
          HOW TO PLAY
        </div>
        <div 
          className={`menu-item ${selected === 2 ? 'selected' : ''}`}
          onClick={() => { setSelected(2); handleSelect(); }}
        >
          EXIT
        </div>
      </div>
      
      <div className="sf-footer">
        © 2023 CAPCOM inspired game
      </div>
    </div>
  );
};

export default TitleScreen;