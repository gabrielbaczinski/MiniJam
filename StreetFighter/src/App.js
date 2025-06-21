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

  // Ref para armazenar o timer de segurança
  const safetyTimerRef = React.useRef(null);

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
    
    // Mostrar tela de carregamento enquanto o GameCanvas carrega
    setIsLoading(true);
    setCurrentScreen('loading');
    setGameReady(false);
    
    // Timeout de segurança: força a exibição do jogo após 8 segundos
    // mesmo se o onGameReady não for chamado
    const safetyTimer = setTimeout(() => {
        console.log("⚠️ Timeout de segurança acionado - forçando carregamento");
        setIsLoading(false);
        setCurrentScreen('game');
        setGameReady(true);
    }, 8000);
    
    // Armazenar o timer no ref para limpá-lo depois se necessário
    safetyTimerRef.current = safetyTimer;
  }, []);

  // Função para notificar que o jogo está pronto
  const onGameReady = useCallback(() => {
    console.log("GameCanvas sinaliza que está pronto!");
    
    // Limpar o timer de segurança já que o callback foi chamado corretamente
    if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
    }
    
    setGameReady(true);
    setIsLoading(false);
    setCurrentScreen('game');
  }, []);

  // Função para lidar com o fim do jogo
  const handleGameEnd = useCallback((winner) => {
    console.log(`Jogo finalizado! Resultado: ${winner}`);
    
    // Limpeza do estado do jogo
    window.gameOver = false;
    window.winner = null;
    window.gamePaused = false;
    window.exitRequested = false;
    
    // Limpar qualquer timer de segurança
    if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
    }
    
    // Se o modo for 'exit', voltar ao menu sem mostrar resultados
    if (winner === 'exit') {
        setCurrentScreen('select');
        return;
    }
    
    // Para outros casos (vitória/derrota), você poderia mostrar uma tela de resultados
    // setCurrentScreen('results'); 
    // ou simplesmente voltar para a seleção:
    setCurrentScreen('select');
  }, []);

  // Renderização condicional baseada no estado currentScreen
  const renderScreen = () => {
    // Mostrar tela de carregamento apenas se estiver carregando E não estiver no jogo ainda
    if ((isLoading || currentScreen === 'loading') && !gameReady) {
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
            onGameEnd={handleGameEnd} 
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