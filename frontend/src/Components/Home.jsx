import { useState, useEffect } from 'react';

import socket from '../socket'


function Home({onUsernameChosen, onStartLobby, onJoinLobby, onIsHost, onSetCode, onSetUsername}) {
    const [ username, setUsername ] = useState('')
    const [ code, setCode ] = useState('')
     

    // Check for created Lobby data
    useEffect(() => {
        socket.on('lobby_created', (data) => {
            console.log('lobby created, code:', data.code)
            onSetCode(data.code)
            onSetUsername(username)
            onStartLobby(true)
        })

        return () => socket.off('lobby_created')
    }, [username])

    // Check if the code is valid
    useEffect(() => {
        socket.on('player_joined', (data) => {
            onSetCode(data.code)
            onSetUsername(username)
            onJoinLobby(true)
        })

        socket.on('error', (data) => {
            console.log('invalid code')
        })

        return () => {
            socket.off('player_joined')
            socket.off('error')
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

        joinedLobby(username, code)
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