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

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [card, setCard] = useState("CC Ferren 4108");
  const [trxDate, setTrxDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountBalance, setAccountBalance] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [statusFilter, setStatusFilter] = useState("All");

  // ================= LOAD DATA FROM SUPABASE =================
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("Transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setTransactions(data || []);
    }
  };

  // ================= LOGIN (SIMPLE) =================
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

    const cleanAmount = parseFloat(amount.replace(/[^0-9]/g, ""));

    const { error } = await supabase.from("Transactions").insert([
      {
        amount: cleanAmount,
        description,
        card,
        date: trxDate,
        status: "Unpaid",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Gagal menambahkan transaksi");
    } else {
      setAmount("");
      setDescription("");
      fetchTransactions();
    }
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from("Transactions")
      .update({
        status: currentStatus === "Unpaid" ? "Paid" : "Unpaid",
      })
      .eq("id", id);

    if (!error) fetchTransactions();
  };

  // ================= DELETE SELECTED =================
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Yakin ingin menghapus transaksi terpilih?")) return;

    const { error } = await supabase
      .from("Transactions")
      .delete()
      .in("id", selectedIds);

    if (!error) {
      setSelectedIds([]);
      fetchTransactions();
    }
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

  const totalMonthly = monthlyData.reduce((a, b) => a + Number(b.amount), 0);

  const unpaidMonthly = monthlyData
    .filter((t) => t.status === "Unpaid")
    .reduce((a, b) => a + Number(b.amount), 0);

  const summaryPerCard = Object.keys(CARDS).map((cardName) => {
    const data = monthlyData.filter((t) => t.card === cardName);
    const total = data.reduce((a, b) => a + Number(b.amount), 0);
    const unpaid = data
      .filter((t) => t.status === "Unpaid")
      .reduce((a, b) => a + Number(b.amount), 0);

    return {
      name: cardName,
      total,
      unpaid,
      remainingLimit: CARDS[cardName].limit - total,
    };
  });

  const balanceGap = accountBalance - unpaidMonthly;

  // ================= EXPORT =================
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(monthlyData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
    XLSX.writeFile(wb, `CC_Report_${selectedMonth}.xlsx`);
  };

  // ================= LOGIN SCREEN =================
  if (!user) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2>Secure Login</h2>
          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button style={styles.button} onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div style={{ padding: 30 }}>
      <h1>Ferren Credit Card Management System 💳</h1>

      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        style={styles.input}
      />

      {/* FORM */}
      <div style={styles.card}>
        <h3>Tambah Transaksi</h3>
        <input
          type="date"
          value={trxDate}
          onChange={(e) => setTrxDate(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Nominal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Keterangan"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.input}
        />
        <select
          value={card}
          onChange={(e) => setCard(e.target.value)}
          style={styles.input}
        >
          {Object.keys(CARDS).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button style={styles.button} onClick={addTransaction}>
          Tambah
        </button>
      </div>

      {/* SUMMARY */}
      <div style={styles.card}>
        <h3>Total Bulan Ini: Rp {totalMonthly.toLocaleString("id-ID")}</h3>
        <h3>Belum Dibayar: Rp {unpaidMonthly.toLocaleString("id-ID")}</h3>
        <h3>Selisih Dana vs Tagihan: Rp {balanceGap.toLocaleString("id-ID")}</h3>
      </div>

      {/* PER KARTU */}
      <div style={styles.card}>
        {summaryPerCard.map((c) => (
          <div key={c.name}>
            <strong>{c.name}</strong>
            <div>Total: Rp {c.total.toLocaleString("id-ID")}</div>
            <div>Unpaid: Rp {c.unpaid.toLocaleString("id-ID")}</div>
            <div>Sisa Limit: Rp {c.remainingLimit.toLocaleString("id-ID")}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <button
          style={{ ...styles.button, background: "darkred" }}
          onClick={deleteSelected}
        >
          Delete Selected
        </button>
        <button
          style={{ ...styles.button, marginLeft: 10 }}
          onClick={exportExcel}
        >
          Export Excel
        </button>
      </div>

      {/* LIST */}
      <div style={styles.card}>
        {monthlyData.map((trx) => (
          <div key={trx.id} style={styles.row}>
            <input
              type="checkbox"
              checked={selectedIds.includes(trx.id)}
              onChange={() => toggleSelect(trx.id)}
            />
            <div>
              <strong>
                Rp {Number(trx.amount).toLocaleString("id-ID")}
              </strong>
              <div>
                {trx.card} • {trx.description} • {trx.date} • {trx.status}
              </div>
            </div>
            <button
              style={styles.button}
              onClick={() => updateStatus(trx.id, trx.status)}
            >
              Toggle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  center: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
  },
  card: {
    background: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  input: {
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    width: "100%",
  },
  button: {
    padding: 8,
    borderRadius: 6,
    border: "none",
    background: "black",
    color: "white",
    cursor: "pointer",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },
};