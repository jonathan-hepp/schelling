var app = angular.module('schellingApp',[]);

app.controller('CanvasController', function($scope, $timeout, $interval) {
    $scope.canvas = {width: 60, height: 40, blockSize: 10, blanksRatio: 10,
                     firstColorRatio: 50, secondColorRatio: 50, threshold: 30,
                     speed: "500", fillStroke: true, round: 0, unsatisfied: 0,
                     firstColorName: "Blue", secondColorName: "Red"};

    $scope.colors = ["Black", "Blue", "Cyan", "Brown", "Gray", "Green", "Maroon", "Olive", "Orange", "Pink", "Red", "Teal", "Violet", "Yellow"];

    function runSimulation(){
        $scope.canvas.round++;
        var unsfd = listUnsatisfied($scope.board, $scope.canvas.threshold);
        $scope.canvas.unsatisfied = (unsfd.length - $scope.blanksTotal) / ($scope.canvas.width * $scope.canvas.height) * 100;
        if(unsfd.length > $scope.blanksTotal){
            swapAgents(unsfd, $scope.board);
            $scope.draw();
        }else{
            $scope.stop();
            alert("Finished!")
        }
    }

    $scope.initializeBoard = function(){
            var rows = $scope.canvas.width;
            var cols = $scope.canvas.height;
            $scope.blanksTotal = rows * cols * ($scope.canvas.blanksRatio/100);
            var pInt = function(e){return parseInt(e);};
            var boardArray = [...(""+A).repeat((rows * cols - $scope.blanksTotal) * ($scope.canvas.firstColorRatio /100)).split("").map(pInt),
                          ...(""+B).repeat((rows * cols - $scope.blanksTotal) * (1 - ($scope.canvas.firstColorRatio/100))).split("").map(pInt),
                          ...(""+E).repeat($scope.blanksTotal).split("").map(pInt)];
            shuffleArray(boardArray);
            $scope.board = [];
            for(var i = 0; i < rows; i++){
                $scope.board.push(boardArray.splice(0,cols));
            }
            $scope.draw();
            $scope.canvas.unsatisfied = countUnsatisfied($scope.board, $scope.canvas.threshold) / ($scope.canvas.width * $scope.canvas.height) * 100;
            $scope.canvas.round = 0;
    }


    $scope.draw = function() {
        $timeout(function(){
            var canvas = document.getElementById("canvas");
            if (canvas.getContext) {
                var ctx = canvas.getContext("2d");
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                var palette = ["white", $scope.canvas.firstColorName, $scope.canvas.secondColorName];
                var blockSize = $scope.canvas.blockSize;
                for(var x = 0; x < $scope.canvas.width; x++){
                    for (var y = 0; y < $scope.canvas.height; y++){
                        ctx.fillStyle = palette[$scope.board[x][y]];
                        ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize);
                        if($scope.canvas.fillStroke)
                            ctx.strokeRect(x*blockSize, y*blockSize, blockSize, blockSize);
                    }
                }
            }
        });
    }

    $scope.start = function(){
        $scope.intervalID = $interval(function(){runSimulation()}, $scope.canvas.speed);
    }

    $scope.stop = function(){
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

function listUnsatisfied(board, threshold){
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
            if(countSurroundings(board, x, y) < threshold){
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
    return count / 8 * 100;
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
