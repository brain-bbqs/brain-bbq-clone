
INSERT INTO public.species (name, common_name, taxonomy_class, taxonomy_order, taxonomy_family, taxonomy_genus) VALUES
  ('Mouse', 'House Mouse', 'Mammalia', 'Rodentia', 'Muridae', 'Mus'),
  ('Rat', 'Brown Rat', 'Mammalia', 'Rodentia', 'Muridae', 'Rattus'),
  ('Human', 'Human', 'Mammalia', 'Primates', 'Hominidae', 'Homo'),
  ('Marmoset', 'Common Marmoset', 'Mammalia', 'Primates', 'Callitrichidae', 'Callithrix'),
  ('Capuchin Monkey', 'White-faced Capuchin', 'Mammalia', 'Primates', 'Cebidae', 'Cebus'),
  ('Ferret', 'Domestic Ferret', 'Mammalia', 'Carnivora', 'Mustelidae', 'Mustela'),
  ('Sheep', 'Domestic Sheep', 'Mammalia', 'Artiodactyla', 'Bovidae', 'Ovis'),
  ('Gerbil', 'Mongolian Gerbil', 'Mammalia', 'Rodentia', 'Muridae', 'Meriones'),
  ('Cowbird', 'Brown-headed Cowbird', 'Aves', 'Passeriformes', 'Icteridae', 'Molothrus'),
  ('Cichlid', 'Cichlid Fish', 'Actinopterygii', 'Cichliformes', 'Cichlidae', NULL),
  ('Zebrafish', 'Zebrafish', 'Actinopterygii', 'Cypriniformes', 'Danionidae', 'Danio'),
  ('Drosophila', 'Fruit Fly', 'Insecta', 'Diptera', 'Drosophilidae', 'Drosophila'),
  ('Cricket', 'Cricket', 'Insecta', 'Orthoptera', 'Gryllidae', NULL),
  ('Acoel Worm', 'Acoel Flatworm', 'Acoela', 'Acoela', NULL, NULL)
ON CONFLICT (name) DO UPDATE SET
  common_name = EXCLUDED.common_name,
  taxonomy_class = EXCLUDED.taxonomy_class,
  taxonomy_order = EXCLUDED.taxonomy_order,
  taxonomy_family = EXCLUDED.taxonomy_family,
  taxonomy_genus = EXCLUDED.taxonomy_genus;
