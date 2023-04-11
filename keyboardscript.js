window.addEventListener("load", setup); 

var chords;
var scales;
var currentGuess = [0, 0, 0]; // current "thing" user is guessing, format: "<chord/scale type> <note> <[0 for chord]|[1 for scale]>"
var whiteDivOS;
var blackDivOS;
var currentClicked = new Array();
var guessedCorrectly = 0;
var numRight = 0, numWrong = 0;

function setup() {
    currentGuess[0] = 0;
    currentGuess[1] = 0;
    currentGuess[2] = 0;
    whiteDivOS = document.getElementById("whiteKeysDiv").innerHTML;
    blackDivOS = document.getElementById("blackKeysDiv").innerHTML;

    document.getElementById("chords").checked = true;
    displayChordCboxes();

    addListeners(); // set up event listeners for each key

    fetch("chords.json")
        .then(res => res.json())
        .then(data => {
            chords = data;

            fetch("scales.json")
                .then(res => res.json())
                .then(data2 => {
                    scales = data2;
                    chooseNewChordOrScale();
                });
        });
}

function addListeners() {
    // add event listeners for each key on the piano keyboard
    let keys = document.getElementsByTagName("button");
    for(let key of keys) {
        //console.log(key.className);
        if(key.className.localeCompare("newChordButton") == 0)
            key.addEventListener("click", chooseNewChordOrScale);
        else {
            key.addEventListener("click", function() {
                handleNoteClicked(key.id)
            });
        }
    }
    // add event listeners for the checkboxes
    document.getElementById("chords").addEventListener("change", function() {
            chordCboxChecked = document.getElementById("chords").checked;
            displayChordCboxes();
        });
    document.getElementById("scales").addEventListener("change", function() {
            scaleCboxChecked = document.getElementById("scales").checked;
            console.log(scaleCboxChecked);
            displayScaleCboxes();
        });
}

function handleNoteClicked(note) {
    var noteClicked;
    if(note.length == 2) // white key
        noteClicked = note.substring(0, 1);
    else // black key
        noteClicked = note.substring(0, 2);

    let key = document.getElementById(note);
    var notesInChord;
    if(currentGuess[2] == 0)
        notesInChord = chords[currentGuess[0]][currentGuess[1]];
    else 
        notesInChord = scales[currentGuess[0]][currentGuess[1]];
    let guessed = false;
    for(let currentNote of notesInChord) {
        if(noteClicked.localeCompare(currentNote) == 0) {
            key.style.backgroundColor = "LightGreen";
            if(!currentClicked.includes(noteClicked)) {
                currentClicked.push(noteClicked);
                guessedCorrectly++;
                guessed = true;
            }
            break;
        }
    }
    if(!guessed) {
        numWrong++;
        document.getElementById("mistakesH2").textContent = `Mistakes: ${numWrong}`;
        key.style.backgroundColor = "Red";
    }
    // check if the chord has been fully guessed correctly
    var numNotesInChord;
    if(currentGuess[2] == 0) {
        numNotesInChord = 3;
        if(currentGuess[0] == 1 || currentGuess[0] == 3 || currentGuess[0] == 4)
            numNotesInChord = 4;
    }
    else {
        if(currentGuess[0] == 2 || currentGuess[0] == 3)
            numNotesInChord = 6;
        else
            numNotesInChord = 7;
    }

    for(let k of currentClicked) {
        if(notesInChord.includes(k)) {
            if(guessedCorrectly == numNotesInChord) { // chord has been guessed correctly
                // update statistics
                numRight++;
                document.getElementById("correctH2").textContent = `Correct: ${numRight}`;

                // choose new chord and return
                setTimeout(() => {
                    chooseNewChordOrScale();
                }, 500);
                return;
            }
        }
    }
}

function displayChordCboxes() {
    if(document.getElementById("chords").checked)
        document.getElementById("chordCheckboxDiv").style.display = "block";
    else
        document.getElementById("chordCheckboxDiv").style.display = "none";
    let cboxes = document.getElementById("chordCheckboxDiv").children;
    for(c of cboxes)
        c.checked = document.getElementById("chords").checked;
}

function displayScaleCboxes() {
    if(document.getElementById("scales").checked)
        document.getElementById("scaleCheckboxDiv").style.display = "block";
    else
        document.getElementById("scaleCheckboxDiv").style.display = "none";
    let cboxes = document.getElementById("scaleCheckboxDiv").children;
    for(c of cboxes)
        c.checked = document.getElementById("scales").checked;
}



function chooseNewChordOrScale() {
    currentClicked = new Array();
    guessedCorrectly = 0;
    clearButtonColors();

    if(document.getElementById("chords").checked && document.getElementById("scales").checked) { // randomly choose between a chord or a scale
        if(chooseTrueOrFalse())
            randomlySelectChord();
        else
            randomlySelectScale();
    }
    else if(document.getElementById("chords").checked && !document.getElementById("scales").checked) // choose a chord
        randomlySelectChord();
    else if(!document.getElementById("chords").checked && document.getElementById("scales").checked) // choose a scale
        randomlySelectScale();
}

function randomlySelectChord() { // randomly select a chord based on checkbox selection
    let chordTypes = new Array();
    for(let k = 0; k < document.getElementById("chordCheckboxDiv").children.length; k++) {
        if(document.getElementById("chordCheckboxDiv").children[k].checked == true)
            chordTypes.push(k);
    }

    let randType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
    let randChord = Math.floor(Math.random() * 11);
    let oldGuess = [...currentGuess];
    currentGuess[0] = randType;
    currentGuess[1] = randChord;
    currentGuess[2] = 0;
    if(oldGuess[0] == currentGuess[0] && oldGuess[1] == currentGuess[1]) // new guess is the same as the old guess, generate a new one
        randomlySelectChord();
    else 
        document.getElementById("chord").textContent = "Chord: " + convertCurrentChordToReadable();
}

function convertCurrentChordToReadable() { // turn our numbered chord into its actual name
    let type = chords[currentGuess[0]][12];
    if(type.localeCompare("maj") == 0) // chords like Cmaj, Dmaj, etc. will just be listed as C, D, etc.
        type = "";
    else if(type.localeCompare("min") == 0)
        type = "m";
    else if(type.localeCompare("min7") == 0)
        type = "m7";
    let sharpSymbol = String.fromCharCode(9839); // ascii code for sharp symbol

    let chord = chords[currentGuess[0]][currentGuess[1]][0].replace("s", sharpSymbol).toUpperCase();
    var secondChordName;
    if(chord.includes(sharpSymbol)) { // give the chord its second name (ex. G# -> Ab, C# -> Db)
        let cLetterAscii = chord.charCodeAt(0);
        if(cLetterAscii == 71) // change G# -> Ab
            cLetterAscii = 65;
        else
            cLetterAscii++;
        let cLetter = String.fromCharCode(cLetterAscii);
        let flatSymbol = String.fromCharCode(9837); // ascii code for flat symbol
        secondChordName = cLetter + flatSymbol;
        if(chooseTrueOrFalse())
            return chord + type;
        else
            return secondChordName + type;
    }
    return chord + type;
}

function randomlySelectScale() {
    let scaleTypes = new Array();
    for(let k = 0; k < document.getElementById("scaleCheckboxDiv").children.length; k++) {
        if(document.getElementById("scaleCheckboxDiv").children[k].checked == true)
            scaleTypes.push(k);
    }
    let randType = scaleTypes[Math.floor(Math.random() * scaleTypes.length)];
    let randScale = Math.floor(Math.random() * 11);
    let oldGuess = [...currentGuess];
    currentGuess[0] = randType;
    currentGuess[1] = randScale;
    currentGuess[2] = 1;
    if(oldGuess[0] == currentGuess[0] && oldGuess[1] == currentGuess[1]) // new guess is the same as the old guess, generate a new one
        randomlySelectScale();
    else 
        document.getElementById("chord").textContent = "Scale: " + convertCurrentScaleToReadable();
}

function convertCurrentScaleToReadable() {

    let type = scales[currentGuess[0]][12];
    let sharpSymbol = String.fromCharCode(9839); // ascii code for sharp symbol
    let scale = scales[currentGuess[0]][currentGuess[1]][0].replace("s", sharpSymbol).toUpperCase();
    scale += " ";
    var secondChordName;
    if(scale.includes(sharpSymbol)) { // give the chord its second name (ex. G# -> Ab, C# -> Db)
        let cLetterAscii = scale.charCodeAt(0);
        if(cLetterAscii == 71) // change G# -> Ab
            cLetterAscii = 65;
        else
            cLetterAscii++;
        let cLetter = String.fromCharCode(cLetterAscii);
        let flatSymbol = String.fromCharCode(9837); // ascii code for flat symbol
        secondChordName = cLetter + flatSymbol + " ";
        if(chooseTrueOrFalse())
            return scale + type;
        else
            return secondChordName + type;
    }
    return scale + type;
}

function clearButtonColors() {
    document.getElementById("whiteKeysDiv").innerHTML = whiteDivOS;
    document.getElementById("blackKeysDiv").innerHTML = blackDivOS;
    addListeners();
}

function chooseTrueOrFalse() {
    let rand = Math.floor(Math.random() * 10);
    if(rand % 2 == 0)
        return true;
    else 
        return false;
}