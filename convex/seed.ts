import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Restaurant image URLs mapping (server-safe version)
const RESTAURANT_IMAGE_URLS: Record<string, string> = {
  "Banh Mi Keu Deli": "https://images.unsplash.com/photo-1552569975-4b1c0c0e0a0e?w=800&h=600&fit=crop&q=80",
  "Dishoom Shoreditch": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=80",
  "Pizza East": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&q=80",
  "Pizza Pilgrims": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&q=80",
  "Tonkotsu": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&q=80",
  "Wahaca": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80",
  "Grind Old Street": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
  "Origin Coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
  "Blacklock Shoreditch": "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop&q=80",
  "Hawksmoor Spitalfields": "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop&q=80",
  "Bistro Freddie": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
  "City Best Mangal": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80",
};

const TAG_IMAGE_MAP: Record<string, string> = {
  "vietnamese": "https://images.unsplash.com/photo-1552569975-4b1c0c0e0a0e?w=800&h=600&fit=crop&q=80",
  "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&q=80",
  "indian": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=80",
  "japanese": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&q=80",
  "ramen": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&q=80",
  "mexican": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80",
  "coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
  "cafe": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=80",
};

function getRestaurantImage(restaurantName: string, tags: string[] = []): string {
  if (RESTAURANT_IMAGE_URLS[restaurantName]) {
    return RESTAURANT_IMAGE_URLS[restaurantName];
  }
  for (const [name, url] of Object.entries(RESTAURANT_IMAGE_URLS)) {
    if (restaurantName.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(restaurantName.toLowerCase())) {
      return url;
    }
  }
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, "-");
    if (TAG_IMAGE_MAP[normalizedTag]) {
      return TAG_IMAGE_MAP[normalizedTag];
    }
  }
  const searchQuery = encodeURIComponent(`${restaurantName} restaurant food`);
  return `https://source.unsplash.com/800x600/?${searchQuery}`;
}

// Seed function to populate restaurants with images, discounts, loyalty cards, and pitches
export const seedRestaurantData = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const results = {
      imagesUpdated: 0,
      discountsCreated: 0,
      loyaltyCardsCreated: 0,
      pitchesCreated: 0,
    };

    // Update restaurants with image URLs
    const updatedRestaurants = team.restaurants.map((restaurant) => {
      if (!restaurant.imageUrl) {
        results.imagesUpdated++;
        return {
          ...restaurant,
          imageUrl: getRestaurantImage(restaurant.name, restaurant.tags),
        };
      }
      return restaurant;
    });

    await ctx.db.patch(args.teamId, {
      restaurants: updatedRestaurants,
    });

    // Create sample discounts (B2B deals) for some restaurants
    const discountData = [
      {
        restaurantName: "Banh Mi Keu Deli",
        discount: "15% off bulk orders",
        amount: 15,
        discountType: "percentage" as const,
        notes: "Minimum 10 orders, mention 'Lunch Duel Team'",
      },
      {
        restaurantName: "Dishoom Shoreditch",
        discount: "Corporate discount",
        amount: 10,
        discountType: "percentage" as const,
        notes: "Valid for groups of 8+",
      },
      {
        restaurantName: "Pizza East",
        discount: "Bulk order discount",
        amount: 12,
        discountType: "percentage" as const,
        expirationDate: "2025-12-31",
        notes: "Contact manager for orders over £100",
      },
      {
        restaurantName: "Tonkotsu",
        discount: "Team lunch special",
        amount: 8,
        discountType: "percentage" as const,
        notes: "Available Mon-Fri for groups of 6+",
      },
    ];

    for (const discount of discountData) {
      const restaurant = team.restaurants.find((r) =>
        r.name.toLowerCase().includes(discount.restaurantName.toLowerCase())
      );
      if (restaurant) {
        // Check if discount already exists
        const existing = await ctx.db
          .query("discounts")
          .withIndex("byTeamAndRestaurant", (q) =>
            q.eq("teamId", args.teamId).eq("restaurantId", restaurant.id)
          )
          .filter((q) => q.eq(q.field("discount"), discount.discount))
          .first();

        if (!existing) {
          await ctx.db.insert("discounts", {
            teamId: args.teamId,
            restaurantId: restaurant.id,
            discount: discount.discount,
            amount: discount.amount,
            discountType: discount.discountType,
            expirationDate: discount.expirationDate,
            notes: discount.notes,
            createdAt: Date.now(),
          });
          results.discountsCreated++;
        }
      }
    }

    // Create sample loyalty cards
    const loyaltyCardData = [
      {
        restaurantName: "Banh Mi Keu Deli",
        perks: "20% off with loyalty card",
        savings: 3.5,
        notes: "Show card at checkout",
      },
      {
        restaurantName: "Pizza East",
        perks: "Buy 5 get 1 free",
        savings: 12.0,
        notes: "Collect stamps on card",
      },
      {
        restaurantName: "Grind Old Street",
        perks: "Free coffee after 10 purchases",
        savings: 4.0,
        notes: "Download their app",
      },
      {
        restaurantName: "Wahaca",
        perks: "10% off all orders",
        savings: 5.0,
        notes: "Sign up for their newsletter",
      },
    ];

    for (const card of loyaltyCardData) {
      const restaurant = team.restaurants.find((r) =>
        r.name.toLowerCase().includes(card.restaurantName.toLowerCase())
      );
      if (restaurant) {
        // Check if loyalty card already exists
        const existing = await ctx.db
          .query("loyaltyCards")
          .withIndex("byTeamAndRestaurant", (q) =>
            q.eq("teamId", args.teamId).eq("restaurantId", restaurant.id)
          )
          .first();

        if (!existing) {
          await ctx.db.insert("loyaltyCards", {
            teamId: args.teamId,
            restaurantId: restaurant.id,
            perks: card.perks,
            savings: card.savings,
            notes: card.notes,
            createdAt: Date.now(),
          });
          results.loyaltyCardsCreated++;
        }
      }
    }

    // Create sample pitches (need at least one user)
    if (team.members.length > 0) {
      const pitchData = [
        {
          restaurantName: "Banh Mi Keu Deli",
          pitch: "Their classic pork banh mi - perfectly crispy baguette with tender pork",
          userId: team.members[0],
        },
        {
          restaurantName: "Dishoom Shoreditch",
          pitch: "The bacon naan roll - legendary breakfast dish",
          userId: team.members[0],
        },
        {
          restaurantName: "Pizza East",
          pitch: "Margherita pizza - simple but perfect",
          userId: team.members[0],
        },
        {
          restaurantName: "Tonkotsu",
          pitch: "Tonkotsu ramen - rich, creamy pork broth",
          userId: team.members[0],
        },
        {
          restaurantName: "Wahaca",
          pitch: "Pork pibil tacos - slow-cooked and delicious",
          userId: team.members[0],
        },
      ];

      // Add pitches from different users if available
      if (team.members.length > 1) {
        pitchData.push(
          {
            restaurantName: "Banh Mi Keu Deli",
            pitch: "Chicken banh mi is also amazing - great value",
            userId: team.members[1],
          },
          {
            restaurantName: "Pizza East",
            pitch: "Try their pepperoni - best in the area",
            userId: team.members[1],
          }
        );
      }

      for (const pitch of pitchData) {
        const restaurant = team.restaurants.find((r) =>
          r.name.toLowerCase().includes(pitch.restaurantName.toLowerCase())
        );
        if (restaurant) {
          // Check if pitch already exists for this user
          const existing = await ctx.db
            .query("pitches")
            .withIndex("byUserAndRestaurant", (q) =>
              q.eq("userId", pitch.userId).eq("restaurantId", restaurant.id)
            )
            .filter((q) => q.eq(q.field("teamId"), args.teamId))
            .first();

          if (!existing) {
            await ctx.db.insert("pitches", {
              teamId: args.teamId,
              restaurantId: restaurant.id,
              userId: pitch.userId,
              pitch: pitch.pitch,
              createdAt: Date.now(),
            });
            results.pitchesCreated++;
          }
        }
      }
    }

    return results;
  },
});

