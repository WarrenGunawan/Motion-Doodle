import { useState, useEffect } from 'react';
import Lobby from './Components/Lobby'
import Home from './Components/Home'

import socket from './socket'







function App() {
  const [ screen, setScreen ] = useState('home')

  const [ userNameChosen, setUsernameChosen ] = useState(false)
  const [ lobbyCodeSelected, setLobbyCodeSelected ] = useState(false)
  const [ lobbyStarted, setLobbyStarted ] = useState(false)
  const [ startButton, setStartButton ] = useState(false)



  // Checks for socket connection
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Server, id:', socket.id)
    })

    return () => socket.off('connect')
  }, [])

  // Rerenders page once the start button press is detected
  useEffect(() => {
    if(startButton) {
      if(userNameChosen && (lobbyCodeSelected || lobbyStarted)) {
        moveToLobby()
      }

      setStartButton(false)
    }
  }, [startButton])


  // Helper Functions
  function moveToLobby() {
    setScreen('lobby')
  }


  return (
    <div>
      {screen === 'home' && <Home onUsernameChosen={setUsernameChosen} onLobbyCodeSelected={setLobbyCodeSelected} onLobbyStarted={setLobbyStarted} onStartButton={setStartButton}/>}
      {screen === 'lobby' && <Lobby />}
    </div>
  )
}

export default App