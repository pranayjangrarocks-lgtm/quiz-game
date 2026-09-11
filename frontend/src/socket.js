import { io } from 'socket.io-client';

const SOCKET_URL = 'https://onrender.com';


export const socket = io(SOCKET_URL, { autoConnect: true });
