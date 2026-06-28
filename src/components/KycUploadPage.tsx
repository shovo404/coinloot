import { useState, useRef, useCallback, useEffect } from "react";
import { ShieldCheck, Upload, CheckCircle, AlertCircle, X, FileText, Camera, IdCard, Lock, AlertTriangle, User, Calendar, Clock, RefreshCw } from "lucide-react";
import { UserProfile } from "../types";
import { submitKyc, getKycRecord, KycDocType } from "../utils/kycEngine";

interface KycUploadPageProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

function getRequiredFields(docType: KycDocType): { front: boolean; back: boolean; selfie: boolean } {
  switch (docType) {
    case "id_card":
    case "drivers_license":
      return { front: true, back: true, selfie: true };
    case "passport":
      return { front: true, back: false, selfie: true };
  }
}

export default function KycUploadPage({ user, setUser }: KycUploadPageProps) {
  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [docType, setDocType] = useState<KycDocType>("id_card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const existingRecord = getKycRecord(user.id);
  const required = getRequiredFields(docType);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  // Reset images when doc type changes
  useEffect(() => {
    const newReq = getRequiredFields(docType);
    if (!newReq.back) setDocBack(null);
  }, [docType]);

  if (user.kyc_status === "APPROVED") {
    return (
      <div className="px-4 lg:px-8 py-8 max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-8 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">KYC Verified</h2>
          <p className="text-slate-400 text-sm mb-1">Your identity has been verified.</p>
          <p className="text-emerald-400 text-xs font-semibold">You may now submit withdrawal requests.</p>
          {existingRecord && (
            <div className="mt-4 text-[9px] text-slate-500 font-mono">
              Verified on {new Date(existingRecord.reviewedAt || existingRecord.submittedAt).toLocaleDateString()}
            </div>
          )}
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
        <div className="glass rounded-3xl p-8 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Pending</h2>
          <p className="text-slate-400 text-sm">Your documents are being reviewed by our team.</p>
          {existingRecord && (
            <div className="mt-4 text-[9px] text-slate-500 font-mono">
              Submitted: {new Date(existingRecord.submittedAt).toLocaleString()}
            </div>
          )}
          <div className="mt-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300 font-semibold">Under Review</span>
          </div>
        </div>
      </div>
    );
  }

  if (user.kyc_status === "REJECTED") {
    return (
      <div className="px-4 lg:px-8 py-8 max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-8 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4">
            <X className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">KYC Verification Rejected</h2>
          {existingRecord?.adminNote ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-4 text-left">
              <p className="text-[10px] text-rose-300 font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Reason
              </p>
              <p className="text-sm text-slate-300">{existingRecord.adminNote}</p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm mb-4">Your verification was not approved. Please contact support or resubmit with correct documents.</p>
          )}
          <p className="text-[10px] text-slate-500 font-mono mb-6">You can resubmit your documents for review.</p>
          <button
            onClick={() => {
              const updated = { ...user, kyc_status: "NOT_STARTED" as const };
              setUser(updated);
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold hover:scale-[1.02] transition-all cursor-pointer"
          >
            Resubmit Documents
          </button>
        </div>
      </div>
    );
  }

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions in your browser settings.");
    }
  }, []);

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current || !cameraStream) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setSelfie(dataUrl);
    cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const cancelCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const handleImageUpload = (file: File, setter: (v: string) => void) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Supported: JPG, PNG, WEBP");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setter(e.target.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    // Per-doc-type validation
    if (!docFront) {
      setError(`Please upload a ${docType === "passport" ? "passport image" : "front side image"} of your document.`);
      return;
    }
    if (required.back && !docBack) {
      setError("Please upload the back side of your document.");
      return;
    }
    if (!selfie) {
      setError("Please capture a live selfie.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const record = await submitKyc({
        userId: user.id,
        username: user.username,
        email: user.email,
        country: user.country || user.registration_country || "Unknown",
        registrationDate: user.created_at || new Date().toISOString(),
        docType,
        docFront,
        docBack: required.back ? docBack : null,
        selfie,
      });

      if (record.status === "PENDING") {
        setUser({ ...user, kyc_status: "PENDING" });
      }
    } catch (err: any) {
      setError(err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
        <h3 className="text-white font-bold text-lg mb-2">Capture Live Selfie</h3>
        <p className="text-[10px] text-slate-500 font-mono mb-4">Position your face clearly in the frame</p>
        <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/30 max-w-md w-full">
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-2xl" />
          <div className="absolute inset-0 border-[3px] border-dashed border-cyan-400/40 rounded-2xl pointer-events-none" />
        </div>
        {cameraError && (
          <p className="text-rose-400 text-xs mt-3 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />{cameraError}</p>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={cancelCamera} className="px-5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold hover:border-white/20 transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={captureSelfie} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer">
            <Camera className="w-4 h-4" /> Capture Photo
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <p className="text-[8px] text-slate-600 font-mono mt-4">Camera capture only — gallery upload not accepted for selfie</p>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          Identity Verification
        </h1>
        <p className="text-slate-400 text-sm mt-1">Complete KYC verification to unlock withdrawals and all features.</p>
      </div>

      {user.kyc_required && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-300">KYC Verification Required</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Your account requires identity verification. Withdrawal features are locked until verification is approved.</p>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-5 space-y-4">
        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Select Document Type</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "id_card" as KycDocType, label: "National ID", icon: IdCard },
            { id: "passport" as KycDocType, label: "Passport", icon: FileText },
            { id: "drivers_license" as KycDocType, label: "Driving License", icon: Camera },
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
              <span className="text-[9px] font-semibold text-center">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 space-y-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Front Side <span className="text-rose-400">*</span></span>
          {docFront ? (
            <div className="relative group">
              <img src={docFront} alt="Front" className="w-full h-36 object-contain rounded-xl bg-slate-900/60" />
              <button onClick={() => setDocFront(null)} className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => frontRef.current?.click()} className="w-full h-36 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-all cursor-pointer">
              <Upload className="w-6 h-6" />
              <span className="text-[9px] font-mono">JPG, PNG, WEBP</span>
              <span className="text-[8px] text-slate-600">Max 10 MB</span>
            </button>
          )}
          <input ref={frontRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setDocFront)} />
        </div>

        <div className={`glass rounded-2xl p-5 space-y-3 ${!required.back ? "opacity-40 pointer-events-none" : ""}`}>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Back Side
            {required.back ? <span className="text-rose-400"> *</span> : <span className="text-slate-600"> (optional)</span>}
          </span>
          {docBack ? (
            <div className="relative group">
              <img src={docBack} alt="Back" className="w-full h-36 object-contain rounded-xl bg-slate-900/60" />
              <button onClick={() => setDocBack(null)} className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => backRef.current?.click()} className="w-full h-36 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-all cursor-pointer">
              <Upload className="w-6 h-6" />
              <span className="text-[9px] font-mono">{required.back ? "JPG, PNG, WEBP" : "Not required"}</span>
            </button>
          )}
          <input ref={backRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setDocBack)} />
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3">
        <span className="text-[10px] font-mono text-slate-400 uppercase">Live Selfie <span className="text-rose-400">*</span></span>
        {selfie ? (
          <div className="relative group">
            <img src={selfie} alt="Selfie" className="w-full h-48 object-contain rounded-xl bg-slate-900/60" />
            <button onClick={() => setSelfie(null)} className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><X className="w-3 h-3" /></button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              <button onClick={startCamera} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[8px] font-bold hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Retake
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button onClick={startCamera} className="w-full h-48 rounded-xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 flex flex-col items-center justify-center gap-2 text-purple-400 hover:border-purple-500/60 hover:bg-purple-500/10 transition-all cursor-pointer">
              <Camera className="w-10 h-10" />
              <span className="text-xs font-bold">Open Camera</span>
              <span className="text-[9px] text-slate-500">Capture live selfie</span>
            </button>
            <p className="text-[8px] text-slate-600 text-center font-mono">Camera capture required. Gallery upload not accepted for selfie.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
          <Lock className="w-3 h-3" /> Encrypted upload
        </div>
        <div className="text-[9px] text-slate-500 font-mono">
          Supported: JPG, PNG, WEBP — Max 10 MB
        </div>
      </div>

      {error && <p className="text-rose-400 text-xs flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? "Submitting..." : "Submit Verification"}
      </button>

      <p className="text-[9px] text-slate-500 text-center font-mono">Your documents are encrypted and securely stored. We never share your data.</p>
    </div>
  );
}
