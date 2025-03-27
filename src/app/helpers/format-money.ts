
export function formatMoneyToString(balance: number) {
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(balance));
    return balance < 0 ? formatted.replace('R$', 'R$ -') : formatted;
}