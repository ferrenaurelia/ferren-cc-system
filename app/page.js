"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

const CARDS = {
  "CC Ferren 4108": { limit: 5000000 },
  "Krisflyer Heny": { limit: 90000000 },
};

const BILLING_ACCOUNT = "8670735207";

export default function ProfessionalCCSystem() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastDeleted, setLastDeleted] = useState([]);
  const [showUndo, setShowUndo] = useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [card, setCard] = useState("CC Ferren 4108");
  const [accountBalance, setAccountBalance] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    const saved = localStorage.getItem("ferren-cc-data");
    if (saved) setTransactions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("ferren-cc-data", JSON.stringify(transactions));
  }, [transactions]);

  const handleLogin = () => {
    if (email === "ferren@email.com" && password === "secure4108") {
      setUser({ email });
    } else {
      alert("Login gagal");
    }
  };

  const addTransaction = () => {
    if (!amount) return;

    const newTrx = {
      id: Date.now(),
      amount: parseFloat(amount),
      description,
      card,
      date: new Date().toISOString().slice(0, 10),
      status: "Unpaid",
    };

    setTransactions([newTrx, ...transactions]);
    setAmount("");
    setDescription("");
  };

  const updateStatus = (id) => {
    setTransactions(
      transactions.map((trx) =>
        trx.id === id
          ? { ...trx, status: trx.status === "Unpaid" ? "Paid" : "Unpaid" }
          : trx
      )
    );
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const triggerUndo = (deletedItems) => {
    setLastDeleted(deletedItems);
    setShowUndo(true);

    setTimeout(() => {
      setShowUndo(false);
      setLastDeleted([]);
    }, 5000);
  };

  const deleteSingle = (id) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;

    const deleted = transactions.filter((trx) => trx.id === id);
    setTransactions(transactions.filter((trx) => trx.id !== id));
    setSelectedIds(selectedIds.filter((i) => i !== id));

    triggerUndo(deleted);
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!confirm("Yakin ingin menghapus transaksi yang dipilih?")) return;

    const deleted = transactions.filter((trx) =>
      selectedIds.includes(trx.id)
    );

    setTransactions(
      transactions.filter((trx) => !selectedIds.includes(trx.id))
    );
    setSelectedIds([]);

    triggerUndo(deleted);
  };

  const undoDelete = () => {
    setTransactions([...lastDeleted, ...transactions]);
    setShowUndo(false);
    setLastDeleted([]);
  };

  const monthlyData = transactions.filter((t) =>
    t.date.startsWith(selectedMonth)
  );

  const totalMonthly = monthlyData.reduce((a, b) => a + b.amount, 0);

  const unpaidMonthly = monthlyData
    .filter((t) => t.status === "Unpaid")
    .reduce((a, b) => a + b.amount, 0);

  const usagePerCard = Object.keys(CARDS).map((cardName) => {
    const total = monthlyData
      .filter((t) => t.card === cardName)
      .reduce((a, b) => a + b.amount, 0);

    return {
      name: cardName,
      usage: total,
    };
  });

  const balanceGap = accountBalance - unpaidMonthly;

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(monthlyData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
    XLSX.writeFile(wb, `CC_Report_${selectedMonth}.xlsx`);
  };

  if (!user) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2>Secure Login</h2>
          <input style={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button style={styles.button} onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Ferren Credit Card Management System</h1>

      {showUndo && (
        <div style={styles.undoBar}>
          Transaksi terhapus.
          <button onClick={undoDelete} style={styles.undoButton}>
            Undo
          </button>
        </div>
      )}

      <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.input} />

      <div style={styles.card}>
        <h3>Dana Rekening CC ({BILLING_ACCOUNT})</h3>
        <input type="number" value={accountBalance} onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)} style={styles.input} />
        <p>Selisih Dana vs Tagihan: Rp {balanceGap.toLocaleString("id-ID")}</p>
      </div>

      <div style={styles.card}>
        <h3>Total Bulan Ini: Rp {totalMonthly.toLocaleString("id-ID")}</h3>
        <h3>Belum Dibayar: Rp {unpaidMonthly.toLocaleString("id-ID")}</h3>
      </div>

      <div style={styles.card}>
        <button style={{ ...styles.button, background: "darkred" }} onClick={deleteSelected}>
          Delete Selected
        </button>
        <button style={{ ...styles.button, marginLeft: 10 }} onClick={exportExcel}>
          Export Excel
        </button>
      </div>

      <div style={styles.card}>
        {monthlyData.map((trx) => (
          <div key={trx.id} style={styles.row}>
            <input type="checkbox" checked={selectedIds.includes(trx.id)} onChange={() => toggleSelect(trx.id)} />
            <div>
              <strong>Rp {trx.amount.toLocaleString("id-ID")}</strong>
              <div>{trx.card} • {trx.description} • {trx.date}</div>
            </div>
            <div>
              <button style={styles.button} onClick={() => updateStatus(trx.id)}>
                {trx.status}
              </button>
              <button style={{ ...styles.button, background: "red" }} onClick={() => deleteSingle(trx.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  center: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f5f5f5" },
  card: { background: "white", padding: 20, borderRadius: 10, marginBottom: 20, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  input: { padding: 8, margin: "5px 0", borderRadius: 6, border: "1px solid #ccc" },
  button: { padding: 8, borderRadius: 6, border: "none", background: "black", color: "white", cursor: "pointer", marginLeft: 5 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  undoBar: { background: "#222", color: "white", padding: 10, borderRadius: 8, marginBottom: 15 },
  undoButton: { marginLeft: 10, padding: 5, background: "orange", border: "none", borderRadius: 5, cursor: "pointer" }
};