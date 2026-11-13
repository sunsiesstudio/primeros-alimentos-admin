# Admin de Primeros Alimentos

Web interna en admin.primerosalimentos.com: uso de la app, datos anónimos de qué comen los bebés para ideas de redes y lista del blog para revisar.

- Entra con Google. Solo las cuentas que permiten las reglas de Firestore pueden leer los datos.
- Todo se calcula en el navegador al abrirla (plan gratuito de Firebase: cada visita lee una vez cada cuenta).
- `blog.json` se genera desde el repo de la web con `python3 build_blog.py ../primerosalimentos-web`.
