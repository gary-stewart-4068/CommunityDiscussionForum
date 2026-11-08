import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const CreateReply = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Retrieve the first visible topic
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await axiosInstance.get('/api/topics/first-visible');
        setTopic(response.data);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          'The topic could not be retrieved. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!content.trim()) {setError('Please enter reply content.'); return; }
    if (!user?.token) {setError('Your session is unavailable. Please sign in again.'); return; }
    if (!topic?._id) { setError('No available topic was found for this reply.'); return; }
    setSubmitting(true);
    try {await axiosInstance.post(`/api/topics/${topic._id}/replies`, { content: content.trim() } );
      setContent('');
      setSuccess('Your reply has been submitted successfully.');
    } catch (error) {setError(error.response?.data?.message || 'Your reply could not be submitted. Please try again.' );
    } finally {setSubmitting(false); }
  };

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleString('en-AU', {dateStyle: 'medium', timeStyle: 'short' }); };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 bg-gray-100 border border-gray-300 rounded-md p-6">
          <h1 className="text-3xl font-bold mb-2">Create Reply</h1>
          <p className="text-gray-600 mb-6">Add your contribution to the discussion below.</p>
          {loading ? (
            <p className="text-gray-600">Loading topic...</p>
          ) : topic ? (
            <>
              {/* Parent topic - read only */}
              <div className="bg-white border border-gray-300 rounded-md p-5 mb-6">
                <h2 className="text-2xl font-bold mb-3">{topic.title}</h2>
                <p className="text-gray-700 whitespace-pre-wrap mb-5">{topic.content}</p>
                <div className="border-t border-gray-200 pt-3 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold">Author:</span>{' '}
                    {topic.author?.name || 'Unknown'}
                  </p>
                  <p>
                    <span className="font-semibold">Last updated:</span>{' '}
                    {formatDate(topic.updatedAt)}
                  </p>
                </div>
              </div>
              {/* Reply entry form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label htmlFor="reply-content" className="block font-semibold mb-2" >Your Reply</label>
                  <textarea
                    id="reply-content"
                    name="content"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="Write your reply..."
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white resize-y"
                    disabled={submitting}
                  />
                </div>
                {error && (
                  <div role="alert" className="mb-4 p-3 rounded-md border border-red-300 bg-red-50 text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/tasks')}
                    disabled={submitting}
                    className="h-10 px-6 rounded-md border border-gray-400 text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-6 rounded-md bg-[#2563a6] text-white font-medium hover:bg-[#1d4f87] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Reply'}
                  </button>
                </div>
                {success && (
                  <div
                    role="status"
                    className="mt-4 p-3 rounded-md border border-green-300 bg-green-50 text-green-700"
                  >
                    {success}
                  </div>
                )}
              </form>
            </>
          ) : (
            <div role="alert" className="text-red-700">
              {error || 'No visible topic is available.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CreateReply;