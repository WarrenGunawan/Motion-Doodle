from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import string
import json
import random
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'

socketio = SocketIO(
    app,
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    async_mode="threading"
)

lobbies = {}

with open('words.json') as f:
    wordsData = json.load(f)

WORDS = wordsData['default']



def generateCode():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@socketio.on('connect')
def handleConnect():
    print('Successfully connected!')





@socketio.on('createLobby')
def handleCreateLobby(data):
    username = data['username']
    code = generateCode()

    lobbies[code] = {
        'host': request.sid,
        'players': [{ 'id': request.sid, 'username': username }],
        'started': False
    }

    join_room(code)
    emit('lobbyCreated', {
        'code': code,
        'players': lobbies[code]['players']
    }, room=code)




@socketio.on('joinLobby')
def handleJoinLobby(data):
    username = data['username']
    code = data['roomCode']

    if code not in lobbies:
        emit('error', {'message': 'Lobby not Found'})
        return

    lobbies[code]['players'].append({'id': request.sid, 'username': username})
    join_room(code)

    emit('playerJoined', {
        'code': code,
        'players': lobbies[code]['players']
    }, room=code)



@socketio.on('leaveRoom')
def handleLeaveLobby(data):
    code = data['roomCode']

    lobbies[code]['players'] = [p for p in lobbies[code]['players'] if p['id'] != request.sid]

    leave_room(code)

    if len(lobbies[code]['players']) == 0:
        del lobbies[code]
        return

    emit('playerLeft', {
        'players': lobbies[code]['players']
    }, room=code)


@socketio.on('disconnect')
def handleDisconnect():
    for code in list(lobbies.keys()):
        players = lobbies[code]['players']
        if any(p['id'] == request.sid for p in players):
            lobbies[code]['players'] = [p for p in lobbies[code]['players'] if p['id'] != request.sid]

            if len(lobbies[code]['players']) == 0:
                del lobbies[code]
                break

            emit('playerLeft', {
                'players': lobbies[code]['players']
            }, room=code)

            break


# Game Logic
def startTurnTimer(code):
    lobbies[code]['timeLeft'] = 60
    lobbies[code]['turnId'] = lobbies[code].get('turnId', 0) + 1
    my_turn_id = lobbies[code]['turnId']

    def tick():
        if not lobbies.get(code):
            return
        if lobbies[code].get('turnId') != my_turn_id:
            return  

        lobbies[code]['timeLeft'] -= 1
        socketio.emit('timeUpdate', { 'timeLeft': lobbies[code]['timeLeft'] }, room=code)

        if lobbies[code]['timeLeft'] <= 0:
            advanceTurn(code)
        else:
            threading.Timer(1.0, tick).start()

    threading.Timer(1.0, tick).start()


def advanceTurn(code):
    if code not in lobbies or len(lobbies[code]['players']) == 0:
        return

    players = lobbies[code]['players']
    current = lobbies[code]['drawerIndex']
    next_index = (current + 1) % len(players)
    lobbies[code]['drawerIndex'] = next_index
    word = random.choice(WORDS)
    lobbies[code]['currentWord'] = word
    lobbies[code]['correctGuessers'] = set()

    socketio.emit('nextTurn', {
        'drawer': players[next_index],
        'word': word
    }, room=code)

    startTurnTimer(code)


@socketio.on('startGame')
def handleStartGame(data):
    code = data['roomCode']
    lobbies[code]['started'] = True
    lobbies[code]['drawerIndex'] = 0
    word = random.choice(WORDS)
    lobbies[code]['currentWord'] = word
    lobbies[code]['correctGuessers'] = set()

    emit('gameStarted', {
        'drawer': lobbies[code]['players'][0],
        'word': word
    }, room=code)

    startTurnTimer(code)


@socketio.on('correctGuess')
def handleCorrectGuess(data):
    code = data.get('roomCode')

    if code not in lobbies:
        print('Invalid room code for correctGuess:', code)
        return

    player_id = request.sid
    print('correctGuess from:', player_id, 'in lobby:', code)

    lobbies[code]['correctGuessers'].add(player_id)

    non_drawer_count = len(lobbies[code]['players']) - 1
    print('guessers so far:', lobbies[code]['correctGuessers'], 'needed:', non_drawer_count)

    if len(lobbies[code]['correctGuessers']) >= non_drawer_count:
        print('threshold met, scheduling advanceTurn in 3s')

        def delayed_advance():
            print('delayed_advance firing now')
            advanceTurn(code)

        threading.Timer(3.0, delayed_advance).start()



# WebRTC events

@socketio.on('offer')
def handleOffer(data):
    socketio.emit('offer', data, to=data['to'])

@socketio.on('answer')
def handleAnswer(data):
    socketio.emit('answer', data, to=data['to'])

@socketio.on('iceCandidate')
def handleIceCandidate(data):
    socketio.emit('iceCandidate', data, to=data['to'])



if __name__ == '__main__':
    socketio.run(
        app,
        host="127.0.0.1",
        debug=True,
        port=5001,
        allow_unsafe_werkzeug=True
    )