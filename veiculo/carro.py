from veiculo import Veiculo

class Carro(Veiculo):
    def __init__(self, modelo, marca, qtd_portas):
        super().__init__(modelo,marca)
        self._qtd_portas = qtd_portas
        self.cor = "sem cor"
    
    def __str__(self):
        mensagem =  super().__str__() +  "\nQuantidade de portas: " + self._qtd_portas
        return mensagem

    def ligar(self):
        self.ligado = "Carro ligado"

        