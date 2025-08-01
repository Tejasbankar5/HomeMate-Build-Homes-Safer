import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Meetings.css';

const ProviderMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get('/api/meetings', {
        withCredentials: true
      });
      setMeetings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (meetingId, status) => {
    try {
      await axios.put(`/api/meetings/${meetingId}/status`, {
        status
      }, {
        withCredentials: true
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error updating meeting status:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="meetings-container">
      <h2>Your Scheduled Meetings</h2>
      {meetings.length === 0 ? (
        <p>No meetings scheduled</p>
      ) : (
        <div className="meetings-list">
          {meetings.map(meeting => (
            <div key={meeting.id} className="meeting-card">
              <div className="meeting-header">
                <h3>With: {meeting.client_email}</h3>
                <span className={`status-badge ${meeting.status}`}>
                  {meeting.status}
                </span>
              </div>
              <div className="meeting-details">
                <p><strong>Type:</strong> {meeting.meeting_type}</p>
                <p><strong>Time:</strong> {new Date(meeting.meeting_time).toLocaleString()}</p>
                <p><strong>Agenda:</strong> {meeting.agenda}</p>
              </div>
              <div className="meeting-actions">
                {meeting.status === 'pending' && (
                  <>
                    <button 
                      className="confirm-btn"
                      onClick={() => handleUpdateStatus(meeting.id, 'confirmed')}
                    >
                      Confirm
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => handleUpdateStatus(meeting.id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderMeetings;