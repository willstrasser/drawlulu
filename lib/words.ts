export type WordEntry = {
  target: string;
  taboo: string[];
};

export const wordBank: WordEntry[] = [
  { target: "Eiffel Tower", taboo: ["tower", "eiffel", "paris", "france", "metal"] },
  { target: "Pizza", taboo: ["pizza", "cheese", "slice", "italian", "pepperoni"] },
  { target: "Astronaut", taboo: ["astronaut", "space", "nasa", "moon", "suit"] },
  { target: "Snowman", taboo: ["snowman", "snow", "carrot", "winter", "frosty"] },
  { target: "Guitar", taboo: ["guitar", "strings", "music", "instrument", "rock"] },
  { target: "Pirate Ship", taboo: ["pirate", "ship", "ocean", "sail", "treasure"] },
  { target: "Dragon", taboo: ["dragon", "fire", "wings", "medieval", "scales"] },
  { target: "Roller Coaster", taboo: ["roller", "coaster", "ride", "amusement", "theme"] },
  { target: "Lighthouse", taboo: ["lighthouse", "light", "beacon", "shore", "ocean"] },
  { target: "Treehouse", taboo: ["treehouse", "tree", "house", "wood", "climb"] },
  { target: "Volcano", taboo: ["volcano", "lava", "eruption", "magma", "mountain"] },
  { target: "Robot", taboo: ["robot", "machine", "metal", "android", "mechanical"] },
  { target: "Mermaid", taboo: ["mermaid", "fish", "tail", "ocean", "swim"] },
  { target: "Haunted House", taboo: ["haunted", "house", "ghost", "scary", "halloween"] },
  { target: "Hot Air Balloon", taboo: ["balloon", "hot", "air", "fly", "basket"] },
  { target: "Submarine", taboo: ["submarine", "underwater", "ocean", "dive", "vessel"] },
  { target: "Cactus", taboo: ["cactus", "desert", "prickly", "plant", "thorns"] },
  { target: "Penguin", taboo: ["penguin", "ice", "arctic", "bird", "waddle"] },
  { target: "Castle", taboo: ["castle", "king", "queen", "medieval", "tower"] },
  { target: "UFO", taboo: ["ufo", "alien", "flying", "saucer", "space"] },
  { target: "Waterfall", taboo: ["waterfall", "water", "fall", "river", "cascade"] },
  { target: "Dinosaur", taboo: ["dinosaur", "extinct", "jurassic", "fossil", "prehistoric"] },
  { target: "Rainbow", taboo: ["rainbow", "colors", "rain", "arc", "spectrum"] },
  { target: "Sphinx", taboo: ["sphinx", "egypt", "pyramid", "lion", "pharaoh"] },
  { target: "Tornado", taboo: ["tornado", "wind", "storm", "twister", "funnel"] },
  { target: "Igloo", taboo: ["igloo", "ice", "snow", "eskimo", "arctic"] },
  { target: "Samurai", taboo: ["samurai", "sword", "japan", "warrior", "katana"] },
  { target: "Jellyfish", taboo: ["jellyfish", "jelly", "ocean", "sting", "tentacles"] },
  { target: "Bonsai Tree", taboo: ["bonsai", "tree", "small", "japanese", "miniature"] },
  { target: "Aurora Borealis", taboo: ["aurora", "northern", "lights", "sky", "polar"] },
  { target: "Gingerbread House", taboo: ["gingerbread", "house", "candy", "christmas", "cookie"] },
  { target: "Taj Mahal", taboo: ["taj", "mahal", "india", "marble", "tomb"] },
  { target: "Ferris Wheel", taboo: ["ferris", "wheel", "ride", "carnival", "fair"] },
  { target: "Loch Ness Monster", taboo: ["loch", "ness", "monster", "scotland", "lake"] },
  { target: "Sumo Wrestler", taboo: ["sumo", "wrestler", "japan", "fight", "ring"] },
  { target: "Coral Reef", taboo: ["coral", "reef", "ocean", "fish", "underwater"] },
  { target: "Sandcastle", taboo: ["sand", "castle", "beach", "build", "moat"] },
  { target: "Scarecrow", taboo: ["scarecrow", "field", "crow", "farm", "straw"] },
  { target: "Bicycle", taboo: ["bicycle", "bike", "pedal", "wheel", "ride"] },
  { target: "Treasure Chest", taboo: ["treasure", "chest", "gold", "pirate", "jewels"] },
  { target: "Windmill", taboo: ["windmill", "wind", "mill", "dutch", "blades"] },
  { target: "Kangaroo", taboo: ["kangaroo", "australia", "pouch", "hop", "joey"] },
  { target: "Sushi", taboo: ["sushi", "rice", "fish", "japan", "roll"] },
  { target: "Spaceship", taboo: ["spaceship", "space", "rocket", "fly", "alien"] },
  { target: "Witch", taboo: ["witch", "broom", "magic", "hat", "cauldron"] },
  { target: "Palm Tree", taboo: ["palm", "tree", "tropical", "coconut", "beach"] },
  { target: "Compass", taboo: ["compass", "north", "direction", "navigate", "magnetic"] },
  { target: "Flamingo", taboo: ["flamingo", "pink", "bird", "leg", "tropical"] },
  { target: "Tent", taboo: ["tent", "camp", "outdoor", "fabric", "stakes"] },
  { target: "Crown", taboo: ["crown", "king", "queen", "royal", "jewels"] },
  { target: "Octopus", taboo: ["octopus", "tentacles", "eight", "ocean", "ink"] },
  { target: "Skyscraper", taboo: ["skyscraper", "tall", "building", "city", "tower"] },
  { target: "Mona Lisa", taboo: ["mona", "lisa", "painting", "louvre", "davinci"] },
  { target: "Campfire", taboo: ["campfire", "fire", "camp", "marshmallow", "wood"] },
  { target: "Owl", taboo: ["owl", "hoot", "night", "bird", "wise"] },
  { target: "Hamburger", taboo: ["hamburger", "burger", "bun", "beef", "patty"] },
  { target: "Mummy", taboo: ["mummy", "bandage", "egypt", "tomb", "wrap"] },
  { target: "Gondola", taboo: ["gondola", "venice", "boat", "canal", "italy"] },
  { target: "Chameleon", taboo: ["chameleon", "lizard", "color", "change", "camouflage"] },
  { target: "Helicopter", taboo: ["helicopter", "fly", "blade", "rotor", "chopper"] },
];

export function getRandomWords(count: number, exclude: WordEntry[] = []): WordEntry[] {
  const excludeTargets = new Set(exclude.map((e) => e.target));
  const available = wordBank.filter((w) => !excludeTargets.has(w.target));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
