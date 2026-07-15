import { io } from 'socket.io-client'

const socket = io("https://doodlecam.onrender.com");

export default socket