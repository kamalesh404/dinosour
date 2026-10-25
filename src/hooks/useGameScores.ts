import { useState, useEffect, useCallback } from 'react';
import { supabase, GameScore } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'dinosour_local_scores';

function getLocalScores(): GameScore[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalScore(scoreItem: GameScore): GameScore[] {
  try {
    const current = getLocalScores();
    const updated = [...current, scoreItem]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [scoreItem];
  }
}

export function useGameScores() {
  const [topScores, setTopScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopScores = useCallback(async () => {
    setLoading(true);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('game_scores')
          .select('*')
          .order('score', { ascending: false })
          .limit(10);

        if (!error && data) {
          setTopScores(data as GameScore[]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local scores:', err);
      }
    }

    // Local fallback
    setTopScores(getLocalScores());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTopScores();
  }, [fetchTopScores]);

  const saveScore = async (playerName: string, score: number, level: number) => {
    const safeName = playerName.trim() || 'Anonymous';
    const localEntry: GameScore = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      player_name: safeName,
      score,
      level,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from('game_scores')
          .insert([{ player_name: safeName, score, level }]);

        if (!error) {
          await fetchTopScores();
          return true;
        }
      } catch (err) {
        console.warn('Supabase insert failed, falling back to local save:', err);
      }
    }

    // Local fallback
    const updated = saveLocalScore(localEntry);
    setTopScores(updated);
    return true;
  };

  return { topScores, loading, saveScore, refreshScores: fetchTopScores };
}
