import { useState, useEffect, useRef } from 'react';

import Camera from './Camera'
import PlaceholderCam from './PlaceholderCam';
import RemoteCam from './RemoteCam';
import LocalCam from './LocalCam';
import GameScreen from './GameScreen';


import socket from '../socket'


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





function Lobby({ isHost, username, code, players, onSetPlayers }) {
    // WebRTC assets
    const localStreamRef = useRef(null)
    const peerConnectionsRef = useRef({})
    const [ localStream, setLocalStream ] = useState(null)
    const [ remoteStreams, setRemoteStreams ] = useState({})

    // Start Game Logic
    const [ gameStarted, setGameStarted ] = useState(false)
    const [ drawer, setDrawer ] = useState(null)
    const [ shouldClearCanvas, setShouldClearCanvas ] = useState(false)
    const [ timeLeft, setTimeLeft ] = useState(null)



    // Check for new players
    useEffect(() => {
        async function handlePlayerJoined(data) {
            onSetPlayers(data.players)

            const newPlayer = data.players[data.players.length - 1]
            if (newPlayer.id === socket.id) return

            if (!localStreamRef.current) {
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (localStreamRef.current) {
                            clearInterval(interval)
                            resolve()
                        }
                    }, 100)
                })
            }

            const pc = createPeerConnection(newPlayer.id)
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current)
            })

            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socket.emit('offer', {
                to: newPlayer.id,
                from: socket.id,
                offer
            })

            console.log('player joined, sending offer to:', newPlayer.id)
        }

        function handlePlayerLeft(data) {
            onSetPlayers(data.players)
        }

        function handleError(data) {
            console.log('error:', data.message)
        }

        function handleGameStart(data) {
            setGameStarted(true)
            setDrawer(data.drawer)
        }

        function handleNextTurn(data) {
            setDrawer(data.drawer)
            setShouldClearCanvas(true)
            setTimeout(() => setShouldClearCanvas(false), 100)
        }


        socket.on('gameStarted', handleGameStart)
        socket.on('playerLeft', handlePlayerLeft)
        socket.on('playerJoined', handlePlayerJoined)
        socket.on('nextTurn', handleNextTurn)
        socket.on('error', handleError)

        return () => {
            socket.off('gameStarted', handleGameStart)
            socket.off('playerJoined', handlePlayerJoined)
            socket.off('playerLeft', handlePlayerLeft)
            socket.off('nextTurn', handleNextTurn)
            socket.off('error', handleError)
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

    const camWidth = width * 0.5
    const camHeight = camWidth * (9/16)

    const miniCamHeight = height / 8
    const miniCamWidth = miniCamHeight * (16/9)



    
    // WebRTC logic
    useEffect(() => {
        async function getStream() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                localStreamRef.current = stream
                setLocalStream(stream)
            } catch (err) {
                console.error('Failed to get camera stream:', err)
            }
        }

        getStream()

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])


    const createPeerConnection = useRef((playerId) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })

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
            if (!localStreamRef.current) {
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (localStreamRef.current) {
                            clearInterval(interval)
                            resolve()
                        }
                    }, 100)
                })
            }

            const pc = createPeerConnection(data.from)

            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current)
            })

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit('answer', {
                to: data.from,
                from: socket.id,
                answer
            })

            console.log('received offer, creating answer for:', data.from)
        }

        async function handleAnswer(data) {
            const pc = peerConnectionsRef.current[data.from]
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
            }

            console.log('received answer from:', data.from)
        }

        async function handleIceCandidate(data) {
            const pc = peerConnectionsRef.current[data.from]
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
            }

            console.log('received ice candidate from:', data.from)
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
        <div className='flex flex-col h-screen justify-center items-center'>
            <p className='absolute top-10'>{timeLeft} | {code}</p>

            <div className='relative flex items-center'>
                <div className='absolute right-full flex flex-col mr-0.5'>
                    {players.map(p => (
                        <div key={p.id} className='leading-none'>
                            {p.id === socket.id 
                                ? <LocalCam camWidth={miniCamWidth} camHeight={miniCamHeight} stream={localStream}/> 
                                : remoteStreams[p.id]
                                    ? <RemoteCam stream={remoteStreams[p.id]} camWidth={miniCamWidth} camHeight={miniCamHeight}/>
                                    : <PlaceholderCam name={p.username} camWidth={miniCamWidth} camHeight={miniCamHeight}/>
                            } 
                        </div>
                    ))}
                </div>





               <div>
                    <GameScreen camWidth={camWidth} 
                        camHeight={camHeight} 
                        localStream={localStream} 
                        isHost={isHost} 
                        gameStarted={gameStarted} 
                        code={code} 
                        drawer={drawer || players[0]} 
                        remoteStreams={remoteStreams} 
                        onCompositeCanvas={onCompositeCanvas} 
                        setTimeLeft={setTimeLeft} 
                        shouldClear={shouldClearCanvas} />
                </div>





                <div className='absolute left-full flex flex-col'>
                    {players.map(p => (
                        <div key={p.id} className='whitespace-nowrap'>{p.username}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Lobby