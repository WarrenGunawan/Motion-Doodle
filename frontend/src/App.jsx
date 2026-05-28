import { useState, useEffect } from 'react';
import Lobby from './Components/Lobby'
import Home from './Components/Home'


function App() {
  const [ screen, setScreen ] = useState('home')


  const [ userNameChosen, setUsernameChosen ] = useState(false)
  const [ lobbyCodeSelected, setLobbyCodeSelected ] = useState(false)
  const [ lobbyStarted, setLobbyStarted ] = useState(false)
  const [ startButton, setStartButton ] = useState(false)




  function moveToLobby() {
    setScreen('lobby')
  }

  useEffect(() => {
    if(startButton) {
      if(userNameChosen && (lobbyCodeSelected || lobbyStarted)) {
        moveToLobby()
      }

      setStartButton(false)
    }
  }, [startButton])


  return (
    <div>
      {screen === 'home' && <Home onUsernameChosen={setUsernameChosen} onLobbyCodeSelected={setLobbyCodeSelected} onLobbyStarted={setLobbyStarted} onStartButton={setStartButton}/>}
      {screen === 'lobby' && <Lobby />}
    </div>
  )
}

export default App