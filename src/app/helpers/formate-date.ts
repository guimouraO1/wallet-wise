export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short'
    }).format(date);
}