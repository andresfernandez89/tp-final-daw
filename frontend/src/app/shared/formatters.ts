/** Formateador de moneda en pesos argentinos sin decimales (`$ 15.000`). */
const formatoValor = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/**
 * Formatea un importe como moneda argentina sin decimales.
 *
 * @param amount Importe en pesos.
 * @returns El importe formateado, por ejemplo `$ 15.000`.
 */
export function formatearValor(amount: number): string {
  return formatoValor.format(amount);
}
