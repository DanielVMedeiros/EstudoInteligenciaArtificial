from abc import ABC, abstractmethod


class Veiculo:
    def __init__(self, modelo, marca):
        self._modelo = modelo
        self._marca = marca
        self.ligado = "Veiculo Desligado"

    def __str__(self):
        mensagem = "Nome da Marca: " + self._marca + "\nNome do Modelo: " + self._modelo + "\nEstado Veículo:" + self.ligado 
        return mensagem 
    
    @abstractmethod
    def ligar(self):
        self.ligado = "Veiculo ligado"

   