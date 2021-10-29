(function() {
  ///
  /// Constants
  ///

  const TETRIS_CANVAS_ID = "tetris-field";

  const TETRIS_WIDTH = 320;   // 10 squares
  const TETRIS_HEIGHT = 640;  // 20 squares

  const TETRIS_INFO_WIDTH = 192; // 6 squares
  const TETRIS_INFO_HEIGHT = 256; // 8 squares

  const SQUARE_SIZE = 32;

  const FRAME_NUM_UPDATE = 35;

  const BEST_SCORE_COOKIE = "BEST_SCORE_COOKIE";

  const STATE_READY_TO_START = 'STATE_READY_TO_START',
    STATE_RESUME = 'TETRIS_RESUME',
    STATE_PAUSE = 'STATE_PAUSE',
    STATE_GAME_OVER = 'STATE_GAME_OVER';

  const TETRAMINO_GRID = {
    "I": [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    "J": [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    "L": [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    "O": [
      [1, 1],
      [1, 1],
    ],
    "S": [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    "T": [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    "Z": [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ]
  };

  const TETRAMINO_COLOR = {
    "I": "cyan",
    "J": 'blue',
    "L": "orange",
    "O": "yellow",
    "S": "green",
    "T": "purple",
    "Z": "red",
  };

  ///
  /// Variables
  ///

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  ///
  /// Tetris class
  ///

  /**
   * Constructor of Tetris instanse
   * @param {Canvas DOM} tetrisCanvasObj 
   */
  function Tetris(tetrisCanvasObj) {
    this.canvas = tetrisCanvasObj;

    if (this.canvas.getContext) {
      this.canvasContext = this.canvas.getContext('2d');
    } else {
      throw new Error("Canvas DOM object have no context");
    }

    // Getting array of keys
    this.tetraminoSequence = Object.keys(TETRAMINO_GRID);

    this.gameState = STATE_READY_TO_START;  // enum

    this.rAF = null;

    this.canvasTetrisInfo = null;

    this.canvasTetrisInfoContext = null;

    this.init();
  }


  /**
   * Initial method
   */
  Tetris.prototype.init = function() {
    // Set size of canvas
    this.canvas.setAttribute("width", TETRIS_WIDTH);
    this.canvas.setAttribute("height", TETRIS_HEIGHT);

    this.initPrimaryTetrisData();

    this.initCanvasTetrisInfo();
    
    this.setEventListeners();
  }

  Tetris.prototype.initPrimaryTetrisData = function() {
    this.currentTetramino = null;

    this.nextTetraminoType = this.generateAndReturnNextTetraminoType();

    this.frameNum = 0;

    this.scoreCount = 0;

    this.playField = new Array(TETRIS_HEIGHT / SQUARE_SIZE);

    for (let i=0; i < this.playField.length; i++) {
      this.playField[i] = new Array(TETRIS_WIDTH / SQUARE_SIZE).fill(0);
    }
  }
  

  Tetris.prototype.initCanvasTetrisInfo = function() {
    this.canvasTetrisInfo = document.createElement("CANVAS");
    insertAfter(this.canvasTetrisInfo, this.canvas);
    
    // Set style of canvas
    this.canvasTetrisInfo.classList.add("tetris-info");
    this.canvasTetrisInfo.setAttribute("width", TETRIS_INFO_WIDTH);
    this.canvasTetrisInfo.setAttribute("height", TETRIS_INFO_HEIGHT);
    this.canvasTetrisInfo.style.marginLeft = (TETRIS_WIDTH / 2 + 20) + "px";
    this.canvasTetrisInfo.style.marginTop = ((-1) * (TETRIS_HEIGHT / 2 )) + "px";

    // Get canvas context
    if (this.canvasTetrisInfo.getContext) {
      this.canvasTetrisInfoContext = this.canvasTetrisInfo.getContext('2d');
    } else {
      throw new Error("Canvas DOM object have no context");
    }

    // Canvas filling
    this.renderCanvasTetrisInfo();
  }


  Tetris.prototype.renderCanvasTetrisInfo = function(cb) {
    // Clear
    this.canvasTetrisInfoContext.clearRect(0, 0, this.canvasTetrisInfo.width, this.canvasTetrisInfo.height);

    // Render title
    this.renderCanvasTetrisInfoTitle();

    // Render next tetramino object
    this.renderCanvasTetrisInfoNextTetramino();

    // Render score count
    this.renderCanvasTetrisInfoScore();

    // Render top score
    this.renderCanvasTetrisInfoTopScore(this.getTopScoreAndSetBest());
  }

  Tetris.prototype.renderCanvasTetrisInfoTopScore = function(scoreCount) {
    this.canvasTetrisInfoContext.globalAlpha = 1;
    this.canvasTetrisInfoContext.fillStyle = 'white';
    this.canvasTetrisInfoContext.textAlign = 'left';
    this.canvasTetrisInfoContext.textBaseline = 'middle';

    var fontSize = 14;

    this.canvasTetrisInfoContext.font = `${fontSize}px serif`;

    this.canvasTetrisInfoContext.fillText(`Best score: ${scoreCount}`, SQUARE_SIZE, 7*SQUARE_SIZE); // 7 row is best score row
  }

  Tetris.prototype.renderCanvasTetrisInfoScore = function() {
    this.canvasTetrisInfoContext.globalAlpha = 1;
    this.canvasTetrisInfoContext.fillStyle = 'white';
    this.canvasTetrisInfoContext.textAlign = 'left';
    this.canvasTetrisInfoContext.textBaseline = 'middle';

    var fontSize = 14;

    this.canvasTetrisInfoContext.font = `${fontSize}px serif`;

    this.canvasTetrisInfoContext.fillText(`Score: ${this.scoreCount}`, SQUARE_SIZE, 6*SQUARE_SIZE); // 6 row is current score row
  }

  Tetris.prototype.renderCanvasTetrisInfoTitle = function() {
    var title = "TETRIS INFO";

    this.canvasTetrisInfoContext.globalAlpha = 1;
    this.canvasTetrisInfoContext.fillStyle = 'white';
    this.canvasTetrisInfoContext.textAlign = 'center';
    this.canvasTetrisInfoContext.textBaseline = 'middle';

    var fontSize = 14;

    this.canvasTetrisInfoContext.font = `${fontSize}px serif`;
    this.canvasTetrisInfoContext.fillText(title, this.canvasTetrisInfo.width / 2, fontSize);
  }

  Tetris.prototype.renderCanvasTetrisInfoNextTetramino = function() {
    if (this.nextTetraminoType) {
      var grid = TETRAMINO_GRID[this.nextTetraminoType];
      var color = TETRAMINO_COLOR[this.nextTetraminoType];

      this.canvasTetrisInfoContext.fillStyle = color;

      var collumnOffset = Math.floor(TETRIS_INFO_WIDTH / SQUARE_SIZE / 2 - grid.length / 2);

      for (let row=0; row<grid.length; row++) {
        var rowItem = grid[row];
        for (let column=0; column<rowItem.length; column++) {
          var item = rowItem[column];
          if (item == 1) {
            this.canvasTetrisInfoContext.fillRect((column + collumnOffset)*SQUARE_SIZE, (row + 2)*SQUARE_SIZE, SQUARE_SIZE - 1, SQUARE_SIZE - 1);
          }
        }
      }
    }
  }


  Tetris.prototype.startGame = function() {
    // Start loop
    this.rAF = requestAnimationFrame(this.mainLoop.bind(this));

    this.gameState = STATE_RESUME;
  }


  /**
   * Main loop cyclus of game
   */
  Tetris.prototype.mainLoop = function() {
    this.rAF = requestAnimationFrame(this.mainLoop.bind(this));

    // Clear
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render play field
    this.renderPlayField()

    if (this.currentTetramino == null) {
      this.setCurrentGenerateNextTetramino();
    }

    // Render current tetramino
    if (this.currentTetramino) {
      var newTetramino = Object.assign({}, this.currentTetramino); 
      newTetramino.row++;
      
      if (++this.frameNum > FRAME_NUM_UPDATE) {
        this.frameNum = 0;
        this.updateCurrentTetraminoObj(newTetramino);
      }

      this.renderTatraminoObj(this.currentTetramino);
    }

    // Update playfield
    this.playFieldUpdate();

    this.renderCanvasTetrisInfo();
  } 


  Tetris.prototype.updateCurrentTetraminoObj = function(newTetraminoObj) {
    if (this.isValidTetramino(newTetraminoObj)) {
      this.currentTetramino = newTetraminoObj;
    } else {
      // if cannot add tetramino to pay field => game over
      var copyTetraminoObj = Object.assign({}, this.currentTetramino);
      this.currentTetramino = null;
      if (!this.addTetraminoToPlayField(copyTetraminoObj)) {
        this.showEndGameMessage();
      }
    }
  }


  Tetris.prototype.renderPlayField = function() {
    for (let i=0; i < this.playField.length; i++) {
      var row = this.playField[i];
      for (let j=0; j < row.length; j++) {
        var color = row[j];

        if (color != 0) {
          this.renderSquare(i, j, color);  // item is color
        }
      }
    }
  }


  Tetris.prototype.playFieldUpdate = function() {
    for (let i=0; i < this.playField.length; i++) {
      var row = this.playField[i];

      if (row.every(color => color != 0)) {
        // Delete this row and offset earlest arrays to this
        this.playField.splice(i, 1);
        this.playField.unshift(new Array(TETRIS_WIDTH / SQUARE_SIZE).fill(0));
        this.scoreCount++;
      }
    }
  }


  Tetris.prototype.addTetraminoToPlayField = function(tetraminoObj) {
    var grid = this.getTetraminoGrid(tetraminoObj);

    for (let i=0; i < grid.length; i++) {
      var row = grid[i];
      for(let j=0; j < row.length; j++) {
        var item = row[j];

        if (item == 1) {
          var gridRow = i + tetraminoObj.row;
          var gridColumm = j + tetraminoObj.column;

          // If grid row not exist
          try {
            this.playField[gridRow][gridColumm] = TETRAMINO_COLOR[tetraminoObj.type];
          } catch(err) {
            return false;
          }
          
        }
      }
    }
    return true;
  }


  /**
   * 
   * @param {Object} tetraminoObj 
   * @returns bool
   */
  Tetris.prototype.isValidTetramino = function(tetraminoObj) {
    var grid = this.getTetraminoGrid(tetraminoObj);

    for (let i=0; i < grid.length; i++) {
      var row = grid[i];
      for(let j=0; j < row.length; j++) {
        var item = row[j];

        if (item == 1) {
          var gridRow = i + tetraminoObj.row;
          var gridColumm = j + tetraminoObj.column;
          // End of screen check
          if (
              gridColumm < 0 || 
              gridColumm > TETRIS_WIDTH / SQUARE_SIZE - 1 ||
              gridRow > TETRIS_HEIGHT / SQUARE_SIZE - 1
            ) {
            return false;
          }

          // Collision check
          if (this.playField[gridRow]) {
            var playFieldSquarePos = this.playField[gridRow][gridColumm];
            if (playFieldSquarePos != 0) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }


  Tetris.prototype.setCurrentGenerateNextTetramino = function() {
    this.currentTetramino = {
      row: -2,
      column: Math.round(TETRIS_WIDTH / SQUARE_SIZE / 2) - Math.round(TETRAMINO_GRID[this.nextTetraminoType].length / 2),
      type: this.nextTetraminoType,
      rotationState: 0,
    };

    this.nextTetraminoType = this.generateAndReturnNextTetraminoType();
  }


  Tetris.prototype.restartGame = function() {
    // Stop game 
    this.pauseGame();

    // Remove pause if exist
    this.canvas.classList.remove('pause');

    // Set start data for tetris
    this.initPrimaryTetrisData();

    // Run game
    this.startGame();
  }


  Tetris.prototype.pauseOrResumeGame = function() {
    if (this.gameState == STATE_PAUSE) {
      this.resumeGame();
      this.canvas.classList.remove('pause');
    } else if(this.gameState == STATE_RESUME) {
      this.pauseGame();

      this.canvas.classList.add('pause');
    }
  }

  Tetris.prototype.pauseGame = function() {
    cancelAnimationFrame(this.rAF);

    this.gameState = STATE_PAUSE;
  }


  Tetris.prototype.resumeGame = function() {
    this.startGame();
  }


  Tetris.prototype.endGame = function() {
    cancelAnimationFrame(this.rAF);

    this.gameState = STATE_GAME_OVER;

    this.renderTatraminoObj(this.currentTetramino);
  }


  /**
   * Return top score from cookies
   * @returns 
   */
  Tetris.prototype.getTopScoreAndSetBest = function() {
    var bestScore = getCookie(BEST_SCORE_COOKIE) || 0;

    bestScore = Math.max(bestScore, this.scoreCount); 

    setCookie(BEST_SCORE_COOKIE, bestScore);
    return bestScore;
  }

  Tetris.prototype.showEndGameMessage = function() {
    this.endGame();

    // Black rectangle in center
    this.canvasContext.fillStyle = 'black';
    this.canvasContext.globalAlpha = 0.75;
    this.canvasContext.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 85);
    
    // Game over message
    var finalMessage = "GAME OVER!";

    this.canvasContext.globalAlpha = 1;
    this.canvasContext.fillStyle = 'white';
    this.canvasContext.textAlign = 'center';
    this.canvasContext.textBaseline = 'middle';

    this.canvasContext.font = "36px serif";
    this.canvasContext.fillText(finalMessage, this.canvas.width / 2, this.canvas.height / 2);

    // Additive message for help
    var additiveMessage = "Press \"Esc\" to restart.";

    this.canvasContext.globalAlpha = 1;
    this.canvasContext.fillStyle = 'white';
    this.canvasContext.textAlign = 'center';
    this.canvasContext.textBaseline = 'middle';

    this.canvasContext.font = "24px serif";
    this.canvasContext.fillText(additiveMessage, this.canvas.width / 2, this.canvas.height / 2 + 36);
  }


  Tetris.prototype.renderTatraminoObj = function(tetraminoObj) {
    if (tetraminoObj == undefined) {
      return;
    }
    var color = TETRAMINO_COLOR[tetraminoObj.type];
    var grid = this.getTetraminoGrid(tetraminoObj);

    for (let i=0; i < grid.length; i++) {
      var row = grid[i];
      for(let j=0; j < row.length; j++) {
        var item = row[j];
        if (item == 1) {
          var newTetramino = Object.assign({}, tetraminoObj);
          newTetramino.row++;

          this.renderSquare(i + tetraminoObj.row, j + tetraminoObj.column, color);
        }
      }
    }
  }

  Tetris.prototype.getTetraminoGrid = function(tetraminoObj) {
    var grid = TETRAMINO_GRID[tetraminoObj.type];

    // Rotate grid of tetramino
    for (let i=0; i < tetraminoObj.rotationState; i++) {
      grid = rotateMatrix90Deg(grid);
    }
    return grid;
  }

  Tetris.prototype.renderSquare = function(row, column, color) {
    this.canvasContext.fillStyle = color;

    this.canvasContext.fillRect(column*SQUARE_SIZE, row*SQUARE_SIZE, SQUARE_SIZE - 1, SQUARE_SIZE - 1);
  }

  // TODO: pause game

  Tetris.prototype.setEventListeners = function() {
    window.addEventListener('keydown', this.keyDown.bind(this));
  }

  Tetris.prototype.keyDown = function(e) {
    e = e || window.event;

    var newTetramino = Object.assign({}, this.currentTetramino);


    if ((e.keyCode == '38' || e.key == 'w') && this.gameState == STATE_RESUME) {
      // rotate tetramino
      var newRotationState = this.currentTetramino.rotationState + 1;
      if (newRotationState > 3) {
        newRotationState = 0;
      }
      newTetramino.rotationState = newRotationState;

      if (this.currentTetramino && this.isValidTetramino(newTetramino)) {
        this.updateCurrentTetraminoObj(newTetramino);
      }
    }

    if ((e.keyCode == '40' || e.key == 's') && this.gameState == STATE_RESUME ) {
        // go down tetramino
        newTetramino.row++;
        if (this.currentTetramino) {
          this.updateCurrentTetraminoObj(newTetramino);
        }
    }

    if ((e.keyCode == '37' || e.key == 'a') && this.gameState == STATE_RESUME) {
      // go left tetramino
      newTetramino.column--;
      if (this.currentTetramino && this.isValidTetramino(newTetramino)) {
        this.updateCurrentTetraminoObj(newTetramino);
      }
    }
    if ((e.keyCode == '39' || e.key == 'd') && this.gameState == STATE_RESUME) {
        // go right tetramino
        newTetramino.column++;
        if (this.currentTetramino && this.isValidTetramino(newTetramino)) {
          this.updateCurrentTetraminoObj(newTetramino);
        }
    }

    if (e.keyCode == '32') {
      this.pauseOrResumeGame();
    }

    if (e.keyCode == '27') {
      this.restartGame();
    }
  }

  /**
   * Generating next tetramino
   */
  Tetris.prototype.generateAndReturnNextTetraminoType = function() {
    var randomNumber = getRandomInt(0, this.tetraminoSequence.length - 1);
    
    return this.tetraminoSequence[randomNumber];
  }

  ///
  /// Funcs
  ///

  /**
   * Get cookie by name
   * https://learn.javascript.ru/cookie
   * @param {String} name 
   * @returns Object
   */
  function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  /**
   * Set cookie value with name
   * https://learn.javascript.ru/cookie
   * @param {*} name 
   * @param {*} value 
   * @param {*} options 
   */
  function setCookie(name, value, options = {}) {
    options = {
      path: '/',
      // Additive options
      ...options
    };
  
    if (options.expires instanceof Date) {
      options.expires = options.expires.toUTCString();
    }
  
    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
  
    for (let optionKey in options) {
      updatedCookie += "; " + optionKey;
      let optionValue = options[optionKey];
      if (optionValue !== true) {
        updatedCookie += "=" + optionValue;
      }
    }
    document.cookie = updatedCookie;
  }

  /**
   * Insert DOM element newNode after referenceNode
   * https://stackoverflow.com/a/4793630
   * @param {DOM} newNode 
   * @param {DOM} referenceNode 
   */
  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  /**
   * Rotate matrix 90 deg
   * https://stackoverflow.com/a/58668351
   * @param {Array[Array]} matrix 
   * @returns matrix
   */
  function rotateMatrix90Deg(matrix) {
    return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse())
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   * https://stackoverflow.com/a/1527820
   * @param {Number} min 
   * @param {Number} max 
   * @returns Number
   */
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

  /**
   * Create tetris instanse and run game
   * @param {Canvas DOM}} tetrisCanvasObj 
   */
  function runTetrisGame(tetrisCanvasObj) {
    var tetris = new Tetris(tetrisCanvasObj);

    tetris.startGame(); // start game
  }


  ///
  /// EventListeners
  ///

  function documentOnLoad(e) {
    var tetrisField = document.getElementById(TETRIS_CANVAS_ID);

    // Run game
    runTetrisGame(tetrisField);
  }
  
  document.addEventListener('DOMContentLoaded', documentOnLoad);
})();