import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';

const ReportControl = ({contentType, contentId, alreadyReported, onSubmitted}) => {
    const [showForm, setShowForm] = useState(false);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (!reason.trim()) {setError('Please provide a reason for reporting this content.');return;}
        if (reason.trim().length > 1000) {setError('The report reason cannot exceed 1000 characters.');return;}
        try {
            setSubmitting(true);
            await axiosInstance.post('/api/reports', {contentType, contentId, reason: reason.trim()});
            onSubmitted(contentType, contentId);
            setReason('');
            setShowForm(false);
        } catch (err) {
            setError(err.response?.data?.message || 'The report could not be submitted. Please try again.' );
        } finally {setSubmitting(false);}
    };

    if (alreadyReported) {
        return (
            <button
                type="button"
                disabled
                className="inline-flex h-10 w-36 cursor-not-allowed items-center justify-center rounded bg-yellow-600 px-4 text-center font-medium text-white opacity-60"
            >
                Report {contentType}
            </button>
        );
    }

    return (
        <div className="flex items-center">
            {!showForm ? (
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex h-10 w-36 items-center justify-center rounded bg-yellow-600 px-4 text-center font-medium text-white hover:bg-yellow-700"
                >
                    Report {contentType}
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="mt-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Why are you reporting this {contentType.toLowerCase()}?
                    </label>

                    <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                        placeholder="Enter your reason..."
                        disabled={submitting}
                    />

                    {error && (<p className="text-sm text-red-600">{error}</p>)}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit report'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setReason('');
                                setError('');
                            }}
                            disabled={submitting}
                            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ReportControl;