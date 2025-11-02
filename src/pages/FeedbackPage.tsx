import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function FeedbackPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const event = useQuery(api.events.getEventById, { 
    eventId: eventId as Id<"events"> 
  });
  const user = useQuery(api.auth.loggedInUser);
  const hasSubmitted = useQuery(api.feedback.hasSubmittedFeedback, {
    eventId: eventId as Id<"events">
  });
  const submitFeedback = useMutation(api.feedback.submitFeedback);
  
  const [formData, setFormData] = useState({
    rating: 0,
    comments: "",
    suggestions: "",
    isAnonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if event has ended
  const eventEnded = event && event.endDate < Date.now();

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!eventEnded) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Feedback Not Available</h1>
          <p className="text-gray-600 mt-2">
            Feedback can only be submitted after the event has ended.
          </p>
          <Link 
            to={`/events/${eventId}`}
            className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Thank You!</h1>
          <p className="text-gray-600 mt-2">
            You have already submitted feedback for this event.
          </p>
          <Link 
            to={`/events/${eventId}`}
            className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!formData.comments.trim()) {
      toast.error("Please provide your feedback");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        eventId: eventId as Id<"events">,
        rating: formData.rating,
        comments: formData.comments,
        suggestions: formData.suggestions,
        isAnonymous: formData.isAnonymous,
      });
      
      toast.success("Thank you for your feedback!");
      navigate(`/events/${eventId}`);
    } catch (error) {
      toast.error("Failed to submit feedback");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`w-8 h-8 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400 transition-colors`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        
        <h1 className="text-3xl font-bold text-gray-900">Event Feedback</h1>
        <p className="text-gray-600 mt-2">
          Help us improve by sharing your experience at "{event.title}"
        </p>
      </div>

      {/* Event Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="font-semibold text-blue-900">{event.title}</h2>
        <p className="text-sm text-blue-700 mt-1">
          {new Date(event.startDate).toLocaleDateString()} • {event.location}
        </p>
      </div>

      {/* Feedback Form */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Rating *
            </label>
            <div className="flex items-center space-x-4">
              <StarRating 
                rating={formData.rating} 
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
              />
              <span className="text-sm text-gray-600">
                {formData.rating > 0 && (
                  <>
                    {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                    {formData.rating === 5 && " - Excellent!"}
                    {formData.rating === 4 && " - Very Good"}
                    {formData.rating === 3 && " - Good"}
                    {formData.rating === 2 && " - Fair"}
                    {formData.rating === 1 && " - Poor"}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
              Your Feedback *
            </label>
            <textarea
              id="comments"
              rows={5}
              required
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="What did you think about the event? Please share your experience..."
            />
          </div>

          {/* Suggestions */}
          <div>
            <label htmlFor="suggestions" className="block text-sm font-medium text-gray-700">
              Suggestions for Improvement
            </label>
            <textarea
              id="suggestions"
              rows={4}
              value={formData.suggestions}
              onChange={(e) => setFormData(prev => ({ ...prev, suggestions: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="How can we make future events better? Any specific suggestions?"
            />
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center">
            <input
              id="isAnonymous"
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-900">
              Submit feedback anonymously
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
            
            <Link
              to={`/events/${eventId}`}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
