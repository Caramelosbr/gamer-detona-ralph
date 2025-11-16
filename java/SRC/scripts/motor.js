const state = {
    view: {
        squares: document.querySelectorAll('.squarer'),
        hearts: document.querySelectorAll('.life img'),
        livesCounter: document.querySelector('#x3'),
        score: document.querySelector('#score'),
        timeleft: document.querySelector('#timeleft'),
    },
    value: {
        gameVelocity: 1000,
        hitPosition: null,
        result: 0,
        currentTime: 60,
        currentLives: 3,
        combo: 0,
        maxCombo: 0,
    },
    actions: {
        timerId: null,
        countDownTimerId: null,
    }
};

// Sistema de som melhorado
function playSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'hit') {
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    } else if (type === 'miss') {
        oscillator.frequency.value = 150;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'combo') {
        [880, 1046, 1318].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.15);
            osc.start(audioContext.currentTime + i * 0.1);
            osc.stop(audioContext.currentTime + i * 0.1 + 0.15);
        });
    } else if (type === 'lose') {
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'speedup') {
        [440, 550, 660, 880].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.08, audioContext.currentTime + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.05 + 0.1);
            osc.start(audioContext.currentTime + i * 0.05);
            osc.stop(audioContext.currentTime + i * 0.05 + 0.1);
        });
    }
}

// Som especial de Game Over
function playGameOverSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    [440, 370, 294, 220].forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + 0.3);
        
        osc.start(audioContext.currentTime + i * 0.2);
        osc.stop(audioContext.currentTime + i * 0.2 + 0.3);
    });
}

// Atualiza display de vidas com transição suave
function updateLivesDisplay() {
    if (state.view.livesCounter) {
        state.view.livesCounter.textContent = 'x' + state.value.currentLives;
    }
    
    state.view.hearts.forEach((heart, index) => {
        heart.style.transition = 'all 0.4s ease';
        
        if (index < state.value.currentLives) {
            heart.src = './SRC/image/pngegg.png';
            heart.style.filter = 'drop-shadow(3px 3px 5px rgba(255, 50, 50, 0.5))';
            heart.style.opacity = '1';
            heart.style.transform = 'scale(1)';
        } else {
            heart.src = './SRC/image/pngwing.com (1).png';
            heart.style.filter = 'grayscale(100%) drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.4))';
            heart.style.opacity = '0.3';
            heart.style.transform = 'scale(0.85)';
        }
    });
}

// Mostra feedback visual
function showFeedback(square, type) {
    const feedback = document.createElement('div');
    feedback.style.position = 'absolute';
    feedback.style.top = '50%';
    feedback.style.left = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.fontSize = '50px';
    feedback.style.fontWeight = 'bold';
    feedback.style.pointerEvents = 'none';
    feedback.style.zIndex = '1000';
    feedback.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.8)';
    
    if (type === 'hit') {
        feedback.textContent = '+1';
        feedback.style.color = '#00ff00';
        feedback.style.animation = 'feedbackPop 0.6s ease-out';
    } else if (type === 'combo') {
        feedback.textContent = `COMBO x${state.value.combo}!`;
        feedback.style.color = '#ffff00';
        feedback.style.fontSize = '40px';
        feedback.style.animation = 'feedbackPop 0.8s ease-out';
    } else if (type === 'miss') {
        feedback.textContent = '✕';
        feedback.style.color = '#ff0000';
        feedback.style.fontSize = '60px';
        feedback.style.animation = 'feedbackShake 0.5s ease-out';
    }
    
    square.style.position = 'relative';
    square.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 800);
}

// Aumenta velocidade por níveis
function increaseSpeed() {
    const speedLevels = {
        5: 900,
        10: 800,
        15: 700,
        25: 600,
        35: 500,
        45: 400,
        60: 320,
        80: 250,
    };

    if (speedLevels[state.value.result]) {
        clearInterval(state.actions.timerId);
        state.value.gameVelocity = speedLevels[state.value.result];
        moveEnemy();
        playSound('speedup');
        showLevelUp();
    }
}

// Notificação de level up
function showLevelUp() {
    const notification = document.createElement('div');
    notification.textContent = '⚡ SPEED UP! ⚡';
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.fontSize = '52px';
    notification.style.fontWeight = 'bold';
    notification.style.color = '#ffaa00';
    notification.style.textShadow = '4px 4px 12px rgba(0, 0, 0, 0.9)';
    notification.style.zIndex = '9999';
    notification.style.pointerEvents = 'none';
    notification.style.animation = 'levelUpAnim 1.2s ease-out';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 1200);
}

// Posiciona inimigo aleatoriamente
function randomSquare() {
    state.view.squares.forEach((square) => {
        square.classList.remove('enemy');
    });

    let randomNumber = Math.floor(Math.random() * 9);
    let randomSquare = state.view.squares[randomNumber];
    randomSquare.classList.add('enemy');
    state.value.hitPosition = randomSquare.id;
}

// Move o inimigo
function moveEnemy() {
    state.actions.timerId = setInterval(randomSquare, state.value.gameVelocity);
}

// Sistema de combo
function updateCombo(hit) {
    if (hit) {
        state.value.combo++;
        if (state.value.combo > state.value.maxCombo) {
            state.value.maxCombo = state.value.combo;
        }
        if (state.value.combo >= 5 && state.value.combo % 5 === 0) {
            playSound('combo');
        }
    } else {
        state.value.combo = 0;
    }
}

// Adiciona listeners nos quadrados
function addListenerHitbox() {
    state.view.squares.forEach((square) => {
        square.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            const hasEnemy = square.classList.contains('enemy');
            const isCorrectSquare = square.id === state.value.hitPosition;
            
            if (hasEnemy && isCorrectSquare) {
                state.value.result++;
                state.view.score.textContent = state.value.result;
                
                updateCombo(true);
                playSound('hit');
                
                if (state.value.combo >= 5 && state.value.combo % 5 === 0) {
                    showFeedback(square, 'combo');
                } else {
                    showFeedback(square, 'hit');
                }
                
                square.classList.remove('enemy');
                state.value.hitPosition = null;
                
                increaseSpeed();
                
            } else if (!hasEnemy) {
                updateCombo(false);
                playSound('miss');
                showFeedback(square, 'miss');
                loseLife();
            }
        });
        
        square.addEventListener('mouseenter', () => {
            if (square.classList.contains('enemy')) {
                square.style.transform = 'scale(1.03)';
            }
        });
        
        square.addEventListener('mouseleave', () => {
            square.style.transform = 'scale(1)';
        });
    });
}

// Remove uma vida com animação
function loseLife() {
    if (state.value.currentLives > 0) {
        state.value.currentLives--;
        playSound('lose');
        
        const lostHeart = state.view.hearts[state.value.currentLives];
        if (lostHeart) {
            lostHeart.style.animation = 'heartBreak 0.5s ease-out';
            setTimeout(() => {
                lostHeart.style.animation = '';
            }, 500);
        }
        
        updateLivesDisplay();

        if (state.value.currentLives === 0) {
            endGame('💀 Sem vidas restantes!');
        }
    }
}

// Contador regressivo
function countDown() {
    state.value.currentTime--;
    state.view.timeleft.textContent = state.value.currentTime;

    if (state.value.currentTime <= 10 && state.value.currentTime > 0) {
        state.view.timeleft.style.color = '#ff3333';
        state.view.timeleft.style.transform = 'scale(1.15)';
        setTimeout(() => {
            state.view.timeleft.style.transform = 'scale(1)';
        }, 150);
    }

    if (state.value.currentTime <= 0) {
        endGame('⏰ Tempo esgotado!');
    }
}

// Cria o elemento de Game Over no DOM
function createGameOverElement() {
    const gameOverHTML = `
        <div class="GAMEROVERFATHER" id="gameOverScreen">
            <div class="GAMEROVER">
                <H2>GAME<br>OVER</H2>
                <p class="game-message" id="gameMessage"></p>
                <div class="game-stats">
                    <div class="stat-item">
                        <span class="stat-label">🏆 Pontuação Final:</span>
                        <span class="stat-value" id="finalScore">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🔥 Maior Combo:</span>
                        <span class="stat-value" id="finalCombo">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⏱️ Tempo Jogado:</span>
                        <span class="stat-value" id="timeSpent">0s</span>
                    </div>
                </div>
                <button id="playAgainBtn">PLAY AGAIN</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', gameOverHTML);
    
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        location.reload();
    });
}

// Mostra a tela de Game Over
function showGameOver(message, score, maxCombo, timeSpent) {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameMessage = document.getElementById('gameMessage');
    const finalScore = document.getElementById('finalScore');
    const finalCombo = document.getElementById('finalCombo');
    const timeSpentElement = document.getElementById('timeSpent');
    
    gameMessage.textContent = message;
    finalScore.textContent = score;
    finalCombo.textContent = maxCombo;
    timeSpentElement.textContent = `${timeSpent}s`;
    
    gameOverScreen.classList.add('show');
    playGameOverSound();
}

// Finaliza o jogo
function endGame(message) {
    clearInterval(state.actions.countDownTimerId);
    clearInterval(state.actions.timerId);
    
    const timeSpent = 60 - state.value.currentTime;
    
    state.view.squares.forEach((square) => {
        square.classList.remove('enemy');
    });
    
    setTimeout(() => {
        showGameOver(message, state.value.result, state.value.maxCombo, timeSpent);
    }, 300);
}

// Adiciona animações CSS
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes feedbackPop {
            0% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(0.5); 
            }
            40% { 
                opacity: 1; 
                transform: translate(-50%, -70%) scale(1.2); 
            }
            100% { 
                opacity: 0; 
                transform: translate(-50%, -110%) scale(0.7); 
            }
        }
        
        @keyframes feedbackShake {
            0%, 100% { 
                transform: translate(-50%, -50%) rotate(0deg); 
                opacity: 1;
            }
            25% { 
                transform: translate(-45%, -50%) rotate(-10deg); 
            }
            50% { 
                transform: translate(-55%, -50%) rotate(10deg); 
            }
            75% { 
                transform: translate(-50%, -50%) rotate(-5deg); 
            }
            100% { 
                opacity: 0;
            }
        }
        
        @keyframes levelUpAnim {
            0% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(0.3); 
            }
            40% { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1.3); 
            }
            100% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(1); 
            }
        }
        
        @keyframes heartBreak {
            0%, 100% { 
                transform: scale(1) rotate(0deg); 
            }
            20% { 
                transform: scale(1.3) rotate(-15deg); 
            }
            40% { 
                transform: scale(0.8) rotate(15deg); 
            }
            60% { 
                transform: scale(1.2) rotate(-10deg); 
            }
            80% { 
                transform: scale(0.9) rotate(5deg); 
            }
        }
        
        .squarer {
            transition: transform 0.15s ease;
            cursor: pointer;
        }
        
        .enemy {
            animation: enemyBounce 0.6s ease-in-out infinite;
        }
        
        @keyframes enemyBounce {
            0%, 100% { 
                transform: scale(1); 
            }
            50% { 
                transform: scale(1.08); 
            }
        }

        /* GAME OVER STYLES - ULTRA PREMIUM */
        .GAMEROVERFATHER {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(139, 0, 0, 0.2) 0%, transparent 40%),
                radial-gradient(circle at 20% 80%, rgba(75, 0, 130, 0.15) 0%, transparent 40%),
                rgba(0, 0, 0, 0.95);
            z-index: 10000;
            backdrop-filter: blur(12px) saturate(150%);
            animation: fadeIn 0.5s ease-out;
        }

        .GAMEROVERFATHER.show {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .GAMEROVER {
            background: 
                linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95)),
                radial-gradient(circle at top left, rgba(255, 51, 51, 0.1), transparent),
                radial-gradient(circle at bottom right, rgba(139, 0, 0, 0.15), transparent);
            border: 3px solid transparent;
            background-clip: padding-box;
            position: relative;
            border-radius: 25px;
            padding: 60px 70px;
            text-align: center;
            box-shadow: 
                0 25px 80px rgba(255, 0, 0, 0.5),
                0 15px 40px rgba(0, 0, 0, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: gameOverSlide 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 550px;
            overflow: hidden;
        }

        .GAMEROVER::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, 
                #ff0000, #ff3333, #ff0000, #cc0000, 
                #ff0000, #ff3333, #ff0000);
            background-size: 400% 400%;
            border-radius: 25px;
            z-index: -1;
            animation: borderGlow 3s ease infinite;
            filter: blur(2px);
        }

        .GAMEROVER::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
                transparent, 
                rgba(255, 255, 255, 0.1), 
                transparent);
            animation: shine 3s ease-in-out infinite;
        }

        .GAMEROVER H2 {
            font-size: 80px;
            font-weight: 900;
            color: #ff3333;
            text-shadow: 
                0 0 30px rgba(255, 51, 51, 1),
                0 0 60px rgba(255, 0, 0, 0.8),
                5px 5px 15px rgba(0, 0, 0, 0.9),
                -2px -2px 10px rgba(255, 51, 51, 0.5);
            margin: 0 0 15px 0;
            line-height: 0.95;
            letter-spacing: 5px;
            animation: glitchText 1s ease-in-out infinite, titlePulse 2s ease-in-out infinite;
            position: relative;
            z-index: 1;
            font-family: 'Impact', 'Arial Black', sans-serif;
        }

        .game-stats {
            background: 
                linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(20, 20, 40, 0.5));
            border: 2px solid rgba(255, 51, 51, 0.3);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
            box-shadow: 
                inset 0 2px 10px rgba(0, 0, 0, 0.5),
                0 4px 15px rgba(255, 51, 51, 0.2);
        }

        .game-stats::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 51, 51, 0.1) 0%, transparent 70%);
            animation: statsGlow 4s ease-in-out infinite;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 15px 0;
            padding: 10px 5px;
            font-size: 21px;
            color: #fff;
            position: relative;
            z-index: 1;
            transition: all 0.3s ease;
        }

        .stat-item:hover {
            transform: translateX(5px);
            text-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
        }

        .stat-label {
            color: #ccc;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 18px;
            letter-spacing: 1px;
        }

        .stat-value {
            font-weight: 900;
            font-size: 32px;
            color: #ffaa00;
            text-shadow: 
                0 0 15px rgba(255, 170, 0, 0.8),
                0 0 30px rgba(255, 170, 0, 0.4),
                2px 2px 5px rgba(0, 0, 0, 0.8);
            animation: valueGlow 2s ease-in-out infinite;
        }

        .game-message {
            font-size: 26px;
            color: #ffdd44;
            margin: 25px 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 
                0 0 20px rgba(255, 221, 68, 0.8),
                3px 3px 8px rgba(0, 0, 0, 0.9);
            animation: messagePulse 1.5s ease-in-out infinite;
        }

        .GAMEROVER button {
            background: linear-gradient(135deg, #ff3333 0%, #cc0000 50%, #ff3333 100%);
            background-size: 200% 200%;
            color: white;
            border: 3px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 20px 50px;
            font-size: 24px;
            font-weight: 900;
            cursor: pointer;
            margin-top: 30px;
            box-shadow: 
                0 8px 25px rgba(255, 51, 51, 0.5),
                0 4px 10px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            text-transform: uppercase;
            letter-spacing: 3px;
            position: relative;
            overflow: hidden;
            animation: buttonBreath 2s ease-in-out infinite;
        }

        .GAMEROVER button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .GAMEROVER button:hover::before {
            width: 300px;
            height: 300px;
        }

        .GAMEROVER button:hover {
            background-position: 100% 0;
            transform: translateY(-5px) scale(1.08);
            box-shadow: 
                0 15px 40px rgba(255, 51, 51, 0.7),
                0 8px 20px rgba(255, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
            border-color: rgba(255, 255, 255, 0.5);
        }

        .GAMEROVER button:active {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 
                0 8px 20px rgba(255, 51, 51, 0.6),
                0 4px 10px rgba(255, 0, 0, 0.4);
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes gameOverSlide {
            0% {
                opacity: 0;
                transform: translateY(-150px) scale(0.7) rotateX(30deg);
            }
            60% {
                transform: translateY(15px) scale(1.05) rotateX(-5deg);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1) rotateX(0deg);
            }
        }

        @keyframes glitchText {
            0%, 90%, 100% {
                text-shadow: 
                    0 0 30px rgba(255, 51, 51, 1),
                    0 0 60px rgba(255, 0, 0, 0.8),
                    5px 5px 15px rgba(0, 0, 0, 0.9);
            }
            92% {
                text-shadow: 
                    -3px 0 30px rgba(255, 51, 51, 1),
                    3px 0 60px rgba(0, 255, 255, 0.8),
                    5px 5px 15px rgba(0, 0, 0, 0.9);
                transform: skew(-2deg);
            }
            94% {
                text-shadow: 
                    3px 0 30px rgba(255, 51, 51, 1),
                    -3px 0 60px rgba(255, 255, 0, 0.8),
                    5px 5px 15px rgba(0, 0, 0, 0.9);
                transform: skew(2deg);
            }
        }

        @keyframes titlePulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
        }

        @keyframes borderGlow {
            0%, 100% {
                background-position: 0% 50%;
                opacity: 0.8;
            }
            50% {
                background-position: 100% 50%;
                opacity: 1;
            }
        }

        @keyframes shine {
            0% {
                left: -100%;
            }
            50%, 100% {
                left: 100%;
            }
        }

        @keyframes statsGlow {
            0%, 100% {
                transform: translate(-50%, -50%) rotate(0deg);
                opacity: 0.3;
            }
            50% {
                transform: translate(-50%, -50%) rotate(180deg);
                opacity: 0.5;
            }
        }

        @keyframes valueGlow {
            0%, 100% {
                text-shadow: 
                    0 0 15px rgba(255, 170, 0, 0.8),
                    0 0 30px rgba(255, 170, 0, 0.4),
                    2px 2px 5px rgba(0, 0, 0, 0.8);
            }
            50% {
                text-shadow: 
                    0 0 25px rgba(255, 170, 0, 1),
                    0 0 50px rgba(255, 170, 0, 0.6),
                    2px 2px 5px rgba(0, 0, 0, 0.8);
            }
        }

        @keyframes messagePulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.05);
                opacity: 0.9;
            }
        }

        @keyframes buttonBreath {
            0%, 100% {
                box-shadow: 
                    0 8px 25px rgba(255, 51, 51, 0.5),
                    0 4px 10px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
            50% {
                box-shadow: 
                    0 10px 35px rgba(255, 51, 51, 0.7),
                    0 6px 15px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4);
            }
        }
    `;
    document.head.appendChild(style);
}

// Inicializa o jogo
function initialize() {
    console.log('🎮 Detona Ralph - Jogo Iniciado!');
    
    addAnimations();
    createGameOverElement();
    updateLivesDisplay();
    addListenerHitbox();
    
    state.view.timeleft.textContent = state.value.currentTime;
    state.view.score.textContent = state.value.result;
    
    setTimeout(() => {
        randomSquare();
        moveEnemy();
        state.actions.countDownTimerId = setInterval(countDown, 1000);
    }, 300);
}

// Inicia o jogo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}