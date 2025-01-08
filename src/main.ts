// "https://pokeapi.co/api/v2/pokemon-species/?offset=10&limit=1025"

interface PokemonDetails {
  name: string;
  sprites: {
    front_default: string | null;
  };
  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];
  types: {
    type: {
      name: string;
    };
  }[];
  species: {
    url: string;
  };
}

interface EvolutionChain {
  chain: {
    species: {
      name: string;
    };
    evolves_to: EvolutionChain["chain"][];
  };
}

const url = "https://pokeapi.co/api/v2/pokemon/?offset=0&limit=1025";

// Funktion för att hämta evolutionsträdet
const getEvolutionChain = (chain: EvolutionChain["chain"]): string[] => {
  const evolutionNames: string[] = [];
  evolutionNames.push(chain.species.name);

  chain.evolves_to.forEach((evolution) => {
    evolutionNames.push(...getEvolutionChain(evolution));
  });

  return evolutionNames;
};

const getPokemonDetails = async (
  pokemonName: string,
): Promise<{
  name: string;
  image: string;
  stats: { name: string; value: number }[];
  types: string[];
  evolutionChain: string[];
}> => {
  try {
    // Hämta Pokémon-detaljer
    const pokemonResponse = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`,
    );
    if (!pokemonResponse.ok) {
      throw new Error(`HTTP error! status: ${pokemonResponse.status}`);
    }

    const pokemonData: PokemonDetails = await pokemonResponse.json();

    // Hämta species-data
    const speciesResponse = await fetch(pokemonData.species.url);
    if (!speciesResponse.ok) {
      throw new Error(`HTTP error! status: ${speciesResponse.status}`);
    }

    const speciesData = await speciesResponse.json();

    // Hämta evolutionsträdet
    const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
    if (!evolutionChainResponse.ok) {
      throw new Error(`HTTP error! status: ${evolutionChainResponse.status}`);
    }

    const evolutionChainData: EvolutionChain =
      await evolutionChainResponse.json();

    const evolutionChain: string[] = getEvolutionChain(
      evolutionChainData.chain,
    );

    // Returnera Pokémon-detaljer
    return {
      name: pokemonData.name,
      image: pokemonData.sprites.front_default || "default_image_url",
      stats: pokemonData.stats.map((stat) => ({
        name: stat.stat.name,
        value: stat.base_stat,
      })),
      types: pokemonData.types.map((type) => type.type.name),
      evolutionChain,
    };
  } catch (error) {
    console.error("Failed to fetch Pokémon data:", error);
    throw error;
  }
};

const updatePokemonDetails = async (pokemonName: string) => {
  try {
    const pokemon = await getPokemonDetails(pokemonName);

    // Uppdatera DOM med Pokémon-detaljer
    pokemonNameElement.textContent = `You caught ${pokemon.name}!`;
    pokemonImage.src = pokemon.image;
    pokemonImage.alt = pokemon.name;
    pokemonImage.classList.add("show");

    // Visa Pokémon-typer
    pokemonTypes.textContent = `Type(s): ${pokemon.types.join(", ")}`;

    // Visa Pokémon-stats
    pokemonStats.innerHTML = "";
    pokemon.stats.forEach((stat) => {
      const statItem = document.createElement("li");
      statItem.textContent = `${stat.name}: ${stat.value}`;
      pokemonStats.appendChild(statItem);
    });

    // Visa Pokémon-evolutionsträd
    pokemonEvolution.innerHTML = "";
    pokemon.evolutionChain.forEach((evo) => {
      const evoItem = document.createElement("li");
      evoItem.textContent = evo;
      evoItem.classList.add("evolution-item");
      evoItem.addEventListener("click", () => updatePokemonDetails(evo));
      pokemonEvolution.appendChild(evoItem);
    });
  } catch (error) {
    pokemonNameElement.textContent = "Failed to fetch Pokémon details!";
    pokemonStats.innerHTML = "";
    pokemonTypes.textContent = "";
    pokemonEvolution.innerHTML = "";
  }
};

// DOM-element
const pokeball = document.getElementById("pokeball") as HTMLDivElement;
const pokemonNameElement = document.getElementById(
  "pokemon-name",
) as HTMLParagraphElement;
const pokemonImage = document.getElementById(
  "pokemon-image",
) as HTMLImageElement;
const pokemonStats = document.getElementById(
  "pokemon-stats",
) as HTMLUListElement;
const pokemonTypes = document.getElementById(
  "pokemon-types",
) as HTMLParagraphElement;
const pokemonEvolution = document.getElementById(
  "pokemon-evolution",
) as HTMLUListElement;

pokeball.addEventListener("click", async () => {
  // Lägg till animation och glow-effekt
  pokeball.classList.add("opening", "glow");

  try {
    const pokemonListResponse = await fetch(url);
    const pokemonList = await pokemonListResponse.json();

    const randomPokemon =
      pokemonList.results[
        Math.floor(Math.random() * pokemonList.results.length)
      ];

    await updatePokemonDetails(randomPokemon.name);
  } catch (error) {
    pokemonNameElement.textContent = "Failed to catch Pokémon!";
  } finally {
    setTimeout(() => {
      pokeball.classList.remove("opening", "glow");
    }, 600);
  }
});
