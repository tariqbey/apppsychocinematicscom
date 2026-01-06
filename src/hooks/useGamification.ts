import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserCredits {
  id: string;
  user_id: string;
  credits: number;
  lifetime_credits: number;
}

export interface UserAward {
  id: string;
  user_id: string;
  award_type: string;
  award_name: string;
  description: string | null;
  earned_at: string;
}

export interface ScorecardData {
  scorecard_date: string;
  total_score: number;
}

const AWARDS = [
  {
    type: "two_comma_club",
    name: "Two Comma Club Award",
    description: "Maintain a 30-day streak with average score above 9",
    icon: "🏆",
    requirement: { days: 30, avgScore: 9 },
  },
  {
    type: "mogul",
    name: "The Mogul Award",
    description: "Achieve a 90-day streak with 50+ perfect scores",
    icon: "👑",
    requirement: { days: 90, perfectScores: 50 },
  },
  {
    type: "rising_star",
    name: "Rising Star",
    description: "Complete your first 7-day streak",
    icon: "⭐",
    requirement: { days: 7 },
  },
  {
    type: "director_elite",
    name: "Director Elite",
    description: "Earn 10,000 lifetime credits",
    icon: "🎬",
    requirement: { lifetimeCredits: 10000 },
  },
];

export const useGamification = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [awards, setAwards] = useState<UserAward[]>([]);
  const [scorecards, setScorecards] = useState<ScorecardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCredits(null);
      setAwards([]);
      setScorecards([]);
      setLoading(false);
      return;
    }

    const fetchGamificationData = async () => {
      try {
        setLoading(true);

        // Fetch credits
        const { data: creditsData } = await supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (creditsData) {
          setCredits(creditsData);
        }

        // Fetch awards
        const { data: awardsData } = await supabase
          .from("user_awards")
          .select("*")
          .eq("user_id", user.id);

        if (awardsData) {
          setAwards(awardsData);
        }

        // Fetch scorecards for the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data: scorecardsData } = await supabase
          .from("daily_scorecards")
          .select("scorecard_date, total_score")
          .eq("user_id", user.id)
          .gte("scorecard_date", ninetyDaysAgo.toISOString().split("T")[0])
          .order("scorecard_date", { ascending: true });

        if (scorecardsData) {
          setScorecards(scorecardsData as ScorecardData[]);
        }
      } catch (err) {
        console.error("Error fetching gamification data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, [user]);

  const checkAndAwardBadges = async () => {
    if (!user || scorecards.length === 0) return;

    const earnedAwardTypes = awards.map((a) => a.award_type);
    const newAwards: { type: string; name: string; description: string }[] = [];

    // Calculate stats
    const totalDays = scorecards.length;
    const avgScore = scorecards.reduce((sum, s) => sum + (s.total_score || 0), 0) / totalDays;
    const perfectScores = scorecards.filter((s) => s.total_score === 12).length;
    const lifetimeCredits = credits?.lifetime_credits || 0;

    // Check each award
    for (const award of AWARDS) {
      if (earnedAwardTypes.includes(award.type)) continue;

      let earned = false;

      if (award.type === "rising_star" && totalDays >= 7) {
        earned = true;
      } else if (
        award.type === "two_comma_club" &&
        totalDays >= 30 &&
        avgScore >= 9
      ) {
        earned = true;
      } else if (
        award.type === "mogul" &&
        totalDays >= 90 &&
        perfectScores >= 50
      ) {
        earned = true;
      } else if (
        award.type === "director_elite" &&
        lifetimeCredits >= 10000
      ) {
        earned = true;
      }

      if (earned) {
        newAwards.push({
          type: award.type,
          name: award.name,
          description: award.description,
        });
      }
    }

    // Insert new awards
    for (const award of newAwards) {
      const { error } = await supabase.from("user_awards").insert({
        user_id: user.id,
        award_type: award.type,
        award_name: award.name,
        description: award.description,
      });

      if (!error) {
        setAwards((prev) => [
          ...prev,
          {
            id: "",
            user_id: user.id,
            award_type: award.type,
            award_name: award.name,
            description: award.description,
            earned_at: new Date().toISOString(),
          },
        ]);
      }
    }

    return newAwards;
  };

  const refreshData = async () => {
    if (!user) return;

    const { data: creditsData } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditsData) {
      setCredits(creditsData);
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: scorecardsData } = await supabase
      .from("daily_scorecards")
      .select("scorecard_date, total_score")
      .eq("user_id", user.id)
      .gte("scorecard_date", ninetyDaysAgo.toISOString().split("T")[0])
      .order("scorecard_date", { ascending: true });

    if (scorecardsData) {
      setScorecards(scorecardsData as ScorecardData[]);
    }
  };

  return {
    credits,
    awards,
    scorecards,
    loading,
    availableAwards: AWARDS,
    checkAndAwardBadges,
    refreshData,
  };
};
