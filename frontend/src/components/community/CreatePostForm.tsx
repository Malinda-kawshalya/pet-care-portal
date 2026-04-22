import { useState } from "react";
import { Send, AlertCircle } from "lucide-react";

interface CreatePostFormProps {
  onSubmit: (data: CreatePostData) => Promise<void>;
  isLoading?: boolean;
}

export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const CATEGORIES = [
  { value: "general", label: "General Discussion" },
  { value: "tips", label: "Tips & Advice" },
  { value: "questions", label: "Questions" },
  { value: "success-stories", label: "Success Stories" },
  { value: "lost-found", label: "Lost & Found" },
  { value: "events", label: "Events" },
  { value: "other", label: "Other" },
];

export default function CreatePostForm({ onSubmit, isLoading = false }: CreatePostFormProps) {
  const [formData, setFormData] = useState<CreatePostData>({
    title: "",
    content: "",
    category: "general",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();

      if (formData.tags.includes(tagInput.toLowerCase())) {
        setError("Tag already added");
        return;
      }

      if (formData.tags.length >= 5) {
        setError("Maximum 5 tags allowed");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.toLowerCase()],
      }));
      setTagInput("");
      setError(null);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (formData.title.length < 5) {
      setError("Title must be at least 5 characters");
      return;
    }

    if (!formData.content.trim()) {
      setError("Content is required");
      return;
    }

    if (formData.content.length < 10) {
      setError("Content must be at least 10 characters");
      return;
    }

    try {
      await onSubmit(formData);
      setSuccess(true);
      setFormData({
        title: "",
        content: "",
        category: "general",
        tags: [],
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Create a New Post</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium">Post created successfully!</p>
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Post Title
        </label>
        <input
          type="text"
          name="title"
          placeholder="What do you want to share?"
          value={formData.title}
          onChange={handleInputChange}
          maxLength={200}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-gray-500 text-xs mt-1">
          {formData.title.length}/200 characters
        </p>
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          name="content"
          placeholder="Share your thoughts, tips, or questions..."
          value={formData.content}
          onChange={handleInputChange}
          rows={6}
          maxLength={5000}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-gray-500 text-xs mt-1">
          {formData.content.length}/5000 characters
        </p>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags (up to 5)
        </label>
        <input
          type="text"
          placeholder="Add a tag and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          maxLength={50}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
        />
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-700 hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || success}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors inline-flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {isLoading ? "Creating..." : success ? "Posted!" : "Post to Community"}
      </button>
    </form>
  );
}
