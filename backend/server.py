from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import string

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
        'players': lobbies[code]['players']
    }, room=code)



@socketio.on('leaveRoom')
def handleLeaveLobby(data):
    code = data['roomCode']

    lobbies[code]['players'] = [p for p in lobbies[code]['players'] if p['id'] != request.sid]

    leave_room(code)

    emit('playerLeft', {
        'players': lobbies[code]['players']
    }, room=code)


@socketio.on('disconnect')
def handleDisconnect():
    for code in list(lobbies.keys()):
        players = lobbies[code]['players']
        if any(p['id'] == request.sid for p in players):
            lobbies[code]['players'] = [p for p in lobbies[code]['players'] if p['id'] != request.sid]

            emit('playerLeft', {
                'players': lobbies[code]['players']
            }, room=code)

            break


# Game Logic
@socketio.on('startGame')
def handleStartGame(data):
    code = data['roomCode']
    lobbies[code]['started'] = True
    lobbies[code]['drawerIndex'] = 0
    
    emit('gameStarted', {
        'drawer': lobbies[code]['players'][0]
    }, room=code)

@socketio.on('turnEnded')
def handleTurnEnded(data):
    code = data['roomCode']
    players = lobbies[code]['players']
    current = lobbies[code]['drawerIndex']
    next_index = (current + 1) % len(players)
    lobbies[code]['drawerIndex'] = next_index

    emit('nextTurn', {
        'drawer': players[next_index]
    }, room=code)



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