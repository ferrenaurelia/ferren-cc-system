"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import supabase from "@/lib/supabase";

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
  const [trxDate, setTrxDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountBalance, setAccountBalance] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("All");

  // ================= FETCH =================
  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("Transactions")
      .select("*")
      .order("date", { ascending: false });

    if (data) setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ================= LOGIN =================
  const handleLogin = () => {
    if (email === "ferren@email.com" && password === "secure4108") {
      setUser({ email });
    } else {
      alert("Login gagal");
    }
  };

  // ================= ADD =================
  const addTransaction = async () => {
    if (!amount) return;

    await supabase.from("Transactions").insert([
      {
        amount: parseFloat(amount),
        description,
        card,
        date: trxDate,
        status: "Unpaid",
      },
    ]);

    setAmount("");
    setDescription("");
    fetchTransactions();
  };

  // ================= TOGGLE STATUS =================
  const updateStatus = async (id, currentStatus) => {
    await supabase
      .from("Transactions")
      .update({
        status: currentStatus === "Unpaid" ? "Paid" : "Unpaid",
      })
      .eq("id", id);

    fetchTransactions();
  };

  // ================= DELETE =================
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Yakin ingin menghapus transaksi terpilih?")) return;

    const deleted = transactions.filter((t) => selectedIds.includes(t.id));

    await supabase.from("Transactions").delete().in("id", selectedIds);

    setLastDeleted(deleted);
    setSelectedIds([]);
    setShowUndo(true);
    fetchTransactions();

    setTimeout(() => {
      setShowUndo(false);
      setLastDeleted([]);
    }, 5000);
  };

  const undoDelete = async () => {
    if (lastDeleted.length === 0) return;

    await supabase.from("Transactions").insert(lastDeleted);

    setShowUndo(false);
    setLastDeleted([]);
    fetchTransactions();
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // ================= FILTER =================
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
      remainingLimit: CARDS[cardName].limit - total,
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
        <div style={styles.card}>
          Transaksi terhapus.
          <button onClick={undoDelete} style={styles.button}>
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.input}>
          <option value="All">All</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      <div style={styles.card}>
        <h3>Total Bulan Ini: Rp {totalMonthly.toLocaleString("id-ID")}</h3>
        <h3>Belum Dibayar: Rp {unpaidMonthly.toLocaleString("id-ID")}</h3>
      </div>

      <div style={styles.card}>
        {summaryPerCard.map((c) => (
          <div key={c.name} style={{ marginBottom: 10 }}>
            <strong>{c.name}</strong>
            <div>Total: Rp {c.total.toLocaleString("id-ID")}</div>
            <div>Unpaid: Rp {c.unpaid.toLocaleString("id-ID")}</div>
            <div>Sisa Limit: Rp {c.remainingLimit.toLocaleString("id-ID")}</div>
          </div>
        ))}
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
              <div>{trx.card} • {trx.description} • {trx.date} • {trx.status}</div>
            </div>
            <button style={styles.button} onClick={() => updateStatus(trx.id, trx.status)}>
              Toggle Status
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
  row: { display: "flex", justifyContent: "space-between", marginBottom: 10 }
};