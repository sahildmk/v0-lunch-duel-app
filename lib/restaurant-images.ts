// Utility to get restaurant image URLs
// Uses Unsplash API for free, high-quality food/restaurant images

// Pre-populated image URLs for common restaurants using Unsplash
// Format: Unsplash image IDs mapped to restaurant names
export const RESTAURANT_IMAGE_URLS: Record<string, string> = {
    // Vietnamese
    "Banh Mi Keu Deli": "https://images.unsplash.com/photo-1552569975-4b1c0c0e0a0e?w=800&h=600&fit=crop&q=80",
    "Pho": "https://images.unsplash.com/photo-1529015079693-2c4c1d0c0a0e?w=800&h=600&fit=crop&q=80",

    // Pizza
    "Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&q=80",
    "Pizza Express": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop&q=80",
    "Pizza Pilgrims": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&q=80",
    "Best American Pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop&q=80",
    "Pizza East": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&q=80",

    // Sushi/Japanese
    "Sushi": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&q=80",
    "Tonkotsu": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&q=80",

    // Burgers
    "Burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop&q=80",

    // Thai
    "Thai": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&q=80",

    // Chinese
    "Chinese": "https://images.unsplash.com/photo-1525755662770-73d50bf0f5e3?w=800&h=600&fit=crop&q=80",

    // Italian
    "Italian": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&q=80",

    // Mexican
    "Mexican": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80",
    "Wahaca": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80",

    // Indian
    "Indian": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=80",
    "Dishoom Shoreditch": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=80",

    // Ramen
    "Ramen": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&q=80",

    // Coffee/Cafe
    "Coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
    "Origin Coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
    "Grind Old Street": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",

    // British/Steak
    "Blacklock Shoreditch": "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop&q=80",
    "Hawksmoor Spitalfields": "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop&q=80",

    // French
    "Bistro Freddie": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",

    // Middle Eastern
    "City Best Mangal": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80",

    // Salad
    "Franco's Takeaway": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=80",
};

// Tag-based image mapping for fallback
const TAG_IMAGE_MAP: Record<string, string> = {
    "vietnamese": "https://images.unsplash.com/photo-1552569975-4b1c0c0e0a0e?w=800&h=600&fit=crop&q=80",
    "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&q=80",
    "italian": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&q=80",
    "japanese": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&q=80",
    "ramen": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&q=80",
    "mexican": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80",
    "indian": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=80",
    "burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop&q=80",
    "coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
    "cafe": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
    "british": "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop&q=80",
    "steak": "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop&q=80",
    "french": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
    "middle-eastern": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80",
    "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=80",
    "healthy": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=80",
};

// Get image URL for a restaurant
export function getRestaurantImage(restaurantName: string, tags: string[] = []): string {
    // Check pre-populated URLs first (exact match)
    if (RESTAURANT_IMAGE_URLS[restaurantName]) {
        return RESTAURANT_IMAGE_URLS[restaurantName];
    }

    // Try partial name matching
    for (const [name, url] of Object.entries(RESTAURANT_IMAGE_URLS)) {
        if (restaurantName.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(restaurantName.toLowerCase())) {
            return url;
        }
    }

    // Try to match by tag
    for (const tag of tags) {
        const normalizedTag = tag.toLowerCase().replace(/\s+/g, "-");
        if (TAG_IMAGE_MAP[normalizedTag]) {
            return TAG_IMAGE_MAP[normalizedTag];
        }
    }

    // Fallback to Unsplash search based on restaurant name
    const searchQuery = encodeURIComponent(`${restaurantName} restaurant food`);
    return `https://source.unsplash.com/800x600/?${searchQuery}`;
}


