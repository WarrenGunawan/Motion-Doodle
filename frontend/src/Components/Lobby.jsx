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





function Lobby({ isHost, username, code, players, setPlayers }) {
    // Check for lobby Code
    useEffect(() => {
        socket.on('player_joined', (data) => {
            onSetPlayers(data.players)
        })

        socket.on('error', (data) => {
            console.log('error:', data.message)
        })

        return () => {
            socket.off('player_joined')
            socket.off('error')
        }
    }, [players])



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
                        <div key={p} className='leading-none'>
                            {p === username ? <Camera camWidth={miniCamWidth} camHeight={miniCamHeight} /> : <PlaceholderCam name={p} camWidth={miniCamWidth} camHeight={miniCamHeight}/>}
                        </div>
                    ))}
                </div>

               <div>
                    <Camera camWidth={camWidth} camHeight={camHeight} />
                </div>

                <div className='absolute left-full flex flex-col'>
                    {players.map(p => (
                        <div key={p}>{p}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Lobby