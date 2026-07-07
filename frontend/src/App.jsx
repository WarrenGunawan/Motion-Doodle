import { useState, useEffect, useRef } from 'react';
import Lobby from './Components/Lobby'
import Home from './Components/Home'
import Loading from './Components/LoadingScreen'

import socket from './socket'





function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}



function App() {
  const [ screen, setScreen ] = useState('home')

  const [ userNameChosen, setUsernameChosen ] = useState(false)
  const [ startLobby, setStartLobby ] = useState(false)
  const [ joinLobby, setJoinLobby ] = useState(false)

  const [ username, setUsername ] = useState('')
  const [ isHost, setIsHost ] = useState(false)
  const [ code, setCode ] = useState('')

  const [ players, setPlayers ] = useState([])

  const localStreamRef = useRef(null)
  const [ localStream, setLocalStream ] = useState(null)

  const [ loadingMounted, setLoadingMounted ] = useState(false)
  const [ loadingShown, setLoadingShown ] = useState(false) 


  // Clean Up function for camera stream
  useEffect(() => {
    return () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop())
        }
    }
  }, [])

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


  // Transition Functions
  async function transitionToScreen(nextScreen) {
    setLoadingMounted(true)

    await wait(20)
    setLoadingShown(true)

    await wait(500)
    setScreen(nextScreen)

    await wait(2000)
    setLoadingShown(false)

    await wait(500)
    setLoadingMounted(false)
  }

  function moveToLobby() {
    transitionToScreen('lobby')
  }

  function moveToHome() {
    transitionToScreen('home')
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
      {screen === 'home' && <Home onUsernameChosen={setUsernameChosen} 
                              onStartLobby={setStartLobby} 
                              onJoinLobby={setJoinLobby} 
                              onIsHost={setIsHost} 
                              onSetCode={setCode} 
                              onSetUsername={setUsername} 
                              onSetPlayers={setPlayers}
                              localStream={localStream}
                              setLocalStream={setLocalStream}
                              localStreamRef={localStreamRef}
                              />}

      {screen === 'lobby' && <Lobby isHost={isHost} 
                              username={username} 
                              code={code} 
                              players={players} 
                              onSetPlayers={setPlayers} 
                              onMoveHome={moveToHome}
                              localStream={localStream}
                              setLocalStream={setLocalStream}
                              localStreamRef={localStreamRef}
                              />}

      {loadingMounted && <Loading show={loadingShown} />}
    </div>
  )
}

export default App