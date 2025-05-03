import { LanguageService } from '../services/language.service';
import { DateTime } from 'luxon';
import { TIMEZONE } from './timezone';

export function formatDate(date: Date, languageService: LanguageService): string {
    const language = languageService.getLanguage() === 'pt-br' ? 'pt-BR' : 'en';
    const dateTime = DateTime.fromJSDate(date).setLocale(language).setZone(TIMEZONE);
    return dateTime.toLocaleString(DateTime.DATETIME_MED);
}
