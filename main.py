from carro import Carro
from moto import Moto

def main():
   moto1 = Moto("Teste", "MERCEDES", "Casual")
   carro1 = Carro("Teste", "Mercedes", "7")

   moto1.ligar()
   carro1.ligar()
   print(moto1)
   print(carro1)

if __name__ == "__main__":
  main()