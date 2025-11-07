// Este patch "ensina" o JSON.stringify a converter BigInt para string.
// Importe este arquivo uma vez em seu layout.tsx ou em um arquivo global.
// Para este exemplo, vou importá-lo em cada 'route.ts' para garantir.

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};