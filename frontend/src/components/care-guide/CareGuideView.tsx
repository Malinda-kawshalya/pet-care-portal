"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { getCareGuide, submitVetCareGuide, type CareGuide } from "@/lib/care-guide";
import { VerificationBadge } from "./VerificationBadge";
import { CareGuideActions } from "./CareGuideActions";

type CareGuideViewProps = {
  petId: string;
  userRole: string;
};

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="mb-4 mt-6 text-3xl font-bold text-gray-900">
          {line.substring(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="mb-3 mt-5 text-2xl font-bold text-gray-800">
          {line.substring(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="mb-2 mt-4 text-xl font-bold text-gray-700">
          {line.substring(4)}
        </h3>
      );
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={key++}
          className="my-3 border-l-4 border-blue-500 bg-blue-50 py-2 pl-4 text-gray-700 italic"
        >
          {line.substring(2)}
        </blockquote>
      );
    }
    // List items
    else if (line.startsWith("- ")) {
      elements.push(
        <li key={key++} className="ml-4 text-gray-700">
          {line.substring(2)}
        </li>
      );
    }
    // Paragraph
    else if (line.trim()) {
      elements.push(
        <p key={key++} className="mb-3 text-gray-700 leading-relaxed">
          {line}
        </p>
      );
    }
    // Empty line
    else {
      elements.push(<div key={key++} className="mb-2" />);
    }
  }

  return elements;
}

export function CareGuideView({ petId, userRole }: CareGuideViewProps) {
  const [guide, setGuide] = useState<CareGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vetDraft, setVetDraft] = useState("");
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const fetchGuide = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCareGuide(petId);
      setGuide(response.data?.guide || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load care guide");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuide();
  }, [petId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={24} />
        <span className="ml-3 text-gray-600">Loading care guide...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
        No care guide found for this pet. Please contact an administrator.
      </div>
    );
  }

  const isAdmin = userRole === "super_admin";
  const isVet = userRole === "veterinarian";

  async function handleVetDraftSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vetDraft.trim()) {
      return;
    }

    try {
      setSubmittingDraft(true);
      setSubmitMessage(null);
      await submitVetCareGuide(petId, vetDraft.trim());
      setVetDraft("");
      setSubmitMessage("Guide submitted for admin approval.");
      await fetchGuide();
    } catch (submitError) {
      setSubmitMessage(submitError instanceof Error ? submitError.message : "Unable to submit guide");
    } finally {
      setSubmittingDraft(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{guide.pet.name} Care Guide</h1>
            <p className="mt-1 text-sm text-gray-600">
              Version {guide.version} • Updated {new Date(guide.updatedAt).toLocaleDateString()}
            </p>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Approval: {guide.approvalStatus.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Badge and Actions */}
      <div className="space-y-4">
        <VerificationBadge
          vetVerified={guide.vetVerified}
          verifiedAt={guide.verifiedAt ?? undefined}
          verifiedBy={guide.verifiedBy}
        />
        <CareGuideActions
          petId={petId}
          isAdmin={isAdmin}
          isVet={isVet}
          onRegenerate={fetchGuide}
          petName={guide.pet.name}
        />
      </div>

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* Content */}
      <div className="prose max-w-none rounded-lg bg-gray-50 p-6">{renderMarkdown(guide.content)}</div>

      {isVet ? (
        <form onSubmit={handleVetDraftSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-gray-900">Submit Vet Authored Guide</h3>
          <p className="mt-1 text-sm text-gray-600">
            Your guide will be published after super admin approval.
          </p>
          <textarea
            value={vetDraft}
            onChange={(event) => setVetDraft(event.target.value)}
            rows={8}
            placeholder="Write your professional care guide in markdown..."
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {submitMessage ? <p className="mt-2 text-sm text-[#1d4ed8]">{submitMessage}</p> : null}
          <button
            type="submit"
            disabled={submittingDraft || !vetDraft.trim()}
            className="mt-3 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submittingDraft ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      ) : null}

      {/* Pet Info Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-gray-900">Pet Information</h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-600">Species</dt>
            <dd className="font-medium text-gray-900">{guide.pet.species}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Breed</dt>
            <dd className="font-medium text-gray-900">{guide.pet.breed}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Age</dt>
            <dd className="font-medium text-gray-900">{guide.pet.age} months</dd>
          </div>
          {guide.pet.healthStatus && (
            <div>
              <dt className="text-gray-600">Health Status</dt>
              <dd className="font-medium text-gray-900">{guide.pet.healthStatus}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Adopter Info Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-gray-900">Adopter Information</h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-gray-600">Name</dt>
            <dd className="font-medium text-gray-900">{guide.adopter.fullName}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Email</dt>
            <dd className="font-medium text-gray-900">{guide.adopter.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
