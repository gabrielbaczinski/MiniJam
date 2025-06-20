import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import GameCanvas from './Telas/GameCanvas';
import TitleScreen from './Telas/TitleScreen';
import CharacterSelect from './Telas/CharacterSelect';
import Credits from './Telas/Credits';
import LoadingScreen from './Telas/LoadingScreen';

function App() {
  // Estado para controlar qual tela está sendo mostrada
  const [currentScreen, setCurrentScreen] = useState('loading');
  // Estado para armazenar personagens selecionados
  const [selectedCharacters, setSelectedCharacters] = useState({
    player1: 'ryu',
    player2: 'ken'
  });
  // Estado para controlar carregamento
  const [isLoading, setIsLoading] = useState(true);
  // Estado para controlar quando o jogo está pronto
  const [gameReady, setGameReady] = useState(false);

  // Simular carregamento inicial do jogo - executado imediatamente
  useEffect(() => {
    console.log("Iniciando carregamento inicial");
    // Iniciar com a tela de carregamento
    document.body.style.backgroundColor = "#000"; // Fundo preto imediato
    
    // Simular carregamento dos assets
    const timer = setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('title');
      console.log("Carregamento inicial concluído");
    }, 3000); // 3 segundos de carregamento simulado
    
    return () => clearTimeout(timer);
  }, []);

  // Use useCallback para evitar recriação de funções a cada re-renderização
  const navigateTo = useCallback((screen) => {
    console.log(`Navegando para: ${screen}`);    
    // Se estiver navegando para o jogo, mostre carregamento
    if (screen === 'game') {
      setIsLoading(true);
      setCurrentScreen('loading');
      setGameReady(false); // Resetar o estado de jogo pronto
      
      // Simular carregamento dos assets do jogo
      setTimeout(() => {
        setIsLoading(false);
        setCurrentScreen('game');
        console.log("Jogo carregado e pronto");
      }, 2000); // 2 segundos de carregamento simulado
    } else {
      setCurrentScreen(screen);
    }
  }, []);

  // Função para iniciar o jogo com personagens selecionados
  const startGame = useCallback((player1, player2) => {
    console.log(`Iniciando jogo com: ${player1} vs ${player2}`);
    setSelectedCharacters({ player1, player2 });
    
    // Mostrar tela de carregamento antes de iniciar o jogo
    navigateTo('game');
  }, [navigateTo]);

  // Função para notificar que o jogo está pronto
  const onGameReady = useCallback(() => {
    console.log("GameCanvas sinaliza que está pronto!");
    setGameReady(true);
  }, []);

  // Renderização condicional baseada no estado currentScreen
  const renderScreen = () => {
    // Mostrar tela de carregamento se estiver carregando
    if (isLoading || currentScreen === 'loading') {
      return <LoadingScreen />;
    }
    
    switch (currentScreen) {
      case 'title':
        return <TitleScreen onNavigate={navigateTo} />;
      case 'select':
        return <CharacterSelect onStart={startGame} onNavigate={navigateTo} />;
      case 'credits':
        return <Credits onNavigate={navigateTo} />;
      case 'game':
        return <GameCanvas 
                 selectedCharacters={selectedCharacters} 
                 onGameEnd={() => navigateTo('title')} 
                 onGameReady={onGameReady}
               />;
      default:
        return <TitleScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="App">
      <div key={currentScreen}>
        {renderScreen()}
      </div>
    </div>
  );
}

export default App;