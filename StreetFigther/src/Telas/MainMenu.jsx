import React from 'react';

const MainMenu = ({ onPlay, onCredits }) => {
    return (
        <div 
            id="menu-container"
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                backgroundImage: 'url(https://images.genius.com/6bdd9b1c1e7994f3ef0ce7df195b8389.480x360x1.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <h1 
                className="game-title"
                style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '60px',
                    color: '#ffcc00',
                    textShadow: '3px 3px 0 #ff0000, -3px 3px 0 #ff0000',
                    marginBottom: '60px',
                    transform: 'skew(-5deg)'
                }}
            >
                STREET FIGHTER
            </h1>
            <div className="menu-options">
                <button
                    className="menu-option"
                    onClick={onPlay}
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        fontSize: '28px',
                        color: 'white',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: '2px solid #ffcc00',
                        borderRadius: '5px',
                        margin: '10px 0',
                        padding: '15px 40px',
                        width: '250px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                >
                    PLAY
                </button>
                <button
                    className="menu-option"
                    onClick={onCredits}
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        fontSize: '28px',
                        color: 'white',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: '2px solid #ffcc00',
                        borderRadius: '5px',
                        margin: '10px 0',
                        padding: '15px 40px',
                        width: '250px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                >
                    CREDITS
                </button>
            </div>
        </div>
    );
};

export default MainMenu;