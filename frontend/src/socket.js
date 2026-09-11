import { io } from 'socket.io-client';

const SOCKET_URL = 'https://quiz-game-o8a7.onrender.com';


export const socket = io(SOCKET_URL, { autoConnect: true });
