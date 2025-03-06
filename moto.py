from veiculo import Veiculo

class Moto(Veiculo):
    def __init__(self, modelo, marca, tipo_moto):
        super().__init__(modelo,marca)
        self._tipo_moto = tipo_moto
    
    def __str__(self):
        mensagem = super().__str__() + "\nTipo da Moto: " + self._tipo_moto
        return mensagem

    def ligar(self):
        self.ligado = "Moto ligada"