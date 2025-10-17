class BattleshipGame {
    constructor() {
        this.boardSize = 10;
        this.playerBoard = [];
        this.computerBoard = [];
        this.playerShips = [];
        this.computerShips = [];
        this.currentShip = null;
        this.shipOrientation = 'horizontal';
        this.gamePhase = 'setup';
        this.currentTurn = 'player';
        this.playerShipsRemaining = 5;
        this.computerShipsRemaining = 5;
        
        this.shipTypes = {
            carrier: { size: 5, name: 'Porta-Aviões' },
            battleship: { size: 4, name: 'Encouraçado' },
            cruiser: { size: 3, name: 'Cruzador' },
            submarine: { size: 3, name: 'Submarino' },
            destroyer: { size: 2, name: 'Destróier' }
        };
        
        this.shipsToPlace = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
        this.placedShips = [];
        
        // Sistema de áudio
        this.audioContext = null;
        this.sounds = {};
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.backgroundMusic = null;
        
        this.init();
    }
    
    init() {
        this.createBoards();
        this.setupEventListeners();
        this.initAudio();
        this.updateUI();
    }
    
    initAudio() {
        // Inicializar AudioContext
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API não suportada');
            return;
        }
        
        // Criar sons sintéticos
        this.createSounds();
        
        // Iniciar música de fundo após interação do usuário
        document.addEventListener('click', () => {
            if (this.musicEnabled && !this.backgroundMusic) {
                this.startBackgroundMusic();
            }
        }, { once: true });
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        // Som de explosão
        this.sounds.explosion = () => {
            if (!this.sfxEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.5);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
        
        // Som de miss (splash)
        this.sounds.miss = () => {
            if (!this.sfxEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
        
        // Som de navio afundado
        this.sounds.sunk = () => {
            if (!this.sfxEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 1);
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1);
        };
        
        // Som de clique
        this.sounds.click = () => {
            if (!this.sfxEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
        
        // Som de hover
        this.sounds.hover = () => {
            if (!this.sfxEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(700, this.audioContext.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
        
        // Som de vitória
        this.sounds.victory = () => {
            if (!this.sfxEnabled) return;
            
            const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
            let delay = 0;
            
            notes.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + delay);
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime + delay);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.5);
                
                oscillator.start(this.audioContext.currentTime + delay);
                oscillator.stop(this.audioContext.currentTime + delay + 0.5);
                
                delay += 0.2;
            });
        };
        
        // Som de derrota
        this.sounds.defeat = () => {
            if (!this.sfxEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 1);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1);
        };
    }
    
    startBackgroundMusic() {
        if (!this.musicEnabled || !this.audioContext) return;
        
        const playNote = (frequency, duration, delay = 0) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + delay);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + delay + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + delay + duration);
            
            oscillator.start(this.audioContext.currentTime + delay);
            oscillator.stop(this.audioContext.currentTime + delay + duration);
        };
        
        const playChord = (frequencies, duration, delay = 0) => {
            frequencies.forEach(freq => playNote(freq, duration, delay));
        };
        
        const ambientLoop = () => {
            if (!this.musicEnabled) return;
            
            // Acorde atmosférico
            playChord([220, 277, 330], 4, 0);
            playChord([246, 311, 370], 4, 4);
            playChord([196, 247, 294], 4, 8);
            playChord([220, 277, 330], 4, 12);
            
            // Repetir após 16 segundos
            setTimeout(ambientLoop, 16000);
        };
        
        // Iniciar loop
        ambientLoop();
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const musicBtn = document.getElementById('music-toggle');
        
        if (this.musicEnabled) {
            musicBtn.classList.add('active');
            musicBtn.innerHTML = '🎵';
            this.startBackgroundMusic();
        } else {
            musicBtn.classList.remove('active');
            musicBtn.innerHTML = '🔇';
        }
        
        // Som de clique
        if (this.sounds.click) this.sounds.click();
    }
    
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        const sfxBtn = document.getElementById('sfx-toggle');
        
        if (this.sfxEnabled) {
            sfxBtn.classList.add('active');
            sfxBtn.innerHTML = '🔊';
        } else {
            sfxBtn.classList.remove('active');
            sfxBtn.innerHTML = '🔇';
        }
        
        // Som de clique
        if (this.sounds.click) this.sounds.click();
    }
    
    createBoards() {
        // Inicializar tabuleiros vazios
        this.playerBoard = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.computerBoard = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        
        // Criar elementos do tabuleiro do jogador
        const playerBoardElement = document.getElementById('player-board');
        playerBoardElement.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('dragover', (e) => this.handleDragOver(e));
                cell.addEventListener('drop', (e) => this.handleDrop(e));
                cell.addEventListener('dragenter', (e) => this.handleDragEnter(e));
                cell.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                playerBoardElement.appendChild(cell);
            }
        }
        
        // Criar elementos do tabuleiro do computador
        const computerBoardElement = document.getElementById('computer-board');
        computerBoardElement.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.style.cursor = 'pointer';
                cell.title = `Célula ${row},${col}`;
                computerBoardElement.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        // Drag and drop para navios
        document.querySelectorAll('.ship-item').forEach(shipItem => {
            shipItem.addEventListener('dragstart', (e) => this.handleDragStart(e));
            shipItem.addEventListener('dragend', (e) => this.handleDragEnd(e));
            // Adicionar clique como alternativa ao drag & drop
            shipItem.addEventListener('click', (e) => this.handleShipClick(e));
        });
        
        // Botão de rotação
        document.getElementById('rotate-btn').addEventListener('click', () => {
            if (this.sounds.click) this.sounds.click();
            this.rotateShip();
        });
        
        // Botão de iniciar jogo
        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (this.sounds.click) this.sounds.click();
            this.startGame();
        });
        
        // Botão de reiniciar
        document.getElementById('restart-btn').addEventListener('click', () => {
            if (this.sounds.click) this.sounds.click();
            this.restartGame();
        });
        
        // Cliques no tabuleiro do jogador para posicionar navios
        document.getElementById('player-board').addEventListener('click', (e) => this.handlePlayerBoardClick(e));
        
        // Cliques no tabuleiro do computador
        document.getElementById('computer-board').addEventListener('click', (e) => this.handleComputerBoardClick(e));
        
        // Adicionar eventos de mouse para feedback visual
        document.getElementById('computer-board').addEventListener('mouseover', (e) => {
            this.handleCellHover(e, true);
            if (this.sounds.hover) this.sounds.hover();
        });
        document.getElementById('computer-board').addEventListener('mouseout', (e) => this.handleCellHover(e, false));
        
        // Controles de áudio
        document.getElementById('music-toggle').addEventListener('click', () => this.toggleMusic());
        document.getElementById('sfx-toggle').addEventListener('click', () => this.toggleSFX());
    }
    
    handleDragStart(e) {
        if (this.gamePhase !== 'setup') return;
        
        // Encontrar o elemento ship-item (pode ser o target ou um pai)
        let shipItem = e.target;
        while (shipItem && !shipItem.classList.contains('ship-item')) {
            shipItem = shipItem.parentElement;
        }
        
        if (!shipItem) return;
        
        const shipType = shipItem.dataset.ship;
        if (!this.shipsToPlace.includes(shipType)) {
            e.preventDefault();
            return;
        }
        
        this.currentShip = shipType;
        shipItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', shipType);
    }
    
    handleDragEnd(e) {
        // Encontrar o elemento ship-item (pode ser o target ou um pai)
        let shipItem = e.target;
        while (shipItem && !shipItem.classList.contains('ship-item')) {
            shipItem = shipItem.parentElement;
        }
        
        if (shipItem) {
            shipItem.classList.remove('dragging');
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleDragEnter(e) {
        e.preventDefault();
        if (this.canPlaceShip(e.target.dataset.row, e.target.dataset.col)) {
            e.target.style.background = 'rgba(34, 197, 94, 0.3)';
        } else {
            e.target.style.background = 'rgba(239, 68, 68, 0.3)';
        }
    }
    
    handleDragLeave(e) {
        e.target.style.background = '';
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.target.style.background = '';
        
        if (!this.currentShip) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        if (this.canPlaceShip(row, col)) {
            this.placeShip(row, col, this.currentShip);
        }
    }
    
    handleShipClick(e) {
        if (this.gamePhase !== 'setup') return;
        
        // Encontrar o elemento ship-item
        let shipItem = e.target;
        while (shipItem && !shipItem.classList.contains('ship-item')) {
            shipItem = shipItem.parentElement;
        }
        
        if (!shipItem) return;
        
        const shipType = shipItem.dataset.ship;
        if (!this.shipsToPlace.includes(shipType)) return;
        
        // Som de clique
        if (this.sounds.click) this.sounds.click();
        
        // Selecionar o navio para posicionamento
        this.currentShip = shipType;
        
        // Destacar o navio selecionado
        document.querySelectorAll('.ship-item').forEach(item => {
            item.classList.remove('selected');
        });
        shipItem.classList.add('selected');
        
        // Mostrar instruções
        this.showShipPlacementInstructions();
    }
    
    handlePlayerBoardClick(e) {
        if (this.gamePhase !== 'setup' || !this.currentShip) return;
        
        if (!e.target.classList.contains('cell')) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        if (this.canPlaceShip(row, col)) {
            this.placeShip(row, col, this.currentShip);
            this.currentShip = null;
            
            // Remover destaque dos navios
            document.querySelectorAll('.ship-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            this.hideShipPlacementInstructions();
        }
    }
    
    showShipPlacementInstructions() {
        let instructions = document.getElementById('ship-instructions');
        if (!instructions) {
            instructions = document.createElement('div');
            instructions.id = 'ship-instructions';
            instructions.className = 'ship-instructions';
            instructions.innerHTML = `
                <p>🎯 Clique em uma célula do tabuleiro para posicionar o navio</p>
                <p>Use o botão "Rotacionar" para mudar a direção</p>
            `;
            document.querySelector('.setup-phase').appendChild(instructions);
        }
        instructions.style.display = 'block';
    }
    
    hideShipPlacementInstructions() {
        const instructions = document.getElementById('ship-instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }
    
    canPlaceShip(row, col) {
        if (!this.currentShip) return false;
        
        const shipSize = this.shipTypes[this.currentShip].size;
        const ship = {
            row: row,
            col: col,
            size: shipSize,
            orientation: this.shipOrientation
        };
        
        return this.isValidShipPlacement(ship, this.playerBoard);
    }
    
    isValidShipPlacement(ship, board) {
        const { row, col, size, orientation } = ship;
        
        // Verificar se o navio cabe no tabuleiro
        if (orientation === 'horizontal') {
            if (col + size > this.boardSize) return false;
        } else {
            if (row + size > this.boardSize) return false;
        }
        
        // Verificar se não há conflitos com outros navios
        for (let i = 0; i < size; i++) {
            let checkRow = row + (orientation === 'vertical' ? i : 0);
            let checkCol = col + (orientation === 'horizontal' ? i : 0);
            
            if (board[checkRow][checkCol] !== 0) return false;
        }
        
        return true;
    }
    
    placeShip(row, col, shipType) {
        const shipSize = this.shipTypes[shipType].size;
        const ship = {
            type: shipType,
            row: row,
            col: col,
            size: shipSize,
            orientation: this.shipOrientation,
            hits: 0
        };
        
        // Marcar no tabuleiro
        for (let i = 0; i < shipSize; i++) {
            let shipRow = row + (this.shipOrientation === 'vertical' ? i : 0);
            let shipCol = col + (this.shipOrientation === 'horizontal' ? i : 0);
            
            this.playerBoard[shipRow][shipCol] = shipType;
            
            // Atualizar visual
            const cell = document.querySelector(`#player-board .cell[data-row="${shipRow}"][data-col="${shipCol}"]`);
            cell.classList.add('ship');
        }
        
        this.playerShips.push(ship);
        this.placedShips.push(shipType);
        this.shipsToPlace = this.shipsToPlace.filter(s => s !== shipType);
        
        // Remover navio da seleção
        const shipItem = document.querySelector(`[data-ship="${shipType}"]`);
        shipItem.style.display = 'none';
        
        // Verificar se todos os navios foram colocados
        if (this.shipsToPlace.length === 0) {
            document.getElementById('start-game-btn').disabled = false;
        }
        
        this.updateUI();
    }
    
    rotateShip() {
        this.shipOrientation = this.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        
        // Atualizar visual dos navios não colocados
        document.querySelectorAll('.ship-visual').forEach(visual => {
            visual.style.flexDirection = this.shipOrientation === 'horizontal' ? 'row' : 'column';
        });
    }
    
    startGame() {
        this.gamePhase = 'playing';
        this.placeComputerShips();
        
        // Criar novo tabuleiro do jogador para a fase de jogo
        this.createGameBoards();
        
        document.getElementById('setup-phase').style.display = 'none';
        document.getElementById('game-phase').style.display = 'block';
        
        this.updateUI();
    }
    
    createGameBoards() {
        // Criar elementos do tabuleiro do jogador para a fase de jogo
        const playerBoardElement = document.getElementById('player-board');
        playerBoardElement.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Mostrar navios do jogador
                if (this.playerBoard[row][col] && this.playerBoard[row][col] !== 0 && 
                    this.playerBoard[row][col] !== 'hit' && this.playerBoard[row][col] !== 'miss') {
                    cell.classList.add('ship');
                }
                
                playerBoardElement.appendChild(cell);
            }
        }
        
        // Atualizar visual do tabuleiro do jogador após criação
        this.updatePlayerBoardVisual();
        
        // Criar elementos do tabuleiro do computador para a fase de jogo
        const computerBoardElement = document.getElementById('computer-board');
        computerBoardElement.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.style.cursor = 'pointer';
                cell.title = `Célula ${row},${col}`;
                computerBoardElement.appendChild(cell);
            }
        }
    }
    
    placeComputerShips() {
        const shipTypes = Object.keys(this.shipTypes);
        
        shipTypes.forEach(shipType => {
            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * this.boardSize);
                const col = Math.floor(Math.random() * this.boardSize);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                const ship = {
                    type: shipType,
                    row: row,
                    col: col,
                    size: this.shipTypes[shipType].size,
                    orientation: orientation,
                    hits: 0
                };
                
                if (this.isValidShipPlacement(ship, this.computerBoard)) {
                    // Marcar no tabuleiro do computador
                    for (let i = 0; i < ship.size; i++) {
                        let shipRow = row + (orientation === 'vertical' ? i : 0);
                        let shipCol = col + (orientation === 'horizontal' ? i : 0);
                        this.computerBoard[shipRow][shipCol] = shipType;
                    }
                    
                    this.computerShips.push(ship);
                    placed = true;
                }
            }
        });
    }
    
    handleCellHover(e, isOver) {
        if (this.gamePhase !== 'playing' || this.currentTurn !== 'player') return;
        
        let cell = e.target;
        while (cell && !cell.classList.contains('cell')) {
            cell = cell.parentElement;
        }
        
        if (!cell || !cell.dataset.row || !cell.dataset.col) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Só destacar se a célula ainda não foi atacada
        if (this.computerBoard[row][col] !== 'hit' && this.computerBoard[row][col] !== 'miss') {
            if (isOver) {
                cell.style.background = 'rgba(59, 130, 246, 0.3)';
                cell.style.transform = 'scale(1.05)';
            } else {
                cell.style.background = '';
                cell.style.transform = '';
            }
        }
    }
    
    handleComputerBoardClick(e) {
        if (this.gamePhase !== 'playing' || this.currentTurn !== 'player') return;
        
        // Encontrar a célula clicada
        let cell = e.target;
        while (cell && !cell.classList.contains('cell')) {
            cell = cell.parentElement;
        }
        
        if (!cell || !cell.dataset.row || !cell.dataset.col) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Verificar se já foi atacado
        if (this.computerBoard[row][col] === 'hit' || this.computerBoard[row][col] === 'miss') {
            console.log(`Célula ${row},${col} já foi atacada`); // Debug
            return;
        }
        
        console.log(`Atacando célula ${row},${col}`); // Debug
        
        // Remover hover effect
        cell.style.background = '';
        cell.style.transform = '';
        
        this.makeMove(row, col);
    }
    
    makeMove(row, col) {
        const cell = document.querySelector(`#computer-board .cell[data-row="${row}"][data-col="${col}"]`);
        
        if (this.computerBoard[row][col] !== 0) {
            // Acertou um navio
            const shipType = this.computerBoard[row][col];
            this.computerBoard[row][col] = 'hit';
            cell.classList.add('hit');
            cell.innerHTML = '💥';
            
            // Som de explosão
            if (this.sounds.explosion) this.sounds.explosion();
            
            // Efeito visual
            this.createExplosionEffect(cell);
            
            // Atualizar navio
            const ship = this.computerShips.find(s => s.type === shipType);
            ship.hits++;
            
            if (ship.hits === ship.size) {
                // Navio afundado
                this.sinkShip(ship, this.computerBoard, 'computer');
                this.computerShipsRemaining--;
                
                // Som de navio afundado
                if (this.sounds.sunk) this.sounds.sunk();
                
                if (this.computerShipsRemaining === 0) {
                    this.endGame('player');
                    return;
                }
            }
            
            // Jogador continua
            this.currentTurn = 'player';
        } else {
            // Errou
            this.computerBoard[row][col] = 'miss';
            cell.classList.add('miss');
            
            // Som de miss
            if (this.sounds.miss) this.sounds.miss();
            
            // Efeito visual
            this.createWaveEffect(cell);
            
            // Vez do computador
            this.currentTurn = 'computer';
            setTimeout(() => this.computerMove(), 1000);
        }
        
        this.updateUI();
    }
    
    computerMove() {
        if (this.gamePhase !== 'playing' || this.currentTurn !== 'computer') return;
        
        // Mostrar que a IA está pensando
        this.updateUI();
        
        let row, col;
        let attempts = 0;
        
        // Estratégia muito mais inteligente da IA
        const hitCells = [];
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.playerBoard[r][c] === 'hit') {
                    hitCells.push({ row: r, col: c });
                }
            }
        }
        
        if (hitCells.length > 0) {
            // Estratégia de perseguição: encontrar a direção do navio
            const shipDirection = this.findShipDirection(hitCells);
            
            if (shipDirection) {
                // Continuar atacando na direção encontrada
                const nextTarget = this.getNextTargetInDirection(shipDirection);
                if (nextTarget) {
                    row = nextTarget.row;
                    col = nextTarget.col;
                }
            }
            
            // Se não conseguiu determinar direção ou não há próximo alvo
            if (!row && !col) {
                const adjacentCells = [];
                hitCells.forEach(hit => {
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    directions.forEach(([dr, dc]) => {
                        const newRow = hit.row + dr;
                        const newCol = hit.col + dc;
                        if (newRow >= 0 && newRow < this.boardSize && 
                            newCol >= 0 && newCol < this.boardSize &&
                            this.playerBoard[newRow][newCol] !== 'hit' && this.playerBoard[newRow][newCol] !== 'miss') {
                            adjacentCells.push({ row: newRow, col: newCol });
                        }
                    });
                });
                
                if (adjacentCells.length > 0) {
                    const target = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
                    row = target.row;
                    col = target.col;
                }
            }
        }
        
        // Estratégia de padrão: atacar em grid quando não há navios acertados
        if (!row && !col) {
            const gridTarget = this.getGridTarget();
            if (gridTarget) {
                row = gridTarget.row;
                col = gridTarget.col;
            }
        }
        
        // Se não encontrou alvo estratégico, atacar aleatoriamente
        if (!row && !col) {
            do {
                row = Math.floor(Math.random() * this.boardSize);
                col = Math.floor(Math.random() * this.boardSize);
                attempts++;
            } while ((this.playerBoard[row][col] === 'hit' || this.playerBoard[row][col] === 'miss') && attempts < 100);
        }
        
        if (attempts >= 100) {
            // Fallback: atacar a primeira célula disponível
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.playerBoard[r][c] !== 'hit' && this.playerBoard[r][c] !== 'miss') {
                        row = r;
                        col = c;
                        break;
                    }
                }
                if (row !== undefined) break;
            }
        }
        
        // Delay para simular pensamento da IA
        setTimeout(() => {
            this.makePlayerMove(row, col);
        }, 1500 + Math.random() * 1000); // Entre 1.5 e 2.5 segundos
    }
    
    findShipDirection(hitCells) {
        if (hitCells.length < 2) return null;
        
        const first = hitCells[0];
        const second = hitCells[1];
        
        if (first.row === second.row) {
            return { direction: 'horizontal', row: first.row, startCol: Math.min(first.col, second.col) };
        } else if (first.col === second.col) {
            return { direction: 'vertical', col: first.col, startRow: Math.min(first.row, second.row) };
        }
        
        return null;
    }
    
    getNextTargetInDirection(direction) {
        if (direction.direction === 'horizontal') {
            const row = direction.row;
            let col = direction.startCol;
            
            // Procurar para a esquerda
            while (col > 0 && this.playerBoard[row][col - 1] === 'hit') {
                col--;
            }
            if (col > 0 && this.playerBoard[row][col - 1] === 0) {
                return { row, col: col - 1 };
            }
            
            // Procurar para a direita
            col = direction.startCol;
            while (col < this.boardSize - 1 && this.playerBoard[row][col + 1] === 'hit') {
                col++;
            }
            if (col < this.boardSize - 1 && this.playerBoard[row][col + 1] === 0) {
                return { row, col: col + 1 };
            }
        } else if (direction.direction === 'vertical') {
            const col = direction.col;
            let row = direction.startRow;
            
            // Procurar para cima
            while (row > 0 && this.playerBoard[row - 1][col] === 'hit') {
                row--;
            }
            if (row > 0 && this.playerBoard[row - 1][col] === 0) {
                return { row: row - 1, col };
            }
            
            // Procurar para baixo
            row = direction.startRow;
            while (row < this.boardSize - 1 && this.playerBoard[row + 1][col] === 'hit') {
                row++;
            }
            if (row < this.boardSize - 1 && this.playerBoard[row + 1][col] === 0) {
                return { row: row + 1, col };
            }
        }
        
        return null;
    }
    
    getGridTarget() {
        // Estratégia de grid: atacar em padrão de xadrez para maximizar chances
        const gridPattern = [];
        
        // Padrão mais eficiente: atacar em grid 2x2
        for (let r = 0; r < this.boardSize; r += 2) {
            for (let c = 0; c < this.boardSize; c += 2) {
                if (this.playerBoard[r][c] !== 'hit' && this.playerBoard[r][c] !== 'miss') {
                    gridPattern.push({ row: r, col: c });
                }
            }
        }
        
        // Se não há mais células no padrão principal, usar padrão alternativo
        if (gridPattern.length === 0) {
            for (let r = 1; r < this.boardSize; r += 2) {
                for (let c = 1; c < this.boardSize; c += 2) {
                    if (this.playerBoard[r][c] !== 'hit' && this.playerBoard[r][c] !== 'miss') {
                        gridPattern.push({ row: r, col: c });
                    }
                }
            }
        }
        
        if (gridPattern.length > 0) {
            return gridPattern[Math.floor(Math.random() * gridPattern.length)];
        }
        
        return null;
    }
    
    makePlayerMove(row, col) {
        const cell = document.querySelector(`#player-board .cell[data-row="${row}"][data-col="${col}"]`);
        
        // Atualizar UI para mostrar que é a vez da IA
        this.updateUI();
        
        // Mostrar indicador de ataque da IA
        this.showIAAttackIndicator(row, col);
        
        // Verificar se há um navio nesta posição (tipo de navio, não hit/miss/0)
        const cellValue = this.playerBoard[row][col];
        if (cellValue && cellValue !== 0 && cellValue !== 'hit' && cellValue !== 'miss' && 
            ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'].includes(cellValue)) {
            // Acertou um navio
            const shipType = cellValue;
            this.playerBoard[row][col] = 'hit';
            cell.classList.add('hit');
            cell.classList.remove('ship'); // Remover classe ship pois foi atingido
            cell.innerHTML = '💥';
            
            // Som de explosão
            if (this.sounds.explosion) this.sounds.explosion();
            
            // Efeito visual
            this.createExplosionEffect(cell);
            
            // Atualizar navio
            const ship = this.playerShips.find(s => s.type === shipType);
            ship.hits++;
            
            if (ship.hits === ship.size) {
                // Navio afundado
                this.sinkShip(ship, this.playerBoard, 'player');
                this.playerShipsRemaining--;
                
                // Som de navio afundado
                if (this.sounds.sunk) this.sounds.sunk();
                
                if (this.playerShipsRemaining === 0) {
                    this.endGame('computer');
                    return;
                }
            }
            
            // Computador continua
            this.currentTurn = 'computer';
            setTimeout(() => this.computerMove(), 1000);
        } else {
            // Errou - marca como miss se ainda não foi atacado
            if (this.playerBoard[row][col] === 0) {
                this.playerBoard[row][col] = 'miss';
                cell.classList.add('miss');
                
                // Som de miss
                if (this.sounds.miss) this.sounds.miss();
                
                // Efeito visual
                this.createWaveEffect(cell);
            }
            
            // Vez do jogador
            this.currentTurn = 'player';
        }
        
        this.updateUI();
    }
    
    showIAAttackIndicator(row, col) {
        const cell = document.querySelector(`#player-board .cell[data-row="${row}"][data-col="${col}"]`);
        
        // Criar indicador de mira da IA
        const crosshair = document.createElement('div');
        crosshair.className = 'ia-crosshair';
        crosshair.innerHTML = '🎯';
        crosshair.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.5em;
            z-index: 15;
            animation: iaTargeting 1.5s ease-out forwards;
            pointer-events: none;
        `;
        
        // Criar efeito de pulso no tabuleiro
        const pulseEffect = document.createElement('div');
        pulseEffect.className = 'ia-pulse';
        pulseEffect.style.cssText = `
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            border: 3px solid #ef4444;
            border-radius: 8px;
            animation: iaPulse 1.5s ease-out forwards;
            pointer-events: none;
        `;
        
        cell.style.position = 'relative';
        cell.appendChild(crosshair);
        cell.appendChild(pulseEffect);
        
        // Adicionar sombra vermelha temporária
        cell.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
        cell.style.border = '2px solid #ef4444';
        
        // Remover efeitos após animação
        setTimeout(() => {
            if (crosshair.parentNode) crosshair.remove();
            if (pulseEffect.parentNode) pulseEffect.remove();
            cell.style.boxShadow = '';
            cell.style.border = '';
        }, 1500);
    }
    
    sinkShip(ship, board, player) {
        const { row, col, size, orientation } = ship;
        
        for (let i = 0; i < size; i++) {
            let shipRow = row + (orientation === 'vertical' ? i : 0);
            let shipCol = col + (orientation === 'horizontal' ? i : 0);
            
            const cell = document.querySelector(`#${player}-board .cell[data-row="${shipRow}"][data-col="${shipCol}"]`);
            cell.classList.add('sunk');
            cell.classList.remove('hit');
            cell.innerHTML = '💀';
        }
    }
    
    createExplosionEffect(cell) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        cell.appendChild(explosion);
        
        setTimeout(() => {
            explosion.remove();
        }, 600);
    }
    
    createWaveEffect(cell) {
        const wave = document.createElement('div');
        wave.className = 'wave-effect';
        cell.appendChild(wave);
        
        setTimeout(() => {
            wave.remove();
        }, 800);
    }
    
    endGame(winner) {
        this.gamePhase = 'ended';
        
        document.getElementById('game-phase').style.display = 'none';
        document.getElementById('game-over').style.display = 'block';
        
        const winnerMessage = document.getElementById('winner-message');
        if (winner === 'player') {
            winnerMessage.textContent = '🎉 Parabéns! Você venceu! 🎉';
            winnerMessage.style.color = '#22c55e';
            // Som de vitória
            if (this.sounds.victory) this.sounds.victory();
        } else {
            winnerMessage.textContent = '😞 Você perdeu! Tente novamente! 😞';
            winnerMessage.style.color = '#ef4444';
            // Som de derrota
            if (this.sounds.defeat) this.sounds.defeat();
        }
    }
    
    restartGame() {
        // Resetar todas as variáveis
        this.playerBoard = [];
        this.computerBoard = [];
        this.playerShips = [];
        this.computerShips = [];
        this.currentShip = null;
        this.shipOrientation = 'horizontal';
        this.gamePhase = 'setup';
        this.currentTurn = 'player';
        this.playerShipsRemaining = 5;
        this.computerShipsRemaining = 5;
        this.shipsToPlace = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
        this.placedShips = [];
        
        // Resetar UI
        document.getElementById('setup-phase').style.display = 'block';
        document.getElementById('game-phase').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('start-game-btn').disabled = true;
        
        // Mostrar todos os navios novamente
        document.querySelectorAll('.ship-item').forEach(item => {
            item.style.display = 'block';
            item.classList.remove('selected');
        });
        
        // Remover instruções se existirem
        const instructions = document.getElementById('ship-instructions');
        if (instructions) {
            instructions.remove();
        }
        
        this.init();
    }
    
    updateUI() {
        // Atualizar contadores de navios
        document.getElementById('player-ships').textContent = this.playerShipsRemaining;
        document.getElementById('computer-ships').textContent = this.computerShipsRemaining;
        
        // Atualizar indicador de vez
        const turnIndicator = document.getElementById('current-turn');
        if (this.gamePhase === 'setup') {
            turnIndicator.textContent = 'Configuração';
            turnIndicator.style.background = 'rgba(59, 130, 246, 0.8)';
        } else if (this.currentTurn === 'player') {
            turnIndicator.textContent = 'Sua vez';
            turnIndicator.style.background = 'rgba(34, 197, 94, 0.8)';
        } else if (this.currentTurn === 'computer') {
            turnIndicator.textContent = 'IA pensando...';
            turnIndicator.style.background = 'rgba(239, 68, 68, 0.8)';
            turnIndicator.style.animation = 'pulse 1s infinite';
        } else {
            turnIndicator.textContent = 'Vez da IA';
            turnIndicator.style.background = 'rgba(239, 68, 68, 0.8)';
        }
        
        // Atualizar visual do tabuleiro do jogador durante o jogo
        if (this.gamePhase === 'playing') {
            this.updatePlayerBoardVisual();
        }
        
        // Atualizar estado dos controles de áudio
        this.updateAudioControls();
    }
    
    updatePlayerBoardVisual() {
        const playerBoardElement = document.getElementById('player-board');
        const cells = playerBoardElement.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Remover todas as classes de estado
            cell.classList.remove('ship', 'hit', 'miss', 'sunk');
            cell.innerHTML = '';
            
            // Aplicar estado correto baseado no board
            if (this.playerBoard[row][col] === 'hit') {
                cell.classList.add('hit');
                cell.innerHTML = '💥';
            } else if (this.playerBoard[row][col] === 'miss') {
                cell.classList.add('miss');
            } else if (this.playerBoard[row][col] === 'sunk') {
                cell.classList.add('sunk');
                cell.innerHTML = '💀';
            } else if (this.playerBoard[row][col] && this.playerBoard[row][col] !== 0) {
                cell.classList.add('ship');
            }
        });
    }
    
    updateAudioControls() {
        const musicBtn = document.getElementById('music-toggle');
        const sfxBtn = document.getElementById('sfx-toggle');
        
        if (musicBtn) {
            musicBtn.classList.toggle('active', this.musicEnabled);
            musicBtn.innerHTML = this.musicEnabled ? '🎵' : '🔇';
        }
        
        if (sfxBtn) {
            sfxBtn.classList.toggle('active', this.sfxEnabled);
            sfxBtn.innerHTML = this.sfxEnabled ? '🔊' : '🔇';
        }
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new BattleshipGame();
});
