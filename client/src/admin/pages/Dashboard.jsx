import React from 'react';
import { useAuth } from '../../shared/context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div style={containerStyle}>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <p>Role: {user.role}</p>
        </div>
      ) : (
        <p>Please log in to view your dashboard.</p>
      )}
    </div>
  );
};

const containerStyle = {
  padding: '2rem',
};

export default Dashboard;
