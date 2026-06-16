import { useState, useEffect, useRef } from 'react'

import Camera from './Camera'
import RemoteCam from './RemoteCam'

import socket from '../socket'




function GameScreen({ camWidth, camHeight, localStream, isHost, gameStarted, code, drawer, remoteStreams, onCompositeCanvas, setTimeLeft, shouldClear }) {
    function startGame() {
        socket.emit('startGame', {roomCode: code})
    }

    function endTurn() {
        socket.emit('turnEnded', { roomCode: code })
    }


    // Timer Logic
    const timeRef = useRef(60)

    useEffect(() => {
        if (!gameStarted) {
            setTimeLeft(timeRef.current)
            return
        }

        timeRef.current = 60

        const timer = setInterval(() => {
            timeRef.current -= 1
            setTimeLeft(timeRef.current)

            if (timeRef.current <= 0) {
                clearInterval(timer)
                endTurn()
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [gameStarted, drawer])




    // Decides what to display based on isHost and gameStarted
    if(!gameStarted) {
        if(isHost) {
            return(
                <div className='flex justify-center items-center bg-blue-500' style={{ width: camWidth, height: camHeight }}>
                    <button className='flex p-5 justify-center items-center bg-black text-white rounded' onClick={startGame}>Start Game</button>
                </div>
            )
        } else {
            return(
                <div className='flex justify-center items-center bg-blue-500' style={{ width: camWidth, height: camHeight }}/>
            )
        }
    } else {
        if (drawer.id === socket.id) {
            return <Camera camWidth={camWidth} camHeight={camHeight} canDraw={true} stream={localStream} onCompositeCanvas={onCompositeCanvas} shouldClear={shouldClear}/>
        } else {
            return <RemoteCam stream={remoteStreams[drawer.id]} camWidth={camWidth} camHeight={camHeight}/>
        }
    }
}

export default GameScreen