import { Link, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";

export function Navbar() {
  const user = useQuery(api.auth.loggedInUser);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/events", label: "Events", icon: "📅" },
    { path: "/past-events", label: "Past Events", icon: "📚" },
  ];

  // Add role-specific navigation items
  if (user?.profile?.role === "organizer") {
    navItems.push(
      { path: "/submit-proposal", label: "Submit Proposal", icon: "📝" },
      { path: "/my-proposals", label: "My Proposals", icon: "📋" },
      { path: "/create-event", label: "Create Event", icon: "➕" },
      { path: "/my-events", label: "My Events", icon: "📊" },
      { path: "/admin-dashboard", label: "Admin Panel", icon: "⚙️" }
    );
  } else if (user?.profile?.role === "attendee") {
    navItems.push(
      { path: "/my-registrations", label: "My Registrations", icon: "🎫" }
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SE</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Smart Events</span>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {user?.profile && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user.profile.firstName} {user.profile.lastName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user.profile.role}
                  </div>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {user.profile.firstName?.[0]}{user.profile.lastName?.[0]}
                  </span>
                </div>
              </div>
            )}
            <SignOutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
