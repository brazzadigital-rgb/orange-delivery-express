// ============================================================================
// DEMO DATA DEFINITIONS PER STORE TYPE
// Each segment has its own sizes, flavors, addon groups & addons.
// ============================================================================

export interface DemoSizeRow {
  name: string; slices: number; max_flavors: number; base_price: number; sort_order: number;
  is_promo?: boolean; promo_label?: string;
}

export interface DemoFlavorRow {
  name: string; description: string; sort_order: number;
}

export interface DemoAddonGroupRow {
  name: string; max_select: number; min_select: number; group_type: 'single' | 'multi'; sort_order: number;
}

export interface DemoAddonRow {
  groupKey: 'single' | 'multi'; name: string; price: number; sort_order: number;
}

export interface DemoDataSet {
  sizes: DemoSizeRow[];
  flavors: DemoFlavorRow[];
  addonGroups: DemoAddonGroupRow[];
  addons: DemoAddonRow[];
  pricingMode: 'matrix' | 'fixed_by_size' | 'per_item';
  /** Summary bullets shown in the card */
  bullets: string[];
}

// ---- Pizzaria ----
const pizzaria: DemoDataSet = {
  pricingMode: 'matrix',
  bullets: [
    '6 tamanhos de pizza (6 a 20 fatias)',
    '9 sabores populares',
    'Matriz de preços por tamanho',
    '5 opções de borda',
    '6 adicionais extras',
  ],
  sizes: [
    { name: 'Pizza 6 Fatias', slices: 6, max_flavors: 1, base_price: 29.90, sort_order: 1 },
    { name: 'Pizza 8 Fatias', slices: 8, max_flavors: 2, base_price: 39.90, sort_order: 2 },
    { name: 'Pizza 10 Fatias', slices: 10, max_flavors: 2, base_price: 49.90, sort_order: 3, is_promo: true, promo_label: 'PROMOÇÃO' },
    { name: 'Pizza 12 Fatias', slices: 12, max_flavors: 3, base_price: 59.90, sort_order: 4 },
    { name: 'Pizza 16 Fatias', slices: 16, max_flavors: 4, base_price: 79.90, sort_order: 5 },
    { name: 'Hiper 20 Fatias', slices: 20, max_flavors: 5, base_price: 99.90, sort_order: 6 },
  ],
  flavors: [
    { name: 'Abacaxi Nevado', description: 'Abacaxi com creme de leite e queijo mussarela', sort_order: 1 },
    { name: 'Alcatra Barbecue', description: 'Alcatra grelhada com molho barbecue e cebola caramelizada', sort_order: 2 },
    { name: 'Alho e Óleo', description: 'Alho dourado com azeite e queijo parmesão', sort_order: 3 },
    { name: 'Calabresa', description: 'Calabresa fatiada com cebola e azeitona', sort_order: 4 },
    { name: 'Frango com Catupiry', description: 'Frango desfiado com catupiry original', sort_order: 5 },
    { name: 'Quatro Queijos', description: 'Mussarela, provolone, parmesão e gorgonzola', sort_order: 6 },
    { name: 'Pepperoni', description: 'Pepperoni italiano com mussarela', sort_order: 7 },
    { name: 'Portuguesa', description: 'Presunto, ovo, cebola, ervilha e azeitona', sort_order: 8 },
    { name: 'Chocolate com Morango', description: 'Chocolate ao leite com morangos frescos', sort_order: 9 },
  ],
  addonGroups: [
    { name: 'Borda Recheada', max_select: 1, min_select: 0, group_type: 'single', sort_order: 1 },
    { name: 'Quer adicionar algo?', max_select: 10, min_select: 0, group_type: 'multi', sort_order: 2 },
  ],
  addons: [
    { groupKey: 'single', name: 'Borda Cheddar', price: 22, sort_order: 1 },
    { groupKey: 'single', name: 'Borda Chocolate Branco', price: 22, sort_order: 2 },
    { groupKey: 'single', name: 'Borda Chocolate Preto', price: 22, sort_order: 3 },
    { groupKey: 'single', name: 'Borda Dois Amores', price: 22, sort_order: 4 },
    { groupKey: 'single', name: 'Borda Catupiry', price: 22, sort_order: 5 },
    { groupKey: 'multi', name: 'Pimentão', price: 2, sort_order: 1 },
    { groupKey: 'multi', name: 'Frango', price: 6, sort_order: 2 },
    { groupKey: 'multi', name: 'Granulado', price: 4, sort_order: 3 },
    { groupKey: 'multi', name: 'Leite condensado', price: 2, sort_order: 4 },
    { groupKey: 'multi', name: 'Lombo', price: 6, sort_order: 5 },
    { groupKey: 'multi', name: 'Manjericão', price: 2, sort_order: 6 },
  ],
};

// ---- Hamburgueria ----
const hamburgueria: DemoDataSet = {
  pricingMode: 'fixed_by_size',
  bullets: [
    '4 tipos de pão',
    '8 opções de carne/proteína',
    '5 molhos disponíveis',
    '8 adicionais extras',
  ],
  sizes: [
    { name: 'Pão Brioche', slices: 1, max_flavors: 2, base_price: 32.90, sort_order: 1 },
    { name: 'Pão Australiano', slices: 1, max_flavors: 2, base_price: 34.90, sort_order: 2 },
    { name: 'Pão Integral', slices: 1, max_flavors: 2, base_price: 33.90, sort_order: 3 },
    { name: 'Sem Pão (Low Carb)', slices: 1, max_flavors: 2, base_price: 29.90, sort_order: 4, is_promo: true, promo_label: 'FIT' },
  ],
  flavors: [
    { name: 'Smash Burger', description: 'Carne smash 90g com queijo cheddar derretido', sort_order: 1 },
    { name: 'Duplo Smash', description: 'Dois smash burgers 90g com cheddar', sort_order: 2 },
    { name: 'Costela Desfiada', description: 'Costela bovina desfiada e cebola caramelizada', sort_order: 3 },
    { name: 'Frango Crispy', description: 'Peito de frango empanado crocante', sort_order: 4 },
    { name: 'Bacon BBQ', description: 'Carne artesanal 180g com bacon e molho barbecue', sort_order: 5 },
    { name: 'Vegetariano', description: 'Hambúrguer de grão de bico com legumes', sort_order: 6 },
    { name: 'Picanha', description: 'Carne de picanha 200g com queijo provolone', sort_order: 7 },
    { name: 'Pulled Pork', description: 'Porco desfiado com coleslaw e molho agridoce', sort_order: 8 },
  ],
  addonGroups: [
    { name: 'Molho', max_select: 2, min_select: 0, group_type: 'multi', sort_order: 1 },
    { name: 'Adicionais', max_select: 10, min_select: 0, group_type: 'multi', sort_order: 2 },
  ],
  addons: [
    { groupKey: 'single', name: 'Maionese Artesanal', price: 0, sort_order: 1 },
    { groupKey: 'single', name: 'Molho BBQ', price: 0, sort_order: 2 },
    { groupKey: 'single', name: 'Mostarda e Mel', price: 2, sort_order: 3 },
    { groupKey: 'single', name: 'Ranch', price: 2, sort_order: 4 },
    { groupKey: 'single', name: 'Chimichurri', price: 2, sort_order: 5 },
    { groupKey: 'multi', name: 'Bacon Extra', price: 6, sort_order: 1 },
    { groupKey: 'multi', name: 'Ovo', price: 3, sort_order: 2 },
    { groupKey: 'multi', name: 'Cheddar Extra', price: 4, sort_order: 3 },
    { groupKey: 'multi', name: 'Onion Rings (6un)', price: 8, sort_order: 4 },
    { groupKey: 'multi', name: 'Jalapeño', price: 3, sort_order: 5 },
    { groupKey: 'multi', name: 'Cebola Caramelizada', price: 4, sort_order: 6 },
    { groupKey: 'multi', name: 'Salada Extra', price: 2, sort_order: 7 },
    { groupKey: 'multi', name: 'Cogumelos', price: 5, sort_order: 8 },
  ],
};

// ---- Sushi ----
const sushi: DemoDataSet = {
  pricingMode: 'per_item',
  bullets: [
    '5 tamanhos de combo',
    '10 variedades de peças',
    '4 opções de molho',
    '5 acompanhamentos',
  ],
  sizes: [
    { name: 'Combo 15 Peças', slices: 15, max_flavors: 3, base_price: 39.90, sort_order: 1 },
    { name: 'Combo 20 Peças', slices: 20, max_flavors: 4, base_price: 49.90, sort_order: 2 },
    { name: 'Combo 30 Peças', slices: 30, max_flavors: 5, base_price: 69.90, sort_order: 3, is_promo: true, promo_label: 'POPULAR' },
    { name: 'Combo 40 Peças', slices: 40, max_flavors: 6, base_price: 89.90, sort_order: 4 },
    { name: 'Combo Família 60 Peças', slices: 60, max_flavors: 8, base_price: 129.90, sort_order: 5 },
  ],
  flavors: [
    { name: 'Salmão', description: 'Niguiri ou uramaki de salmão fresco', sort_order: 1 },
    { name: 'Atum', description: 'Niguiri de atum fresco', sort_order: 2 },
    { name: 'Camarão', description: 'Hot roll ou uramaki de camarão', sort_order: 3 },
    { name: 'Philadelphia', description: 'Uramaki com cream cheese e salmão', sort_order: 4 },
    { name: 'Skin', description: 'Uramaki com pele de salmão crocante', sort_order: 5 },
    { name: 'Hot Roll', description: 'Rolinho empanado com salmão e cream cheese', sort_order: 6 },
    { name: 'Jyo', description: 'Uramaki especial com molho tarê', sort_order: 7 },
    { name: 'Kani', description: 'Uramaki de kani com pepino', sort_order: 8 },
    { name: 'Vegetariano', description: 'Uramaki de pepino, manga e cenoura', sort_order: 9 },
    { name: 'Temaki Salmão', description: 'Cone de alga com salmão e cream cheese', sort_order: 10 },
  ],
  addonGroups: [
    { name: 'Molhos', max_select: 3, min_select: 0, group_type: 'multi', sort_order: 1 },
    { name: 'Acompanhamentos', max_select: 5, min_select: 0, group_type: 'multi', sort_order: 2 },
  ],
  addons: [
    { groupKey: 'single', name: 'Shoyu', price: 0, sort_order: 1 },
    { groupKey: 'single', name: 'Tarê', price: 0, sort_order: 2 },
    { groupKey: 'single', name: 'Agridoce', price: 0, sort_order: 3 },
    { groupKey: 'single', name: 'Wasabi Extra', price: 2, sort_order: 4 },
    { groupKey: 'multi', name: 'Gengibre Extra', price: 3, sort_order: 1 },
    { groupKey: 'multi', name: 'Guioza (4un)', price: 12, sort_order: 2 },
    { groupKey: 'multi', name: 'Shimeji', price: 8, sort_order: 3 },
    { groupKey: 'multi', name: 'Edamame', price: 10, sort_order: 4 },
    { groupKey: 'multi', name: 'Missoshiru', price: 8, sort_order: 5 },
  ],
};

// ---- Açaí ----
const acai: DemoDataSet = {
  pricingMode: 'fixed_by_size',
  bullets: [
    '5 tamanhos (300ml a 1L)',
    '10 complementos populares',
    '6 coberturas extras',
    '4 frutas frescas',
  ],
  sizes: [
    { name: 'Açaí 300ml', slices: 1, max_flavors: 3, base_price: 14.90, sort_order: 1 },
    { name: 'Açaí 500ml', slices: 1, max_flavors: 4, base_price: 19.90, sort_order: 2, is_promo: true, promo_label: 'MAIS VENDIDO' },
    { name: 'Açaí 700ml', slices: 1, max_flavors: 5, base_price: 24.90, sort_order: 3 },
    { name: 'Açaí 900ml', slices: 1, max_flavors: 6, base_price: 29.90, sort_order: 4 },
    { name: 'Açaí 1 Litro', slices: 1, max_flavors: 7, base_price: 34.90, sort_order: 5 },
  ],
  flavors: [
    { name: 'Granola', description: 'Granola crocante', sort_order: 1 },
    { name: 'Leite em pó', description: 'Leite em pó Ninho', sort_order: 2 },
    { name: 'Banana', description: 'Banana fatiada', sort_order: 3 },
    { name: 'Morango', description: 'Morangos frescos fatiados', sort_order: 4 },
    { name: 'Confete', description: 'Confete de chocolate', sort_order: 5 },
    { name: 'Paçoca', description: 'Paçoca triturada', sort_order: 6 },
    { name: 'Amendoim', description: 'Amendoim torrado', sort_order: 7 },
    { name: 'Castanha', description: 'Castanha de caju triturada', sort_order: 8 },
    { name: 'Aveia', description: 'Flocos de aveia', sort_order: 9 },
    { name: 'Coco Ralado', description: 'Coco ralado seco', sort_order: 10 },
  ],
  addonGroups: [
    { name: 'Coberturas', max_select: 3, min_select: 0, group_type: 'multi', sort_order: 1 },
    { name: 'Frutas Extras', max_select: 4, min_select: 0, group_type: 'multi', sort_order: 2 },
  ],
  addons: [
    { groupKey: 'single', name: 'Leite Condensado', price: 3, sort_order: 1 },
    { groupKey: 'single', name: 'Nutella', price: 5, sort_order: 2 },
    { groupKey: 'single', name: 'Mel', price: 3, sort_order: 3 },
    { groupKey: 'single', name: 'Chocolate Branco', price: 4, sort_order: 4 },
    { groupKey: 'single', name: 'Calda de Morango', price: 3, sort_order: 5 },
    { groupKey: 'single', name: 'Calda de Chocolate', price: 3, sort_order: 6 },
    { groupKey: 'multi', name: 'Kiwi', price: 4, sort_order: 1 },
    { groupKey: 'multi', name: 'Manga', price: 3, sort_order: 2 },
    { groupKey: 'multi', name: 'Uva', price: 4, sort_order: 3 },
    { groupKey: 'multi', name: 'Abacaxi', price: 3, sort_order: 4 },
  ],
};

// ---- Marmitaria ----
const marmitaria: DemoDataSet = {
  pricingMode: 'fixed_by_size',
  bullets: [
    '3 tamanhos de marmita',
    '8 opções de proteína',
    '6 acompanhamentos',
    '4 guarnições extras',
  ],
  sizes: [
    { name: 'Marmita P (400g)', slices: 1, max_flavors: 1, base_price: 18.90, sort_order: 1 },
    { name: 'Marmita M (600g)', slices: 1, max_flavors: 2, base_price: 24.90, sort_order: 2, is_promo: true, promo_label: 'MAIS VENDIDA' },
    { name: 'Marmita G (800g)', slices: 1, max_flavors: 3, base_price: 32.90, sort_order: 3 },
  ],
  flavors: [
    { name: 'Filé de Frango Grelhado', description: 'Peito de frango temperado na chapa', sort_order: 1 },
    { name: 'Bife Acebolado', description: 'Bife bovino com cebolas douradas', sort_order: 2 },
    { name: 'Strogonoff de Frango', description: 'Strogonoff cremoso de frango', sort_order: 3 },
    { name: 'Linguiça Toscana', description: 'Linguiça calabresa toscana grelhada', sort_order: 4 },
    { name: 'Peixe Grelhado', description: 'Filé de tilápia grelhado com ervas', sort_order: 5 },
    { name: 'Frango à Parmegiana', description: 'Filé empanado com molho e queijo', sort_order: 6 },
    { name: 'Carne Moída', description: 'Carne moída refogada com temperos', sort_order: 7 },
    { name: 'Ovo Frito', description: 'Dois ovos fritos (opção econômica)', sort_order: 8 },
  ],
  addonGroups: [
    { name: 'Acompanhamentos', max_select: 3, min_select: 0, group_type: 'multi', sort_order: 1 },
    { name: 'Guarnições Extras', max_select: 4, min_select: 0, group_type: 'multi', sort_order: 2 },
  ],
  addons: [
    { groupKey: 'single', name: 'Arroz Branco', price: 0, sort_order: 1 },
    { groupKey: 'single', name: 'Arroz Integral', price: 2, sort_order: 2 },
    { groupKey: 'single', name: 'Feijão', price: 0, sort_order: 3 },
    { groupKey: 'single', name: 'Feijão Tropeiro', price: 3, sort_order: 4 },
    { groupKey: 'single', name: 'Purê de Batata', price: 3, sort_order: 5 },
    { groupKey: 'single', name: 'Farofa', price: 2, sort_order: 6 },
    { groupKey: 'multi', name: 'Vinagrete', price: 2, sort_order: 1 },
    { groupKey: 'multi', name: 'Batata Frita', price: 5, sort_order: 2 },
    { groupKey: 'multi', name: 'Salada Extra', price: 3, sort_order: 3 },
    { groupKey: 'multi', name: 'Ovo Extra', price: 3, sort_order: 4 },
  ],
};


// ============================================================================
// DEMO PRODUCT / CATEGORY DATA PER STORE TYPE
// ============================================================================

export interface DemoCategoryRow {
  name: string; slug: string; icon?: string; sort_order: number;
}

export interface DemoProductRow {
  categorySlug: string; name: string; description: string; base_price: number;
  promo_price?: number; featured?: boolean; tags?: string[];
}

export interface DemoProductDataSet {
  categories: DemoCategoryRow[];
  products: DemoProductRow[];
  bullets: string[];
}

const pizzariaProducts: DemoProductDataSet = {
  bullets: ['6 categorias', '18 produtos com descrição', 'Combos e bebidas inclusos'],
  categories: [
    { name: 'Pizzas Tradicionais', slug: 'tradicionais', icon: '🍕', sort_order: 1 },
    { name: 'Pizzas Especiais', slug: 'especiais', icon: '⭐', sort_order: 2 },
    { name: 'Pizzas Doces', slug: 'doces', icon: '🍫', sort_order: 3 },
    { name: 'Combos', slug: 'combos', icon: '🎉', sort_order: 4 },
    { name: 'Bebidas', slug: 'bebidas', icon: '🥤', sort_order: 5 },
    { name: 'Sobremesas', slug: 'sobremesas', icon: '🍰', sort_order: 6 },
  ],
  products: [
    { categorySlug: 'tradicionais', name: 'Pizza Calabresa', description: 'Calabresa fatiada, cebola e azeitonas', base_price: 39.90, featured: true },
    { categorySlug: 'tradicionais', name: 'Pizza Mussarela', description: 'Queijo mussarela com orégano', base_price: 34.90 },
    { categorySlug: 'tradicionais', name: 'Pizza Portuguesa', description: 'Presunto, ovo, cebola, ervilha e azeitona', base_price: 42.90 },
    { categorySlug: 'especiais', name: 'Pizza Filé Mignon', description: 'Filé mignon com bacon e catupiry', base_price: 54.90, featured: true },
    { categorySlug: 'especiais', name: 'Pizza Camarão', description: 'Camarão com catupiry e tomate seco', base_price: 59.90 },
    { categorySlug: 'especiais', name: 'Pizza Quatro Queijos', description: 'Mussarela, provolone, parmesão e gorgonzola', base_price: 49.90 },
    { categorySlug: 'doces', name: 'Pizza Chocolate', description: 'Chocolate ao leite com granulado', base_price: 39.90 },
    { categorySlug: 'doces', name: 'Pizza Romeu e Julieta', description: 'Goiabada com queijo minas', base_price: 39.90 },
    { categorySlug: 'combos', name: 'Combo Família', description: '2 pizzas grandes + 1 refrigerante 2L', base_price: 99.90, promo_price: 89.90, featured: true },
    { categorySlug: 'combos', name: 'Combo Casal', description: '1 pizza grande + 1 refrigerante 2L', base_price: 59.90, promo_price: 54.90 },
    { categorySlug: 'bebidas', name: 'Coca-Cola 2L', description: 'Refrigerante Coca-Cola 2 litros', base_price: 12.90 },
    { categorySlug: 'bebidas', name: 'Guaraná 2L', description: 'Guaraná Antarctica 2 litros', base_price: 10.90 },
    { categorySlug: 'bebidas', name: 'Suco Natural', description: 'Suco natural da fruta 500ml', base_price: 8.90 },
    { categorySlug: 'bebidas', name: 'Água Mineral', description: 'Água mineral sem gás 500ml', base_price: 4.90 },
    { categorySlug: 'sobremesas', name: 'Petit Gâteau', description: 'Bolo de chocolate com sorvete', base_price: 18.90 },
    { categorySlug: 'sobremesas', name: 'Churros (3un)', description: 'Churros recheados com doce de leite', base_price: 14.90 },
  ],
};

const hamburgueriaProducts: DemoProductDataSet = {
  bullets: ['5 categorias', '16 produtos populares', 'Combos, porções e bebidas'],
  categories: [
    { name: 'Burgers Clássicos', slug: 'classicos', icon: '🍔', sort_order: 1 },
    { name: 'Burgers Premium', slug: 'premium', icon: '👑', sort_order: 2 },
    { name: 'Combos', slug: 'combos', icon: '🎉', sort_order: 3 },
    { name: 'Porções', slug: 'porcoes', icon: '🍟', sort_order: 4 },
    { name: 'Bebidas', slug: 'bebidas', icon: '🥤', sort_order: 5 },
  ],
  products: [
    { categorySlug: 'classicos', name: 'X-Burger', description: 'Pão, hambúrguer 150g, queijo, alface e tomate', base_price: 22.90, featured: true },
    { categorySlug: 'classicos', name: 'X-Salada', description: 'Pão, hambúrguer 150g, queijo, alface, tomate e maionese', base_price: 25.90 },
    { categorySlug: 'classicos', name: 'X-Bacon', description: 'Pão, hambúrguer 150g, queijo, bacon crocante', base_price: 28.90, featured: true },
    { categorySlug: 'classicos', name: 'X-Egg', description: 'Pão, hambúrguer 150g, queijo, ovo', base_price: 26.90 },
    { categorySlug: 'premium', name: 'Smash Duplo', description: 'Pão brioche, 2 smash burgers, cheddar, cebola caramelizada', base_price: 36.90, featured: true },
    { categorySlug: 'premium', name: 'Costela BBQ', description: 'Pão australiano, costela desfiada, coleslaw, molho BBQ', base_price: 39.90 },
    { categorySlug: 'premium', name: 'Picanha Burger', description: 'Pão brioche, hambúrguer de picanha 200g, provolone', base_price: 42.90 },
    { categorySlug: 'combos', name: 'Combo Clássico', description: 'X-Burger + Batata Frita + Refrigerante', base_price: 39.90, promo_price: 34.90 },
    { categorySlug: 'combos', name: 'Combo Premium', description: 'Smash Duplo + Onion Rings + Milk Shake', base_price: 54.90, promo_price: 49.90 },
    { categorySlug: 'combos', name: 'Combo Família', description: '3 X-Burgers + Batata Grande + 3 Refris', base_price: 89.90, promo_price: 79.90, featured: true },
    { categorySlug: 'porcoes', name: 'Batata Frita', description: 'Batata frita crocante com sal', base_price: 16.90 },
    { categorySlug: 'porcoes', name: 'Onion Rings', description: 'Anéis de cebola empanados (8 un)', base_price: 19.90 },
    { categorySlug: 'porcoes', name: 'Nuggets (10un)', description: 'Nuggets de frango crocantes', base_price: 18.90 },
    { categorySlug: 'bebidas', name: 'Coca-Cola Lata', description: 'Coca-Cola 350ml', base_price: 6.90 },
    { categorySlug: 'bebidas', name: 'Milk Shake', description: 'Milk shake cremoso 400ml', base_price: 14.90 },
    { categorySlug: 'bebidas', name: 'Suco Natural', description: 'Suco natural 300ml', base_price: 9.90 },
  ],
};

const sushiProducts: DemoProductDataSet = {
  bullets: ['5 categorias', '16 produtos japoneses', 'Combos e bebidas inclusos'],
  categories: [
    { name: 'Combinados', slug: 'combinados', icon: '🍱', sort_order: 1 },
    { name: 'Sashimis', slug: 'sashimis', icon: '🐟', sort_order: 2 },
    { name: 'Temakis', slug: 'temakis', icon: '🌯', sort_order: 3 },
    { name: 'Hot Rolls', slug: 'hot-rolls', icon: '🔥', sort_order: 4 },
    { name: 'Bebidas', slug: 'bebidas', icon: '🥤', sort_order: 5 },
  ],
  products: [
    { categorySlug: 'combinados', name: 'Combo 20 Peças', description: '10 uramakis + 5 hot rolls + 5 niguiris', base_price: 49.90, featured: true },
    { categorySlug: 'combinados', name: 'Combo 30 Peças', description: '15 uramakis + 10 hot rolls + 5 sashimis', base_price: 69.90, featured: true },
    { categorySlug: 'combinados', name: 'Combo Família 60 Peças', description: 'Variedade completa para 3-4 pessoas', base_price: 129.90, promo_price: 119.90 },
    { categorySlug: 'sashimis', name: 'Sashimi Salmão (5un)', description: 'Fatias de salmão fresco', base_price: 29.90 },
    { categorySlug: 'sashimis', name: 'Sashimi Atum (5un)', description: 'Fatias de atum fresco', base_price: 34.90 },
    { categorySlug: 'sashimis', name: 'Sashimi Misto (10un)', description: '5 salmão + 5 atum', base_price: 54.90 },
    { categorySlug: 'temakis', name: 'Temaki Salmão', description: 'Salmão, cream cheese e cebolinha', base_price: 24.90, featured: true },
    { categorySlug: 'temakis', name: 'Temaki Camarão', description: 'Camarão empanado com cream cheese', base_price: 26.90 },
    { categorySlug: 'temakis', name: 'Temaki Skin', description: 'Pele de salmão crocante com cream cheese', base_price: 22.90 },
    { categorySlug: 'hot-rolls', name: 'Hot Philadelphia (8un)', description: 'Salmão e cream cheese empanado', base_price: 28.90 },
    { categorySlug: 'hot-rolls', name: 'Hot Camarão (8un)', description: 'Camarão e cream cheese empanado', base_price: 32.90 },
    { categorySlug: 'hot-rolls', name: 'Hot Banana (8un)', description: 'Banana com chocolate e cream cheese', base_price: 24.90 },
    { categorySlug: 'bebidas', name: 'Chá Gelado', description: 'Chá verde ou preto gelado 500ml', base_price: 8.90 },
    { categorySlug: 'bebidas', name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Sprite', base_price: 6.90 },
    { categorySlug: 'bebidas', name: 'Saquê', description: 'Saquê quente ou frio 180ml', base_price: 18.90 },
    { categorySlug: 'bebidas', name: 'Água Mineral', description: 'Água mineral 500ml', base_price: 4.90 },
  ],
};

const acaiProducts: DemoProductDataSet = {
  bullets: ['4 categorias', '14 produtos de açaí e cremes', 'Combos e bebidas inclusos'],
  categories: [
    { name: 'Açaí Tradicional', slug: 'acai-tradicional', icon: '🍇', sort_order: 1 },
    { name: 'Açaí Premium', slug: 'acai-premium', icon: '👑', sort_order: 2 },
    { name: 'Cremes & Taças', slug: 'cremes', icon: '🍨', sort_order: 3 },
    { name: 'Bebidas', slug: 'bebidas', icon: '🥤', sort_order: 4 },
  ],
  products: [
    { categorySlug: 'acai-tradicional', name: 'Açaí 300ml', description: 'Açaí batido com banana + 3 complementos', base_price: 14.90 },
    { categorySlug: 'acai-tradicional', name: 'Açaí 500ml', description: 'Açaí batido com banana + 4 complementos', base_price: 19.90, featured: true },
    { categorySlug: 'acai-tradicional', name: 'Açaí 700ml', description: 'Açaí batido com banana + 5 complementos', base_price: 24.90 },
    { categorySlug: 'acai-tradicional', name: 'Açaí 1 Litro', description: 'Ideal para compartilhar + 7 complementos', base_price: 34.90 },
    { categorySlug: 'acai-premium', name: 'Açaí Nutella 500ml', description: 'Açaí com Nutella, morango e leite em pó', base_price: 28.90, featured: true },
    { categorySlug: 'acai-premium', name: 'Açaí Ninho 500ml', description: 'Açaí com leite ninho, granola e banana', base_price: 26.90 },
    { categorySlug: 'acai-premium', name: 'Açaí Tropical 700ml', description: 'Açaí com manga, kiwi e granola', base_price: 32.90, promo_price: 29.90 },
    { categorySlug: 'cremes', name: 'Taça de Cupuaçu', description: 'Creme de cupuaçu com complementos', base_price: 18.90 },
    { categorySlug: 'cremes', name: 'Taça de Pitaya', description: 'Creme de pitaya rosa com granola', base_price: 22.90 },
    { categorySlug: 'cremes', name: 'Vitamina de Açaí', description: 'Açaí batido com leite e banana 400ml', base_price: 12.90 },
    { categorySlug: 'bebidas', name: 'Água de Coco', description: 'Água de coco natural 300ml', base_price: 6.90 },
    { categorySlug: 'bebidas', name: 'Suco Detox', description: 'Couve, limão, gengibre e maçã', base_price: 10.90 },
    { categorySlug: 'bebidas', name: 'Smoothie de Frutas', description: 'Mix de frutas vermelhas 400ml', base_price: 14.90 },
    { categorySlug: 'bebidas', name: 'Água Mineral', description: 'Água mineral 500ml', base_price: 4.90 },
  ],
};

const marmitariaProducts: DemoProductDataSet = {
  bullets: ['5 categorias', '16 pratos e porções', 'Marmitas, executivos e bebidas'],
  categories: [
    { name: 'Marmitas', slug: 'marmitas', icon: '🍱', sort_order: 1 },
    { name: 'Pratos Executivos', slug: 'executivos', icon: '🍽️', sort_order: 2 },
    { name: 'Porções', slug: 'porcoes', icon: '🥗', sort_order: 3 },
    { name: 'Sobremesas', slug: 'sobremesas', icon: '🍮', sort_order: 4 },
    { name: 'Bebidas', slug: 'bebidas', icon: '🥤', sort_order: 5 },
  ],
  products: [
    { categorySlug: 'marmitas', name: 'Marmita Frango Grelhado', description: 'Arroz, feijão, salada e frango grelhado', base_price: 18.90, featured: true },
    { categorySlug: 'marmitas', name: 'Marmita Bife Acebolado', description: 'Arroz, feijão, salada e bife acebolado', base_price: 22.90 },
    { categorySlug: 'marmitas', name: 'Marmita Strogonoff', description: 'Arroz, batata palha e strogonoff de frango', base_price: 24.90, featured: true },
    { categorySlug: 'marmitas', name: 'Marmita Parmegiana', description: 'Arroz, purê e filé à parmegiana', base_price: 26.90 },
    { categorySlug: 'executivos', name: 'Executivo Picanha', description: 'Picanha grelhada, arroz, feijão tropeiro e vinagrete', base_price: 34.90, featured: true },
    { categorySlug: 'executivos', name: 'Executivo Salmão', description: 'Salmão grelhado, arroz integral e legumes', base_price: 38.90 },
    { categorySlug: 'executivos', name: 'Executivo Fit', description: 'Frango grelhado, batata doce e brócolis', base_price: 28.90, promo_price: 24.90 },
    { categorySlug: 'porcoes', name: 'Porção de Fritas', description: 'Batata frita crocante 300g', base_price: 14.90 },
    { categorySlug: 'porcoes', name: 'Salada Caesar', description: 'Alface, croutons, parmesão e molho caesar', base_price: 16.90 },
    { categorySlug: 'porcoes', name: 'Arroz Carreteiro', description: 'Arroz com carne seca e temperos 400g', base_price: 19.90 },
    { categorySlug: 'sobremesas', name: 'Pudim', description: 'Pudim de leite condensado', base_price: 8.90 },
    { categorySlug: 'sobremesas', name: 'Mousse de Maracujá', description: 'Mousse cremoso de maracujá', base_price: 9.90 },
    { categorySlug: 'bebidas', name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Fanta', base_price: 5.90 },
    { categorySlug: 'bebidas', name: 'Suco Natural', description: 'Laranja, limão ou abacaxi 300ml', base_price: 7.90 },
    { categorySlug: 'bebidas', name: 'Água Mineral', description: 'Água mineral 500ml', base_price: 3.90 },
    { categorySlug: 'bebidas', name: 'Café', description: 'Café espresso ou com leite', base_price: 5.90 },
  ],
};

// ---- Map ----
const DEMO_DATA_MAP: Record<string, DemoDataSet> = {
  pizzaria,
  hamburgueria,
  sushi,
  acai,
  marmitaria,
};

const DEMO_PRODUCT_MAP: Record<string, DemoProductDataSet> = {
  pizzaria: pizzariaProducts,
  hamburgueria: hamburgueriaProducts,
  sushi: sushiProducts,
  acai: acaiProducts,
  marmitaria: marmitariaProducts,
};

export function getDemoDataForSegment(storeType: string | null | undefined): DemoDataSet {
  if (!storeType) return pizzaria;
  return DEMO_DATA_MAP[storeType] || pizzaria;
}

export function getDemoProductsForSegment(storeType: string | null | undefined): DemoProductDataSet {
  if (!storeType) return pizzariaProducts;
  return DEMO_PRODUCT_MAP[storeType] || pizzariaProducts;
}
