import { createClient } from '@supabase/supabase-js';
import { FoodAnalysis } from '../services/gemini';

const supabaseUrl = 'https://fjfmiunnkubthyroujrv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZm1pdW5ua3VidGh5cm91anJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzA0MTYsImV4cCI6MjA4ODQwNjQxNn0.10l5YoFzbiUGmRyWtnnOrajhCTNvWGnhgKGAWf-xR20';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
  return data;
};

export const loginWithGithub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) {
    console.error("Error signing in with GitHub", error);
    throw error;
  }
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const saveAnalysisToHistory = async (userId: string, analysis: FoodAnalysis) => {
  try {
    const { data, error } = await supabase
      .from('history')
      .insert([
        { user_id: userId, result: analysis }
      ])
      .select();

    if (error) throw error;
    return data[0].id.toString();
  } catch (error) {
    console.error("Error saving analysis", error);
    return Date.now().toString();
  }
};

export const getUserHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(doc => ({
      id: doc.id.toString(),
      result: doc.result as FoodAnalysis,
      date: new Date(doc.created_at).toLocaleTimeString()
    }));
  } catch (error) {
    console.error("Error getting history", error);
    return [];
  }
};
