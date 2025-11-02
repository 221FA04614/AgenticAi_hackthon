import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export function MyProposalsPage() {
  const proposals = useQuery(api.workflowHelpers.getMyProposals);
  const publishEvent = useMutation(api.events.publishEventFromProposal);
  const [publishingProposals, setPublishingProposals] = useState<Set<string>>(new Set());

  const handlePublishEvent = async (proposalId: string, eventId: string | undefined) => {
    if (!eventId) return;
    
    setPublishingProposals(prev => new Set(prev).add(proposalId));
    
    try {
      await publishEvent({ eventId: eventId as any });
      toast.success("Event published successfully!");
    } catch (error) {
      toast.error("Failed to publish event");
      console.error(error);
    } finally {
      setPublishingProposals(prev => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return "📝";
      case "processing":
        return "🔄";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      default:
        return "📋";
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "submitted":
        return "Proposal submitted and queued for processing";
      case "processing":
        return "AI is analyzing your proposal and checking hall availability";
      case "approved":
        return "Proposal approved! Event is ready to be published";
      case "rejected":
        return "Proposal was rejected by admin";
      default:
        return "Unknown status";
    }
  };

  if (proposals === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Event Proposals</h1>
          <p className="text-gray-600 mt-2">
            Track the status of your submitted event proposals through the automated workflow
          </p>
        </div>
        <Link
          to="/submit-proposal"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit New Proposal
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
          <p className="text-gray-600 mb-6">
            Submit your first event proposal to get started with the automated workflow system
          </p>
          <Link
            to="/submit-proposal"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Your First Proposal
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {proposal.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(proposal.preferredDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {proposal.expectedAttendees} attendees
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {proposal.duration}h duration
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                      {proposal.description}
                    </p>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                      {getStatusIcon(proposal.status)} {proposal.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Submitted {new Date(proposal.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Confirmed Hall Information */}
                {proposal.status === "approved" && proposal.hallAvailability?.recommendedHall && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-green-900">
                          🎯 Confirmed Seminar Hall: {proposal.hallAvailability.recommendedHall.selectedHall}
                        </h4>
                        <p className="text-sm text-green-800 mt-1">
                          <strong>Match Score:</strong> {proposal.hallAvailability.recommendedHall.matchScore}/100
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          {proposal.hallAvailability.recommendedHall.reasoning}
                        </p>
                        {proposal.hallAvailability.recommendedHall.alternativeHalls && (
                          <p className="text-xs text-green-600 mt-2">
                            <strong>Backup options:</strong> {proposal.hallAvailability.recommendedHall.alternativeHalls.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Description */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">
                      {getStatusDescription(proposal.status)}
                    </span>
                  </div>
                </div>

                {/* Workflow Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Workflow Progress</span>
                    <span>ID: {proposal._id.substring(0, 8)}...</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {["submitted", "processing", "approved"].map((step, index) => {
                      const steps = ["submitted", "processing", "approved"];
                      const currentIndex = steps.indexOf(proposal.status);
                      const isCompleted = currentIndex >= index;
                      const isCurrent = currentIndex === index;
                      
                      return (
                        <div key={step} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            isCompleted 
                              ? "bg-blue-600" 
                              : isCurrent 
                              ? "bg-blue-300 animate-pulse" 
                              : "bg-gray-300"
                          }`}></div>
                          {index < 2 && (
                            <div className={`w-8 h-0.5 ${
                              isCompleted ? "bg-blue-600" : "bg-gray-300"
                            }`}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons and Additional Information */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {proposal.category}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                      Proposal
                    </span>
                    {proposal.facilitiesRequired.length > 0 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {proposal.facilitiesRequired.length} facilities required
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {proposal.status === "approved" && proposal.createdEventId && (
                      <>
                        <button
                          onClick={() => handlePublishEvent(proposal._id, proposal.createdEventId)}
                          disabled={publishingProposals.has(proposal._id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {publishingProposals.has(proposal._id) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Publishing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Publish Event
                            </>
                          )}
                        </button>
                        <Link
                          to={`/events/${proposal.createdEventId}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                        >
                          View Event
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Rejection Details */}
                {proposal.status === "rejected" && proposal.adminComments && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Admin Comments:
                    </h4>
                    <p className="text-sm text-red-800">{proposal.adminComments}</p>
                  </div>
                )}

                {/* AI Summary for approved proposals */}
                {proposal.status === "approved" && proposal.aiSummary?.summary && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Analysis Summary:
                    </h4>
                    <div className="text-sm text-blue-800 whitespace-pre-line">
                      {proposal.aiSummary.summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
