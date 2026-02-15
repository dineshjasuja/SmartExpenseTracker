
import { AppState, Expense, Budget, Category } from '../types';
import { DEFAULT_BUDGETS } from '../constants';
import { supabase } from './supabase';

export const apiService = {
  /**
   * Fetches the entire application state (expenses and budgets) from Supabase.
   */
  async fetchState(): Promise<AppState> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const defaultState: AppState = {
      expenses: [],
      budgets: DEFAULT_BUDGETS
    };

    if (!user) return defaultState;

    try {
      const { data: dbExpenses, error: expError } = await supabase
        .from('expenses')
        .select('id, amount, category, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (expError) throw expError;

      const { data: dbBudgets } = await supabase
        .from('expense_budgets')
        .select('category, budget_amount')
        .eq('user_id', user.id);

      let finalBudgets = [...DEFAULT_BUDGETS];
      
      if (dbBudgets && dbBudgets.length > 0) {
        finalBudgets = DEFAULT_BUDGETS.map(def => {
          const found = dbBudgets.find(b => b.category === def.category);
          return found ? { category: found.category, limit: parseFloat(found.budget_amount) } : def;
        });
      }

      return {
        expenses: (dbExpenses || []).map(e => ({
          id: e.id.toString(),
          amount: parseFloat(e.amount),
          category: e.category as Category,
          description: e.description,
          date: e.created_at
        })),
        budgets: finalBudgets
      };
    } catch (e) {
      console.error("Database fetch error", e);
      return defaultState;
    }
  },

  /**
   * Saves a new expense to the 'expenses' table.
   */
  async saveExpense(expense: Omit<Expense, 'id' | 'date'>, specificDate?: string): Promise<Expense | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const insertData: any = {
      user_id: user.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
    };

    if (specificDate) {
      insertData.created_at = new Date(specificDate).toISOString();
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([insertData])
      .select('id, amount, category, description, created_at');

    if (error) return null;
    if (!data || data.length === 0) return null;

    const saved = data[0];
    return {
      id: saved.id.toString(),
      amount: parseFloat(saved.amount),
      category: saved.category as Category,
      description: saved.description,
      date: saved.created_at
    };
  },

  /**
   * Updates an existing expense in the 'expenses' table.
   */
  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUpdates: any = {};
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    
    if (updates.date) {
      const dateObj = new Date(updates.date);
      if (!isNaN(dateObj.getTime())) {
        dbUpdates.created_at = dateObj.toISOString();
      }
    }

    const numericId = parseInt(id, 10);
    const filterId = (isNaN(numericId) || id !== numericId.toString()) ? id : numericId;

    const { data, error } = await supabase
      .from('expenses')
      .update(dbUpdates)
      .eq('id', filterId)
      .eq('user_id', user.id)
      .select('id, amount, category, description, created_at');

    if (error) {
      console.error("Supabase update error:", error);
      return null;
    }
    
    if (!data || data.length === 0) {
      if (typeof filterId === 'number') {
        const { data: retryData } = await supabase
          .from('expenses')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select('id, amount, category, description, created_at');
        
        if (retryData && retryData.length > 0) {
          const row = retryData[0];
          return {
            id: row.id.toString(),
            amount: parseFloat(row.amount),
            category: row.category as Category,
            description: row.description,
            date: row.created_at
          };
        }
      }
      return null;
    }

    const updatedRow = data[0];
    return {
      id: updatedRow.id.toString(),
      amount: parseFloat(updatedRow.amount),
      category: updatedRow.category as Category,
      description: updatedRow.description,
      date: updatedRow.created_at
    };
  },

  /**
   * Saves budget limits to the 'expense_budgets' table.
   */
  async saveBudgets(budgets: Budget[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const budgetData = budgets.map(b => ({
      user_id: user.id,
      category: b.category,
      budget_amount: b.limit 
    }));

    const { error } = await supabase
      .from('expense_budgets')
      .upsert(budgetData, { onConflict: 'user_id,category' });
    
    if (error) throw error;
  },

  async deleteBudget(category: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('expense_budgets')
      .delete()
      .eq('user_id', user.id)
      .eq('category', category);
  },

  async clearUserData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('expenses').delete().eq('user_id', user.id);
    await supabase.from('expense_budgets').delete().eq('user_id', user.id);
  }
};
