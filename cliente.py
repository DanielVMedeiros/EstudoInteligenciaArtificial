class Cliente:
    clientes = []
    def __init__(self, nome, telefone, email, cep ):
        self.nome = nome 
        self.telefone = telefone 
        self.email = email 
        self.cep = cep 
        Cliente.clientes.append(self)

    def __str__(self):
        return f"Nome: {self.nome}\ntelefone: {self.telefone}\nemail: {self.email}\ncep: {self.cep}\n"
    
    def listar_clientes():
        for cliente in Cliente.clientes:
            print(cliente)

cliente_nome = Cliente("Daniel", "010101010", "etet@teste.com", "010213023")
cliente_nome = Cliente("Antonio", "01121233", "Minb@teste.com", "133131231")
