'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.js';

const RoomsPage = () => {
  const { user, isLoggedIn, authLoading } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRoomId, setInviteRoomId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/coding-room/user/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch rooms');
      }
    };

    if (isLoggedIn && user) {
      fetchRooms();
    }
  }, [isLoggedIn, user, API_URL]);

  // Create room
  const handleCreateRoom = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/coding-room/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { roomId } = res.data;
      setRooms([...rooms, { roomId, users: [user.userId], code: '// Start coding', language: 'cpp', input: '' }]);
      router.push(`/code-room?roomId=${roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  // Invite user
  const handleInviteUser = async () => {
    if (!inviteRoomId || !inviteUsername) {
      setError('Room ID and Username are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/coding-room/invite`,
        { roomId: inviteRoomId, username: inviteUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteRoomId('');
      setInviteUsername('');
      // Refresh rooms
      const res = await axios.get(`${API_URL}/api/coding-room/user/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invite failed');
    }
  };

  const handleJoinRoom = (roomId) => {
    router.push(`/code-room?roomId=${roomId}`);
  };

  if (authLoading) return <div className="text-white p-4">Loading...</div>;
  if (!isLoggedIn) return null;

  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Your Coding Rooms</h1>

      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded mb-6">{error}</p>}

      <button
        onClick={handleCreateRoom}
        className="mb-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg"
      >
        Create New Room
      </button>

      <div className="mb-10 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Invite a User</h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Room ID"
            value={inviteRoomId}
            onChange={(e) => setInviteRoomId(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 p-3 rounded-lg w-full sm:w-1/2"
          />
          <input
            type="text"
            placeholder="Username"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 p-3 rounded-lg w-full sm:w-1/2"
          />
          <button
            onClick={handleInviteUser}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            Invite
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
      <ul className="grid gap-4">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <li
              key={room.roomId}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <p className="text-lg">
                <span className="font-semibold">Room ID:</span> {room.roomId}
              </p>
              <p className="text-gray-400">
                <span className="font-semibold">Users:</span>{' '}
                {room.users?.length > 0 ? room.users.join(', ') : 'No users'}
              </p>
              <button
                onClick={() => handleJoinRoom(room.roomId)}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
              >
                Join Room
              </button>
            </li>
          ))
        ) : (
          <p className="text-gray-500">You have no rooms yet.</p>
        )}
      </ul>
    </div>
  );
};

export default RoomsPage;
