(function() {
  ///
  /// Constants
  ///

  const TETRIS_CANVAS_ID = "tetris-field";

  const TETRIS_WIDTH = 320;   // 10 squares
  const TETRIS_HEIGHT = 640;  // 20 squares

  const SQUARE_SIZE = 32;

  const FRAME_NUM_UPDATE = 35;

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

    this.currentTetramino = null;

    this.nextTetraminoType = this.generateAndReturnNextTetraminoType();;

    this.gameOver = false;  // flag end of the game | no pause

    this.rAF = null;

    this.frameNum = 0;

    this.playField = new Array(TETRIS_HEIGHT / SQUARE_SIZE);

    for (let i=0; i < this.playField.length; i++) {
      this.playField[i] = new Array(TETRIS_WIDTH / SQUARE_SIZE).fill(0);
    }

    this.init();
  }

  /**
   * Initial method
   */
  Tetris.prototype.init = function() {
    // Set size of canvas
    this.canvas.setAttribute("width", TETRIS_WIDTH);
    this.canvas.setAttribute("height", TETRIS_HEIGHT);

    this.setEventListeners();
  }

  Tetris.prototype.startGame = function() {
    // Start loop
    this.rAF = window.requestAnimationFrame(this.mainLoop.bind(this));
  }

  // Tetris.prototype.resumeGame = function() {
    
  // }

  /**
   * Main loop cyclus of game
   */
  Tetris.prototype.mainLoop = function() {
    this.rAF = window.requestAnimationFrame(this.mainLoop.bind(this));

    // Clear
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render saved squares
    for (let i=0; i < this.playField.length; i++) {
      var row = this.playField[i];
      for (let j=0; j < row.length; j++) {
        var color = row[j];

        if (color != 0) {
          this.renderSquare(i, j, color);  // item is color
        }
      }
    }

    if (this.currentTetramino == null) {
      this.setCurrentGenerateNextTetramino();
    }

    if (this.currentTetramino) {
      var newTetramino = Object.assign({}, this.currentTetramino); 
      newTetramino.row = newTetramino.row + 1;
      
      if (!this.isValidTetramino(newTetramino)) {
        this.addTetraminoToPlayField(this.currentTetramino);
        this.currentTetramino = null;
      } else if (++this.frameNum > FRAME_NUM_UPDATE) {
        this.frameNum = 0;
        this.currentTetramino = newTetramino;
      }

      this.renderTatraminoObj(this.currentTetramino);
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

          this.playField[gridRow][gridColumm] = TETRAMINO_COLOR[tetraminoObj.type];
        }
      }
    }

    console.log(this.playField);
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
      column: Math.floor(TETRIS_WIDTH / SQUARE_SIZE / 2) - 1,
      type: this.nextTetraminoType,
      rotationState: 0,
    };

    this.nextTetraminoType = this.generateAndReturnNextTetraminoType();
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

    if (e.keyCode == '38') {
      var newRotationState = this.currentTetramino.rotationState + 1;
      if (newRotationState > 3) {
        newRotationState = 0;
      }
      newTetramino.rotationState = newRotationState;

      // up arrow
      if (this.currentTetramino && this.isValidTetramino(newTetramino)) {
        this.currentTetramino = newTetramino;;
      }
    }
    if (e.keyCode == '40') {
        // down arrow
        if (this.currentTetramino) {
          this.currentTetramino.row++;
        }
    }

    if (e.keyCode == '37') {
      // left arrow
      newTetramino.column--;
      if (this.currentTetramino && this.isValidTetramino(newTetramino)) {
        this.currentTetramino.column--;
      }
    }
    if (e.keyCode == '39') {
        // right arrow
        newTetramino.column++;
        if (this.currentTetramino && this.isValidTetramino(newTetramino)) {
          this.currentTetramino = newTetramino;
        }
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