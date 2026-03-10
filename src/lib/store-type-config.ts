// ============================================================================
// STORE TYPE CONFIGURATION MAP
// Centralised labels, emojis, CTAs and section titles per business type.
// ============================================================================

export interface BuilderLabels {
  /** Main title e.g. "Monte sua Pizza" */
  title: string;
  subtitle: string;
  emoji: string;
  route: string;
  steps: string[];
  /** Page-level labels for the 3-step builder */
  step1: { heading: string; subtitle: string; emptyTitle: string; emptyDesc: string; itemUnit: string };
  step2: { heading: string; subtitle: (max: number) => string; searchPlaceholder: string; selectedUnit: string };
  step3: { heading: string; cartLabel: string };
  /** Cart item label prefix */
  cartPrefix: string;
  /** Admin-specific labels */
  admin: {
    pageTitle: string;
    sidebarLabel: string;
    iconName: 'Pizza' | 'Beef' | 'Fish' | 'Cherry' | 'Soup' | 'UtensilsCrossed';
    navTabs: [string, string, string, string, string];
    demoCardDesc: string;
    /** Labels for the "sizes" form/dialog */
    sizeForm: {
      dialogTitle: string;
      dialogTitleEdit: string;
      namePlaceholder: string;
      slicesLabel: string;
      maxFlavorsLabel: string;
      newButton: string;
    };
  };
}

export interface StoreTypeConfig {
  label: string;
  emoji: string;
  builder: BuilderLabels | null;
  sections: {
    featured: string;
    promos: string;
    beverages: string;
    allProducts: string;
  };
  productFallbackEmoji: string;
}

// Helper to build a full BuilderLabels object concisely
function makeBuilder(opts: {
  title: string; subtitle: string; emoji: string; route: string; steps: [string, string, string];
  step1Heading: string; step1Subtitle: string; emptyTitle: string; emptyDesc: string; itemUnit: string;
  step2Heading: string; step2Subtitle: (max: number) => string; searchPlaceholder: string; selectedUnit: string;
  step3Heading: string; cartLabel: string; cartPrefix: string;
  adminPageTitle: string; adminSidebarLabel: string; adminIconName: BuilderLabels['admin']['iconName']; adminNavTabs: [string, string, string, string, string]; adminDemoDesc: string;
  sizeForm: BuilderLabels['admin']['sizeForm'];
}): BuilderLabels {
  return {
    title: opts.title,
    subtitle: opts.subtitle,
    emoji: opts.emoji,
    route: opts.route,
    steps: opts.steps,
    step1: { heading: opts.step1Heading, subtitle: opts.step1Subtitle, emptyTitle: opts.emptyTitle, emptyDesc: opts.emptyDesc, itemUnit: opts.itemUnit },
    step2: { heading: opts.step2Heading, subtitle: opts.step2Subtitle, searchPlaceholder: opts.searchPlaceholder, selectedUnit: opts.selectedUnit },
    step3: { heading: opts.step3Heading, cartLabel: opts.cartLabel },
    cartPrefix: opts.cartPrefix,
    admin: { pageTitle: opts.adminPageTitle, sidebarLabel: opts.adminSidebarLabel, iconName: opts.adminIconName, navTabs: opts.adminNavTabs, demoCardDesc: opts.adminDemoDesc, sizeForm: opts.sizeForm },
  };
}

const STORE_TYPE_CONFIGS: Record<string, StoreTypeConfig> = {
  pizzaria: {
    label: 'Pizzaria',
    emoji: '🍕',
    builder: makeBuilder({
      title: 'Monte sua Pizza', subtitle: 'Do seu jeito', emoji: '🍕', route: '/app/pizza',
      steps: ['Tamanho', 'Sabores', 'Extras'],
      step1Heading: 'Monte sua Pizza', step1Subtitle: 'Escolha o tamanho', emptyTitle: 'Nenhum tamanho disponível', emptyDesc: 'Configure os tamanhos no painel administrativo.', itemUnit: 'sabor',
      step2Heading: '', step2Subtitle: (max) => `Selecione até ${max} ${max === 1 ? 'sabor' : 'sabores'}`, searchPlaceholder: 'Pesquisar sabor', selectedUnit: 'sabor',
      step3Heading: 'Adicionais e observações', cartLabel: 'Pizza', cartPrefix: 'Pizza',
      adminPageTitle: 'Pizza Builder', adminSidebarLabel: 'Pizza Builder', adminIconName: 'Pizza',
      adminNavTabs: ['Configurações', 'Tamanhos', 'Sabores', 'Preços', 'Adicionais'],
      adminDemoDesc: 'Crie dados de exemplo para testar o Pizza Builder',
      sizeForm: { dialogTitle: 'Novo tamanho', dialogTitleEdit: 'Editar tamanho', namePlaceholder: 'Ex: Pizza 12 Fatias', slicesLabel: 'Fatias', maxFlavorsLabel: 'Máx sabores', newButton: 'Novo tamanho' },
    }),
    sections: { featured: '🔥 Mais Vendidas', promos: '💸 Promoções', beverages: '🥤 Bebidas', allProducts: '🍕 Todas as Pizzas' },
    productFallbackEmoji: '🍕',
  },
  hamburgueria: {
    label: 'Hamburgueria',
    emoji: '🍔',
    builder: makeBuilder({
      title: 'Monte seu Burger', subtitle: 'Escolha cada ingrediente', emoji: '🍔', route: '/app/pizza',
      steps: ['Pão', 'Carne', 'Adicionais'],
      step1Heading: 'Monte seu Burger', step1Subtitle: 'Escolha o tipo de pão', emptyTitle: 'Nenhum tipo disponível', emptyDesc: 'Configure os tipos no painel administrativo.', itemUnit: 'opção',
      step2Heading: '', step2Subtitle: (max) => `Selecione até ${max} ${max === 1 ? 'opção' : 'opções'}`, searchPlaceholder: 'Pesquisar ingrediente', selectedUnit: 'ingrediente',
      step3Heading: 'Adicionais e observações', cartLabel: 'Burger', cartPrefix: 'Burger',
      adminPageTitle: 'Burger Builder', adminSidebarLabel: 'Burger Builder', adminIconName: 'Beef',
      adminNavTabs: ['Configurações', 'Tipos de Pão', 'Carnes', 'Preços', 'Adicionais'],
      adminDemoDesc: 'Crie dados de exemplo para testar o Burger Builder',
      sizeForm: { dialogTitle: 'Novo tipo', dialogTitleEdit: 'Editar tipo', namePlaceholder: 'Ex: Pão Brioche', slicesLabel: 'Porções', maxFlavorsLabel: 'Máx opções', newButton: 'Novo tipo' },
    }),
    sections: { featured: '🔥 Mais Pedidos', promos: '💸 Promoções', beverages: '🥤 Bebidas', allProducts: '🍔 Todos os Burgers' },
    productFallbackEmoji: '🍔',
  },
  sushi: {
    label: 'Sushi',
    emoji: '🍣',
    builder: makeBuilder({
      title: 'Monte seu Combo', subtitle: 'Escolha suas peças', emoji: '🍣', route: '/app/pizza',
      steps: ['Peças', 'Extras', 'Molhos'],
      step1Heading: 'Monte seu Combo', step1Subtitle: 'Escolha o tamanho do combo', emptyTitle: 'Nenhum combo disponível', emptyDesc: 'Configure os combos no painel administrativo.', itemUnit: 'variedade',
      step2Heading: '', step2Subtitle: (max) => `Selecione até ${max} ${max === 1 ? 'variedade' : 'variedades'}`, searchPlaceholder: 'Pesquisar peça', selectedUnit: 'variedade',
      step3Heading: 'Molhos e observações', cartLabel: 'Combo Sushi', cartPrefix: 'Combo',
      adminPageTitle: 'Combo Builder', adminSidebarLabel: 'Combo Builder', adminIconName: 'Fish',
      adminNavTabs: ['Configurações', 'Combos', 'Variedades', 'Preços', 'Molhos'],
      adminDemoDesc: 'Crie dados de exemplo para testar o Combo Builder',
      sizeForm: { dialogTitle: 'Novo combo', dialogTitleEdit: 'Editar combo', namePlaceholder: 'Ex: Combo 30 peças', slicesLabel: 'Peças', maxFlavorsLabel: 'Máx variedades', newButton: 'Novo combo' },
    }),
    sections: { featured: '🔥 Mais Pedidos', promos: '💸 Promoções', beverages: '🥤 Bebidas', allProducts: '🍣 Todo o Cardápio' },
    productFallbackEmoji: '🍣',
  },
  acai: {
    label: 'Açaí',
    emoji: '🫐',
    builder: makeBuilder({
      title: 'Monte seu Açaí', subtitle: 'Escolha seus toppings', emoji: '🫐', route: '/app/pizza',
      steps: ['Tamanho', 'Complementos', 'Extras'],
      step1Heading: 'Monte seu Açaí', step1Subtitle: 'Escolha o tamanho', emptyTitle: 'Nenhum tamanho disponível', emptyDesc: 'Configure os tamanhos no painel administrativo.', itemUnit: 'complemento',
      step2Heading: '', step2Subtitle: (max) => `Selecione até ${max} ${max === 1 ? 'complemento' : 'complementos'}`, searchPlaceholder: 'Pesquisar complemento', selectedUnit: 'complemento',
      step3Heading: 'Extras e observações', cartLabel: 'Açaí', cartPrefix: 'Açaí',
      adminPageTitle: 'Açaí Builder', adminSidebarLabel: 'Açaí Builder', adminIconName: 'Cherry',
      adminNavTabs: ['Configurações', 'Tamanhos', 'Complementos', 'Preços', 'Extras'],
      adminDemoDesc: 'Crie dados de exemplo para testar o Açaí Builder',
      sizeForm: { dialogTitle: 'Novo tamanho', dialogTitleEdit: 'Editar tamanho', namePlaceholder: 'Ex: Açaí 500ml', slicesLabel: 'Porções', maxFlavorsLabel: 'Máx complementos', newButton: 'Novo tamanho' },
    }),
    sections: { featured: '🔥 Mais Pedidos', promos: '💸 Promoções', beverages: '🥤 Bebidas', allProducts: '🫐 Todos os Açaís' },
    productFallbackEmoji: '🫐',
  },
  bebidas: {
    label: 'Distribuidora', emoji: '🍺', builder: null,
    sections: { featured: '🔥 Mais Vendidos', promos: '💸 Promoções', beverages: '🍺 Destilados', allProducts: '🛒 Todos os Produtos' },
    productFallbackEmoji: '🍺',
  },
  padaria: {
    label: 'Padaria', emoji: '🥐', builder: null,
    sections: { featured: '🔥 Mais Vendidos', promos: '💸 Promoções', beverages: '☕ Bebidas', allProducts: '🥐 Todos os Produtos' },
    productFallbackEmoji: '🥐',
  },
  marmitaria: {
    label: 'Marmitaria',
    emoji: '🍱',
    builder: makeBuilder({
      title: 'Monte sua Marmita', subtitle: 'Escolha cada item', emoji: '🍱', route: '/app/pizza',
      steps: ['Base', 'Proteína', 'Acompanhamentos'],
      step1Heading: 'Monte sua Marmita', step1Subtitle: 'Escolha a base', emptyTitle: 'Nenhuma opção disponível', emptyDesc: 'Configure as opções no painel administrativo.', itemUnit: 'proteína',
      step2Heading: '', step2Subtitle: (max) => `Selecione até ${max} ${max === 1 ? 'proteína' : 'proteínas'}`, searchPlaceholder: 'Pesquisar proteína', selectedUnit: 'proteína',
      step3Heading: 'Acompanhamentos e observações', cartLabel: 'Marmita', cartPrefix: 'Marmita',
      adminPageTitle: 'Marmita Builder', adminSidebarLabel: 'Marmita Builder', adminIconName: 'Soup',
      adminNavTabs: ['Configurações', 'Bases', 'Proteínas', 'Preços', 'Acompanhamentos'],
      adminDemoDesc: 'Crie dados de exemplo para testar o Marmita Builder',
      sizeForm: { dialogTitle: 'Nova base', dialogTitleEdit: 'Editar base', namePlaceholder: 'Ex: Marmita Grande', slicesLabel: 'Porções', maxFlavorsLabel: 'Máx proteínas', newButton: 'Nova base' },
    }),
    sections: { featured: '🔥 Mais Pedidos', promos: '💸 Promoções', beverages: '🥤 Bebidas', allProducts: '🍱 Todas as Marmitas' },
    productFallbackEmoji: '🍱',
  },
  outro: {
    label: 'Restaurante', emoji: '🍽️', builder: null,
    sections: { featured: '🔥 Mais Vendidos', promos: '💸 Promoções', beverages: '🥤 Bebidas', allProducts: '🍽️ Todo o Cardápio' },
    productFallbackEmoji: '🍽️',
  },
};

const DEFAULT_CONFIG = STORE_TYPE_CONFIGS.pizzaria;

export function getStoreTypeConfig(storeType: string | null | undefined): StoreTypeConfig {
  if (!storeType) return DEFAULT_CONFIG;
  return STORE_TYPE_CONFIGS[storeType] || DEFAULT_CONFIG;
}
