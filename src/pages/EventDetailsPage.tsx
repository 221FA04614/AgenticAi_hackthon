import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [isRegistering, setIsRegistering] = useState(false);
  
  const event = useQuery(api.events.getEventWithOrganizer, { 
    eventId: eventId as Id<"events"> 
  });
  const user = useQuery(api.auth.loggedInUser);
  const registerForEvent = useMutation(api.events.registerForEvent);
  const myRegistrations = useQuery(api.events.getMyRegistrations);
  const hasSubmittedFeedback = useQuery(api.feedback.hasSubmittedFeedback, {
    eventId: eventId as Id<"events">
  });
  const seminarSummary = useQuery(api.feedback.getSeminarSummary, {
    eventId: eventId as Id<"events">
  });

  const isRegistered = myRegistrations?.some(reg => 
    reg.eventId === eventId && reg.status === "registered"
  );

  const handleRegister = async () => {
    if (!eventId) return;
    
    setIsRegistering(true);
    try {
      await registerForEvent({
        eventId: eventId as Id<"events">
      });
      toast.success("Successfully registered for the event!");
    } catch (error) {
      toast.error("Failed to register for the event");
      console.error(error);
    } finally {
      setIsRegistering(false);
    }
  };

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isOrganizer = user?.profile?.role === "organizer" && event.organizerId === user._id;
  const canRegister = user?.profile?.role === "attendee" && !isRegistered && 
                     0 < event.maxAttendees && 
                     event.status === "published";
  const eventEnded = event.endDate < Date.now();
  const canSubmitFeedback = isRegistered && eventEnded && !hasSubmittedFeedback;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/events"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>
      </div>

      {/* Event Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
                  {event.category}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  event.status === "published" 
                    ? "bg-green-100 text-green-800"
                    : event.status === "draft"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                {event.isVirtual && (
                  <span className="px-3 py-1 text-sm font-semibold bg-purple-100 text-purple-800 rounded-full">
                    Virtual
                  </span>
                )}
                {eventEnded && (
                  <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-800 rounded-full">
                    Completed
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-sm">
                        {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm">{event.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">Attendees</p>
                      <p className="text-sm">0 / {event.maxAttendees}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-sm">{event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ml-6 flex flex-col space-y-3">
              {isOrganizer && (
                <>
                  <Link
                    to={`/events/${eventId}/edit`}
                    className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors text-center"
                  >
                    Edit Event
                  </Link>
                  <Link
                    to={`/events/${eventId}/feedback-summary`}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
                  >
                    View Analytics
                  </Link>
                </>
              )}
              
              {canRegister && (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRegistering ? "Registering..." : "Register Now"}
                </button>
              )}
              
              {isRegistered && !eventEnded && (
                <div className="px-6 py-3 bg-green-100 text-green-800 font-medium rounded-lg text-center">
                  ✓ Registered
                </div>
              )}

              {canSubmitFeedback && (
                <Link
                  to={`/events/${eventId}/feedback`}
                  className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors text-center"
                >
                  Submit Feedback
                </Link>
              )}

              {isRegistered && eventEnded && hasSubmittedFeedback && (
                <div className="px-6 py-3 bg-blue-100 text-blue-800 font-medium rounded-lg text-center">
                  ✓ Feedback Submitted
                </div>
              )}
            </div>
          </div>

          {/* Seminar Summary (if published) */}
          {seminarSummary && seminarSummary.isPublished && (
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Event Summary & Analytics
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {seminarSummary.overallScore}/100
                  </div>
                  <div className="text-xs text-gray-600">Overall Score</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {seminarSummary.energyEfficiency}%
                  </div>
                  <div className="text-xs text-gray-600">Energy Efficiency</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {seminarSummary.iotData.temperature}°C
                  </div>
                  <div className="text-xs text-gray-600">Avg Temperature</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {seminarSummary.iotData.airQuality}
                  </div>
                  <div className="text-xs text-gray-600">Air Quality</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">AI-Generated Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {seminarSummary.summaryText.substring(0, 300)}...
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Organizer Info */}
          {event.organizer && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizer</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {event.organizer.firstName?.[0]}{event.organizer.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                  {event.organizer.organization && (
                    <p className="text-sm text-gray-600">{event.organizer.organization}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
