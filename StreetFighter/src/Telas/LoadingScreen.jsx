import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const [dots, setDots] = useState('.');
  const [powerBarWidth, setPowerBarWidth] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const loadingMessages = [
    'CARREGANDO HADOUKEN',
    'INICIANDO ROUND',
    'PREPARANDO ARENA',
    'CARREGANDO SPRITES',
    'AQUECENDO MOTORES'
  ];

  // Efeito para os pontos animados
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Efeito para o texto de carregamento rotativo
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * loadingMessages.length);
      setLoadingText(loadingMessages[randomIndex]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Efeito para a barra de progresso
  useEffect(() => {
    if (powerBarWidth < 100) {
      const interval = setInterval(() => {
        setPowerBarWidth(prev => {
          // Incremento aleatório para simular carregamento irregular
          const increment = Math.floor(Math.random() * 5) + 1;
          return Math.min(prev + increment, 100);
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [powerBarWidth]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">STREET FIGHTER</div>
        <div className="loading-subtitle">MINI JAM EDITION</div>

        <div className="vs-container">
          <div className="player-icon pl1">P1</div>
          <div className="vs-text">VS</div>
          <div className="player-icon pl2">P2</div>
        </div>

        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${powerBarWidth}%` }}></div>
          <div className="loading-reflection"></div>
        </div>

        <div className="loading-message">
          {loadingText || 'CARREGANDO'}{dots}
        </div>

        <div className="loading-tips">
          DICA: Bloqueie para reduzir o dano recebido em 80%
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;