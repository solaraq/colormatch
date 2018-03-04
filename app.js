/**
 *  Color match application.
 */
var colorMatch = (function() {
	
	var app = {
				
		// Holds a reference to the game board dom element
		gameBoard: null,

		// Holds the timer id for the current game
		gameTimer: null,
		
		// Holds the timer id for the clock
		clockTimer: null,
		
		// Holds timer id for automated test
		testTimer: null,
		
		// Stores sequential index for table cells
		tableCellIndex: [],

        // Holds a reference to the vertical cells input element
        verticalInputField: null,

        // Holds a reference to the horizontal cells input element
        horizontalInputField: null,

        // Holds a reference to the time input element
        timeInputField: null,

		// Holds values entered for the game
		gameData: {
			rows: 0,
			columns: 0,
			time: 0
		},
		
		// Reference to the custom popup
		messageBox: null,
		
		// Messages to display in popup
		messages: {
			winner: 'Congratulations!, you\'re a winner!',
			loser: 'Sorry, you\'re out of time. Better luck next time!.'
		},
		
		/**
		 * Simulate game by generating random cell clicks.
		 */
		runTest: function() {
			this.testTimer = setInterval(function(scope) {
				var index = scope.getRandomIndex(1, scope.gameData.rows * scope.gameData.columns);
				var cell = scope.tableCellIndex[index];
				scope.tableCellIndex[index][2]++; // count of number of times cell clicked 
				$('tr:nth-child(' + cell[0] + ') TD:nth-child(' + cell[1] + ')', scope.gameBoard).trigger('click');
			}, 1, this);
		},
		
		/**
		 *  Assert cell has expected class.
		 */
		assertCellStateOn: function(cell, expected) {
			return cell.className === expected; 
		},
		
		/**
		 * assert initial cel state of game board.
		 */
		assertInitialBoardState: function() {
			
			var board = document.querySelector('table#board');
			var rows = board.rows.length-1;
			var columns = board.rows[0].cells.length-1;
			
			document.querySelector('#message').innerHTML = '<p>Board state cell test results</p>';
			
			var failed = false;
			for (var i=0; i <= rows; i++) {
				var row = board.rows[i];
				for (var j=0; j <= columns; j++) {
					var expected = ((i + j) % 2 === 0) ? 'on' : '';
					if (!this.assertCellStateOn(row.cells[j], expected)) {
						document.querySelector('#message').innerHTML += '<p>Incorrect cell state: ' + String(i) + ':' + String(j);
						failed = true;
					}
				}
			}
			
			if (!failed) {
				document.querySelector('#message').innerHTML += '<p>Passed all tests</p>';
			}
		},
		
		/**
		 * Generate random number within a range.
		 *
		 * @param {Number} min Minumum number to generate
		 * @param {Number} max Maximum number to generate
		 * @return {Number}
		 */
		getRandomIndex: function (min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min + 1)) + min;  
		},

		/**
		 * Create a table and attach to dom.
		 *
		 * @param {Number} rows Number of rows
		 * @param {Number} cols Number of columns
		 */
		renderTable: function(rows, cols) {
			
			var fragment = document.createDocumentFragment();
			var  index = 1;
			this.tableCellIndex.length = 0;

			for (var i=0; i < rows; i++) {
				var rowEl = document.createElement('tr');
				fragment.appendChild(rowEl);
				for (var j=0; j < cols; j++) {
					var cell = document.createElement('td');
					cell.className = ((i + j) % 2 === 0)  ? 'on' : '';
					rowEl.appendChild(cell);
					this.tableCellIndex[index] = [i+1,j+1, 0];
					index++;
				}
			}
			this.gameBoard.appendChild(fragment);
		},
		
		/**
		 * Inverts cells for a particular row.
		 *
		 * @param {Number} row Row to invert
		 * @param {Number} index Index of cell clicked
		 * @param {Object} currentCell The cell clicked
		 */
		setRowCells: function(row, index, currentCell) {
			var cell = currentCell || $('td:nth-child(' + index + ')', row);
			cell.toggleClass( "on" );
			if (cell.prev().prop("tagName") === 'TD') {
				cell.prev().toggleClass( "on" );
			}
			if (cell.next().prop("tagName") === 'TD') {
				cell.next().toggleClass( "on" );
			}
		},
		
		/**
		 * Inverts adjacent cells.
		 *
		 * @param {Object} cell The cell clicked
		 */
		setAdjacentCells: function(cell) {
			var cellIndex = cell.cellIndex + 1;
			var currentRow = $(cell).parent();
			this.setRowCells(currentRow, cellIndex, $(cell));
			if (currentRow.prev().prop("tagName") === 'TR') {
				this.setRowCells(currentRow.prev(), cellIndex);
			}
			if (currentRow.next().prop("tagName") === 'TR') {
				this.setRowCells(currentRow.next(), cellIndex);
			}
		},
		
		/**
		 * Cell click handler		
		 *
		 * @param {Object} cell The cell clicked
		 */
		onCellClick: function(cell) {
			this.setAdjacentCells(cell);
			if (this.isWinner()) {
				clearTimeout(this.gameTimer);
				this.onGameEnd(this);
				this.messageBox.show(this.messages.winner);
			}
		},
		
		/**
		 * Calculates and displays time left.
		 *   
		 * @param {Number} time The time in seconds
		 */
		initTimer: function(time) {
			var start = Date.now();  			
            var clock = $('#clock');

			this.clockTimer = setInterval(function() {
				var current = Date.now();  
				var timeLeft =  Math.round((time - (current - start))/1000); 
				var seconds = String(timeLeft%60);
                clock.text(Math.floor(timeLeft/60) + ':' + (seconds.length === 1 ? ('0' + seconds) : seconds));
			}, 950);
		},
		
		/**
		 *  Check if game is won.
		 */
		isWinner: function() {
			var cellStateCount = $('td.on', this.gameBoard).length;
			return cellStateCount === 0 || cellStateCount === (this.tableCellIndex.length - 1);
		},
		
		/**
		 * Check imput data is valid. 
		 */
		isValidForm: function(gameData) {
			return gameData.rows > 0 && gameData.columns > 0 && gameData.time > 0;
		},
		
		/**
		 * Get input data. 
		 *
		 * @return {Object} input data
		 *  @config {Number} The number of rows
		 *  @config {Number} The number of columns 
		 *  @config {Number} The time 
		 */
		getFormData: function() {
			this.gameData.rows = Math.round(Number(this.verticalInputField.value));
			this.gameData.columns = Math.round(Number(this.horizontalInputField.value));
			this.gameData.time = Math.round(Number(this.timeInputField.value)) * 1000;
			
			return this.gameData;
		},
		
		/**
		 * On game start handler.
		 *
		 * @param {Number} rows The number of rows
		 * @param {Number} cols The number of columns 
		 * @param {Number} time The time 
		 */
		onGameStart: function(rows, cols, time) {
			
			var scope = this;
			document.querySelector('#message').innerHTML = '';
			
			$(this.gameBoard).off();
			$(this.gameBoard).empty();
			
			clearTimeout(this.gameTimer);
			clearInterval(this.clockTimer);
			clearInterval(this.testTimer);
			
			this.renderTable(rows, cols);
			
			$(this.gameBoard).delegate( "td", "click", function() {
				scope.onCellClick(this);
			});
			
			this.gameTimer = setTimeout(this.onGameEnd, time, this);
			this.initTimer(time);
			
			if (document.querySelector('#run').checked) {
				this.runTest();
			}
		},
		
		/**
		 * On game end handler.
		 *
		 * @param {Object} scope The scope to run in 		 
		 */
		onGameEnd: function(scope) {
			$(scope.gameBoard).off();
			clearInterval(scope.clockTimer);
			clearInterval(scope.testTimer);
			if (!scope.isWinner()) {
				scope.messageBox.show(scope.messages.loser);
			}
		},
		
		/**
		 * Initialise game app.
		 *  
		 * @param {Object} messageBox Reference to the messageBox	
		 */		
		init: function(messageBox) {
			
			var scope = this;
			this.messageBox = messageBox;
			this.gameBoard = document.querySelector('#board');

            this.verticalInputField = document.querySelector('#vertical');
            this.horizontalInputField = document.querySelector('#horizontal');
            this.timeInputField = document.querySelector('#time');
			
			$('form button#start').on('click', $.proxy(function() {
				var gameData = this.getFormData();
				if (this.isValidForm(gameData)) {
					this.onGameStart(gameData.rows, gameData.columns, gameData.time);
				} else {
					document.querySelector('#message').innerHTML = '<h2 style="color:red">Please enter a numeric values greater than 0<h2>';
				}
			}, this));
			
			$('input').on('mouseup keyup', function(e) {
				var id = $(e.target).attr('id');
				if (id === 'vertical' || id === 'horizontal') {
					var gameData = scope.getFormData();
					if (scope.isValidForm(gameData)) {
						document.querySelector('#message').innerHTML = '';
						$(scope.gameBoard).empty();
						scope.renderTable(gameData.rows, gameData.columns);
					}
				}
			});
							
			this.renderTable(5, 5);
			this.getFormData();
			
			// Dev tool buttons
			$('button#test').on('click', $.proxy(function() {
                this.assertInitialBoardState();
			}, this));
			
			$('button#stats').on('click', $.proxy(function() {
				document.querySelector('#message').innerHTML = '';
                this.tableCellIndex.forEach(function(item) {
					document.querySelector('#message').innerHTML += '<p>Cell ' + String(item[0]) + ':' + String(item[1]) + ' clicked ' + String(item[2]) + ' times ';
				});
			}, this));

		}
	};
	
	var init = function(messageBox) {
		app.init(messageBox);
	};
	
	return {
		init: init
	}
})();

/**
 * Create a custom popup.
 */
$(function() {
	
	var messageBox = (function() {

		var template =  '<div id="messagebox">' +
			'<div class="header"><span>Color Match</span></div>' +
			'<div class="body"><span></span></div>' +
			'<div class="footer"><button>OK</button></div>' +
		  '</div>';
		
		var messageBoxBody = null;
					  
		function render() {
			$('body').prepend(template);
		}

		/**
		 * Adds an event handler to an element
		 *
		 * @param {String} event The event to handle
		 * @param {Object} el The element to attach a lister to
		 * @param {Function} fn The callback function to execute
		 */
		function addEventListsners(event, el, fn) {
			if (el.addEventListener) {
				el.addEventListener(event, fn, false);
			} else if (el.attachEvent)  {
				el.attachEvent('on' + event, fn);
			}	
		}

		/**
		 * Show popup and display message.
		 *
		 * @param {String} message The message to display
		 */
		function show(message) {
			setTimeout(function() {
				$('.body span', messageBoxBody).text(message);
				messageBoxBody.css('visibility', 'visible');
			}, 0);
		}
		
		/**
		 * Hide popup.
		 */
		function hide() {
			messageBoxBody.css('visibility', 'hidden');
		}

		function init() {

			render();

			messageBoxBody = $('#messagebox');

			addEventListsners('click', document.querySelector('#messagebox button'), function() {
				messageBox.hide();
			});
		}

		init();
			
		return {
			show: show,
			hide: hide
		}
		
	})();
	
	colorMatch.init(messageBox);
});



