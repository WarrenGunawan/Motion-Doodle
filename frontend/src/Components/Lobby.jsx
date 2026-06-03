import { useState, useEffect } from 'react';
import Camera from './Camera'
import PlaceholderCam from './PlaceholderCam';

import socket from '../socket'


function useWindowDimensions() {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    })

    useEffect(() => {
        const handleResize = () => setSize({
            width: window.innerWidth,
            height: window.innerHeight
        })

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, []);
    return size
}





function Lobby({ isHost, username, code, players, onSetPlayers }) {
    // Check for new players
    useEffect(() => {
        function handlePlayerJoined(data) {
            onSetPlayers(data.players)
        }

        function handlePlayerLeft(data) {
            onSetPlayers(data.players)
        }

        function handleError(data) {
            console.log('error:', data.message)
        }

        socket.on('player_left', handlePlayerLeft)
        socket.on('player_joined', handlePlayerJoined)
        socket.on('error', handleError)

        return () => {
            socket.off('player_joined', handlePlayerJoined)
            socket.off('player_left', handlePlayerLeft)
            socket.off('error', handleError)
        }
    }, [])


    // Leave the Lobby
    useEffect(() => {
        return () => {
            socket.emit('leave_room', {roomCode: code})
        }
    }, [])





    // Dimensions of the screen
    const { width, height } = useWindowDimensions()

    const camWidth = width * 0.5
    const camHeight = camWidth * (9/16)

    const miniCamHeight = height / 8
    const miniCamWidth = miniCamHeight * (16/9)



    return (
        <div className='flex flex-col h-screen justify-center items-center'>
            <p>{code}</p>
            <div className='relative flex items-center'>
                <div className='absolute right-full flex flex-col'>
                    {players.map(p => (
                        <div key={p.id} className='leading-none'>
                            {p.id === socket.id ? <Camera camWidth={miniCamWidth} camHeight={miniCamHeight} canDraw={false}/> : <PlaceholderCam name={p.username} camWidth={miniCamWidth} camHeight={miniCamHeight}/>}
                        </div>
                    ))}
                </div>

               <div>
                    <Camera camWidth={camWidth} camHeight={camHeight} canDraw={true}/>
                </div>

                <div className='absolute left-full flex flex-col'>
                    {players.map(p => (
                        <div key={p.id} className='whitespace-nowrap'>{p.username}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Lobby