import { useState, useEffect, useRef } from 'react';

import socket from '../socket'

import sounds, { fadeIn, fadeOut } from '../sounds'

import LocalCam from './LocalCam';
import PlaceholderCam from './PlaceholderCam';

import HomeBackground from '../adrawn/HomeBackground.png'
import TitleLogo from  '../adrawn/TitleLogo2.png'

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


function Home({onUsernameChosen, onStartLobby, onJoinLobby, onIsHost, onSetCode, onSetUsername, onSetPlayers, localStream, setLocalStream, localStreamRef}) {
    const [ username, setUsername ] = useState('')
    const [ code, setCode ] = useState('')

    const usernameRef = useRef(username)
    useEffect(() => { usernameRef.current = username }, [username])

    const { width, height } = useWindowDimensions()

    const camWidth = Math.round(width * 0.5)
    const camHeight = Math.round(camWidth * (9 / 16))

    const miniCamHeight = Math.round(height / 8)
    const miniCamWidth = Math.round(miniCamHeight * (16 / 9))

    async function handleEnableCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            localStreamRef.current = stream
            setLocalStream(stream)
        } catch(err) {
            console.log('Failed to get camera stream', err)
        }
    }
     

    // Check for created Lobby data
    useEffect(() => {
        function handleLobbyCreated(data) {
            onSetCode(data.code)
            onSetUsername(usernameRef.current)
            onSetPlayers(data.players)
            onJoinLobby(true)
        }

        socket.on('lobbyCreated', handleLobbyCreated)

        return () => socket.off('lobbyCreated', handleLobbyCreated)
    }, [])

    // Check if the code is valid
    useEffect(() => {
        function handlePlayerJoined(data) {
            onSetCode(data.code)
            onSetUsername(usernameRef.current)
            onSetPlayers(data.players)
            onJoinLobby(true)
        }

        function handleError(data) {
            console.log('error:', data.message)
        }

        socket.on('playerJoined', handlePlayerJoined)
        socket.on('error', handleError)

        return () => {
            socket.off('playerJoined', handlePlayerJoined)
            socket.off('error', handleError)
        }
    }, [])



    function checkUsername(username) {
        setUsername(username)

        if(username === '') {
            onUsernameChosen(false)
        } else {
            onUsernameChosen(true)
        }
    }

    function checkCode(roomCode) {
        setCode(roomCode)
    }

    function checkStartLobby() {
        onIsHost(true)
        fadeIn(sounds.background)

        createdLobby(username)
    }

    function checkJoinLobby() {
        onIsHost(false)
        sounds.background.play()

        if(username) {
            joinedLobby(username, code)
        }
    }



    // Create a Lobby with Socket
    function createdLobby(username) {
        socket.emit('createLobby', {username})
    }

    // Join lobby with socket
    function joinedLobby(username, roomCode) {
        socket.emit('joinLobby', {username, roomCode})
    }
    



    return (
        <div className='flex items-center flex-col pt-10'
            style={{
                backgroundImage: `url(${HomeBackground})`,
                backgroundSize: '100% auto',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                height: '100vh',
                width: '100vw',
                margin: 0
            }}>
            <div className='mb-5'>
                <img src={TitleLogo} alt='DoodleCam Logo' className='w-[45vw] max-w-[80vw]'/>
            </div>

            <div className='flex flex-col justify-center items-center color3 p-4 rounded-3xl mb-5 w-2/7'>
                <input className='color4 w-full p-4 rounded-xl mb-3 text-3xl' value={username} onChange={e => checkUsername(e.target.value)} placeholder='Username' />
                <input className='my-2 w-7/8 p-2 rounded-xl color4 text-xl' value={code} onChange={e => checkCode(e.target.value)} placeholder='Room code' />
                <p className='mb-10 text-sm'>* Starting lobby doesn't need code *</p>
                <div>
                    <button className='mt-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-xl color4 mx-3 text-xl' onClick={checkStartLobby}>Start Lobby</button>
                    <button className='mt-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-xl color4 mx-3 text-xl' onClick={checkJoinLobby}>Join Lobby</button>
                </div>
            </div>

            <div className='flex flex-col justify-center items-center color3 p-3 rounded-3xl'>
                <p className='mb-5 text-sm'>* Test your camera before playing *</p>
                <div className='flex flex-row justify-center items-center'>
                    {localStream ? <LocalCam stream={localStream} camHeight={miniCamHeight} camWidth={miniCamWidth}/> : <PlaceholderCam camHeight={miniCamHeight} camWidth={miniCamWidth}/>}
                    <button className='ml-3 mt-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 px-5 py-3 rounded-xl color4' onClick={handleEnableCamera}>Test</button>
                </div>
            </div>
        </div>
    )
}


export default Home