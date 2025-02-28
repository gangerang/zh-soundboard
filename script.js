document.addEventListener("DOMContentLoaded", function() {
    const soundboardContainer = document.getElementById("soundboard");
    const searchInput = document.getElementById("searchInput");
    const filtersContainer = document.getElementById("filters");
    let combinedData = {}; // Keyed by unit code
    let allUnits = [];    // List of unit codes
    let selectedFactions = new Set();
    let selectedUnitTypes = new Set();
    
    // Fetch voices.json and units.json concurrently
    Promise.all([
      fetch("voices.json").then(res => res.json()),
      fetch("units.json").then(res => res.json())
    ]).then(([voicesData, unitsData]) => {
      // Build combinedData from units.json array joined with voices.json (keyed by Unit Code)
      unitsData.forEach(unitObj => {
        const unitCode = unitObj["Unit Code"];
        combinedData[unitCode] = {
          unitName: unitObj["Unit Name"],
          faction: unitObj["Faction"],
          unitType: unitObj["Unit Type"],
          voices: voicesData[unitCode] || {}
        };
      });
      // For any units in voices.json that are not in units.json, add with defaults
      for (const unitCode in voicesData) {
        if (!combinedData.hasOwnProperty(unitCode)) {
          combinedData[unitCode] = {
            unitName: unitCode,
            faction: "unknown",
            unitType: "unknown",
            voices: voicesData[unitCode]
          };
        }
      }
      allUnits = Object.keys(combinedData);
      
      // Render filter buttons and the soundboard
      renderFilters();
      renderSoundboard();
    }).catch(error => console.error("Error loading data:", error));
    
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
      
      // Faction filters
      const factionDiv = document.createElement("div");
      factionDiv.className = "filter-section";
      factionDiv.innerHTML = "<strong>Faction:</strong> ";
      factions.forEach(faction => {
        const btn = document.createElement("button");
        btn.textContent = faction;
        btn.className = "filter-button";
        btn.onclick = () => toggleFilter("faction", faction, btn);
        factionDiv.appendChild(btn);
      });
      filtersContainer.appendChild(factionDiv);
      
      // Unit Type filters
      const unitTypeDiv = document.createElement("div");
      unitTypeDiv.className = "filter-section";
      unitTypeDiv.innerHTML = "<strong>Unit Type:</strong> ";
      unitTypes.forEach(type => {
        const btn = document.createElement("button");
        btn.textContent = type;
        btn.className = "filter-button";
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
    
    // Render the soundboard based on current filters and search query
    function renderSoundboard() {
      soundboardContainer.innerHTML = "";
      const searchQuery = searchInput.value.toLowerCase();
      allUnits.forEach(unitCode => {
        const unitInfo = combinedData[unitCode];
        // Apply filters
        if (selectedFactions.size > 0 && !selectedFactions.has(unitInfo.faction)) return;
        if (selectedUnitTypes.size > 0 && !selectedUnitTypes.has(unitInfo.unitType)) return;
        if (searchQuery && !unitInfo.unitName.toLowerCase().includes(searchQuery)) return;
        
        // Create unit container
        const unitContainer = document.createElement("div");
        unitContainer.className = "unit";
        
        // Unit title (from units.json)
        const unitTitle = document.createElement("h2");
        unitTitle.textContent = unitInfo.unitName;
        unitContainer.appendChild(unitTitle);
        
        // Classification info
        const classificationInfo = document.createElement("p");
        classificationInfo.className = "classification-info";
        classificationInfo.textContent = `Faction: ${unitInfo.faction}, Unit Type: ${unitInfo.unitType}`;
        unitContainer.appendChild(classificationInfo);
        
        // Render voice actions from voices.json.
        const voices = unitInfo.voices;
        const mainActions = ["create", "select", "move", "attack"];
        
        // First row: main actions
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
          const cell = document.createElement("div");
          cell.className = "action-cell";
          if (foundActionKey) {
            const btn = document.createElement("button");
            btn.className = "action-button";
            btn.textContent = foundActionKey;
            btn.addEventListener("click", () => playRandomSound(unitCode, foundActionKey));
            cell.appendChild(btn);
          }
          mainActionsRow.appendChild(cell);
        });
        unitContainer.appendChild(mainActionsRow);
        
        // Second row: other actions
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
        
        soundboardContainer.appendChild(unitContainer);
      });
    }
    
    // Update list when search input changes
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
  });
  