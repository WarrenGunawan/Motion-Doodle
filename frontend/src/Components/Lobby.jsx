import { useState, useEffect } from 'react';
import Camera from './Camera'

import socket from '../socket'


function useWindowWidth() {
    const [size, setSize] = useState({
        width: window.innerWidth,
    })

    useEffect(() => {
        const handleResize = () => setSize({
        width: window.innerWidth,
        })

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, []);
    return size
}





function Lobby({ isHost, username, code }) {
    // Player state array
    const [ players, setPlayers ] = useState([])


    // Check for lobby Code
    useEffect(() => {
        socket.on('player_joined', (data) => {
            console.log('players:', data.players)
            setPlayers(data.players)

        })

        socket.on('error', (data) => {
            console.log('error:', data.message)
        })

        return () => {
            socket.off('player_joined')
            socket.off('error')
        }
    }, [])



    // Dimensions of the screen
    const { width } = useWindowWidth()
    const mWidth = `${width * 0.6}px`


    return (
        <div className='flex items-center justify-center color4 p-1 rounded-lg mt-5'>
            <div className='flex justify-center items-center color3 p-2 rounded-lg'>
                <div className='flex flex-col justify-center items-center color2 p-4 rounded-lg'>
                    {isHost && 
                        <p>{code}</p> 
                    }
                    <p>{username}</p>
                    <Camera/>
                </div>
            </div>
        </div>
    )
}

export default Lobby