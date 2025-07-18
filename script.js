const socket = io('https://real-time-server-ih0p.onrender.com');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
// Exemplo de emojis e ASCII faces


let name = '';
let pass = '';
let pass_certa = false;

while (pass_certa == false) {
    pass = prompt('Insira a Password');
    if (pass == 'SISnove') {
        pass_certa = true;
    } else alert('Password incorreta');
}


while (!name || name.length > 20) {
    name = prompt('Qual é o teu nome? (máx. 20 caracteres)');
    if (name && name.length > 20) {
        alert('O nome não pode ter mais de 20 caracteres.');
    }
}
const now = new Date();
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');
const time = `[${hours}:${minutes}]`;
appendMessage(`<strong>${time}</strong> Entraste no chat`, true);

socket.emit('new-user', name);

socket.on('chat-message', data => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    appendMessage(`<strong>[${time}]</strong> <strong>${data.name}:</strong> ${data.message}`, false);
});


socket.on('file-message', data => {
    appendFile(data, false); // Estilo de outros
});


socket.on('user-connected', name => {
    const now = new Date();
    const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
    appendMessage(`<strong>${time}</strong> <strong>${name}</strong> entrou no chat`, false);
});

socket.on('user-disconnected', name => {
    const now = new Date();
    const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
    appendMessage(`<strong>${time}</strong> <strong>${name}</strong> saiu do chat`, false);
});


messageForm.addEventListener('submit', e => {
    e.preventDefault();

    const message = messageInput.value;
    const file = fileInput.files[0];

    if (file) {
        if (file.size > 0.7 * 1024 * 1024) { // 5MB limite
            alert('O ficheiro é demasiado grande (máx. 0.7MB).');
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
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;

        appendMessage(`<strong>[${time}]</strong> <strong>Tu:</strong> ${message}`, true);
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
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        fileElement.innerHTML = `<strong>${time} ${data.name} enviou uma imagem:</strong><br/>`;
        fileElement.appendChild(img);
    }
    // Vídeo
    else if (fileType.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = data.fileData;
        video.controls = true;
        video.style.maxWidth = '300px';
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        fileElement.innerHTML = `<strong>${time} ${data.name} enviou um vídeo:</strong><br/>`;
        fileElement.appendChild(video);
    }
    // Áudio
    else if (fileType.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = data.fileData;
        audio.controls = true;
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        fileElement.innerHTML = `<strong>${time} ${data.name} enviou um áudio:</strong><br/>`;
        fileElement.appendChild(audio);
    }
    // Qualquer outro tipo de ficheiro
    else {
        const link = document.createElement('a');
        link.href = data.fileData;
        link.download = data.fileName;
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        link.innerText = `${time}   ${data.name} enviou: ${data.fileName}`;
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


const insertButton = document.getElementById('insert-button');
const insertPanel = document.getElementById('insert-panel');
const tabButtons = document.querySelectorAll('.tab-btn');
const emojiTab = document.getElementById('emoji-tab');
const asciiTab = document.getElementById('ascii-tab');

// Mostrar/esconder o painel ao clicar no botão
insertButton.addEventListener('click', () => {
    const isVisible = insertPanel.style.display === 'flex';
    insertPanel.style.display = isVisible ? 'none' : 'flex';
});

// Fechar painel apenas ao ENVIAR mensagem
document.getElementById('send-container').addEventListener('submit', () => {
    insertPanel.style.display = 'none';
});

// Alternar abas entre Emojis e ASCII
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Tornar botão ativo
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Esconder todas as tabs
        emojiTab.style.display = 'none';
        asciiTab.style.display = 'none';

        // Mostrar a tab correspondente
        const tabId = btn.dataset.tab;
        document.getElementById(`${tabId}-tab`).style.display = 'flex';
    });
});

// Popular emojis
const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'
];
emojiTab.innerHTML = emojis.map(e => `<span class="insert-item">${e}</span>`).join('');

const asciiFaces = [
    '¯\\_(ツ)_/¯',
    '( ͡° ͜ʖ ͡°)',
    '(╯°□°）╯︵ ┻━┻',
    'ʕ•ᴥ•ʔ',
    'ಠ_ಠ',
    '(ノಠ益ಠ)ノ彡┻━┻',
    '☜(⌒▽⌒)☞',
    '(͡• ͜ʖ ͡•)',
    '(ᵔᴥᵔ)',
    '(•‿•)',
    'ʕ•́ᴥ•̀ʔっ',
    'ʘ‿ʘ',
    '(ง ͠° ͟ل͜ ͡°)ง',
    '(▀̿Ĺ̯▀̿ ̿)',
    '(づ｡◕‿‿◕｡)づ',
    '(¬‿¬)',
    '◉_◉',
    '°Д°',
    '(•_•) ( •_•)>⌐■-■ (⌐■_■)',
    'ヽ(・∀・)ﾉ',
    '(´• ω •`) ♡',
    '(//▽//)',
    '(￣ヘ￣)',
    '(凸ಠ益ಠ)凸',
    '(╥_╥)',
    '(×﹏×)',
    'Σ(°△°|||)',
    'ᕕ( ᐛ )ᕗ',
    'ლ(ಠ_ಠ ლ)',
    '(・_・;)',
    '(￢_￢)',
    'Σ(°ロ°)',
    '(⊙_⊙)',
    '( ° ∀ ° )ﾉﾞ',
    '(づ ◕‿◕ )づ',
    '( ´-ω･)︻┻┳══━一'
];


asciiTab.innerHTML = asciiFaces.map(face => `<span class="insert-item">${face}</span>`).join('');
// Inserir emoji/ASCII no campo de input
insertPanel.addEventListener('click', e => {
    if (e.target.classList.contains('insert-item')) {
        const input = document.getElementById('message-input');
        input.value += e.target.textContent;
        input.focus();
    }
});


const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const themeSelect = document.getElementById('theme-select');



// Toggle painel
settingsButton.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});



// Alternar tema
themeSelect.addEventListener('change', () => {
    const tema = themeSelect.value;
    document.body.classList.remove('tema-claro', 'tema-escuro');
    document.body.classList.add('tema-' + tema);
    localStorage.setItem('tema', tema);
});

// Restaurar tema salvo
const temaGuardado = localStorage.getItem('tema') || 'claro';
document.body.classList.add('tema-' + temaGuardado);
themeSelect.value = temaGuardado;



document.addEventListener("contextmenu", function(e) {
    e.preventDefault();
})

document.addEventListener("keydown", function(e) {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
    }
})


const typingIndicator = document.getElementById('typing-indicator');
const typingUsers = new Set();
let typingTimeout;

// Quando o utilizador escreve algo
messageInput.addEventListener('input', () => {
    socket.emit('typing', name);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop-typing', name);
    }, 1000); // 1 segundo sem escrever
});

// Quando sai do campo de escrita
messageInput.addEventListener('blur', () => {
    socket.emit('stop-typing', name);
});

// Quando recebe a lista de quem está a escrever
socket.on('update-typing', (typingNames) => {
    const othersTyping = typingNames.filter(n => n !== name);

    if (othersTyping.length === 1) {
        typingIndicator.innerText = `${othersTyping[0]} está a escrever...`;
    } else if (othersTyping.length > 1) {
        typingIndicator.innerText = `${othersTyping.join(', ')} estão a escrever...`;
    } else {
        typingIndicator.innerText = '';
    }
});
