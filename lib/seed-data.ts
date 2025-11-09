import { type Restaurant, generateId } from "./storage"

export const shoreditchRestaurants: Omit<Restaurant, "id">[] = [
  {
    name: "Dishoom Shoreditch",
    link: "https://www.dishoom.com/shoreditch/",
    walkTime: 8,
    priceLevel: 2,
    tags: ["indian", "comfort", "brunch", "trendy"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Pizza East",
    link: "https://pizzaeast.com/",
    walkTime: 5,
    priceLevel: 2,
    tags: ["italian", "pizza", "casual", "quick"],
    dietaryOptions: ["vegetarian", "vegan"],
  },
  {
    name: "Blacklock Shoreditch",
    link: "https://www.theblacklock.com/",
    walkTime: 7,
    priceLevel: 2,
    tags: ["british", "meat", "comfort", "trendy"],
    dietaryOptions: ["gluten-free"],
  },
  {
    name: "Bistro Freddie",
    link: "https://www.bistrofreddie.com/",
    walkTime: 6,
    priceLevel: 3,
    tags: ["french", "bistro", "wine", "upscale"],
    dietaryOptions: ["vegetarian", "gluten-free"],
  },
  {
    name: "Hawksmoor Spitalfields",
    link: "https://thehawksmoor.com/locations/spitalfields/",
    walkTime: 10,
    priceLevel: 3,
    tags: ["british", "steak", "upscale", "special"],
    dietaryOptions: ["gluten-free"],
  },
  {
    name: "Grind Old Street",
    link: "https://grind.co.uk/",
    walkTime: 3,
    priceLevel: 2,
    tags: ["cafe", "brunch", "coffee", "quick", "casual"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Lantana Shoreditch",
    link: "https://www.lantanacafe.co.uk/",
    walkTime: 6,
    priceLevel: 2,
    tags: ["cafe", "healthy", "brunch", "australian"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "BoxPark Shoreditch",
    link: "https://www.boxpark.co.uk/shoreditch/",
    walkTime: 8,
    priceLevel: 2,
    tags: ["food-hall", "variety", "casual", "quick", "trendy"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free", "halal"],
  },
  {
    name: "Cecconi's Shoreditch",
    link: "https://www.cecconis.co.uk/shoreditch/",
    walkTime: 7,
    priceLevel: 3,
    tags: ["italian", "upscale", "venetian", "special"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Sticks'n'Sushi Shoreditch",
    link: "https://sticksnsushi.com/",
    walkTime: 6,
    priceLevel: 3,
    tags: ["japanese", "sushi", "upscale", "healthy"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "The Brush Grand Café",
    link: "https://www.thebrushcafe.com/",
    walkTime: 4,
    priceLevel: 2,
    tags: ["cafe", "british", "casual", "brunch"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Singburi",
    link: "https://www.singburi.co.uk/",
    walkTime: 9,
    priceLevel: 2,
    tags: ["thai", "spicy", "authentic", "casual"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Lagana",
    link: "https://lagana.co.uk/",
    walkTime: 8,
    priceLevel: 2,
    tags: ["greek", "flatbread", "mediterranean", "casual"],
    dietaryOptions: ["vegetarian", "gluten-free"],
  },
  {
    name: "One Club Row",
    link: "https://oneclubrow.com/",
    walkTime: 10,
    priceLevel: 2,
    tags: ["american", "burger", "casual", "comfort"],
    dietaryOptions: ["vegetarian", "gluten-free"],
  },
  {
    name: "EDO IZAKAYA",
    walkTime: 5,
    priceLevel: 2,
    tags: ["japanese", "izakaya", "sushi", "trendy"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Poppies Fish & Chips",
    link: "https://www.poppiesfishandchips.co.uk/",
    walkTime: 7,
    priceLevel: 2,
    tags: ["british", "fish-chips", "comfort", "casual"],
    dietaryOptions: ["gluten-free"],
  },
  {
    name: "Ozone Coffee Roasters",
    link: "https://www.ozonecoffee.co.uk/",
    walkTime: 10,
    priceLevel: 2,
    tags: ["cafe", "brunch", "coffee", "healthy"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Bao Shoreditch",
    link: "https://baolondon.com/",
    walkTime: 8,
    priceLevel: 2,
    tags: ["taiwanese", "bao", "trendy", "small-plates"],
    dietaryOptions: ["vegetarian", "vegan"],
  },
  {
    name: "Berber & Q Shawarma Bar",
    link: "https://www.berberandq.com/",
    walkTime: 9,
    priceLevel: 2,
    tags: ["middle-eastern", "shawarma", "casual", "spicy"],
    dietaryOptions: ["vegetarian", "vegan", "gluten-free", "halal"],
  },
  {
    name: "SAGARDI Basque",
    walkTime: 7,
    priceLevel: 3,
    tags: ["spanish", "basque", "steak", "upscale"],
    dietaryOptions: ["gluten-free"],
  },
]

export function seedShoreditchRestaurants(): Restaurant[] {
  return shoreditchRestaurants.map((r) => ({
    ...r,
    id: generateId(),
  }))
}

// Helper function to infer dietary options from cuisine type
function inferDietaryOptions(cuisine: string): string[] {
  const options: string[] = [];
  const lowerCuisine = cuisine.toLowerCase();
  
  if (lowerCuisine.includes("salad") || lowerCuisine.includes("vegetarian") || lowerCuisine.includes("vegan")) {
    options.push("vegetarian", "vegan");
  }
  if (lowerCuisine.includes("middle eastern") || lowerCuisine.includes("halal")) {
    options.push("halal");
  }
  if (lowerCuisine.includes("korean") || lowerCuisine.includes("vietnamese") || lowerCuisine.includes("ramen")) {
    options.push("gluten-free"); // Many Asian dishes can be gluten-free
  }
  if (lowerCuisine.includes("pizza") || lowerCuisine.includes("pasta") || lowerCuisine.includes("italian")) {
    options.push("vegetarian"); // Usually have vegetarian options
  }
  
  return options;
}

// Helper function to create tags from cuisine
function createTags(cuisine: string, priceLevel: number): string[] {
  const tags: string[] = [];
  const lowerCuisine = cuisine.toLowerCase();
  
  // Add cuisine type
  if (lowerCuisine.includes("vietnamese")) tags.push("vietnamese", "quick");
  else if (lowerCuisine.includes("pizza")) tags.push("pizza", "casual", "quick");
  else if (lowerCuisine.includes("middle eastern")) tags.push("middle-eastern", "casual");
  else if (lowerCuisine.includes("ramen")) tags.push("japanese", "ramen", "comfort");
  else if (lowerCuisine.includes("mexican")) tags.push("mexican", "casual");
  else if (lowerCuisine.includes("sandwich") || lowerCuisine.includes("coffee")) tags.push("cafe", "quick", "casual");
  else if (lowerCuisine.includes("salad")) tags.push("healthy", "quick", "casual");
  else if (lowerCuisine.includes("pasta") || lowerCuisine.includes("italian")) tags.push("italian", "pasta");
  else if (lowerCuisine.includes("korean")) tags.push("korean", "casual", "quick");
  else if (lowerCuisine.includes("brunch")) tags.push("brunch", "casual");
  else if (lowerCuisine.includes("burger")) tags.push("burger", "casual", "comfort");
  else if (lowerCuisine.includes("chicken")) tags.push("chicken", "casual", "quick");
  else tags.push(lowerCuisine.replace(/\s+/g, "-"), "casual");
  
  // Add price-based tags
  if (priceLevel === 1) tags.push("budget", "quick");
  if (priceLevel === 3) tags.push("upscale");
  
  return tags;
}

// Helper function to parse walk time from "Xmin" format
function parseWalkTime(walkTimeStr: string): number {
  const match = walkTimeStr.match(/(\d+)min/);
  return match ? parseInt(match[1], 10) : 5; // Default to 5 if parsing fails
}

// Helper function to parse budget from "$", "$$", "$$$"
function parseBudget(budgetStr: string): number {
  return budgetStr.length; // "$" = 1, "$$" = 2, "$$$" = 3
}

export const newShoreditchRestaurants: Omit<Restaurant, "id">[] = [
  {
    name: "Banh Mi Keu Deli",
    link: "https://maps.app.goo.gl/B87q1XSys1EHjEnH7",
    address: "332 Old St, London EC1V 9DR",
    walkTime: parseWalkTime("1min"),
    priceLevel: parseBudget("$"),
    tags: createTags("Vietnamese", parseBudget("$")),
    dietaryOptions: inferDietaryOptions("Vietnamese"),
  },
  {
    name: "Pizza Pilgrims",
    link: "https://maps.app.goo.gl/qACiiktUXTJFBTcV8",
    address: "136 Shoreditch High St, London E1 6JE",
    walkTime: parseWalkTime("4min"),
    priceLevel: parseBudget("$$"),
    tags: createTags("Pizza", parseBudget("$$")),
    dietaryOptions: inferDietaryOptions("Pizza"),
  },
  {
    name: "City Best Mangal",
    link: "https://maps.app.goo.gl/FGeCbPyniG6FaZdH6",
    address: "10 Pitfield St, London N1 6HA",
    walkTime: parseWalkTime("3min"),
    priceLevel: parseBudget("$$"),
    tags: createTags("Middle Eastern", parseBudget("$$")),
    dietaryOptions: inferDietaryOptions("Middle Eastern"),
  },
  {
    name: "Tonkotsu",
    link: "https://maps.app.goo.gl/hukULpPcmu73u5j5A",
    address: "1 Anning St, London EC2A 3LQ",
    walkTime: parseWalkTime("7min"),
    priceLevel: parseBudget("$$$"),
    tags: createTags("Ramen", parseBudget("$$$")),
    dietaryOptions: inferDietaryOptions("Ramen"),
  },
  {
    name: "Wahaca",
    link: "https://maps.app.goo.gl/19ExnQUGJ9qtAsV18",
    address: "140 Tabernacle St, London EC2A 4SD",
    walkTime: parseWalkTime("4min"),
    priceLevel: parseBudget("$$"),
    tags: createTags("Mexican", parseBudget("$$")),
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Best American Pizza",
    link: "https://maps.app.goo.gl/FJCUzbLKRE9PeHw58",
    address: "16A Pitfield St, London N1 6EY",
    walkTime: parseWalkTime("3min"),
    priceLevel: parseBudget("$"),
    tags: createTags("Pizza", parseBudget("$")),
    dietaryOptions: inferDietaryOptions("Pizza"),
  },
  {
    name: "Origin Coffee",
    link: "https://maps.app.goo.gl/q2hZQ496wRHydnJp9",
    address: "65 Charlotte Rd, London EC2A 3PE",
    walkTime: parseWalkTime("1min"),
    priceLevel: parseBudget("$$"),
    tags: createTags("Sandwich, Coffee", parseBudget("$$")),
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Franco's Takeaway",
    address: "67 Rivington St, London EC2A 3AY",
    walkTime: parseWalkTime("2min"),
    priceLevel: parseBudget("$"),
    tags: createTags("Salad", parseBudget("$")),
    dietaryOptions: inferDietaryOptions("Salad"),
  },
  {
    name: "Via Emilia",
    link: "https://maps.app.goo.gl/WCzLARHnzRXCS23T6",
    address: "37A Hoxton Square, London N1 6NN",
    walkTime: parseWalkTime("2min"),
    priceLevel: parseBudget("$$$"),
    tags: createTags("Pasta", parseBudget("$$$")),
    dietaryOptions: inferDietaryOptions("Pasta"),
  },
  {
    name: "Troy Grocery",
    address: "124 Kingsland Rd, London E2 8DP",
    walkTime: parseWalkTime("8min"),
    priceLevel: parseBudget("$"),
    tags: createTags("Salad", parseBudget("$")),
    dietaryOptions: inferDietaryOptions("Salad"),
  },
  {
    name: "On the Bab",
    link: "https://maps.app.goo.gl/ZnZUKdFY2CTrE2k26",
    address: "305 Old St, London EC1V 9LA",
    walkTime: parseWalkTime("1min"),
    priceLevel: parseBudget("$"),
    tags: createTags("Korea", parseBudget("$")),
    dietaryOptions: inferDietaryOptions("Korea"),
  },
  {
    name: "Shoryu Ramen",
    link: "https://maps.app.goo.gl/jnYedE2t58cfg9hWA",
    address: "45 Great Eastern St, London EC2A 3HP",
    walkTime: parseWalkTime("5min"),
    priceLevel: parseBudget("$$$"),
    tags: createTags("Ramen", parseBudget("$$$")),
    dietaryOptions: inferDietaryOptions("Ramen"),
  },
  {
    name: "Friends of ours",
    link: "https://maps.app.goo.gl/kn2PePujUisUsFv58",
    address: "61 Pitfield St, London N1 6BU",
    walkTime: parseWalkTime("6min"),
    priceLevel: parseBudget("$$$"),
    tags: createTags("Brunch", parseBudget("$$$")),
    dietaryOptions: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    name: "Popolo",
    link: "https://maps.app.goo.gl/HgEnWkoy21DDSixp8",
    address: "26 Rivington St, London EC2A 3DU",
    walkTime: parseWalkTime("2min"),
    priceLevel: parseBudget("$$$"),
    tags: createTags("Italian", parseBudget("$$$")),
    dietaryOptions: inferDietaryOptions("Italian"),
  },
  {
    name: "Butchies",
    link: "https://maps.app.goo.gl/rrbboYBYFczM1KMe6",
    address: "22 Rivington St, London EC2A 3DY",
    walkTime: parseWalkTime("2min"),
    priceLevel: parseBudget("$$"),
    tags: createTags("Burger", parseBudget("$$")),
    dietaryOptions: ["vegetarian", "gluten-free"],
  },
  {
    name: "Wing Kingz",
    link: "https://maps.app.goo.gl/GmRrVWpH9BpiBAgB7",
    address: "134 Shoreditch High St, London E1 6JE",
    walkTime: parseWalkTime("4min"),
    priceLevel: parseBudget("$"),
    tags: createTags("Chicken", parseBudget("$")),
    dietaryOptions: ["gluten-free"],
  },
];

export function seedNewShoreditchRestaurants(): Restaurant[] {
  return newShoreditchRestaurants.map((r) => ({
    ...r,
    id: generateId(),
  }));
}
