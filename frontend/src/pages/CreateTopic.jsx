
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const CreateTopic = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({title: '', content: '', });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({...previous, [name]: value,}));
    setError('');
    setSuccess('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please enter both a topic title and topic content.');
      return;
    }
    if (!user?.token) {setError('Your session is unavailable. Please sign in again.'); return; }
    setSubmitting(true);
    try {
      await axiosInstance.post('/api/topics',
        {title: formData.title.trim(), content: formData.content.trim(), },
        {headers: {Authorization: `Bearer ${user.token}`, }, }
      );
      setFormData({ title: '', content: '' });
      setSuccess('Your topic has been created successfully.');
    } catch (error) {
      setError(error.response?.data?.message || 'Your topic could not be created. Please try again.' );
    } finally {setSubmitting(false);}
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 bg-gray-100 border border-gray-300 rounded-md p-6">
          <h1 className="text-3xl font-bold mb-2">Create Topic</h1>
          <p className="text-gray-600 mb-6">Start a new discussion with the community.</p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <label htmlFor="topic-title" className="block font-semibold mb-2">Topic Title</label>
                <input
                  id="topic-title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a title for your topic"
                  className="w-full h-[42px] px-3 border border-gray-300 rounded-md bg-white"
                  disabled={submitting}
                />
              </div>
              <div className="col-span-12">
                <label htmlFor="topic-content" className="block font-semibold mb-2">Topic Content</label>
                <textarea
                  id="topic-content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write your discussion topic..."
                  rows={8}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white resize-y"
                  disabled={submitting}
                />
              </div>
              {error && (
                <div role="alert" className="col-span-12 p-3 rounded-md border border-red-300 bg-red-50 text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div role="status" className="col-span-12 p-3 rounded-md border border-green-300 bg-green-50 text-green-700">
                  {success}
                </div>
              )}
              <div className="col-span-12 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-6 rounded-md bg-[#2563a6] text-white font-medium hover:bg-[#1d4f87] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create Topic'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CreateTopic;
