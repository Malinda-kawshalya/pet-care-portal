"use client";

import { useState } from "react";
import { RefreshCw, Download, Loader } from "lucide-react";
import { regenerateCareGuide, downloadCareGuidePdf } from "@/lib/care-guide";

type CareGuideActionsProps = {
  petId: string;
  isAdmin: boolean;
  isVet: boolean;
  onRegenerate: () => void;
  petName: string;
};

export function CareGuideActions({
  petId,
  isAdmin,
  isVet,
  onRegenerate,
  petName,
}: CareGuideActionsProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      await regenerateCareGuide(petId);
      onRegenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate care guide");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const response = await downloadCareGuidePdf(petId);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${petName}_care_guide.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download care guide");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Download Guide
        </button>

        {(isAdmin || isVet) && (
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isRegenerating ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Regenerate Guide
          </button>
        )}
      </div>
    </div>
  );
}
