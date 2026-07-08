// Emplacements photo attendus dans /public/photos/.
// Deux fichiers sont deja fournis par le client (hero-pizza.jpg, neon-sign.jpg) ;
// les autres sont des emplacements a completer — le composant Gallery affiche
// un placeholder soigne tant que le fichier n'existe pas (voir Gallery.astro).

export const galleryImages = [
  { src: '/photos/hero-pizza.jpg', alt: 'Part de pizza Molly Jefferson\'s tiree, fromage filant' },
  { src: '/photos/neon-sign.jpg', alt: 'Decoupe d\'une pizza sous l\'enseigne neon du restaurant' },
  { src: '/photos/galerie-four.jpg', alt: 'Cuisson artisanale en salle' },
  { src: '/photos/galerie-ingredients.jpg', alt: 'Selection d\'ingredients frais' },
  { src: '/photos/galerie-salle.jpg', alt: 'Interieur du restaurant Molly Jefferson\'s Pizza Sannois' },
  { src: '/photos/galerie-emporter.jpg', alt: 'Commande a emporter prete' },
] as const;
