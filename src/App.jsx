import { useState, useEffect } from 'react';

import {
  LayoutDashboard,
  Clock,
  UserMinus,
  Plus,
  Minus,
  Wallet,
  Landmark,
  LogOut
} from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="flex h-screen bg-white text-[#1A1A1A] font-sans">
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10 p-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center text-white">
            <Wallet size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">Finance</span>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Home"
            active={activePage === 'home'}
            onClick={() => setActivePage('home')}
          />
          <SidebarItem
            icon={<UserMinus size={20} />}
            label="Pending"
            active={activePage === 'pending'}
            onClick={() => setActivePage('pending')}
          />
          <SidebarItem
            icon={<Clock size={20} />}
            label="History"
            active={activePage === 'history'}
            onClick={() => setActivePage('history')}
          />
        </nav>
        <div className="border-t border-gray-100 pt-6 mt-6">
          <div className="flex items-center gap-3 px-2">
            <div>
              <p className="text-sm font-bold">Vitthal Humbe</p>
              <p className="text-xs text-gray-500">Developer</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-72 overflow-y-auto">
        {activePage === 'home' && <Dashboard />}
        {activePage === 'pending' && <PendingPage />}
        {activePage === 'history' && <HistoryPage />}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${active
        ? 'bg-[#F3E8FF] text-brand-purple'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
function Dashboard() {
  const [data, setData] = useState({ sources: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('EXPENSE');

  const fetchData = () => {
    fetch('http://localhost:4000/api/sources')
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch data:", err));
  };
  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-20 text-center text-gray-400">Syncing...</div>;

  return (
    <div className="h-full flex flex-col items-center pt-20 px-12 relative">
      <div className="text-center mb-16">
        <p className="text-xs font-bold text-brand-purple tracking-[0.2em] uppercase mb-4">
          Total Consolidated Balance
        </p>
        <h2 className="text-7xl font-bold text-[#1A1A1A] tracking-tight">
          ₹{data.total.toLocaleString('en-IN')}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-5xl mb-16">
        {data.sources.map((source) => (
          <div key={source.id} className="bg-white p-8 rounded-3xl border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center text-center hover:border-brand-purple/30 transition-colors">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 mb-4">
              {source.type === 'CASH' ? <Wallet size={24} /> : <Landmark size={24} />}
            </div>
            <span className="text-gray-500 text-sm font-medium mb-1">{source.name}</span>
            <span className="text-2xl font-bold text-[#1A1A1A]">₹{source.balance.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-6">
        <button
          onClick={() => openModal('EXPENSE')}
          className="px-8 py-4 rounded-full border-2 border-brand-purple text-brand-purple font-bold flex items-center gap-2 hover:bg-brand-purple hover:text-white transition-all"
        >
          <Minus size={20} /> Spend Money (-)
        </button>

        <button
          onClick={() => openModal('INCOME')}
          className="px-8 py-4 rounded-full bg-brand-purple text-white font-bold shadow-lg shadow-purple-200 flex items-center gap-2 hover:bg-[#7b10d9] transition-all"
        >
          <Plus size={20} /> Got Money (+)
        </button>
      </div>
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalType}
        sources={data.sources}
        onSuccess={fetchData}
      />
    </div>
  );
}

function TransactionModal({ isOpen, onClose, initialType, sources, onSuccess }) {
  if (!isOpen) return null;

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [sourceId, setSourceId] = useState(sources[0]?.id || '');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const expenseCategories = ['Food', 'Travel', 'College', 'Room', 'Entertainment', 'Other'];
  const incomeCategories = ['Allowance', 'Freelance', 'Gift', 'Other'];

  const handleSubmit = async () => {
    if (!amount || !sourceId) return alert("Please fill in Amount and Source");

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category,
          note,
          source_id: parseInt(sourceId)
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setAmount('');
        setNote('');
      } else {
        alert("Failed to save transaction");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server error");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Add Transaction</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <LogOut size={20} className="rotate-180" />
            </button>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'EXPENSE' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setType('EXPENSE')}
            >
              Expense
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'INCOME' ? 'bg-white text-green-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setType('INCOME')}
            >
              Income
            </button>
          </div>
        </div>
        <div className="px-6 text-center">
          <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">Amount</label>
          <div className="flex items-center justify-center text-[#1A1A1A] mt-2">
            <span className="text-4xl font-medium text-gray-300 mr-2">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="text-6xl font-bold w-full text-center outline-none placeholder:text-gray-200"
            />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Paid Via / To</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-brand-purple focus:ring-2 focus:ring-purple-100 outline-none transition-all appearance-none font-medium"
            >
              {sources.map(s => (
                <option key={s.id} value={s.id}>{s.name} (₹{s.balance})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-brand-purple outline-none font-medium"
            >
              {(type === 'EXPENSE' ? expenseCategories : incomeCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-brand-purple outline-none font-medium"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg mt-4 transition-transform active:scale-95 ${type === 'EXPENSE'
              ? 'bg-brand-purple hover:bg-[#7b10d9] shadow-purple-200'
              : 'bg-[#2ECC71] hover:bg-[#27AE60] shadow-green-200'
              }`}
          >
            {loading ? 'Saving...' : type === 'EXPENSE' ? 'Confirm Expense' : 'Confirm Income'}
          </button>
        </div>
      </div>
    </div>
  );
}


function PendingPage() {
  const [receivables, setReceivables] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settleItem, setSettleItem] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [sourceId, setSourceId] = useState('');

  const loadData = () => {
    fetch('http://localhost:4000/api/receivables')
      .then(res => res.json())
      .then(data => setReceivables(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch('http://localhost:4000/api/sources')
      .then(res => res.json())
      .then(data => {
        const accs = data.sources || [];
        setSources(accs);
        if (accs.length > 0) setSourceId(accs[0].id);
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, []);

  const handleLend = async () => {
    if (!name || !amount || !sourceId) return alert("Please fill all details");

    await fetch('http://localhost:4000/api/receivables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        person_name: name,
        amount: parseFloat(amount),
        reason,
        source_id: parseInt(sourceId)
      })
    });

    setName(''); setAmount(''); setReason('');
    loadData();
  };

  const totalOutstanding = receivables.reduce((sum, item) => sum + (item.amount || 0), 0);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading your data...</div>;

  return (
    <div className="p-12 max-w-6xl mx-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-[#1A1A1A] mb-2">Pending Receivables</h2>
        <p className="text-gray-500 text-lg">
          Total Outstanding: <span className="font-bold text-[#1A1A1A]">₹{totalOutstanding}</span>
        </p>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-12">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Lend New</h3>

        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-3">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Person Name</label>
            <input
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-brand-purple font-medium"
              placeholder="e.g. Vitthal"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount (₹)</label>
            <input
              type="number"
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-brand-purple font-medium"
              placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">From Where?</label>
            <select
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-brand-purple font-medium"
              value={sourceId} onChange={e => setSourceId(e.target.value)}
            >
              {sources.map(s => (
                <option key={s.id} value={s.id}>{s.name} (₹{s.balance})</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason</label>
            <input
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-brand-purple font-medium"
              placeholder="Lunch..."
              value={reason} onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={handleLend}
              className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-purple-200 hover:bg-[#7b10d9] transition-all flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Lend
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Active IOUs</h3>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{receivables.length} entries found</span>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Who</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors group">
                <td className="py-5 px-6 font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-light text-brand-purple flex items-center justify-center text-xs font-bold">
                    {(item.person_name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  {item.person_name}
                </td>
                <td className="py-5 px-6 text-gray-500 font-medium">{item.reason}</td>
                <td className="py-5 px-6 font-bold text-[#1A1A1A]">₹{item.amount}</td>
                <td className="py-5 px-6 text-right">
                  <button
                    onClick={() => setSettleItem(item)}
                    className="px-4 py-2 rounded-lg border border-purple-200 text-brand-purple text-sm font-bold hover:bg-brand-purple hover:text-white transition-all"
                  >
                    Settle
                  </button>
                </td>
              </tr>
            ))}
            {receivables.length === 0 && (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-400">No pending debts. You are free!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SettlementModal
        isOpen={!!settleItem}
        item={settleItem}
        onClose={() => setSettleItem(null)}
        onSuccess={loadData}
      />
    </div>
  );
}

function SettlementModal({ isOpen, item, onClose, onSuccess }) {
  if (!isOpen) return null;
  const [sources, setSources] = useState([]);
  const [sourceId, setSourceId] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/sources')
      .then(res => res.json())
      .then(d => {
        const accs = d.sources || [];
        setSources(accs);
        if (accs.length > 0) setSourceId(accs[0].id);
      })
      .catch(err => console.error("Error loading sources for settlement:", err));
  }, [isOpen]);

  const handleSettle = async () => {
    if (!sourceId) return alert("Please select an account");

    await fetch('http://localhost:4000/api/receivables/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, source_id: parseInt(sourceId) })
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Settle Debt</h3>
        <p className="text-sm text-gray-500 mb-4">
          Where did <b>{item.person_name}</b> return the <b>₹{item.amount}</b>?
        </p>

        <select
          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 mb-6 font-medium outline-none focus:border-brand-purple"
          value={sourceId} onChange={e => setSourceId(e.target.value)}
        >
          {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSettle} className="flex-1 py-3 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-purple-200 hover:bg-[#7b10d9]">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4000/api/history?page=${page}&limit=${limit}`)
      .then(res => {
        if (!res.ok) throw new Error("Server Error");
        return res.json();
      })
      .then(response => {
        setTransactions(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.pagination?.totalPages || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load history:", err);
        setTransactions([]);
        setLoading(false);
      });
  }, [page, limit]);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch (e) { return dateString; }
  };

  return (
    <div className="p-12 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-4xl font-bold text-[#1A1A1A]">Transaction Log</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-400">Show rows:</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="p-2 bg-white border border-gray-200 rounded-lg font-bold outline-none"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50/50 sticky top-0 z-10">
              <tr>
                <th className="text-left py-5 px-8 text-xs font-bold text-gray-400 uppercase">Date</th>
                <th className="text-left py-5 px-8 text-xs font-bold text-gray-400 uppercase">Source</th>
                <th className="text-left py-5 px-8 text-xs font-bold text-gray-400 uppercase">Category</th>
                <th className="text-left py-5 px-8 text-xs font-bold text-gray-400 uppercase">Note</th>
                <th className="text-right py-5 px-8 text-xs font-bold text-gray-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-8 text-sm font-medium text-gray-500">{formatDate(t.date)}</td>
                  <td className="py-5 px-8 font-bold text-gray-700">{t.source_name}</td>
                  <td className="py-5 px-8"><span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">{t.category}</span></td>
                  <td className="py-5 px-8 text-sm text-gray-400">{t.note || '-'}</td>
                  <td className={`py-5 px-8 text-right font-bold ${t.type === 'INCOME' ? 'text-[#2ECC71]' : 'text-red-500'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} ₹{t.amount?.toLocaleString('en-IN') || 0}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr><td colSpan="5" className="py-20 text-center text-gray-400">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-end items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50">Previous</button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-full text-xs font-bold ${page === i + 1 ? 'bg-brand-purple text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
            </div>
            <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}