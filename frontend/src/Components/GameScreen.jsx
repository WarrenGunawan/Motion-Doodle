import { useState, useEffect, useRef } from 'react'

import Camera from './Camera'
import RemoteCam from './RemoteCam'

import socket from '../socket'




function GameScreen({ camWidth, camHeight, localStream, isHost, gameStarted, code, drawer, remoteStreams, onCompositeCanvas, shouldClear, gameOver, finalScores, brushColor, brushSize, eraserSize }) {
    const [ rounds, setRounds ] = useState(1)

    function startGame() {
        socket.emit('startGame', { roomCode: code, numRounds: rounds })
    }

    if(gameOver) {
        return (
            <div className='flex flex-col justify-center items-center bg-blue-500 mx-3' style={{ width: camWidth, height: camHeight }}>
                <h2>Game Over!</h2>
                {finalScores.sort((a, b) => b.score - a.score)
                    .map(p => (
                        <p key={p.id}>{p.username}: {p.score}</p>
                    ))
                }
            </div>
        )
    }


    if (!gameStarted) {
        if (isHost) {
            return (
                <div className='flex flex-col justify-center items-center color4 mx-3' style={{ width: camWidth, height: camHeight }}>
                    <div>
                        <p>Value: {rounds}</p>
                        <input type='range' id='numericSlider' min='1' max='6' value={rounds} onChange={(e) => {setRounds(Number(e.target.value))}}/>
                    </div>

                    <button className='flex p-5 justify-center items-center bg-black text-white rounded' onClick={startGame}>Start Game</button>
                </div>
            )
        } else {
            return <div className='flex justify-center items-center color4 mx-3' style={{ width: camWidth, height: camHeight }}/>
        }
    } else {
        if (drawer.id === socket.id) {
            return (
                <div className='mx-3'>
                    <Camera camWidth={camWidth} 
                        camHeight={camHeight} 
                        canDraw={true} stream={localStream} 
                        onCompositeCanvas={onCompositeCanvas} 
                        shouldClear={shouldClear}
                        brushColor={brushColor}
                        brushSize={brushSize}
                        eraserSize={eraserSize}
                    />
                </div>
            )
        } else {
            return (
                <div className='mx-3'>
                    <RemoteCam stream={remoteStreams[drawer.id]} camWidth={camWidth} camHeight={camHeight}/>
                </div>
            )
        }
    }
}

export default GameScreen