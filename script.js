<script>
        const SUPABASE_URL = "https://doecoosuqibzdsyadsyg.supabase.co";
        const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZWNvb3N1cWliemRzeWFkc3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjQwMDAsImV4cCI6MjEwNTUwMDAwMH0.M2-NrLZQv-DqTtsIp4DbFHzgTjUENCA5X1ZPdDlmhPQ";
        const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        let usuarioLogado = "";

        function obterSenhaUsuario(user) {
            const senhaSalva = localStorage.getItem(`senha_${user.toLowerCase()}`);
            if (senhaSalva) return senhaSalva;
            if (user.toLowerCase() === 'admin') return 'admin123';
            return '1234'; 
        }

        function fazerLogin() {
            const usuarioInput = document.getElementById("login-usuario").value.trim();
            const senhaInput = document.getElementById("login-senha").value;
            const hoje = new Date().toISOString().split("T")[0];

            if (!usuarioInput || !senhaInput) {
                alert("Por favor, preencha o usuário e a senha.");
                return;
            }

            const userLower = usuarioInput.toLowerCase();
            const senhaCorreta = obterSenhaUsuario(usuarioInput);

            if (senhaInput !== senhaCorreta) {
                alert("Usuário ou senha incorretos!");
                return;
            }

            document.getElementById("login-usuario").value = "";
            document.getElementById("login-senha").value = "";

            if (userLower === 'admin') {
                usuarioLogado = "Admin";
                document.getElementById("login-section").style.display = "none";
                document.getElementById("dashboard-barbeiro").style.display = "none";
                document.getElementById("dashboard-admin").style.display = "block";
                document.getElementById("filter-date-admin").value = hoje;
                carregarResumoAdmin();
            } else if (userLower === 'ana' || userLower === 'juliana' || userLower === 'mariana') {
                usuarioLogado = userLower.charAt(0).toUpperCase() + userLower.slice(1);
                document.getElementById("login-section").style.display = "none";
                document.getElementById("dashboard-admin").style.display = "none";
                document.getElementById("dashboard-barbeiro").style.display = "block";
                document.getElementById("titulo-agenda-barbeiro").textContent = `Agenda: ${usuarioLogado}`;
                document.getElementById("filter-date-barber").value = hoje;
                carregarAgendamentos();
            } else {
                alert("Usuário não encontrado ou sem permissão de acesso!");
            }
        }

        function fazerLogout() {
            usuarioLogado = "";
            document.getElementById("dashboard-barbeiro").style.display = "none";
            document.getElementById("dashboard-admin").style.display = "none";
            document.getElementById("login-section").style.display = "block";
        }

        function abrirModalSenha() {
            const modal = document.getElementById("custom-password-modal");
            const inputSenha = document.getElementById("input-nova-senha");
            inputSenha.value = "";
            document.getElementById("password-modal-user").textContent = `Nova senha para ${usuarioLogado}:`;
            modal.classList.add("active");

            const btnSalvar = document.getElementById("pass-btn-salvar");
            const btnCancelar = document.getElementById("pass-btn-cancelar");

            const novoBtnSalvar = btnSalvar.cloneNode(true);
            const novoBtnCancelar = btnCancelar.cloneNode(true);
            btnSalvar.parentNode.replaceChild(novoBtnSalvar, btnSalvar);
            btnCancelar.parentNode.replaceChild(novoBtnCancelar, btnCancelar);

            novoBtnSalvar.addEventListener("click", () => {
                const novaSenha = inputSenha.value.trim();
                if (novaSenha) {
                    localStorage.setItem(`senha_${usuarioLogado.toLowerCase()}`, novaSenha);
                    modal.classList.remove("active");
                    alert("Senha alterada com sucesso!");
                } else {
                    alert("Digite uma senha válida.");
                }
            });

            novoBtnCancelar.addEventListener("click", () => {
                modal.classList.remove("active");
            });
        }

        function mostrarConfirmacao(titulo, mensagem, onConfirmar) {
            const modal = document.getElementById("custom-confirm-modal");
            document.getElementById("modal-title").textContent = titulo;
            document.getElementById("modal-message").textContent = mensagem;
            modal.classList.add("active");

            const btnSim = document.getElementById("modal-btn-sim");
            const btnNao = document.getElementById("modal-btn-nao");

            const novoBtnSim = btnSim.cloneNode(true);
            const novoBtnNao = btnNao.cloneNode(true);
            btnSim.parentNode.replaceChild(novoBtnSim, btnSim);
            btnNao.parentNode.replaceChild(novoBtnNao, btnNao);

            novoBtnSim.addEventListener("click", () => {
                modal.classList.remove("active");
                onConfirmar();
            });
            novoBtnNao.addEventListener("click", () => {
                modal.classList.remove("active");
            });
        }

        function normalizarTexto(texto) {
            if (!texto) return "";
            return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        }

        const precosTabela = {
            "manicure simples": 30,
            "pedicure": 35,
            "alongamento em gel": 120,
            "extensão de cílios fio a fio": 100,
            "volume russo": 130,
            "design de sobrancelha": 35,
            "design com henna": 50,
            "escova modelada": 60
        };

        function calcularPrecoServico(nomeServico) {
            if (!nomeServico) return 30;
            const nomeNorm = normalizarTexto(nomeServico);
            if (precosTabela[nomeNorm]) return precosTabela[nomeNorm];
            let total = 0;
            nomeServico.split(",").forEach(parte => {
                total += precosTabela[normalizarTexto(parte)] || 30;
            });
            return total > 0 ? total : 30;
        }

        async function carregarAgendamentos() {
            const dataFiltro = document.getElementById("filter-date-barber").value;
            const container = document.getElementById("agendamentos-list-barbeiro");
            const lblQtd = document.getElementById("barber-resumo-qtd");
            const lblTotal = document.getElementById("barber-resumo-total");
            const lblCanceladosQtd = document.getElementById("barber-resumo-cancelados-qtd");
            const lblCanceladosVal = document.getElementById("barber-resumo-cancelados-val");
            const lblDetalhes = document.getElementById("barber-detalhes-pagamento");

            container.innerHTML = "<p style='color: #777; text-align: center;'>Carregando...</p>";

            try {
                let query = _supabase.from("agendamento").select("*").eq("barbeiro", usuarioLogado);
                if (dataFiltro) query = query.eq("data", dataFiltro);

                const { data, error } = await query;
                if (error) throw error;

                let faturamentoTotal = 0;
                let qtdConcluidos = 0;
                let qtdCancelados = 0;
                let valorCancelados = 0;
                let totaisPagamento = { Dinheiro: 0, Pix: 0, Débito: 0, Crédito: 0 };

                data.forEach(item => {
                    const preco = calcularPrecoServico(item.servico);
                    if (item.status === 'concluido') {
                        qtdConcluidos++;
                        faturamentoTotal += preco;
                        if (item.pagamentos && totaisPagamento[item.pagamentos] !== undefined) {
                            totaisPagamento[item.pagamentos] += preco;
                        }
                    } else if (item.status === 'cancelado') {
                        qtdCancelados++;
                        valorCancelados += preco;
                    }
                });

                lblQtd.textContent = qtdConcluidos;
                lblTotal.textContent = `R$ ${faturamentoTotal.toFixed(2).replace(".", ",")}`;
                lblCanceladosQtd.textContent = qtdCancelados;
                lblCanceladosVal.textContent = `R$ ${valorCancelados.toFixed(2).replace(".", ",")}`;
                
                lblDetalhes.innerHTML = `
                    <strong>Por Forma de Pagamento:</strong><br>
                    💵 Dinheiro: R$ ${totaisPagamento.Dinheiro.toFixed(2).replace(".", ",")} | 
                    📱 Pix: R$ ${totaisPagamento.Pix.toFixed(2).replace(".", ",")}<br>
                    💳 Débito: R$ ${totaisPagamento.Débito.toFixed(2).replace(".", ",")} | 
                    💳 Crédito: R$ ${totaisPagamento.Crédito.toFixed(2).replace(".", ",")}
                `;

                if (data.length === 0) {
                    container.innerHTML = "<p style='color: #777; text-align: center;'>Nenhum agendamento encontrado para esta data.</p>";
                    return;
                }

                container.innerHTML = "";
                data.forEach(item => {
                    const dataFormatada = item.data ? item.data.split("-").reverse().join("/") : '--/--/----';
                    let precoServico = calcularPrecoServico(item.servico);
                    const telefoneLimpo = item.telefone ? item.telefone.replace(/\D/g, '') : '';
                    const mensagemLembrete = encodeURIComponent(`Olá, ${item.cliente}! Passando para lembrar do seu horário hoje às ${item.horario} (${item.servico}) no Studio Bella. Te aguardamos aqui! 🌸`);
                    const linkZapCliente = telefoneLimpo ? `https://wa.me/55${telefoneLimpo}?text=${mensagemLembrete}` : `#`;

                    const isConcluido = item.status === 'concluido';
                    const isCancelado = item.status === 'cancelado';
                    const formaPagamentoAtual = item.pagamentos || '';

                    let corBorda = "#d63384";
                    if (isConcluido) corBorda = "#25D366";
                    if (isCancelado) corBorda = "#e74c3c";

                    const card = document.createElement("div");
                    card.style.background = "#FAFAFA";
                    card.style.padding = "15px";
                    card.style.borderRadius = "8px";
                    card.style.border = "1px solid #EAEAEA";
                    card.style.borderLeft = `4px solid ${corBorda}`;
                    
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <strong style="color: #d63384; font-size: 1.05rem;"><i class="fa-regular fa-clock"></i> ${item.horario}</strong>
                            <span style="font-size: 0.85rem; color: #777;">Data: ${dataFormatada}</span>
                        </div>
                        <p style="margin: 4px 0; color: #333;"><strong>Cliente:</strong> ${item.cliente} ${isCancelado ? '<span style="color: #e74c3c; font-size: 0.85rem; font-weight: bold; margin-left: 8px;">(CANCELADO)</span>' : ''}</p>
                        <p style="margin: 4px 0; color: #555;"><strong>Telefone:</strong> ${item.telefone || 'Não informado'}</p>
                        <p style="margin: 4px 0; color: #555;"><strong>Serviço:</strong> ${item.servico} <span style="color: #d63384; font-weight: bold; float: right;">R$ ${precoServico},00</span></p>
                        
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #EAEAEA; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <label style="font-size: 0.85rem; color: #555;">Forma de Pagamento:</label>
                                <select id="pagamento-${item.id}" style="width: 150px; padding: 5px; font-size: 0.85rem;" ${isCancelado ? 'disabled' : ''}>
                                    <option value="" ${!formaPagamentoAtual ? 'selected' : ''}>Selecione...</option>
                                    <option value="Dinheiro" ${formaPagamentoAtual === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
                                    <option value="Pix" ${formaPagamentoAtual === 'Pix' ? 'selected' : ''}>Pix</option>
                                    <option value="Débito" ${formaPagamentoAtual === 'Débito' ? 'selected' : ''}>Débito</option>
                                    <option value="Crédito" ${formaPagamentoAtual === 'Crédito' ? 'selected' : ''}>Crédito</option>
                                </select>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; gap: 6px;">
                                <button onclick="confirmarExecucao('${item.id}', '${item.status || ''}')" style="background: ${isConcluido ? '#25D366' : '#FDF2F8'}; color: ${isConcluido ? '#FFF' : '#d63384'}; border: 1px solid #d63384; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; display: flex; align-items: center; gap: 5px;" ${isCancelado ? 'disabled' : ''}>
                                    <i class="fa-solid ${isConcluido ? 'fa-check-double' : 'fa-check'}"></i> ${isConcluido ? 'Concluído' : 'Confirmar'}
                                </button>
                                
                                <button onclick="event.preventDefault(); event.stopPropagation(); window.open('${linkZapCliente}', '_blank');" style="background: #25D366; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                                    <i class="fa-brands fa-whatsapp"></i> Lembrete
                                </button>

                                <button onclick="cancelarAgendamento('${item.id}', '${item.status || ''}')" style="background: ${isCancelado ? '#888' : '#e74c3c'}; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                                    <i class="fa-solid fa-ban"></i> ${isCancelado ? 'Ativar' : 'Cancelar'}
                                </button>
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                });
            } catch (err) {
                console.error("Erro ao carregar agenda:", err);
                container.innerHTML = "<p style='color: #e74c3c; text-align: center;'>Erro ao carregar dados.</p>";
            }
        }

        async function carregarResumoAdmin() {
            const dataFiltro = document.getElementById("filter-date-admin").value;
            const container = document.getElementById("agendamentos-list-admin");
            const lblQtd = document.getElementById("admin-resumo-qtd");
            const lblTotal = document.getElementById("admin-resumo-total");
            const lblCanceladosQtd = document.getElementById("admin-resumo-cancelados-qtd");
            const lblCanceladosVal = document.getElementById("admin-resumo-cancelados-val");
            const lblDetalhes = document.getElementById("admin-detalhes-pagamento");

            container.innerHTML = "<p style='color: #777; text-align: center;'>Carregando...</p>";

            try {
                let query = _supabase.from("agendamento").select("*");
                if (dataFiltro) query = query.eq("data", dataFiltro);

                const { data, error } = await query;
                if (error) throw error;

                let faturamentoTotal = 0;
                let qtdConcluidos = 0;
                let qtdCancelados = 0;
                let valorCancelados = 0;
                let totaisPagamento = { Dinheiro: 0, Pix: 0, Débito: 0, Crédito: 0 };

                data.forEach(item => {
                    const preco = calcularPrecoServico(item.servico);
                    if (item.status === 'concluido') {
                        qtdConcluidos++;
                        faturamentoTotal += preco;
                        if (item.pagamentos && totaisPagamento[item.pagamentos] !== undefined) {
                            totaisPagamento[item.pagamentos] += preco;
                        }
                    } else if (item.status === 'cancelado') {
                        qtdCancelados++;
                        valorCancelados += preco;
                    }
                });

                lblQtd.textContent = qtdConcluidos;
                lblTotal.textContent = `R$ ${faturamentoTotal.toFixed(2).replace(".", ",")}`;
                lblCanceladosQtd.textContent = qtdCancelados;
                lblCanceladosVal.textContent = `R$ ${valorCancelados.toFixed(2).replace(".", ",")}`;
                
                lblDetalhes.innerHTML = `
                    <strong>Por Forma de Pagamento:</strong><br>
                    💵 Dinheiro: R$ ${totaisPagamento.Dinheiro.toFixed(2).replace(".", ",")} | 
                    📱 Pix: R$ ${totaisPagamento.Pix.toFixed(2).replace(".", ",")}<br>
                    💳 Débito: R$ ${totaisPagamento.Débito.toFixed(2).replace(".", ",")} | 
                    💳 Crédito: R$ ${totaisPagamento.Crédito.toFixed(2).replace(".", ",")}
                `;

                if (data.length === 0) {
                    container.innerHTML = "<p style='color: #777; text-align: center;'>Nenhum registro encontrado para esta data.</p>";
                    return;
                }

                container.innerHTML = "";
                data.forEach(item => {
                    const dataFormatada = item.data ? item.data.split("-").reverse().join("/") : '--/--/----';
                    let precoServico = calcularPrecoServico(item.servico);
                    const isConcluido = item.status === 'concluido';
                    const isCancelado = item.status === 'cancelado';

                    let corBorda = "#d63384";
                    if (isConcluido) corBorda = "#25D366";
                    if (isCancelado) corBorda = "#e74c3c";

                    const card = document.createElement("div");
                    card.style.background = "#FAFAFA";
                    card.style.padding = "12px 15px";
                    card.style.borderRadius = "8px";
                    card.style.border = "1px solid #EAEAEA";
                    card.style.borderLeft = `4px solid ${corBorda}`;
                    
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong style="color: #d63384;"><i class="fa-regular fa-clock"></i> ${item.horario} - Profissional: ${item.barbeiro}</strong>
                            <span style="font-size: 0.8rem; color: #777;">${dataFormatada}</span>
                        </div>
                        <p style="margin: 2px 0; font-size: 0.9rem; color: #333;"><strong>Cliente:</strong> ${item.cliente} ${isCancelado ? '<span style="color: #e74c3c; font-size: 0.8rem;">(Cancelado)</span>' : isConcluido ? '<span style="color: #25D366; font-size: 0.8rem;">(Concluído)</span>' : ''}</p>
                        <p style="margin: 2px 0; font-size: 0.9rem; color: #555;"><strong>Serviço:</strong> ${item.servico} | <strong>Pagamento:</strong> ${item.pagamentos || 'Não informado'} <span style="color: #d63384; font-weight: bold; float: right;">R$ ${precoServico},00</span></p>
                    `;
                    container.appendChild(card);
                });

            } catch (err) {
                console.error("Erro ao carregar resumo:", err);
                container.innerHTML = "<p style='color: #e74c3c; text-align: center;'>Erro ao carregar resumo administrativo.</p>";
            }
        }

        async function confirmarExecucao(id, statusAtual) {
            const novoStatus = (statusAtual === 'concluido') ? null : 'concluido';
            const selectPagamento = document.getElementById(`pagamento-${id}`);
            const formaPagamento = selectPagamento ? selectPagamento.value : null;

            const dadosUpdate = { status: novoStatus };
            if (formaPagamento) dadosUpdate.pagamentos = formaPagamento;

            const { error } = await _supabase.from("agendamento").update(dadosUpdate).eq("id", id);
            if (error) {
                alert("Erro ao atualizar serviço: " + error.message);
            } else {
                carregarAgendamentos();
            }
        }

        function cancelarAgendamento(id, statusAtual) {
            const novoStatus = (statusAtual === 'cancelado') ? null : 'cancelado';
            const titulo = novoStatus === 'cancelado' ? "Cancelar Agendamento" : "Reativar Agendamento";
            const mensagem = novoStatus === 'cancelado' 
                ? "Deseja realmente cancelar este agendamento? O horário será liberado para novos clientes." 
                : "Deseja reativar este agendamento?";

            mostrarConfirmacao(titulo, mensagem, async () => {
                const { error } = await _supabase.from("agendamento").update({ status: novoStatus }).eq("id", id);
                if (error) {
                    alert("Erro ao alterar status: " + error.message);
                } else {
                    carregarAgendamentos();
                }
            });
        }
    </script>
