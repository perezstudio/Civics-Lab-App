// app/services/api.server.ts
import { supabase } from './supabase.server';

export class ApiService {
  static async fetchData({ 
    table, 
    query = {} 
  }: { 
    table: string;
    query?: any;
  }) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select()
        .match(query);

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch data' };
    }
  }

  static async createData({ 
    table, 
    data 
  }: { 
    table: string;
    data: any;
  }) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: result };
    } catch (error: any) {
      return { error: error.message || 'Failed to create data' };
    }
  }

  static async updateData({ 
    table, 
    id,
    data 
  }: { 
    table: string;
    id: string;
    data: any;
  }) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: result };
    } catch (error: any) {
      return { error: error.message || 'Failed to update data' };
    }
  }

  static async deleteData({ 
    table, 
    id 
  }: { 
    table: string;
    id: string;
  }) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete data' };
    }
  }
}