import React, { useState } from 'react';

function SummarizePage() {
    // 상태 변수 선언
    const [memId, setMemId] = useState('');
    const [bookIdx, setBookIdx] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 요약 요청 핸들러
    const handleSummarize = async () => {
        setLoading(true);
        setError('');
        setSummary('');
    
        try {
            // 요청 URL이 올바른지 확인
            const response = await fetch('http://localhost:3001/summary/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memId, bookIdx })
            });
    
            const data = await response.json();
            if (response.ok) {
                setSummary(data.summary);
            } else {
                setError(data.error || 'Failed to generate summary.');
            }
        } catch (err) {
            console.error('Error fetching summary:', err);
            setError('Error fetching summary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Summarize Book Text</h1>
            <div>
                <input
                    type="text"
                    placeholder="Enter Member ID"
                    value={memId}
                    onChange={(e) => setMemId(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Enter Book Index"
                    value={bookIdx}
                    onChange={(e) => setBookIdx(e.target.value)}
                />
                <button onClick={handleSummarize} disabled={loading}>
                    {loading ? 'Summarizing...' : 'Summarize'}
                </button>
            </div>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {summary && (
                <div>
                    <h2>Summary</h2>
                    <p>{summary}</p>
                </div>
            )}
        </div>
    );
}

export default SummarizePage;
