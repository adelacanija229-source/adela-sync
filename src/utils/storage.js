import { supabase } from './supabaseClient';
import { notices as initialNotices, meetings as initialMeetings } from '../data/mockData';

const getInitialData = (type) => {
  if (type === 'notice') return initialNotices;
  if (type === 'meeting') return initialMeetings;
  return [];
};

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwWZgUQf6iYX8Gebo_UWfEvKABQ7vqQdr-7P0crM43PBAYu5wwtBCKHyb550nIBjP4j/exec';

const syncToGoogleSheets = async (data) => {
  if (!GOOGLE_SHEETS_URL) return;
  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors for simple requests if not handling OPTIONS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Google Sheets sync failed:', error);
  }
};

export const storage = {
  get: async (type) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', type)
      .order('is_pinned', { ascending: false })
      .order('date', { ascending: false });

    // Map snake_case from DB to camelCase for UI
    return (data || []).map(item => ({
      ...item,
      isPinned: item.is_pinned,
      isCompleted: item.is_completed,
      completionNote: item.completion_note
    }));
  },

  save: async (type, item) => {
    const saveItem = {
      category: type,
      title: item.title || item.name,
      content: item.content || JSON.stringify(item),
      author: item.author,
      tag: item.tag,
      date: item.date,
      is_pinned: item.isPinned || false,
      is_completed: item.isCompleted || false,
      completion_note: item.completionNote,
      attachments: item.attachments || [],
      attendees: item.attendees || []
    };

    let result;
    if (item.id) {
      // Update
      const { data, error } = await supabase
        .from('posts')
        .update(saveItem)
        .eq('id', item.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('posts')
        .insert([saveItem])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    // Sync to Google Sheets
    syncToGoogleSheets({
      category: type,
      title: item.title,
      author: item.author,
      date: item.date,
      tag: item.tag,
      content: item.content
    });
    
    return {
      ...result,
      isPinned: result.is_pinned,
      isCompleted: result.is_completed,
      completionNote: result.completion_note
    };
  },

  delete: async (type, id) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
