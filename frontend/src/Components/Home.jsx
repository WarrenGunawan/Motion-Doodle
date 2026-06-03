import { useState, useEffect, useRef } from 'react';

import socket from '../socket'


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

        socket.on('lobby_created', handleLobbyCreated)

        return () => socket.off('lobby_created', handleLobbyCreated)
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

        socket.on('player_joined', handlePlayerJoined)
        socket.on('error', handleError)

        return () => {
            socket.off('player_joined', handlePlayerJoined)
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
        socket.emit('create_lobby', {username})
    }

    // Join lobby with socket
    function joinedLobby(username, roomCode) {
        socket.emit('join_lobby', {username, roomCode})
    }
    



    return (
        <div className='flex items-center justify-center color4 p-1 rounded-lg mt-5'>
            <div className='flex justify-center items-center color3 p-2 rounded-lg'>
                <div className='flex flex-col justify-center items-center color2 p-4 rounded-lg'>
                    <input className='my-2' value={username} onChange={e => checkUsername(e.target.value)} placeholder='Username' />
                    <p>Start Your Own Lobby?</p>
                    <button className='my-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75' onClick={checkStartLobby}>Start Lobby</button>
                    <input className='my-2' value={code} onChange={e => checkCode(e.target.value)} placeholder='Room code' />
                    <button className='my-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75' onClick={checkJoinLobby}>Join Lobby</button>
                </div>
            </div>
        </div>
    )
}


export default Home