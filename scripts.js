// Game state
let gameData = {
    explorations: 0,
    encounters: 0,
    speciesFound: new Set(),
    currentBiome: null
};

let animalData = null;

// Load JSON data
async function loadAnimalData() {
    try {
        const response = await fetch('Organisms.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        animalData = data;
        console.log('Animal data loaded:', animalData);
    } catch (error) {
        console.error('Error loading animal data:', error);
        // Fallback data if file reading fails
        animalData = {
            "Animals": [
                {
                    "name": "Calico Cat",
                    "scientific_name": "Felis catus",
                    "habitat": "Urban",
                    "drops": "Fur",
                    "attack": 40,
                    "defense": 35,
                    "health": 55,
                    "speed": 70,
                    "abilities": "Lucky Pelt",
                    "catagory": "Mammal",
                    "moves": "Scratch, Pounce, Charm, Quick Dash, Night Vision, Playful Swipe",
                    "sprite": "https://i.postimg.cc/kgZHx9N0/calico.png",
                    "rarity": "Common",
                    "description": "A nimble and curious companion, the domestic cat uses its sharp senses to detect threats and hidden resources. Though small, it's agile, stealthy, and fiercely protective when cornered."
                },
                {
                    "name": "Beagle Hound",
                    "scientific_name": "Canis lupus familiaris",
                    "habitat": "Urban",
                    "drops": "Fur",
                    "attack": 45,
                    "defense": 40,
                    "health": 65,
                    "speed": 70,
                    "abilities": "Keen Nose",
                    "catagory": "Mammal",
                    "moves": "Bite, Quick Dash, Howl, Sniff Out, Pounce, Agility Strike",
                    "sprite": "https://i.postimg.cc/brmHLB7f/beagle-hound.png",
                    "rarity": "Uncommon",
                    "description": "A loyal and protective companion, the domestic dog excels at guarding and tracking with its keen senses. Strong and courageous, it thrives in a pack and will defend its allies without hesitation."
                }
            ]
        };
    }
}
// Rarity weights for encounter probability
const rarityWeights = {
    'Common': 50,
    'Uncommon': 80,
    'Rare': 40,
    'Epic': 20,
    'Legendary': 10,
    'Mythical': 1
};

// Rarity colors
const rarityColors = {
    'Common': { bg: '#95a5a6', border: '#7f8c8d' },
    'Uncommon': { bg: '#2ecc71', border: '#27ae60' },
    'Rare': { bg: '#3498db', border: '#2980b9' },
    'Epic': { bg: '#9b59b6', border: '#8e44ad' },
    'Legendary': { bg: '#f1c40f', border: '#f39c12' }
};

// DOM elements
const biomesContainer = document.getElementById('biomes-container');
const encounterSection = document.getElementById('encounter-section');
const currentBiomeEl = document.getElementById('current-biome');
const exploreBtn = document.getElementById('explore-btn');
const backBtn = document.getElementById('back-btn');
const animalEncounter = document.getElementById('animal-encounter');
const noEncounter = document.getElementById('no-encounter');
const logEntries = document.getElementById('log-entries');

// Stats elements
const explorationsEl = document.getElementById('explorations');
const encountersEl = document.getElementById('encounters');
const speciesFoundEl = document.getElementById('species-found');

// Initialize game
async function initGame() {
    await loadAnimalData();
    
    // Add event listeners
    biomesContainer.addEventListener('click', handleBiomeClick);
    exploreBtn.addEventListener('click', exploreCurrentBiome);
    backBtn.addEventListener('click', returnToBiomes);
    
    updateStats();
}

function handleBiomeClick(e) {
    const biomeCard = e.target.closest('.biome-card');
    if (biomeCard) {
        const biome = biomeCard.dataset.biome;
        enterBiome(biome);
    }
}

function enterBiome(biome) {
    gameData.currentBiome = biome;
    currentBiomeEl.textContent = `🌍 ${biome} Exploration`;
    
    biomesContainer.style.display = 'none';
    encounterSection.style.display = 'block';
    
    hideEncounterResult();
    addLogEntry(`🚀 Entered ${biome} biome. Ready to explore!`);
}

function exploreCurrentBiome() {
    if (!gameData.currentBiome || !animalData) return;
    
    gameData.explorations++;
    
    // Get animals from current biome - handle multiple habitats per animal
    const biomeAnimals = animalData.Animals.filter(animal => {
        if (!animal.habitat) return false;
        
        // Split habitat string by comma and check if current biome matches any of them
        const animalHabitats = animal.habitat.split(',').map(h => h.trim().toLowerCase());
        const currentBiome = gameData.currentBiome.toLowerCase();
        
        return animalHabitats.includes(currentBiome);
    });
    
    console.log(`Exploring ${gameData.currentBiome}:`, biomeAnimals.length, 'animals found');
    console.log('Available animals:', biomeAnimals.map(a => `${a.name} (habitats: ${a.habitat})`));
    
    if (biomeAnimals.length === 0) {
        showNoEncounter();
        addLogEntry(`🔍 Searched ${gameData.currentBiome} but found no wildlife this time. (No animals in database for this biome)`);
        updateStats();
        return;
    }
    
    // Weighted random selection based on rarity
    const selectedAnimal = selectAnimalByRarity(biomeAnimals);
    
    if (selectedAnimal) {
        showAnimalEncounter(selectedAnimal);
        gameData.encounters++;
        gameData.speciesFound.add(selectedAnimal.name);
        addLogEntry(`🎉 Found ${selectedAnimal.name} (${selectedAnimal.rarity}) in ${gameData.currentBiome}!`);
    } else {
        showNoEncounter();
        addLogEntry(`🔍 Searched ${gameData.currentBiome} but the animals were too elusive.`);
    }
    
    updateStats();
}

function selectAnimalByRarity(animals) {
    // Create weighted pool
    const pool = [];
    animals.forEach(animal => {
        const weight = rarityWeights[animal.rarity] || 10;
        for (let i = 0; i < weight; i++) {
            pool.push(animal);
        }
    });
    
    // Random selection from pool
    if (pool.length === 0) return null;
    
    // Add some randomness - sometimes no encounter
    if (Math.random() < 0.3) return null; // 30% chance of no encounter
    
    return pool[Math.floor(Math.random() * pool.length)];
}

function showAnimalEncounter(animal) {
    hideEncounterResult();
    
    // Handle sprite loading with smooth transition
    const spriteImg = document.getElementById('animal-sprite');
    spriteImg.style.opacity = '0';
    
    // Create a new image to preload
    const newImg = new Image();
    newImg.onload = function() {
        spriteImg.src = animal.sprite;
        spriteImg.style.opacity = '1';
    };
    newImg.onerror = function() {
        // Fallback if image fails to load
        spriteImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
        spriteImg.style.opacity = '1';
    };
    newImg.src = animal.sprite;
    
    // Set animal data
    document.getElementById('animal-sprite').src = animal.sprite;
    document.getElementById('animal-name').textContent = animal.name;
    document.getElementById('animal-scientific').textContent = animal.scientific_name;
    document.getElementById('animal-description').textContent = animal.description;
    
    // Set rarity badge
    const rarityBadge = document.getElementById('rarity-badge');
    rarityBadge.textContent = animal.rarity;
    const colors = rarityColors[animal.rarity] || rarityColors['Common'];
    rarityBadge.style.background = colors.bg;
    rarityBadge.style.color = '#fff';
    
    // Set border color for encounter box
    animalEncounter.className = `animal-encounter rarity-${animal.rarity.toLowerCase()}`;
    document.getElementById('animal-sprite').style.borderColor = colors.border;
    
    // Set stats with animation
    const maxStat = 100;
    setTimeout(() => {
        document.getElementById('attack-bar').style.width = `${(animal.attack / maxStat) * 100}%`;
        document.getElementById('defense-bar').style.width = `${(animal.defense / maxStat) * 100}%`;
        document.getElementById('health-bar').style.width = `${(animal.health / maxStat) * 100}%`;
        document.getElementById('speed-bar').style.width = `${(animal.speed / maxStat) * 100}%`;
        
        document.getElementById('attack-value').textContent = animal.attack;
        document.getElementById('defense-value').textContent = animal.defense;
        document.getElementById('health-value').textContent = animal.health;
        document.getElementById('speed-value').textContent = animal.speed;
    }, 100);
    
    // Set abilities
    document.getElementById('animal-abilities').textContent = animal.abilities;
    
    // Set moves
    const movesContainer = document.getElementById('animal-moves');
    movesContainer.innerHTML = '';
    if (animal.moves) {
        const moves = animal.moves.split(', ');
        moves.forEach(move => {
            const moveTag = document.createElement('div');
            moveTag.className = 'move-tag';
            moveTag.textContent = move.trim();
            movesContainer.appendChild(moveTag);
        });
    }
    
    animalEncounter.style.display = 'block';
}

function showNoEncounter() {
    hideEncounterResult();
    noEncounter.style.display = 'block';
}

function hideEncounterResult() {
    animalEncounter.style.display = 'none';
    noEncounter.style.display = 'none';
}

function returnToBiomes() {
    gameData.currentBiome = null;
    biomesContainer.style.display = 'grid';
    encounterSection.style.display = 'none';
    addLogEntry(`🏠 Returned to base camp. Ready for next expedition!`);
}

function updateStats() {
    explorationsEl.textContent = gameData.explorations;
    encountersEl.textContent = gameData.encounters;
    speciesFoundEl.textContent = gameData.speciesFound.size;
}

function addLogEntry(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logEntries.appendChild(entry);
    logEntries.scrollTop = logEntries.scrollHeight;
}

// Initialize the game
initGame();