
import React, { useMemo, useState, useEffect } from 'react';
import { Expense, Category, Budget } from '../types';
import { getCategoryColor, DEFAULT_BUDGETS } from '../constants';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => Promise<Expense | null>;
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, budgets, onUpdateExpense }) => {
  const [expandedSections, setExpandedSections] = useState({
    history: true
  });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (editingExpense || showBreakdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingExpense, showBreakdown]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenses, currentMonth, currentYear]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.limit, 0);
  }, [budgets]);

  const currentBalance = useMemo(() => {
    return totalBudget - totalSpent;
  }, [totalBudget, totalSpent]);

  const categoryBreakdown = useMemo(() => {
    return budgets.map(budget => {
      const spent = filteredExpenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = budget.limit - spent;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      
      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percentage
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [budgets, filteredExpenses]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !onUpdateExpense || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const result = await onUpdateExpense(editingExpense.id, {
        amount: editingExpense.amount,
        description: editingExpense.description,
        category: editingExpense.category,
        date: editingExpense.date
      });
      
      if (result) {
        // Success: Closing modal and parent state will update to reflect changes in history
        setEditingExpense(null);
      } else {
        alert("Failed to update expense. Please check your network and try again.");
      }
    } catch (error) {
      console.error("Dashboard handleUpdate error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getSafeDateValue = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  };

  const CardHeader = ({ title, section, isVisible }: { title: string, section: keyof typeof expandedSections, isVisible: boolean }) => (
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h3>
      <button 
        type="button"
        onClick={() => toggleSection(section)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isVisible ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col bg-gray-50/50">
      
      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-black text-gray-900">Update Entry</h3>
              <button 
                type="button"
                disabled={isUpdating}
                onClick={() => setEditingExpense(null)} 
                className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl active:scale-90 transition-all disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-300">₹</span>
                  <input 
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value) || 0})}
                    required
                    autoFocus
                    step="any"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.8rem] pl-12 pr-6 py-6 text-2xl font-black text-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                <input 
                  type="text"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                  required
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.5rem] px-6 py-5 text-base font-bold text-gray-900 outline-none transition-all"
                  placeholder="What was this for?"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value as Category})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-gray-900 outline-none appearance-none transition-all"
                  >
                    {DEFAULT_BUDGETS.map(b => (
                      <option key={b.category} value={b.category}>{b.category}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date"
                    value={getSafeDateValue(editingExpense.date)}
                    onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-gray-900 outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUpdating}
                className="w-full bg-indigo-600 text-white font-black py-6 rounded-[1.8rem] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>SAVING...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>SAVE CHANGES</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-[85vh] sm:h-auto sm:max-h-[80vh] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Budget Insights</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowBreakdown(false)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 active:scale-90 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: getCategoryColor(item.category) }}
                      />
                      <span className="text-base font-black text-gray-800">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">
                        ₹{item.spent.toLocaleString('en-IN')} <span className="text-gray-300 text-xs font-bold">/ ₹{item.limit.toLocaleString('en-IN')}</span>
                      </p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${item.remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {item.remaining < 0 ? `Exceeded by ₹${Math.abs(item.remaining).toLocaleString('en-IN')}` : `₹${item.remaining.toLocaleString('en-IN')} Left`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${item.percentage >= 100 ? 'bg-red-500' : 'bg-indigo-600'}`}
                      style={{ 
                        width: `${Math.min(100, item.percentage)}%`,
                        backgroundColor: item.percentage >= 100 ? '#EF4444' : getCategoryColor(item.category)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Available</p>
                <p className="text-2xl font-black">₹{Math.max(0, currentBalance).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Limit</p>
                <p className="text-2xl font-black opacity-40">₹{totalBudget.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard UI */}
      <div className="flex-1 overflow-y-auto p-6 pb-40 no-scrollbar">
        <div className="flex flex-col gap-6">
          <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden shrink-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    Monthly Expenses
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black">₹{totalSpent.toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${totalSpent > totalBudget ? 'bg-red-400/30' : 'bg-white/20'}`}>
                      {Math.round((totalSpent / (totalBudget || 1)) * 100)}%
                    </span>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setShowBreakdown(true)}
                  className="flex flex-col items-end group active:scale-95 transition-all text-right"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                    Remaining
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span className={`text-2xl font-black mt-1 border-b-2 border-transparent group-hover:border-white/30 transition-all ${currentBalance < 0 ? 'text-red-300' : 'text-white'}`}>
                    ₹{Math.max(0, currentBalance).toLocaleString('en-IN')}
                  </span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                    style={{ width: `${Math.min(100, (totalSpent / (totalBudget || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider opacity-80">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                    {filteredExpenses.length} Logs this month
                  </span>
                  <span>Cap: ₹{totalBudget.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
            <CardHeader title="Transactions" section="history" isVisible={expandedSections.history} />
            {expandedSections.history && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredExpenses.slice().reverse().map(expense => (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between p-4 bg-gray-50/50 rounded-3xl border border-gray-100/50 transition-all group relative hover:bg-white hover:shadow-lg hover:shadow-indigo-50"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}>
                        {expense.category[0]}
                      </div>
                      <div className="min-w-0 pr-4">
                        <p className="font-extrabold text-gray-900 text-sm truncate">{expense.description}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-gray-900 text-base whitespace-nowrap">₹{expense.amount.toLocaleString('en-IN')}</p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingExpense({...expense});
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredExpenses.length === 0 && (
                  <div className="flex flex-col items-center py-12 gap-2">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 font-bold text-sm">No history found for this month.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
