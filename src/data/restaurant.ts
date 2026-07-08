// Coordonnees et informations verifiees du restaurant.
// Source : brief client + carte des prix fournie. Aucune donnee inventee.

export const restaurant = {
  name: "Molly Jefferson's Pizza",
  city: 'Sannois',
  fullName: "Molly Jefferson's Pizza Sannois",
  tagline: "Better Pizza, Better World",
  address: {
    street: '28 Boulevard Charles de Gaulle',
    zip: '95110',
    city: 'Sannois',
    full: '28 Boulevard Charles de Gaulle, 95110 Sannois',
  },
  phone: '01 34 10 10 10',
  phoneHref: 'tel:+33134101010',
  priceRange: '10 € – 20 €',
  services: ['Pizzeria', 'Vente à emporter', 'Pizza artisanale', 'Plats végétariens'],
  hours: [
    { day: 'Lundi', slots: ['11h00 – 14h30', '18h00 – 22h30'] },
    { day: 'Mardi', slots: ['11h00 – 14h30', '18h00 – 22h30'] },
    { day: 'Mercredi', slots: ['11h00 – 14h30', '18h00 – 22h30'] },
    { day: 'Jeudi', slots: ['11h00 – 14h30', '18h00 – 22h30'] },
    { day: 'Vendredi', slots: ['11h00 – 14h30', '18h00 – 22h30'] },
    { day: 'Samedi', slots: ['11h00 – 14h30', '18h00 – 22h30'] },
    { day: 'Dimanche', slots: ['12h00 – 15h00', '18h00 – 22h30'] },
  ],
  mapsQuery: 'https://www.google.com/maps/search/?api=1&query=Molly+Jefferson%27s+Pizza+28+Boulevard+Charles+de+Gaulle+95110+Sannois',
  mapsEmbedQuery: 'Molly Jefferson%27s Pizza, 28 Boulevard Charles de Gaulle, 95110 Sannois',
  googleReviewsUrl: 'https://www.google.com/maps/search/?api=1&query=Molly+Jefferson%27s+Pizza+Sannois',
} as const;

export const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Nos pizzas', href: '/nos-pizzas' },
  { label: 'Notre histoire', href: '/notre-histoire' },
  { label: 'Galerie', href: '/galerie' },
  { label: 'Avis clients', href: '/avis' },
  { label: 'Contact', href: '/contact' },
] as const;
