import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import ReportControl from '../components/ReportControl';

const TopicDetail = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [topic, setTopic] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [replySuccess, setReplySuccess] = useState('');
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editReplyContent, setEditReplyContent] = useState('');
    const [replyEditError, setReplyEditError] = useState('');
    const [updatingReply, setUpdatingReply] = useState(false);
    const [editingTopic, setEditingTopic] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editTopicContent, setEditTopicContent] = useState('');
    const [topicEditError, setTopicEditError] = useState('');
    const [topicEditSuccess, setTopicEditSuccess] = useState('');
    const [updatingTopic, setUpdatingTopic] = useState(false);
    const [reportedContent, setReportedContent] = useState(new Set());
    const [moderationError, setModerationError] = useState('');

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

    useEffect(() => {
        let cancelled = false;
        const fetchMyReports = async () => {
            try {
                const response = await axiosInstance.get('/api/reports/mine');
                if (!cancelled) {setReportedContent(new Set(response.data.map((report) => `${report.contentType}:${report.contentId}`)));}
            } catch (error) {console.error('Could not retrieve your submitted Reports:', error);}
        };
        if (user) {fetchMyReports();} else {setReportedContent(new Set());}
        return () => {cancelled = true;};
    }, [user]);

    const handleReportSubmitted = (contentType, contentId) => {
        setReportedContent((previousReports) => {
            const updatedReports = new Set(previousReports);
            updatedReports.add(`${contentType}:${contentId}`);
            return updatedReports;
        });
    };

    const formatDate = (date) => {
        if (!date) return 'Not available';
        return new Date(date).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', });
    };

    const handleUpdateTopic = async (event) => {
        event.preventDefault();
        setTopicEditError('');
        setTopicEditSuccess('');
        if (!editTitle.trim() || !editTopicContent.trim()) {
            setTopicEditError('Topic title and content cannot be empty.');
            return;
        }
        setUpdatingTopic(true);
        try {
            const response = await axiosInstance.put(
                `/api/topics/${topicId}`,
                {
                    title: editTitle.trim(),
                    content: editTopicContent.trim()
                }
            );
            setTopic((previousTopic) => ({...previousTopic, ...response.data, author: previousTopic.author }));
            setEditingTopic(false);
            setTopicEditSuccess('Your topic has been updated successfully.');
        } catch (error) {
            setTopicEditError(
                error.response?.data?.message ||
                'Your topic could not be updated. Please try again.'
            );
        } finally {
            setUpdatingTopic(false);
        }
    };

    const handleDeleteTopic = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this topic? All replies associated with it, including replies written by other members, will also be permanently deleted.'
        );
        if (!confirmed) {return; }
        setTopicEditError('');
        try {
            await axiosInstance.delete(`/api/topics/${topicId}`);
            navigate('/forum');
        } catch (error) {
            setTopicEditError(
                error.response?.data?.message ||
                'Your topic could not be deleted. Please try again.'
            );
        }
    };

    const handleAdminTopicVisibility = async () => {
        const visible = !topic._visible;
        const replyCount = replies.length;
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
            await axiosInstance.put(`/api/topics/${topicId}/visibility`, { visible });
            setTopic((previousTopic) => ({...previousTopic, _visible: visible
            }));
            // Unhiding a Topic also makes every associated Reply visible.
            // Hiding a Topic preserves the individual Reply visibility flags.
            if (visible) {
                setReplies((previousReplies) =>
                    previousReplies.map((reply) => ({...reply, _visible: true }))
                );
            }
        } catch (error) {
            setModerationError(error.response?.data?.message || 'Topic visibility could not be changed. Please try again.');
        }
    };

    const handleAdminDeleteTopic = async () => {
        const replyCount = replies.length;
        const confirmed = window.confirm(
            `Are you sure you want to permanently delete Topic "${topic.title}"?\n\n` +
            `This will also permanently delete all ${replyCount} associated Replies, including Replies written by other Members.\n\n` +
            `All Reports associated with this Topic and its Replies will also be permanently deleted.\n\n` +
            `This action cannot be undone.`
        );
        if (!confirmed) return;
        setModerationError('');
        try {
            await axiosInstance.delete(`/api/topics/admin/${topicId}`); navigate('/forum');
        } catch (error) {
            setModerationError(error.response?.data?.message || 'Topic could not be deleted. Please try again.');
        }
    };

    const handleAdminReplyVisibility = async (reply) => {
        const visible = !reply._visible;
        const actionDescription = visible
            ? 'make this Reply visible'
            : 'hide this Reply';
        const confirmed = window.confirm(
            `Are you sure you want to ${actionDescription}?\n\n` +
            (visible
                ? 'Members will be able to see this Reply, provided its Topic is visible.'
                : 'This Reply will no longer be visible to Members. The Topic and its other Replies will remain unchanged.')
        );
        if (!confirmed) return;
        setModerationError('');
        try {
            await axiosInstance.put(`/api/topics/${topicId}/replies/${reply._id}/visibility`, { visible });
            setReplies((previousReplies) =>
                previousReplies.map((item) =>
                    item._id === reply._id
                        ? { ...item, _visible: visible }
                        : item
                )
            );
        } catch (error) {
            setModerationError(error.response?.data?.message || 'Reply visibility could not be changed. Please try again.' );
        }
    };

    const handleAdminDeleteReply = async (reply) => {
        const confirmed = window.confirm(
            `Are you sure you want to permanently delete this Reply?\n\n` +
            `Reply: "${reply.content}"\n\n` +
            `All Reports associated with this Reply will also be permanently deleted.\n\n` +
            `This action cannot be undone.`
        );
        if (!confirmed) return;
        setModerationError('');
        try {
            await axiosInstance.delete(`/api/topics/admin/${topicId}/replies/${reply._id}`);
            setReplies((previousReplies) =>
                previousReplies.filter((item) => item._id !== reply._id)
            );
        } catch (error) {
            setModerationError(error.response?.data?.message || 'Reply could not be deleted. Please try again.');
        }
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

    const handleUpdateReply = async (event, replyId) => {
        event.preventDefault();
        setReplyEditError('');
        if (!editReplyContent.trim()) {setReplyEditError('Reply content cannot be empty.'); return; }
        setUpdatingReply(true);
        try {
            const response = await axiosInstance.put(
                `/api/topics/${topicId}/replies/${replyId}`,
                { content: editReplyContent.trim() }
            );
            setReplies((previousReplies) =>
                previousReplies.map((reply) =>
                    reply._id === replyId
                        ? response.data
                        : reply
                )
            );
            setEditingReplyId(null);
            setEditReplyContent('');
        } catch (error) {
            setReplyEditError(error.response?.data?.message || 'Your reply could not be updated. Please try again.' );
        } finally {
            setUpdatingReply(false);
        }
    };
    const handleDeleteReply = async (replyId) => {
        const confirmed = window.confirm('Are you sure you want to permanently delete this reply?');
        if (!confirmed) {return; }
        setReplyEditError('');
        try {
            await axiosInstance.delete(`/api/topics/${topicId}/replies/${replyId}`);
            setReplies((previousReplies) =>
                previousReplies.filter((reply) => reply._id !== replyId)
            );
        } catch (error) {
            setReplyEditError(error.response?.data?.message || 'Your reply could not be deleted. Please try again.');
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
                {topic._visible && reportedContent.has(`Topic:${topic._id}`) && (
                    <span className="absolute right-4 top-4 rounded bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-800">
                        Report submitted
                    </span>
                )}
                {editingTopic ? (
                    <form onSubmit={handleUpdateTopic} className="mb-6">
                        <label htmlFor="edit-topic-title" className="mb-2 block font-semibold">Topic Title</label>
                        <input
                            id="edit-topic-title"
                            type="text"
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
                            disabled={updatingTopic}
                            className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
                        />
                        <label htmlFor="edit-topic-content" className="mb-2 block font-semibold">Topic Content</label>
                        <textarea
                            id="edit-topic-content"
                            value={editTopicContent}
                            onChange={(event) => setEditTopicContent(event.target.value)}
                            rows={5}
                            disabled={updatingTopic}
                            className="w-full rounded border border-gray-300 px-3 py-2"
                        />
                        {topicEditError && (<p role="alert" className="mt-3 rounded bg-red-100 p-3 text-red-700">{topicEditError}</p>)}

                        <div className="mt-3 flex gap-2">
                            <button
                                type="submit"
                                disabled={updatingTopic}
                                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {updatingTopic ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingTopic(false);
                                    setTopicEditError('');
                                }}
                                disabled={updatingTopic}
                                className="rounded border border-gray-400 px-4 py-2 text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <h1 className="mb-4 pr-20 text-3xl font-bold">{topic.title}</h1>
                        <p className="mb-6 whitespace-pre-wrap text-gray-700">
                            {topic.content}
                        </p>
                    </>
                )}
                {!editingTopic && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        {/* Existing Member actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {topic.author?._id === (user?._id || user?.id) && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingTopic(true);
                                            setEditTitle(topic.title);
                                            setEditTopicContent(topic.content);
                                            setTopicEditError('');
                                            setTopicEditSuccess('');
                                        }}
                                        className="rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
                                    >
                                        Edit Topic
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteTopic}
                                        disabled={updatingTopic}
                                        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Delete Topic
                                    </button>
                                </>
                            )}
                            {topic._visible && (
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
                                    onClick={handleAdminTopicVisibility}
                                    className="inline-flex h-10 items-center justify-center rounded px-4 font-medium text-white hover:opacity-90"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                >
                                    Change Visibility
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAdminDeleteTopic}
                                    className="inline-flex h-10 items-center justify-center rounded px-4 font-medium text-white hover:opacity-90"
                                    style={{ backgroundColor: 'var(--color-danger)' }}
                                >
                                    Delete Topic
                                </button>
                            </div>
                        )}
                    </div>
                )}
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
            {topicEditError && !editingTopic && (
                <p role="alert" className="mt-4 rounded bg-red-100 p-4 text-red-700">{topicEditError}</p>
            )}
            {moderationError && (
                <p role="alert" className="mt-4 rounded bg-red-100 p-4 text-red-700">{moderationError}</p>
            )}
            {topicEditSuccess && (
                <p role="status" className="mt-4 rounded bg-green-100 p-4 text-green-700">{topicEditSuccess}</p>
            )}
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
                                {user?.role === 'Admin' && (!topic._visible || !reply._visible) && (
                                    <span className="absolute right-4 top-4 rounded bg-red-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                                        {!topic._visible && !reply._visible
                                            ? 'Hidden Reply & Topic'
                                            : !topic._visible
                                                ? 'Hidden with Topic'
                                                : 'Hidden Reply'}
                                    </span>
                                )}
                                {topic._visible && reply._visible &&
                                    reportedContent.has(`Reply:${reply._id}`) && (
                                        <span className="absolute right-4 top-4 rounded bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-800">
                                            Report submitted
                                        </span>
                                    )}
                                {editingReplyId === reply._id ? (
                                    <form
                                        onSubmit={(event) => handleUpdateReply(event, reply._id)}
                                        className="mb-4"
                                    >
                                        <label
                                            htmlFor={`edit-reply-${reply._id}`}
                                            className="mb-2 block font-semibold"
                                        >
                                            Edit Reply
                                        </label>
                                        <textarea
                                            id={`edit-reply-${reply._id}`}
                                            value={editReplyContent}
                                            onChange={(event) => {
                                                setEditReplyContent(event.target.value);
                                                setReplyEditError('');
                                            }}
                                            rows={5}
                                            disabled={updatingReply}
                                            className="w-full resize-y rounded-md border border-gray-300 bg-white p-3"
                                        />
                                        {replyEditError && (
                                            <p role="alert" className="mt-3 rounded bg-red-100 p-3 text-red-700">
                                                {replyEditError}
                                            </p>
                                        )}
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={updatingReply}
                                                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                                            >
                                                {updatingReply ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingReplyId(null);
                                                    setEditReplyContent('');
                                                    setReplyEditError('');
                                                }}
                                                disabled={updatingReply}
                                                className="rounded border border-gray-400 px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="mb-4 whitespace-pre-wrap text-gray-700">{reply.content}</p>
                                )}
                                {replyEditError && (
                                    <p role="alert" className="mb-4 rounded bg-red-100 p-3 text-red-700">{replyEditError}</p>
                                )}
                                {editingReplyId !== reply._id && (
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                        {/* Existing Member actions */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {reply.author?._id === (user?._id || user?.id) && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingReplyId(reply._id);
                                                            setEditReplyContent(reply.content);
                                                            setReplyEditError('');
                                                        }}
                                                        className="rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
                                                    >
                                                        Edit Reply
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReply(reply._id)}
                                                        disabled={updatingReply}
                                                        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Delete Reply
                                                    </button>
                                                </>
                                            )}
                                            {topic._visible && reply._visible && (
                                                <ReportControl
                                                    contentType="Reply"
                                                    contentId={reply._id}
                                                    alreadyReported={reportedContent.has(`Reply:${reply._id}`)}
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
                                                    onClick={() => handleAdminReplyVisibility(reply)}
                                                    className="inline-flex h-10 items-center justify-center rounded px-4 font-medium text-white hover:opacity-90"
                                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                                >
                                                    Change Visibility
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdminDeleteReply(reply)}
                                                    className="inline-flex h-10 items-center justify-center rounded px-4 font-medium text-white hover:opacity-90"
                                                    style={{ backgroundColor: 'var(--color-danger)' }}
                                                >
                                                    Delete Reply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
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