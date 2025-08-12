import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <ul className="space-y-4">
        <li>🔍 View all users</li>
        <li>✅ Approve verification documents</li>
        <li>📊 View reports and system metrics</li>
      </ul>
    </div>
  );
};

export default AdminDashboard;
