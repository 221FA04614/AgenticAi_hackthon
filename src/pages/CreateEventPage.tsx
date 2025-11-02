import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function CreateEventPage() {
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
    facilitiesRequired: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSelectingHall, setIsSelectingHall] = useState(false);
  const [selectedHall, setSelectedHall] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const generateDescription = useAction(api.aiSimple.generateEventDescription);
  const generateTags = useAction(api.aiSimple.generateEventTags);
  const selectHall = useAction(api.halls.selectOptimalHall);
  const navigate = useNavigate();

  const categories = [
    "Technology", "Business", "Health", "Education", "Arts", "Sports", 
    "Networking", "Workshop", "Conference", "Seminar"
  ];

  const availableFacilities = [
    "SmartBoard", "Computers", "High-Speed WiFi", "Premium Sound System", 
    "Air Conditioning", "Microphones", "Projector", "Recording Equipment",
    "Live Streaming Setup", "Breakout Rooms"
  ];

  const handleSubmit = async (e: React.FormEvent, publishImmediately = false) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || 
        !formData.startDate || !formData.endDate || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        ...formData,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        facilitiesRequired: formData.facilitiesRequired,
      };

      const eventId = await createEvent(eventData);
      
      // If user wants to publish immediately, update the status
      if (publishImmediately) {
        await updateEvent({
          eventId,
          status: "published"
        });
        toast.success("Event created and published successfully!");
      } else {
        toast.success("Event created as draft successfully!");
      }
      
      navigate(`/events/${eventId}`);
    } catch (error) {
      toast.error("Failed to create event");
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
        basicDescription: formData.description || "A professional event",
        targetAudience: "University students and professionals",
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

  const handleSelectHall = async () => {
    if (!formData.category || !formData.maxAttendees || !formData.startDate) {
      toast.error("Please fill in event category, attendee count, and date first");
      return;
    }

    setIsSelectingHall(true);
    try {
      const result = await selectHall({
        eventType: formData.category,
        participantCount: formData.maxAttendees,
        facilitiesRequired: formData.facilitiesRequired,
        eventDate: new Date(formData.startDate).getTime(),
        eventDuration: 3, // Default 3 hours
      });

      if (result.success) {
        setSelectedHall(result.recommendation);
        setFormData(prev => ({ 
          ...prev, 
          location: result.recommendation.selectedHall 
        }));
        toast.success("Optimal hall selected by AI!");
      } else {
        toast.error("Failed to select hall");
      }
    } catch (error) {
      toast.error("Failed to select hall");
      console.error(error);
    } finally {
      setIsSelectingHall(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600 mt-2">Plan your next amazing event with AI assistance</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
              <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
                Max Attendees *
              </label>
              <input
                id="maxAttendees"
                type="number"
                required
                min="1"
                value={formData.maxAttendees}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date *
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
                End Date *
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
                onChange={(e) => setFormData(prev => ({ ...prev, ticketPrice: parseFloat(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* AI Hall Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🤖 AI Hall Selection</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Required Facilities
            </label>
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

          <div className="flex items-center space-x-4 mb-4">
            <button
              type="button"
              onClick={handleSelectHall}
              disabled={isSelectingHall}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSelectingHall ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Selecting Hall...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Select Optimal Hall
                </>
              )}
            </button>
          </div>

          {selectedHall && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">
                🎯 AI Recommendation: {selectedHall.selectedHall}
              </h3>
              <p className="text-sm text-purple-800 mb-2">
                <strong>Match Score:</strong> {selectedHall.matchScore}/100
              </p>
              <p className="text-sm text-purple-700 mb-3">{selectedHall.reasoning}</p>
              {selectedHall.alternativeHalls && (
                <p className="text-xs text-purple-600">
                  <strong>Alternatives:</strong> {selectedHall.alternativeHalls.join(", ")}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location/Hall *
            </label>
            <input
              id="location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter location or select using AI"
            />
          </div>
        </div>

        {/* Description with AI Generation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Description</h2>
          
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

        {/* Virtual Event Options */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Format</h2>
          
          <div className="flex items-center mb-4">
            <input
              id="isVirtual"
              type="checkbox"
              checked={formData.isVirtual}
              onChange={(e) => setFormData(prev => ({ ...prev, isVirtual: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <label htmlFor="isVirtual" className="ml-2 text-sm font-medium text-gray-700">
              This is a virtual event
            </label>
          </div>

          {formData.isVirtual && (
            <div>
              <label htmlFor="virtualLink" className="block text-sm font-medium text-gray-700">
                Virtual Event Link
              </label>
              <input
                id="virtualLink"
                type="url"
                value={formData.virtualLink}
                onChange={(e) => setFormData(prev => ({ ...prev, virtualLink: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}
        </div>

        {/* Tags */}
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
                {isGeneratingTags ? "Generating..." : "🤖 AI Generate Tags"}
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
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Publishing..." : "Create & Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
