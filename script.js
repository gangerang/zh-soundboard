document.addEventListener("DOMContentLoaded", function() {
    const soundboardContainer = document.getElementById("soundboard");
    const searchInput = document.getElementById("searchInput");
    const filtersContainer = document.getElementById("filters");
    const modeToggleContainer = document.getElementById("modeToggle");
    let combinedData = {}; // Keyed by unit code
    let allUnits = [];    // List of unit codes
    let selectedFactions = new Set();
    let selectedUnitTypes = new Set();
    // Toggle mode: "all", "actions", or "quotes"
    let toggleMode = "all";

    // Load voices.json, units.json, and quotes.json concurrently
    Promise.all([
        fetch("voices.json").then(res => res.json()),
        fetch("units.json").then(res => res.json()),
        fetch("quotes.json").then(res => res.json())
    ])
    .then(([voicesData, unitsData, quotesData]) => {
        // Build combinedData from units.json joined with voices.json and quotes.json
        unitsData.forEach(unitObj => {
            const unitCode = unitObj["Unit Code"];
            combinedData[unitCode] = {
                unitName: unitObj["Unit Name"],
                faction: unitObj["Faction"],
                unitType: unitObj["Unit Type"],
                voices: voicesData[unitCode] || {},
                quotes: quotesData[unitCode] || []
            };
        });
        // For any units in voices.json (or quotes.json) that are not in units.json, add with defaults
        for (const unitCode in voicesData) {
            if (!combinedData.hasOwnProperty(unitCode)) {
                combinedData[unitCode] = {
                    unitName: unitCode,
                    faction: "unknown",
                    unitType: "unknown",
                    voices: voicesData[unitCode],
                    quotes: quotesData[unitCode] || []
                };
            }
        }
        for (const unitCode in quotesData) {
            if (!combinedData.hasOwnProperty(unitCode)) {
                combinedData[unitCode] = {
                    unitName: unitCode,
                    faction: "unknown",
                    unitType: "unknown",
                    voices: voicesData[unitCode] || {},
                    quotes: quotesData[unitCode]
                };
            }
        }
        allUnits = Object.keys(combinedData);

        // Render mode toggles, filters, and the soundboard
        renderModeToggle();
        renderFilters();
        renderSoundboard();
    })
    .catch(error => console.error("Error loading data:", error));

    // Render mode toggle buttons ("All", "Actions", "Quotes")
    function renderModeToggle() {
        modeToggleContainer.innerHTML = "";
        const modes = ["all", "actions", "quotes"];
        modes.forEach(mode => {
            const btn = document.createElement("button");
            btn.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
            btn.className = "filter-button mode-toggle";
            if (toggleMode === mode) {
                btn.classList.add("active");
            }
            btn.onclick = () => {
                toggleMode = mode;
                // Update active state of mode buttons
                Array.from(modeToggleContainer.children).forEach(child => {
                    child.classList.remove("active");
                });
                btn.classList.add("active");
                renderSoundboard();
            };
            modeToggleContainer.appendChild(btn);
        });
    }

    // Render toggleable filter buttons for Faction and Unit Type
    function renderFilters() {
        const factions = new Set();
        const unitTypes = new Set();
        allUnits.forEach(unitCode => {
            const unitInfo = combinedData[unitCode];
            factions.add(unitInfo.faction);
            unitTypes.add(unitInfo.unitType);
        });

        filtersContainer.innerHTML = "";

        // Faction filters using icons
        const factionDiv = document.createElement("div");
        factionDiv.className = "filter-section";
        factionDiv.innerHTML = "<strong>Faction:</strong> ";
        factions.forEach(faction => {
            const btn = document.createElement("button");
            btn.className = "filter-button faction-filter";
            // Add faction-specific class (e.g. faction-usa)
            btn.classList.add("faction-" + faction.toLowerCase());
            btn.onclick = () => toggleFilter("faction", faction, btn);

            const img = document.createElement("img");
            img.src = `images/faction_${faction.toLowerCase()}.webp`;
            img.alt = faction;
            img.className = "filter-icon";
            btn.appendChild(img);

            factionDiv.appendChild(btn);
        });
        filtersContainer.appendChild(factionDiv);

        // Unit Type filters as text buttons
        const unitTypeDiv = document.createElement("div");
        unitTypeDiv.className = "filter-section";
        unitTypeDiv.innerHTML = "<strong>Unit Type:</strong> ";
        unitTypes.forEach(type => {
            const btn = document.createElement("button");
            btn.textContent = type;
            btn.className = "filter-button unit-type-filter";
            btn.onclick = () => toggleFilter("unitType", type, btn);
            unitTypeDiv.appendChild(btn);
        });
        filtersContainer.appendChild(unitTypeDiv);
    }

    function toggleFilter(filterType, value, button) {
        if (filterType === "faction") {
            if (selectedFactions.has(value)) {
                selectedFactions.delete(value);
                button.classList.remove("active");
            } else {
                selectedFactions.add(value);
                button.classList.add("active");
            }
        } else if (filterType === "unitType") {
            if (selectedUnitTypes.has(value)) {
                selectedUnitTypes.delete(value);
                button.classList.remove("active");
            } else {
                selectedUnitTypes.add(value);
                button.classList.add("active");
            }
        }
        renderSoundboard();
    }

    // Render the soundboard based on current filters, search query, and mode toggle
    function renderSoundboard() {
        soundboardContainer.innerHTML = "";
        const searchQuery = searchInput.value.toLowerCase();

        // Sort unit codes alphabetically by unitName
        const sortedUnitCodes = allUnits.slice().sort((a, b) => {
            const nameA = combinedData[a].unitName.toLowerCase();
            const nameB = combinedData[b].unitName.toLowerCase();
            return nameA.localeCompare(nameB);
        });

        sortedUnitCodes.forEach(unitCode => {
            const unitInfo = combinedData[unitCode];
            const combinedStr = (
                unitInfo.unitName + " " + unitInfo.faction + " " + unitInfo.unitType
            ).toLowerCase();

            // Filter by search query if provided
            if (searchQuery && !combinedStr.includes(searchQuery)) return;
            if (selectedFactions.size > 0 && !selectedFactions.has(unitInfo.faction))
                return;
            if (selectedUnitTypes.size > 0 && !selectedUnitTypes.has(unitInfo.unitType))
                return;

            // Create unit container
            const unitContainer = document.createElement("div");
            unitContainer.className = "unit";
            unitContainer.classList.add("unit-" + unitInfo.faction.toLowerCase());

            // Add unit icon (from images folder using Unit Code)
            const unitIcon = document.createElement("img");
            unitIcon.src = `images/${unitCode}.webp`;
            unitIcon.alt = unitInfo.unitName;
            unitIcon.className = "unit-icon";
            unitContainer.appendChild(unitIcon);

            // Unit title
            const unitTitle = document.createElement("h2");
            unitTitle.textContent = unitInfo.unitName;
            unitContainer.appendChild(unitTitle);

            // Classification info
            const classificationInfo = document.createElement("p");
            classificationInfo.className = "classification-info";
            classificationInfo.textContent = `Faction: ${unitInfo.faction}, Unit Type: ${unitInfo.unitType}`;
            unitContainer.appendChild(classificationInfo);

            // Render voice actions if mode is "all" or "actions"
            if (toggleMode === "all" || toggleMode === "actions") {
                const voices = unitInfo.voices;
                const mainActions = ["create", "select", "move", "attack"];
                const mainActionsRow = document.createElement("div");
                mainActionsRow.className = "actions-row main-actions-row";
                mainActions.forEach(actionName => {
                    let foundActionKey = null;
                    for (const action in voices) {
                        if (action.toLowerCase() === actionName) {
                            foundActionKey = action;
                            break;
                        }
                    }
                    if (foundActionKey) {
                        const btn = document.createElement("button");
                        btn.className = "action-button";
                        btn.textContent = foundActionKey;
                        btn.addEventListener("click", () =>
                            playRandomSound(unitCode, foundActionKey)
                        );
                        mainActionsRow.appendChild(btn);
                    }
                });
                unitContainer.appendChild(mainActionsRow);

                // Other actions row
                const otherActionsRow = document.createElement("div");
                otherActionsRow.className = "actions-row other-actions-row";
                for (const action in voices) {
                    if (!mainActions.includes(action.toLowerCase())) {
                        const btn = document.createElement("button");
                        btn.className = "action-button";
                        btn.textContent = action;
                        btn.addEventListener("click", () => playRandomSound(unitCode, action));
                        otherActionsRow.appendChild(btn);
                    }
                }
                unitContainer.appendChild(otherActionsRow);
            }

            // Render quotes if mode is "all" or "quotes"
            if (toggleMode === "all" || toggleMode === "quotes") {
                const quotes = unitInfo.quotes;
                if (quotes.length > 0) {
                    const quotesRow = document.createElement("div");
                    quotesRow.className = "actions-row quotes-row";
                    quotes.forEach(quoteObj => {
                        const btn = document.createElement("button");
                        btn.className = "action-button quote-button";
                        btn.textContent = quoteObj.quote;
                        btn.addEventListener("click", () =>
                            playQuoteSound(quoteObj.file)
                        );
                        quotesRow.appendChild(btn);
                    });
                    unitContainer.appendChild(quotesRow);
                }
            }

            soundboardContainer.appendChild(unitContainer);
        });
    }

    searchInput.addEventListener("input", function() {
        renderSoundboard();
    });

    function playRandomSound(unitCode, action) {
        const unitData = combinedData[unitCode];
        if (!unitData) {
            console.error(`Unit "${unitCode}" not found in combined data.`);
            return;
        }
        const voices = unitData.voices;
        const attributes = voices[action];
        if (!attributes) {
            console.error(`Action "${action}" not found for unit "${unitCode}".`);
            return;
        }
        let sounds = attributes["Sounds"];
        if (!Array.isArray(sounds)) {
            console.error(`Sounds attribute is not an array for ${unitCode} - ${action}`);
            return;
        }
        sounds = sounds.filter(sound => sound.trim() !== "");
        if (sounds.length === 0) {
            console.error(`No valid sound files for ${unitCode} - ${action}`);
            return;
        }
        const randomIndex = Math.floor(Math.random() * sounds.length);
        const soundFile = sounds[randomIndex] + ".wav";
        const audio = new Audio("sounds/" + soundFile);
        if (attributes["Volume"]) {
            const vol = parseFloat(attributes["Volume"]);
            audio.volume = isNaN(vol) ? 1.0 : Math.min(Math.max(vol / 100, 0), 1);
        } else {
            audio.volume = 1.0;
        }
        audio.play().catch(err => console.error("Error playing sound:", err));
    }

    function playQuoteSound(fileName) {
        const audio = new Audio("sounds/" + fileName + ".wav");
        audio.volume = 1.0;
        audio.play().catch(err => console.error("Error playing quote sound:", err));
    }
});
