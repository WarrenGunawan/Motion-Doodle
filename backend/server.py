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
        "http://127.0.0.1:5173",
        "http://192.168.68.77:5173"
    ],
    async_mode="threading"
)

lobbies = {}

with open('words.json') as f:
    wordsData = json.load(f)

WORDS = wordsData['default']


# Helper Functions
def generateCode():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def addScore(code, player_id, points):
    for p in lobbies[code]['players']:
        if p['id'] == player_id:
            p['score'] += points
            break




@socketio.on('connect')
def handleConnect():
    print('Successfully connected!')





@socketio.on('createLobby')
def handleCreateLobby(data):
    username = data['username']
    code = generateCode()

    lobbies[code] = {
        'host': request.sid,
        'players': [{ 'id': request.sid, 'username': username, 'score': 0 }],
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

    lobbies[code]['players'].append({'id': request.sid, 'username': username, 'score': 0})
    join_room(code)

    emit('playerJoined', {
        'code': code,
        'players': lobbies[code]['players']
    }, room=code)



@socketio.on('leaveRoom')
def handleLeaveLobby(data):
    code = data['roomCode']

    if code not in lobbies:
        return

    if lobbies[code]['host'] == request.sid:
        socketio.emit('hostLeft', room=code)
        del lobbies[code]
        return

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
            if lobbies[code]['host'] == request.sid:
                socketio.emit('hostLeft', room=code)
                del lobbies[code]
                return

            lobbies[code]['players'] = [p for p in lobbies[code]['players'] if p['id'] != request.sid]

            if len(lobbies[code]['players']) == 0:
                del lobbies[code]
                break

            emit('playerLeft', {
                'players': lobbies[code]['players']
            }, room=code)
            break


@socketio.on('playAgain')
def handlePlayAgain(data):
    code = data['roomCode']
    
    if code not in lobbies:
        return

    if request.sid != lobbies[code]['host']:
        return

    host_player = next(p for p in lobbies[code]['players'] if p['id'] == request.sid)
    host_player['score'] = 0
    
    lobbies[code]['players'] = [host_player]
    lobbies[code]['started'] = False
    lobbies[code]['correctGuessers'] = set()
    lobbies[code]['drawerIndex'] = 0
    lobbies[code]['currentRound'] = 1
    lobbies[code]['turnId'] = lobbies[code].get('turnId', 0) + 1 
    
    socketio.emit('lobbyReset', {
        'players': lobbies[code]['players']
    }, room=code)


# Game Logic
def startTurnTimer(code):
    lobbies[code]['timeLeft'] = 60
    lobbies[code]['turnId'] = lobbies[code].get('turnId', 0) + 1
    my_turn_id = lobbies[code]['turnId']

    socketio.emit('timeUpdate', { 'timeLeft': 60 }, room=code)

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

    if next_index == 0:
        lobbies[code]['currentRound'] = lobbies[code].get('currentRound', 1) + 1

        if lobbies[code]['currentRound'] > lobbies[code]['numRounds']:
            socketio.emit('gameOver', {
                'players': players
            }, room=code)
            return

    next_drawer = players[next_index]

    socketio.emit('roundEnding', {
        'nextDrawer': next_drawer
    }, room=code)

    def delayed_next_turn():
        if code not in lobbies:
            return
        
        lobbies[code]['drawerIndex'] = next_index
        word = random.choice(WORDS)
        lobbies[code]['currentWord'] = word
        lobbies[code]['correctGuessers'] = set()

        socketio.emit('nextTurn', {
            'drawer': players[next_index],
            'word': word,
            'players': players,
            'currentRound': lobbies[code]['currentRound']
        }, room=code)

        startTurnTimer(code)

    threading.Timer(5.0, delayed_next_turn).start()


@socketio.on('startGame')
def handleStartGame(data):
    code = data['roomCode']
    lobbies[code]['started'] = True
    lobbies[code]['drawerIndex'] = 0
    lobbies[code]['currentRound'] = 1
    lobbies[code]['numRounds'] = data.get('numRounds', 3)
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
        return

    player_id = request.sid
    lobby = lobbies[code]

    players = lobby['players']
    current = lobby['drawerIndex']
    drawer_id = players[current]['id']

    if player_id == drawer_id:
        return

    if player_id in lobby['correctGuessers']:
        return

    lobby['correctGuessers'].add(player_id)
    socketio.emit('correctGuessersUpdated', {
        'correctGuessers': list(lobby['correctGuessers'])
    }, room=code)

    points = round(((lobby['timeLeft'] / 60) * 450) + 50)
    addScore(code, player_id, points)

    socketio.emit('scoresUpdated', {
        'players': lobby['players']
    }, room=code)

    non_drawer_count = len(players) - 1

    if len(lobby['correctGuessers']) >= non_drawer_count:
        bonus = len(lobby['correctGuessers']) * 50
        addScore(code, drawer_id, bonus)

        socketio.emit('scoresUpdated', {
            'players': lobby['players']
        }, room=code)

        next_index = (current + 1) % len(players)

        game_will_end = (
            next_index == 0 and
            lobby.get('currentRound', 1) >= lobby['numRounds']
        )

        if game_will_end:
            lobby['turnId'] = lobby.get('turnId', 0) + 1

            lobby['started'] = False
            lobby['currentWord'] = ''
            lobby['correctGuessers'] = set()

            socketio.emit('timeUpdate', {
                'timeLeft': 0
            }, room=code)

            socketio.emit('gameOver', {
                'players': lobby['players']
            }, room=code)

            return

        advanceTurn(code)



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
        host="0.0.0.0",
        debug=True,
        port=5001,
        allow_unsafe_werkzeug=True
    )