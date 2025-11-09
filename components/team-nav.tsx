"use client";

import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Utensils, History, Home, Users, Copy, Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";
const CURRENT_TEAM_ID_KEY = "lunchDuel_currentTeamId";

function getUserId(): Id<"users"> | null {
    if (typeof window === "undefined") return null;
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    return userId as Id<"users"> | null;
}

interface TeamNavProps {
    teamCode: string;
    userId: Id<"users"> | null;
    timeRemaining?: string;
    onCopyCode?: () => void;
    copied?: boolean;
    isAdmin?: boolean;
}

export function TeamNav({ teamCode, userId, timeRemaining, onCopyCode, copied, isAdmin }: TeamNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
    const team = useQuery(
        api.teams.getTeamByCode,
        teamCode ? { code: teamCode.toUpperCase() } : "skip"
    );

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(CURRENT_USER_ID_KEY);
            localStorage.removeItem(CURRENT_TEAM_ID_KEY);
            router.push("/join");
        }
    };

    if (!team) return null;

    const navItems = [
        {
            label: "Team",
            href: `/team/${teamCode}`,
            icon: Home,
        },
        {
            label: "Restaurants",
            href: `/team/${teamCode}/restaurants`,
            icon: Utensils,
        },
        {
            label: "History",
            href: `/team/${teamCode}/history`,
            icon: History,
        },
    ];

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{team.name}</span>
                            <Badge variant="outline" className="text-xs">
                                {team.code}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Button
                                        key={item.href}
                                        variant={isActive ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => router.push(item.href)}
                                        className={cn(
                                            "gap-2",
                                            isActive && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button
                                onClick={() => router.push("/admin/session")}
                                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full hover:bg-orange-500/20 transition-colors text-xs"
                                title="Admin Controls"
                            >
                                <Settings className="h-3.5 w-3.5 text-orange-600" />
                                <span className="font-medium text-orange-600 hidden sm:inline">Admin</span>
                            </button>
                        )}
                        {onCopyCode && (
                            <button
                                onClick={onCopyCode}
                                className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full hover:border-primary/50 transition-colors text-xs"
                            >
                                <span className="font-medium text-muted-foreground hidden sm:inline">
                                    Team
                                </span>
                                <span className="font-bold font-mono tracking-wider">
                                    {teamCode.toUpperCase()}
                                </span>
                                {copied ? (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </button>
                        )}
                        {timeRemaining && (
                            <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                                <span className="font-bold text-primary text-sm">
                                    {timeRemaining}
                                </span>
                            </div>
                        )}
                        {user && (
                            <span className="text-sm text-muted-foreground hidden sm:inline">
                                {user.name}
                            </span>
                        )}
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

