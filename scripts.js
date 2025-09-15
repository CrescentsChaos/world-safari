document.addEventListener('DOMContentLoaded', () => {
    const biomeSelect = document.getElementById('biome-select');
    const encounterButton = document.getElementById('encounter-button');
    const animalDisplay = document.getElementById('animal-display');

    let allAnimals = [];
    const rarityWeights = {
        'Common': 0.60,
        'Uncommon': 0.25,
        'Rare': 0.10,
        'Epic': 0.04,
        'Legendary': 0.01
    };

    async function loadData() {
        try {
            const response = await fetch('Organisms.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allAnimals = data.Animals;
            populateBiomes();
        } catch (error) {
            animalDisplay.innerHTML = `<p style="color:red;">Error loading animal data: ${error.message}. Make sure 'Organisms.json' is in the same folder.</p>`;
            console.error('Error loading the JSON file:', error);
        }
    }

    function populateBiomes() {
        const habitats = new Set();
        allAnimals.forEach(animal => {
            animal.habitat.split(',').forEach(habitat => {
                habitats.add(habitat.trim());
            });
        });

        const sortedHabitats = Array.from(habitats).sort();
        sortedHabitats.forEach(habitat => {
            const option = document.createElement('option');
            option.value = habitat;
            option.textContent = habitat;
            biomeSelect.appendChild(option);
        });
    }

    function getRandomAnimalByRarity(animals) {
        let totalWeight = 0;
        const weightedList = [];

        animals.forEach(animal => {
            const weight = rarityWeights[animal.rarity] || 0;
            totalWeight += weight;
            weightedList.push({ animal, weight });
        });

        if (totalWeight === 0) {
            return null;
        }

        let randomNumber = Math.random() * totalWeight;

        for (const item of weightedList) {
            if (randomNumber < item.weight) {
                return item.animal;
            }
            randomNumber -= item.weight;
        }

        // Fallback in case of rounding errors, just pick the last one
        return weightedList.length > 0 ? weightedList[weightedList.length - 1].animal : null;
    }

    function displayAnimal(animal) {
        if (!animal) {
            animalDisplay.innerHTML = '<p class="placeholder-text">No animals found for this biome.</p>';
            return;
        }

        const statsList = `
            <ul class="stats">
                <li>Attack: <span>${animal.attack}</span></li>
                <li>Defense: <span>${animal.defense}</span></li>
                <li>Health: <span>${animal.health}</span></li>
                <li>Speed: <span>${animal.speed}</span></li>
                <li>Drops: <span>${animal.drops}</span></li>
                <li>Moves: <span>${animal.moves}</span></li>
            </ul>
        `;

        animalDisplay.innerHTML = `
            <div class="animal-card">
                <img src="${animal.sprite}" alt="${animal.name}" class="animal-image">
                <div class="animal-details">
                    <h2 class="animal-name">${animal.name}</h2>
                    <div class="rarity ${animal.rarity}">${animal.rarity}</div>
                    <p class="description">${animal.description}</p>
                    ${statsList}
                </div>
            </div>
        `;
    }

    encounterButton.addEventListener('click', () => {
        const selectedBiome = biomeSelect.value;
        if (!selectedBiome) {
            animalDisplay.innerHTML = '<p class="placeholder-text" style="color: #d9534f;">Please select a biome first!</p>';
            return;
        }

        const filteredAnimals = allAnimals.filter(animal =>
            animal.habitat.split(',').map(h => h.trim()).includes(selectedBiome)
        );

        if (filteredAnimals.length > 0) {
            const encounteredAnimal = getRandomAnimalByRarity(filteredAnimals);
            displayAnimal(encounteredAnimal);
        } else {
            animalDisplay.innerHTML = '<p class="placeholder-text">No animals found for this biome.</p>';
        }
    });

    loadData();
});