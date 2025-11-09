"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getRestaurantImage } from "@/lib/restaurant-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ExternalLink,
    CreditCard,
    Plus,
    Edit,
    Trash2,
    MapPin,
    Utensils,
    User,
    Tag,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
    if (typeof window === "undefined") return null;
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    return userId as Id<"users"> | null;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function RestaurantsPage() {
    const router = useRouter();
    const params = useParams();
    const teamCode = params?.code as string;
    const [userId, setUserId] = useState<Id<"users"> | null>(null);

    // Loyalty card state
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [showCardDialog, setShowCardDialog] = useState(false);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [perks, setPerks] = useState("");
    const [savings, setSavings] = useState("");
    const [notes, setNotes] = useState("");

    // Restaurant CRUD state
    const [showRestaurantDialog, setShowRestaurantDialog] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<NonNullable<typeof team>["restaurants"][number] | null>(null);
    const [restaurantName, setRestaurantName] = useState("");
    const [restaurantLink, setRestaurantLink] = useState("");
    const [restaurantAddress, setRestaurantAddress] = useState("");
    const [walkTime, setWalkTime] = useState("10");
    const [priceLevel, setPriceLevel] = useState(2);
    const [tags, setTags] = useState("");
    const [dietaryOptions, setDietaryOptions] = useState("");

    // Pitch state
    const [showPitchDialog, setShowPitchDialog] = useState(false);
    const [pitchRestaurantId, setPitchRestaurantId] = useState<string | null>(null);
    const [pitchText, setPitchText] = useState("");

    // Discount state
    const [showDiscountDialog, setShowDiscountDialog] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
    const [discountRestaurantId, setDiscountRestaurantId] = useState<string | null>(null);
    const [discountDescription, setDiscountDescription] = useState("");
    const [discountAmount, setDiscountAmount] = useState("");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
    const [discountExpiration, setDiscountExpiration] = useState("");
    const [discountNotes, setDiscountNotes] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUserId(getUserId());
        }
    }, []);

    const team = useQuery(
        api.teams.getTeamByCode,
        teamCode ? { code: teamCode.toUpperCase() } : "skip"
    );
    const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
    const loyaltyCards = useQuery(
        api.loyaltyCards.getLoyaltyCards,
        team?._id ? { teamId: team._id } : "skip"
    );
    const visitCounts = useQuery(
        api.visitHistory.getVisitCounts,
        team?._id ? { teamId: team._id } : "skip"
    );
    const teamPitches = useQuery(
        api.pitches.getTeamPitches,
        team?._id ? { teamId: team._id } : "skip"
    );
    const teamMembers = useQuery(
        api.users.getUsersByIds,
        team?.members ? { userIds: team.members } : "skip"
    );
    const teamDiscounts = useQuery(
        api.discounts.getTeamDiscounts,
        team?._id ? { teamId: team._id } : "skip"
    );

    const upsertLoyaltyCard = useMutation(api.loyaltyCards.upsertLoyaltyCard);
    const deleteLoyaltyCard = useMutation(api.loyaltyCards.deleteLoyaltyCard);
    const addRestaurant = useMutation(api.teams.addRestaurant);
    const updateRestaurant = useMutation(api.teams.updateRestaurant);
    const deleteRestaurant = useMutation(api.teams.deleteRestaurant);
    const upsertPitch = useMutation(api.pitches.upsertPitch);
    const deletePitch = useMutation(api.pitches.deletePitch);
    const createDiscount = useMutation(api.discounts.createDiscount);
    const updateDiscount = useMutation(api.discounts.updateDiscount);
    const deleteDiscount = useMutation(api.discounts.deleteDiscount);
    const seedRestaurantData = useMutation(api.seed.seedRestaurantData);

    // Create maps for quick lookups
    const loyaltyCardMap = new Map(
        loyaltyCards?.map((card) => [card.restaurantId, card]) || []
    );
    const userMap = new Map(teamMembers?.map((u) => [u._id, u]) || []);

    // Group pitches by restaurant
    const pitchesByRestaurant = new Map<string, typeof teamPitches>();
    teamPitches?.forEach((pitch) => {
        if (!pitchesByRestaurant.has(pitch.restaurantId)) {
            pitchesByRestaurant.set(pitch.restaurantId, []);
        }
        const pitches = pitchesByRestaurant.get(pitch.restaurantId)!;
        pitches.push(pitch);
    });

    // Group discounts by restaurant
    const discountsByRestaurant = new Map<string, typeof teamDiscounts>();
    teamDiscounts?.forEach((discount) => {
        if (!discountsByRestaurant.has(discount.restaurantId)) {
            discountsByRestaurant.set(discount.restaurantId, []);
        }
        const discounts = discountsByRestaurant.get(discount.restaurantId)!;
        discounts.push(discount);
    });

    const handleOpenCardDialog = (restaurantId: string, card?: NonNullable<typeof loyaltyCards>[number]) => {
        setSelectedRestaurantId(restaurantId);
        if (card) {
            setEditingCard(card._id);
            setPerks(card.perks);
            setSavings(card.savings?.toString() || "");
            setNotes(card.notes || "");
        } else {
            setEditingCard(null);
            setPerks("");
            setSavings("");
            setNotes("");
        }
        setShowCardDialog(true);
    };

    const handleSaveCard = async () => {
        if (!team?._id || !selectedRestaurantId || !perks.trim()) return;

        try {
            await upsertLoyaltyCard({
                teamId: team._id,
                restaurantId: selectedRestaurantId,
                perks: perks.trim(),
                savings: savings ? parseFloat(savings) : undefined,
                notes: notes.trim() || undefined,
            });
            setShowCardDialog(false);
            setEditingCard(null);
            setPerks("");
            setSavings("");
            setNotes("");
            setSelectedRestaurantId(null);
        } catch (err) {
            console.error("Failed to save loyalty card:", err);
        }
    };

    const handleDeleteCard = async (cardId: Id<"loyaltyCards">) => {
        if (!confirm("Are you sure you want to delete this loyalty card?")) return;
        try {
            await deleteLoyaltyCard({ cardId });
        } catch (err) {
            console.error("Failed to delete loyalty card:", err);
        }
    };

    const handleOpenRestaurantDialog = (restaurant?: NonNullable<typeof team>["restaurants"][number]) => {
        if (restaurant) {
            setEditingRestaurant(restaurant);
            setRestaurantName(restaurant.name);
            setRestaurantLink(restaurant.link || "");
            setRestaurantAddress(restaurant.address || "");
            setWalkTime(restaurant.walkTime.toString());
            setPriceLevel(restaurant.priceLevel);
            setTags(restaurant.tags.join(", "));
            setDietaryOptions(restaurant.dietaryOptions.join(", "));
        } else {
            setEditingRestaurant(null);
            setRestaurantName("");
            setRestaurantLink("");
            setRestaurantAddress("");
            setWalkTime("10");
            setPriceLevel(2);
            setTags("");
            setDietaryOptions("");
        }
        setShowRestaurantDialog(true);
    };

    const handleSaveRestaurant = async () => {
        if (!team?._id || !restaurantName.trim()) return;

        const restaurantData = {
            id: editingRestaurant?.id || generateId(),
            name: restaurantName.trim(),
            link: restaurantLink.trim() || undefined,
            address: restaurantAddress.trim() || undefined,
            walkTime: parseInt(walkTime) || 10,
            priceLevel,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            dietaryOptions: dietaryOptions.split(",").map((d) => d.trim()).filter(Boolean),
        };

        try {
            if (editingRestaurant) {
                await updateRestaurant({
                    teamId: team._id,
                    restaurantId: editingRestaurant.id,
                    restaurant: restaurantData,
                });
            } else {
                await addRestaurant({
                    teamId: team._id,
                    restaurant: restaurantData,
                });
            }
            setShowRestaurantDialog(false);
            setEditingRestaurant(null);
            setRestaurantName("");
            setRestaurantLink("");
            setRestaurantAddress("");
            setWalkTime("10");
            setPriceLevel(2);
            setTags("");
            setDietaryOptions("");
        } catch (err) {
            console.error("Failed to save restaurant:", err);
        }
    };

    const handleDeleteRestaurant = async (restaurantId: string) => {
        if (!team?._id) return;
        if (!confirm("Are you sure you want to delete this restaurant?")) return;
        try {
            await deleteRestaurant({
                teamId: team._id,
                restaurantId,
            });
        } catch (err) {
            console.error("Failed to delete restaurant:", err);
        }
    };

    const handleOpenPitchDialog = async (restaurantId: string) => {
        if (!team?._id || !userId) return;

        setPitchRestaurantId(restaurantId);

        // Get user's existing pitch for this restaurant
        const userPitch = teamPitches?.find(
            (p) => p.restaurantId === restaurantId && p.userId === userId
        );

        setPitchText(userPitch?.pitch || "");
        setShowPitchDialog(true);
    };

    const handleSavePitch = async () => {
        if (!team?._id || !userId || !pitchRestaurantId || !pitchText.trim()) return;

        try {
            await upsertPitch({
                teamId: team._id,
                restaurantId: pitchRestaurantId,
                userId,
                pitch: pitchText.trim(),
            });
            setShowPitchDialog(false);
            setPitchRestaurantId(null);
            setPitchText("");
        } catch (err) {
            console.error("Failed to save pitch:", err);
        }
    };

    const handleDeletePitch = async (pitchId: Id<"pitches">) => {
        if (!confirm("Are you sure you want to delete your pitch?")) return;
        try {
            await deletePitch({ pitchId });
            setShowPitchDialog(false);
            setPitchRestaurantId(null);
            setPitchText("");
        } catch (err) {
            console.error("Failed to delete pitch:", err);
        }
    };

    const handleOpenDiscountDialog = (restaurantId: string, discount?: NonNullable<typeof teamDiscounts>[number]) => {
        if (!team?._id) return;

        setDiscountRestaurantId(restaurantId);

        if (discount) {
            setEditingDiscount(discount._id);
            setDiscountDescription(discount.discount);
            setDiscountAmount(discount.amount?.toString() || "");
            setDiscountType(discount.discountType);
            setDiscountExpiration(discount.expirationDate || "");
            setDiscountNotes(discount.notes || "");
        } else {
            setEditingDiscount(null);
            setDiscountDescription("");
            setDiscountAmount("");
            setDiscountType("percentage");
            setDiscountExpiration("");
            setDiscountNotes("");
        }
        setShowDiscountDialog(true);
    };

    const handleSaveDiscount = async () => {
        if (!team?._id || !discountRestaurantId || !discountDescription.trim()) return;

        try {
            if (editingDiscount) {
                await updateDiscount({
                    discountId: editingDiscount as Id<"discounts">,
                    discount: discountDescription.trim(),
                    amount: discountAmount ? parseFloat(discountAmount) : undefined,
                    discountType: discountType,
                    expirationDate: discountExpiration || undefined,
                    notes: discountNotes.trim() || undefined,
                });
            } else {
                await createDiscount({
                    teamId: team._id,
                    restaurantId: discountRestaurantId,
                    discount: discountDescription.trim(),
                    amount: discountAmount ? parseFloat(discountAmount) : undefined,
                    discountType: discountType,
                    expirationDate: discountExpiration || undefined,
                    notes: discountNotes.trim() || undefined,
                });
            }
            setShowDiscountDialog(false);
            setEditingDiscount(null);
            setDiscountRestaurantId(null);
            setDiscountDescription("");
            setDiscountAmount("");
            setDiscountType("percentage");
            setDiscountExpiration("");
            setDiscountNotes("");
        } catch (err) {
            console.error("Failed to save discount:", err);
        }
    };

    const handleDeleteDiscount = async (discountId: Id<"discounts">) => {
        if (!confirm("Are you sure you want to delete this discount?")) return;
        try {
            await deleteDiscount({ discountId });
        } catch (err) {
            console.error("Failed to delete discount:", err);
        }
    };

    if (!team) return null;

    return (
        <div className="min-h-screen bg-background p-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-serif">Restaurants</h1>
                        <p className="text-muted-foreground mt-1">
                            Curated food list - manage restaurants and loyalty cards
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/team/${teamCode}/history`)}
                        >
                            View History
                        </Button>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                if (!team?._id) return;
                                try {
                                    const result = await seedRestaurantData({ teamId: team._id });
                                    alert(
                                        `Seed complete!\n` +
                                        `- Images updated: ${result.imagesUpdated}\n` +
                                        `- Discounts created: ${result.discountsCreated}\n` +
                                        `- Loyalty cards created: ${result.loyaltyCardsCreated}\n` +
                                        `- Pitches created: ${result.pitchesCreated}`
                                    );
                                } catch (err) {
                                    console.error("Failed to seed data:", err);
                                    alert("Failed to seed data. Check console for details.");
                                }
                            }}
                        >
                            Seed Sample Data
                        </Button>
                        <Button onClick={() => handleOpenRestaurantDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Restaurant
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {team.restaurants.map((restaurant) => {
                        const loyaltyCard = loyaltyCardMap.get(restaurant.id);
                        const visitCount = visitCounts?.[restaurant.id] || 0;
                        const pitches = pitchesByRestaurant.get(restaurant.id) || [];
                        const userPitch = userId ? pitches.find((p) => p.userId === userId) : undefined;
                        const discounts = discountsByRestaurant.get(restaurant.id) || [];

                        return (
                            <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Restaurant Image */}
                                <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10">
                                    <img
                                        src={restaurant.imageUrl || getRestaurantImage(restaurant.name, restaurant.tags)}
                                        alt={restaurant.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to placeholder if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://source.unsplash.com/400x300/?${encodeURIComponent(restaurant.name + " restaurant")}`;
                                        }}
                                    />
                                    {discounts.length > 0 && (
                                        <div className="absolute top-2 right-2">
                                            <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {discounts.length} Deal{discounts.length > 1 ? "s" : ""}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <CardContent className="pt-4 pb-4">
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div>
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold leading-tight">{restaurant.name}</h3>
                                                    {restaurant.address && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                            <MapPin className="h-3 w-3" />
                                                            <span className="line-clamp-1">{restaurant.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {restaurant.link && (
                                                    <a
                                                        href={restaurant.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-foreground ml-2"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {"$".repeat(restaurant.priceLevel)}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">{restaurant.walkTime} min</Badge>
                                                {visitCount > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {visitCount}x
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        {restaurant.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {restaurant.tags.slice(0, 3).map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {restaurant.tags.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{restaurant.tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* B2B Discounts Section */}
                                        {discounts.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t">
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="h-3.5 w-3.5 text-green-600" />
                                                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                                        B2B Deals ({discounts.length})
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {discounts.slice(0, 2).map((discount) => {
                                                        const discountText =
                                                            discount.discountType === "percentage"
                                                                ? discount.amount
                                                                    ? `${discount.amount}% ${discount.discount}`
                                                                    : discount.discount
                                                                : discount.amount
                                                                    ? `£${discount.amount} ${discount.discount}`
                                                                    : discount.discount;
                                                        return (
                                                            <div
                                                                key={discount._id}
                                                                className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded px-2 py-1"
                                                            >
                                                                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                                                                    {discountText}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                    {discounts.length > 2 && (
                                                        <p className="text-xs text-muted-foreground">
                                                            +{discounts.length - 2} more deal{discounts.length - 2 > 1 ? "s" : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Personal Loyalty Card */}
                                        {loyaltyCard && (
                                            <div className="pt-2 border-t">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                                                    <span className="text-xs font-medium">Personal Card</span>
                                                </div>
                                                <div className="bg-primary/5 border border-primary/20 rounded px-2 py-1">
                                                    <p className="text-xs text-foreground">{loyaltyCard.perks}</p>
                                                    {loyaltyCard.savings && (
                                                        <p className="text-xs text-primary mt-0.5">
                                                            Save £{loyaltyCard.savings.toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Pitches Preview */}
                                        {pitches.length > 0 && (
                                            <div className="pt-2 border-t">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Utensils className="h-3.5 w-3.5 text-primary" />
                                                    <span className="text-xs font-medium">
                                                        {pitches.length} Pitch{pitches.length > 1 ? "es" : ""}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {pitches.map((p) => p.pitch).join(", ")}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="pt-2 border-t space-y-2">
                                            {userId && (
                                                <Button
                                                    variant={userPitch ? "outline" : "default"}
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleOpenPitchDialog(restaurant.id)}
                                                >
                                                    <Utensils className="h-4 w-4 mr-2" />
                                                    {userPitch ? "Edit My Pitch" : "Add My Pitch"}
                                                </Button>
                                            )}
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenCardDialog(restaurant.id, loyaltyCard)}
                                                    className="text-xs"
                                                >
                                                    {loyaltyCard ? (
                                                        <>
                                                            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                                            Card
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                                                            Card
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenDiscountDialog(restaurant.id)}
                                                    className="text-xs bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 border-green-200 dark:border-green-800"
                                                >
                                                    {discounts.length > 0 ? (
                                                        <>
                                                            <Tag className="h-3.5 w-3.5 mr-1.5" />
                                                            Deal
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                                                            Deal
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={() => handleOpenRestaurantDialog(restaurant)}
                                                >
                                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {team.restaurants.length === 0 && (
                    <Card>
                        <CardContent className="pt-6 text-center py-12">
                            <p className="text-muted-foreground mb-4">No restaurants yet.</p>
                            <Button onClick={() => handleOpenRestaurantDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Restaurant
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Restaurant Dialog */}
                <Dialog open={showRestaurantDialog} onOpenChange={setShowRestaurantDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRestaurant ? "Edit" : "Add"} Restaurant
                            </DialogTitle>
                            <DialogDescription>
                                {editingRestaurant
                                    ? "Update restaurant details"
                                    : "Add a new restaurant to your curated food list"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="restaurant-name">Restaurant Name *</Label>
                                <Input
                                    id="restaurant-name"
                                    placeholder="e.g., Joe's Pizza"
                                    value={restaurantName}
                                    onChange={(e) => setRestaurantName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="restaurant-link">Link (optional)</Label>
                                <Input
                                    id="restaurant-link"
                                    type="url"
                                    placeholder="https://maps.google.com/..."
                                    value={restaurantLink}
                                    onChange={(e) => setRestaurantLink(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="restaurant-address">Address (optional)</Label>
                                <Input
                                    id="restaurant-address"
                                    placeholder="123 Main St, City"
                                    value={restaurantAddress}
                                    onChange={(e) => setRestaurantAddress(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="walk-time">Walk Time (minutes)</Label>
                                    <Input
                                        id="walk-time"
                                        type="number"
                                        value={walkTime}
                                        onChange={(e) => setWalkTime(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price Level</Label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map((level) => (
                                            <Button
                                                key={level}
                                                type="button"
                                                variant={priceLevel === level ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPriceLevel(level)}
                                            >
                                                {"$".repeat(level)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                <Input
                                    id="tags"
                                    placeholder="italian, pizza, casual"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dietary">
                                    Dietary Options (comma-separated)
                                </Label>
                                <Input
                                    id="dietary"
                                    placeholder="vegetarian, vegan, gluten-free"
                                    value={dietaryOptions}
                                    onChange={(e) => setDietaryOptions(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSaveRestaurant}
                                    className="flex-1"
                                    disabled={!restaurantName.trim()}
                                >
                                    {editingRestaurant ? "Update" : "Add"} Restaurant
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRestaurantDialog(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Pitch Dialog */}
                <Dialog open={showPitchDialog} onOpenChange={setShowPitchDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Your Pitch</DialogTitle>
                            <DialogDescription>
                                {pitchRestaurantId &&
                                    `What would you pitch from ${team.restaurants.find((r) => r.id === pitchRestaurantId)?.name
                                    }?`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pitch">Menu Item / Dish *</Label>
                                <Input
                                    id="pitch"
                                    placeholder="e.g., Their famous Margherita pizza, The spicy ramen bowl"
                                    value={pitchText}
                                    onChange={(e) => setPitchText(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    What item or dish would you recommend from this restaurant?
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSavePitch}
                                    className="flex-1"
                                    disabled={!pitchText.trim()}
                                >
                                    {teamPitches?.find(
                                        (p) => p.restaurantId === pitchRestaurantId && p.userId === userId
                                    )
                                        ? "Update"
                                        : "Save"}{" "}
                                    Pitch
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowPitchDialog(false);
                                        setPitchRestaurantId(null);
                                        setPitchText("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                            {teamPitches?.find(
                                (p) => p.restaurantId === pitchRestaurantId && p.userId === userId
                            ) && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            const userPitch = teamPitches.find(
                                                (p) => p.restaurantId === pitchRestaurantId && p.userId === userId
                                            );
                                            if (userPitch) {
                                                handleDeletePitch(userPitch._id);
                                            }
                                        }}
                                        className="w-full"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Pitch
                                    </Button>
                                )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Loyalty Card Dialog */}
                <Dialog
                    open={showCardDialog}
                    onOpenChange={(open) => {
                        if (!open) {
                            setShowCardDialog(false);
                            setEditingCard(null);
                            setPerks("");
                            setSavings("");
                            setNotes("");
                            setSelectedRestaurantId(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCard ? "Edit" : "Add"} Personal Loyalty Card
                            </DialogTitle>
                            <DialogDescription>
                                {selectedRestaurantId &&
                                    `Add your personal loyalty card perks for ${team.restaurants.find((r) => r.id === selectedRestaurantId)?.name
                                    }. This helps you decide which restaurant to pick.`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="perks">Card Perks *</Label>
                                <Input
                                    id="perks"
                                    placeholder="e.g., 20% off, Buy 1 get 1 free, Free delivery"
                                    value={perks}
                                    onChange={(e) => setPerks(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Personal loyalty card perks that help you decide
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="savings">Estimated Savings (£)</Label>
                                <Input
                                    id="savings"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 5.00"
                                    value={savings}
                                    onChange={(e) => setSavings(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="Additional notes about the card"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSaveCard}
                                    className="flex-1"
                                    disabled={!perks.trim()}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCardDialog(false);
                                        setEditingCard(null);
                                        setPerks("");
                                        setSavings("");
                                        setNotes("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                            {editingCard && (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        handleDeleteCard(editingCard as Id<"loyaltyCards">);
                                        setShowCardDialog(false);
                                    }}
                                    className="w-full"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Card
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Discount Dialog */}
                <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingDiscount ? "Edit" : "Add"} B2B Deal / Discount
                            </DialogTitle>
                            <DialogDescription>
                                {discountRestaurantId &&
                                    `Add a negotiated B2B deal or bulk order discount for ${team.restaurants.find((r) => r.id === discountRestaurantId)?.name
                                    }. These are team-level deals (e.g., bulk orders, corporate discounts).`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="discount-description">Deal Description *</Label>
                                <Input
                                    id="discount-description"
                                    placeholder="e.g., 15% off bulk orders, Corporate discount, Minimum 10 orders"
                                    value={discountDescription}
                                    onChange={(e) => setDiscountDescription(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    B2B negotiated deals or bulk order discounts for the team
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="discount-type">Discount Type</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={discountType === "percentage" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setDiscountType("percentage")}
                                        >
                                            %
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={discountType === "fixed" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setDiscountType("fixed")}
                                        >
                                            £
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount-amount">
                                        Amount {discountType === "percentage" ? "(%)" : "(£)"}
                                    </Label>
                                    <Input
                                        id="discount-amount"
                                        type="number"
                                        step={discountType === "percentage" ? "1" : "0.01"}
                                        placeholder={discountType === "percentage" ? "15" : "5.00"}
                                        value={discountAmount}
                                        onChange={(e) => setDiscountAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount-expiration">Expiration Date (optional)</Label>
                                <Input
                                    id="discount-expiration"
                                    type="date"
                                    value={discountExpiration}
                                    onChange={(e) => setDiscountExpiration(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty if discount doesn't expire
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount-notes">Deal Notes (optional)</Label>
                                <Input
                                    id="discount-notes"
                                    placeholder="e.g., Contact manager for bulk orders, Mention 'Lunch Duel Team'"
                                    value={discountNotes}
                                    onChange={(e) => setDiscountNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSaveDiscount}
                                    className="flex-1"
                                    disabled={!discountDescription.trim()}
                                >
                                    {editingDiscount ? "Update" : "Save"} Discount
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDiscountDialog(false);
                                        setEditingDiscount(null);
                                        setDiscountRestaurantId(null);
                                        setDiscountDescription("");
                                        setDiscountAmount("");
                                        setDiscountType("percentage");
                                        setDiscountExpiration("");
                                        setDiscountNotes("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                            {editingDiscount && (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        handleDeleteDiscount(editingDiscount as Id<"discounts">);
                                        setShowDiscountDialog(false);
                                    }}
                                    className="w-full"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Discount
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
