import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, Check, Lock, Unlock, Coins, Copy, Gift, Calendar, Hash, ToggleLeft, ToggleRight, Upload, AlertCircle, ExternalLink } from "lucide-react";
import { getAllProviders } from "../utils/providerLogos";
import {
  LockedOfferwallConfig, OfferwallPromoCode,
  getLockedOfferwallConfigs, setLockedOfferwallConfig, deleteLockedOfferwallConfig,
  getOfferwallPromoCodes, addOfferwallPromoCode, updateOfferwallPromoCode, deleteOfferwallPromoCode, getAllUserUnlocks,
} from "../utils/lockedOfferwallDB";

interface Props {
  section: string;
  onBack: () => void;
  showNotif: (type: "success" | "error", msg: string) => void;
}

export default function AdminLockedOfferwalls({ section, onBack, showNotif }: Props) {
  const providers = getAllProviders();

  // ── Locked Offerwall Management ──
  const [configs, setConfigs] = useState<LockedOfferwallConfig[]>(getLockedOfferwallConfigs);
  const [editConfig, setEditConfig] = useState<{ providerName: string; title: string; subtitle: string; isLocked: boolean; requiredCoins: number; logo: string; watermark: string; promoEnabled: boolean } | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const refreshConfigs = () => setConfigs(getLockedOfferwallConfigs());

  const saveConfig = () => {
    if (!editConfig) return;
    if (editConfig.requiredCoins < 1) { showNotif("error", "Required coins must be at least 1"); return; }
    setLockedOfferwallConfig({ ...editConfig, createdAt: new Date().toISOString() });
    refreshConfigs();
    setEditConfig(null);
    setAddingNew(false);
    showNotif("success", `Configuration saved for ${editConfig.providerName}`);
  };

  const startEdit = (cfg: LockedOfferwallConfig) => {
    setEditConfig({ ...cfg });
    setAddingNew(false);
  };

  const startAdd = (providerName: string) => {
    setEditConfig({
      providerName, title: providerName, subtitle: "",
      isLocked: true, requiredCoins: 5000,
      logo: "", watermark: "", promoEnabled: true,
    });
    setAddingNew(true);
  };

  const cancelEdit = () => { setEditConfig(null); setAddingNew(false); };

  const handleDelete = (providerName: string) => {
    deleteLockedOfferwallConfig(providerName);
    refreshConfigs();
    showNotif("success", `Deleted config for ${providerName}`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editConfig) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result && editConfig) {
        setEditConfig({ ...editConfig, logo: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editConfig) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result && editConfig) {
        setEditConfig({ ...editConfig, watermark: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Promo Code Management ──
  const [promoCodes, setPromoCodes] = useState<OfferwallPromoCode[]>(getOfferwallPromoCodes);
  const [editingPromo, setEditingPromo] = useState<OfferwallPromoCode | null>(null);
  const [newPromo, setNewPromo] = useState({
    code: "", offerwallName: providers[0]?.name || "", active: true,
    expiryDate: "", usageLimit: 100,
  });

  const refreshPromos = () => setPromoCodes(getOfferwallPromoCodes());

  const createPromo = () => {
    if (!newPromo.code.trim()) { showNotif("error", "Promo code required"); return; }
    const existing = promoCodes.find((p) => p.code.toUpperCase() === newPromo.code.toUpperCase() && p.offerwallName === newPromo.offerwallName);
    if (existing) { showNotif("error", "This promo code already exists for this offerwall"); return; }
    addOfferwallPromoCode({
      id: `opc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      code: newPromo.code.toUpperCase(),
      offerwallName: newPromo.offerwallName,
      active: newPromo.active,
      expiryDate: newPromo.expiryDate || null,
      usageLimit: newPromo.usageLimit,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    });
    refreshPromos();
    setNewPromo({ code: "", offerwallName: providers[0]?.name || "", active: true, expiryDate: "", usageLimit: 100 });
    showNotif("success", "Promo code created");
  };

  const savePromoEdit = () => {
    if (!editingPromo) return;
    updateOfferwallPromoCode(editingPromo.id, editingPromo);
    refreshPromos();
    setEditingPromo(null);
    showNotif("success", "Promo code updated");
  };

  const deletePromo = (id: string) => {
    deleteOfferwallPromoCode(id);
    refreshPromos();
    showNotif("success", "Promo code deleted");
  };

  const togglePromoActive = (id: string, current: boolean) => {
    updateOfferwallPromoCode(id, { active: !current });
    refreshPromos();
  };

  const allUnlocks = getAllUserUnlocks();
  const finalConfigs = getLockedOfferwallConfigs();

  if (section === "locked-offers-management") {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <button onClick={onBack} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors mb-2">&larr; Back</button>
        <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-400" /> Locked Offerwall Management
        </h1>

        {/* Edit / Add Form */}
        {editConfig && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/80 p-5 rounded-3xl border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {addingNew ? <Plus className="w-4 h-4 text-emerald-400" /> : <Edit className="w-4 h-4 text-cyan-400" />}
              {addingNew ? "New Configuration" : `Edit: ${editConfig.providerName}`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Provider</label>
                <select value={editConfig.providerName} onChange={(e) => setEditConfig({ ...editConfig, providerName: e.target.value })} disabled={!addingNew} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50 focus:outline-none focus:border-cyan-500/20">
                  {providers.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Title</label>
                <input value={editConfig.title} onChange={(e) => setEditConfig({ ...editConfig, title: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Subtitle</label>
                <input value={editConfig.subtitle} onChange={(e) => setEditConfig({ ...editConfig, subtitle: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Required Coins</label>
                <input type="number" value={editConfig.requiredCoins || ""} onChange={(e) => setEditConfig({ ...editConfig, requiredCoins: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Logo URL or Upload</label>
                <div className="flex gap-2">
                  <input value={editConfig.logo} onChange={(e) => setEditConfig({ ...editConfig, logo: e.target.value })} placeholder="https://..." className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
                  <label className="shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Watermark Text / Upload</label>
                <div className="flex gap-2">
                  <input value={editConfig.watermark} onChange={(e) => setEditConfig({ ...editConfig, watermark: e.target.value })} placeholder="Text or image URL" className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
                  <label className="shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleWatermarkUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button onClick={() => setEditConfig({ ...editConfig, isLocked: !editConfig.isLocked })} className={`relative w-9 h-4.5 rounded-full transition-all ${editConfig.isLocked ? "bg-rose-500" : "bg-slate-700"}`}>
                    <span className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all" style={{ left: editConfig.isLocked ? "calc(100% - 16px)" : "2px" }} />
                  </button>
                  <span className="text-[10px] text-slate-300 font-mono">{editConfig.isLocked ? "Locked" : "Unlocked"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <button onClick={() => setEditConfig({ ...editConfig, promoEnabled: !editConfig.promoEnabled })} className={`relative w-9 h-4.5 rounded-full transition-all ${editConfig.promoEnabled ? "bg-purple-500" : "bg-slate-700"}`}>
                    <span className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all" style={{ left: editConfig.promoEnabled ? "calc(100% - 16px)" : "2px" }} />
                  </button>
                  <span className="text-[10px] text-slate-300 font-mono">Promo Unlock</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveConfig} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/20 hover:from-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"><Save className="w-3 h-3" /> Save</button>
              <button onClick={cancelEdit} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 font-bold text-[10px] border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"><X className="w-3 h-3" /> Cancel</button>
            </div>
          </div>
        )}

        {/* Provider list with config status */}
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Offerwall Lock Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {providers.map((p) => {
              const cfg = finalConfigs.find((c) => c.providerName === p.name);
              const configured = !!cfg;
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${configured ? (cfg!.isLocked ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20") : "bg-white/[0.02] border-white/5"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl ${p.bgLight} border ${p.border} flex items-center justify-center`}>
                      <span className={`text-[9px] font-bold bg-gradient-to-br ${p.color} text-transparent bg-clip-text`}>{p.initials}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-white">{p.name}</span>
                      {configured && (
                        <span className={`text-[8px] font-mono ${cfg!.isLocked ? "text-rose-400" : "text-emerald-400"}`}>
                          {cfg!.isLocked ? `🔒 ${cfg!.requiredCoins.toLocaleString()} coins` : "🔓 Unlocked"}
                        </span>
                      )}
                      {!configured && <span className="text-[8px] text-slate-600 font-mono">Not configured</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {configured ? (
                      <button onClick={() => startEdit(cfg!)} className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer" title="Edit"><Edit className="w-3 h-3" /></button>
                    ) : (
                      <button onClick={() => startAdd(p.name)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer" title="Configure"><Plus className="w-3 h-3" /></button>
                    )}
                    {configured && (
                      <button onClick={() => handleDelete(p.name)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {providers.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No providers available</p>}
        </div>

        {/* Unlock statistics */}
        {allUnlocks.length > 0 && (
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-cyan-400" /> Unlock Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-center">
                <span className="block text-lg font-bold text-white">{allUnlocks.length}</span>
                <span className="text-[9px] text-slate-400 font-mono">Total Unlocks</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <span className="block text-lg font-bold text-white">{allUnlocks.filter((u) => u.unlockedBy === "coins").length}</span>
                <span className="text-[9px] text-slate-400 font-mono">By Coins</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
                <span className="block text-lg font-bold text-white">{allUnlocks.filter((u) => u.unlockedBy === "promo").length}</span>
                <span className="text-[9px] text-slate-400 font-mono">By Promo Code</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (section === "locked-offers-promos") {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <button onClick={onBack} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors mb-2">&larr; Back</button>
        <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-400" /> Locked Offerwall Promo Codes
        </h1>

        {/* Create new promo */}
        <div className="bg-gradient-to-br from-slate-900 to-purple-950/60 p-5 rounded-3xl border border-white/5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400" /> Create Promo Code</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Promo Code</label>
              <div className="relative">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <input value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} placeholder="THEOREM2026" className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono uppercase placeholder-slate-700 focus:outline-none focus:border-cyan-500/20" />
              </div>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Assigned Offerwall</label>
              <select value={newPromo.offerwallName} onChange={(e) => setNewPromo({ ...newPromo, offerwallName: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20">
                {providers.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Usage Limit</label>
              <input type="number" value={newPromo.usageLimit} onChange={(e) => setNewPromo({ ...newPromo, usageLimit: parseInt(e.target.value) || 1 })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Expiry Date (optional)</label>
              <input type="date" value={newPromo.expiryDate} onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20 [color-scheme:dark]" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setNewPromo({ ...newPromo, active: !newPromo.active })} className={`relative w-9 h-4.5 rounded-full transition-all ${newPromo.active ? "bg-emerald-500" : "bg-slate-700"}`}>
                <span className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all" style={{ left: newPromo.active ? "calc(100% - 16px)" : "2px" }} />
              </button>
              <span className="text-[10px] text-slate-300 font-mono">{newPromo.active ? "Active" : "Inactive"}</span>
            </label>
            <button onClick={createPromo} className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 font-bold text-[10px] border border-purple-500/20 hover:from-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"><Plus className="w-3 h-3" /> Create</button>
          </div>
        </div>

        {/* Promo codes list */}
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">
            Existing Promo Codes
            {promoCodes.length > 0 && <span className="text-[10px] text-slate-500 font-mono ml-2">({promoCodes.length})</span>}
          </h3>
          {promoCodes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No promo codes created yet</p>
          ) : (
            <div className="space-y-2">
              {promoCodes.map((pc) => {
                const expired = pc.expiryDate ? new Date(pc.expiryDate) < new Date() : false;
                const isEditing = editingPromo?.id === pc.id;
                return (
                  <div key={pc.id} className={`p-3 rounded-2xl border transition-all ${isEditing ? "bg-cyan-500/5 border-cyan-500/20" : pc.active && !expired ? "bg-white/[0.02] border-white/5" : "bg-rose-500/5 border-rose-500/20"}`}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <input value={editingPromo.code} onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500/20" />
                          <select value={editingPromo.offerwallName} onChange={(e) => setEditingPromo({ ...editingPromo, offerwallName: e.target.value })} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20">
                            {providers.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                          <input type="number" value={editingPromo.usageLimit} onChange={(e) => setEditingPromo({ ...editingPromo, usageLimit: parseInt(e.target.value) || 1 })} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
                          <input type="date" value={editingPromo.expiryDate?.split("T")[0] || ""} onChange={(e) => setEditingPromo({ ...editingPromo, expiryDate: e.target.value || null })} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20 [color-scheme:dark]" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={savePromoEdit} className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/20 hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                          <button onClick={() => setEditingPromo(null)} className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 font-bold text-[9px] border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`px-2.5 py-1 rounded-lg font-bold text-[10px] font-mono tracking-wider ${pc.active && !expired ? "bg-purple-500/15 text-purple-300 border border-purple-500/25" : "bg-rose-500/15 text-rose-300 border border-rose-500/25"}`}>
                            {pc.code}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[10px] text-slate-300 font-semibold truncate">{pc.offerwallName}</span>
                            <span className="text-[8px] text-slate-500 font-mono">
                              {pc.usageCount} / {pc.usageLimit} uses
                              {pc.expiryDate && ` · Exp: ${new Date(pc.expiryDate).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => setEditingPromo({ ...pc })} className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer" title="Edit"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => togglePromoActive(pc.id, pc.active)} className={`p-1.5 rounded-lg border cursor-pointer transition-all ${pc.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20"}`} title={pc.active ? "Deactivate" : "Activate"}>
                            {pc.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                          </button>
                          <button onClick={() => deletePromo(pc.id)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
