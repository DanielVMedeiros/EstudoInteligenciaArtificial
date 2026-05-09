export type MenuView = "search" | "upload";

interface MainMenuProps {
  onSelect: (view: MenuView) => void;
}

const OPTIONS: { view: MenuView; title: string; description: string }[] = [
  {
    view: "search",
    title: "Buscar receitas",
    description: "Pergunte em linguagem natural e receba sugestões com citações.",
  },
  {
    view: "upload",
    title: "Cadastrar receitas",
    description: "Envie um CSV para ampliar o acervo disponível para busca.",
  },
];

export default function MainMenu({ onSelect }: MainMenuProps) {
  return (
    <section className="card menu">
      <h2>O que você quer fazer?</h2>
      <div className="menu-grid">
        {OPTIONS.map((option) => (
          <button
            key={option.view}
            type="button"
            className="menu-card"
            onClick={() => onSelect(option.view)}
          >
            <h2>{option.title}</h2>
            <p>{option.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
