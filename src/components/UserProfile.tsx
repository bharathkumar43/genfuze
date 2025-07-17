import { useState } from 'react';
import { LogOut, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function UserProfile() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {getInitials(user.displayName || user.name)}
        </div>
        
        {/* User Info */}
        <div className="text-left">
          <div className="text-sm font-medium text-gray-800 truncate max-w-32">
            {user.displayName || user.name}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-32">
            {user.email}
          </div>
        </div>
        
        {/* Chevron */}
        {isDropdownOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getInitials(user.displayName || user.name)}
              </div>
              <div>
                <div className="font-medium text-gray-800">
                  {user.displayName || user.name}
                </div>
                <div className="text-sm text-gray-500">
                  {user.email}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Tenant: {user.tenantId}
                </div>
              </div>
            </div>
          </div>

          {/* User Roles */}
          {user.roles && user.roles.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Roles</div>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                // TODO: Implement settings
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
} 