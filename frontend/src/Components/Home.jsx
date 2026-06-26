import { useState, useEffect, useRef } from 'react';

import socket from '../socket'

import HomeBackground from '../adrawn/HomeBackground.png'


function Home({onUsernameChosen, onStartLobby, onJoinLobby, onIsHost, onSetCode, onSetUsername, onSetPlayers}) {
    const [ username, setUsername ] = useState('')
    const [ code, setCode ] = useState('')

    const usernameRef = useRef(username)
    useEffect(() => { usernameRef.current = username }, [username])
     

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

        createdLobby(username)
    }

    function checkJoinLobby() {
        onIsHost(false)

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
        <div className='flex items-center justify-center color4 p-1 rounded-lg mt-5'
            style={{
                backgroundImage: `url(${HomeBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '100vh',
                width: '100vw',
                margin: 0
            }}>
            <div className='flex flex-col justify-center items-center color3 p-4 rounded-lg w-2/7 mt-10' style={{ alignSelf: 'flex-start' }}>
                <input className='my-2 color4 w-full p-5 rounded-lg mb-3 text-xl' value={username} onChange={e => checkUsername(e.target.value)} placeholder='Username' />
                <input className='my-2 w-7/8 p-3 rounded-lg color4' value={code} onChange={e => checkCode(e.target.value)} placeholder='Room code' />
                <p className='mb-10 text-sm'>* Starting lobby doesn't need code *</p>
                <div>
                    <button className='my-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-lg color4 m-2 text-xl' onClick={checkStartLobby}>Start Lobby</button>
                    <button className='my-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-lg color4 m-2 text-xl' onClick={checkJoinLobby}>Join Lobby</button>
                </div>
            </div>
        </div>
    )
}


export default Home