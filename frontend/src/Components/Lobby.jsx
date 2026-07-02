import { useState, useEffect, useRef } from 'react';

import Camera from './Camera'
import PlaceholderCam from './PlaceholderCam';
import RemoteCam from './RemoteCam';
import LocalCam from './LocalCam';
import GameScreen from './GameScreen';
import BrushSettings from './BrushSettings';

import socket from '../socket'

import HomeBackground from '../adrawn/HomeBackground.png'
import Logo from '../adrawn/Logo.png'
import CopyLink from '../adrawn/CopyLink.png'
import Check from '../adrawn/Check.png'


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





function Lobby({ isHost, username, code, players, onSetPlayers, onMoveHome, localStream, localStreamRef }) {
    // Random Word Selection
    const [ currentWord, setCurrentWord ] = useState('')
    const [ currentWordPlaceholder, setCurrentWordPlaceholder ] = useState('')

    function generatePlaceholder(word) {
        return word.split('').map(char => char === ' ' ? ' ' : '_').join(' ')
    }

    // Copy Link
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code)
        } catch(err) {
            console.error("Failed to copy text: ", err);
        }
    }

    // WebRTC assets
    const peerConnectionsRef = useRef({})
    const pendingIceCandidatesRef = useRef({})
    const drawerRef = useRef(null)
    const [ remoteStreams, setRemoteStreams ] = useState({})

    // Game Logic
    const [ gameStarted, setGameStarted ] = useState(false)
    const [ currentRound, setCurrentRound ] = useState(1)
    const [ drawer, setDrawer ] = useState(null)
    const [ shouldClearCanvas, setShouldClearCanvas ] = useState(false)
    const [ timeLeft, setTimeLeft ] = useState(null)
    const [ guessInput, setGuessInput] = useState('')
    const [ hasGuessedCorrectly, setHasGuessedCorrectly ] = useState(false)
    const [ transitioning, setTransitioning ] = useState(false)
    const [ nextDrawerName, setNextDrawerName ] = useState('')
    const [ gameOver, setGameOver ] = useState(false)
    const [ finalScores, setFinalScores ] = useState([])
    const [ correctGuessers, setCorrectGuessers ] = useState([])

    // Brush Settings
    const [ brushColor, setBrushColor ] = useState('#ffffff')
    const [ brushSize, setBrushSize ] = useState(15)
    const [ eraserSize, setEraserSize ] = useState(50)

   function handleGuess(guess) {
    console.log('guess:', guess, 'currentWord:', currentWord)
    if (guess.trim().toLowerCase() !== currentWord.toLowerCase()) {
        setGuessInput('')
    } else {
        console.log('correct! emitting correctGuess')
        setHasGuessedCorrectly(true)
        socket.emit('correctGuess', { roomCode: code })
    }
}



    // Check for new players
    useEffect(() => {
        async function handlePlayerJoined(data) {
            onSetPlayers(data.players)

            const newPlayer = data.players[data.players.length - 1]
            if (newPlayer.id === socket.id) return

            const pc = createPeerConnection(newPlayer.id)

            if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current)
                })
            } else {
                pc.addTransceiver('video', { direction: 'recvonly' })
            }

            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)

            await new Promise(resolve => {
                if (pc.iceGatheringState === 'complete') {
                    resolve()
                } else {
                    pc.onicegatheringstatechange = () => {
                        if (pc.iceGatheringState === 'complete') resolve()
                    }
                }
            })

            socket.emit('offer', {
                to: newPlayer.id,
                from: socket.id,
                offer: pc.localDescription
            })

            console.log('player joined, sending offer to:', newPlayer.id)
        }

        function handlePlayerLeft(data) {
            onSetPlayers(data.players)

            setRemoteStreams(prev => {
                const updated = { ...prev }
                const remainingIds = new Set(data.players.map(p => p.id))

                Object.keys(updated).forEach(id => {
                    if (!remainingIds.has(id)) {
                        delete updated[id]
                    }
                })

                return updated
            })
        }

        function handleError(data) {
            console.log('error:', data.message)
        }

        function handleGameStart(data) {
            setCurrentWord(data.word)
            setGuessInput('')
            setHasGuessedCorrectly(false)
            setGameStarted(true)
            setDrawer(data.drawer)
            drawerRef.current = data.drawer
            setCurrentWordPlaceholder(generatePlaceholder(data.word))
        }

        function handleScoresUpdated(data) {
            onSetPlayers(data.players)
        }

        function handleNextTurn(data) {
            const oldDrawer = drawerRef.current
            drawerRef.current = data.drawer
            
            setDrawer(data.drawer)
            setCurrentRound(data.currentRound)
            setCurrentWord(data.word)
            setGuessInput('')
            setHasGuessedCorrectly(false)
            setShouldClearCanvas(true)
            setTimeout(() => setShouldClearCanvas(false), 100)
            onSetPlayers(data.players)
            setTransitioning(false)
            setCurrentWordPlaceholder(generatePlaceholder(data.word))
            setCorrectGuessers([])

            if (oldDrawer?.id === socket.id && localStreamRef.current) {
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video')
                    if (sender) {
                        sender.replaceTrack(localStreamRef.current.getVideoTracks()[0])
                    }
                })
            }
        }

        function handleRoundEnding(data) {
            setTransitioning(true)
            setNextDrawerName(data.nextDrawer.username)
        }

        function handleGameOver(data) {
            setGameOver(true)
            setGameStarted(false)
            setFinalScores(data.players)
            onSetPlayers(data.players)

            setTransitioning(false)
            setNextDrawerName('')

            setTimeLeft('00')
            setCurrentWord('')
            setCurrentWordPlaceholder('')
            setGuessInput('')
            setHasGuessedCorrectly(false)
            setCorrectGuessers([])

            if (localStreamRef.current) {
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video')
                    if (sender) {
                        sender.replaceTrack(localStreamRef.current.getVideoTracks()[0])
                    }
                })
            }
        }

        function handleTimeUpdate(data) {
            setTimeLeft(String(data.timeLeft).padStart(2, '0'))
        }

        function handleLobbyReset(data) {
            onSetPlayers(data.players)
            setGameStarted(false)
            setGameOver(false)
            setDrawer(null)
            drawerRef.current = null
            setCurrentWord('')
            setCurrentWordPlaceholder('')
            setTimeLeft(null)
            setGuessInput('')
            setHasGuessedCorrectly(false)
            setShouldClearCanvas(false)
            setTransitioning(false)
            setFinalScores([])
            setCurrentRound(1)
            setCorrectGuessers([])

            if (!isHost) {
                socket.emit('joinLobby', { username, roomCode: code })
            }
        }

        function handleHostLeft() {
            onMoveHome()
        }

        function handleCorrectGuessersUpdated(data) {
            setCorrectGuessers(data.correctGuessers)
        }




        socket.on('gameStarted', handleGameStart)
        socket.on('playerLeft', handlePlayerLeft)
        socket.on('playerJoined', handlePlayerJoined)
        socket.on('scoresUpdated', handleScoresUpdated)
        socket.on('nextTurn', handleNextTurn)
        socket.on('roundEnding', handleRoundEnding)
        socket.on('gameOver', handleGameOver)
        socket.on('timeUpdate', handleTimeUpdate)
        socket.on('error', handleError)
        socket.on('lobbyReset', handleLobbyReset)
        socket.on('hostLeft', handleHostLeft)
        socket.on('correctGuessersUpdated', handleCorrectGuessersUpdated)

        return () => {
            socket.off('gameStarted', handleGameStart)
            socket.off('playerJoined', handlePlayerJoined)
            socket.off('playerLeft', handlePlayerLeft)
            socket.off('scoresUpdated', handleScoresUpdated)
            socket.off('nextTurn', handleNextTurn)
            socket.off('roundEnding', handleRoundEnding)
            socket.off('gameOver', handleGameOver)
            socket.off('timeUpdate', handleTimeUpdate)
            socket.off('error', handleError)
            socket.off('lobbyReset', handleLobbyReset)
            socket.off('hostLeft', handleHostLeft)
            socket.off('correctGuessersUpdated', handleCorrectGuessersUpdated)
        }
    }, [])


    // Leave the Lobby
    useEffect(() => {
        return () => {
            socket.emit('leaveRoom', {roomCode: code})
        }
    }, [])





    // Dimensions of the screen
    const { width, height } = useWindowDimensions()

    const camWidth = Math.round(width * 0.5)
    const camHeight = Math.round(camWidth * (9 / 16))

    const miniCamHeight = Math.round(height / 8)
    const miniCamWidth = Math.round(miniCamHeight * (16 / 9))





    const createPeerConnection = useRef((playerId) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        })

        pc.onconnectionstatechange = () => {
            console.log('connection state:', pc.connectionState)
        }

        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState)
        }

        pc.ontrack = (event) => {
            console.log('safari got track from:', playerId)

            setRemoteStreams(prev => ({
                ...prev,
                [playerId]: event.streams[0]
            }))
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', {
                    to: playerId,
                    from: socket.id,
                    candidate: event.candidate
                })
            }
        }

        peerConnectionsRef.current[playerId] = pc
        return pc
    }).current


    useEffect(() => {
        async function handleOffer(data) {
            const pc = peerConnectionsRef.current[data.from] || createPeerConnection(data.from)

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current)
                })
            }

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))

            await flushPendingIceCandidates(data.from, pc)

            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            await new Promise(resolve => {
                if (pc.iceGatheringState === 'complete') {
                    resolve()
                } else {
                    pc.onicegatheringstatechange = () => {
                        if (pc.iceGatheringState === 'complete') resolve()
                    }
                }
            })

            socket.emit('answer', {
                to: data.from,
                from: socket.id,
                answer: pc.localDescription
            })

            console.log('received offer, creating answer for:', data.from)
        }

        async function handleAnswer(data) {
            const pc = peerConnectionsRef.current[data.from]

            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer))

                await flushPendingIceCandidates(data.from, pc)
            }

            console.log('received answer from:', data.from)
        }

        async function handleIceCandidate(data) {
            const candidate = new RTCIceCandidate(data.candidate)
            const pc = peerConnectionsRef.current[data.from]

            if (!pc || !pc.remoteDescription) {
                if (!pendingIceCandidatesRef.current[data.from]) {
                    pendingIceCandidatesRef.current[data.from] = []
                }

                pendingIceCandidatesRef.current[data.from].push(candidate)
                console.log('queued ICE candidate from:', data.from)
                return
            }

            try {
                await pc.addIceCandidate(candidate)
                console.log('received ice candidate from:', data.from)
            } catch (err) {
                console.error('Failed to add ICE candidate:', err)
            }
        }

        async function flushPendingIceCandidates(playerId, pc) {
            const pending = pendingIceCandidatesRef.current[playerId] || []

            for (const candidate of pending) {
                try {
                    await pc.addIceCandidate(candidate)
                } catch (err) {
                    console.error('Failed to add queued ICE candidate:', err)
                }
            }

            pendingIceCandidatesRef.current[playerId] = []
        }

        socket.on('offer', handleOffer)
        socket.on('answer', handleAnswer)
        socket.on('iceCandidate', handleIceCandidate)

        return () => {
            socket.off('offer', handleOffer)
            socket.off('answer', handleAnswer)
            socket.off('iceCandidate', handleIceCandidate)
        }
    }, [])



    // Get Canvas and video feed
    const compositeStreamRef = useRef(null)

    function onCompositeCanvas(canvas) {
        const stream = canvas.captureStream(30)
        compositeStreamRef.current = stream
        Object.values(peerConnectionsRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video')
            if (sender) {
                sender.replaceTrack(stream.getVideoTracks()[0])
            }
        })
    }



    return (
        <div
            className='relative color4'
            style={{
                backgroundImage: `url(${HomeBackground})`,
                backgroundSize: '100% auto',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                height: '100vh',
                width: '100vw',
                margin: 0
            }}
        >
            <div className='absolute top-0 right-0 color3 pl-5 pb-5 rounded-bl-3xl z-30'>
                <p className='flex flex-row justify-center items-center text-3xl color4 px-5 py-3' style={{ borderBottomLeftRadius: '12px' }}>
                    Code: {code}
                    <button className='opacity-100 active:opacity-50 transition-opacity hover:opacity-75' onClick={handleCopy}>
                        <img className='ml-1 w-10' src={CopyLink} alt='copy'/>
                    </button>
                </p>
            </div>

            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'>
                <div className='relative flex items-center'>
                    <div
                        className='absolute left-1/2 -translate-x-1/2 z-20'
                        style={{ bottom: 'calc(100% + 20px)' }}>
                        <div className='relative flex justify-center items-center'>

                            <div className='absolute right-[calc(100%+20px)] top-1/2 -translate-y-1/2'>
                                <div className='flex justify-center items-center color3 text-5xl w-20 h-20 rounded-full'>
                                    <p>{gameOver || !gameStarted ? '00' : timeLeft}</p>
                                </div>
                            </div>

                            <div className='flex justify-center items-center color4 text-4xl w-100 h-20 rounded-full'>
                                {gameOver || !gameStarted ? (
                                    <p></p>
                                ) : (drawer || players[0])?.id === socket.id ? (
                                    <p>{currentWord}</p>
                                ) : (
                                    <p>{currentWordPlaceholder}</p>
                                )}
                            </div>

                            <div className='absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2'>
                                <img
                                    src={Logo}
                                    alt='Logo'
                                    className='h-[100px] w-auto max-w-none object-contain shrink-0'
                                />
                            </div>

                        </div>
                    </div>

                    <div className='flex items-center'>
                        <div className='flex flex-col color3 p-5 rounded-3xl gap-3'>
                            {players.map(p => (
                                <div key={p.id} className='leading-none justify-center items-center'>
                                    <div className='flex flex-col justify-center items-center color4 rounded-b-2xl rounded-t-2xl'>
                                        <p className='p-1'>{p.username} - {p.score}</p>

                                        <div className='relative'>
                                            {p.id === socket.id
                                                ? localStream
                                                    ? <LocalCam camWidth={miniCamWidth} camHeight={miniCamHeight} stream={localStream}/>
                                                    : <PlaceholderCam camWidth={miniCamWidth} camHeight={miniCamHeight}/>
                                                : remoteStreams[p.id]
                                                    ? <RemoteCam stream={remoteStreams[p.id]} camWidth={miniCamWidth} camHeight={miniCamHeight}/>
                                                    : <PlaceholderCam camWidth={miniCamWidth} camHeight={miniCamHeight}/>
                                            }

                                            {correctGuessers.includes(p.id) && (
                                                <img
                                                    src={Check}
                                                    alt='Correct'
                                                    className='absolute top-0 left-0 w-7 h-7 z-20'
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='flex flex-row color3 py-5 pl-5 ml-5 rounded-3xl'>
                            <div
                                style={{
                                    position: 'relative',
                                    width: camWidth,
                                    height: camHeight,
                                    overflow: 'hidden',
                                    borderRadius: '16px'
                                }}
                            >
                                <GameScreen
                                    camWidth={camWidth} 
                                    camHeight={camHeight} 
                                    localStream={localStream} 
                                    isHost={isHost} 
                                    gameStarted={gameStarted} 
                                    code={code} 
                                    drawer={drawer || players[0]} 
                                    remoteStreams={remoteStreams} 
                                    onCompositeCanvas={onCompositeCanvas} 
                                    setTimeLeft={setTimeLeft} 
                                    shouldClear={shouldClearCanvas}
                                    gameOver={gameOver}
                                    finalScores={finalScores}
                                    brushColor={brushColor}
                                    brushSize={brushSize}
                                    eraserSize={eraserSize}
                                    onMoveHome={onMoveHome}
                                />

                                {transitioning && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: camWidth,
                                            height: camHeight,
                                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: 'white',
                                            fontSize: '1.5rem',
                                            borderRadius: '16px'
                                        }}
                                    >
                                        {nextDrawerName} is drawing next!
                                    </div>
                                )}
                            </div>

                            <BrushSettings 
                                brushColor={brushColor}
                                setBrushColor={setBrushColor}
                                brushSize={brushSize}
                                setBrushSize={setBrushSize}
                                eraserSize={eraserSize}
                                setEraserSize={setEraserSize}
                                camWidth={camWidth}
                                camHeight={camHeight}
                            />
                        </div>
                    </div>

                    <div
                        className='absolute left-1/2 -translate-x-1/2 z-20'
                        style={{ top: 'calc(100% + 20px)' }}
                    >
                        {(drawer || players[0])?.id !== socket.id && gameStarted && !gameOver &&
                            <input
                                value={guessInput} 
                                disabled={hasGuessedCorrectly}
                                onChange={(e) => setGuessInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        handleGuess(guessInput)
                                    }
                                }}
                                className='color4 w-full p-4 rounded-full mb-3 text-3xl'
                            />
                        }
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Lobby