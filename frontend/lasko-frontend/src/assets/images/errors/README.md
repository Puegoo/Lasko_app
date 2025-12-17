# Grafiki błędów

## Lokalizacja plików graficznych

W tym katalogu należy umieścić grafiki błędów w formacie PNG:

- **404.png** - Grafika dla strony "Strona nie znaleziona"
- **500.png** - Grafika dla strony "Błąd serwera"  
- **503.png** - Grafika dla strony "Serwis niedostępny"

## Wymagania

- Format: PNG
- Rozmiar: Zalecane 600x400px lub podobne proporcje
- Style: Powinny pasować do designu aplikacji (ciemne tło, zielone akcenty)
- Zawartość: Grafika reprezentująca odpowiedni kod błędu

## Użycie

Grafiki są automatycznie ładowane w komponentach:
- `src/components/ErrorPages/Error404Page.jsx`
- `src/components/ErrorPages/Error500Page.jsx`
- `src/components/ErrorPages/Error503Page.jsx`

Jeśli grafika nie zostanie znaleziona, komponent automatycznie ją ukryje i wyświetli tylko tekst.

