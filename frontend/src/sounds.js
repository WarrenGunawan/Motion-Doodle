const sounds = {
    background: new Audio('/sounds/BackgroundMusic.mp3'),
    newRound: new Audio('/sounds/NewRound.mp3'),
    correctGuess: new Audio('/sounds/CorrectGuess.mp3'),
    enterGuess: new Audio('/sounds/EnterGuess.mp3'),
    gameEnding: new Audio('/sounds/GameEnding.mp3'),
}



export function fadeOut(audio, duration = 2000) {
    const steps = 20
    const interval = duration / steps
    const decrement = audio.volume / steps

    const fade = setInterval(() => {
        if (audio.volume > decrement) {
            audio.volume -= decrement
        } else {
            audio.volume = 0
            audio.pause()
            audio.currentTime = 0
            clearInterval(fade)
        }
    }, interval)
}

export function fadeIn(audio, duration = 2000, targetVolume = 0.3) {
    audio.volume = 0
    audio.play()

    const steps = 20
    const interval = duration / steps
    const increment = targetVolume / steps

    const fade = setInterval(() => {
        if (audio.volume < targetVolume - increment) {
            audio.volume += increment
        } else {
            audio.volume = targetVolume
            clearInterval(fade)
        }
    }, interval)
}

sounds.background.loop = true
sounds.background.volume = 0.2

sounds.newRound.volume = 0.7

export default sounds