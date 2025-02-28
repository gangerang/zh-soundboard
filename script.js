document.addEventListener("DOMContentLoaded", function () {
    const soundboardContainer = document.getElementById("soundboard");
    const searchInput = document.getElementById("searchInput");
    let soundData = {};
  
    // Fetch the JSON data (place your JSON file in the same directory)
    fetch("voices.json")
      .then((response) => response.json())
      .then((data) => {
        soundData = data;
        renderSoundboard(soundData);
      })
      .catch((error) => {
        console.error("Error loading sound data:", error);
      });
  
    function renderSoundboard(data) {
      soundboardContainer.innerHTML = "";
      for (const unit in data) {
        const unitSection = document.createElement("div");
        unitSection.className = "unit";
        const unitTitle = document.createElement("h2");
        unitTitle.textContent = unit;
        unitSection.appendChild(unitTitle);
  
        const actions = data[unit];
        for (const action in actions) {
          const actionDiv = document.createElement("div");
          actionDiv.className = "action";
  
          // Label for action
          const actionLabel = document.createElement("span");
          actionLabel.textContent = action;
          actionDiv.appendChild(actionLabel);
  
          // Play button for action
          const playButton = document.createElement("button");
          playButton.className = "play-button";
          playButton.textContent = "Play Sound";
          playButton.addEventListener("click", function () {
            playRandomSound(unit, action);
          });
          actionDiv.appendChild(playButton);
  
          unitSection.appendChild(actionDiv);
        }
        soundboardContainer.appendChild(unitSection);
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
      // Retrieve the full attribute info from soundData
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
  
      audio.play().catch((err) => console.error("Error playing sound:", err));
    }
  });
  