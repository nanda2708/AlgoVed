const mockLeaderboard = [
  { rank: 1, username: 'user1', score: 1500 },
  { rank: 2, username: 'user2', score: 1200 },
  { rank: 3, username: 'user3', score: 900 },
];

export default function Leaderboard() {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
      <table className="w-full border-collapse bg-white rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Rank</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {mockLeaderboard.map((user) => (
            <tr key={user.rank} className="border">
              <td className="border p-2">{user.rank}</td>
              <td className="border p-2">{user.username}</td>
              <td className="border p-2">{user.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}