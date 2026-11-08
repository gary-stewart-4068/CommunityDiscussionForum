
import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Retrieve all user accounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          'Unable to retrieve users. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Select a user for editing
  const handleSelectUser = (selected) => {
    setSelectedUser(selected);
    setFormData({
      name: selected.name,
      email: selected.email,
    });
    setError('');
    setSuccess('');
  };

  // Update selected user's name and email
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await axiosInstance.put(
        `/api/users/${selectedUser.id}`,
        formData
      );
      const updatedUser = response.data;
      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      setSelectedUser(null);
      setSuccess('User details updated successfully.');
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'User update failed. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Promote an active Member to Admin
  const handlePromoteUser = async () => {
    if (!selectedUser || selectedUser._deleted ||
        selectedUser.role !== 'Member') return;
    if (!window.confirm(
      `Are you sure you want to promote ${selectedUser.name} to Admin?`
    )) {
      return;
    }
    setPromoting(true);
    setError('');
    setSuccess('');
    try {
      const response = await axiosInstance.patch(
        `/api/users/${selectedUser.id}/role`
      );
      const updatedUser = response.data.user;
      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      setSelectedUser(null);
      setSuccess(response.data.message);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'User promotion failed. Please try again.'
      );
    } finally {
      setPromoting(false);
    }
  };
  if (loading) {
    return (
      <div className="text-center mt-20">
        Loading user accounts...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">User Administration</h1>
        <p className="text-gray-600 mt-2">Manage forum user accounts and permissions.</p>
      </div>
      {/* General feedback */}
      {error && (
        <div role="alert" className="p-3 text-red-700 bg-red-100 rounded">{error}</div>)}
      {success && (
        <div role="status" className="p-3 text-green-700 bg-green-100 rounded">{success}</div>)}
      {/* User list */}
      <section className="bg-white p-6 shadow-md rounded">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          User Accounts
        </h2>
        {users.length === 0 ? 
        (<p className="text-gray-600">No user accounts were found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-3 border-b">Name</th>
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">Role</th>
                  <th className="p-3 border-b">Account Status</th>
                  <th className="p-3 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (<tr key={account.id} className={`hover:bg-blue-50 ${selectedUser?.id === account.id ? 'bg-blue-50' : '' }`}>
                    <td className="p-3 border-b">{account.name}</td>
                    <td className="p-3 border-b">{account.email}</td>
                    <td className="p-3 border-b">{account.role}</td>
                    <td className="p-3 border-b">
                      {account._deleted ? (
                        <span className="text-gray-600 font-medium">Deleted</span>
                      ) : (
                        <span className="text-green-700 font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-3 border-b">
                      <button
                        type="button"
                        onClick={() => handleSelectUser(account)}
                        className="text-blue-700 font-medium hover:underline"
                      >Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Selected user editing card */}
      {selectedUser && (
        <section className="bg-white p-6 shadow-md rounded">
          <h2 className="text-xl font-bold mb-6 text-gray-800">
            Edit Selected User
          </h2>
          <form onSubmit={handleUpdateUser}>
            <label className="block mb-2 font-medium">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
                setSuccess('');
              }}
              required
              className="w-full mb-4 p-2 border rounded"
            />

            <label className="block mb-2 font-medium">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setError('');
                setSuccess('');
              }}
              required
              className="w-full mb-4 p-2 border rounded"
            />

            <label className="block mb-2 font-medium">Account Role</label>
            <input
              type="text"
              value={selectedUser.role}
              readOnly
              className="w-full mb-4 p-2 border rounded bg-gray-100 cursor-not-allowed"
            />

            <label className="block mb-2 font-medium">Account Status</label>
            <input
              type="text"
              value={selectedUser._deleted ? 'Deleted' : 'Active'}
              readOnly
              className="w-full mb-6 p-2 border rounded bg-gray-100 cursor-not-allowed"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || selectedUser._deleted}
                className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Details'}
              </button>

              {selectedUser.role === 'Member' &&
                !selectedUser._deleted && (
                  <button
                    type="button"
                    onClick={handlePromoteUser}
                    disabled={promoting}
                    className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {promoting ? 'Promoting...' : 'Promote to Admin'}
                  </button>
                )}
            </div>
          </form>
        </section>
      )}

    </div>
  );
};

export default UserManagement;
