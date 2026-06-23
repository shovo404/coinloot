import { useState, useRef } from "react";
import { ShieldCheck, Upload, CheckCircle, AlertCircle, X, FileText, Camera, IdCard } from "lucide-react";
import { UserProfile } from "../types";

interface KycUploadPageProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

export default function KycUploadPage({ user, setUser }: KycUploadPageProps) {
  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [docType, setDocType] = useState<"passport" | "id_card" | "drivers_license">("id_card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  if (user.kyc_status === "APPROVED") {
    return (
      <div className="px-4 lg:px-8 py-8 max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">KYC Verified</h2>
          <p className="text-slate-400 text-sm">Your identity has been verified. You have full access to all features.</p>
          <div className="mt-6 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-semibold">Verified Account</span>
          </div>
        </div>
      </div>
    );
  }

  if (user.kyc_status === "PENDING") {
    return (
      <div className="px-4 lg:px-8 py-8 max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Pending</h2>
          <p className="text-slate-400 text-sm">Your documents are being reviewed. This usually takes 24-48 hours.</p>
          <div className="mt-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300 font-semibold">Under Review</span>
          </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = (file: File, setter: (v: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setter(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!docFront || !selfie) {
      setError("Please upload at least a front document photo and a selfie.");
      return;
    }
    setError("");
    setSubmitting(true);

    const kycData = { docFront, docBack, selfie, docType, submittedAt: new Date().toISOString() };
    localStorage.setItem(`coinloot_kyc_${user.id}`, JSON.stringify(kycData));

    const updatedUser = { ...user, kyc_status: "PENDING" as const };
    setUser(updatedUser);

    const stored = JSON.parse(localStorage.getItem("coinloot_user_profiles") || "[]");
    const idx = stored.findIndex((p: any) => p.id === user.id);
    if (idx >= 0) {
      stored[idx].kyc_status = "PENDING";
      localStorage.setItem("coinloot_user_profiles", JSON.stringify(stored));
    }

    setSubmitting(false);
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          KYC Verification
        </h1>
        <p className="text-slate-400 text-sm mt-1">Verify your identity to unlock all features and higher withdrawal limits.</p>
      </div>

      {/* Document Type */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Document Type</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "id_card" as const, label: "ID Card", icon: IdCard },
            { id: "passport" as const, label: "Passport", icon: FileText },
            { id: "drivers_license" as const, label: "Driver's License", icon: Camera },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDocType(opt.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
                docType === opt.id
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                  : "bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/20"
              }`}
            >
              <opt.icon className="w-6 h-6" />
              <span className="text-[10px] font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Front */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Front Side *</span>
          {docFront ? (
            <div className="relative">
              <img src={docFront} alt="Front" className="w-full h-32 object-contain rounded-xl bg-slate-900/60" />
              <button onClick={() => setDocFront(null)} className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => frontRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-all cursor-pointer">
              <Upload className="w-6 h-6" />
              <span className="text-[9px] font-mono">Tap to upload</span>
            </button>
          )}
          <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setDocFront)} />
        </div>

        {/* Back */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Back Side</span>
          {docBack ? (
            <div className="relative">
              <img src={docBack} alt="Back" className="w-full h-32 object-contain rounded-xl bg-slate-900/60" />
              <button onClick={() => setDocBack(null)} className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => backRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-all cursor-pointer">
              <Upload className="w-6 h-6" />
              <span className="text-[9px] font-mono">Optional</span>
            </button>
          )}
          <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setDocBack)} />
        </div>

        {/* Selfie */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Selfie *</span>
          {selfie ? (
            <div className="relative">
              <img src={selfie} alt="Selfie" className="w-full h-32 object-contain rounded-xl bg-slate-900/60" />
              <button onClick={() => setSelfie(null)} className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => selfieRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-all cursor-pointer">
              <Camera className="w-6 h-6" />
              <span className="text-[9px] font-mono">Tap to upload</span>
            </button>
          )}
          <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setSelfie)} />
        </div>
      </div>

      {error && <p className="text-rose-400 text-xs flex items-center gap-1.5"><AlertCircle className="w-3 h-3" />{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !docFront || !selfie}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? "Submitting..." : "Submit Verification"}
      </button>

      <p className="text-[9px] text-slate-500 text-center font-mono">Your documents are encrypted and securely stored. We never share your data.</p>
    </div>
  );
}
