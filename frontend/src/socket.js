import { io } from 'socket.io-client'

const socket = io("https://doodlecam-backend.onrender.com")

export default socket