const Paciente = require('../models/Paciente');
const Validacao = require('../utils/Validacao');
const { DateTime } = require('luxon');

class PacienteService {
    constructor() {
        this.pacientes = [];
        this.agendamentos = [];
    }

    cadastrarPaciente(cpf, nome, dataNascimento) {
        if (!Validacao.validarCPF(cpf)) {
            throw new Error('CPF inválido.');
        }

        if (this.pacientes.some(p => p.cpf === cpf)) {
            throw new Error('CPF já cadastrado.');
        }

        if (!Validacao.validarNome(nome)) {
            throw new Error('O nome deve ter pelo menos 5 caracteres.');
        }

        const dataValida = Validacao.validarDataNascimento(dataNascimento);
        if (!dataValida) {
            throw new Error('Data de nascimento inválida.');
        }

        if (!Validacao.validarIdade(dataValida)) {
            throw new Error('Paciente deve ter pelo menos 13 anos.');
        }

        const paciente = new Paciente(cpf, nome, dataValida);
        this.pacientes.push(paciente);
        return paciente;
    }

    listarPacientes() {
        return this.pacientes;
    }

    agendarConsulta(cpf, dataConsulta, horaInicial, horaFinal) {
        const paciente = this.pacientes.find(p => p.cpf === cpf);
        if (!paciente) {
            throw new Error('Paciente não cadastrado.');
        }
    
        const dataConsultaLuxon = DateTime.fromFormat(dataConsulta, 'dd/MM/yyyy');
        if (!dataConsultaLuxon.isValid) {
            throw new Error('Data da consulta inválida.');
        }
    
        const horaInicialLuxon = DateTime.fromFormat(horaInicial, 'HHmm');
        const horaFinalLuxon = DateTime.fromFormat(horaFinal, 'HHmm');
        if (!horaInicialLuxon.isValid || !horaFinalLuxon.isValid) {
            throw new Error('Hora inicial ou final inválida.');
        }
    
        const horarioAbertura = DateTime.fromFormat('0800', 'HHmm');
        const horarioFechamento = DateTime.fromFormat('1900', 'HHmm');
        if (
            horaInicialLuxon < horarioAbertura ||
            horaFinalLuxon > horarioFechamento ||
            horaInicialLuxon >= horaFinalLuxon
        ) {
            throw new Error(
                'Horários fora do intervalo permitido (08:00 às 19:00) ou inválidos.'
            );
        }
    
        const validarIntervalo = hora => hora.minute % 15 === 0;
        if (!validarIntervalo(horaInicialLuxon) || !validarIntervalo(horaFinalLuxon)) {
            throw new Error(
                'As horas inicial e final devem ser múltiplas de 15 minutos.'
            );
        }
    
        if (
            dataConsultaLuxon < DateTime.now().startOf('day') ||
            (dataConsultaLuxon.equals(DateTime.now().startOf('day')) &&
                horaInicialLuxon <= DateTime.now())
        ) {
            throw new Error('A consulta deve ser agendada para um período futuro.');
        }
    
        const possuiConsultaFutura = this.agendamentos.some(
            agendamento =>
                agendamento.cpf === cpf && agendamento.dataConsulta > DateTime.now()
        );
        if (possuiConsultaFutura) {
            throw new Error('O paciente já possui uma consulta futura agendada.');
        }
    
        const agendamentoSobreposto = this.agendamentos.some(agendamento =>
            agendamento.dataConsulta.equals(dataConsultaLuxon) &&
            (
                (horaInicialLuxon >= agendamento.horaInicial && horaInicialLuxon < agendamento.horaFinal) ||
                (horaFinalLuxon > agendamento.horaInicial && horaFinalLuxon <= agendamento.horaFinal) ||
                (horaInicialLuxon <= agendamento.horaInicial && horaFinalLuxon >= agendamento.horaFinal)
            )
        );
        if (agendamentoSobreposto) {
            throw new Error('Já existe uma consulta agendada nesse horário.');
        }
    
        this.agendamentos.push({
            cpf,
            dataConsulta: dataConsultaLuxon,
            horaInicial: horaInicialLuxon,
            horaFinal: horaFinalLuxon
        });
    
        console.log('Agendamento realizado com sucesso!');
    }
    
    cancelarAgendamento(cpf, dataConsulta, horaInicial) {
        const paciente = this.pacientes.find(p => p.cpf === cpf);
        if (!paciente) {
            throw new Error('Paciente não cadastrado.');
        }
    
        const dataConsultaLuxon = DateTime.fromFormat(dataConsulta, 'dd/MM/yyyy');
        if (!dataConsultaLuxon.isValid) {
            throw new Error('Data da consulta inválida.');
        }
    
        const horaInicialLuxon = DateTime.fromFormat(horaInicial, 'HHmm');
        if (!horaInicialLuxon.isValid) {
            throw new Error('Hora inicial inválida.');
        }
    
        const agora = DateTime.now();
        if (
            dataConsultaLuxon < agora.startOf('day') ||
            (dataConsultaLuxon.equals(agora.startOf('day')) && horaInicialLuxon <= agora)
        ) {
            throw new Error('Somente agendamentos futuros podem ser cancelados.');
        }
    
        const index = this.agendamentos.findIndex(agendamento =>
            agendamento.cpf === cpf &&
            agendamento.dataConsulta.equals(dataConsultaLuxon) &&
            agendamento.horaInicial.equals(horaInicialLuxon)
        );
    
        if (index === -1) {
            throw new Error('Agendamento não encontrado.');
        }
    
        this.agendamentos.splice(index, 1);
        console.log('Agendamento cancelado com sucesso!');
    }
    
    listarPacientesComAgendamentos(criterio = 'nome') {
        const pacientesOrdenados = this.pacientes.sort((a, b) =>
            criterio === 'cpf'
                ? a.cpf.localeCompare(b.cpf)
                : a.nome.localeCompare(b.nome)
        );
    
        return pacientesOrdenados.map(paciente => {
            const agendamentoFuturo = this.agendamentos.find(
                agendamento =>
                    agendamento.cpf === paciente.cpf &&
                    agendamento.dataConsulta >= DateTime.now()
            );
            return { paciente, agendamento: agendamentoFuturo || null };
        });
    }
    
    listarAgendaPorPeriodo(dataInicial, dataFinal) {
        let agendamentosFiltrados = this.agendamentos;
    
        if (dataInicial && dataFinal) {
            const dataInicialLuxon = DateTime.fromFormat(dataInicial, 'dd/MM/yyyy');
            const dataFinalLuxon = DateTime.fromFormat(dataFinal, 'dd/MM/yyyy');
    
            if (!dataInicialLuxon.isValid || !dataFinalLuxon.isValid) {
                throw new Error('Datas inválidas.');
            }
    
            agendamentosFiltrados = agendamentosFiltrados.filter(
                agendamento =>
                    agendamento.dataConsulta >= dataInicialLuxon &&
                    agendamento.dataConsulta <= dataFinalLuxon
            );
        }
    
        return agendamentosFiltrados.sort(
            (a, b) =>
                a.dataConsulta - b.dataConsulta ||
                a.horaInicial - b.horaInicial
        );
    }        
}

module.exports = PacienteService;