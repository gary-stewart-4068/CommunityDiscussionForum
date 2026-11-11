import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const AdminModeration = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const fetchReports = async () => {
    try { setError(''); const response = await axiosInstance.get('/api/reports'); setReports(response.data); }
    catch (err) { setError(err.response?.data?.message || 'Reports could not be loaded. Please try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchReports(); }, []);
  const handleDecision = async (reportId, decision) => {
    const action = decision === 'Approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this Report?`)) { return; }
    try {
      setProcessingId(reportId); setError('');
      const response = await axiosInstance.put(`/api/reports/${reportId}/decision`, { decision });
      setReports(currentReports => currentReports.map(report => report._id === reportId ? response.data : report));
    } catch (err) {
      setError(err.response?.data?.message || 'The Report decision could not be saved. Please try again.');
      // Refresh in case another Admin resolved the Report.
      await fetchReports();
    } finally { setProcessingId(null); }
  };

  const formatDate = (date) => { if (!date) return 'Not available'; return new Date(date).toLocaleString(); };
  const getReportedTopic = (report) => {
    return report.contentType === 'Topic'
      ? report.content
      : report.topic;
  };

  const getDecisionStyle = (decision) => {
    switch (decision) {
      case 'Approved': return 'bg-red-100 text-red-800';
      case 'Rejected': return 'bg-green-100 text-green-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const sortedReports = [...reports].sort((a, b) => {
    const decisionOrder = {
      Open: 0,
      Approved: 1,
      Rejected: 2
    };
    const statusDifference = decisionOrder[a.decision] - decisionOrder[b.decision];
    if (statusDifference !== 0) {return statusDifference;}
    // Within each decision group, newest Reports appear first.
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p>Loading Reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Report Moderation</h1>
        <p className="text-gray-600 mt-2">Review reported Topics and Replies and record moderation decisions.</p>
      </div>

      {error && (
        <div role="alert" className="mb-5 p-3 rounded bg-red-100 text-red-800">{error}</div>
      )}
      <div className="mb-5 text-sm text-gray-600">
        Total Reports: {reports.length}
        {' | '}
        Open: {reports.filter(r => r.decision === 'Open').length}
        {' | '}
        Approved: {reports.filter(r => r.decision === 'Approved').length}
        {' | '}
        Rejected: {reports.filter(r => r.decision === 'Rejected').length}
      </div>

      {reports.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-center text-gray-600">No Reports have been submitted.</div>
      ) : (
        <div className="space-y-5">
          {sortedReports.map(report => {
            const topic = getReportedTopic(report);
            const content = report.content;
            const isReply = report.contentType === 'Reply';
            return (
              <article key={report._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <div className="flex flex-wrap justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{report.contentType} Report</h2>
                    <p className="text-sm text-gray-500">Submitted {formatDate(report.createdAt)}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold h-fit ${getDecisionStyle(report.decision)}`}
                  >
                    {report.decision}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Report details</h3>
                    <p className="text-sm text-gray-700">
                      <strong>Reporter:</strong>{' '}
                      {report.reporter?.name || 'Unavailable'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1"><strong>Reason:</strong></p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{report.reason}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Reported content</h3>
                    {content ? (
                      <>
                        <p className="text-sm text-gray-700">
                          <strong>Author:</strong>{' '}
                          {content.author?.name || 'Unavailable'}
                        </p>
                        {isReply && topic && (
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Parent Topic:</strong>{' '}
                            {topic.title}
                          </p>
                        )}
                        {!isReply && (
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Title:</strong>{' '}
                            {content.title}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-gray-700 mt-3">
                          Content:
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {content.content}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Visibility:{' '}
                          {content._visible ? 'Visible' : 'Hidden'}
                        </p>
                        {topic && (
                          <Link
                            to={`/topics/${topic._id}`}
                            className="inline-block mt-3 text-blue-700 hover:underline text-sm font-medium"
                          >
                            Open Topic
                          </Link>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-red-700">
                        The reported content is unavailable.
                      </p>
                    )}
                  </div>
                </div>
                {report.decision !== 'Open' && (
                  <div className="border-t mt-4 pt-3 text-sm text-gray-600">
                    <p>
                      <strong>Decision by:</strong>{' '}
                      {report.decider?.name || 'Administrator'}
                    </p>
                    <p>
                      <strong>Decision date:</strong>{' '}
                      {formatDate(report.decidedAt)}
                    </p>
                  </div>
                )}
                {report.decision === 'Open' && (
                  <div className="border-t mt-4 pt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleDecision(report._id, 'Approved')}
                      disabled={processingId !== null}
                      className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {processingId === report._id
                        ? 'Processing...'
                        : 'Approve and Hide'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(report._id, 'Rejected')}
                      disabled={processingId !== null}
                      className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      Reject Report
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminModeration;