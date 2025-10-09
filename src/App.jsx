import React, { useState, useEffect, useCallback, useMemo} from 'react';
import './App.css'; 

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['H', 'D', 'C', 'S']; 
const SUIT_SYMBOLS = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };

const createDeck = () => {
  let deck = [];
  for (const suit of SUITS) {
    for (const [index, rank] of RANKS.entries()) {
      deck.push({ rank, suit, value: index + 2 });
    }
  }
  return deck;
};

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const getRankValue = (rank) => {
  const rankMap = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  return rankMap[rank] || 0;
};

const evaluateHand = (hand) => {
  const sortedValues = hand.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
  const ranks = hand.map(c => c.rank);

  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {});

  const pairs = Object.entries(rankCounts).filter(([, count]) => count >= 2);
 
  if (pairs.length > 0) {
    const pairRank = pairs[0][0];
    const pairValue = getRankValue(pairRank);

    if (pairs[0][1] === 3) {
      return { type: 'Three of a Kind', rank: 3, primaryValue: pairValue }; 
    } 
  }
  
  if (pairs.length > 0) {
    const pairRank = pairs[0][0];
    const pairValue = getRankValue(pairRank);
    
    const kicker = sortedValues.find(v => v !== pairValue);
    return { type: 'Pair', rank: 2, primaryValue: pairValue, kicker: [kicker] }; 
  }

  return { type: 'High Card', rank: 1, kicker: sortedValues };
};

const compareHands = (hand1, hand2) => {
  if (hand1.rank > hand2.rank) return 1;
  if (hand2.rank > hand1.rank) return 2;

  if (hand1.rank === hand2.rank) {
    if (hand1.primaryValue !== undefined && hand2.primaryValue !== undefined) {
      if (hand1.primaryValue > hand2.primaryValue) 
        return 1;
      if (hand2.primaryValue > hand1.primaryValue) 
        return 2;
    }

    if (hand1.kicker && hand2.kicker) {
      for (let i = 0; i < hand1.kicker.length; i++) {
        if (hand1.kicker[i] > hand2.kicker[i]) 
          return 1;
        if (hand2.kicker[i] > hand1.kicker[i]) 
          return 2; 
      }
    }
  }

  return 0; 
};

const Card = React.memo(({ rank, suit, isFaceUp, index }) => {
  const isRed = suit === 'H' || suit === 'D';
  const colorClass = isRed ? 'card-color-red' : 'card-color-black';
  const symbol = SUIT_SYMBOLS[suit];

  const flipperStyle = {
    transitionDelay: `${index * 150}ms`, 
  };

  return (
    <div className="card-container">
      <div className={`card-flipper ${isFaceUp ? 'flip' : ''}`} style={flipperStyle}>
        <div className="card-back">
        </div>
        <div className="card-front">
          <div className={`card-rank-top ${colorClass}`}>{rank}</div>
          <div className={`card-symbol ${colorClass}`} style={{ lineHeight: '1' }}>{symbol}</div>
          <div className={`card-rank-bottom ${colorClass}`}>{rank}</div>
        </div>
      </div>
    </div>
  );
});

const PlayerArea = ({ name, score, hand, handResult, isWinner, isFaceUp }) => {
  const winnerClass = isWinner ? 'player-area-winner' : 'player-area-base';
  const scoreClass = isWinner ? 'score-text-winner' : 'score-text-default';
  const resultPillClass = isWinner ? 'result-pill-winner' : 'result-pill-loser';
  const resultText = handResult ? handResult.type : 'Waiting...';

  return (
    <div className={`player-area ${winnerClass}`}>
      <h2 className="player-title">{name}</h2>
      <p className="score-text">Score: <span className={scoreClass}>{score}</span></p>

      <div className="card-hand-container">
        {hand.length === 3 ? (
          hand.map((card, index) => (
            <Card 
              key={index} 
              rank={card.rank} 
              suit={card.suit} 
              isFaceUp={isFaceUp}
              index={index}
            />
          ))
        ) : (
          [1, 2, 3].map(i => (
            <div key={i} className="card-placeholder">
              <span className="card-placeholder-text">Card {i}</span>
            </div>
          ))
        )}
      </div>
      <div className={`result-pill ${resultPillClass}`}>
        Hand: {resultText}
      </div>
    </div>
  );
};

const ResultModal = ({ show, message, onReshuffle, player1Score, player2Score }) => {
    if (!show) return null;

    const isTie = message.includes('Tie');
    const modalTitle = 'DECK EMPTY';
    const resultBoxClass = isTie ? 'modal-result-box modal-result-tie' : 'modal-result-box modal-result-win';

    return (
      <div className="modal-overlay show">
        <div className="modal-content">
          <h3 className={`modal-title ${isTie ? 'modal-title-tie' : 'modal-title-win'}`}>{modalTitle}</h3>
          <div className={resultBoxClass}>
            <p className="modal-message-text">{message}</p>
          </div>
          <div className="modal-score-display">
            <p className="score-label">Current Overall Score:</p>
            <p className="score-values">
              <span className="p1-score-final">Player 1: {player1Score}</span> 
              <span className="score-separator">|</span> 
              <span className="p2-score-final">Player 2: {player2Score}</span>
            </p>
          </div>
          <button 
            onClick={onReshuffle}
            className="modal-reshuffle-button" 
          >
            RESHUFFLE DECK
          </button>
        </div>
      </div>
    );
};

const App = () => {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1Hand, setPlayer1Hand] = useState([]);
  const [player2Hand, setPlayer2Hand] = useState([]);
  const [gameState, setGameState] = useState('pre-deal'); 
  const [resultMessage, setResultMessage] = useState('');
  const [winnerMessage, setWinnerMessage] = useState('Press "DRAW NEW CARDS" to start the game!');
  const [winningPlayer, setWinningPlayer] = useState(null); 
  const [currentDeck, setCurrentDeck] = useState([]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isHandsRevealed, setIsHandsRevealed] = useState(false); 
  const [showReshuffleModal, setShowReshuffleModal] = useState(false);

  const cardsNeeded = 6;
  const player1Result = useMemo(() => player1Hand.length === 3 ? evaluateHand(player1Hand) : null, [player1Hand]);
  const player2Result = useMemo(() => player2Hand.length === 3 ? evaluateHand(player2Hand) : null, [player2Hand]);
  
  const handleReshuffle = useCallback(() => {
    setGameState('reshuffling');
    setShowReshuffleModal(false);
    setWinnerMessage('Deck is empty. RESHUFFLING...');
    setResultMessage('');
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPlayer1Hand([]);
    setPlayer2Hand([]);
    setWinningPlayer(null);
    setIsHandsRevealed(false); 

    setTimeout(() => {
        let newDeck = createDeck();
        shuffle(newDeck);
        setCurrentDeck(newDeck);
        setShuffleCount(c => c + 1);
        setWinnerMessage('Shuffle complete. Ready to draw.');
        setGameState('pre-deal'); 
    }, 500);
  }, []);

  useEffect(() => {
    if (currentDeck.length === 0 && shuffleCount === 0) {
        let newDeck = createDeck();
        shuffle(newDeck);
        setCurrentDeck(newDeck);
        setShuffleCount(1);
        setGameState('pre-deal');
    }
  }, [currentDeck.length, shuffleCount]);


  const handleDeal = useCallback(() => {
    if (currentDeck.length < cardsNeeded) {
        setGameState('showdown'); 

        let finalResultMessage;

        if(player1Score > player2Score){
            finalResultMessage = `Player 1 Wins the Game! Final Score: ${player1Score} - ${player2Score}`;
        }else if(player2Score > player1Score){
            finalResultMessage = `Player 2 Wins the Game! Final Score: ${player2Score} - ${player1Score}`;
        }else{
            finalResultMessage = `It's a Tie Game! Final Score: ${player1Score} - ${player2Score}`;
        }
        
        setResultMessage(finalResultMessage); 
        setShowReshuffleModal(true);
        
        return; 
    }

    let deckToUse = currentDeck;
    
    setGameState('hands-out');
    setWinningPlayer(null);
    setIsHandsRevealed(false); 
    setWinnerMessage('...Dealing cards...');
    setResultMessage('');
    setPlayer1Hand([]);
    setPlayer2Hand([]);

    setTimeout(() => {
        const p1Hand = deckToUse.slice(0, 3);
        const p2Hand = deckToUse.slice(3, 6);
        const remainingDeck = deckToUse.slice(6);
        
        setCurrentDeck(remainingDeck);
        
        setPlayer1Hand(p1Hand);
        setPlayer2Hand(p2Hand);

        setTimeout(() => {
          setIsHandsRevealed(true);
        }, 50);

        setTimeout(() => {
            const result1 = evaluateHand(p1Hand);
            const result2 = evaluateHand(p2Hand);
            const winnerId = compareHands(result1, result2);

            setGameState('showdown');
            setWinningPlayer(winnerId);

            let message;
            if (winnerId === 1) {
              setPlayer1Score(s => s + 1);
              message = 'Player 1 wins the round!';
            } else if (winnerId === 2) {
              setPlayer2Score(s => s + 1);
              message = 'Player 2 wins the round!';
            } else {
              message = 'It\'s a Tie! No score change.';
            }
            setWinnerMessage(message);
            
            if (remainingDeck.length < cardsNeeded) {
              const p1FinalScore = player1Score + (winnerId === 1 ? 1 : 0);
              const p2FinalScore = player2Score + (winnerId === 2 ? 1 : 0);
                    
              let finalResultMessage;

              if(p1FinalScore > p2FinalScore){
                finalResultMessage = 'Player 1 Wins the Game!';
              }else if(p2FinalScore > p1FinalScore){
                finalResultMessage = 'Player 2 Wins the Game!';
              }else{
                finalResultMessage = 'It\'s a Tie!';
              }
                    
              setTimeout(() => {
                setResultMessage(finalResultMessage); 
                setShowReshuffleModal(true);
              },1500);
            }
        }, 1200); 
    }, 300); 
  }, [currentDeck, player1Score, player2Score]);

  return (
    <div className="game-container">
      <header className="header-container">
        <h1 className="header-title">Three Cards</h1>
        <p className="header-subtitle">Deck Status: {currentDeck.length} cards remaining | Shuffles: {shuffleCount}</p>
      </header>

      {!showReshuffleModal && (
        <div className={`winner-banner ${
          winningPlayer === 1 ? 'winner-banner-p1' :
          winningPlayer === 2 ? 'winner-banner-p2' :
          'winner-banner-default'
        }`}>
          {winnerMessage}
        </div>
      )}

      <div className="player-grid">
        <PlayerArea
          name="Player 1"
          score={player1Score}
          hand={player1Hand}
          handResult={player1Result}
          isWinner={winningPlayer === 1}
          isFaceUp={isHandsRevealed}
        />
        <PlayerArea
          name="Player 2"
          score={player2Score}
          hand={player2Hand}
          handResult={player2Result}
          isWinner={winningPlayer === 2}
          isFaceUp={isHandsRevealed}
        />
      </div>
      <div className="button-container">
        {!showReshuffleModal && (
          <button
            onClick={handleDeal}
            disabled={(gameState !== 'showdown' && gameState !== 'pre-deal') || currentDeck.length < cardsNeeded}
            className="deal-button"
          >
            DRAW NEW CARDS
          </button>
        )}
      </div>
      <ResultModal 
        show={showReshuffleModal && gameState === 'showdown'} 
        message={resultMessage} 
        onReshuffle={handleReshuffle}
        player1Score={player1Score} 
        player2Score={player2Score}
      />
    </div>
  );
};

export default App;
