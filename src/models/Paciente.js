const { DateTime } = require('luxon');

class Paciente {
    constructor(cpf, nome, dataNascimento) {
        this.cpf = cpf;
        this.nome = nome;
        this.dataNascimento = dataNascimento;
    }

    get idade() {
        const hoje = DateTime.now();
        return Math.floor(hoje.diff(this.dataNascimento, 'years').years);
    }
}

module.exports = Paciente;