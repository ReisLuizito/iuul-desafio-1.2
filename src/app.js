const prompt = require('prompt-sync')();
const PacienteService = require('./services/PacienteService');

const pacienteService = new PacienteService();

function menuCadastroPacientes() {
    console.log('1- Cadastrar novo paciente');
    console.log('2- Excluir paciente');
    console.log('3- Listar pacientes (ordenado por CPF)');
    console.log('4- Listar pacientes (ordenado por nome)');
    console.log('5- Voltar p/ menu principal');

    const opcao = prompt('Escolha uma opção: ');
    switch (opcao) {
        case '1':
            cadastrarPaciente();
            break;
        case '2':
            excluirPaciente();
            break;
        case '3':
            listarPacientes('cpf');
            break;
        case '4':
            listarPacientes('nome');
            break;
        case '5':
            return;
        default:
            console.log('Opção inválida.');
    }
}

function menuAgenda() {
    console.log('1- Agendar consulta');
    console.log('2- Cancelar agendamento');
    console.log('3- Listar agenda');
    console.log('4- Voltar p/ menu principal');

    const opcao = prompt('Escolha uma opção: ');
    switch (opcao) {
        case '1':
            agendarConsulta();
            break;
        case '2':
            cancelarAgendamento();
            break;
        case '3':
            listarAgenda();
            break;
        case '4':
            return;
        default:
            console.log('Opção inválida.');
    }
}

function menuPrincipal() {
    console.log('1- Cadastro de pacientes');
    console.log('2- Agenda');
    console.log('3- Fim');

    const opcao = prompt('Escolha uma opção: ');
    switch (opcao) {
        case '1':
            menuCadastroPacientes();
            break;
        case '2':
            menuAgenda();
            break;
        case '3':
            console.log('Encerrando...');
            break;
        default:
            console.log('Opção inválida.');
    }
}

function cadastrarPaciente() {
    try {
        const cpf = prompt('CPF: ');
        const nome = prompt('Nome: ');
        const dataNascimento = prompt('Data de nascimento (DD/MM/AAAA): ');
        const paciente = pacienteService.cadastrarPaciente(
            cpf,
            nome,
            dataNascimento
        );
        console.log('Paciente cadastrado com sucesso:', paciente);
    } catch (error) {
        console.log('Erro:', error.message);
    }
}

function excluirPaciente() {
    try {
        const cpf = prompt('CPF do paciente a ser excluído: ');
        pacienteService.excluirPaciente(cpf);
    } catch (error) {
        console.log('Erro:', error.message);
    }
}

function listarPacientes(criterio = 'nome') {
    const pacientes = pacienteService.listarPacientes();
    const ordenados = criterio === 'cpf'
        ? pacientes.sort((a, b) => a.cpf.localeCompare(b.cpf))
        : pacientes.sort((a, b) => a.nome.localeCompare(b.nome));
    console.log('---------------------------------------');
    console.log('CPF Nome                Dt.Nasc. Idade');
    console.log('---------------------------------------');
    ordenados.forEach(paciente => {
        console.log(
            `${paciente.cpf} ${paciente.nome.padEnd(20)} ${paciente.dataNascimento.toFormat('dd/MM/yyyy')} ${paciente.idade}`
        );
    });
    console.log('---------------------------------------');
}

function agendarConsulta() {
    try {
        const cpf = prompt('CPF do paciente: ');
        const dataConsulta = prompt('Data da consulta (DD/MM/AAAA): ');
        const horaInicial = prompt('Hora inicial (HHMM): ');
        const horaFinal = prompt('Hora final (HHMM): ');

        pacienteService.agendarConsulta(cpf, dataConsulta, horaInicial, horaFinal);
    } catch (error) {
        console.log('Erro:', error.message);
    }
}

function cancelarAgendamento() {
    try {
        const cpf = prompt('CPF do paciente: ');
        const dataConsulta = prompt('Data da consulta (DD/MM/AAAA): ');
        const horaInicial = prompt('Hora inicial (HHMM): ');

        pacienteService.cancelarAgendamento(cpf, dataConsulta, horaInicial);
    } catch (error) {
        console.log('Erro:', error.message);
    }
}

function listarAgenda() {
    const tipoListagem = prompt(
        'Deseja listar toda a agenda ou um período? (T/P): '
    ).toUpperCase();

    let agendamentos;
    if (tipoListagem === 'P') {
        const dataInicial = prompt('Data inicial (DD/MM/AAAA): ');
        const dataFinal = prompt('Data final (DD/MM/AAAA): ');
        try {
            agendamentos = pacienteService.listarAgendaPorPeriodo(
                dataInicial,
                dataFinal
            );
        } catch (error) {
            console.log('Erro:', error.message);
            return;
        }
    } else {
        agendamentos = pacienteService.listarAgendaPorPeriodo();
    }

    if (agendamentos.length === 0) {
        console.log('Nenhum agendamento encontrado.');
        return;
    }

    console.log('-------------------------------------------------------------');
    console.log('Data       Hora Inicial Hora Final CPF         Nome');
    console.log('-------------------------------------------------------------');
    agendamentos.forEach(agendamento => {
        const paciente = pacienteService.pacientes.find(
            p => p.cpf === agendamento.cpf
        );
        console.log(
            `${agendamento.dataConsulta.toFormat('dd/MM/yyyy')} ${agendamento.horaInicial.toFormat('HH:mm').padEnd(12)} ${agendamento.horaFinal.toFormat('HH:mm').padEnd(12)} ${agendamento.cpf.padEnd(12)} ${paciente ? paciente.nome : 'N/A'}`
        );
    });
    console.log('-------------------------------------------------------------');
}

function listarPacientes(criterio = 'nome') {
    const pacientesComAgendamentos =
        pacienteService.listarPacientesComAgendamentos(criterio);

    console.log('-------------------------------------------------------------');
    console.log('CPF         Nome                Dt.Nasc.   Idade');
    console.log('-------------------------------------------------------------');
    pacientesComAgendamentos.forEach(({ paciente, agendamento }) => {
        console.log(
            `${paciente.cpf.padEnd(12)} ${paciente.nome.padEnd(20)} ${paciente.dataNascimento.toFormat('dd/MM/yyyy')} ${paciente.idade}`
        );
        if (agendamento) {
            console.log(
                `Agendado para: ${agendamento.dataConsulta.toFormat('dd/MM/yyyy')} ${agendamento.horaInicial.toFormat('HH:mm')} - ${agendamento.horaFinal.toFormat('HH:mm')}`
            );
        }
    });
    console.log('-------------------------------------------------------------');
}

function executar() {
    let opcao = '';
    while (opcao !== '3') {
        opcao = menuPrincipal();
    }
}

executar();
