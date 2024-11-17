const { DateTime } = require('luxon');

class Validacao {
    static validarCPF(cpf) {
        if (!/^\d{11}$/.test(cpf)) return false;

        if (/^(\d)\1{10}$/.test(cpf)) return false;

        const calcDigito = (cpf, pesoInicial) => {
            let soma = 0;
            for (let i = 0; i < pesoInicial - 1; i++) {
                soma += cpf[i] * (pesoInicial - i);
            }
            const resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        };

        const cpfNumeros = cpf.split('').map(Number);
        const primeiroDigito = calcDigito(cpfNumeros, 10);
        const segundoDigito = calcDigito(cpfNumeros, 11);

        return (
            primeiroDigito === cpfNumeros[9] &&
            segundoDigito === cpfNumeros[10]
        );
    }

    static validarNome(nome) {
        return nome.length >= 5;
    }

    static validarDataNascimento(dataStr) {
        const data = DateTime.fromFormat(dataStr, 'dd/MM/yyyy');
        return data.isValid ? data : null;
    }

    static validarIdade(dataNascimento, idadeMinima = 13) {
        const hoje = DateTime.now();
        const idade = Math.floor(hoje.diff(dataNascimento, 'years').years);
        return idade >= idadeMinima;
    }
}

module.exports = Validacao;
