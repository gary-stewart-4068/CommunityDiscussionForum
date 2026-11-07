import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Profile = () => {
  const { user, login } = useAuth(); // Access user token from context
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [role, setRole] = useState('Member'); // Default role
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Retrieve the user's profile
  useEffect(() => {
    // Fetch profile data from the backend
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await axiosInstance.get('/api/auth/profile');
        setFormData({
          name: response.data.name,
          email: response.data.email,
        });
        setRole(response.data.role || user.role || 'Member'); // Fallback to user role from context
      } catch (error) {
        setProfileError(
          error.response?.data?.message || 'Failed to retrieve your profile. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Update the users name and email
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const response = await axiosInstance.put('/api/auth/profile', formData);

      // Update the user context with the new profile data
      login({
        ...user,
        ...response.data,
      });
      setProfileSuccess('Your profile updated successfully!');
    } catch (error) {
      setProfileError(
        error.response?.data?.message || 'Failed to update your profile. Please try again.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Change the users password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const response = await axiosInstance.put('/api/auth/change-password', passwordData);
      setPasswordSuccess(response.data.message ||'Your password has been changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '' }); // Clear password fields
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || 'Failed to change your password. Please try again.'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20">Loading profile...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-20 mb-12 space-y-8">
      {/* Profile details */}
      <form onSubmit={handleProfileSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-6 text-center">Your Profile</h1>
        {profileError && (
          <div
            role="alert"
            className="mb-4 p-3 text-red-700 bg-red-100 rounded"
          >
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div role="status" className="mb-4 p-3 text-green-700 bg-green-100 rounded">
            {profileSuccess}
          </div>
        )}

        <label className="block mb-2 font-medium">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            setProfileError('');
            setProfileSuccess('');
          }}
          required
          autoComplete="name"
          onInvalid={(e) => {e.preventDefault();
            setProfileError('Please enter your name.');
          }}
          className="w-full mb-4 p-2 border rounded"
        />

        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            setProfileError('');
            setProfileSuccess('');
          }}
          required
          autoComplete="email"
          onInvalid={(e) => {e.preventDefault();
            setProfileError(
              e.target.validity.valueMissing
                ? 'Please enter your email address.'
                : 'Please enter a valid email address.'
            );
          }}
          className="w-full mb-4 p-2 border rounded"
        />

        <label className="block mb-2 font-medium">Account Role</label>
        <input
          type="text"
          value={role}
          readOnly
          className="w-full mb-4 p-2 border rounded bg-gray-100 cursor-not-allowed"
        />

        <button type="submit" disabled={savingProfile} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50">
          {savingProfile ? 'Updating...' : 'Update Profile'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handlePasswordSubmit} className="bg-white p-6 shadow-md rounded">
        <h2 className="text-xl font-bold mb-4 text-center">Change Password</h2>
        {passwordError && (
          <div role="alert" className="mb-4 p-3 text-red-700 bg-red-100 rounded">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div role="status" className="mb-4 p-3 text-green-700 bg-green-100 rounded">
            {passwordSuccess}
          </div>
        )}
        <label className="block mb-2 font-medium">Current Password</label>
        <input
          type="password"
          value={passwordData.currentPassword}
          onChange={(e) => {
            setPasswordData({ ...passwordData, currentPassword: e.target.value });
            setPasswordError('');
            setPasswordSuccess('');
          }}
          required
          autoComplete="current-password"
          onInvalid={(e) => {
            e.preventDefault();
            setPasswordError('Please enter your current password.');
          }}
          className="w-full mb-4 p-2 border rounded"
        />
        <label className="block mb-2 font-medium">New Password</label>
        <input
          type="password"
          value={passwordData.newPassword}
          onChange={(e) => {
            setPasswordData({ ...passwordData, newPassword: e.target.value });
            setPasswordError('');
            setPasswordSuccess('');
          }}
          required
          autoComplete="new-password"
          onInvalid={(e) => {
            e.preventDefault();
            setPasswordError('Please enter a new password.');
          }}
          className="w-full mb-4 p-2 border rounded"
        />

        <button type="submit" disabled={savingPassword} className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50">
          {savingPassword ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

export default Profile;
