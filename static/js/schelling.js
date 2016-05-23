// (E)Empty, (A)first color and (B)second color values
const E = 0, A = 1, B = 2;

var app = angular.module('app',[]);

// Default configuration service
app.value('defaults', {width: 60, height: 30, blockSize: 10, blanksRatio: 10,
                 firstColorRatio: 50, secondColorRatio: 50, threshold: "3",
                 speed: "100", fillStroke: true, round: 0, unsatisfied: 0,
                 firstColorName: "Teal", secondColorName: "Yellow",
                 colors: ["Black", "Blue", "Cyan", "Brown", "Gray", "Green",
                 "Maroon", "Olive", "Orange", "Pink", "Red", "Teal", "Violet", "Yellow"]});

app.value('Coord', function Coord(x, y){
    this.x = x;
    this.y = y;
});

app.factory('surroundings', function(Coord){
    return [new Coord(-1, -1), new Coord(-1, 0), new Coord(-1, 1), new Coord(0, -1),
            new Coord(0, 1), new Coord(1, -1), new Coord(1, 0), new Coord(1, 1)];
});

app.factory('countSurroundings', function(surroundings){
    return (board, x, y) => {
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
});

app.factory('listUnsatisfiedAndBlanks', function(Coord, countSurroundings) {
    return (board, threshold) => {
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
});

app.factory('countUnsatisfied', function(countSurroundings){
    return (board, threshold) => {
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
});

app.factory('shuffleArray', function(){
    return (array) => {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * i);
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
});

app.factory('swapAgents',function(shuffleArray){
    return (array, board) => {
        var copy = array.slice();
        shuffleArray(array);
        for(var i = 0; i < array.length; i++){
            board[array[i].x][array[i].y] = board[array[i].x][array[i].y] ^ board[copy[i].x][copy[i].y];
            board[copy[i].x][copy[i].y] = board[copy[i].x][copy[i].y] ^ board[array[i].x][array[i].y];
            board[array[i].x][array[i].y] = board[array[i].x][array[i].y] ^ board[copy[i].x][copy[i].y];
        }
    }
});

app.controller('SimulationController', function($scope, $timeout, $interval, defaults,
                                listUnsatisfiedAndBlanks, countUnsatisfied, shuffleArray, swapAgents) {
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
            $("#btnStart").prop("disabled", true);
            $timeout(() => {
                $("#alertModalMessage").text("There are no more unsatisfied agents. The simulation has finished!");
                $("#alertModal").modal("show");
            });
        }
    }

    $scope.initializeBoard = function(){
        // Fill an array distributing the agents and the blank cells according to the configuration
        var total = $scope.conf.width * $scope.conf.height;
        var blanks = $scope.blanksTotal = total * ($scope.conf.blanksRatio/100);
        var firstColorTotal = (total - blanks) * ($scope.conf.firstColorRatio / 100);
        var agentsArray = Array(total).fill(A, 0, firstColorTotal)
                                      .fill(B, firstColorTotal, total - blanks)
                                      .fill(E, total - blanks, total);
        shuffleArray(agentsArray);

        // Now that the agents are shuffled, it's time to build the board
        $scope.board = [];
        for(var i = 0; i < $scope.conf.width; i++){
            $scope.board.push(agentsArray.splice(0, $scope.conf.height));
        }

        // Now we draw the blocks in the canvas element based on the board
        $scope.draw();
        $scope.conf.unsatisfied = countUnsatisfied($scope.board, $scope.conf.threshold) / ($scope.conf.width * $scope.conf.height) * 100;
        $scope.conf.round = 0;
    }

    $scope.draw = function() {
        $timeout(() => {
            var canvas = document.getElementById("canvas");
            if (canvas.getContext) {
                var context = canvas.getContext("2d");
                var blockSize = $scope.conf.blockSize;
                var palette = ["white", $scope.conf.firstColorName, $scope.conf.secondColorName];
                context.strokeStyle = "black";
                context.lineWidth = 0.5;
                for(var x = 0; x < $scope.conf.width; x++){
                    for (var y = 0; y < $scope.conf.height; y++){
                        context.fillStyle = palette[$scope.board[x][y]];
                        context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                        if($scope.conf.fillStroke)
                            context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
                    }
                }
            }else{
                $("#alertModalMessage").text("This browser doesn't support canvas technology. In order to use this application, you'll have to either update your browser or use another one.");
                $("#alertModal").modal("show");
            }
        });
    }

    $scope.start = function(){
        $("#btnStart").prop("disabled", true);
        $("#btnStop").prop("disabled", false);
        $("#btnReset").prop("disabled", true);
        $scope.intervalID = $interval(() => runSimulation(), $scope.conf.speed);
    }

    $scope.stop = function(){
        $("#btnStart").prop("disabled", false);
        $("#btnStop").prop("disabled", true);
        $("#btnReset").prop("disabled", false);
        $interval.cancel($scope.intervalID);
    }

    $scope.reset = function(){
        $("#btnStart").prop("disabled", false);
        $scope.initializeBoard();
    }

    $scope.initializeBoard();
});
