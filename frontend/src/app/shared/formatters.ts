const formatoValor = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export function formatearValor(amount: number): string {
  return formatoValor.format(amount);
}
