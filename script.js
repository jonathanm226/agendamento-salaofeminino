// Configuração do Supabase
const SUPABASE_URL = "https://doecoosuqibzdsyadsyg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZWNvb3N1cWliemRzeWFkc3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjQwMDAsImV4cCI6MjEwNTUwMDAwMH0.M2-NrLZQv-DqTtsIp4DbFHzgTjUENCA5X1ZPdDlmhPQ";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedBarber = "Ana"; 
let selectedServices = [];

// Função para selecionar a profissional
function selectBarber(element, barberName) {
    document.querySelectorAll('.barber-card').forEach(card => {
        card.classList.remove('active');
    });
    element.classList.add('active');
    selectedBarber = barberName;
}

// Função para marcar/desmarcar serviços
function toggleService(element, serviceName, duration) {
    const icon = element.querySelector('.checkbox-icon');
    const index = selectedServices.findIndex(s => s.name === serviceName);
    
    if (index > -1) {
        selectedServices.splice(index, 1);
        element.classList.remove('active');
        icon.classList.remove('fa-square-check');
        icon.classList.add('fa-square');
    } else {
        selectedServices.push({ name: serviceName, duration: duration });
        element.classList.add('active');
        icon.classList.remove('fa-square');
        icon.classList.add('fa-square-check');
    }
}

// Preencher os horários disponíveis (bloqueando o que já passou hoje)
function checkAvailableTimes() {
    const timeSelect = document.getElementById('time');
    const dateInput = document.getElementById('date').value;
    timeSelect.innerHTML = "";
    
    const horariosDisponiveis = [
        "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
    ];

    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;
    
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();

    let horariosValidos = 0;

    horariosDisponiveis.forEach(horario => {
        if (dateInput === hojeStr) {
            const [h, m] = horario.split(':').map(Number);
            if (h < horaAtual || (h === horaAtual && m <= minutoAtual)) {
                return; 
            }
        }

        const option = document.createElement('option');
        option.value = horario;
        option.textContent = horario;
        timeSelect.appendChild(option);
        horariosValidos++;
    });

    if (horariosValidos === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhum horário disponível para hoje";
        timeSelect.appendChild(option);
    }
}

// Enviar para o WhatsApp e Salvar no Supabase (Em segundo plano, sem bloquear o cliente)
async function sendToWhatsapp() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    const dateInput = document.getElementById('date').value;
    const timeInput = document.getElementById('time').value;

    if (!clientName || !clientPhone) {
        alert("Por favor, preencha o seu Nome e o seu WhatsApp.");
        return;
    }

    if (selectedServices.length === 0) {
        alert("Por favor, selecione pelo menos um serviço.");
        return;
    }

    if (!dateInput || !timeInput || timeInput === "") {
        alert("Por favor, escolha uma data e um horário válido.");
        return;
    }

    const nomesServicos = selectedServices.map(s => s.name).join(", ");
    
    // Tenta salvar no Supabase em segundo plano de forma silenciosa (sem exibir erros para o utilizador)
    supabaseClient
        .from("agendamento")
        .insert([
            { 
                cliente: clientName, 
                telefone: clientPhone, 
                barbeiro: selectedBarber, 
                servico: nomesServicos, 
                data: dateInput, 
                horario: timeInput,
                status: "Pendente"
            }
        ])
        .then(({ error }) => {
            if (error) console.log("Aviso de sincronização local:", error.message);
        });

    // Número do WhatsApp do estúdio (exemplo com DDD)
    const seuNumeroWhatsApp = "5531999999999"; 
    
    const textoMensagem = `Olá! Gostaria de confirmar meu agendamento no Studio Bella.\n\n*Profissional:* ${selectedBarber}\n*Serviço(s):* ${nomesServicos}\n*Data:* ${dateInput}\n*Horário:* ${timeInput}\n*Cliente:* ${clientName} (${clientPhone})`;
    
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${seuNumeroWhatsApp}&text=${encodeURIComponent(textoMensagem)}`;

    // Abre o WhatsApp imediatamente sem erros
    window.open(urlWhatsApp, '_blank');
}

// Inicializar data ao carregar
window.onload = function() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;

    const dateField = document.getElementById('date');
    if (dateField) {
        dateField.min = hojeStr; 
        dateField.value = hojeStr;
        checkAvailableTimes();
    }
};