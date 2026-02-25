"use client";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  const [trxDate, setTrxDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [accountBalance, setAccountBalance] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [statusFilter, setStatusFilter] = useState("All");

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
      date: trxDate,
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

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Yakin ingin menghapus transaksi terpilih?")) return;

    const deleted = transactions.filter((t) =>
      selectedIds.includes(t.id)
    );

    setTransactions(
      transactions.filter((t) => !selectedIds.includes(t.id))
    );
    setLastDeleted(deleted);
    setSelectedIds([]);
    setShowUndo(true);

    setTimeout(() => {
      setShowUndo(false);
      setLastDeleted([]);
    }, 5000);
  };

  const undoDelete = () => {
    setTransactions([...lastDeleted, ...transactions]);
    setShowUndo(false);
    setLastDeleted([]);
  };

  const monthlyData = transactions
    .filter((t) => t.date.startsWith(selectedMonth))
    .filter((t) => statusFilter === "All" || t.status === statusFilter);

  const totalMonthly = monthlyData.reduce((a, b) => a + b.amount, 0);
  const unpaidMonthly = monthlyData
    .filter((t) => t.status === "Unpaid")
    .reduce((a, b) => a + b.amount, 0);

  const summaryPerCard = Object.keys(CARDS).map((cardName) => {
    const data = monthlyData.filter((t) => t.card === cardName);
    const total = data.reduce((a, b) => a + b.amount, 0);
    const unpaid = data
      .filter((t) => t.status === "Unpaid")
      .reduce((a, b) => a + b.amount, 0);

    return {
      name: cardName,
      total,
      unpaid,
      remaining: CARDS[cardName].limit - total,
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
      <h1>Ferren Credit Card Management System 💳</h1>

      {showUndo && (
        <div style={styles.undoBar}>
          Transaksi terhapus.
          <button onClick={undoDelete} style={styles.undoButton}>
            Undo
          </button>
        </div>
      )}

      {/* FILTER BULAN */}
      <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.input} />

      {/* FILTER STATUS */}
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.input}>
        <option value="All">All</option>
        <option value="Paid">Paid</option>
        <option value="Unpaid">Unpaid</option>
      </select>

      {/* FORM INPUT */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <input type="date" value={trxDate} onChange={(e) => setTrxDate(e.target.value)} style={styles.input} />
        <input type="number" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} style={styles.input} />
        <input placeholder="Keterangan" value={description} onChange={(e) => setDescription(e.target.value)} style={styles.input} />
        <select value={card} onChange={(e) => setCard(e.target.value)} style={styles.input}>
          {Object.keys(CARDS).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button style={styles.button} onClick={addTransaction}>Tambah</button>
      </div>

      {/* SUMMARY */}
      <div style={styles.card}>
        <h3>Total Bulan Ini: Rp {totalMonthly.toLocaleString("id-ID")}</h3>
        <h3>Belum Dibayar: Rp {unpaidMonthly.toLocaleString("id-ID")}</h3>
        <h3>Selisih Dana vs Tagihan: Rp {balanceGap.toLocaleString("id-ID")}</h3>
      </div>

      {/* SUMMARY PER KARTU */}
      <div style={styles.card}>
        {summaryPerCard.map((c) => (
          <div key={c.name} style={{ marginBottom: 10 }}>
            <strong>{c.name}</strong>
            <div>Total: Rp {c.total.toLocaleString("id-ID")}</div>
            <div>Unpaid: Rp {c.unpaid.toLocaleString("id-ID")}</div>
            <div>Sisa Limit: Rp {c.remaining.toLocaleString("id-ID")}</div>
          </div>
        ))}
      </div>

      {/* GRAFIK */}
      <div style={styles.card}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={summaryPerCard}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ACTION */}
      <div style={styles.card}>
        <button style={{ ...styles.button, background: "darkred" }} onClick={deleteSelected}>
          Delete Selected
        </button>
        <button style={{ ...styles.button, marginLeft: 10 }} onClick={exportExcel}>
          Export Excel
        </button>
      </div>

      {/* LIST TRANSAKSI */}
      <div style={styles.card}>
        {monthlyData.map((trx) => (
          <div key={trx.id} style={styles.row}>
            <input type="checkbox" checked={selectedIds.includes(trx.id)} onChange={() => toggleSelect(trx.id)} />
            <div>
              <strong>Rp {trx.amount.toLocaleString("id-ID")}</strong>
              <div>{trx.card} • {trx.description} • {trx.date} • {trx.status}</div>
            </div>
            <button style={styles.button} onClick={() => updateStatus(trx.id)}>
              Toggle
            </button>
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
  button: { padding: 8, borderRadius: 6, border: "none", background: "black", color: "white", cursor: "pointer" },
  row: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  undoBar: { background: "#222", color: "white", padding: 10, borderRadius: 8, marginBottom: 15 },
  undoButton: { marginLeft: 10, padding: 5, background: "orange", border: "none", borderRadius: 5, cursor: "pointer" }
};