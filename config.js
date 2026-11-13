window.SITE = {
  nome: "LEDS BAHIA",

  whatsapp: {
    numero: "5573981425744", // só dígitos: DDI + DDD + número
    mensagem: "Olá! Conheci a LEDS BAHIA e gostaria de saber como anunciar minha empresa nos painéis de LED.",
  },

  contato: {
    email: "alandersonas@gmail.com",
    // Opcional: chave do Web3Forms (https://web3forms.com). Se vazio, usa FormSubmit.
    web3formsChave: "",
    assunto: "Novo pedido de orçamento pelo site LEDS BAHIA",
  },

  // Planos: valores editáveis. destaque:true marca o plano em evidência.
  // contagemDe: número de onde o preço começa a descer (animação) até chegar ao valor real.
  planos: [
    { nome: "Plano 1 tela", paineis: 1, preco: 300, contagemDe: 900, destaque: false },
    { nome: "Plano 2 telas", paineis: 2, preco: 500, contagemDe: 1200, destaque: true },
    { nome: "Plano 3 telas", paineis: 3, preco: 700, contagemDe: 1500, destaque: false },
  ],
  exibicoesPorDia: 720,

  frames: {
    total: 140, // frames fatiados do vídeo (desktop 1600px · celular recorte central 880×720)
    desktop: "assets/frames/desktop/f_{n}.webp",
    mobile: "assets/frames/mobile/f_{n}.webp",
  },
};
