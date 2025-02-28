document.addEventListener("DOMContentLoaded", function () {
    const soundboardContainer = document.getElementById("soundboard");
    const searchInput = document.getElementById("searchInput");
    let soundData = {};
  
    // Fetch the JSON data from voices.json
    fetch("voices.json")
      .then((response) => response.json())
      .then((data) => {
        soundData = data;
        renderSoundboard(soundData);
      })
      .catch((error) => {
        console.error("Error loading sound data:", error);
      });
  
    // Define the main actions (using lowercase for comparison)
    const mainActions = ["create", "select", "move", "attack"];
  
    function renderSoundboard(data) {
      soundboardContainer.innerHTML = "";
      for (const unit in data) {
        const unitData = data[unit];
  
        // Create a container for the unit
        const unitContainer = document.createElement("div");
        unitContainer.className = "unit";
  
        // Unit title
        const unitTitle = document.createElement("h2");
        unitTitle.textContent = unit;
        unitContainer.appendChild(unitTitle);
  
        // Create first row for main actions (Create, Select, Move, Attack)
        const mainActionsRow = document.createElement("div");
        mainActionsRow.className = "actions-row main-actions-row";
        mainActions.forEach((actionName) => {
          let foundActionKey = null;
          // Find an action that matches the main action (case-insensitive)
          for (const action in unitData) {
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
            btn.addEventListener("click", () => playRandomSound(unit, foundActionKey));
            cell.appendChild(btn);
          }
          mainActionsRow.appendChild(cell);
        });
        unitContainer.appendChild(mainActionsRow);
  
        // Create second row for any remaining actions
        const otherActionsRow = document.createElement("div");
        otherActionsRow.className = "actions-row other-actions-row";
        for (const action in unitData) {
          if (!mainActions.includes(action.toLowerCase())) {
            const btn = document.createElement("button");
            btn.className = "action-button";
            btn.textContent = action;
            btn.addEventListener("click", () => playRandomSound(unit, action));
            otherActionsRow.appendChild(btn);
          }
        }
        unitContainer.appendChild(otherActionsRow);
  
        soundboardContainer.appendChild(unitContainer);
      }
    }
  
    // Filter functionality to search by unit or action
    searchInput.addEventListener("input", function () {
      const query = this.value.toLowerCase();
      const filteredData = {};
      for (const unit in soundData) {
        if (unit.toLowerCase().includes(query)) {
          filteredData[unit] = soundData[unit];
        } else {
          const filteredActions = {};
          for (const action in soundData[unit]) {
            if (action.toLowerCase().includes(query)) {
              filteredActions[action] = soundData[unit][action];
            }
          }
          if (Object.keys(filteredActions).length > 0) {
            filteredData[unit] = filteredActions;
          }
        }
      }
      renderSoundboard(filteredData);
    });
  
    function playRandomSound(unit, action) {
      const unitData = soundData[unit];
      if (!unitData) {
        console.error(`Unit "${unit}" not found in sound data.`);
        return;
      }
      const attributes = unitData[action];
      if (!attributes) {
        console.error(`Action "${action}" not found for unit "${unit}".`);
        return;
      }
      let sounds = attributes["Sounds"];
      if (!Array.isArray(sounds)) {
        console.error(`Sounds attribute is not an array for ${unit} - ${action}`);
        return;
      }
      // Filter out empty strings
      sounds = sounds.filter(sound => sound.trim() !== "");
      if (sounds.length === 0) {
        console.error(`No valid sound files for ${unit} - ${action}`);
        return;
      }
      const randomIndex = Math.floor(Math.random() * sounds.length);
      const soundFile = sounds[randomIndex] + ".wav"; // Append .wav extension
      const audio = new Audio("sounds/" + soundFile);
  
      // Set volume if defined (expects Volume as a percentage)
      if (attributes["Volume"]) {
        const vol = parseFloat(attributes["Volume"]);
        audio.volume = isNaN(vol) ? 1.0 : Math.min(Math.max(vol / 100, 0), 1);
      } else {
        audio.volume = 1.0;
      }
      audio.play().catch(err => console.error("Error playing sound:", err));
    }
  });
  