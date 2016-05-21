var app = angular.module('app',[]);

// Default configuration service
app.value('defaults', {width: 60, height: 40, blockSize: 10, blanksRatio: 10,
                 firstColorRatio: 50, secondColorRatio: 50, threshold: "3",
                 speed: "100", fillStroke: true, round: 0, unsatisfied: 0,
                 firstColorName: "Blue", secondColorName: "Yellow",
                 colors: ["Black", "Blue", "Cyan", "Brown", "Gray", "Green",
                 "Maroon", "Olive", "Orange", "Pink", "Red", "Teal", "Violet", "Yellow"]});

app.controller('SimulationController', function($scope, $timeout, $interval, defaults) {
    $scope.conf = defaults;

    function runSimulation(){
        var unsatisfiedAndBlanks = listUnsatisfiedAndBlanks($scope.board, $scope.conf.threshold);
        $scope.conf.round++;
        $scope.conf.unsatisfied = (unsatisfiedAndBlanks.length - $scope.blanksTotal) / ($scope.conf.width * $scope.conf.height) * 100;
        // If there are still unsatisfied agenst, update their position and redraw the board
        if(unsatisfiedAndBlanks.length > $scope.blanksTotal){
            swapAgents(unsatisfiedAndBlanks, $scope.board);
            $scope.draw();
        // Otherwise, the simulation is done
        }else{
            $scope.stop();
            alert("Finished!")
        }
    }

    $scope.initializeBoard = function(){
            var rows = $scope.conf.width;
            var cols = $scope.conf.height;
            $scope.blanksTotal = rows * cols * ($scope.conf.blanksRatio/100);

            /*
            The agents array is initially populated with the distribution of the colors based on the configuration values.

            Note: The array construction will be optimized when major browsers fully support ES6's Array comprehension.
            Currently, the code below only works on Firefox.

            var boardArray = [...[for (i of [...Array((rows * cols - $scope.blanksTotal) * ($scope.conf.firstColorRatio / 100)).keys()]) A],
                              ...[for (i of [...Array((rows * cols - $scope.blanksTotal) * (1 - ($scope.conf.firstColorRatio / 100))).keys()]) B],
                              ...[for (i of [...Array($scope.blanksTotal).keys()]) E]];

            Until then, the best approach is to use the String.repeat() functionality.
            */

            var toInt = function(e){ return parseInt(e); };
            var agentsArray = [...(""+A).repeat((rows * cols - $scope.blanksTotal) * ($scope.conf.firstColorRatio / 100)).split("").map(toInt),
                         ...(""+B).repeat((rows * cols - $scope.blanksTotal) * (1 - ($scope.conf.firstColorRatio / 100))).split("").map(toInt),
                         ...(""+E).repeat($scope.blanksTotal).split("").map(toInt)];

            shuffleArray(agentsArray);

            // Now that we have the agents shuffled, it's time to build the board
            $scope.board = [];
            for(var i = 0; i < rows; i++){
                $scope.board.push(agentsArray.splice(0, cols));
            }
            $scope.draw();
            $scope.conf.unsatisfied = countUnsatisfied($scope.board, $scope.conf.threshold) / ($scope.conf.width * $scope.conf.height) * 100;
    }

    $scope.draw = function() {
        $timeout(function(){
            var canvas = document.getElementById("canvas");
            if (canvas.getContext) {
                var ctx = canvas.getContext("2d");
                var blockSize = $scope.conf.blockSize;
                var palette = ["white", $scope.conf.firstColorName, $scope.conf.secondColorName];
                ctx.strokeStyle = "black";
                ctx.lineWidth = 0.5;
                for(var x = 0; x < $scope.conf.width; x++){
                    for (var y = 0; y < $scope.conf.height; y++){
                        ctx.fillStyle = palette[$scope.board[x][y]];
                        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                        if($scope.conf.fillStroke)
                            ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
                    }
                }
            }else{
                alert("This browser doesn't support canvas technology. In order to use this application, you'll have to either update your browser or use another one.");
            }
        });
    }

    $scope.start = function(){
        $("#btnStart").prop("disabled", true);
        $("#btnStop").prop("disabled", false);
        $("#btnReset").prop("disabled", true);
        $scope.intervalID = $interval(function(){ runSimulation() }, $scope.conf.speed);
    }

    $scope.stop = function(){
        $("#btnStart").prop("disabled", false);
        $("#btnStop").prop("disabled", true);
        $("#btnReset").prop("disabled", false);
        $interval.cancel($scope.intervalID);
    }

    $scope.initializeBoard();
});


/////////////////////////////////////////

const E = 0, A = 1, B = 2;

function Coord(x, y){
    this.x = x;
    this.y = y;
}

var surroundings = [new Coord(-1, -1), new Coord(-1, 0), new Coord(-1, 1), new Coord(0, -1), new Coord(0, 1), new Coord(1, -1), new Coord(1, 0), new Coord(1, 1)];

function swapAgents(array, board){
    var copy = array.slice();
    shuffleArray(array);
    for(var i = 0; i < array.length; i++){
        board[array[i].x][array[i].y] = board[array[i].x][array[i].y] ^ board[copy[i].x][copy[i].y];
        board[copy[i].x][copy[i].y] = board[copy[i].x][copy[i].y] ^ board[array[i].x][array[i].y];
        board[array[i].x][array[i].y] = board[array[i].x][array[i].y] ^ board[copy[i].x][copy[i].y];
    }
}

function listUnsatisfiedAndBlanks(board, threshold){
    var unsatisfied = [];
    for(var x = 0; x < board.length; x++){
        for(var y = 0; y < board[x].length; y++){
            if(board[x][y] == E || countSurroundings(board, x, y) > threshold){
                unsatisfied.push(new Coord(x, y));
            }
        }
    }
    return unsatisfied;
}

function countUnsatisfied(board, threshold){
    var unsatisfied = 0;
    for(var x = 0; x < board.length; x++){
        for(var y = 0; y < board[x].length; y++){
            if(countSurroundings(board, x, y) > threshold){
                unsatisfied++;
            }
        }
    }
    return unsatisfied;
}

function countSurroundings(board, x, y){
    var count = 0;
    var refValue = board[x][y];
    if(refValue !== E){
        for(let coord of surroundings){
            var px = x + coord.x;
            var py = y + coord.y;
            if(board[px] && board[px][py] && board[px][py] !== E && board[px][py] !== refValue){
                count++;
            }
        }
    }
    return count;
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * i);
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
