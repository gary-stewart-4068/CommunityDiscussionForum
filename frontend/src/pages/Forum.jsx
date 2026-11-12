import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import ReportControl from "../components/ReportControl";

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
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [reportedContent, setReportedContent] = useState(new Set());
  const [openReportCount, setOpenReportCount] = useState(null);
  const [moderationError, setModerationError] = useState('');

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
    let cancelled = false;
    const fetchMyReports = async () => {
      try {const response = await axiosInstance.get('/api/reports/mine');
        if (!cancelled) {setReportedContent(new Set(response.data.map((report) => `${report.contentType}:${report.contentId}`)));}
      } catch (error) {console.error('Could not retrieve your submitted Reports:', error);
      }
    };

    if (user) {fetchMyReports();}

    return () => {cancelled = true;};
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const fetchOpenReportCount = async () => {
      try {
        const response = await axiosInstance.get('/api/reports');
        if (!cancelled) {const openCount = response.data.filter(report => report.decision === 'Open').length;
          setOpenReportCount(openCount);}
      }
      catch (error) {console.error('Could not retrieve open Report count:', error);}
    };
    if (user?.role === 'Admin') {fetchOpenReportCount();}
    return () => {cancelled = true;};
  }, [user]);

  useEffect(() => {
    if (location.state?.resetSearch) {
      setSearchInput('');
      setSearchQuery('');
    }
  }, [location.key, location.state]);

  const handleReportSubmitted = (contentType, contentId) => {
    setReportedContent((previousReports) => {
      const updatedReports = new Set(previousReports);
      updatedReports.add(`${contentType}:${contentId}`);
      return updatedReports;
    });
  };

  const handleSearch = (event) => { event.preventDefault(); setSearchQuery(searchInput.trim()); };

  const handleUpdateTopic = async (event, topicId) => {
    event.preventDefault();
    setEditError('');
    setEditSuccess('');
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError('Topic title and content cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const response = await axiosInstance.put(`/api/topics/${topicId}`, {
        title: editTitle.trim(),
        content: editContent.trim()
      });
      setTopics((previousTopics) =>
        previousTopics.map((topic) =>
          topic._id === topicId? {...topic, ...response.data, author: topic.author, }: topic
          )
      );
      setEditingTopicId(null);
      setEditSuccess('Your topic has been updated successfully.');
    } catch (error) {
      setEditError(
        error.response?.data?.message ||
        'Your topic could not be updated. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this topic? All replies associated with it, including replies written by other members, will also be permanently deleted.'
    );
    if (!confirmed) { return; }
    setError('');
    try {
      await axiosInstance.delete(`/api/topics/${topicId}`);
      setTopics((previousTopics) =>
        previousTopics.filter((topic) => topic._id !== topicId)
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Your topic could not be deleted. Please try again.');
    }
  };

  const handleAdminVisibility = async (topic) => {
    const visible = !topic._visible;
    const replyCount = topic.replyCount ?? 0;
    const actionDescription = visible
      ? `make Topic "${topic.title}" visible`
      : `hide Topic "${topic.title}"`;
    const replyDescription = visible
      ? `All ${replyCount} associated Replies will also be made visible, including any Replies previously hidden individually.`
      : `The Topic and all ${replyCount} associated Replies will become unavailable to Members.`;
    const confirmed = window.confirm(`Are you sure you want to ${actionDescription}?\n\n${replyDescription}`);
    if (!confirmed) return;
    setModerationError('');
    try {
      await axiosInstance.put(`/api/topics/${topic._id}/visibility`, { visible });
      setTopics((previousTopics) =>
        previousTopics.map((item) =>
          item._id === topic._id
            ? { ...item, _visible: visible }
            : item
        )
      );
    } catch (error) {
      setModerationError(error.response?.data?.message || 'Topic visibility could not be changed. Please try again.');
    }
  };

  const handleAdminDeleteTopic = async (topic) => {
  const replyCount = topic.replyCount ?? 0;

  const confirmed = window.confirm(
    `Are you sure you want to permanently delete Topic "${topic.title}"?\n\n` +
    `This will also permanently delete all ${replyCount} associated Replies, including Replies written by other Members.\n\n` +
    `All Reports associated with this Topic and its Replies will also be permanently deleted.\n\n` +
    `This action cannot be undone.`
  );

  if (!confirmed) return;

  setModerationError('');

  try {
    await axiosInstance.delete(`/api/topics/admin/${topic._id}`);

    setTopics((previousTopics) =>
      previousTopics.filter((item) => item._id !== topic._id)
    );
  } catch (error) {
    setModerationError(
      error.response?.data?.message ||
      'Topic could not be deleted. Please try again.'
    );
  }
};

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

      {user?.role === 'Admin' && (
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-yellow-300 bg-yellow-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Moderation reports awaiting decision: {openReportCount ?? '—'}</h2>
            <p className="mt-1 text-sm text-gray-600">Review submitted Reports and record moderation decisions.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/moderation')}
            className="rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
          >
            Review Reports
          </button>
        </div>
      )}

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

      {user?.role === 'Admin' && (
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
      {!loading && editSuccess && (<p role="status" className="mb-4 rounded bg-green-100 p-4 text-green-700">{editSuccess}</p>)}
      {!loading && moderationError && (<p role="alert" className="mb-4 rounded bg-red-100 p-4 text-red-700">{moderationError}</p>)}
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
            <div key={topic._id} className="relative rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm">
              {user?.role === 'Admin' && !topic._visible && (
                <span className="absolute right-4 top-4 rounded bg-red-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Hidden
                </span>
              )}
              {reportedContent.has(`Topic:${topic._id}`) && (
                <span className="absolute right-4 top-4 rounded bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-800">
                  Report submitted
                </span>
              )}
              {editingTopicId === topic._id ? (
                <form onSubmit={(event) => handleUpdateTopic(event, topic._id)} className="mb-4">
                  <label htmlFor={`edit-title-${topic._id}`} className="mb-2 block font-semibold">Topic Title</label>
                  <input
                    id={`edit-title-${topic._id}`}
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    disabled={saving}
                    className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
                  />
                  <label htmlFor={`edit-content-${topic._id}`} className="mb-2 block font-semibold">Topic Content</label>
                  <textarea
                    id={`edit-content-${topic._id}`}
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    rows={5}
                    disabled={saving}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                  {editError && (<p role="alert" className="mt-3 rounded bg-red-100 p-3 text-red-700">{editError}</p>)}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopicId(null);
                        setEditError('');
                      }}
                      disabled={saving}
                      className="rounded border border-gray-400 px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="mb-2 pr-20 text-xl font-bold text-gray-800">
                    {topic.title}
                  </h2>
                  <p className="mb-4 text-gray-600">
                    {topic.content.length > 200
                      ? `${topic.content.substring(0, 200)}...`
                      : topic.content}
                  </p>
                </>
              )}

              <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <span>Author: {topic.author?.name || 'Unknown'}</span>
                <span>Posted: {new Date(topic.createdAt).toLocaleDateString()}</span>
                <span>Replies: {topic.replyCount}</span>
                {user?.role === 'Admin' && (
                  <span>Status: {topic._visible ? 'Visible' : 'Hidden'}</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {/* Existing Member actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/topics/${topic._id}`)}
                    className="inline-flex h-10 w-36 items-center justify-center rounded bg-blue-600 px-4 text-center font-medium text-white hover:bg-blue-700"
                  >
                    View Topic
                  </button>
                  {topic.author?._id === (user?._id || user?.id) && editingTopicId !== topic._id && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTopicId(topic._id);
                          setEditTitle(topic.title);
                          setEditContent(topic.content);
                          setEditError('');
                          setEditSuccess('');
                        }}
                        className="inline-flex h-10 w-36 items-center justify-center rounded bg-yellow-600 px-4 text-center font-medium text-white hover:bg-yellow-700"
                      >
                        Edit Topic
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(topic._id)}
                        disabled={saving}
                        className="inline-flex h-10 w-36 items-center justify-center rounded bg-red-600 px-4 text-center font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete Topic
                      </button>
                    </>
                  )}
                  {topic._visible && editingTopicId !== topic._id && (
                    <ReportControl
                      contentType="Topic"
                      contentId={topic._id}
                      alreadyReported={reportedContent.has(`Topic:${topic._id}`)}
                      onSubmitted={handleReportSubmitted}
                    />
                  )}
                </div>
                {/* Admin-only moderation actions */}
                {user?.role === 'Admin' && (
                  <div
                    className="flex flex-wrap items-center gap-2 rounded-md border p-2"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <span className="text-sm font-semibold text-gray-700">Admin actions:</span>
                    <button
                      type="button"
                      onClick={() => handleAdminVisibility(topic)}
                      className="inline-flex h-10 items-center justify-center rounded px-4 font-medium text-white hover:opacity-90"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Change Visibility
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminDeleteTopic(topic)}
                      className="inline-flex h-10 items-center justify-center rounded px-4 font-medium text-white hover:opacity-90"
                      style={{ backgroundColor: 'var(--color-danger)' }}
                    >
                      Delete Topic
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forum;
