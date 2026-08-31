// ==================== LÓGICA DO GRÁFICO (CHART.JS) ====================
        let meuGrafico; // Variável global para guardar o gráfico

        function renderizarGrafico() {
            const perfil = JSON.parse(localStorage.getItem('lifeOS_profile'));
            const historico = JSON.parse(localStorage.getItem('lifeOS_historicoPeso')) || [];

            if (!perfil) return; // Se não tem perfil, não desenha nada

            let datasEixoX = [];
            let pesosEixoY = [];

            // Ponto Inicial
            datasEixoX.push("Início (" + perfil.createdAt + ")");
            pesosEixoY.push(parseFloat(perfil.initialWeight));

            // Histórico diário
            for (let registro of historico) {
                datasEixoX.push(registro.data);
                pesosEixoY.push(registro.peso);
            }

            const ctx = document.getElementById('graficoPeso').getContext('2d');

            if (meuGrafico) {
                meuGrafico.destroy();
            }

            meuGrafico = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: datasEixoX,
                    datasets: [{
                        label: 'Seu Peso (kg)',
                        data: pesosEixoY,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderWidth: 3,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // ==================== LÓGICA DO PERFIL ====================
        const profileModal = document.getElementById('profileModal');
        const profileForm = document.getElementById('profileForm');
        const welcomeTitle = document.getElementById('welcomeTitle');
        const profileSummary = document.getElementById('profileSummary');

        function checkProfile() {
            const savedProfile = localStorage.getItem('lifeOS_profile');

            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                profileModal.classList.add('hidden');
                welcomeTitle.innerText = `Olá, ${profile.name}! 👋`;
                profileSummary.innerText = `Marco Zero: ${profile.initialWeight}kg | Altura: ${profile.height}cm`;
            } else {
                profileModal.classList.remove('hidden');
            }
        }

        profileForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const name = document.getElementById('userName').value;
            const height = document.getElementById('userHeight').value;
            const initialWeight = document.getElementById('userInitialWeight').value;

            const userProfile = {
                name: name,
                height: height,
                initialWeight: initialWeight,
                createdAt: new Date().toLocaleDateString('pt-BR')
            };

            localStorage.setItem('lifeOS_profile', JSON.stringify(userProfile));
            
            checkProfile();
            renderizarGrafico(); // Atualiza o gráfico assim que cria o perfil
        });

        // ==================== LÓGICA DO MONITORAMENTO FÍSICO ====================
        const btnSaveHealth = document.getElementById('btnSaveHealth');
        const dailyWeightInput = document.getElementById('dailyWeight');
        const healthFeedback = document.getElementById('healthFeedback');

        btnSaveHealth.addEventListener('click', function () {
            const pesoAtual = parseFloat(dailyWeightInput.value);

            if (isNaN(pesoAtual)) {
                healthFeedback.innerText = "Por favor, digite o peso de hoje antes de salvar!";
                healthFeedback.style.color = "red";
                return;
            }

            const savedProfile = localStorage.getItem('lifeOS_profile');

            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                const pesoInicial = parseFloat(profile.initialWeight);
                const diferenca = pesoAtual - pesoInicial;

                if (diferenca < 0) {
                    let pesoPerdido = (diferenca * -1).toFixed(2);
                    healthFeedback.innerText = `🔥 Excelente! Você perdeu ${pesoPerdido}kg desde o início.`;
                    healthFeedback.style.color = "#27ae60";
                } else if (diferenca > 0) {
                    let pesoGanho = diferenca.toFixed(2);
                    healthFeedback.innerText = `📈 Registro salvo. Você ganhou ${pesoGanho}kg desde o início.`;
                    healthFeedback.style.color = "#e74c3c";
                } else {
                    healthFeedback.innerText = `⚖️ Registro salvo. Seu peso está exatamente igual ao início.`;
                    healthFeedback.style.color = "#f39c12";
                }

                let historico = JSON.parse(localStorage.getItem('lifeOS_historicoPeso')) || [];

                historico.push({
                    data: new Date().toLocaleDateString('pt-BR'),
                    peso: pesoAtual
                });

                localStorage.setItem('lifeOS_historicoPeso', JSON.stringify(historico));
                dailyWeightInput.value = '';
                
                renderizarGrafico(); // Atualiza o gráfico na hora que salva um peso novo!
            }
        });

        // ==================== LÓGICA DA ROTINA DE TREINO ====================
        const btnTreino = document.getElementById('btnTreino');
        const treinoStatus = document.getElementById('treinoStatus');
        const hoje = new Date().toLocaleDateString('pt-BR'); 

        function carregarStatusTreino() {
            const treinosSalvos = JSON.parse(localStorage.getItem('lifeOS_treinos')) || {};

            if (treinosSalvos[hoje] === true) {
                treinoStatus.innerText = "Concluído";
                treinoStatus.style.color = "#27ae60";
                btnTreino.innerText = "Desfazer";
                btnTreino.style.backgroundColor = "#7f8c8d";
            } else {
                treinoStatus.innerText = "Pendente";
                treinoStatus.style.color = "#e74c3c";
                btnTreino.innerText = "Marcar como Concluído";
                btnTreino.style.backgroundColor = "#27ae60";
            }
        }

        btnTreino.addEventListener('click', function () {
            const treinosSalvos = JSON.parse(localStorage.getItem('lifeOS_treinos')) || {};

            if (treinoStatus.innerText === "Pendente") {
                treinosSalvos[hoje] = true;
            } else {
                treinosSalvos[hoje] = false;
            }

            localStorage.setItem('lifeOS_treinos', JSON.stringify(treinosSalvos));
            carregarStatusTreino();
        });

        // ==================== LÓGICA DO DIÁRIO RÁPIDO ====================
        const btnSalvarDiario = document.getElementById('btnSalvarDiario');
        const textoDiario = document.getElementById('textoDiario');
        const diarioFeedback = document.getElementById('diarioFeedback');
        const dataDeHoje = new Date().toLocaleDateString('pt-BR');

        function carregarDiarioDeHoje() {
            const diariosSalvos = JSON.parse(localStorage.getItem('lifeOS_diarios')) || {};

            if (diariosSalvos[dataDeHoje]) {
                textoDiario.value = diariosSalvos[dataDeHoje];
            } else {
                textoDiario.value = "";
            }
        }

        btnSalvarDiario.addEventListener('click', function () {
            const textoDigitado = textoDiario.value.trim();

            if (textoDigitado === "") {
                diarioFeedback.innerText = "Escreva algo antes de salvar.";
                diarioFeedback.style.color = "red";
                return;
            }

            const diariosSalvos = JSON.parse(localStorage.getItem('lifeOS_diarios')) || {};
            diariosSalvos[dataDeHoje] = textoDigitado;

            localStorage.setItem('lifeOS_diarios', JSON.stringify(diariosSalvos));

            diarioFeedback.innerText = "Diário atualizado com sucesso! ✅";
            diarioFeedback.style.color = "#27ae60";

            setTimeout(() => {
                diarioFeedback.innerText = "";
            }, 3000);
        });

        // ==================== INICIALIZAÇÃO DA PÁGINA ====================
        // Estas funções rodam sozinhas assim que você abre o arquivo no navegador
        checkProfile();
        carregarStatusTreino();
        carregarDiarioDeHoje();
        renderizarGrafico(); 