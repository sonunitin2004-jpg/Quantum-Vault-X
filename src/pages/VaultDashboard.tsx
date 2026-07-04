import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import {
  Image,
  FileText,
  Video,
  Download,
  Trash2,
  ShieldCheck,
  Power,
  Upload,
} from "lucide-react";
import { NavigateFn } from "../types/navigation";

import { deriveKyberKeyPair, encryptQuantumFile, decryptQuantumFile } from "../lib/crypto/pqc";
import QuantumVaultTitle from "../components/QuantumVaultTitle";

/* ───────────────── TYPES ───────────────── */

interface VaultFile {
  id: string;
  user_id: string;
  file_name: string;
  file_type: "image" | "video" | "document";
  storage_path: string;
  created_at: string;
}

interface Props {
  onNavigate: NavigateFn;
}

type Tab = "images" | "documents" | "videos";

/* ───────────────── COMPONENT ───────────────── */

export default function VaultDashboard({ onNavigate }: Props) {
  const { user, signOut, neuralPassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [tab, setTab] = useState<Tab>("images");
  const [accept, setAccept] = useState("");

  const [cryptoStatus, setCryptoStatus] = useState<string | null>(null);

  /* ───────── LOAD FILES ───────── */

  const loadFiles = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("vault_files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Load files error:", error);
      return;
    }

    setFiles(data || []);
  };

  useEffect(() => {
    loadFiles();
  }, [user]);

  /* ───────── FILE PICKER ───────── */

  const openPicker = (acceptType: string) => {
    setAccept(acceptType);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleUpload = async (file: File | null) => {
    if (!user || !file) return;
    if (!neuralPassword) {
      alert("Neural key session expired. Please re-authenticate.");
      onNavigate("neural-login");
      return;
    }

    try {
      setCryptoStatus("Deriving post-quantum keys…");
      const [pk] = await deriveKyberKeyPair(neuralPassword);

      setCryptoStatus("Encrypting file…");
      const encryptedBlob = await encryptQuantumFile(
        file,
        pk,
        (p) => setCryptoStatus(`Encrypting ${p}%`)
      );

      const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}.qvx`;

      const { error: uploadError } = await supabase.storage
        .from("qx-vault")
        .upload(storagePath, encryptedBlob);

      if (uploadError) throw uploadError;

      let type: "image" | "video" | "document" = "document";
      if (file.type.startsWith("image")) type = "image";
      else if (file.type.startsWith("video")) type = "video";

      const { error: dbError } = await supabase.from("vault_files").insert({
        user_id: user.id,
        file_name: file.name,
        file_type: type,
        storage_path: storagePath,
      });

      if (dbError) throw dbError;

      await loadFiles();
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Upload failed");
    } finally {
      setCryptoStatus(null);
    }
  };

  const downloadFile = async (file: VaultFile) => {
    if (!user) return;
    if (!neuralPassword) {
      alert("Neural key session expired. Please re-authenticate.");
      onNavigate("neural-login");
      return;
    }

    try {
      setCryptoStatus("Deriving post-quantum keys…");
      const [, sk] = await deriveKyberKeyPair(neuralPassword);

      setCryptoStatus("Downloading file…");
      const { data, error } = await supabase.storage
        .from("qx-vault")
        .download(file.storage_path);

      if (error || !data) throw error;

      setCryptoStatus("Decrypting file…");
      const decryptedBlob = await decryptQuantumFile(
        data,
        sk,
        (p) => setCryptoStatus(`Decrypting ${p}%`)
      );

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Download failed:", err);
      alert("Download failed");
    } finally {
      setCryptoStatus(null);
    }
  };

  /* ───────── DELETE ───────── */

  const deleteFile = async (file: VaultFile) => {
    const { error: storageError } = await supabase.storage
      .from("qx-vault")
      .remove([file.storage_path]);

    if (storageError) {
      alert("Storage delete failed");
      return;
    }

    const { error: dbError } = await supabase
      .from("vault_files")
      .delete()
      .eq("id", file.id);

    if (dbError) {
      alert("Database delete failed");
      return;
    }

    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  };

  /* ───────── LOGOUT ───────── */

  const logout = async () => {
    await signOut();
    onNavigate("signin");
  };

  /* ───────── FILTER ───────── */

  const filtered = files.filter((f) => {
    if (tab === "images") return f.file_type === "image";
    if (tab === "videos") return f.file_type === "video";
    return f.file_type === "document";
  });

  /* ───────────────── UI ───────────────── */

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => handleUpload(e.target.files?.[0] || null)}
      />

      <GlassCard className="w-full max-w-5xl p-8">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-semibold">
  <QuantumVaultTitle />
</h1>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={() =>
                openPicker(
                  tab === "images"
                    ? "image/*"
                    : tab === "videos"
                    ? "video/*"
                    : ".pdf,.doc,.docx,.txt"
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            >
              <Upload className="w-4 h-4" />
              Upload
            </GlassButton>

            <button
              onClick={logout}
              className="p-2 rounded-full bg-white/10 hover:bg-red-500/20"
            >
              <Power className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* STATUS */}
        {cryptoStatus && (
          <div className="mb-4 text-cyan-400 text-sm text-center">
            {cryptoStatus}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-6 mb-6 text-sm">
          <button onClick={() => setTab("images")} className={tab === "images" ? "text-cyan-400" : "text-gray-400"}>
            <Image className="inline w-4 h-4" /> Images
          </button>
          <button onClick={() => setTab("documents")} className={tab === "documents" ? "text-cyan-400" : "text-gray-400"}>
            <FileText className="inline w-4 h-4" /> Documents
          </button>
          <button onClick={() => setTab("videos")} className={tab === "videos" ? "text-cyan-400" : "text-gray-400"}>
            <Video className="inline w-4 h-4" /> Videos
          </button>
        </div>

        {/* EMPTY */}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No files in this vault
          </div>
        )}

        {/* FILE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((file) => (
            <GlassCard key={file.id} className="p-4 flex flex-col gap-3">
              <div className="h-32 rounded-lg bg-black/30 flex items-center justify-center">
                {file.file_type === "image" && <Image />}
                {file.file_type === "video" && <Video />}
                {file.file_type === "document" && <FileText />}
              </div>

              <div className="text-white text-sm truncate">
                {file.file_name}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile(file)}
                  className="flex-1 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm"
                >
                  <Download className="inline w-4 h-4" /> Download
                </button>

                <button
                  onClick={() => deleteFile(file)}
                  className="flex-1 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm"
                >
                  <Trash2 className="inline w-4 h-4" /> Delete
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}















