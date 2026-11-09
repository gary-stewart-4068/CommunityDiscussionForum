import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const TopicDetail = () => {
    const { topicId } = useParams();
    const { user } = useAuth();
    const [topic, setTopic] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [replySuccess, setReplySuccess] = useState('');

    useEffect(() => {
        const fetchTopic = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axiosInstance.get(`/api/topics/${topicId}`);
                setTopic(response.data.topic);
                setReplies(response.data.replies);
            } catch (error) {
                setError(error.response?.data?.message || 'The topic could not be retrieved. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchTopic();
    }, [topicId]);

    const formatDate = (date) => {
        if (!date) return 'Not available';
        return new Date(date).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', });
    };

    if (loading) { return <p className="p-6 text-center">Loading topic...</p>; }

    if (error || !topic) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <p role="alert" className="rounded-md bg-red-50 p-4 text-red-700">
                    {error || 'Topic not found.'}
                </p>
            </div>
        );
    }

    const isAdminViewingHiddenTopic = user?.role === 'Admin' && !topic._visible;

    const handleSubmitReply = async (event) => {
        event.preventDefault();
        setReplyError('');
        setReplySuccess('');
        if (!content.trim()) { setReplyError('Please enter reply content.'); return; }
        setSubmitting(true);
        try {
            const response = await axiosInstance.post(
                `/api/topics/${topicId}/replies`,
                { content: content.trim() }
            );
            setReplies((previousReplies) => [...previousReplies, response.data]);
            setContent('');
            setReplySuccess('Your reply has been submitted successfully.');
        } catch (error) {
            setReplyError(
                error.response?.data?.message ||
                'Your reply could not be submitted. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-8">
            <section className="relative rounded-md border border-gray-300 bg-gray-100 p-6">
                {user?.role === 'Admin' && !topic._visible && (
                    <span className="absolute right-4 top-4 rounded bg-red-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                        Hidden
                    </span>
                )}
                <h1 className="mb-4 pr-20 text-3xl font-bold">{topic.title}</h1>
                <p className="mb-6 whitespace-pre-wrap text-gray-700">
                    {topic.content}
                </p>
                <div className="border-t border-gray-300 pt-3 text-sm text-gray-600">
                    <p>
                        <span className="font-semibold">Author:</span>{' '}
                        {topic.author?.name || 'Unknown'}
                    </p>
                    <p>
                        <span className="font-semibold">Posted:</span>{' '}
                        {formatDate(topic.createdAt)}
                    </p>
                </div>
            </section>
            <section className="mt-8">
                <h2 className="mb-4 text-2xl font-bold">Replies ({replies.length})</h2>
                {replies.length === 0 ? (
                    <p className="rounded-md bg-gray-100 p-5 text-gray-600">
                        No replies yet. Be the first to contribute to this discussion.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {replies.map((reply) => (
                            <article
                                key={reply._id}
                                className="relative rounded-md border border-gray-300 bg-white p-5"
                            >
                                {user?.role === 'Admin' && !reply._visible && (
                                    <span className="absolute right-4 top-4 rounded bg-red-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                                        Hidden
                                    </span>
                                )}
                                <p className="mb-4 whitespace-pre-wrap text-gray-700">
                                    {reply.content}
                                </p>
                                <div className="border-t border-gray-200 pt-3 text-sm text-gray-600">
                                    <span>
                                        <strong>Author:</strong>{' '}
                                        {reply.author?.name || 'Unknown'}
                                    </span>
                                    <span className="ml-6">
                                        <strong>Posted:</strong> {formatDate(reply.createdAt)}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
            {isAdminViewingHiddenTopic ? (
                <section className="mt-8 rounded-md border border-gray-300 bg-gray-100 p-6">
                    <h2 className="mb-3 text-2xl font-bold text-gray-700">
                        Replies Disabled
                    </h2>
                    <p className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
                        Replies are disabled for hidden topics. You can view the existing discussion, but cannot submit a new reply.
                    </p>
                    <label htmlFor="reply-content" className="mb-2 block font-semibold text-gray-500">
                        Your Reply
                    </label>
                    <textarea
                        id="reply-content"
                        disabled
                        placeholder="Replies are disabled for this hidden topic."
                        rows={6}
                        className="w-full resize-y rounded-md border border-gray-300 bg-gray-200 p-3 text-gray-500"
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-md bg-gray-400 px-6 py-2 font-medium text-white"
                        >
                            Submit Reply
                        </button>
                    </div>
                </section>
            ) : (
                <section className="mt-8 rounded-md border border-gray-300 bg-gray-100 p-6">
                    <h2 className="mb-4 text-2xl font-bold">Add a Reply</h2>
                    <form onSubmit={handleSubmitReply} noValidate>
                        <label htmlFor="reply-content" className="mb-2 block font-semibold">
                            Your Reply
                        </label>
                        <textarea
                            id="reply-content"
                            name="content"
                            value={content}
                            onChange={(event) => {
                                setContent(event.target.value);
                                setReplyError('');
                                setReplySuccess('');
                            }}
                            placeholder="Write your reply..."
                            rows={6}
                            disabled={submitting}
                            className="w-full resize-y rounded-md border border-gray-300 bg-white p-3"
                        />
                        {replyError && (
                            <div role="alert" className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
                                {replyError}
                            </div>
                        )}
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-md bg-[#2563a6] px-6 py-2 font-medium text-white hover:bg-[#1d4f87] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? 'Submitting...' : 'Submit Reply'}
                            </button>
                        </div>
                        {replySuccess && (
                            <div role="status" className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700">
                                {replySuccess}
                            </div>
                        )}
                    </form>
                </section>
            )}
        </div>
    );
};

export default TopicDetail;