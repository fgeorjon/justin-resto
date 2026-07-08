// Carte transcrite fidelement depuis la carte des prix fournie par le client.
// Prix en euros, format [medium, large]. Aucun plat ni prix invente.

export interface Pizza {
  name: string;
  description: string;
  priceMedium: number;
  priceLarge: number;
  /** Mise en avant sur la page "Nos pizzas" */
  featured?: boolean;
}

export interface PizzaTier {
  title: string;
  pizzas: Pizza[];
}

export const doughChoices = [
  { name: 'Classic', description: 'Pâte moelleuse et généreuse' },
  { name: 'Fine', description: 'Pâte croustillante et légère' },
  { name: 'Pan', description: "Pâte à l'américaine, cuite dans son moule", supplement: { medium: 1.6, large: 3 } },
];

export const pizzaTiers: PizzaTier[] = [
  {
    title: 'Les Essentielles',
    pizzas: [
      { name: 'Margherita', description: 'Sauce tomate, double mozzarella', priceMedium: 12.9, priceLarge: 16.9, featured: true },
      { name: 'Veggie', description: 'Sauce tomate, mozzarella, champignons, poivrons, tomates fraîches, origan', priceMedium: 14.9, priceLarge: 20.9 },
      { name: 'Funny Tuna', description: 'Sauce tomate, mozzarella, thon, oignons, olives, filet de crème fraîche légère', priceMedium: 14.9, priceLarge: 20.9 },
      { name: 'Cheese & Cheese', description: 'Sauce tomate, mozzarella, chèvre, emmental, gorgonzola, filet de crème fraîche légère', priceMedium: 14.9, priceLarge: 20.9 },
      { name: 'Queen', description: 'Sauce tomate, double jambon, champignons', priceMedium: 14.9, priceLarge: 20.9 },
      { name: 'Hawaïenne', description: "Sauce tomate, mozzarella, double jambon, morceaux d'ananas", priceMedium: 14.9, priceLarge: 20.9 },
      { name: 'Little Italy', description: 'Sauce tomate, mozzarella, anchois, olives', priceMedium: 14.9, priceLarge: 20.9 },
    ],
  },
  {
    title: 'Les Généreuses',
    pizzas: [
      { name: 'Deluxe', description: 'Sauce tomate, mozzarella, pepperoni, jambon, champignons, viande hachée épicée, oignons, poivrons, olives', priceMedium: 15.9, priceLarge: 21.9, featured: true },
      { name: 'Bombay', description: 'Crème fraîche légère, mozzarella, poulet rôti, emmental, oignons frits, champignons, filet de sauce curry', priceMedium: 15.9, priceLarge: 21.9 },
      { name: 'Chicken Kentucky', description: 'Sauce tomate, mozzarella, poulet rôti, maïs, oignons frits', priceMedium: 15.9, priceLarge: 21.9 },
      { name: 'Orientale', description: 'Sauce tomate, mozzarella, merguez, oignons, poivrons, olives', priceMedium: 15.9, priceLarge: 21.9 },
      { name: "Molly's BBQ", description: 'Sauce barbecue, mozzarella, poulet rôti, viande hachée, merguez', priceMedium: 15.9, priceLarge: 21.9, featured: true },
      { name: 'Country', description: 'Sauce tomate, mozzarella, double viande hachée, lardons, persillade, pommes de terre', priceMedium: 15.9, priceLarge: 21.9 },
      { name: 'Campione', description: 'Sauce tomate, mozzarella, double viande hachée, champignons', priceMedium: 15.9, priceLarge: 21.9 },
    ],
  },
  {
    title: 'Les Signatures',
    pizzas: [
      { name: 'Miss Saumon', description: 'Crème fraîche légère, mozzarella, saumon fumé, pommes de terre', priceMedium: 16.9, priceLarge: 22.9, featured: true },
      { name: 'Spicy Hot', description: 'Sauce tomate, mozzarella, double viande hachée, merguez, piments verts, oignons', priceMedium: 16.9, priceLarge: 22.9 },
      { name: 'Louisiane', description: 'Sauce tomate, mozzarella, pepperoni, poulet, emmental, oignons frits, tomates fraîches', priceMedium: 16.9, priceLarge: 22.9 },
      { name: 'Canadian Bacon', description: 'Sauce tomate, mozzarella, bacon, poulet rôti, oignons frits, filet de sauce BBQ', priceMedium: 16.9, priceLarge: 22.9 },
      { name: 'Savoyarde', description: 'Crème fraîche légère, mozzarella, lardons, reblochon, pommes de terre', priceMedium: 16.9, priceLarge: 22.9 },
      { name: 'Sixties', description: 'Sauce tomate, mozzarella, merguez, poulet rôti, chèvre, champignons, filet de crème fraîche légère', priceMedium: 16.9, priceLarge: 22.9 },
      { name: 'Nabab Kebab', description: 'Sauce tomate, mozzarella, kebab de volaille rôtie, poivrons, oignons, filet de sauce curry', priceMedium: 16.9, priceLarge: 22.9 },
      { name: "Charlie's One", description: 'Sauce tomate, mozzarella, sauce barbecue, oignons frits, viande hachée épicée, champignons', priceMedium: 16.9, priceLarge: 22.9 },
      { name: 'Suprême', description: 'Sauce tomate, mozzarella, jambon, double lardon, champignons, pommes de terre, origan', priceMedium: 16.9, priceLarge: 22.9 },
      { name: 'Ocean Dream', description: 'Crème fraîche légère, mozzarella, cocktail de fruits de mer, persillade, citron', priceMedium: 16.9, priceLarge: 22.9, featured: true },
      { name: 'La Carioca', description: 'Crème fraîche, mozzarella, sauce Do Brazil, poulet frit, poivrons, oignons rouges', priceMedium: 16.9, priceLarge: 22.9 },
    ],
  },
];

export const extraToppings = {
  priceMedium: 1.5,
  priceLarge: 2,
  items: [
    'Champignons', 'Oignons', 'Olives', 'Poivrons', 'Pommes de terre', 'Piments verts',
    'Saumon', 'Thon', 'Anchois', 'Fruits de mer', 'Jambon', 'Poulet rôti', 'Pepperoni',
    'Viande hachée épicée', 'Merguez', 'Lardons', 'Kebab', 'Mozzarella', 'Chèvre',
    'Emmental', 'Gorgonzola', 'Reblochon', 'Raclette', 'Crème fraîche',
    "Morceaux d'ananas", 'Oignons rouges', 'Sauce Do Brazil',
  ],
};

export const promotions = [
  {
    title: 'Lundi & Mardi Futés',
    description: 'Toutes les pizzas, toutes les tailles, à emporter.',
    highlight: '8,99 €',
  },
  {
    title: 'Du mercredi au dimanche',
    description: '1 pizza achetée = 1 pizza offerte, à emporter.',
    highlight: '1 = 1',
    fineprint: "Offre non cumulable, pour l'achat d'une pizza de prix égal ou supérieur, valable uniquement à emporter, à préciser lors de la commande.",
  },
];
