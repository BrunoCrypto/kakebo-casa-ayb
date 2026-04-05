import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gprvwcjkwyhscbajxkum.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcnZ3Y2prd3loc2NiYWp4a3VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTM3NjcsImV4cCI6MjA5MDk4OTc2N30.CcjOWnE1J11m5gf8P452DrlQbGWY12sJvCWrOvu8TRg";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MES_ACTUAL = new Date().getMonth();
const ANIO_ACTUAL = new Date().getFullYear();

function fARS(n) {
  if (!n && n !== 0) return "$0";
  if (Math.abs(n) >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n/1000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

const CATS = [
  { id: "expensas",   label: "Expensas",     emoji: "🏢", color: "#6a8a7a" },
  { id: "cochera",    label: "Cochera",       emoji: "🚗", color: "#5a7a8a" },
  { id: "super",      label: "Supermercado",  emoji: "🛒", color: "#7a8a5a" },
  { id: "verduleria", label: "Verdulería",    emoji: "🥦", color: "#5a8a5a" },
  { id: "carniceria", label: "Carnicería",    emoji: "🥩", color: "#8a5a5a" },
  { id: "servicios",  label: "Servicios",     emoji: "⚡", color: "#8a7a4a" },
  { id: "limpieza",   label: "Limpieza",      emoji: "🧹", color: "#6a7a8a" },
  { id: "streaming",  label: "Streaming",     emoji: "📺", color: "#7a5a8a" },
];

const PERSONAS = [
  { id: "yo",   label: "Bruno",     color: "#c8a96e" },
  { id: "ella", label: "Tu novia",  color: "#a87ab8" },
];

const REFLEXIONES_LABELS = [
  "¿Cuánto dinero tenían disponible para el hogar este mes?",
  "¿Cuánto querían gastar idealmente?",
  "¿Cuánto gastaron realmente?",
  "¿Qué pueden mejorar el mes que viene?",
];

const inputStyle = {
  background: "#0e0e0e", border: "1px solid #252525", color: "#e0d8c8",
  padding: "10px 12px", borderRadius: 4, fontFamily: "'Courier New', monospace",
  fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
};
const cardStyle = {
  background: "#141414", border: "1px solid #1e1e1e", borderRadius: 6, padding: 16, marginBottom: 12,
};
const labelStyle = {
  fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase",
  fontFamily: "monospace", display: "block", marginBottom: 6,
};

export default function KakeboCasa() {
  const [tab, setTab] = useState("resumen");
  const [mes, setMes] = useState(MES_ACTUAL);
  const [anio] = useState(ANIO_ACTUAL);
  const [loading, setLoading] = useState(true);

  const [gastos, setGastos] = useState([]);
  const [presupuestos, setPresupuestos] = useState(Object.fromEntries(CATS.map(c => [c.id, ""])));
  const [reflexiones, setReflexiones] = useState({ pregunta_1: "", pregunta_2: "", pregunta_3: "", pregunta_4: "" });
  const [form, setForm] = useState({ catId: "expensas", quien: "yo", descripcion: "", monto: "" });
  const [guardando, setGuardando] = useState(false);

  // ── Cargar datos del mes ────────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
  }, [mes, anio]);

  async function cargarDatos() {
    setLoading(true);
    try {
      const [{ data: g }, { data: p }, { data: r }] = await Promise.all([
        supabase.from("gastos").select("*").eq("mes", mes).eq("anio", anio).order("created_at", { ascending: false }),
        supabase.from("presupuestos").select("*").eq("mes", mes).eq("anio", anio),
        supabase.from("reflexiones").select("*").eq("mes", mes).eq("anio", anio).single(),
      ]);
      setGastos(g || []);
      if (p && p.length > 0) {
        const presup = Object.fromEntries(CATS.map(c => [c.id, ""]));
        p.forEach(row => { presup[row.cat_id] = row.monto.toString(); });
        setPresupuestos(presup);
      } else {
        setPresupuestos(Object.fromEntries(CATS.map(c => [c.id, ""])));
      }
      if (r) setReflexiones(r);
      else setReflexiones({ pregunta_1: "", pregunta_2: "", pregunta_3: "", pregunta_4: "" });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // ── Agregar gasto ───────────────────────────────────────────────────────────
  async function addGasto() {
    if (!form.descripcion || !form.monto) return;
    setGuardando(true);
    const nuevo = {
      mes, anio,
      cat_id: form.catId,
      quien: form.quien,
      descripcion: form.descripcion,
      monto: parseFloat(form.monto),
      fecha: new Date().toLocaleDateString("es-AR"),
    };
    const { data, error } = await supabase.from("gastos").insert([nuevo]).select().single();
    if (!error && data) {
      setGastos([data, ...gastos]);
      setForm({ ...form, descripcion: "", monto: "" });
    }
    setGuardando(false);
  }

  // ── Eliminar gasto ──────────────────────────────────────────────────────────
  async function removeGasto(id) {
    await supabase.from("gastos").delete().eq("id", id);
    setGastos(gastos.filter(g => g.id !== id));
  }

  // ── Guardar presupuesto ─────────────────────────────────────────────────────
  async function guardarPresupuesto(catId, monto) {
    const val = parseFloat(monto) || 0;
    await supabase.from("presupuestos").upsert({ mes, anio, cat_id: catId, monto: val }, { onConflict: "mes,anio,cat_id" });
    setPresupuestos({ ...presupuestos, [catId]: monto });
  }

  // ── Guardar reflexión ───────────────────────────────────────────────────────
  async function guardarReflexion(key, value) {
    const updated = { ...reflexiones, [key]: value };
    setReflexiones(updated);
    await supabase.from("reflexiones").upsert({ mes, anio, ...updated }, { onConflict: "mes,anio" });
  }

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const totalPorCat = useMemo(() =>
    Object.fromEntries(CATS.map(c => [c.id, gastos.filter(g => g.cat_id === c.id).reduce((a, g) => a + Number(g.monto), 0)])),
    [gastos]);

  const totalPorPersona = useMemo(() => ({
    yo:   gastos.filter(g => g.quien === "yo").reduce((a, g) => a + Number(g.monto), 0),
    ella: gastos.filter(g => g.quien === "ella").reduce((a, g) => a + Number(g.monto), 0),
  }), [gastos]);

  const totalCasa = totalPorPersona.yo + totalPorPersona.ella;
  const mitad = totalCasa / 2;
  const balance = totalPorPersona.yo - mitad;
  const totalPresupuestado = Object.values(presupuestos).reduce((a, v) => a + (parseFloat(v) || 0), 0);

  const tabs = [
    { id: "resumen",    label: "📊 Resumen"     },
    { id: "cargar",     label: "➕ Cargar"       },
    { id: "categorias", label: "🗂 Categorías"  },
    { id: "balance",    label: "⚖️ Balance"     },
    { id: "kakebo",     label: "📓 Kakebo"      },
  ];

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: "#0a0a0a", minHeight: "100vh", color: "#e0d8c8" }}>

      {/* HEADER */}
      <div style={{ background: "#111", borderBottom: "1px solid #1c1c1c", padding: "20px 20px 0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5a4a30", textTransform: "uppercase", marginBottom: 2 }}>Método Kakebo</div>
              <h1 style={{ margin: 0, fontSize: 22, fontStyle: "italic", color: "#c8a96e" }}>Casa Compartida</h1>
              <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "monospace", marginTop: 2 }}>División justa 50 / 50</div>
            </div>
            <select value={mes} onChange={e => setMes(parseInt(e.target.value))}
              style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 12 }}>
              {MESES.map((m, i) => <option key={m} value={i}>{m} {anio}</option>)}
            </select>
          </div>

          {/* Mini KPIs */}
          <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { label: "Total casa",   val: fARS(totalCasa), color: "#c8a96e" },
              { label: "Cada uno",     val: fARS(mitad),     color: "#666"    },
              { label: Math.abs(balance) < 100 ? "Parejos ✓" : balance > 0 ? "Ella te debe" : "Vos debés",
                val: Math.abs(balance) < 100 ? "—" : fARS(Math.abs(balance)),
                color: Math.abs(balance) < 100 ? "#4a8a5a" : balance > 0 ? "#a87ab8" : "#e07070" },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontSize: 9, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace" }}>{k.label}</div>
                <div style={{ fontSize: 17, color: k.color, fontFamily: "monospace", fontWeight: "bold" }}>{k.val}</div>
              </div>
            ))}
            {loading && <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", alignSelf: "center" }}>⟳ sincronizando...</div>}
          </div>

          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? "#c8a96e" : "transparent",
                color: tab === t.id ? "#0a0a0a" : "#555",
                border: "none", padding: "9px 13px", fontSize: 11,
                cursor: "pointer", borderRadius: "4px 4px 0 0",
                fontFamily: "monospace", whiteSpace: "nowrap", transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px" }}>

        {/* RESUMEN */}
        {tab === "resumen" && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>Quién pagó qué — {MESES[mes]}</div>
              {totalCasa > 0 && (
                <div style={{ display: "flex", height: 18, borderRadius: 3, overflow: "hidden", gap: 2, marginBottom: 12 }}>
                  <div style={{ flex: totalPorPersona.yo, background: "#c8a96e", transition: "flex 0.5s" }} />
                  <div style={{ flex: totalPorPersona.ella, background: "#a87ab8", transition: "flex 0.5s" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                {PERSONAS.map(p => (
                  <div key={p.id} style={{ flex: 1, textAlign: "center", background: "#0e0e0e", borderRadius: 4, padding: "12px 8px" }}>
                    <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: 22, color: p.color, fontFamily: "monospace", fontWeight: "bold" }}>{fARS(totalPorPersona[p.id])}</div>
                    <div style={{ fontSize: 10, color: "#333", fontFamily: "monospace", marginTop: 2 }}>
                      {totalCasa > 0 ? Math.round(totalPorPersona[p.id] / totalCasa * 100) : 0}% del total
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>
                Últimos movimientos
              </div>
              {loading ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#333", fontFamily: "monospace", fontSize: 12 }}>Cargando...</div>
              ) : gastos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#2a2a2a", fontStyle: "italic", fontSize: 13 }}>No hay gastos este mes</div>
              ) : (
                gastos.slice(0, 10).map(g => {
                  const cat = CATS.find(c => c.id === g.cat_id);
                  const persona = PERSONAS.find(p => p.id === g.quien);
                  return (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #161616" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{cat?.emoji}</span>
                        <div>
                          <div style={{ fontSize: 12, color: "#c0b8a8" }}>{g.descripcion}</div>
                          <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace" }}>{cat?.label} · {g.fecha}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, color: persona?.color, fontFamily: "monospace" }}>{fARS(g.monto)}</div>
                          <div style={{ fontSize: 10, color: "#333", fontFamily: "monospace" }}>{persona?.label}</div>
                        </div>
                        <button onClick={() => removeGasto(g.id)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 18 }}>×</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CARGAR */}
        {tab === "cargar" && (
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 14 }}>Nuevo gasto — {MESES[mes]}</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", marginBottom: 6 }}>CATEGORÍA</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {CATS.map(c => (
                  <button key={c.id} onClick={() => setForm({ ...form, catId: c.id })} style={{
                    background: form.catId === c.id ? c.color + "30" : "#0e0e0e",
                    border: `1px solid ${form.catId === c.id ? c.color : "#1e1e1e"}`,
                    color: form.catId === c.id ? "#e0d8c8" : "#555",
                    padding: "8px 10px", borderRadius: 4, cursor: "pointer",
                    fontFamily: "monospace", fontSize: 12, textAlign: "left", transition: "all 0.15s",
                  }}>{c.emoji} {c.label}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", marginBottom: 6 }}>¿QUIÉN PAGÓ?</div>
              <div style={{ display: "flex", gap: 6 }}>
                {PERSONAS.map(p => (
                  <button key={p.id} onClick={() => setForm({ ...form, quien: p.id })} style={{
                    flex: 1, padding: "11px",
                    border: `1px solid ${form.quien === p.id ? p.color : "#1e1e1e"}`,
                    background: form.quien === p.id ? p.color + "20" : "#0e0e0e",
                    color: form.quien === p.id ? p.color : "#555",
                    borderRadius: 4, cursor: "pointer", fontFamily: "monospace",
                    fontSize: 13, fontWeight: form.quien === p.id ? "bold" : "normal", transition: "all 0.15s",
                  }}>{p.label}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", marginBottom: 6 }}>DESCRIPCIÓN</div>
              <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Coto, Metrogas, Netflix..." style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", marginBottom: 6 }}>MONTO $</div>
              <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })}
                placeholder="0" style={{ ...inputStyle, fontSize: 20 }}
                onKeyDown={e => e.key === "Enter" && addGasto()} />
            </div>

            <button onClick={addGasto} disabled={guardando} style={{
              width: "100%", background: guardando ? "#555" : "#c8a96e", color: "#0a0a0a",
              border: "none", padding: 14, borderRadius: 4, cursor: guardando ? "not-allowed" : "pointer",
              fontFamily: "monospace", fontSize: 13, fontWeight: "bold", letterSpacing: 1,
            }}>{guardando ? "Guardando..." : "+ Agregar gasto"}</button>
          </div>
        )}

        {/* CATEGORÍAS */}
        {tab === "categorias" && (
          <div>
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 14 }}>Gasto vs presupuesto — {MESES[mes]}</div>
            {CATS.map(c => {
              const gastado = totalPorCat[c.id] || 0;
              const presup = parseFloat(presupuestos[c.id]) || 0;
              const pct = presup > 0 ? Math.min(100, Math.round(gastado / presup * 100)) : 0;
              const sobre = presup > 0 && gastado > presup;
              return (
                <div key={c.id} style={{ ...cardStyle, borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: presup > 0 ? 8 : 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{c.emoji}</span>
                      <span style={{ fontSize: 13, color: "#c0b8a8" }}>{c.label}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 15, color: sobre ? "#e07070" : "#c8a96e", fontFamily: "monospace" }}>{fARS(gastado)}</span>
                      {presup > 0 && <span style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "monospace" }}> / {fARS(presup)}</span>}
                    </div>
                  </div>
                  {presup > 0 && (
                    <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, marginBottom: 10 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: sobre ? "#e07070" : c.color, borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace", whiteSpace: "nowrap" }}>PRESUPUESTO $</span>
                    <input type="number" value={presupuestos[c.id]}
                      onChange={e => setPresupuestos({ ...presupuestos, [c.id]: e.target.value })}
                      onBlur={e => guardarPresupuesto(c.id, e.target.value)}
                      placeholder="Sin límite"
                      style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, width: 120 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ ...cardStyle, borderLeft: "3px solid #c8a96e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>TOTAL CASA</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 20, color: "#c8a96e", fontFamily: "monospace", fontWeight: "bold" }}>{fARS(totalCasa)}</span>
                {totalPresupuestado > 0 && <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "monospace" }}>de {fARS(totalPresupuestado)} presupuestado</div>}
              </div>
            </div>
          </div>
        )}

        {/* BALANCE */}
        {tab === "balance" && (
          <div>
            <div style={{ ...cardStyle, textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 3, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>Balance {MESES[mes]}</div>
              <div style={{ fontSize: 48, fontWeight: "bold", fontFamily: "monospace",
                color: Math.abs(balance) < 100 ? "#4a8a5a" : balance > 0 ? "#a87ab8" : "#e07070" }}>
                {Math.abs(balance) < 100 ? "✓" : fARS(Math.abs(balance))}
              </div>
              <div style={{ fontSize: 15, color: "#666", marginTop: 10, fontStyle: "italic" }}>
                {Math.abs(balance) < 100
                  ? "Están parejos, sin deuda entre ustedes"
                  : balance > 0
                  ? `Tu novia te debe ${fARS(balance)}`
                  : `Vos le debés ${fARS(Math.abs(balance))} a tu novia`}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {PERSONAS.map(p => {
                const pagado = totalPorPersona[p.id];
                const diff = pagado - mitad;
                return (
                  <div key={p.id} style={{ ...cardStyle, textAlign: "center", borderTop: `3px solid ${p.color}`, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", marginBottom: 6 }}>{p.label} pagó</div>
                    <div style={{ fontSize: 24, color: p.color, fontFamily: "monospace", fontWeight: "bold" }}>{fARS(pagado)}</div>
                    <div style={{ fontSize: 11, color: "#2a2a2a", fontFamily: "monospace", marginTop: 6 }}>Le toca {fARS(mitad)}</div>
                    <div style={{ fontSize: 12, marginTop: 6, fontFamily: "monospace", color: diff >= 0 ? "#4a8a5a" : "#e07070" }}>
                      {diff >= 0 ? `+${fARS(diff)} de más` : `${fARS(diff)} de menos`}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>Detalle por categoría</div>
              {CATS.filter(c => totalPorCat[c.id] > 0).map(c => {
                const yo   = gastos.filter(g => g.cat_id === c.id && g.quien === "yo").reduce((a, g) => a + Number(g.monto), 0);
                const ella = gastos.filter(g => g.cat_id === c.id && g.quien === "ella").reduce((a, g) => a + Number(g.monto), 0);
                return (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #161616", alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>{c.emoji} {c.label}</span>
                    <div style={{ display: "flex", gap: 14, fontFamily: "monospace", fontSize: 12 }}>
                      {yo   > 0 && <span style={{ color: "#c8a96e" }}>Bruno {fARS(yo)}</span>}
                      {ella > 0 && <span style={{ color: "#a87ab8" }}>Ella {fARS(ella)}</span>}
                    </div>
                  </div>
                );
              })}
              {gastos.length === 0 && (
                <div style={{ color: "#2a2a2a", fontStyle: "italic", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Sin gastos registrados</div>
              )}
            </div>
          </div>
        )}

        {/* KAKEBO */}
        {tab === "kakebo" && (
          <div>
            <div style={{ fontSize: 12, color: "#3a3a3a", fontStyle: "italic", marginBottom: 18, lineHeight: 1.7 }}>
              El método Kakebo te invita a reflexionar sobre el dinero, no solo registrarlo. Respondé estas 4 preguntas cada mes.
            </div>

            <div style={{ ...cardStyle, background: "#0e0e0e", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>Foto del mes — {MESES[mes]}</div>
              {[
                { label: "Total gastado",     val: fARS(totalCasa),            color: "#c8a96e" },
                { label: "Parte de cada uno", val: fARS(mitad),                color: "#888"    },
                { label: "Bruno pagó",        val: fARS(totalPorPersona.yo),   color: "#c8a96e" },
                { label: "Tu novia pagó",     val: fARS(totalPorPersona.ella), color: "#a87ab8" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #161616" }}>
                  <span style={{ fontSize: 12, color: "#444", fontFamily: "monospace" }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: r.color, fontFamily: "monospace", fontWeight: "bold" }}>{r.val}</span>
                </div>
              ))}
            </div>

            {REFLEXIONES_LABELS.map((preg, i) => {
              const key = `pregunta_${i + 1}`;
              return (
                <div key={i} style={{ ...cardStyle, borderLeft: "3px solid #2a2a1a" }}>
                  <div style={{ fontSize: 11, color: "#6a5a3a", fontFamily: "monospace", marginBottom: 8 }}>{i + 1}. {preg}</div>
                  <textarea
                    value={reflexiones[key] || ""}
                    onChange={e => setReflexiones({ ...reflexiones, [key]: e.target.value })}
                    onBlur={e => guardarReflexion(key, e.target.value)}
                    placeholder="Escribí tu respuesta..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontStyle: "italic" }}
                  />
                </div>
              );
            })}

            <div style={{ ...cardStyle, background: "#0e0f0e", borderLeft: "3px solid #4a7a5a" }}>
              <div style={{ fontSize: 10, color: "#4a7a5a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 8 }}>🟢 Mejora Kaizen del mes</div>
              <p style={{ fontSize: 13, color: "#5a7a5a", fontStyle: "italic", margin: 0, lineHeight: 1.8 }}>
                {totalCasa === 0
                  ? "Empezá cargando gastos para ver la sugerencia del mes."
                  : Math.abs(balance) > mitad * 0.25
                  ? `Diferencia de ${fARS(Math.abs(balance))} entre lo que cada uno pagó. Próximo mes: quien paga menos se encarga de adelantar algún gasto para equilibrar.`
                  : totalPresupuestado === 0
                  ? "Todavía no pusieron presupuesto por categoría. Es el próximo paso Kaizen: estimar antes de gastar."
                  : "¡Mes equilibrado! Próximo nivel: definir un fondo de emergencia del hogar equivalente a 1 mes de gastos fijos."}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
