import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to SkillMatch
        </h1>
        <p className="text-xl text-gray-600">
          Connect with opportunities and professionals in your field
        </p>
      </div>

      {!user ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">For Candidates</h2>
            <ul className="space-y-3 text-gray-600">
              <li>• Find your dream job</li>
              <li>• Connect with recruiters</li>
              <li>• Showcase your skills</li>
              <li>• Get matched with opportunities</li>
            </ul>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">For Recruiters</h2>
            <ul className="space-y-3 text-gray-600">
              <li>• Post job opportunities</li>
              <li>• Find qualified candidates</li>
              <li>• Build your network</li>
              <li>• Match with potential hires</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Recent Jobs</h2>
            <p className="text-gray-600">Check out the latest job opportunities</p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Your Network</h2>
            <p className="text-gray-600">Connect with professionals in your field</p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Latest Posts</h2>
            <p className="text-gray-600">Stay updated with industry news</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 