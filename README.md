# Smart Event & Seminar Management Agent

A comprehensive web application that automates the full university event and seminar management process — from proposal submission to approval, venue booking, and post-event reporting — using LangGraph workflows and Gemini AI tools.

## 🚀 Features

### 🤖 Automated Workflow System
- **Event Proposal Submission**: Organizers can submit detailed event proposals through an intuitive form
- **Conflict Detection**: Automatic venue and date conflict checking using simulated Google Calendar API
- **Smart Approval Routing**: Auto-forward proposals to appropriate authorities (HOD/Principal) based on event type and budget
- **Document Generation**: AI-powered creation of event posters and formal circulars using Gemini AI
- **Venue Booking**: Automated venue reservation and calendar updates
- **Stakeholder Notification**: Automatic sharing of documents with faculty and student groups

### 📊 Event Management
- **Event Creation & Publishing**: Traditional event creation for immediate publishing
- **Registration System**: Attendee registration with capacity management
- **Session Management**: Detailed event schedules with speaker information
- **Real-time Updates**: Live event status and attendee count updates

### 📈 Analytics & Reporting
- **Feedback Collection**: Post-event feedback forms with rating system
- **AI-Powered Analysis**: Gemini AI analyzes feedback to identify trends and improvements
- **IoT Integration**: Simulated IoT data collection (temperature, attendance, energy usage)
- **Performance Metrics**: Comprehensive event performance scoring
- **Automated Reports**: AI-generated event summaries and recommendations

### 👥 Role-Based Access
- **Organizers**: Submit proposals, create events, view analytics
- **Attendees**: Browse events, register, submit feedback
- **Admins**: Approve/reject proposals, manage workflow queue

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for responsive styling
- **React Router** for navigation
- **Sonner** for toast notifications

### Backend
- **Convex** for real-time database and functions
- **Convex Auth** for authentication
- **LangGraph** for workflow orchestration
- **Gemini AI** for document generation and analysis

### Key Libraries
- `@langchain/langgraph` - Workflow orchestration
- `@langchain/core` - LangChain core functionality
- `uuid` - Unique identifier generation

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Convex account
- Gemini API key (optional, for AI features)

## 🚀 Getting Started

### 1. Clone and Install
```bash
git clone <repository-url>
cd smart-event-management
npm install
```

### 2. Set Up Convex
```bash
npx convex dev
```

### 3. Configure Environment Variables
Set up the following environment variables in your Convex dashboard:

**Required:**
- `GEMINI_API_KEY` - Your Google Gemini API key for AI features

**Optional (for enhanced features):**
- `OPENAI_API_KEY` - Alternative AI provider
- `RESEND_API_KEY` - For email notifications

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
- **Local Development**: http://localhost:5173
- **Convex Dashboard**: https://dashboard.convex.dev/d/compassionate-porcupine-611

## 🔄 Workflow Process

### Event Proposal Workflow

1. **📝 Submission**
   - Organizer fills out comprehensive proposal form
   - System generates unique workflow ID
   - Proposal enters automated processing queue

2. **🔍 Conflict Check**
   - Automatic venue and date conflict detection
   - Checks against existing events and bookings
   - Rejects proposals with conflicts

3. **⏳ Approval Routing**
   - Smart assignment to appropriate approver
   - Priority-based queue management
   - Email notifications to approvers

4. **📄 Document Generation** (After Approval)
   - AI-generated event poster using Gemini
   - Formal circular creation
   - Professional document formatting

5. **🎉 Finalization**
   - Venue booking confirmation
   - Calendar integration
   - Stakeholder notification
   - Event publication

## 📊 Database Schema

### Core Tables
- **events** - Published events with full details
- **eventProposals** - Workflow-managed proposals
- **registrations** - Attendee registrations
- **profiles** - User profiles with roles
- **feedbacks** - Post-event feedback
- **workflowLogs** - Audit trail of workflow execution

### Workflow Tables
- **approvalQueue** - Pending approvals for admins
- **feedbackSummaries** - AI-generated feedback analysis
- **seminarSummaries** - IoT data and performance metrics

## 🎯 User Roles & Permissions

### 👨‍💼 Organizer
- Submit event proposals
- Create direct events
- View proposal status
- Access event analytics
- Manage event details

### 👥 Attendee  
- Browse available events
- Register for events
- Submit post-event feedback
- View event summaries

### ⚙️ Admin
- Review and approve proposals
- Manage approval queue
- Access system analytics
- Configure workflow settings

## 🔧 API Endpoints

### Event Management
- `api.events.getPublishedEvents` - Get all published events
- `api.events.getEventById` - Get event details
- `api.events.registerForEvent` - Register for an event

### Workflow System
- `api.workflows.submitEventProposal` - Submit new proposal
- `api.workflowHelpers.getMyProposals` - Get user's proposals
- `api.workflowHelpers.approveProposal` - Approve proposal (admin)

### Analytics
- `api.feedback.generateFeedbackSummary` - AI feedback analysis
- `api.feedback.generateSeminarSummary` - IoT-based event summary

## 🤖 AI Integration

### Gemini AI Features
- **Document Generation**: Creates professional event posters and circulars
- **Feedback Analysis**: Analyzes attendee feedback to identify trends
- **Performance Scoring**: Generates comprehensive event performance metrics
- **Recommendation Engine**: Suggests improvements based on data analysis

### Example AI Prompts
```javascript
// Feedback Analysis
const prompt = `Analyze event feedback and provide structured insights:
- Positive highlights
- Recurring problems  
- Actionable improvements
- Overall assessment`;

// Document Generation
const posterPrompt = `Create a professional event poster for:
Title: ${title}
Date: ${date}
Location: ${location}
Category: ${category}`;
```

## 📱 User Interface

### Key Pages
- **Dashboard** - Role-based overview and quick actions
- **Event Proposal Form** - Comprehensive proposal submission
- **My Proposals** - Track proposal status and workflow progress
- **Admin Dashboard** - Approval queue and system management
- **Event Details** - Full event information and registration
- **Analytics** - AI-powered insights and reports

### Responsive Design
- Mobile-first approach
- Tailwind CSS for consistent styling
- Accessible UI components
- Real-time status updates

## 🔒 Security & Authentication

- **Convex Auth** integration
- Role-based access control
- Secure API endpoints
- Input validation and sanitization
- Audit logging for all actions

## 🚀 Deployment

### Production Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Convex:
   ```bash
   npx convex deploy
   ```

3. Configure production environment variables in Convex dashboard

### Environment Configuration
- Set up Gemini API key for AI features
- Configure email service for notifications
- Set up monitoring and logging

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - The current implementation has some TypeScript strict mode issues
   - Deploy with `--typecheck=disable` if needed
   - Future updates will resolve type annotations

2. **API Key Configuration**
   - Ensure Gemini API key is properly set in Convex dashboard
   - Check API key permissions and quotas

3. **Workflow Execution**
   - Monitor workflow logs in the database
   - Check Convex function logs for debugging

### Debug Mode
Enable detailed logging by checking the Convex dashboard logs and workflow execution traces.

## 🔮 Future Enhancements

### Planned Features
- **Real IoT Integration** - Connect actual sensors for venue monitoring
- **Advanced Calendar Integration** - Google Calendar API integration
- **Email Automation** - Automated email campaigns and reminders
- **Mobile App** - React Native mobile application
- **Advanced Analytics** - Machine learning-powered insights
- **Multi-tenant Support** - Support for multiple organizations

### Technical Improvements
- Complete TypeScript type safety
- Enhanced error handling
- Performance optimizations
- Comprehensive testing suite
- CI/CD pipeline setup

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the Convex documentation
- Review the workflow logs in the dashboard
- Submit issues via GitHub

## 🙏 Acknowledgments

- **Convex** for the real-time backend platform
- **LangGraph** for workflow orchestration capabilities
- **Google Gemini** for AI-powered features
- **Tailwind CSS** for the design system

---

**Note**: This is a demonstration application showcasing automated workflow management with AI integration. Some features use simulated data for demonstration purposes. For production use, integrate with actual external services and APIs.
