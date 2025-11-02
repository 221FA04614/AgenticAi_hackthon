import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const event = useQuery(api.events.getEventById, { 
    eventId: eventId as Id<"events"> 
  });
  const user = useQuery(api.auth.loggedInUser);
  const updateEvent = useMutation(api.events.updateEvent);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    startDate: "",
    endDate: "",
    location: "",
    isVirtual: false,
    virtualLink: "",
    maxAttendees: 50,
    ticketPrice: 0,
    tags: [] as string[],
    status: "draft" as "draft" | "published" | "cancelled" | "completed",
  });
  
  const [tagInput, setTagInput] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateDescription = useAction(api.aiSimple.generateEventDescription);
  const generateTags = useAction(api.aiSimple.generateEventTags);

  // Populate form when event data loads
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        startDate: new Date(event.startDate).toISOString().slice(0, 16),
        endDate: new Date(event.endDate).toISOString().slice(0, 16),
        location: event.location,
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink || "",
        maxAttendees: event.maxAttendees,
        ticketPrice: event.ticketPrice,
        tags: event.tags || [],
        status: event.status,
      });
    }
  }, [event]);

  // Check if user is authorized to edit
  if (event && user && event.organizerId !== user._id) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You can only edit events you created.</p>
          <Link to={`/events/${eventId}`} className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = [
    "Technology", "Business", "Health", "Education", "Arts", "Sports", 
    "Networking", "Workshop", "Conference", "Seminar"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEvent({
        eventId: eventId as Id<"events">,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        location: formData.location,
        isVirtual: formData.isVirtual,
        virtualLink: formData.isVirtual ? formData.virtualLink : undefined,
        maxAttendees: formData.maxAttendees,
        ticketPrice: formData.ticketPrice,
        tags: formData.tags,
        status: formData.status,
      });
      
      toast.success("Event updated successfully!");
      navigate(`/events/${eventId}`);
    } catch (error) {
      toast.error("Failed to update event");
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
      const result = await generateDescription({
        eventTitle: formData.title,
        category: formData.category,
        basicDescription: formData.description || "Professional event",
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleGenerateTags = async () => {
    if (!formData.title || !formData.category || !formData.description) {
      toast.error("Please enter title, category, and description first");
      return;
    }

    setIsGeneratingTags(true);
    try {
      const result = await generateTags({
        eventTitle: formData.title,
        category: formData.category,
        description: formData.description,
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

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Event
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600 mt-2">Update your event details and publish when ready</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "draft" | "published" | "cancelled" }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.status === "draft" && "Event is not visible to attendees"}
                {formData.status === "published" && "Event is live and accepting registrations"}
                {formData.status === "cancelled" && "Event is cancelled"}
              </p>
            </div>
          </div>

          {/* AI-Enhanced Description */}
          <div>
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
                {isGeneratingDescription ? "Generating..." : "🤖 AI Generate"}
              </button>
            </div>
            <textarea
              id="description"
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your event or use AI to generate a compelling description"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date & Time *
              </label>
              <input
                id="startDate"
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date & Time *
              </label>
              <input
                id="endDate"
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Virtual Event Toggle */}
          <div className="flex items-center">
            <input
              id="isVirtual"
              type="checkbox"
              checked={formData.isVirtual}
              onChange={(e) => setFormData(prev => ({ ...prev, isVirtual: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isVirtual" className="ml-2 block text-sm text-gray-900">
              This is a virtual event
            </label>
          </div>

          {/* Location/Virtual Link */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              {formData.isVirtual ? "Virtual Meeting Link" : "Location"} *
            </label>
            <input
              id="location"
              type={formData.isVirtual ? "url" : "text"}
              required
              value={formData.isVirtual ? formData.virtualLink : formData.location}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                [formData.isVirtual ? 'virtualLink' : 'location']: e.target.value 
              }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={formData.isVirtual ? "https://zoom.us/j/..." : "Event venue address"}
            />
          </div>

          {/* Capacity and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
                Maximum Attendees *
              </label>
              <input
                id="maxAttendees"
                type="number"
                min="1"
                required
                value={formData.maxAttendees}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700">
                Ticket Price ($)
              </label>
              <input
                id="ticketPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.ticketPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, ticketPrice: parseFloat(e.target.value) || 0 }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00 for free events"
              />
            </div>
          </div>

          {/* AI-Enhanced Tags */}
          <div>
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
                {isGeneratingTags ? "Generating..." : "🤖 AI Generate Tags"}
              </button>
            </div>
            <div className="flex space-x-2 mb-2">
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
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Add
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

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Event"}
            </button>
            
            <Link
              to={`/events/${eventId}`}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
