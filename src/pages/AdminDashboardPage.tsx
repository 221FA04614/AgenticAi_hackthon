import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function AdminDashboardPage() {
  const proposals = useQuery(api.workflows.getAllProposals) || [];
  const updateProposalStatus = useMutation(api.workflows.updateProposalStatus);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [adminComments, setAdminComments] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (proposalId: string, status: "approved" | "rejected") => {
    setIsUpdating(true);
    try {
      await updateProposalStatus({
        proposalId: proposalId as any,
        status,
        adminComments: adminComments || undefined,
      });
      
      toast.success(`Proposal ${status} successfully!`);
      setSelectedProposal(null);
      setAdminComments("");
    } catch (error) {
      toast.error(`Failed to ${status} proposal`);
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkflowStatusColor = (status?: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "processing": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const pendingProposals = proposals.filter(p => p.status === "submitted" || p.status === "processing");
  const reviewedProposals = proposals.filter(p => p.status === "approved" || p.status === "rejected");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Review and manage event proposals with AI assistance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{pendingProposals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {proposals.filter(p => p.status === "approved").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {proposals.filter(p => p.status === "rejected").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Processed</p>
              <p className="text-2xl font-bold text-gray-900">
                {proposals.filter(p => p.workflowStatus === "completed").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Proposals */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Pending Proposals</h2>
        
        {pendingProposals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-4xl mb-4 block">📭</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Proposals</h3>
            <p className="text-gray-600">All proposals have been reviewed.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingProposals.map((proposal) => (
              <div key={proposal._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{proposal.title}</h3>
                    <p className="text-sm text-gray-600">
                      by {proposal.organizerName} • {new Date(proposal.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                    {proposal.workflowStatus && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkflowStatusColor(proposal.workflowStatus)}`}>
                        AI: {proposal.workflowStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <p className="text-sm text-gray-600">{proposal.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expected Attendees</p>
                    <p className="text-sm text-gray-600">{proposal.expectedAttendees}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Preferred Date</p>
                    <p className="text-sm text-gray-600">
                      {new Date(proposal.preferredDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Duration</p>
                    <p className="text-sm text-gray-600">{proposal.duration} hours</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{proposal.description}</p>
                </div>

                {proposal.facilitiesRequired.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Required Facilities</p>
                    <div className="flex flex-wrap gap-1">
                      {proposal.facilitiesRequired.map((facility) => (
                        <span key={facility} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {proposal.aiSummary?.success && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">🤖 AI Analysis</h4>
                    <div className="text-sm text-blue-800 whitespace-pre-line">
                      {proposal.aiSummary.summary}
                    </div>
                  </div>
                )}

                {/* Hall Recommendation */}
                {proposal.hallAvailability?.recommendedHall && (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">🏛️ Recommended Hall</h4>
                    <p className="text-sm text-purple-800">
                      <strong>{proposal.hallAvailability.recommendedHall.selectedHall}</strong> 
                      (Match Score: {proposal.hallAvailability.recommendedHall.matchScore}/100)
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      {proposal.hallAvailability.recommendedHall.reasoning}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedProposal(proposal)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Review Proposal
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Reviewed */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Recently Reviewed</h2>
        
        {reviewedProposals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-4xl mb-4 block">📝</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviewed Proposals</h3>
            <p className="text-gray-600">Reviewed proposals will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proposal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviewedProposals.slice(0, 10).map((proposal) => (
                  <tr key={proposal._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                        <div className="text-sm text-gray-500">{proposal.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {proposal.organizerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proposal.createdEventId ? (
                        <Link 
                          to={`/events/${proposal.createdEventId}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Event
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Proposal</h2>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedProposal.title}</h3>
                  <p className="text-gray-600">by {selectedProposal.organizerName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700">Category</p>
                    <p className="text-gray-600">{selectedProposal.category}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Expected Attendees</p>
                    <p className="text-gray-600">{selectedProposal.expectedAttendees}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Preferred Date</p>
                    <p className="text-gray-600">
                      {new Date(selectedProposal.preferredDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Duration</p>
                    <p className="text-gray-600">{selectedProposal.duration} hours</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">Description</p>
                  <p className="text-gray-600">{selectedProposal.description}</p>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">Justification</p>
                  <p className="text-gray-600">{selectedProposal.justification}</p>
                </div>

                {selectedProposal.aiSummary?.success && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">🤖 AI Analysis</h4>
                    <div className="text-sm text-blue-800 whitespace-pre-line">
                      {selectedProposal.aiSummary.summary}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Comments
                  </label>
                  <textarea
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add comments for the organizer..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setSelectedProposal(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedProposal._id, "rejected")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Processing..." : "Reject"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedProposal._id, "approved")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? "Processing..." : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
