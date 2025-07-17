const socket = io('https://real-time-server-ih0p.onrender.com');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');

let name = '';

while (!name || name.length > 20) {
    name = prompt('Qual é o teu nome? (máx. 20 caracteres)');
    if (name && name.length > 20) {
        alert('O nome não pode ter mais de 20 caracteres.');
    }
}
appendMessage('Entraste no chat', true);
socket.emit('new-user', name);

socket.on('chat-message', data => {
    appendMessage(`<strong>${data.name}:</strong> ${data.message}`, false);

});

socket.on('file-message', data => {
    appendFile(data, false); // Estilo de outros
});


socket.on('user-connected', name => {
    appendMessage(`${name} entrou no chat`, false);
});

socket.on('user-disconnected', name => {
    appendMessage(`${name} saiu do chat`, false);
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();

    const message = messageInput.value;
    const file = fileInput.files[0];

    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limite
            alert('O ficheiro é demasiado grande (máx. 5MB).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function() {
            const base64 = reader.result;
            const fileData = {
                name: name,
                fileName: file.name,
                fileType: file.type,
                fileData: base64
            };
            socket.emit('send-file', fileData);
            appendFile(fileData, true); // Estilo do próprio
        };
        reader.onerror = function() {
            alert('Erro ao ler o ficheiro.');
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    }


    if (message.trim() !== '') {
        appendMessage(`${message}`, true);
        socket.emit('send-chat-message', message);
        messageInput.value = '';
    }
});

function appendMessage(message, isSelf = false) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    messageElement.classList.add('message');
    messageElement.classList.add(isSelf ? 'self' : 'other');

    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}



function appendFile(data, isSelf = false) {
    const fileElement = document.createElement('div');
    fileElement.classList.add('message');
    fileElement.classList.add(isSelf ? 'self' : 'other');

    const fileType = data.fileType || '';

    // Imagem
    if (fileType.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = data.fileData;
        img.alt = data.fileName;
        img.style.maxWidth = '300px';
        fileElement.innerHTML = `<strong>${data.name} enviou uma imagem:</strong><br/>`;
        fileElement.appendChild(img);
    }
    // Vídeo
    else if (fileType.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = data.fileData;
        video.controls = true;
        video.style.maxWidth = '300px';
        fileElement.innerHTML = `<strong>${data.name} enviou um vídeo:</strong><br/>`;
        fileElement.appendChild(video);
    }
    // Áudio
    else if (fileType.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = data.fileData;
        audio.controls = true;
        fileElement.innerHTML = `<strong>${data.name} enviou um áudio:</strong><br/>`;
        fileElement.appendChild(audio);
    }
    // Qualquer outro tipo de ficheiro
    else {
        const link = document.createElement('a');
        link.href = data.fileData;
        link.download = data.fileName;
        link.innerText = `${data.name} enviou: ${data.fileName}`;
        fileElement.appendChild(link);
    }

    messageContainer.append(fileElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}



const allUsersContainer = document.getElementById('all-users');

socket.on('update-user-list', users => {
    updateUserList(users);
});

function updateUserList(users) {
    allUsersContainer.innerHTML = ''; // Limpa a lista antiga

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.innerText = user;
        allUsersContainer.append(userElement);
    });
}
