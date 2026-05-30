from flask import Flask
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

@socketio.on('disconnect')
def handleDisconnect():
    print('Successfully disconnected!')





@socketio.on('create_lobby')
def handleCreateLobby(data):
    username = data['username']
    code = generateCode

    lobbies = {
        'host': username,
        'players': ['username'],
        'started': False
    }

    join_room(code)
    emit('lobby_created', {'code': code, 'username': [username]})



@socketio.on('join_lobby')
def handleJoinLobby(data):
    username = data['username']
    code = data['code']

    if code not in lobbies():
        emit('error', {'message': 'Lobby not Found'})
        return

    lobbies[code]['players'].append(username)
    join_room(code)

    emit('player_joined', {
        'players': lobbies[code]['players']
    }, room=code)





if __name__ == '__main__':
    socketio.run(
        app,
        host="127.0.0.1",
        debug=True,
        port=5001,
        allow_unsafe_werkzeug=True
    )