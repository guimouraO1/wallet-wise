import { LanguageService } from '../services/language.service';

export function formatDate(date: Date, languageService: LanguageService): string {
    const language =  languageService.getLanguage() === 'pt-br' ? 'pt-BR' : 'en';
    return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}