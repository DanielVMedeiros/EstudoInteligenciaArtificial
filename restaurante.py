from avaliacao import Avaliacao
class Restaurante:
    restaurantes = []
    def __init__(self, nome, categoria, cidade, bairro, rua):
        self._nome = nome.title()
        self._categoria = categoria
        self._cidade = cidade
        self._bairro = bairro
        self._rua = rua
        self._avaliacoes = []
        self._ativo = False
        Restaurante.restaurantes.append(self)

    def __str__(self):
        return f"\nNome: {self._nome}\nCategoria: {self._categoria}\nCidade: {self._cidade}\nBairro: {self._bairro}\nRua: {self._rua}\nMédia: {self.media_avaliacao}\nStatus: {self.ativo}\n"
    
    @classmethod
    def listar_restaurantes(cls):
            for restaurante in cls.restaurantes:
                print(restaurante)

    def alterar_estado_restaurante():
        nome_restaurante = input("Digite o nome do restaurante: ")
        restaurante_encontrado = False
        for restaurante in Restaurante.restaurantes:
            if nome_restaurante == restaurante._nome:
                restaurante_encontrado = True
                restaurante._ativo = not restaurante._ativo
                mensagem = f"O restaurante {restaurante._nome} foi ativado com sucesso\n" if restaurante._ativo else f"O restaurante {restaurante._nome} foi desativado com sucesso\n"
                print(mensagem)
        if not restaurante_encontrado:
            print("Restaurante não encontrado\n")

    def receber_avaliacao(self, restaurante, cliente, nota):
         nova_avaliacao = Avaliacao(restaurante, cliente, nota)
         self._avaliacoes.append(nova_avaliacao)


    @property
    def media_avaliacao(self):
         if not self._avaliacoes:
            return "-" 
         soma_avaliacoes = sum(avaliacao.nota for avaliacao in self._avaliacoes)   
         quantidade_avaliacoes = len(self._avaliacoes)    
         media = round(soma_avaliacoes/quantidade_avaliacoes, 1)
         return media 

    @property
    def ativo(self):
         return "✅" if self._ativo else "❎"
    
    
