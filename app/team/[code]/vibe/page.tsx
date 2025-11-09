"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldRedirect } from "@/lib/session-helpers";
import { TeamNav } from "@/components/team-nav";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  return userId as Id<"users"> | null;
}

const VIBE_OPTIONS = [
  // Row 1
  {
    id: "rush",
    label: "Rush Mode",
    position: { top: "8%", left: "15%" },
    delay: "0s",
  },
  {
    id: "spicy",
    label: "Spicy",
    position: { top: "5%", left: "35%" },
    delay: "1s",
  },
  {
    id: "tryingNew",
    label: "Trying New",
    position: { top: "10%", left: "55%" },
    delay: "2s",
  },
  {
    id: "fancy",
    label: "Fancy",
    position: { top: "7%", right: "12%" },
    delay: "1.5s",
  },
  // Row 2
  {
    id: "healthy",
    label: "Healthy",
    position: { top: "25%", left: "12%" },
    delay: "0.5s",
  },
  {
    id: "comfort",
    label: "Comfort Food",
    position: { top: "28%", left: "33%" },
    delay: "2.5s",
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    position: { top: "23%", left: "55%" },
    delay: "1.8s",
  },
  {
    id: "fresh",
    label: "Fresh & Light",
    position: { top: "26%", right: "10%" },
    delay: "0.3s",
  },
  // Row 3
  {
    id: "budget",
    label: "Budget Friendly",
    position: { top: "43%", left: "10%" },
    delay: "0.8s",
  },
  {
    id: "quick",
    label: "Quick Service",
    position: { top: "45%", left: "32%" },
    delay: "2.2s",
  },
  {
    id: "social",
    label: "Social Vibe",
    position: { top: "42%", left: "54%" },
    delay: "1.2s",
  },
  {
    id: "casual",
    label: "Casual",
    position: { top: "46%", right: "8%" },
    delay: "2.8s",
  },
  // Row 4
  {
    id: "adventurous",
    label: "Adventurous",
    position: { top: "60%", left: "14%" },
    delay: "1.4s",
  },
  {
    id: "ethnic",
    label: "Ethnic Cuisine",
    position: { top: "63%", left: "35%" },
    delay: "0.7s",
  },
  {
    id: "indulgent",
    label: "Indulgent",
    position: { top: "58%", left: "56%" },
    delay: "2.1s",
  },
  {
    id: "local",
    label: "Local Spot",
    position: { top: "62%", right: "11%" },
    delay: "1.9s",
  },
  // Row 5
  {
    id: "quiet",
    label: "Quiet Place",
    position: { top: "78%", left: "12%" },
    delay: "0.4s",
  },
  {
    id: "filling",
    label: "Big Portions",
    position: { top: "75%", left: "34%" },
    delay: "2.6s",
  },
  {
    id: "takeaway",
    label: "Takeaway",
    position: { top: "80%", left: "55%" },
    delay: "1.1s",
  },
  {
    id: "trendy",
    label: "Trendy",
    position: { top: "77%", right: "9%" },
    delay: "1.7s",
  },
];

export default function VibePage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const teamCode = params?.code as string;
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [hasSubmittedVibes, setHasSubmittedVibes] = useState(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(getUserId());
    }
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const team = useQuery(
    api.teams.getTeamByCode,
    teamCode ? { code: teamCode.toUpperCase() } : "skip"
  );

  const today = new Date().toISOString().split("T")[0];
  const session = useQuery(
    api.sessions.getSession,
    team?._id ? { teamId: team._id, date: today } : "skip"
  );

  // Get all team members for tooltip display
  const teamMembers = useQuery(
    api.users.getUsersByIds,
    team?.members ? { userIds: team.members } : "skip"
  );

  const createSession = useMutation(api.sessions.createSession);
  const updateSession = useMutation(api.sessions.updateSession);

  // Redirect if no user or show error if team not found
  useEffect(() => {
    if (user === undefined || team === undefined) return;
    if (!user) {
      router.push("/join");
    }
  }, [user, team, router]);

  // Show error if team not found (after loading)
  if (user !== undefined && team === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Team Not Found</h1>
          <p className="text-muted-foreground">
            The team code "{teamCode}" doesn't exist.
          </p>
          <button
            onClick={() => router.push("/join")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  // Create session if it doesn't exist
  useEffect(() => {
    if (!team?._id || session !== undefined) return;

    const now = new Date();
    const vibeDeadline = now.getTime() + 5 * 60 * 1000; // 5 minutes from now
    const voteDeadline = now.getTime() + 10 * 60 * 1000; // 10 minutes from now

    createSession({
      date: today,
      teamId: team._id,
      vibeDeadline,
      voteDeadline,
    }).catch(console.error);
  }, [team?._id, session, createSession, today]);

  // Initialize selected vibes from user preferences
  useEffect(() => {
    if (!user) return;
    const defaultVibes: string[] = [];
    if (user.vibes?.rushMode) defaultVibes.push("rush");
    if (user.vibes?.spicy) defaultVibes.push("spicy");
    if (user.vibes?.tryingNew) defaultVibes.push("tryingNew");
    setSelectedVibes(defaultVibes);
  }, [user]);

  useEffect(() => {
    if (!session) return;

    const updateTimer = () => {
      const now = new Date();
      const deadline = session.vibeDeadline;
      const diff = deadline - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Time's up!");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Check if user has already submitted vibes
  useEffect(() => {
    if (!session || !userId) return;
    const currentSelectedVibes =
      (session.selectedVibes as Record<string, string[]>) || {};
    if (
      currentSelectedVibes[userId] &&
      currentSelectedVibes[userId].length > 0
    ) {
      setHasSubmittedVibes(true);
      setSelectedVibes(currentSelectedVibes[userId]);
    }
    // Mark initial load as complete after first check
    isInitialLoad.current = false;
  }, [session, userId]);

  // Autosave vibes whenever they change (but not on initial load)
  useEffect(() => {
    if (isInitialLoad.current || !session || !userId || !user) return;
    if (selectedVibes.length === 0) return; // Don't save empty selections

    const saveVibes = async () => {
      const currentSelectedVibes =
        (session.selectedVibes as Record<string, string[]>) || {};
      await updateSession({
        sessionId: session._id,
        selectedVibes: {
          ...currentSelectedVibes,
          [userId]: selectedVibes,
        },
      });
      setHasSubmittedVibes(true);
    };

    saveVibes().catch(console.error);
  }, [selectedVibes, session, userId, user, updateSession]);

  // Phase validation - redirect if not on correct phase
  useEffect(() => {
    if (!teamCode || session === undefined) return;

    const redirectPath = shouldRedirect(pathname, session, teamCode);
    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [session, teamCode, pathname, router]);

  const toggleVibe = (vibeId: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibeId)
        ? prev.filter((id) => id !== vibeId)
        : [...prev, vibeId]
    );
  };

  // handleSubmit is no longer needed since we autosave, but keeping for backward compatibility
  // The button will just trigger a manual save if needed
  const handleSubmit = async () => {
    if (!user || !session || !userId || selectedVibes.length === 0) return;

    const currentSelectedVibes =
      (session.selectedVibes as Record<string, string[]>) || {};
    await updateSession({
      sessionId: session._id,
      selectedVibes: {
        ...currentSelectedVibes,
        [userId]: selectedVibes,
      },
    });

    setHasSubmittedVibes(true);
    // Don't navigate - wait for admin to advance phase or time to expire
  };

  const handleCopyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get users who selected each vibe
  const vibeSelections = useMemo(() => {
    if (!session || !teamMembers) return {};

    const selectedVibes =
      (session.selectedVibes as Record<string, string[]>) || {};
    const selections: Record<string, string[]> = {};

    // Initialize all vibes
    VIBE_OPTIONS.forEach((vibe) => {
      selections[vibe.id] = [];
    });

    // Populate selections with user names
    Object.entries(selectedVibes).forEach(([userId, vibes]) => {
      const user = teamMembers.find((u) => u?._id === userId);
      if (user) {
        vibes.forEach((vibeId) => {
          if (selections[vibeId]) {
            selections[vibeId].push(user.name);
          }
        });
      }
    });

    return selections;
  }, [session, teamMembers]);

  if (!user || !team || !session) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Emojis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <style jsx>{`
          @keyframes drift {
            0% {
              transform: translate(0, 0) rotate(0deg);
            }
            50% {
              transform: translate(30px, -40px) rotate(180deg);
            }
            100% {
              transform: translate(0, 0) rotate(360deg);
            }
          }
          @keyframes float-slow {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
            }
            50% {
              transform: translateY(-30px) translateX(20px);
            }
          }
        `}</style>
        <div className="text-6xl absolute top-10 left-20 animate-[drift_20s_ease-in-out_infinite]">🍕</div>
        <div className="text-7xl absolute top-32 right-24 animate-[drift_25s_ease-in-out_infinite_2s]">🍔</div>
        <div className="text-5xl absolute top-48 left-32 animate-[float-slow_15s_ease-in-out_infinite_1s]">🥗</div>
        <div className="text-6xl absolute top-64 right-40 animate-[drift_22s_ease-in-out_infinite_3s]">🍜</div>
        <div className="text-7xl absolute top-80 left-16 animate-[float-slow_18s_ease-in-out_infinite_4s]">🌮</div>
        <div className="text-5xl absolute bottom-32 right-28 animate-[drift_24s_ease-in-out_infinite_1.5s]">🍱</div>
        <div className="text-6xl absolute bottom-48 left-24 animate-[float-slow_20s_ease-in-out_infinite_2.5s]">🍛</div>
        <div className="text-7xl absolute bottom-64 right-16 animate-[drift_19s_ease-in-out_infinite_3.5s]">🥙</div>
        <div className="text-5xl absolute top-40 left-[60%] animate-[float-slow_23s_ease-in-out_infinite]">🍝</div>
        <div className="text-6xl absolute bottom-40 left-[55%] animate-[drift_21s_ease-in-out_infinite_2s]">🍣</div>
        <div className="text-7xl absolute top-56 right-[15%] animate-[float-slow_17s_ease-in-out_infinite_1.8s]">🥘</div>
        <div className="text-5xl absolute bottom-56 right-[30%] animate-[drift_26s_ease-in-out_infinite_2.8s]">🌯</div>
        <div className="text-6xl absolute top-[30%] left-[10%] animate-[float-slow_16s_ease-in-out_infinite_3.2s]">🍲</div>
        <div className="text-7xl absolute bottom-[25%] right-[8%] animate-[drift_27s_ease-in-out_infinite_1.2s]">🥟</div>
        <div className="text-5xl absolute top-[70%] left-[40%] animate-[float-slow_19s_ease-in-out_infinite_2.2s]">🍤</div>
      </div>

      <TeamNav
        teamCode={teamCode}
        userId={userId}
        timeRemaining={timeRemaining}
        onCopyCode={handleCopyCode}
        copied={copied}
        isAdmin={user.isAdmin === true}
      />
      <div className="p-8 relative z-10">
        <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>

        <TooltipProvider delayDuration={200}>
          <div className="relative w-full h-[calc(100vh-200px)] mt-12">
            {VIBE_OPTIONS.map((vibe) => {
              const usersWhoSelected = vibeSelections[vibe.id] || [];
              const hasSelections = usersWhoSelected.length > 0;

              return (
                <Tooltip key={vibe.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleVibe(vibe.id)}
                      style={{
                        ...vibe.position,
                        animation: `float 4s ease-in-out infinite`,
                        animationDelay: vibe.delay,
                      }}
                      className={cn(
                        "absolute px-6 py-3 rounded-full border-2 font-medium transition-all hover:scale-110 active:scale-95",
                        selectedVibes.includes(vibe.id)
                          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                      )}
                    >
                      {vibe.label}
                    </button>
                  </TooltipTrigger>
                  {hasSelections && (
                    <TooltipContent
                      side="top"
                      className="max-w-xs bg-popover border border-border shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">
                            {usersWhoSelected.length}{" "}
                            {usersWhoSelected.length === 1 ? "person" : "people"}{" "}
                            selected
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {usersWhoSelected.map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="text-center">
            {hasSubmittedVibes && selectedVibes.length > 0 ? (
              <div className="px-6 py-3 bg-primary/10 border border-primary/20 rounded-full">
                <p className="text-sm font-medium text-primary">
                  Vibes saved! Waiting for admin to start voting...
                </p>
              </div>
            ) : selectedVibes.length > 0 ? (
              <div className="px-6 py-3 bg-muted/50 border border-border rounded-full">
                <p className="text-sm font-medium text-muted-foreground">
                  Select your vibes (auto-saved)
                </p>
              </div>
            ) : (
              <div className="px-6 py-3 bg-muted/50 border border-border rounded-full">
                <p className="text-sm font-medium text-muted-foreground">
                  Select at least one vibe
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
