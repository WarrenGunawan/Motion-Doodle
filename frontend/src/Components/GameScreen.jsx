import { useState, useEffect, useRef } from 'react'

import Camera from './Camera'
import RemoteCam from './RemoteCam'

import socket from '../socket'




function GameScreen({ camWidth, camHeight, localStream, isHost, gameStarted, code, drawer, remoteStreams, onCompositeCanvas, shouldClear }) {
    function startGame() {
        socket.emit('startGame', { roomCode: code })
    }

    if (!gameStarted) {
        if (isHost) {
            return (
                <div className='flex justify-center items-center bg-blue-500' style={{ width: camWidth, height: camHeight }}>
                    <button className='flex p-5 justify-center items-center bg-black text-white rounded' onClick={startGame}>Start Game</button>
                </div>
            )
        } else {
            return <div className='flex justify-center items-center bg-blue-500' style={{ width: camWidth, height: camHeight }}/>
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