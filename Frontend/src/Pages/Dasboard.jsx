import { useAuth } from '../Context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h2>Welcome, {user.name} ({user.role})</h2>
      {user.role === 'farmer' && <Link to="/farmer">Farmer Dashboard</Link>}
      {user.role === 'owner' && <Link to="/owner">Owner Dashboard</Link>}
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
