import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

type Card = {
  objective: string;
  category: string;
  taboos: { word: string; relevancyScore: number }[];
};

const cards: Card[] = [
  // ── Food & Drink ────────────────────────────────────────────────────────────
  {
    objective: "Sushi",
    category: "Food & Drink",
    taboos: [
      { word: "Japan", relevancyScore: 10 },
      { word: "raw fish", relevancyScore: 9 },
      { word: "rice", relevancyScore: 8 },
      { word: "seaweed", relevancyScore: 7 },
      { word: "chopsticks", relevancyScore: 6 },
      { word: "restaurant", relevancyScore: 5 },
      { word: "roll", relevancyScore: 4 },
      { word: "wasabi", relevancyScore: 3 },
    ],
  },
  {
    objective: "Pizza",
    category: "Food & Drink",
    taboos: [
      { word: "Italy", relevancyScore: 10 },
      { word: "cheese", relevancyScore: 9 },
      { word: "dough", relevancyScore: 8 },
      { word: "tomato sauce", relevancyScore: 7 },
      { word: "pepperoni", relevancyScore: 6 },
      { word: "oven", relevancyScore: 5 },
      { word: "slice", relevancyScore: 4 },
      { word: "delivery", relevancyScore: 3 },
    ],
  },
  {
    objective: "Avocado Toast",
    category: "Food & Drink",
    taboos: [
      { word: "brunch", relevancyScore: 10 },
      { word: "millennial", relevancyScore: 9 },
      { word: "avocado", relevancyScore: 8 },
      { word: "bread", relevancyScore: 7 },
      { word: "trendy", relevancyScore: 6 },
      { word: "cafe", relevancyScore: 5 },
      { word: "Instagram", relevancyScore: 4 },
      { word: "egg", relevancyScore: 3 },
    ],
  },
  {
    objective: "Espresso",
    category: "Food & Drink",
    taboos: [
      { word: "coffee", relevancyScore: 10 },
      { word: "Italy", relevancyScore: 9 },
      { word: "caffeine", relevancyScore: 8 },
      { word: "shot", relevancyScore: 7 },
      { word: "machine", relevancyScore: 6 },
      { word: "strong", relevancyScore: 5 },
      { word: "morning", relevancyScore: 4 },
      { word: "cup", relevancyScore: 3 },
    ],
  },
  {
    objective: "Ramen",
    category: "Food & Drink",
    taboos: [
      { word: "Japan", relevancyScore: 10 },
      { word: "noodles", relevancyScore: 9 },
      { word: "broth", relevancyScore: 8 },
      { word: "bowl", relevancyScore: 7 },
      { word: "pork", relevancyScore: 6 },
      { word: "egg", relevancyScore: 5 },
      { word: "soup", relevancyScore: 4 },
      { word: "chopsticks", relevancyScore: 3 },
    ],
  },
  {
    objective: "Taco",
    category: "Food & Drink",
    taboos: [
      { word: "Mexico", relevancyScore: 10 },
      { word: "tortilla", relevancyScore: 9 },
      { word: "salsa", relevancyScore: 8 },
      { word: "beef", relevancyScore: 7 },
      { word: "cheese", relevancyScore: 6 },
      { word: "Tuesday", relevancyScore: 5 },
      { word: "guacamole", relevancyScore: 4 },
      { word: "shell", relevancyScore: 3 },
    ],
  },
  {
    objective: "Cheeseburger",
    category: "Food & Drink",
    taboos: [
      { word: "McDonald's", relevancyScore: 10 },
      { word: "beef", relevancyScore: 9 },
      { word: "bun", relevancyScore: 8 },
      { word: "American", relevancyScore: 7 },
      { word: "grill", relevancyScore: 6 },
      { word: "fast food", relevancyScore: 5 },
      { word: "ketchup", relevancyScore: 4 },
      { word: "lettuce", relevancyScore: 3 },
    ],
  },
  {
    objective: "Croissant",
    category: "Food & Drink",
    taboos: [
      { word: "France", relevancyScore: 10 },
      { word: "pastry", relevancyScore: 9 },
      { word: "butter", relevancyScore: 8 },
      { word: "bakery", relevancyScore: 7 },
      { word: "flaky", relevancyScore: 6 },
      { word: "breakfast", relevancyScore: 5 },
      { word: "crescent", relevancyScore: 4 },
      { word: "café", relevancyScore: 3 },
    ],
  },
  {
    objective: "Margarita",
    category: "Food & Drink",
    taboos: [
      { word: "tequila", relevancyScore: 10 },
      { word: "cocktail", relevancyScore: 9 },
      { word: "lime", relevancyScore: 8 },
      { word: "salt rim", relevancyScore: 7 },
      { word: "Mexico", relevancyScore: 6 },
      { word: "drink", relevancyScore: 5 },
      { word: "blended", relevancyScore: 4 },
      { word: "glass", relevancyScore: 3 },
    ],
  },
  {
    objective: "Boba Tea",
    category: "Food & Drink",
    taboos: [
      { word: "Taiwan", relevancyScore: 10 },
      { word: "tapioca", relevancyScore: 9 },
      { word: "pearls", relevancyScore: 8 },
      { word: "milk tea", relevancyScore: 7 },
      { word: "straw", relevancyScore: 6 },
      { word: "trendy", relevancyScore: 5 },
      { word: "Asian", relevancyScore: 4 },
      { word: "drink", relevancyScore: 3 },
    ],
  },

  // ── Tech ────────────────────────────────────────────────────────────────────
  {
    objective: "iPhone",
    category: "Tech",
    taboos: [
      { word: "Apple", relevancyScore: 10 },
      { word: "smartphone", relevancyScore: 9 },
      { word: "Steve Jobs", relevancyScore: 8 },
      { word: "iOS", relevancyScore: 7 },
      { word: "touchscreen", relevancyScore: 6 },
      { word: "app", relevancyScore: 5 },
      { word: "camera", relevancyScore: 4 },
      { word: "silicon", relevancyScore: 3 },
    ],
  },
  {
    objective: "ChatGPT",
    category: "Tech",
    taboos: [
      { word: "AI", relevancyScore: 10 },
      { word: "OpenAI", relevancyScore: 9 },
      { word: "chatbot", relevancyScore: 8 },
      { word: "language model", relevancyScore: 7 },
      { word: "Sam Altman", relevancyScore: 6 },
      { word: "text", relevancyScore: 5 },
      { word: "conversation", relevancyScore: 4 },
      { word: "prompt", relevancyScore: 3 },
    ],
  },
  {
    objective: "TikTok",
    category: "Tech",
    taboos: [
      { word: "video", relevancyScore: 10 },
      { word: "viral", relevancyScore: 9 },
      { word: "China", relevancyScore: 8 },
      { word: "short-form", relevancyScore: 7 },
      { word: "dance", relevancyScore: 6 },
      { word: "ByteDance", relevancyScore: 5 },
      { word: "ban", relevancyScore: 4 },
      { word: "scrolling", relevancyScore: 3 },
    ],
  },
  {
    objective: "Tesla",
    category: "Tech",
    taboos: [
      { word: "electric", relevancyScore: 10 },
      { word: "Elon Musk", relevancyScore: 9 },
      { word: "car", relevancyScore: 8 },
      { word: "autopilot", relevancyScore: 7 },
      { word: "battery", relevancyScore: 6 },
      { word: "charging", relevancyScore: 5 },
      { word: "Model S", relevancyScore: 4 },
      { word: "silicon valley", relevancyScore: 3 },
    ],
  },
  {
    objective: "SpaceX",
    category: "Tech",
    taboos: [
      { word: "rocket", relevancyScore: 10 },
      { word: "Elon Musk", relevancyScore: 9 },
      { word: "Mars", relevancyScore: 8 },
      { word: "Falcon 9", relevancyScore: 7 },
      { word: "NASA", relevancyScore: 6 },
      { word: "launch", relevancyScore: 5 },
      { word: "space", relevancyScore: 4 },
      { word: "Starship", relevancyScore: 3 },
    ],
  },
  {
    objective: "Virtual Reality",
    category: "Tech",
    taboos: [
      { word: "headset", relevancyScore: 10 },
      { word: "Meta", relevancyScore: 9 },
      { word: "immersive", relevancyScore: 8 },
      { word: "gaming", relevancyScore: 7 },
      { word: "simulation", relevancyScore: 6 },
      { word: "goggles", relevancyScore: 5 },
      { word: "3D", relevancyScore: 4 },
      { word: "experience", relevancyScore: 3 },
    ],
  },
  {
    objective: "Bitcoin",
    category: "Tech",
    taboos: [
      { word: "cryptocurrency", relevancyScore: 10 },
      { word: "blockchain", relevancyScore: 9 },
      { word: "Satoshi", relevancyScore: 8 },
      { word: "wallet", relevancyScore: 7 },
      { word: "mining", relevancyScore: 6 },
      { word: "investment", relevancyScore: 5 },
      { word: "digital", relevancyScore: 4 },
      { word: "crash", relevancyScore: 3 },
    ],
  },
  {
    objective: "Airpods",
    category: "Tech",
    taboos: [
      { word: "Apple", relevancyScore: 10 },
      { word: "wireless", relevancyScore: 9 },
      { word: "earbuds", relevancyScore: 8 },
      { word: "Bluetooth", relevancyScore: 7 },
      { word: "music", relevancyScore: 6 },
      { word: "white", relevancyScore: 5 },
      { word: "charging case", relevancyScore: 4 },
      { word: "noise-canceling", relevancyScore: 3 },
    ],
  },

  // ── Movies (recent) ─────────────────────────────────────────────────────────
  {
    objective: "Barbie",
    category: "Movies",
    taboos: [
      { word: "Margot Robbie", relevancyScore: 10 },
      { word: "pink", relevancyScore: 9 },
      { word: "Greta Gerwig", relevancyScore: 8 },
      { word: "Ryan Gosling", relevancyScore: 7 },
      { word: "Mattel", relevancyScore: 6 },
      { word: "doll", relevancyScore: 5 },
      { word: "Kenough", relevancyScore: 4 },
      { word: "2023", relevancyScore: 3 },
    ],
  },
  {
    objective: "Oppenheimer",
    category: "Movies",
    taboos: [
      { word: "atomic bomb", relevancyScore: 10 },
      { word: "Cillian Murphy", relevancyScore: 9 },
      { word: "Christopher Nolan", relevancyScore: 8 },
      { word: "Manhattan Project", relevancyScore: 7 },
      { word: "nuclear", relevancyScore: 6 },
      { word: "World War II", relevancyScore: 5 },
      { word: "physicist", relevancyScore: 4 },
      { word: "2023", relevancyScore: 3 },
    ],
  },
  {
    objective: "Top Gun: Maverick",
    category: "Movies",
    taboos: [
      { word: "Tom Cruise", relevancyScore: 10 },
      { word: "fighter jets", relevancyScore: 9 },
      { word: "Navy", relevancyScore: 8 },
      { word: "sequel", relevancyScore: 7 },
      { word: "aviation", relevancyScore: 6 },
      { word: "Maverick", relevancyScore: 5 },
      { word: "Goose", relevancyScore: 4 },
      { word: "2022", relevancyScore: 3 },
    ],
  },
  {
    objective: "Everything Everywhere All at Once",
    category: "Movies",
    taboos: [
      { word: "multiverse", relevancyScore: 10 },
      { word: "Michelle Yeoh", relevancyScore: 9 },
      { word: "Oscar", relevancyScore: 8 },
      { word: "Daniels", relevancyScore: 7 },
      { word: "laundromat", relevancyScore: 6 },
      { word: "A24", relevancyScore: 5 },
      { word: "hot dog fingers", relevancyScore: 4 },
      { word: "2022", relevancyScore: 3 },
    ],
  },
  {
    objective: "Dune",
    category: "Movies",
    taboos: [
      { word: "spice", relevancyScore: 10 },
      { word: "desert", relevancyScore: 9 },
      { word: "Timothée Chalamet", relevancyScore: 8 },
      { word: "sandworm", relevancyScore: 7 },
      { word: "Denis Villeneuve", relevancyScore: 6 },
      { word: "sci-fi", relevancyScore: 5 },
      { word: "Arrakis", relevancyScore: 4 },
      { word: "Paul Atreides", relevancyScore: 3 },
    ],
  },

  // ── TV Shows (recent) ───────────────────────────────────────────────────────
  {
    objective: "The Bear",
    category: "TV Shows",
    taboos: [
      { word: "restaurant", relevancyScore: 10 },
      { word: "kitchen", relevancyScore: 9 },
      { word: "chef", relevancyScore: 8 },
      { word: "Chicago", relevancyScore: 7 },
      { word: "Carmy", relevancyScore: 6 },
      { word: "Hulu", relevancyScore: 5 },
      { word: "stress", relevancyScore: 4 },
      { word: "Emmy", relevancyScore: 3 },
    ],
  },
  {
    objective: "Succession",
    category: "TV Shows",
    taboos: [
      { word: "Roy family", relevancyScore: 10 },
      { word: "HBO", relevancyScore: 9 },
      { word: "media empire", relevancyScore: 8 },
      { word: "Logan Roy", relevancyScore: 7 },
      { word: "billionaire", relevancyScore: 6 },
      { word: "power", relevancyScore: 5 },
      { word: "satire", relevancyScore: 4 },
      { word: "Waystar", relevancyScore: 3 },
    ],
  },
  {
    objective: "The Last of Us",
    category: "TV Shows",
    taboos: [
      { word: "zombie", relevancyScore: 10 },
      { word: "Pedro Pascal", relevancyScore: 9 },
      { word: "HBO", relevancyScore: 8 },
      { word: "fungus", relevancyScore: 7 },
      { word: "post-apocalyptic", relevancyScore: 6 },
      { word: "video game", relevancyScore: 5 },
      { word: "Joel", relevancyScore: 4 },
      { word: "Ellie", relevancyScore: 3 },
    ],
  },
  {
    objective: "Squid Game",
    category: "TV Shows",
    taboos: [
      { word: "Korea", relevancyScore: 10 },
      { word: "survival", relevancyScore: 9 },
      { word: "Netflix", relevancyScore: 8 },
      { word: "green tracksuit", relevancyScore: 7 },
      { word: "children's games", relevancyScore: 6 },
      { word: "prize money", relevancyScore: 5 },
      { word: "Red Light Green Light", relevancyScore: 4 },
      { word: "doll", relevancyScore: 3 },
    ],
  },
  {
    objective: "House of the Dragon",
    category: "TV Shows",
    taboos: [
      { word: "Game of Thrones", relevancyScore: 10 },
      { word: "dragons", relevancyScore: 9 },
      { word: "HBO", relevancyScore: 8 },
      { word: "Targaryens", relevancyScore: 7 },
      { word: "prequel", relevancyScore: 6 },
      { word: "civil war", relevancyScore: 5 },
      { word: "Westeros", relevancyScore: 4 },
      { word: "fantasy", relevancyScore: 3 },
    ],
  },
  {
    objective: "White Lotus",
    category: "TV Shows",
    taboos: [
      { word: "resort", relevancyScore: 10 },
      { word: "HBO", relevancyScore: 9 },
      { word: "satire", relevancyScore: 8 },
      { word: "wealthy", relevancyScore: 7 },
      { word: "Hawaii", relevancyScore: 6 },
      { word: "murder mystery", relevancyScore: 5 },
      { word: "tourists", relevancyScore: 4 },
      { word: "drama", relevancyScore: 3 },
    ],
  },

  // ── Places ──────────────────────────────────────────────────────────────────
  {
    objective: "Times Square",
    category: "Places",
    taboos: [
      { word: "New York", relevancyScore: 10 },
      { word: "billboard", relevancyScore: 9 },
      { word: "New Year's Eve", relevancyScore: 8 },
      { word: "tourist", relevancyScore: 7 },
      { word: "Broadway", relevancyScore: 6 },
      { word: "neon signs", relevancyScore: 5 },
      { word: "Manhattan", relevancyScore: 4 },
      { word: "crowded", relevancyScore: 3 },
    ],
  },
  {
    objective: "Eiffel Tower",
    category: "Places",
    taboos: [
      { word: "Paris", relevancyScore: 10 },
      { word: "France", relevancyScore: 9 },
      { word: "iron", relevancyScore: 8 },
      { word: "landmark", relevancyScore: 7 },
      { word: "romantic", relevancyScore: 6 },
      { word: "Gustave", relevancyScore: 5 },
      { word: "tourist", relevancyScore: 4 },
      { word: "tall", relevancyScore: 3 },
    ],
  },
  {
    objective: "The Great Wall of China",
    category: "Places",
    taboos: [
      { word: "China", relevancyScore: 10 },
      { word: "ancient", relevancyScore: 9 },
      { word: "wall", relevancyScore: 8 },
      { word: "dynasty", relevancyScore: 7 },
      { word: "long", relevancyScore: 6 },
      { word: "soldiers", relevancyScore: 5 },
      { word: "landmark", relevancyScore: 4 },
      { word: "border", relevancyScore: 3 },
    ],
  },

  // ── Animals ─────────────────────────────────────────────────────────────────
  {
    objective: "Panda",
    category: "Animals",
    taboos: [
      { word: "China", relevancyScore: 10 },
      { word: "black and white", relevancyScore: 9 },
      { word: "bamboo", relevancyScore: 8 },
      { word: "bear", relevancyScore: 7 },
      { word: "endangered", relevancyScore: 6 },
      { word: "WWF", relevancyScore: 5 },
      { word: "cute", relevancyScore: 4 },
      { word: "zoo", relevancyScore: 3 },
    ],
  },
  {
    objective: "Flamingo",
    category: "Animals",
    taboos: [
      { word: "pink", relevancyScore: 10 },
      { word: "bird", relevancyScore: 9 },
      { word: "one leg", relevancyScore: 8 },
      { word: "Florida", relevancyScore: 7 },
      { word: "tropical", relevancyScore: 6 },
      { word: "wading", relevancyScore: 5 },
      { word: "flock", relevancyScore: 4 },
      { word: "beak", relevancyScore: 3 },
    ],
  },
  {
    objective: "Octopus",
    category: "Animals",
    taboos: [
      { word: "tentacles", relevancyScore: 10 },
      { word: "eight", relevancyScore: 9 },
      { word: "ocean", relevancyScore: 8 },
      { word: "ink", relevancyScore: 7 },
      { word: "suction cups", relevancyScore: 6 },
      { word: "camouflage", relevancyScore: 5 },
      { word: "squid", relevancyScore: 4 },
      { word: "arms", relevancyScore: 3 },
    ],
  },
  {
    objective: "Peacock",
    category: "Animals",
    taboos: [
      { word: "feathers", relevancyScore: 10 },
      { word: "tail", relevancyScore: 9 },
      { word: "colorful", relevancyScore: 8 },
      { word: "bird", relevancyScore: 7 },
      { word: "India", relevancyScore: 6 },
      { word: "display", relevancyScore: 5 },
      { word: "fan", relevancyScore: 4 },
      { word: "blue", relevancyScore: 3 },
    ],
  },
  {
    objective: "Sloth",
    category: "Animals",
    taboos: [
      { word: "slow", relevancyScore: 10 },
      { word: "tree", relevancyScore: 9 },
      { word: "hang", relevancyScore: 8 },
      { word: "South America", relevancyScore: 7 },
      { word: "claws", relevancyScore: 6 },
      { word: "rainforest", relevancyScore: 5 },
      { word: "lazy", relevancyScore: 4 },
      { word: "upside down", relevancyScore: 3 },
    ],
  },

  // ── Music ────────────────────────────────────────────────────────────────────
  {
    objective: "The Beatles",
    category: "Music",
    taboos: [
      { word: "Liverpool", relevancyScore: 10 },
      { word: "John Lennon", relevancyScore: 9 },
      { word: "Paul McCartney", relevancyScore: 8 },
      { word: "Abbey Road", relevancyScore: 7 },
      { word: "British Invasion", relevancyScore: 6 },
      { word: "Fab Four", relevancyScore: 5 },
      { word: "rock band", relevancyScore: 4 },
      { word: "1960s", relevancyScore: 3 },
    ],
  },
  {
    objective: "Kendrick Lamar",
    category: "Music",
    taboos: [
      { word: "rapper", relevancyScore: 10 },
      { word: "Compton", relevancyScore: 9 },
      { word: "DAMN.", relevancyScore: 8 },
      { word: "Not Like Us", relevancyScore: 7 },
      { word: "hip-hop", relevancyScore: 6 },
      { word: "Pulitzer Prize", relevancyScore: 5 },
      { word: "halftime show", relevancyScore: 4 },
      { word: "Grammy", relevancyScore: 3 },
    ],
  },
  {
    objective: "Bad Bunny",
    category: "Music",
    taboos: [
      { word: "reggaeton", relevancyScore: 10 },
      { word: "Puerto Rico", relevancyScore: 9 },
      { word: "Latin", relevancyScore: 8 },
      { word: "Spanish", relevancyScore: 7 },
      { word: "Benito", relevancyScore: 6 },
      { word: "trap", relevancyScore: 5 },
      { word: "tour", relevancyScore: 4 },
      { word: "urban", relevancyScore: 3 },
    ],
  },
  {
    objective: "Dua Lipa",
    category: "Music",
    taboos: [
      { word: "Levitating", relevancyScore: 10 },
      { word: "pop star", relevancyScore: 9 },
      { word: "British", relevancyScore: 8 },
      { word: "Future Nostalgia", relevancyScore: 7 },
      { word: "dance-pop", relevancyScore: 6 },
      { word: "model", relevancyScore: 5 },
      { word: "Albanian", relevancyScore: 4 },
      { word: "Grammy", relevancyScore: 3 },
    ],
  },
  {
    objective: "Coldplay",
    category: "Music",
    taboos: [
      { word: "Chris Martin", relevancyScore: 10 },
      { word: "Yellow", relevancyScore: 9 },
      { word: "British", relevancyScore: 8 },
      { word: "Fix You", relevancyScore: 7 },
      { word: "rock band", relevancyScore: 6 },
      { word: "colorful concerts", relevancyScore: 5 },
      { word: "stadium", relevancyScore: 4 },
      { word: "Beyoncé", relevancyScore: 3 },
    ],
  },

  // ── Fashion & Brands ─────────────────────────────────────────────────────────
  {
    objective: "Supreme",
    category: "Fashion & Brands",
    taboos: [
      { word: "red box", relevancyScore: 10 },
      { word: "skateboarding", relevancyScore: 9 },
      { word: "streetwear", relevancyScore: 8 },
      { word: "New York", relevancyScore: 7 },
      { word: "limited edition", relevancyScore: 6 },
      { word: "hype", relevancyScore: 5 },
      { word: "logo", relevancyScore: 4 },
      { word: "resale", relevancyScore: 3 },
    ],
  },
  {
    objective: "Louis Vuitton",
    category: "Fashion & Brands",
    taboos: [
      { word: "luxury", relevancyScore: 10 },
      { word: "France", relevancyScore: 9 },
      { word: "handbag", relevancyScore: 8 },
      { word: "monogram", relevancyScore: 7 },
      { word: "Paris", relevancyScore: 6 },
      { word: "fashion house", relevancyScore: 5 },
      { word: "LV", relevancyScore: 4 },
      { word: "leather", relevancyScore: 3 },
    ],
  },
  {
    objective: "Adidas",
    category: "Fashion & Brands",
    taboos: [
      { word: "three stripes", relevancyScore: 10 },
      { word: "Germany", relevancyScore: 9 },
      { word: "sportswear", relevancyScore: 8 },
      { word: "soccer", relevancyScore: 7 },
      { word: "sneakers", relevancyScore: 6 },
      { word: "Yeezy", relevancyScore: 5 },
      { word: "Originals", relevancyScore: 4 },
      { word: "logo", relevancyScore: 3 },
    ],
  },
  {
    objective: "Gucci",
    category: "Fashion & Brands",
    taboos: [
      { word: "Italy", relevancyScore: 10 },
      { word: "luxury", relevancyScore: 9 },
      { word: "GG logo", relevancyScore: 8 },
      { word: "fashion house", relevancyScore: 7 },
      { word: "Milan", relevancyScore: 6 },
      { word: "designer", relevancyScore: 5 },
      { word: "green red stripe", relevancyScore: 4 },
      { word: "bag", relevancyScore: 3 },
    ],
  },
  {
    objective: "Air Jordans",
    category: "Fashion & Brands",
    taboos: [
      { word: "Nike", relevancyScore: 10 },
      { word: "basketball", relevancyScore: 9 },
      { word: "Michael Jordan", relevancyScore: 8 },
      { word: "sneakers", relevancyScore: 7 },
      { word: "Chicago Bulls", relevancyScore: 6 },
      { word: "Jumpman", relevancyScore: 5 },
      { word: "collectible", relevancyScore: 4 },
      { word: "hype", relevancyScore: 3 },
    ],
  },

  // ── Science & Nature ─────────────────────────────────────────────────────────
  {
    objective: "Black Hole",
    category: "Science & Nature",
    taboos: [
      { word: "space", relevancyScore: 10 },
      { word: "gravity", relevancyScore: 9 },
      { word: "event horizon", relevancyScore: 8 },
      { word: "singularity", relevancyScore: 7 },
      { word: "Einstein", relevancyScore: 6 },
      { word: "galaxy", relevancyScore: 5 },
      { word: "telescope", relevancyScore: 4 },
      { word: "dark", relevancyScore: 3 },
    ],
  },
  {
    objective: "Solar Eclipse",
    category: "Science & Nature",
    taboos: [
      { word: "moon", relevancyScore: 10 },
      { word: "sun", relevancyScore: 9 },
      { word: "shadow", relevancyScore: 8 },
      { word: "totality", relevancyScore: 7 },
      { word: "glasses", relevancyScore: 6 },
      { word: "rare", relevancyScore: 5 },
      { word: "darkness", relevancyScore: 4 },
      { word: "orbit", relevancyScore: 3 },
    ],
  },
  {
    objective: "Aurora Borealis",
    category: "Science & Nature",
    taboos: [
      { word: "Northern Lights", relevancyScore: 10 },
      { word: "sky", relevancyScore: 9 },
      { word: "Norway", relevancyScore: 8 },
      { word: "green", relevancyScore: 7 },
      { word: "Arctic", relevancyScore: 6 },
      { word: "colorful", relevancyScore: 5 },
      { word: "Iceland", relevancyScore: 4 },
      { word: "night", relevancyScore: 3 },
    ],
  },
  {
    objective: "Tsunami",
    category: "Science & Nature",
    taboos: [
      { word: "wave", relevancyScore: 10 },
      { word: "ocean", relevancyScore: 9 },
      { word: "earthquake", relevancyScore: 8 },
      { word: "disaster", relevancyScore: 7 },
      { word: "flooding", relevancyScore: 6 },
      { word: "coastline", relevancyScore: 5 },
      { word: "Japan", relevancyScore: 4 },
      { word: "tall", relevancyScore: 3 },
    ],
  },
  {
    objective: "Volcano",
    category: "Science & Nature",
    taboos: [
      { word: "lava", relevancyScore: 10 },
      { word: "eruption", relevancyScore: 9 },
      { word: "magma", relevancyScore: 8 },
      { word: "mountain", relevancyScore: 7 },
      { word: "Hawaii", relevancyScore: 6 },
      { word: "ash", relevancyScore: 5 },
      { word: "crater", relevancyScore: 4 },
      { word: "hot", relevancyScore: 3 },
    ],
  },

  // ── Mythology & Folklore ─────────────────────────────────────────────────────
  {
    objective: "Unicorn",
    category: "Mythology & Folklore",
    taboos: [
      { word: "horn", relevancyScore: 10 },
      { word: "horse", relevancyScore: 9 },
      { word: "magical", relevancyScore: 8 },
      { word: "rainbow", relevancyScore: 7 },
      { word: "mythical", relevancyScore: 6 },
      { word: "sparkle", relevancyScore: 5 },
      { word: "fantasy", relevancyScore: 4 },
      { word: "glitter", relevancyScore: 3 },
    ],
  },
  {
    objective: "Mermaid",
    category: "Mythology & Folklore",
    taboos: [
      { word: "fish tail", relevancyScore: 10 },
      { word: "ocean", relevancyScore: 9 },
      { word: "swimming", relevancyScore: 8 },
      { word: "half human", relevancyScore: 7 },
      { word: "scales", relevancyScore: 6 },
      { word: "Ariel", relevancyScore: 5 },
      { word: "mythology", relevancyScore: 4 },
      { word: "Little Mermaid", relevancyScore: 3 },
    ],
  },
  {
    objective: "Medusa",
    category: "Mythology & Folklore",
    taboos: [
      { word: "snakes", relevancyScore: 10 },
      { word: "hair", relevancyScore: 9 },
      { word: "Greek mythology", relevancyScore: 8 },
      { word: "stone", relevancyScore: 7 },
      { word: "gorgon", relevancyScore: 6 },
      { word: "Perseus", relevancyScore: 5 },
      { word: "eyes", relevancyScore: 4 },
      { word: "Athena", relevancyScore: 3 },
    ],
  },
  {
    objective: "Thor",
    category: "Mythology & Folklore",
    taboos: [
      { word: "hammer", relevancyScore: 10 },
      { word: "Norse", relevancyScore: 9 },
      { word: "lightning", relevancyScore: 8 },
      { word: "Mjolnir", relevancyScore: 7 },
      { word: "god", relevancyScore: 6 },
      { word: "Viking", relevancyScore: 5 },
      { word: "Asgard", relevancyScore: 4 },
      { word: "Marvel", relevancyScore: 3 },
    ],
  },
  {
    objective: "Bigfoot",
    category: "Mythology & Folklore",
    taboos: [
      { word: "Sasquatch", relevancyScore: 10 },
      { word: "footprint", relevancyScore: 9 },
      { word: "forest", relevancyScore: 8 },
      { word: "hairy", relevancyScore: 7 },
      { word: "cryptid", relevancyScore: 6 },
      { word: "Pacific Northwest", relevancyScore: 5 },
      { word: "blurry photo", relevancyScore: 4 },
      { word: "tall", relevancyScore: 3 },
    ],
  },

  // ── Games & Hobbies ──────────────────────────────────────────────────────────
  {
    objective: "Chess",
    category: "Games & Hobbies",
    taboos: [
      { word: "king", relevancyScore: 10 },
      { word: "queen", relevancyScore: 9 },
      { word: "checkmate", relevancyScore: 8 },
      { word: "board game", relevancyScore: 7 },
      { word: "strategy", relevancyScore: 6 },
      { word: "pawns", relevancyScore: 5 },
      { word: "knight", relevancyScore: 4 },
      { word: "tournament", relevancyScore: 3 },
    ],
  },
  {
    objective: "Monopoly",
    category: "Games & Hobbies",
    taboos: [
      { word: "board game", relevancyScore: 10 },
      { word: "properties", relevancyScore: 9 },
      { word: "jail", relevancyScore: 8 },
      { word: "banker", relevancyScore: 7 },
      { word: "real estate", relevancyScore: 6 },
      { word: "dice", relevancyScore: 5 },
      { word: "Hasbro", relevancyScore: 4 },
      { word: "go", relevancyScore: 3 },
    ],
  },
  {
    objective: "Yoga",
    category: "Games & Hobbies",
    taboos: [
      { word: "meditation", relevancyScore: 10 },
      { word: "pose", relevancyScore: 9 },
      { word: "flexibility", relevancyScore: 8 },
      { word: "India", relevancyScore: 7 },
      { word: "mat", relevancyScore: 6 },
      { word: "wellness", relevancyScore: 5 },
      { word: "stretching", relevancyScore: 4 },
      { word: "namaste", relevancyScore: 3 },
    ],
  },
  {
    objective: "Skateboarding",
    category: "Games & Hobbies",
    taboos: [
      { word: "tricks", relevancyScore: 10 },
      { word: "halfpipe", relevancyScore: 9 },
      { word: "Tony Hawk", relevancyScore: 8 },
      { word: "board", relevancyScore: 7 },
      { word: "ollie", relevancyScore: 6 },
      { word: "ramp", relevancyScore: 5 },
      { word: "skate park", relevancyScore: 4 },
      { word: "wheels", relevancyScore: 3 },
    ],
  },
  {
    objective: "Karaoke",
    category: "Games & Hobbies",
    taboos: [
      { word: "singing", relevancyScore: 10 },
      { word: "microphone", relevancyScore: 9 },
      { word: "Japan", relevancyScore: 8 },
      { word: "bar", relevancyScore: 7 },
      { word: "lyrics", relevancyScore: 6 },
      { word: "screen", relevancyScore: 5 },
      { word: "duet", relevancyScore: 4 },
      { word: "crowd", relevancyScore: 3 },
    ],
  },

  // ── Holidays & Events ────────────────────────────────────────────────────────
  {
    objective: "Halloween",
    category: "Holidays & Events",
    taboos: [
      { word: "trick or treat", relevancyScore: 10 },
      { word: "costumes", relevancyScore: 9 },
      { word: "pumpkin", relevancyScore: 8 },
      { word: "October 31", relevancyScore: 7 },
      { word: "candy", relevancyScore: 6 },
      { word: "haunted", relevancyScore: 5 },
      { word: "witch", relevancyScore: 4 },
      { word: "spooky", relevancyScore: 3 },
    ],
  },
  {
    objective: "Christmas",
    category: "Holidays & Events",
    taboos: [
      { word: "Santa", relevancyScore: 10 },
      { word: "presents", relevancyScore: 9 },
      { word: "December 25", relevancyScore: 8 },
      { word: "tree", relevancyScore: 7 },
      { word: "reindeer", relevancyScore: 6 },
      { word: "holiday", relevancyScore: 5 },
      { word: "snow", relevancyScore: 4 },
      { word: "ornament", relevancyScore: 3 },
    ],
  },
  {
    objective: "Fourth of July",
    category: "Holidays & Events",
    taboos: [
      { word: "fireworks", relevancyScore: 10 },
      { word: "Independence Day", relevancyScore: 9 },
      { word: "America", relevancyScore: 8 },
      { word: "patriotic", relevancyScore: 7 },
      { word: "barbecue", relevancyScore: 6 },
      { word: "flag", relevancyScore: 5 },
      { word: "red white blue", relevancyScore: 4 },
      { word: "July", relevancyScore: 3 },
    ],
  },
  {
    objective: "Mardi Gras",
    category: "Holidays & Events",
    taboos: [
      { word: "New Orleans", relevancyScore: 10 },
      { word: "beads", relevancyScore: 9 },
      { word: "Fat Tuesday", relevancyScore: 8 },
      { word: "parade", relevancyScore: 7 },
      { word: "Louisiana", relevancyScore: 6 },
      { word: "carnival", relevancyScore: 5 },
      { word: "Bourbon Street", relevancyScore: 4 },
      { word: "purple gold green", relevancyScore: 3 },
    ],
  },
  {
    objective: "St. Patrick's Day",
    category: "Holidays & Events",
    taboos: [
      { word: "Ireland", relevancyScore: 10 },
      { word: "green", relevancyScore: 9 },
      { word: "shamrock", relevancyScore: 8 },
      { word: "leprechaun", relevancyScore: 7 },
      { word: "luck", relevancyScore: 6 },
      { word: "March 17", relevancyScore: 5 },
      { word: "beer", relevancyScore: 4 },
      { word: "clover", relevancyScore: 3 },
    ],
  },

  // ── Sports ──────────────────────────────────────────────────────────────────
  {
    objective: "Lionel Messi",
    category: "Sports",
    taboos: [
      { word: "soccer", relevancyScore: 10 },
      { word: "Argentina", relevancyScore: 9 },
      { word: "World Cup", relevancyScore: 8 },
      { word: "Barcelona", relevancyScore: 7 },
      { word: "Inter Miami", relevancyScore: 6 },
      { word: "GOAT", relevancyScore: 5 },
      { word: "Ballon d'Or", relevancyScore: 4 },
      { word: "dribble", relevancyScore: 3 },
    ],
  },
  {
    objective: "LeBron James",
    category: "Sports",
    taboos: [
      { word: "basketball", relevancyScore: 10 },
      { word: "Lakers", relevancyScore: 9 },
      { word: "NBA", relevancyScore: 8 },
      { word: "championship", relevancyScore: 7 },
      { word: "Cleveland", relevancyScore: 6 },
      { word: "King", relevancyScore: 5 },
      { word: "Miami Heat", relevancyScore: 4 },
      { word: "GOAT", relevancyScore: 3 },
    ],
  },
  {
    objective: "Wimbledon",
    category: "Sports",
    taboos: [
      { word: "tennis", relevancyScore: 10 },
      { word: "England", relevancyScore: 9 },
      { word: "grass court", relevancyScore: 8 },
      { word: "Grand Slam", relevancyScore: 7 },
      { word: "strawberries", relevancyScore: 6 },
      { word: "white", relevancyScore: 5 },
      { word: "tournament", relevancyScore: 4 },
      { word: "London", relevancyScore: 3 },
    ],
  },
];

async function main() {
  const existing = await db
    .select({
      objective: schema.wordCards.objective,
      category: schema.wordCards.category,
    })
    .from(schema.wordCards);

  const existingSet = new Set(
    existing.map((r) => `${r.objective}|${r.category}`),
  );

  const toInsert = cards.filter(
    (c) => !existingSet.has(`${c.objective}|${c.category}`),
  );

  if (toInsert.length === 0) {
    console.log(
      `All ${cards.length} cards already exist in the database. Nothing to insert.`,
    );
    return;
  }

  await db.insert(schema.wordCards).values(
    toInsert.map((c) => ({
      objective: c.objective,
      category: c.category,
      taboos: c.taboos,
      source: "system" as const,
    })),
  );

  console.log(
    `Inserted ${toInsert.length} new cards. Skipped ${cards.length - toInsert.length} already existing.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
