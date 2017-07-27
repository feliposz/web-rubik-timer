var timerStart;
var timerIsRunning = false;
var timerResolution = 5;
var timerTimeout = null;
var globalChart;

function ToggleTimer() {
    if (timerIsRunning) {
        StopTimer();
    } else {
        StartTimer();
    }
}

function StopTimer() {
    var ToggleTimer = document.getElementById("ToggleTimer");
    timerIsRunning = false;
    ToggleTimer.innerText = "Start";
    if (timerTimeout) {
        clearTimeout(timerTimeout);
        timerTimeout = null;
    }
}

function StartTimer()
{
    var ToggleTimer = document.getElementById("ToggleTimer");
    ToggleTimer.innerText = "Stop";
    timerStart = Date.now();
    timerIsRunning = true;
    timerTimeout = setTimeout(TickTimer, timerResolution);
}

function TickTimer() {
    var elapsed = Date.now() - timerStart;
    DisplayTimer(elapsed);
    if (timerIsRunning) {
        timerTimeout = setTimeout(TickTimer, timerResolution);
    } else {
        timerTimeout = null;
    }
}

function Pad(s, n) {
    var t = String(s);
    while (t.length < n) {
        t = "0" + t;
    }
    return t;
}

// miliseconds elapsed -> HH:MM:SS.FFF
function FormatTimer(elapsed) {
    var ms = elapsed % 1000;
    elapsed = Math.floor(elapsed / 1000);
    var s = elapsed % 60;
    elapsed = Math.floor(elapsed / 60);
    var m = elapsed % 60;
    elapsed = Math.floor(elapsed / 60);
    var h = elapsed;
    return Pad(h, 2)  + ":" + Pad(m, 2) + ":" + Pad(s, 2) + "." + Pad(ms, 3);
}

function DisplayTimer(s) {
    var timer = document.getElementById("display_timer");
    timer.innerText = FormatTimer(s);
}

function PickRandom(list) {
    var i = Math.floor(Math.random() * list.length);
    return list[i];
}

function GenerateScramble(maxMoves) {
    var faces = ["F", "B", "R", "L", "U", "D"];
    var direction = ["", "\'", "2"];
    var moves = [];
    var i;
    var previousFace = "", face = "";
    for (i = 0; i < maxMoves; i++) {
        // Avoid moves that cancel one another liKe: L L or R R' or F2 F' etc.
        do {
            face = PickRandom(faces);
        } while (face === previousFace);
        // TODO: Check for sequences that do nothing like: L R L' R' or U' D U D'
        // TODO: Don't let this happen: L R L', but allow this L U L'
        moves.push(face + PickRandom(direction));
        previousFace = face;
    }
    return moves;
}

// Generate a list reversing a scramble. Ex: L U2 R' F -> F' R U2 L'
function ReverseMoves(moves) {
    var revMoves = [];
    var i;
    for (i = 0; i < moves.length; i++) {
        var move = moves[i];
        if ((move.length > 1) && (move[1] == "\'")) {
            move = move[0];
        } else if (move.length === 1) {
            move = move + "\'";
        }
        revMoves.unshift(move);
    }
    return revMoves;
}

function NewScramble() {
    var scramble = document.getElementById("display_scramble");
    var moves = GenerateScramble(20);
    scramble.innerText = moves.join(" ");
    var reverse = document.getElementById("display_reverse");
    var revMoves = ReverseMoves(moves);
    reverse.innerText = revMoves.join(" ");
    StopTimer();
    DisplayTimer(0);
    globalChart = InitChart();
    DrawChart(globalChart);
}

function InitChart() {
    var chart = [];
    var i, j;
    for (i = 0; i < 9; i++) {
        row = [];
        for (j = 0; j < 12; j++) {
            var sticker = "";
            // TODO: Use face rects! (see below)
            if (i >= 3 && i <= 5 && j >= 0 && j <= 2) { sticker = "O"; }
            if (i >= 3 && i <= 5 && j >= 3 && j <= 5) { sticker = "G"; }
            if (i >= 3 && i <= 5 && j >= 6 && j <= 8) { sticker = "R"; }
            if (i >= 3 && i <= 5 && j >= 9 && j <= 11) { sticker = "B"; }
            if (i >= 0 && i <= 2 && j >= 3 && j <= 5) { sticker = "W"; }
            if (i >= 6 && i <= 8 && j >= 3 && j <= 5) { sticker = "Y"; }
            row.push(sticker);
        }
        chart.push(row);
    }
    return chart;
}

function DrawChart(chart) {
    var cubechart = document.getElementById("cube_chart");
    var table = "<table><tbody>";
    var i, j;
    for (i = 0; i < chart.length; i++) {
        table += "<tr>";
        for (j = 0; j < chart[i].length; j++) {
            sticker = chart[i][j];
            if (sticker !== "") {
                table += "<td class='sticker " + sticker + "'>[" + i + "][" + j + "]</td>";
            } else {
                table += "<td>&nbsp;</td>";
            }
        }
        table += "</tr>";
    }
    cubechart.innerHTML = table;
}

// TODO: Find a better way to clone a 2D array (map+slice?)
// https://stackoverflow.com/a/13756775
function CopyChart(chart) {
    var copy = [];
    for (i = 0; i < chart.length; i++) {
        row = [];
        for (j = 0; j < chart[i].length; j++) {
            row.push(chart[i][j]);
        }
        copy.push(row);
    }
    return copy;
}

function Rect(i1, j1, i2, j2) {
    return {i1: i1, j1: j1, i2: i2, j2: j2};
}


// Math.sign not available in IE apparently
function Sign(x) {
    if (x < 0) { 
        return -1;
    } else if (x > 0) {
        return 1;
    } else {
        return 0;
    }
}

// Copy a column/row from the oldChart to newChart
// Can copy left/right to up/down, down/up to right/left, etc.
// TODO: Enforce that oiDelta * ojDelta = 0 and diDelta * djDelta = 0 (can only copy lines for now!)
function CopySequence(oldChart, newChart, orig, dest) {
    var oi = orig.i1;
    var oj = orig.j1;
    var di = dest.i1;
    var dj = dest.j1;
    var oiDelta = Sign(orig.i2 - orig.i1);
    var ojDelta = Sign(orig.j2 - orig.j1);
    var diDelta = Sign(dest.i2 - dest.i1);
    var djDelta = Sign(dest.j2 - dest.j1);
    while (oi-oiDelta !== orig.i2 || oj-ojDelta !== orig.j2 || di-diDelta !== dest.i2 || dj-djDelta !== dest.j2) {
        newChart[di][dj] = oldChart[oi][oj];
        oi += oiDelta;
        oj += ojDelta;
        di += diDelta;
        dj += djDelta;
    }
}

// Cycle 4 lines in the chart: A -> B -> C -> D -> A
function Cycle4(oldChart, newChart, A, B, C, D)
{
    CopySequence(oldChart, newChart, A, B);
    CopySequence(oldChart, newChart, B, C);
    CopySequence(oldChart, newChart, C, D);
    CopySequence(oldChart, newChart, D, A);
}

// Swaps 4 lines in the chart: A <-> C, B <-> D
function CycleSwap(oldChart, newChart, A, B, C, D)
{
    CopySequence(oldChart, newChart, A, C);
    CopySequence(oldChart, newChart, C, A);
    CopySequence(oldChart, newChart, B, D);
    CopySequence(oldChart, newChart, D, B);
}

// TODO: Rewrite rotations in terms of FlipH FlipV and Transpose to allow generalization for larger cubes...

function RotateFaceClockwise(oldChart, newChart, face) {
    var i1 = face.R.i1, j1 = face.R.j1, i2 = face.R.i2, j2 = face.R.j2;
    CopySequence(oldChart, newChart, Rect(i1+0, j1+0, i1+0, j1+2), Rect(i1+0, j1+2, i1+2, j1+2));
    CopySequence(oldChart, newChart, Rect(i1+1, j1+0, i1+1, j1+2), Rect(i1+0, j1+1, i1+2, j1+1));
    CopySequence(oldChart, newChart, Rect(i1+2, j1+0, i1+2, j1+2), Rect(i1+0, j1+0, i1+2, j1+0));
    Cycle4(oldChart, newChart, face.A, face.B, face.C, face.D);
}

function RotateFaceCounterClockwise(oldChart, newChart, face) {
    var i1 = face.R.i1, j1 = face.R.j1, i2 = face.R.i2, j2 = face.R.j2;
    CopySequence(oldChart, newChart, Rect(i1+0, j1+0, i1+0, j1+2), Rect(i1+2, j1+0, i1+0, j1+0));
    CopySequence(oldChart, newChart, Rect(i1+1, j1+0, i1+1, j1+2), Rect(i1+2, j1+1, i1+0, j1+1));
    CopySequence(oldChart, newChart, Rect(i1+2, j1+0, i1+2, j1+2), Rect(i1+2, j1+2, i1+0, j1+2));
    Cycle4(oldChart, newChart, face.D, face.C, face.B, face.A);
}

function RotateFaceTwice(oldChart, newChart, face) {
    var i1 = face.R.i1, j1 = face.R.j1, i2 = face.R.i2, j2 = face.R.j2;
    CopySequence(oldChart, newChart, Rect(i1+0, j1+0, i1+0, j1+2), Rect(i1+2, j1+2, i1+2, j1+0));
    CopySequence(oldChart, newChart, Rect(i1+1, j1+0, i1+1, j1+2), Rect(i1+1, j1+2, i1+1, j1+0));
    CopySequence(oldChart, newChart, Rect(i1+2, j1+0, i1+2, j1+2), Rect(i1+0, j1+2, i1+0, j1+0));
    CycleSwap(oldChart, newChart, face.A, face.B, face.C, face.D);
}

function ApplyMove(oldChart, move) {
    var newChart = CopyChart(oldChart);

    // TODO: Create a nice structure for these
    // TODO: Find an easy way to generate line rects based on face rects
    // TODO: Better yet, generate face rects based on cube size!
    var faceRects = {
        "F": { 
            R: Rect(3, 3, 5, 5), // Face rect
            A: Rect(2, 3, 2, 5), // Up line
            B: Rect(3, 6, 5, 6), // Right line
            C: Rect(6, 5, 6, 3), // Down line
            D: Rect(5, 2, 3, 2)  // Left line
        },
        "R": {
            R: Rect(3, 6, 5, 8),
            A: Rect(2, 5, 0, 5),
            B: Rect(3, 9, 5, 9),
            C: Rect(8, 5, 6, 5),
            D: Rect(5, 5, 3, 5)
        },
        "B": {
            R: Rect(3, 9, 5, 11),
            A: Rect(0, 5, 0, 3),
            B: Rect(3, 0, 5, 0),
            C: Rect(8, 3, 8, 5),
            D: Rect(5, 8, 3, 8)
        },
        "L": {
            R: Rect(3, 0, 5, 2),
            A: Rect(0, 3, 2, 3),
            B: Rect(3, 3, 5, 3),
            C: Rect(6, 3, 8, 3),
            D: Rect(5, 11, 3, 11)
        },
        "U": {
            R: Rect(0, 3, 2, 5),
            A: Rect(3, 11, 3, 9),
            B: Rect(3, 8, 3, 6),
            C: Rect(3, 5, 3, 3),
            D: Rect(3, 2, 3, 0)
        },
        "D": {
            R: Rect(6, 3, 8, 5),
            A: Rect(5, 3, 5, 5),
            B: Rect(5, 6, 5, 8),
            C: Rect(5, 9, 5, 11),
            D: Rect(5, 0, 5, 2)
        }
    }

    var face = move.substr(0, 1);
    var direction = move.substr(1);

    if (direction === "") {
        RotateFaceClockwise(oldChart, newChart, faceRects[face]);        
    } else if (direction === "'") {
        RotateFaceCounterClockwise(oldChart, newChart, faceRects[face]);        
    } else if (direction === "2") {
        RotateFaceTwice(oldChart, newChart, faceRects[face]);
    }

    return newChart;
}

function Test(move) {
    if (!globalChart) {
        globalChart = InitChart();
    }        
    globalChart = ApplyMove(globalChart, move);
    DrawChart(globalChart);
}

function TestInit() {
    globalChart = InitChart();
    DrawChart(globalChart);
}

function TestScramble() {
    var scramble = document.getElementById("display_scramble");
    var moves = scramble.innerText.split(' ');
    var i = 0;
    for (i = 0; i < moves.length; i++) {
        globalChart = ApplyMove(globalChart, moves[i]);
    }
    DrawChart(globalChart);
}

function TestReverse() {
    var reverse = document.getElementById("display_reverse");
    var moves = reverse.innerText.split(' ');
    var i = 0;
    for (i = 0; i < moves.length; i++) {
        globalChart = ApplyMove(globalChart, moves[i]);
    }
    DrawChart(globalChart);
}

// TODO: Moves M, E, S, x, y, z, wide moves, etc.
// TODO: Save times
// TODO: Allow configuration (number of moves, input own scramble, random seed)
// TODO: Share URL
// TODO: Publish on github.io? Other?

function OnKeyUp(event) {
    switch (event.keyCode)
    {
        case 78: // N
            NewScramble();
            break;
        case 27: // ESC
            TestInit();
            break;
        case 32: // SPACE
            ToggleTimer();
            break;
        case 70:
            Test("F" + (event.shiftKey ? "\'" : ""));
            break;
        case 66:
            Test("B" + (event.shiftKey ? "\'" : ""));
            break;
        case 82:
            Test("R" + (event.shiftKey ? "\'" : ""));
            break;
        case 76:
            Test("L" + (event.shiftKey ? "\'" : ""));
            break;
        case 85:
            Test("U" + (event.shiftKey ? "\'" : ""));
            break;
        case 68:
            Test("D" + (event.shiftKey ? "\'" : ""));
            break;
    }
}

function ButtonClick(event) {
    Test(event.target.innerText);
}

function OnLoad() {
    NewScramble();
    document.body.addEventListener("keyup", OnKeyUp);
    document.getElementById("NewScramble").addEventListener("click", NewScramble);
    document.getElementById("ToggleTimer").addEventListener("click", ToggleTimer);
    document.getElementById("TestInit").addEventListener("click", TestInit);
    document.getElementById("TestScramble").addEventListener("click", TestScramble);
    document.getElementById("TestReverse").addEventListener("click", TestReverse);
    var buttons = document.getElementsByClassName("move_control");
    var i;
    for (i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", ButtonClick);
    }
}

window.onload = OnLoad;
