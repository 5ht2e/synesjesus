// =====================================================
// Synesthesia N-Back
// =====================================================

// -----------------------------------------------------
// Character set
// -----------------------------------------------------

const allCharacters = [
    ..."abcdefghijklmnopqrstuvwxyz",
    ..."0123456789"
];

let activeCharacters = [...allCharacters];

// -----------------------------------------------------
// Default color map
// (Rainbow Text defaults)
// -----------------------------------------------------

const defaultMappings = {
    a:[255,163,168],
    b:[102,153,255],
    c:[152,235,0],
    d:[255,102,0],
    e:[213,229,169],
    f:[255,0,204],
    g:[51,255,51],
    h:[221,39,130],
    i:[186,163,255],
    j:[0,204,102],
    k:[204,179,0],
    l:[255,107,107],
    m:[120,95,74],
    n:[55,177,179],
    o:[255,203,148],
    p:[179,5,156],
    q:[101,43,171],
    r:[255,0,0],
    s:[253,167,124],
    t:[0,255,204],
    u:[144,216,249],
    v:[213,87,255],
    w:[255,204,51],
    x:[178,223,42],
    y:[255,255,0],
    z:[120,152,217],

    0:[128,128,128],
    1:[179,179,179],
    2:[255,51,51],
    3:[51,204,51],
    4:[102,153,255],
    5:[204,153,0],
    6:[238,107,255],
    7:[0,204,204],
    8:[255,153,0],
    9:[127,51,255]
};

let mappings = {};

// -----------------------------------------------------
// Task state
// -----------------------------------------------------

let nBack = 1;
let trials = [];
let currentTrial = -1;
let awaitingResponse = false;

let hits = 0;
let misses = 0;
let falseAlarms = 0;
let correctRejects = 0;

// -----------------------------------------------------
// Utility functions
// -----------------------------------------------------

function hexToRgb(hex){

    hex = hex.replace("#","");

    return [
        parseInt(hex.substring(0,2),16),
        parseInt(hex.substring(2,4),16),
        parseInt(hex.substring(4,6),16)
    ];
}

function rgbToHex(r,g,b){

    return "#" +
        [r,g,b]
        .map(v =>
            Number(v)
            .toString(16)
            .padStart(2,"0")
        )
        .join("")
        .toUpperCase();
}

function rgbString(rgb){

    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function showFeedback(text){

    const el = document.getElementById("feedback");

    el.textContent = text;

    setTimeout(() => {

        if(el.textContent === text){
            el.textContent = "";
        }

    },800);
}

// -----------------------------------------------------
// Generate UI
// -----------------------------------------------------

function generateCharacterSelector(){

    const selector =
        document.getElementById("characterSelector");

    selector.innerHTML = "";

    for(const char of allCharacters){

        const label =
            document.createElement("label");

        label.innerHTML = `
            <input
                type="checkbox"
                class="characterCheckbox"
                value="${char}"
                checked
            >
            ${char}
        `;

        selector.appendChild(label);
    }
}

function generateColorTable(){

    const tbody =
        document.querySelector(
            "#mappingTable tbody"
        );

    tbody.innerHTML = "";

    for(const char of allCharacters){

        const rgb =
            defaultMappings[char];

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${char}</td>

            <td>
                <input
                    id="${char}_r"
                    type="number"
                    min="0"
                    max="255"
                    value="${rgb[0]}"
                >
            </td>

            <td>
                <input
                    id="${char}_g"
                    type="number"
                    min="0"
                    max="255"
                    value="${rgb[1]}"
                >
            </td>

            <td>
                <input
                    id="${char}_b"
                    type="number"
                    min="0"
                    max="255"
                    value="${rgb[2]}"
                >
            </td>
        `;

        tbody.appendChild(row);
    }
}

// -----------------------------------------------------
// Settings
// -----------------------------------------------------

function loadMappings(){

    mappings = {};

    for(const char of allCharacters){

        mappings[char] = [

            parseInt(
                document.getElementById(
                    `${char}_r`
                ).value
            ),

            parseInt(
                document.getElementById(
                    `${char}_g`
                ).value
            ),

            parseInt(
                document.getElementById(
                    `${char}_b`
                ).value
            )

        ];
    }
}

function loadActiveCharacters(){

    activeCharacters =
        [
            ...document.querySelectorAll(
                ".characterCheckbox:checked"
            )
        ]
        .map(cb => cb.value);

    if(activeCharacters.length < 2){

        alert(
            "Please select at least two active characters."
        );

        return false;
    }

    return true;
}

// -----------------------------------------------------
// Random stimulus selection
// -----------------------------------------------------

function randomCharacter(){

    return activeCharacters[
        Math.floor(
            Math.random() *
            activeCharacters.length
        )
    ];
}

// -----------------------------------------------------
// Trial generation
// -----------------------------------------------------

function createTrials(total,n){

    const generated = [];

    for(let i=0;i<total;i++){

        const makeMatch =
            i >= n &&
            Math.random() < 0.5;

        if(makeMatch){

            const identity =
                generated[i-n].identity;

            generated.push({

                identity,

                type:
                    Math.random() < 0.5
                    ? "letter"
                    : "color"

            });

        }else{

            let identity;

            do{

                identity =
                    randomCharacter();

            }while(

                i >= n &&
                identity ===
                generated[i-n].identity

            );

            generated.push({

                identity,

                type:
                    Math.random() < 0.5
                    ? "letter"
                    : "color"

            });
        }
    }

    return generated;
}

// -----------------------------------------------------
// Gameplay
// -----------------------------------------------------

function evaluateNoResponse(index){

    const isMatch =

        index >= nBack &&

        trials[index].identity ===
        trials[index-nBack].identity;

    if(isMatch){

        misses++;

        showFeedback(
            "✗ Missed Match"
        );

    }else{

        correctRejects++;
    }

    awaitingResponse = false;
}

function showTrial(index){

    currentTrial = index;

    if(index >= trials.length){

        finishGame();
        return;
    }

    const stim =
        document.getElementById(
            "stimulus"
        );

    const trial =
        trials[index];

    awaitingResponse = true;

    document
        .getElementById("status")
        .textContent =
        `Trial ${index+1} / ${trials.length}`;

    if(trial.type === "letter"){

        stim.className = "";

        stim.textContent =
            trial.identity.toUpperCase();

        stim.style.background =
            "transparent";

        stim.style.color =
            "black";

    }else{

        stim.className =
            "square";

        stim.textContent = "";

        stim.style.background =
            rgbString(
                mappings[
                    trial.identity
                ]
            );
    }

    setTimeout(() => {

        if(awaitingResponse){

            evaluateNoResponse(
                index
            );
        }

        stim.className =
            "hidden";

        setTimeout(() => {

            stim.className = "";

            showTrial(
                index + 1
            );

        },2000);

    },1000);
}

// -----------------------------------------------------
// End of game
// -----------------------------------------------------

function finishGame(){

    document
        .getElementById("gameArea")
        .style.display =
        "none";

    const total =

        hits +
        misses +
        falseAlarms +
        correctRejects;

    const accuracy =

        total > 0

        ? (
            (
                hits +
                correctRejects
            )
            / total
            * 100
        ).toFixed(1)

        : 0;

    document
        .getElementById("results")
        .innerHTML = `

        <h2>Results</h2>

        <p>Accuracy: ${accuracy}%</p>

        <p>Hits: ${hits}</p>

        <p>Misses: ${misses}</p>

        <p>False Alarms: ${falseAlarms}</p>

        <p>Correct Rejections: ${correctRejects}</p>

        <button id="returnToStart">
            Return To Start Page
        </button>
    `;

    document
        .getElementById(
            "returnToStart"
        )
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "results"
                    )
                    .innerHTML = "";

                document
                    .getElementById(
                        "setup"
                    )
                    .style.display =
                    "block";
            }
        );
}

// -----------------------------------------------------
// Keyboard input
// -----------------------------------------------------

document.addEventListener(
    "keydown",
    e => {

        if(
            e.code !== "Space" ||
            !awaitingResponse
        ){
            return;
        }

        const idx =
            currentTrial;

        const isMatch =

            idx >= nBack &&

            trials[idx].identity ===
            trials[idx-nBack].identity;

        if(isMatch){

            hits++;

            showFeedback(
                "✓ Correct"
            );

        }else{

            falseAlarms++;

            showFeedback(
                "✗ Wrong"
            );
        }

        awaitingResponse = false;
    }
);

// -----------------------------------------------------
// Import settings
// -----------------------------------------------------

document
.getElementById(
    "importSettings"
)
.addEventListener(
    "change",
    async e => {

        const file =
            e.target.files[0];

        if(!file) return;

        try{

            const text =
                await file.text();

            const data =
                JSON.parse(text);

            if(data.colorMap){

                for(
                    const char
                    of allCharacters
                ){

                    const hex =
                        data.colorMap[
                            char
                        ];

                    if(!hex)
                        continue;

                    const [
                        r,
                        g,
                        b
                    ] =
                        hexToRgb(
                            hex
                        );

                    document
                        .getElementById(
                            `${char}_r`
                        )
                        .value = r;

                    document
                        .getElementById(
                            `${char}_g`
                        )
                        .value = g;

                    document
                        .getElementById(
                            `${char}_b`
                        )
                        .value = b;
                }
            }

            if(
                Array.isArray(
                    data.activeCharacters
                )
            ){

                document
                    .querySelectorAll(
                        ".characterCheckbox"
                    )
                    .forEach(cb => {

                        cb.checked =
                            data.activeCharacters
                            .includes(
                                cb.value
                            );
                    });
            }

            alert(
                "Settings imported."
            );

        }catch(err){

            console.error(err);

            alert(
                "Invalid settings file."
            );
        }
    }
);

// -----------------------------------------------------
// Export settings
// -----------------------------------------------------

document
.getElementById(
    "exportSettings"
)
.addEventListener(
    "click",
    () => {

        const colorMap = {};

        for(
            const char
            of allCharacters
        ){

            const r =
                parseInt(
                    document
                    .getElementById(
                        `${char}_r`
                    )
                    .value
                );

            const g =
                parseInt(
                    document
                    .getElementById(
                        `${char}_g`
                    )
                    .value
                );

            const b =
                parseInt(
                    document
                    .getElementById(
                        `${char}_b`
                    )
                    .value
                );

            colorMap[char] =
                rgbToHex(
                    r,
                    g,
                    b
                );
        }

        const activeCharacters =

            [
                ...document
                .querySelectorAll(
                    ".characterCheckbox:checked"
                )
            ]
            .map(
                cb => cb.value
            );

        const output = {

            colorMap,

            activeCharacters
        };

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        output,
                        null,
                        2
                    )
                ],
                {
                    type:
                    "application/json"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        a.href = url;

        a.download =
            "synesthesia-settings.json";

        document.body
            .appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(
            url
        );
    }
);

// -----------------------------------------------------
// Select all / none
// -----------------------------------------------------

document
.getElementById(
    "selectAllChars"
)
.addEventListener(
    "click",
    () => {

        document
            .querySelectorAll(
                ".characterCheckbox"
            )
            .forEach(
                cb =>
                cb.checked = true
            );
    }
);

document
.getElementById(
    "selectNoneChars"
)
.addEventListener(
    "click",
    () => {

        document
            .querySelectorAll(
                ".characterCheckbox"
            )
            .forEach(
                cb =>
                cb.checked = false
            );
    }
);

// -----------------------------------------------------
// Start button
// -----------------------------------------------------

document
.getElementById(
    "startBtn"
)
.addEventListener(
    "click",
    () => {

        if(
            !loadActiveCharacters()
        ){
            return;
        }

        loadMappings();

        nBack =
            parseInt(
                document
                .getElementById(
                    "nValue"
                )
                .value
            );

        const totalTrials =
            parseInt(
                document
                .getElementById(
                    "trialCount"
                )
                .value
            );

        trials =
            createTrials(
                totalTrials,
                nBack
            );

        hits = 0;
        misses = 0;
        falseAlarms = 0;
        correctRejects = 0;

        document
            .getElementById(
                "results"
            )
            .innerHTML = "";

        document
            .getElementById(
                "setup"
            )
            .style.display =
            "none";

        document
            .getElementById(
                "gameArea"
            )
            .style.display =
            "block";

        document
            .getElementById(
                "feedback"
            )
            .textContent = "";

        showTrial(0);
    }
);

// -----------------------------------------------------
// Initialize
// -----------------------------------------------------

generateCharacterSelector();
generateColorTable();
loadMappings();