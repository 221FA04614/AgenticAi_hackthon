import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function FeedbackSummaryPage() {
  const { eventId } = useParams<{ eventId: string }>();
  
  const event = useQuery(api.events.getEventById, { 
    eventId: eventId as Id<"events"> 
  });
  const user = useQuery(api.auth.loggedInUser);
  const feedbackData = useQuery(api.feedback.getEventFeedback, {
    eventId: eventId as Id<"events">
  });
  const existingSummary = useQuery(api.feedback.getFeedbackSummary, {
    eventId: eventId as Id<"events">
  });
  const seminarSummary = useQuery(api.feedback.getSeminarSummary, {
    eventId: eventId as Id<"events">
  });
  
  const generateSummary = useAction(api.feedback.generateFeedbackSummary);
  const generateSeminarSummary = useAction(api.feedback.generateSeminarSummary);
  const publishSummary = useMutation(api.feedback.publishSeminarSummary);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSeminar, setIsGeneratingSeminar] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is the organizer
  if (!user || event.organizerId !== user._id) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">Only the event organizer can view feedback summaries.</p>
          <Link to={`/events/${eventId}`} className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSummary({ eventId: eventId as Id<"events"> });
      if (result.success) {
        toast.success("Feedback summary generated successfully!");
      } else {
        toast.error(result.error || "Failed to generate summary");
      }
    } catch (error) {
      toast.error("Failed to generate feedback summary");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSeminarSummary = async () => {
    setIsGeneratingSeminar(true);
    try {
      const result = await generateSeminarSummary({ eventId: eventId as Id<"events"> });
      if (result.success) {
        toast.success("Seminar summary generated successfully!");
      } else {
        toast.error(result.error || "Failed to generate seminar summary");
      }
    } catch (error) {
      toast.error("Failed to generate seminar summary");
      console.error(error);
    } finally {
      setIsGeneratingSeminar(false);
    }
  };

  const handlePublishSummary = async () => {
    if (!seminarSummary) return;
    
    setIsPublishing(true);
    try {
      await publishSummary({ summaryId: seminarSummary._id });
      toast.success("Seminar summary published successfully!");
    } catch (error) {
      toast.error("Failed to publish seminar summary");
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        
        <h1 className="text-3xl font-bold text-gray-900">Event Analytics & Summaries</h1>
        <p className="text-gray-600 mt-2">
          AI-powered insights and summaries for "{event.title}"
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feedback Summary Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📊 Feedback Analysis</h2>
              {!existingSummary && feedbackData && feedbackData.feedbacks.length > 0 && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate AI Summary
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Feedback Statistics */}
            {feedbackData && (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {feedbackData.statistics.totalResponses}
                    </div>
                    <div className="text-sm text-blue-800">Total Responses</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {feedbackData.statistics.averageRating}/5
                    </div>
                    <div className="text-sm text-green-800">Average Rating</div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Rating Distribution</h4>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <span className="w-8 text-sm">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${
                              feedbackData.statistics.totalResponses > 0
                                ? (feedbackData.statistics.ratingDistribution[rating as keyof typeof feedbackData.statistics.ratingDistribution] / feedbackData.statistics.totalResponses) * 100
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>
                      <span className="w-8 text-sm text-gray-600">
                        {feedbackData.statistics.ratingDistribution[rating as keyof typeof feedbackData.statistics.ratingDistribution]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {existingSummary && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Positive Highlights</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                    {existingSummary.positivePoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">⚠️ Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                    {existingSummary.recurringProblems.map((problem, index) => (
                      <li key={index}>{problem}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">💡 Actionable Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    {existingSummary.actionableImprovements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">📝 Overall Summary</h3>
                  <p className="text-sm text-gray-700">{existingSummary.rawSummary}</p>
                </div>
              </div>
            )}

            {feedbackData && feedbackData.feedbacks.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l2.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                <p className="text-gray-600">No feedback received yet</p>
                <p className="text-sm text-gray-500 mt-1">Attendees can submit feedback after the event ends</p>
              </div>
            )}
          </div>
        </div>

        {/* Seminar Summary Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">🏢 Seminar Summary</h2>
              <div className="flex space-x-2">
                {!seminarSummary && event.endDate < Date.now() && (
                  <button
                    onClick={handleGenerateSeminarSummary}
                    disabled={isGeneratingSeminar}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isGeneratingSeminar ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Generate Summary
                      </>
                    )}
                  </button>
                )}
                {seminarSummary && !seminarSummary.isPublished && (
                  <button
                    onClick={handlePublishSummary}
                    disabled={isPublishing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isPublishing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Publish Summary
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {seminarSummary && (
              <div className="space-y-6">
                {/* IoT Data Visualization */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">
                      {seminarSummary.iotData.temperature}°C
                    </div>
                    <div className="text-sm text-blue-800">Avg Temperature</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                      {seminarSummary.iotData.attendanceCount}
                    </div>
                    <div className="text-sm text-green-800">Attendance</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-600">
                      {seminarSummary.energyEfficiency}%
                    </div>
                    <div className="text-sm text-yellow-800">Energy Efficiency</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-purple-600">
                      {seminarSummary.overallScore}/100
                    </div>
                    <div className="text-sm text-purple-800">Overall Score</div>
                  </div>
                </div>

                {/* Detailed IoT Metrics */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">📊 Technical Metrics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Microphone Usage:</span>
                      <span className="ml-2 font-medium">{seminarSummary.iotData.micUsage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Energy Consumption:</span>
                      <span className="ml-2 font-medium">{seminarSummary.iotData.energyConsumption} kWh</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Air Quality Index:</span>
                      <span className="ml-2 font-medium">{seminarSummary.iotData.airQuality}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Internet Usage:</span>
                      <span className="ml-2 font-medium">{seminarSummary.iotData.internetUsage} MB</span>
                    </div>
                  </div>
                </div>

                {/* AI Generated Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">🤖 AI-Generated Summary</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {seminarSummary.summaryText.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                  {seminarSummary.isPublished && (
                    <div className="mt-4 flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">Published to Event Portal</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!seminarSummary && event.endDate >= Date.now() && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600">Seminar summary will be available after the event ends</p>
                <p className="text-sm text-gray-500 mt-1">
                  Event ends: {new Date(event.endDate).toLocaleString()}
                </p>
              </div>
            )}

            {!seminarSummary && event.endDate < Date.now() && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600">Generate a comprehensive seminar summary</p>
                <p className="text-sm text-gray-500 mt-1">
                  Includes IoT data analysis and performance metrics
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
