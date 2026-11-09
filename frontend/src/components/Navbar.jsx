import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleForumNavigation = (event) => {
    event.preventDefault();
    navigate('/forum', { state: { resetSearch: true } });
  };
  const linkStyle = "px-3 py-2 rounded hover:bg-blue-700 transition-colors";

  return (
    <nav className="bg-[#2563a6] text-white px-6 py-4 flex justify-between items-center">

      {/* Forum branding */}
      <Link to="/forum"
        onClick={handleForumNavigation}
        className="text-xl font-semibold tracking-wide">
          Community Discussion Forum
      </Link>
      {/* Navigation links */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            {/* Member and Admin navigation */}
            <Link
              to="/forum"
              onClick={handleForumNavigation}
              className={linkStyle}>Forum
            </Link>
            <Link to="/topics/create" className={linkStyle}>Create Topic</Link>
            {user.role === 'Admin' && (
              <>
                <Link to="/admin/users" className={linkStyle}>User Administration</Link>
                <Link to="/admin/moderation" className={linkStyle}>Moderation</Link>
              </>
            )}
            <Link to="/profile" className={linkStyle}>My Profile</Link>
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 rounded border border-white font-medium hover:bg-red-700 hover:border-red-700 transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={linkStyle}>Sign In</Link>
            <Link to="/register" className="ml-2 px-4 py-2 rounded bg-white text-[#2563a6] font-medium hover:bg-gray-100 transition-colors">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
