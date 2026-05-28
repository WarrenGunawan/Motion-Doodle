import { useState, useEffect } from 'react';



function Home({onUsernameChosen, onLobbyCodeSelected, onLobbyStarted, onStartButton}) {

    function checkUsername(name) {
        setUsername(name)

        if(name === '') {
            onUsernameChosen(false)
        } else {
            onUsernameChosen(true)
        }
    }


    function checkRoomCode(code) {
        setRoomCode(code)

        if(code === '') {
            onLobbyCodeSelected(false)
        } else {
            onLobbyCodeSelected(true)
        }
    }

    function checkStartLobby() {
        if(isChecked) {
            setIsChecked(false)
            onLobbyStarted(false)
        } else {
            setIsChecked(true)
            onLobbyStarted(true)
        }
    }

    function checkStartButton() {
        onStartButton(true)
    }




    const [ username, setUsername ] = useState('')
    const [ roomCode, setRoomCode ] = useState('')
    const [ isChecked, setIsChecked ] = useState(false)





    return (
        <div className='flex items-center justify-center color4 p-1 rounded-lg mt-5'>
            <div className='flex justify-center items-center color3 p-2 rounded-lg'>
                <div className='flex flex-col justify-center items-center color2 p-4 rounded-lg'>
                    <input className='my-2' value={username} onChange={e => checkUsername(e.target.value)} placeholder='Username' />
                    <div className='flex my-2'>
                        <p>Start Your Own Lobby?</p>
                        <input type='checkbox' checked={isChecked} onChange={checkStartLobby}/>
                    </div>
                    <input className='my-2' value={roomCode} onChange={e => checkRoomCode(e.target.value)} placeholder='Room code' />
                    <button className='my-2' onClick={checkStartButton} className='opacity-100 active:opacity-50 transition-opacity hover:opacity-75'>Start</button>
                </div>
            </div>
        </div>
    )
}


export default Home