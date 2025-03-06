import os

restaurantes = [{"nome":"McBurguer", "categoria":"Fast Food", "ativo":False},{"nome":"Japinha", "categoria":"Japonês", "ativo":True},{"nome":"Burguer Donalds", "categoria":"Fast Food", "ativo":False}]

def encerrar_app():
  limpar_exibir("programa encerrado")

def listar_restaurantes():
  limpar_exibir("-----------Lista de restaurantes cadastrados no aplicativo-----------\n")
  print(f"Nome do restaurante - Categoria do restaurante - Status do restaurante \n")
  for restaurante in restaurantes:
      nome_restaurante = restaurante["nome"]
      categoria_restaurante = restaurante["categoria"]
      status = "Ativado" if restaurante["ativo"] else "Desativado"
      print(f"{nome_restaurante} - {categoria_restaurante} - {status} \n")
  voltar()

def cadastrar_restaurante():
  limpar_exibir("-----------Bem vindo ao cadastro de novos restaurantes-----------\n")
  nome_restaurante = input("Digite o nome do restaurante: ")
  categoria_restaurante = input(f"Digite a categoria do restaurante {nome_restaurante}: ")
  dados_restaurante = {"nome":nome_restaurante, "categoria":categoria_restaurante, "ativo": False}
  restaurantes.append(dados_restaurante)
  input(f"Restaurante {nome_restaurante} adicionado com sucesso!!!")
  voltar()

def alterar_estado_restaurante():
  limpar_exibir("-----------Área para alterar status do restaurante-----------\n")
  nome_restaurante = input("Digite o nome do restaurante: ")
  restaurante_encontrado = False
  for restaurante in restaurantes:
       if nome_restaurante == restaurante["nome"]:
           restaurante_encontrado = True
           restaurante["ativo"] = not restaurante["ativo"]
           mensagem = f"O restaurante {nome_restaurante} foi ativado com sucesso\n" if restaurante["ativo"] == True else f"O restaurante {nome_restaurante} foi desativado com sucesso\n"
           print(mensagem)
  if not restaurante_encontrado:
       print("Restaurante não encontrado\n")
  voltar()


def escolha_errada():
  input("Opção incorreta, digite uma tecla para voltar ao menu principal")
  voltar()

def voltar():
  input("\nAperte um botão para voltar ao menu")
  main()

#Função para limpar tela e exibir mensagem
def limpar_exibir(texto):
  os.system("cls")
  print(texto)
     
def exibir_nome():
  print("""

      ██████╗░███████╗██╗░░░░░██╗██╗░░░██╗███████╗██████╗░██╗░░░██╗
      ██╔══██╗██╔════╝██║░░░░░██║██║░░░██║██╔════╝██╔══██╗╚██╗░██╔╝
      ██║░░██║█████╗░░██║░░░░░██║╚██╗░██╔╝█████╗░░██████╔╝░╚████╔╝░
      ██║░░██║██╔══╝░░██║░░░░░██║░╚████╔╝░██╔══╝░░██╔══██╗░░╚██╔╝░░
      ██████╔╝███████╗███████╗██║░░╚██╔╝░░███████╗██║░░██║░░░██║░░░
      ╚═════╝░╚══════╝╚══════╝╚═╝░░░╚═╝░░░╚══════╝╚═╝░░╚═╝░░░╚═╝░░░
            
  """)

def exibir_opcoes():
  print("""
  1 - Cadastrar restaurante
  2 - Listar restaurantes
  3 - Ativar restaurante
  4 - Sair do sistema
  """ )

def selecionar_opcoes():
  try:
      opcao_escolhida = int(input("Selecione uma opção: "))   
      match opcao_escolhida:
            case 1:
                  cadastrar_restaurante()
            case 2:
                  listar_restaurantes()
            case 3:
                  alterar_estado_restaurante()
            case 4:
                  encerrar_app()
            case _:
                  escolha_errada()
  except:
      escolha_errada()
                
def main():
   os.system("cls")
   exibir_nome()
   exibir_opcoes()
   selecionar_opcoes()

if __name__ == "__main__":
  main()