'use client';
import {useEffect} from 'react';import {languages,languageNames,blogPath} from '../lib/journal-copy.js';
export default function JournalLanguage({language,slug=''}){useEffect(()=>{document.documentElement.lang=language;try{localStorage.setItem('sumatra-language',language);}catch{}},[language]);return <select aria-label="Language" value={language} onChange={e=>location.assign(blogPath(e.target.value,slug))}>{languages.map(lang=><option key={lang} value={lang}>{lang.toUpperCase()} · {languageNames[lang]}</option>)}</select>;}
