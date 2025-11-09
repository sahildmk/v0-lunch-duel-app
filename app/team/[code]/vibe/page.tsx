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

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  return userId as Id<"users"> | null;
}

const VIBE_OPTIONS = [
  {
    id: "rush",
    label: "Rush Mode",
    position: { top: "25%", left: "25%" },
    delay: "0s",
  },
  {
    id: "spicy",
    label: "Spicy",
    position: { top: "20%", left: "50%" },
    delay: "1s",
  },
  {
    id: "tryingNew",
    label: "Trying New",
    position: { top: "28%", right: "22%" },
    delay: "2s",
  },
  {
    id: "healthy",
    label: "Healthy",
    position: { top: "50%", left: "20%" },
    delay: "0.5s",
  },
  {
    id: "comfort",
    label: "Comfort Food",
    position: { top: "55%", left: "48%" },
    delay: "1.5s",
  },
  {
    id: "fancy",
    label: "Fancy",
    position: { top: "48%", right: "25%" },
    delay: "2.5s",
  },
];

export default function VibePage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const teamCode = params?.code as string;
  const userId = getUserId();
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [hasSubmittedVibes, setHasSubmittedVibes] = useState(false);
  const isInitialLoad = useRef(true);

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
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>

      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        {user.isAdmin === true && (
          <button
            onClick={() => router.push("/admin/session")}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full hover:bg-orange-500/20 transition-colors shadow-sm"
            title="Admin Controls"
          >
            <Settings className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Admin</span>
          </button>
        )}

        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full hover:border-primary/50 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-muted-foreground">
            Team
          </span>
          <span className="text-lg font-bold font-mono tracking-wider">
            {team.code}
          </span>
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>

        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full shadow-sm">
          <span className="text-lg font-bold text-primary">
            {timeRemaining}
          </span>
        </div>
      </div>

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
  );
}
