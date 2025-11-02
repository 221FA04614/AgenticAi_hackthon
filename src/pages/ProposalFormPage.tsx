import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ProposalFormPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    expectedAttendees: 50,
    preferredDate: "",
    duration: 2,
    facilitiesRequired: [] as string[],
    tags: [] as string[],
    justification: "",
    targetAudience: "",
    learningObjectives: "",
  });
  
  const [tagInput, setTagInput] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitProposal = useMutation(api.workflows.submitProposal);
  const generateProposalDescription = useAction(api.ai.generateProposalDescription);
  const generateProposalTags = useAction(api.ai.generateProposalTags);
  const navigate = useNavigate();

  const categories = [
    "Technology", "Business", "Health", "Education", "Arts", "Sports", 
    "Networking", "Workshop", "Conference", "Seminar", "Research"
  ];

  const availableFacilities = [
    "SmartBoard", "Computers", "High-Speed WiFi", "Premium Sound System", 
    "Air Conditioning", "Microphones", "Projector", "Recording Equipment",
    "Live Streaming Setup", "Breakout Rooms"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || 
        !formData.preferredDate || !formData.justification) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitProposal({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        expectedAttendees: formData.expectedAttendees,
        preferredDate: new Date(formData.preferredDate).getTime(),
        duration: formData.duration,
        facilitiesRequired: formData.facilitiesRequired,
        tags: formData.tags,
        justification: formData.justification,
        targetAudience: formData.targetAudience,
        learningObjectives: formData.learningObjectives,
      });
      
      toast.success("Proposal submitted successfully! AI is now processing your request.");
      navigate("/my-proposals");
    } catch (error) {
      toast.error("Failed to submit proposal");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.category) {
      toast.error("Please enter event title and category first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const result = await generateProposalDescription({
        eventTitle: formData.title,
        category: formData.category,
        targetAudience: formData.targetAudience || "University students and professionals",
        learningObjectives: formData.learningObjectives || "Professional development",
        justification: formData.justification || "Educational value",
      });

      if (result.success) {
        setFormData(prev => ({ ...prev, description: result.content || prev.description }));
        toast.success("Description generated successfully!");
      } else {
        toast.error("Failed to generate description");
      }
    } catch (error) {
      toast.error("Failed to generate description");
      console.error(error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!formData.title || !formData.category || !formData.description) {
      toast.error("Please enter title, category, and description first");
      return;
    }

    setIsGeneratingTags(true);
    try {
      const result = await generateProposalTags({
        eventTitle: formData.title,
        category: formData.category,
        description: formData.description,
        targetAudience: formData.targetAudience,
      });

      if (result.success && result.tags) {
        setFormData(prev => ({ ...prev, tags: result.tags || [] }));
        toast.success("Tags generated successfully!");
      } else {
        toast.error("Failed to generate tags");
      }
    } catch (error) {
      toast.error("Failed to generate tags");
      console.error(error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const toggleFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilitiesRequired: prev.facilitiesRequired.includes(facility)
        ? prev.facilitiesRequired.filter(f => f !== facility)
        : [...prev.facilitiesRequired, facility]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit Event Proposal</h1>
        <p className="text-gray-600 mt-2">Propose a new event with AI assistance for approval</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expectedAttendees" className="block text-sm font-medium text-gray-700">
                Expected Attendees *
              </label>
              <input
                id="expectedAttendees"
                type="number"
                required
                min="1"
                value={formData.expectedAttendees}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedAttendees: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700">
                Preferred Date *
              </label>
              <input
                id="preferredDate"
                type="datetime-local"
                required
                value={formData.preferredDate}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Duration (hours) *
              </label>
              <input
                id="duration"
                type="number"
                required
                min="0.5"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* AI-Enhanced Description */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🤖 Event Description</h2>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isGeneratingDescription ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Generate
                  </>
                )}
              </button>
            </div>
            <textarea
              id="description"
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your event or use AI to generate a compelling description"
            />
          </div>
        </div>

        {/* Target Audience & Learning Objectives */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                Target Audience
              </label>
              <input
                id="targetAudience"
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Computer Science students, Business professionals"
              />
            </div>

            <div>
              <label htmlFor="learningObjectives" className="block text-sm font-medium text-gray-700">
                Learning Objectives
              </label>
              <textarea
                id="learningObjectives"
                rows={3}
                value={formData.learningObjectives}
                onChange={(e) => setFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="What will attendees learn or gain from this event?"
              />
            </div>

            <div>
              <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
                Event Justification *
              </label>
              <textarea
                id="justification"
                required
                rows={4}
                value={formData.justification}
                onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Why is this event important? What value will it provide?"
              />
            </div>
          </div>
        </div>

        {/* Facilities Required */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Required Facilities</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableFacilities.map(facility => (
              <label key={facility} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.facilitiesRequired.includes(facility)}
                  onChange={() => toggleFacility(facility)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">{facility}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI-Enhanced Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🤖 Event Tags</h2>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <button
                type="button"
                onClick={handleGenerateTags}
                disabled={isGeneratingTags}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isGeneratingTags ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Generate Tags
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a tag manually..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Add Tag
            </button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Submitting...
              </>
            ) : (
              "Submit Proposal"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
