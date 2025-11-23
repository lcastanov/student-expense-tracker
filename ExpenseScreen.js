import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export default function ExpenseScreen() {
  const db = useSQLiteContext();

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  const loadExpenses = async () => {
    const rows = await db.getAllAsync(
      'SELECT * FROM expenses ORDER BY date DESC;'
    );
    setExpenses(rows);
  };

  const getFilteredExpenses = () => {
    const today = new Date();
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      
      if (dateFilter === 'all') return true;
      
      if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return expenseDate >= weekAgo;
      }
      
      if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return expenseDate >= monthAgo;
      }
      
      return true;
    });
  };

    const addExpense = async () => {
    try {
      const amountNumber = parseFloat(amount);

      if (isNaN(amountNumber) || amountNumber <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      const trimmedCategory = category.trim();
      const trimmedNote = note.trim();

      if (!trimmedCategory) {
        alert('Please enter a category');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      console.log('Adding expense:', { amountNumber, trimmedCategory, trimmedNote, today });

      await db.runAsync(
        'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?);',
        [amountNumber, trimmedCategory, trimmedNote || null, today]
      );

      console.log('Expense added successfully');

      setAmount('');
      setCategory('');
      setNote('');

      await loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error: ' + error.message);
    }
  };

  const deleteExpense = async (id) => {
    await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
    loadExpenses();
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseAmount}>${Number(item.amount).toFixed(2)}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseDate}>{item.date}</Text>
        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
      </View>

      <TouchableOpacity onPress={() => deleteExpense(item.id)}>
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </View>
  );

    useEffect(() => {
    async function setup() {
      try {
        await db.execAsync('DROP TABLE IF EXISTS expenses;');
        
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            note TEXT,
            date TEXT NOT NULL
          );
        `);

        await loadExpenses();
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    }

    setup();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>STUDENT EXPENSE TRACKER</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 12.50)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (Food, Books, Rent...)"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.addButton} onPress={addExpense}>
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, dateFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setDateFilter('all')}
        >
          <Text style={styles.filterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, dateFilter === 'week' && styles.filterButtonActive]}
          onPress={() => setDateFilter('week')}
        >
          <Text style={styles.filterText}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, dateFilter === 'month' && styles.filterButtonActive]}
          onPress={() => setDateFilter('month')}
        >
          <Text style={styles.filterText}>This Month</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getFilteredExpenses()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet.</Text>
        }
      />

      <Text style={styles.footer}>
        Enter your expenses and they'll be saved locally with SQLite.
      </Text>
    </SafeAreaView>
  );
}

// Styling
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#f9fafb' 
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#826bdfff',
    marginBottom: 20,
    marginTop: 40,
    marginHorizontal: 20,
    letterSpacing: -0.5,
  },
  form: {
    marginBottom: 40,
    marginHorizontal: 20,
    gap: 10,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginHorizontal: 10,
    backgroundColor: '#fab4e3ff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#e756b7ff',
    borderColor: '#e756b7ff',
  },
  filterText: {
    textAlign: 'center',
    color: '#ffffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7bda45ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#826bdfff',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  expenseNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  delete: {
    color: '#ef4444',
    fontSize: 22,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  empty: {
    color: '#9ca3af',
    marginTop: 32,
    textAlign: 'center',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 12,
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#e756b7ff',
    borderColor: '#e756b7ff',    
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
   borderRadius: 8,
    alignItems: 'center',
  },
   addButtonText: {
    color: '#ffffff',            
    fontWeight: '700',
    fontSize: 16,
  },
});