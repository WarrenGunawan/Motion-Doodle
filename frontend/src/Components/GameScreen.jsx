import { useState, useEffect, useRef } from 'react'

import Camera from './Camera'
import RemoteCam from './RemoteCam'

import socket from '../socket'

import PreGameScreen from '../adrawn/PreGameScreen.png'




function GameScreen({ camWidth, camHeight, localStream, isHost, gameStarted, code, drawer, remoteStreams, onCompositeCanvas, shouldClear, gameOver, finalScores, brushColor, brushSize, eraserSize, onMoveHome }) {
    const [ rounds, setRounds ] = useState(1)

    function startGame() {
        socket.emit('startGame', { roomCode: code, numRounds: rounds })
    }

    if(gameOver) {
        return (
            <div className='flex flex-col justify-between items-center mr-5 color4 rounded-2xl' style={{
                    backgroundImage: `url(${PreGameScreen})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    height: '100vh',
                    width: '100vw',
                    margin: 0,
                    width: camWidth, 
                    height: camHeight
                }}>
                <div className='flex flex-col mt-10 justify-center items-center'>
                    <p className='text-2xl'>Game Over!</p>
                    {finalScores.sort((a, b) => b.score - a.score)
                        .map(p => (
                            <p key={p.id}>{p.username}: {p.score}</p>
                        ))
                    }
                </div>
                <div className='flex flex-col justify-center items-center pb-10'>
                    {isHost && <button className='opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-xl color3 text-xl mb-2' onClick={() => {socket.emit('playAgain', { roomCode: code })}}>Play Again</button>}
                    <button className='opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-xl color3 text-xl' onClick={onMoveHome}>Return Home</button>
                </div>
            </div>
        )
    }


    if (!gameStarted) {
        if (isHost) {
            return (
                <div className='flex flex-col justify-end pb-10 items-center mr-5 color4 rounded-2xl' style={{
                        backgroundImage: `url(${PreGameScreen})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        height: '100vh',
                        width: '100vw',
                        margin: 0,
                        width: camWidth, 
                        height: camHeight
                    }}>
                    <p className='text-4xl'>Rounds: {rounds}</p>
                    <input className='color3' type='range' id='numericSlider' min='1' max='6' value={rounds} onChange={(e) => {setRounds(Number(e.target.value))}}/>
                    <button className='mt-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-xl color3 mx-3 text-xl' onClick={startGame}>Start Game</button>
                    <button className='mt-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-xl color3 mx-3 text-xl' onClick={onMoveHome}>Return Home</button>
                </div>
            )
        } else {
            return (
                <div className='flex flex-col justify-end pb-10 items-center mr-5 color4 rounded-2xl' style={{
                        backgroundImage: `url(${PreGameScreen})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        height: '100vh',
                        width: '100vw',
                        margin: 0,
                        width: camWidth, 
                        height: camHeight
                    }}>
                    <button className='mt-2 opacity-100 active:opacity-50 transition-opacity hover:opacity-75 p-5 rounded-xl color3 mx-3 text-xl' onClick={onMoveHome}>Return Home</button>
                </div>
            )
        }
    } else {
        if (drawer.id === socket.id) {
            return (
                <div className='mr-5'>
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
                <div className='mr-5'>
                    <RemoteCam stream={remoteStreams[drawer.id]} camWidth={camWidth} camHeight={camHeight}/>
                </div>
            )
        }
    }
}

export default GameScreen