const socket = io('http://localhost:3000');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');

const name = prompt('Qual é o teu nome?');
appendMessage('Entraste no chat');
socket.emit('new-user', name);

socket.on('chat-message', data => {
    appendMessage(`${data.name}: ${data.message}`);
});

socket.on('file-message', data => {
    appendFile(data);
});

socket.on('user-connected', name => {
    appendMessage(`${name} entrou no chat`);
});

socket.on('user-disconnected', name => {
    appendMessage(`${name} saiu do chat`);
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();

    const message = messageInput.value;
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function() {
            const base64 = reader.result;
            socket.emit('send-file', {
                name: name,
                fileName: file.name,
                fileType: file.type,
                fileData: base64,
            });
            appendMessage(`Tu enviaste: ${file.name}`);
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    }

    if (message.trim() !== '') {
        appendMessage(`Tu: ${message}`);
        socket.emit('send-chat-message', message);
        messageInput.value = '';
    }
});

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}

function appendFile(data) {
    const fileElement = document.createElement('div');
    const fileType = data.fileType;

    if (fileType.startsWith('image/')) {
        // Mostrar imagem
        const img = document.createElement('img');
        img.src = data.fileData;
        img.alt = data.fileName;
        img.style.maxWidth = '300px';
        fileElement.append(`${data.name} enviou uma imagem:`, img);
    } else if (fileType.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = data.fileData;
        video.controls = true;
        video.style.maxWidth = '300px';
        fileElement.append(`${data.name} enviou um vídeo:`, video);
    } else {
        // Outros ficheiros - criar link de download
        const link = document.createElement('a');
        link.href = data.fileData;
        link.download = data.fileName;
        link.innerText = `${data.name} enviou: ${data.fileName}`;
        fileElement.append(link);
    }

    messageContainer.append(fileElement);
}