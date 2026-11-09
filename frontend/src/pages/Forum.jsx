import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const Forum = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [topics, setTopics] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { q: searchQuery };
        if (user?.role === 'Admin') {
          params.visibility = visibility;
        }
        const response = await axiosInstance.get('/api/topics', { params });
        setTopics(response.data);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          'Topics could not be retrieved. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [user, searchQuery, visibility]);

  useEffect(() => {
    if (location.state?.resetSearch) {
      setSearchInput('');
      setSearchQuery('');
    }
  }, [location.key, location.state]);

  const handleSearch = (event) => {event.preventDefault(); setSearchQuery(searchInput.trim()); };

return (
  <div className="container mx-auto p-6">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-3xl font-bold text-gray-800">Community Forum</h1>
      <button
        onClick={() => navigate(`/topics/create`)}
        className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
      >
        + Create Topic
      </button>
    </div>

    <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="Search topics and replies..."
        className="flex-grow rounded border border-gray-300 px-4 py-2"
      />

      <button
        type="submit"
        className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        Search
      </button>
      <button
        type="button"
        onClick={() => {
          setSearchInput('');
          setSearchQuery('');
        }}
        className="rounded border border-gray-400 px-6 py-2 text-gray-700 hover:bg-gray-100"
        >
          Clear
      </button>
    </form>

    {user.role === 'Admin' && (
      <div className="mb-6">
        <label htmlFor="visibility" className="mr-3 font-medium text-gray-700">Content visibility:</label>
        <select
          id="visibility"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="all">All Content</option>
          <option value="visible">Visible Only</option>
          <option value="hidden">Hidden Only</option>
        </select>
      </div>
    )}

    {loading && (<p className="py-6 text-center text-gray-600">Loading topics...</p>)}

    {!loading && error && (<p className="rounded bg-red-100 p-4 text-red-700">{error}</p>)}

    {!loading && !error && topics.length === 0 && (
      <p className="rounded bg-gray-100 p-6 text-center text-gray-600">
        {searchQuery
          ? 'No topics matched your search.'
          : 'There are no topics to display yet.'}
      </p>
    )}

    {!loading && !error && topics.length > 0 && (
      <div className="space-y-4">
        {topics.map((topic) => (
          <div
            key={topic._id}
            className="relative rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm"
          >
            {user.role === 'Admin' && !topic._visible && (
              <span className="absolute right-4 top-4 rounded bg-red-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Hidden
              </span>
            )}

            <h2 className="mb-2 pr-20 text-xl font-bold text-gray-800">
              {topic.title}
            </h2>

            <p className="mb-4 text-gray-600">
              {topic.content.length > 200
                ? `${topic.content.substring(0, 200)}...`
                : topic.content}
            </p>

            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <span>Author: {topic.author?.name || 'Unknown'}</span>
              <span>
                Posted: {new Date(topic.createdAt).toLocaleDateString()}
              </span>
              <span>Replies: {topic.replyCount}</span>
              {user.role === 'Admin' && (
                <span>
                  Status: {topic._visible ? 'Visible' : 'Hidden'}
                </span>
              )}
            </div>

            <button
              onClick={() => navigate(`/topics/${topic._id}`)}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              View Topic
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);
};

export default Forum;
