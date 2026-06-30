import { useState, useEffect } from 'react';
import Lobby from './Components/Lobby'
import Home from './Components/Home'

import socket from './socket'







function App() {
  const [ screen, setScreen ] = useState('home')

  const [ userNameChosen, setUsernameChosen ] = useState(false)
  const [ startLobby, setStartLobby ] = useState(false)
  const [ joinLobby, setJoinLobby ] = useState(false)

  const [ username, setUsername ] = useState('')
  const [ isHost, setIsHost ] = useState(false)
  const [ code, setCode ] = useState('')

  const [players, setPlayers] = useState([])



  // Checks for socket connection
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Server, id:', socket.id)
    })

    return () => socket.off('connect')
  }, [])

  // Rerenders page once the start button press is detected
  useEffect(() => {
    if(userNameChosen && (joinLobby || startLobby)) {
      moveToLobby()
    } else {
      setJoinLobby(false)
      setStartLobby(false)
    }
  }, [startLobby, joinLobby, userNameChosen])


  // Helper Functions
  function moveToLobby() {
    setScreen('lobby')
  }

  function moveToHome() {
    setScreen('home')
    setPlayers([])
    setCode('')
    setUsername('')
    setUsernameChosen(false)
    setStartLobby(false)
    setJoinLobby(false)
    setIsHost(false)
  }


  return (
    <div>
      {screen === 'home' && <Home onUsernameChosen={setUsernameChosen} onStartLobby={setStartLobby} onJoinLobby={setJoinLobby} onIsHost={setIsHost} onSetCode={setCode} onSetUsername={setUsername} onSetPlayers={setPlayers}/>}
      {screen === 'lobby' && <Lobby isHost={isHost} username={username} code={code} players={players} onSetPlayers={setPlayers} onMoveHome={moveToHome}/>}
    </div>
  )
}

export default App